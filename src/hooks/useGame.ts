import { useReducer, useState, useEffect } from "react";

import type { CombatResult, Direction, LogEntry, } from "../types";
import { ITEMS, WORLD, DIRECTIONS } from "../data/gameData";
import useSoundFx from "./useSoundFx";
import { gameReducer } from "../reducers/gameReducer";

export const useGame = () => {
  const [gameState, dispatch] = useReducer(gameReducer, {
    currentRoomId: "start",
    inventory: {
      items: [null, null, null, null]
    },
    equippedItems: {
      weapon: null,
      armor: null
    },
    visitedRooms: ["start"],
    health: 100,
    maxHealth: 100,
    flags: {},
    lastMoveDirection: "north",
    rooms: WORLD,
    questLog: [
      { id: 0, type: "room-title", text: WORLD["start"].name },
      { id: 1, type: "room-description", text: WORLD["start"].description },
    ],
    feedback: null,
    isNarratorVisible: true,
    combat: null,
    attack: 5,
    defense: 0
  });

  const [hasInspected, setHasInspected] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState<Direction | null>(null);
  const [walkStepScale, setWalkStepScale] = useState(1);
  const [isEnemyRevealed, setIsEnemyRevealed] = useState(true);

  useEffect(() => {
    if (!gameState.feedback) return;

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, 3000);

    return () => clearTimeout(timer);
  }, [gameState.feedback]);

  const { playAmbientLoop, playShuffleSound, playItemSound, playSoundFile } = useSoundFx();

  useEffect(() => {
    const room = gameState.rooms[gameState.currentRoomId];
    playAmbientLoop(room.audioLoop || null)
  }, [gameState.currentRoomId, gameState.rooms, playAmbientLoop]);

  const currentRoom = gameState.rooms[gameState.currentRoomId];

  const hasItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) return true;
    if (gameState.equippedItems.armor === itemId) return true;
    return gameState.inventory.items.includes(itemId);
  };
  const addToLog = (text: string, type: LogEntry["type"] = "system") => {
    dispatch({ type: "ADD_LOG", message: text, logType: type });
  };

  const executeMove = (direction: Direction) => {
    const room = gameState.rooms[gameState.currentRoomId];
    const nextRoomId = room.exits[direction];

    if (!nextRoomId) {
      addToLog("You can't go that way.", "system");
      return;
    }

    if (room.lockedExits && room.lockedExits[direction]) {
      dispatch({ type: "MOVE", direction, nextRoomId: gameState.currentRoomId });
      addToLog(room.lockedExits[direction].lockedMessage, "warning");
      setIsWalking(false);
      setWalkingDirection(null);
      return;
    }

    dispatch({ type: "MOVE", direction, nextRoomId });

    setHasInspected(false);
    const nextRoom = gameState.rooms[nextRoomId];

    const isRevisit = gameState.visitedRooms.includes(nextRoomId);

    if (nextRoom.enemy) {
      setIsEnemyRevealed(isRevisit);
    }

    setTimeout(() => {
      addToLog(nextRoom.name, "room-title");
      addToLog(nextRoom.description, "room-description");

      if (nextRoom.enemy) {
        const enemyName = nextRoom.enemy.name;
        if (isRevisit) {
          addToLog(`A ${enemyName} blocks your path!`, "danger");
        } else {
          const delay = nextRoom.description.length * 10 + 500;
          setTimeout(() => {
            addToLog(`A ${enemyName} blocks your path!`, "danger");
            setIsEnemyRevealed(true);
            dispatch({ type: "SET_NARRATOR_VISIBLE", visible: false });
          }, delay);
        }
      }
    }, 600);

    setIsWalking(false);
    setWalkingDirection(null);
  };

  const handleMove = (direction: Direction) => {
    if (!DIRECTIONS.includes(direction)) {
      addToLog("Go where?", "system");
      return;
    }

    const currentRoom = gameState.rooms[gameState.currentRoomId];
    const isFleeing = !!currentRoom.enemy;
    const isLocked = currentRoom.lockedExits && currentRoom.lockedExits[direction];
    const hasExit = !!currentRoom.exits[direction];

    if (!hasExit && !isLocked) {
      addToLog("You can't go that way.", "system");
      return;
    }

    if (!isLocked) {
      dispatch({ type: "SET_QUEST_LOG", log: [] });
    }

    setIsWalking(true);
    setWalkingDirection(direction);

    const textRenderDelay = 0;

    let stepCount = 4;
    if (isFleeing) stepCount = 8;
    if (isLocked) stepCount = 2;

    const stepInterval = isFleeing ? 100 : 200;
    const startDelay = (isFleeing ? 150 : 300) + textRenderDelay;

    for (let i = 0; i < stepCount; i++) {
      setTimeout(() => {
        setWalkStepScale(i % 2 === 0 ? -1 : 1);
        playShuffleSound();
      }, startDelay + (i * stepInterval));
    }

    setTimeout(() => {
      setWalkStepScale(1);
      executeMove(direction);
    }, startDelay + (stepCount * stepInterval));
  };

  const inspectRoom = () => {
    const room = gameState.rooms[gameState.currentRoomId];
    setHasInspected(true);
    let desc = "You scan the area.";
    if (room.items.length > 0) {
      const itemNames = room.items.map(id => ITEMS[id].name).join(", ");
      desc += ` You see: ${itemNames}.`;
    } else {
      desc += " You don't see anything useful here.";
    }

    if (room.enemy) {
      desc += ` WARNING: A ${room.enemy.name} is here!`;
    }
    addToLog(desc, "info");
  };

  const takeItem = (itemId: string) => {
    const room = gameState.rooms[gameState.currentRoomId];
    if (room.enemy) {
      addToLog(`The ${room.enemy.name} guards the room! Defeat it first.`, "danger");
      return;
    }

    const item = ITEMS[itemId];
    const emptySlotIndex = gameState.inventory.items.findIndex(slot => slot === null);

    let autoEquip = false;
    if (item.type === "weapon" && !gameState.equippedItems.weapon) autoEquip = true;
    if (item.type === "armor" && !gameState.equippedItems.armor) autoEquip = true;

    if (emptySlotIndex === -1 && !autoEquip) {
      addToLog("Your inventory is full!", "danger");
      return;
    }

    if (item.sounds?.take) {
      playSoundFile(item.sounds.take);
    } else if (item.type === "weapon") {
      playSoundFile("sword-take.wav");
    } else {
      playItemSound();
    }

    let logMessage = "";
    if (autoEquip) {
      logMessage = `Taken: ${item.name} (Equipped)`;
    } else {
      logMessage = `Taken: ${item.name}`;
    }

    dispatch({ type: "TAKE_ITEM", itemId: item.id, autoEquip, logMessage });
  };

  const dropItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) {
      dispatch({ type: "DROP_ITEM", itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
    } else if (gameState.equippedItems.armor === itemId) {
      dispatch({ type: "DROP_ITEM", itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
    } else {
      const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);
      if (itemIndex !== -1) {
        dispatch({ type: "DROP_ITEM", itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
      }
    }
  };

  const equipItem = (itemId: string) => {
    const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);

    if (itemIndex === -1) {
      addToLog("You don't have that.", "system");
      return;
    }

    const item = ITEMS[itemId];

    let equipMessage = "";
    if (item.type === "weapon") {
      equipMessage = `You wield the ${item.name}.`;
    } else if (item.type === "armor") {
      equipMessage = `You equip the ${item.name}.`;
    }

    dispatch({ type: "EQUIP_ITEM", itemId, logMessage: equipMessage });
  };

  const startCombat = () => {
    dispatch({ type: "START_COMBAT" });
  };

  const handleCombatAction = (action: "ATTACK" | "BLOCK" | "IDLE") => {
    if (!gameState.combat || gameState.combat.isProcessing) return;

    dispatch({ type: "SET_COMBAT_PROCESSING", processing: true });

    const room = gameState.rooms[gameState.currentRoomId];
    if (!room.enemy) return;

    const enemy = room.enemy;
    const moves = ["ATTACK", "ATTACK", "ATTACK", "BLOCK", "IDLE"];
    const enemyAction = moves[Math.floor(Math.random() * moves.length)] as "ATTACK" | "BLOCK" | "IDLE";

    dispatch({ type: "SET_ENEMY_ACTION", action: enemyAction });

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

    const playerWeaponId = gameState.equippedItems.weapon;
    const playerWeapon = playerWeaponId ? ITEMS[playerWeaponId] : null;

    if (pMove === "ATTACK") {
      switch (eMove) {
        case "IDLE":
          enemyDamageTaken = pAtk;
          logMsg = `CRIT! You hit for ${enemyDamageTaken} damage!`;
          logType = "success";
          combatResult = { type: "crit", message: logMsg };

          if (playerWeapon?.sounds?.crit) {
            playSoundFile(playerWeapon.sounds.crit);
          } else {
            playSoundFile("sword-combat-attack.wav");
          }
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

          if (playerWeapon?.sounds?.block) {
            playSoundFile(playerWeapon.sounds.block);
          } else {
            playItemSound();
          }
          break;

        case "ATTACK": {
          const pClashDmg = Math.floor(eAtk * 0.5);
          const eClashDmg = Math.floor(pAtk * 0.5);

          playerDamageTaken = pClashDmg;
          enemyDamageTaken = eClashDmg;

          logMsg = "CLASH! Weapons collide!";
          logType = "clash";
          combatResult = { type: "clash", message: logMsg };

          if (playerWeapon?.sounds?.clash) {
            playSoundFile(playerWeapon.sounds.clash);
          } else {
            playSoundFile("sword-combat-attack.wav");
          }
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
          playSoundFile(playerWeapon.sounds.block);
        } else {
          playItemSound();
        }

      } else {
        logMsg = "Both hesitated...";
        logType = "miss";
        combatResult = { type: "miss", message: logMsg };
      }
    }

    dispatch({ type: "ADD_LOG", message: logMsg, logType });
    if (combatResult) {
      dispatch({ type: "SET_COMBAT_RESULT", result: combatResult });
    }

    if (enemyDamageTaken > 0 || playerDamageTaken > 0) {
      const currentEnemyHp = enemy.hp - enemyDamageTaken;

      if (currentEnemyHp <= 0) {
        const dropId = enemy.drop;
        dispatch({ type: "SET_ENEMY_ACTION", action: "DEFEAT" });
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

    setTimeout(() => {
      dispatch({ type: "COMBAT_ROUND_END" });
    }, 2000);
  };

  const useItem = (itemId: string) => {
    const room = gameState.rooms[gameState.currentRoomId];

    const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);
    if (itemIndex === -1) {
      addToLog("You don't have that.", "system");
      return;
    }

    const item = ITEMS[itemId];

    if (item.type === "consumable" && item.effect) {
      dispatch({
        type: "USE_CONSUMABLE",
        itemId,
        effect: item.effect,
        logMessage: `You used ${item.name}.`
      });
      return;
    }
    if (item.type === "key") {
      const facingDirection = gameState.lastMoveDirection;
      const lockedExit = room.lockedExits?.[facingDirection];

      if (lockedExit) {
        if (lockedExit.keyId === item.id) {
          dispatch({ type: "UNLOCK_DOOR", direction: facingDirection, keyId: item.id, logMessage: `Unlocked ${facingDirection} door with ${item.name}.` });
        } else {
          addToLog("That key doesn't fit this door.", "system");
        }
      } else {
        addToLog("You must face a locked door to use a key.", "system");
      }
      return;
    }
    if (["weapon", "armor"].includes(item.type)) {
      equipItem(itemId);
      return;
    }
  };

  return {
    gameState,
    questLog: gameState.questLog,
    hasInspected,
    viewingItemId,
    setViewingItemId,
    isWalking,
    walkingDirection,
    walkStepScale,
    isEnemyRevealed,
    attackPower: gameState.attack,
    defensePower: gameState.defense,
    currentRoom,
    hasItem,
    handleMove,
    inspectRoom,

    takeItem,
    dropItem,
    equipItem,
    startCombat,
    handleCombatAction,
    useItem,
    feedback: gameState.feedback || { message: null, type: null, id: 0 },
    setNarratorVisible: (visible: boolean) => dispatch({ type: "SET_NARRATOR_VISIBLE", visible })
  };
};
