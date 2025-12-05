import { useReducer, useState, useEffect } from "react";
import type { LogEntry as LogEntryType, Direction } from "../types";
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
    isNarratorVisible: true
  });

  const [hasInspected, setHasInspected] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkStepScale, setWalkStepScale] = useState(1);
  const [isEnemyRevealed, setIsEnemyRevealed] = useState(true);

  const [walkingDirection, setWalkingDirection] = useState<Direction | null>(null);

  useEffect(() => {
    if (!gameState.feedback) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [gameState.feedback]);

  const { playAmbientLoop, playShuffleSound, playItemSound, playSwordSound } = useSoundFx();

  useEffect(() => {
    const room = gameState.rooms[gameState.currentRoomId];
    const timer = setTimeout(() => playAmbientLoop(room.audioLoop || null), 1000);
    return () => clearTimeout(timer);
  }, [gameState.currentRoomId, gameState.rooms]);

  const attackPower = 5 + (gameState.equippedItems.weapon ? (ITEMS[gameState.equippedItems.weapon].stats?.attack || 0) : 0);
  const defensePower = 0 + (gameState.equippedItems.armor ? (ITEMS[gameState.equippedItems.armor].stats?.defense || 0) : 0);
  const currentRoom = gameState.rooms[gameState.currentRoomId];

  const hasItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) return true;
    if (gameState.equippedItems.armor === itemId) return true;
    return gameState.inventory.items.includes(itemId);
  };

  const addToLog = (text: string, type: LogEntryType["type"] = "system") => {
    dispatch({ type: 'ADD_LOG', message: text, logType: type });
  };

  const executeMove = (direction: Direction) => {
    const room = gameState.rooms[gameState.currentRoomId];
    const nextRoomId = room.exits[direction];

    if (!nextRoomId) {
      addToLog("You can't go that way.", "system");
      return;
    }

    if (room.lockedExits && room.lockedExits[direction]) {
      dispatch({ type: 'MOVE', direction, nextRoomId: gameState.currentRoomId });
      addToLog(room.lockedExits[direction].lockedMessage, "warning");
      setIsWalking(false);
      setWalkingDirection(null);
      return;
    }

    dispatch({ type: 'MOVE', direction, nextRoomId });

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
            dispatch({ type: 'SET_NARRATOR_VISIBLE', visible: false });
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
      dispatch({ type: 'SET_QUEST_LOG', log: [] });
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

    if (item.type === "weapon") {
      playSwordSound();
    } else {
      playItemSound();
    }

    let logMessage = "";
    if (autoEquip) {
      logMessage = `Taken: ${item.name} (Equipped)`;
    } else {
      logMessage = `Taken: ${item.name}`;
    }

    dispatch({ type: 'TAKE_ITEM', itemId: item.id, autoEquip, logMessage });
  };

  const dropItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) {
      dispatch({ type: 'DROP_ITEM', itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
    } else if (gameState.equippedItems.armor === itemId) {
      dispatch({ type: 'DROP_ITEM', itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
    } else {
      const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);
      if (itemIndex !== -1) {
        dispatch({ type: 'DROP_ITEM', itemId, logMessage: `Dropped: ${ITEMS[itemId].name}` });
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

    dispatch({ type: 'EQUIP_ITEM', itemId, logMessage: equipMessage });
  };

  const attackEnemy = () => {
    const room = gameState.rooms[gameState.currentRoomId];
    if (!room.enemy) {
      addToLog("There is nothing here to fight.", "system");
      return;
    }

    const damageDealt = attackPower + Math.floor(Math.random() * 3);
    const incomingRaw = room.enemy.damage + Math.floor(Math.random() * 2);
    const damageTaken = Math.max(0, incomingRaw - defensePower);

    if (room.enemy.hp - damageDealt <= 0) {
      const defeatMessage = room.enemy.defeatMessage;
      const dropId = room.enemy.drop;

      dispatch({ type: 'ENEMY_DEFEAT', enemyName: room.enemy.name, dropId, logMessage: defeatMessage, damageDealt });

      if (dropId) {
        const delay = defeatMessage.length * 10 + 500;
        setTimeout(() => {
          addToLog(`Dropped: ${ITEMS[dropId].name}`, "info");
        }, delay);
      }

    } else {
      let logMessage = "";
      if (defensePower > 0) {
        logMessage = `${room.enemy.name} hits you: -${damageTaken} HP (Blocked ${defensePower})`;
      } else {
        logMessage = `${room.enemy.name} hits you: -${damageTaken} HP`;
      }

      const playerDied = gameState.health - damageTaken <= 0;

      dispatch({
        type: 'COMBAT_ROUND',
        damageDealt,
        damageTaken,
        enemyName: room.enemy.name,
        logMessage,
        playerDied
      });
    }
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
        type: 'USE_CONSUMABLE',
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
          dispatch({ type: 'UNLOCK_DOOR', direction: facingDirection, keyId: item.id, logMessage: `Unlocked ${facingDirection} door with ${item.name}.` });
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
    attackPower,
    defensePower,
    currentRoom,
    hasItem,
    handleMove,
    inspectRoom,

    takeItem,
    dropItem,
    equipItem,
    attackEnemy,
    useItem,
    feedback: gameState.feedback || { message: null, type: null, id: 0 },
    setNarratorVisible: (visible: boolean) => dispatch({ type: 'SET_NARRATOR_VISIBLE', visible })
  };
};
