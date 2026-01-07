import React, { useRef } from "react";
import type { CombatAction, EquippedWeapon, PlayerCombatAction } from "../types";
import { ITEMS } from "../data/gameData";
import useSoundFx from "./useSoundFx";
import { useGameStore } from "../store/useGameStore";
import {
  isWindupAction,
  getEnemyAction,
  getLungeDelay,
  isSuccessfulParry,
  resolveCombatTurn
} from "../utils/combatUtils";
import { COMBAT_SETTINGS } from "../data/constants";

export const useCombat = () => {
  const {
    gameState,
    actions
  } = useGameStore();

  const { playSoundFile } = useSoundFx();
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
    stopBattleMusicRef.current = playSoundFile({ path: "battle-music.mp3" }, { volume: COMBAT_SETTINGS.BATTLE_MUSIC_VOLUME }) || null;
  }, [playSoundFile]);

  const stopBattleMusic = React.useCallback(() => {
    if (stopBattleMusicRef.current) {
      stopBattleMusicRef.current();
      stopBattleMusicRef.current = null;
    }
  }, []);

  const startCombat = React.useCallback(() => {
    playBattleMusic();
    actions.startCombat();
  }, [playBattleMusic, actions]);

  const isReadyForCombatInput = React.useCallback(() => {
    return !!gameState.combat && !gameState.combat.isProcessing;
  }, [gameState.combat]);

  const triggerEnemyResponse = React.useCallback((action: CombatAction, playerAction: string, successfulParry: boolean) => {
    const delay = getLungeDelay(playerAction, successfulParry);
    if (delay > 0) {
      setTimeout(() => {
        actions.setEnemyAction(action);
      }, delay);
    } else {
      actions.setEnemyAction(action);
    }
  }, [actions]);

  const handleCombatAction = React.useCallback((playerAction: PlayerCombatAction) => {
    if (!isReadyForCombatInput()) return;

    const playerWeaponId = gameState.equippedItems.weapon;
    const playerWeapon = playerWeaponId ? (ITEMS[playerWeaponId] as EquippedWeapon) : null;

    clearCombatTimers();

    if (isWindupAction(playerAction)) {
      playSoundFile(playerWeapon?.sounds?.windup ?? { path: "sword-combat-windup.mp3" });
    }

    actions.setCombatProcessing(true, playerAction);

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
    const resultDelay = playerAction === "RIPOSTE" ? COMBAT_SETTINGS.RESULT_DELAY_RIPOSTE :
      (playerAction === "ATTACK" || playerAction === "BLOCK" || (playerAction === "IDLE" && outcome.playerDamageTaken > 0)) ? COMBAT_SETTINGS.RESULT_DELAY_STANDARD : COMBAT_SETTINGS.RESULT_DELAY_IDLE;

    if (hitDelay >= 0) {
      setTimeout(() => {
        if (outcome.soundToPlay) {
          playSoundFile(outcome.soundToPlay);
        }
      }, hitDelay);
    }

    setTimeout(() => {
      actions.setEnemyAction(outcome.finalEnemyAction);

      actions.addLog(outcome.logMsg, outcome.logType);
      if (outcome.combatResult) {
        actions.setCombatResult(outcome.combatResult);
      }

      if (outcome.riposteAvailable) {
        actions.setCombatRiposte(true);
        actions.setCombatProcessing(false);
        return;
      }

      const { enemyDamageTaken, playerDamageTaken } = outcome;
      const currentEnemyHp = enemy.hp - enemyDamageTaken;

      if (enemyDamageTaken > 0 || playerDamageTaken > 0) {
        actions.combatRound({
          damageDealt: enemyDamageTaken,
          damageTaken: playerDamageTaken,
          enemyName: enemy.name,
          logMessage: outcome.logMsg,
          playerDied: gameState.health - playerDamageTaken <= 0
        });

        if (currentEnemyHp <= 0) {
          stopBattleMusic();
          setTimeout(() => playSoundFile({ path: "enemy-defeat.mp3" }), COMBAT_SETTINGS.DEFEAT_DELAY);
          actions.setEnemyAction("DEFEAT");
          setTimeout(() => {
            const dropItem = enemy.drop ? ITEMS[enemy.drop] : null;
            const dropMsg = dropItem ? `The ${enemy.name.toLowerCase()} dropped a ${dropItem.name.toLowerCase()}.` : "";
            const logMessages = [enemy.defeatMessage];
            if (dropMsg) {
              logMessages.push(dropMsg);
            }

            actions.enemyDefeat({
              enemyName: enemy.name,
              dropId: enemy.drop || undefined,
              logMessages,
              feedbackMessage: dropMsg || undefined,
              damageDealt: enemyDamageTaken
            });
          }, COMBAT_SETTINGS.ENEMY_DROP_DELAY);
        }
      }

      setTimeout(() => {
        actions.combatRoundEnd();
      }, COMBAT_SETTINGS.ROUND_END_DELAY);
    }, resultDelay);
  }, [gameState, playSoundFile, isReadyForCombatInput, stopBattleMusic, clearCombatTimers, triggerEnemyResponse, actions]);

  // Manage idle and telegraph timers via effects
  React.useEffect(() => {
    if (!gameState.combat || !gameState.combat.inCombat || gameState.combat.isProcessing) {
      clearCombatTimers();
      return;
    }

    const { enemyAction } = gameState.combat;

    if (enemyAction === "TELEGRAPH") {
      if (!telegraphTimerRef.current) {
        playSoundFile({ path: "swing.mp3" });
        telegraphTimerRef.current = setTimeout(() => {
          handleCombatAction("IDLE");
        }, COMBAT_SETTINGS.TELEGRAPH_DURATION);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    } else if (enemyAction === "IDLE") {
      if (!idleTimerRef.current) {
        const delay = Math.random() * (COMBAT_SETTINGS.IDLE_MAX - COMBAT_SETTINGS.IDLE_MIN) + COMBAT_SETTINGS.IDLE_MIN;
        idleTimerRef.current = setTimeout(() => {
          actions.setEnemyAction("TELEGRAPH");
        }, delay);
      }
    } else {
      clearCombatTimers();
    }

    return () => clearCombatTimers();
  }, [gameState.combat, handleCombatAction, clearCombatTimers, playSoundFile, actions]);

  return {
    startCombat,
    handleCombatAction
  };
};
