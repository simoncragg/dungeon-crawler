import React, { useRef } from "react";
import type { GameState, CombatAction, EquippedWeapon, PlayerCombatAction, GameAction, SoundAsset } from "../types";
import { ITEMS } from "../data/gameData";
import {
  isWindupAction,
  getEnemyAction,
  getLungeDelay,
  isSuccessfulParry,
  resolveCombatTurn
} from "../utils/combatUtils";

interface UseCombatProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  playSoundFile: (file: string | SoundAsset, volume?: number) => (() => void) | void;
}

export const useCombat = ({ gameState, dispatch, playSoundFile }: UseCombatProps) => {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telegraphTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopBattleMusicRef = useRef<(() => void) | null>(null);

  const clearCombatTimers = React.useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (telegraphTimerRef.current) clearTimeout(telegraphTimerRef.current);
    idleTimerRef.current = null;
    telegraphTimerRef.current = null;
  }, []);

  const playBattleMusic = React.useCallback(() => {
    if (stopBattleMusicRef.current) stopBattleMusicRef.current();
    stopBattleMusicRef.current = playSoundFile("battle-music.mp3", 0.3) || null;
  }, [playSoundFile]);

  const stopBattleMusic = React.useCallback(() => {
    if (stopBattleMusicRef.current) {
      stopBattleMusicRef.current();
      stopBattleMusicRef.current = null;
    }
  }, []);

  const startCombat = React.useCallback(() => {
    playBattleMusic();
    dispatch({ type: "START_COMBAT" });
  }, [playBattleMusic, dispatch]);

  const isReadyForCombatInput = React.useCallback(() => {
    return !!gameState.combat && !gameState.combat.isProcessing;
  }, [gameState.combat]);

  const triggerEnemyResponse = React.useCallback((action: CombatAction, playerAction: string, successfulParry: boolean) => {
    const delay = getLungeDelay(playerAction, successfulParry);
    if (delay > 0) {
      setTimeout(() => {
        dispatch({ type: "SET_ENEMY_ACTION", action });
      }, delay);
    } else {
      dispatch({ type: "SET_ENEMY_ACTION", action });
    }
  }, [dispatch]);

  const handleCombatAction = React.useCallback((playerAction: PlayerCombatAction) => {
    if (!isReadyForCombatInput()) return;

    const playerWeaponId = gameState.equippedItems.weapon;
    const playerWeapon = playerWeaponId ? (ITEMS[playerWeaponId] as EquippedWeapon) : null;

    clearCombatTimers();

    if (isWindupAction(playerAction)) {
      playSoundFile(playerWeapon?.sounds?.windup ?? "sword-combat-windup.mp3");
    }

    dispatch({ type: "SET_COMBAT_PROCESSING", processing: true, playerAction });

    const room = gameState.rooms[gameState.currentRoomId];
    if (!room.enemy) return;

    const enemy = room.enemy;
    const enemyAction = getEnemyAction(playerAction, gameState.combat?.enemyAction);

    const successfulParry = playerAction === "PARRY" && enemyAction === "ATTACK"
      ? isSuccessfulParry(playerWeapon, gameState)
      : false;

    triggerEnemyResponse(enemyAction, playerAction, successfulParry);

    const outcome = resolveCombatTurn({
      playerAction,
      enemyAction,
      gameState,
      playerWeapon,
      enemy: { hp: enemy.hp, attack: enemy.attack || 10, defense: enemy.defense || 5, name: enemy.name },
      successfulParry
    });

    const hitDelay = getLungeDelay(playerAction, successfulParry);
    const resultDelay = playerAction === "RIPOSTE" ? 200 :
      (playerAction === "ATTACK" || playerAction === "BLOCK" || (playerAction === "IDLE" && outcome.playerDamageTaken > 0)) ? 500 : 800;

    if (hitDelay >= 0) {
      setTimeout(() => {
        if (outcome.soundToPlay) {
          playSoundFile(outcome.soundToPlay);
        }
      }, hitDelay);
    }

    setTimeout(() => {
      dispatch({ type: "SET_ENEMY_ACTION", action: outcome.finalEnemyAction });

      dispatch({ type: "ADD_LOG", message: outcome.logMsg, logType: outcome.logType });
      if (outcome.combatResult) {
        dispatch({ type: "SET_COMBAT_RESULT", result: outcome.combatResult });
      }

      if (outcome.riposteAvailable) {
        dispatch({ type: "SET_COMBAT_RIPOSTE", canRiposte: true });
        dispatch({ type: "SET_COMBAT_PROCESSING", processing: false });
        return;
      }

      const { enemyDamageTaken, playerDamageTaken } = outcome;
      const currentEnemyHp = enemy.hp - enemyDamageTaken;

      if (enemyDamageTaken > 0 || playerDamageTaken > 0) {
        dispatch({
          type: "COMBAT_ROUND",
          damageDealt: enemyDamageTaken,
          damageTaken: playerDamageTaken,
          enemyName: enemy.name,
          logMessage: outcome.logMsg,
          playerDied: gameState.health - playerDamageTaken <= 0
        });

        if (currentEnemyHp <= 0) {
          stopBattleMusic();
          setTimeout(() => playSoundFile("enemy-defeat.mp3"), 500);
          dispatch({ type: "SET_ENEMY_ACTION", action: "DEFEAT" });
          setTimeout(() => {
            const dropItem = enemy.drop ? ITEMS[enemy.drop] : null;
            const dropMsg = dropItem ? `The ${enemy.name.toLowerCase()} dropped a ${dropItem.name.toLowerCase()}.` : "";
            const logMessages = [enemy.defeatMessage];
            if (dropMsg) {
              logMessages.push(dropMsg);
            }

            dispatch({
              type: "ENEMY_DEFEAT",
              enemyName: enemy.name,
              dropId: enemy.drop,
              logMessages,
              feedbackMessage: dropMsg || undefined,
              damageDealt: enemyDamageTaken
            });
          }, 1500);
        }
      }

      setTimeout(() => {
        dispatch({ type: "COMBAT_ROUND_END" });
      }, 2000);
    }, resultDelay);
  }, [gameState, dispatch, playSoundFile, isReadyForCombatInput, stopBattleMusic, clearCombatTimers, triggerEnemyResponse]);

  // Manage idle and telegraph timers via effects
  React.useEffect(() => {
    if (!gameState.combat || !gameState.combat.inCombat || gameState.combat.isProcessing) {
      clearCombatTimers();
      return;
    }

    const { enemyAction } = gameState.combat;

    if (enemyAction === "TELEGRAPH") {
      if (!telegraphTimerRef.current) {
        playSoundFile("swing.mp3");
        telegraphTimerRef.current = setTimeout(() => {
          handleCombatAction("IDLE");
        }, 600);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    } else if (enemyAction === "IDLE") {
      if (!idleTimerRef.current) {
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        idleTimerRef.current = setTimeout(() => {
          dispatch({ type: "SET_ENEMY_ACTION", action: "TELEGRAPH" });
        }, delay);
      }
    } else {
      clearCombatTimers();
    }

    return () => clearCombatTimers();
  }, [gameState.combat, dispatch, handleCombatAction, clearCombatTimers, playSoundFile]);

  return {
    startCombat,
    handleCombatAction
  };
};
