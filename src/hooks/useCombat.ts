import React, { useRef } from "react";
import type { GameState, CombatResult, LogEntry } from "../types";
import { ITEMS } from "../data/gameData";

interface UseCombatProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>;
  playSoundFile: (file: string, volume?: number) => (() => void) | void;
}

export const useCombat = ({ gameState, dispatch, playSoundFile }: UseCombatProps) => {
  const stopBattleMusicRef = useRef<(() => void) | null>(null);

  const startCombat = () => {
    if (stopBattleMusicRef.current) stopBattleMusicRef.current();
    stopBattleMusicRef.current = playSoundFile("battle-music.mp3", 0.3) || null;
    dispatch({ type: "START_COMBAT" });
  };

  const handleCombatAction = (action: "ATTACK" | "BLOCK" | "IDLE") => {
    if (!gameState.combat || gameState.combat.isProcessing) return;

    const playerWeaponId = gameState.equippedItems.weapon;
    const playerWeapon = playerWeaponId ? ITEMS[playerWeaponId] : null;

    if (action === "ATTACK" || action === "BLOCK") {
      playSoundFile(playerWeapon?.sounds?.windup ?? "sword-combat-windup.mp3");
    }

    dispatch({ type: "SET_COMBAT_PROCESSING", processing: true, playerAction: action });

    const room = gameState.rooms[gameState.currentRoomId];
    if (!room.enemy) return;

    const enemy = room.enemy;
    const moves = ["ATTACK", "ATTACK", "ATTACK", "BLOCK", "IDLE"];
    const enemyAction = moves[Math.floor(Math.random() * moves.length)] as "ATTACK" | "BLOCK" | "IDLE";

    const pMove = action;
    const eMove = enemyAction;

    const pAtk = gameState.attack;
    const pDef = gameState.defense;
    const eAtk = room.enemy.attack || 10;
    const eDef = room.enemy.defense || 5;

    let logMsg = "";
    let playerDamageTaken = 0;
    let enemyDamageTaken = 0;
    let logType: LogEntry["type"] = "combat";
    let combatResult: CombatResult | null = null;

    let soundToPlay = "";

    if (pMove === "ATTACK") {
      switch (eMove) {
        case "IDLE":
          enemyDamageTaken = pAtk;
          logMsg = `CRIT! You hit for ${enemyDamageTaken} damage!`;
          logType = "success";
          combatResult = { type: "crit", message: logMsg };
          soundToPlay = playerWeapon?.sounds?.crit ?? "sword-combat-crit.wav";
          break;

        case "BLOCK":
          enemyDamageTaken = Math.max(0, pAtk - eDef);
          if (enemyDamageTaken > 0) {
            logMsg = `Blocked! You hit for ${enemyDamageTaken} damage.`;
            logType = "info";
          } else {
            logMsg = "Blocked! No damage.";
            logType = "info";
          }
          combatResult = { type: "block", message: logMsg };
          soundToPlay = playerWeapon?.sounds?.block ?? "item-equipped.wav";
          break;

        case "ATTACK": {
          const pClashDmg = Math.floor(eAtk * 0.5);
          const eClashDmg = Math.floor(pAtk * 0.5);

          playerDamageTaken = pClashDmg;
          enemyDamageTaken = eClashDmg;

          logMsg = "CLASH! Weapons collide!";
          logType = "clash";
          combatResult = { type: "clash", message: logMsg };

          soundToPlay = playerWeapon?.sounds?.clash || "sword-combat-clash.mp3";
          break;
        }
      }
    } else if (pMove === "BLOCK") {
      if (eMove === "ATTACK") {
        const mitigatedDmg = Math.floor(eAtk * 0.5);
        playerDamageTaken = Math.max(0, mitigatedDmg - pDef);

        if (playerDamageTaken > 0) {
          logMsg = `Blocked! Took ${playerDamageTaken} damage.`;
          logType = "warning";
        } else {
          logMsg = "Perfect Block!";
          logType = "success";
        }
        combatResult = { type: "block", message: logMsg };

        if (playerWeapon?.sounds?.block) {
          soundToPlay = playerWeapon.sounds.block;
        } else {
          soundToPlay = "item-equipped.wav";
        }

      } else {
        logMsg = "Both hesitated...";
        logType = "miss";
        combatResult = { type: "miss", message: logMsg };
      }
    }

    setTimeout(() => {
      dispatch({ type: "SET_ENEMY_ACTION", action: enemyAction });
      playSoundFile(playerWeapon?.sounds?.attack ?? "sword-combat-attack.mp3");
      if (soundToPlay) playSoundFile(soundToPlay);

      dispatch({ type: "ADD_LOG", message: logMsg, logType });
      if (combatResult) {
        dispatch({ type: "SET_COMBAT_RESULT", result: combatResult });
      }

      if (enemyDamageTaken > 0 || playerDamageTaken > 0) {
        const currentEnemyHp = enemy.hp - enemyDamageTaken;

        if (currentEnemyHp <= 0) {
          if (stopBattleMusicRef.current) {
            stopBattleMusicRef.current();
            stopBattleMusicRef.current = null;
          }

          setTimeout(() => {
            playSoundFile("enemy-defeat.mp3");
          }, 500);

          dispatch({ type: "SET_ENEMY_ACTION", action: "DEFEAT" });

          const dropId = enemy.drop;
          setTimeout(() => {
            dispatch({ type: "ENEMY_DEFEAT", enemyName: enemy.name, dropId, logMessage: enemy.defeatMessage, damageDealt: enemyDamageTaken });
          }, 1500);
        } else {
          const playerDied = gameState.health - playerDamageTaken <= 0;
          dispatch({
            type: "COMBAT_ROUND",
            damageDealt: enemyDamageTaken,
            damageTaken: playerDamageTaken,
            enemyName: enemy.name,
            logMessage: logMsg,
            playerDied
          });
        }
      }
    }, 500);

    setTimeout(() => {
      dispatch({ type: "COMBAT_ROUND_END" });
    }, 2000);
  };

  return {
    startCombat,
    handleCombatAction
  };
};
