import type { GameState, GameAction, LogEntry, Feedback, CombatAction } from "../types";
import { ITEMS } from "../data/gameData";

const getStats = (equipped: { weapon: string | null; armor: string | null }) => {
  const attack = 5 + (equipped.weapon ? (ITEMS[equipped.weapon].stats?.attack || 0) : 0);
  const defense = 0 + (equipped.armor ? (ITEMS[equipped.armor].stats?.defense || 0) : 0);
  return { attack, defense };
};

export const getEnemyImage = (enemyId: string, action: CombatAction = "IDLE") => {
  return `/images/enemies/${enemyId}-${action.toLowerCase()}.png`;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {

  const addLog = (currentLog: LogEntry[], message: string, type: LogEntry["type"] = "system"): LogEntry[] => {
    return [...currentLog, { id: Date.now() + Math.random(), text: message, type }];
  };

  const getFeedback = (message: string, type: LogEntry["type"] = "system"): Feedback | null => {
    if (type === "room-title" || type === "room-description") return null;
    if (type === "system" && message.length > 50) return null;
    return { message, type, id: Date.now() };
  };

  switch (action.type) {
    case "MOVE": {
      const { nextRoomId, direction } = action;
      return {
        ...state,
        currentRoomId: nextRoomId,
        visitedRooms: Array.from(new Set([...state.visitedRooms, nextRoomId])),
        lastMoveDirection: direction,
        feedback: null,
        isNarratorVisible: !state.visitedRooms.includes(nextRoomId)
      };
    }

    case "SET_NARRATOR_VISIBLE": {
      return {
        ...state,
        isNarratorVisible: action.visible
      };
    }

    case "TAKE_ITEM": {
      const { itemId, logMessage } = action;
      const item = ITEMS[itemId];
      const currentRoom = state.rooms[state.currentRoomId];

      const newInventory = {
        ...state.inventory,
        items: [...state.inventory.items]
      };
      const newEquippedItems = { ...state.equippedItems };
      const newRooms = { ...state.rooms };

      newRooms[state.currentRoomId] = {
        ...currentRoom,
        items: currentRoom.items.filter(id => id !== itemId)
      };

      if (item.type === "weapon" && !newEquippedItems.weapon) {
        newEquippedItems.weapon = itemId;
      } else if (item.type === "armor" && !newEquippedItems.armor) {
        newEquippedItems.armor = itemId;
      } else {
        const slotIdx = newInventory.items.findIndex(s => s === null);
        if (slotIdx !== -1) {
          newInventory.items[slotIdx] = itemId;
        }
      }

      const { attack, defense } = getStats(newEquippedItems);

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
        rooms: newRooms,
        attack,
        defense,
        questLog: addLog(state.questLog, logMessage, "info"),
        feedback: getFeedback(logMessage, "info")
      };
    }

    case "DROP_ITEM": {
      const { itemId, logMessage } = action;
      const currentRoom = state.rooms[state.currentRoomId];
      const newInventory = { ...state.inventory };
      const newEquippedItems = { ...state.equippedItems };
      const newRooms = { ...state.rooms };

      newRooms[state.currentRoomId] = {
        ...currentRoom,
        items: [...currentRoom.items, itemId]
      };

      if (newEquippedItems.weapon === itemId) {
        newEquippedItems.weapon = null;
      } else if (newEquippedItems.armor === itemId) {
        newEquippedItems.armor = null;
      } else {
        const itemIndex = newInventory.items.indexOf(itemId);
        if (itemIndex !== -1) {
          newInventory.items[itemIndex] = null;
        }
      }

      const { attack, defense } = getStats(newEquippedItems);

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
        rooms: newRooms,
        attack,
        defense,
        questLog: addLog(state.questLog, logMessage, "info"),
        feedback: getFeedback(logMessage, "info")
      };
    }

    case "EQUIP_ITEM": {
      const { itemId, logMessage } = action;
      const item = ITEMS[itemId];
      const newInventory = { ...state.inventory };
      const newEquippedItems = { ...state.equippedItems };

      const itemIndex = newInventory.items.indexOf(itemId);

      if (item.type === "weapon") {
        const current = newEquippedItems.weapon;
        newEquippedItems.weapon = itemId;
        newInventory.items[itemIndex] = current;
      } else if (item.type === "armor") {
        const current = newEquippedItems.armor;
        newEquippedItems.armor = itemId;
        newInventory.items[itemIndex] = current;
      }

      const { attack, defense } = getStats(newEquippedItems);

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
        attack,
        defense,
        questLog: addLog(state.questLog, logMessage, "success"),
        feedback: getFeedback(logMessage, "success")
      };
    }

    case "USE_CONSUMABLE": {
      const { itemId, effect, logMessage } = action;
      const newInventory = { ...state.inventory };
      const itemIndex = newInventory.items.indexOf(itemId);

      if (itemIndex !== -1) {
        newInventory.items[itemIndex] = null;
      }

      const stateUpdates = effect(state);

      return {
        ...state,
        ...stateUpdates,
        inventory: newInventory,
        questLog: addLog(state.questLog, logMessage, "success"),
        feedback: getFeedback(logMessage, "success")
      };
    }

    case "UNLOCK_DOOR": {
      const { direction, logMessage } = action;
      const newRooms = { ...state.rooms };
      const currentRoom = newRooms[state.currentRoomId];

      if (currentRoom.lockedExits) {
        const lockedExit = currentRoom.lockedExits[direction];
        const newLockedExits = { ...currentRoom.lockedExits };
        delete newLockedExits[direction];

        let newImage = currentRoom.image;
        if (lockedExit?.unlockImage) {
          newImage = lockedExit.unlockImage;
        }

        newRooms[state.currentRoomId] = {
          ...currentRoom,
          lockedExits: newLockedExits,
          image: newImage
        };
      }

      return {
        ...state,
        rooms: newRooms,
        questLog: addLog(state.questLog, logMessage, "success"),
        feedback: getFeedback(logMessage, "success")
      };
    }

    case "START_COMBAT": {

      const enemy = state.rooms[state.currentRoomId]?.enemy;
      if (!enemy) return state;

      return {
        ...state,
        combat: {
          inCombat: true,
          round: 1,
          isProcessing: false,
          enemyAction: "IDLE",
          enemyId: enemy.id,
          enemyImage: getEnemyImage(enemy.id, "IDLE"),
          lastResult: null
        }
      };
    }

    case "SET_COMBAT_PROCESSING": {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          isProcessing: action.processing
        }
      };
    }

    case "SET_ENEMY_ACTION": {
      if (!state.combat) return state;
      const newAction = action.action;
      const newImage = newAction === "DEFEAT"
        ? getEnemyImage(state.combat.enemyId, "DAMAGE")
        : getEnemyImage(state.combat.enemyId, newAction);

      return {
        ...state,
        combat: {
          ...state.combat,
          enemyAction: newAction,
          enemyImage: newImage
        }
      };
    }

    case "SET_COMBAT_RESULT": {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          lastResult: action.result
        }
      };
    }

    case "COMBAT_ROUND": {
      const { damageDealt, damageTaken, logMessage, playerDied } = action;
      const newRooms = { ...state.rooms };
      const currentRoom = newRooms[state.currentRoomId];

      let newLog = state.questLog;
      if (logMessage) {
        newLog = addLog(state.questLog, logMessage, "combat");
      }

      if (currentRoom.enemy) {
        newRooms[state.currentRoomId] = {
          ...currentRoom,
          enemy: {
            ...currentRoom.enemy,
            hp: Math.max(0, currentRoom.enemy.hp - damageDealt)
          }
        };
      }

      const newHealth = Math.max(0, state.health - damageTaken);

      if (playerDied) {
        newLog = addLog(newLog, "*** YOU HAVE DIED ***", "danger");
      }

      let feedback = state.feedback;
      if (damageTaken > 0) {
        feedback = getFeedback(logMessage, "damage");
      }

      let enemyAction = state.combat?.enemyAction || "IDLE";
      let enemyImage = state.combat?.enemyImage || "";

      if (state.combat && damageDealt > 0 && enemyAction === "IDLE") {
        enemyAction = "DAMAGE";
        enemyImage = getEnemyImage(state.combat.enemyId, "DAMAGE");
      } else if (state.combat) {
        enemyImage = getEnemyImage(state.combat.enemyId, enemyAction);
      }

      return {
        ...state,
        health: newHealth,
        rooms: newRooms,
        questLog: newLog,
        feedback,
        combat: state.combat ? {
          ...state.combat,
          enemyAction,
          enemyImage
        } : null
      };
    }

    case "COMBAT_ROUND_END": {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          round: state.combat.round + 1,
          isProcessing: false,
          enemyAction: "IDLE",
          enemyImage: getEnemyImage(state.combat.enemyId, "IDLE"),
          lastResult: null
        }
      };
    }

    case "ENEMY_DEFEAT": {
      const { dropId, logMessage, damageDealt, enemyName } = action;
      const newRooms = { ...state.rooms };
      const currentRoom = newRooms[state.currentRoomId];

      const newRoom = { ...currentRoom };
      delete newRoom.enemy;

      if (dropId) {
        newRoom.items = [...newRoom.items, dropId];
      }

      newRooms[state.currentRoomId] = newRoom;

      let newLog = addLog(state.questLog, `You hit ${enemyName} for ${damageDealt} DMG.`, "success");
      newLog = addLog(newLog, logMessage, "success");

      return {
        ...state,
        rooms: newRooms,
        questLog: newLog,
        feedback: getFeedback(logMessage, "success"),
        combat: null
      };
    }

    case "ADD_LOG": {
      return {
        ...state,
        questLog: addLog(state.questLog, action.message, action.logType),
        feedback: getFeedback(action.message, action.logType)
      };
    }

    case "SET_QUEST_LOG": {
      return {
        ...state,
        questLog: action.log
      };
    }

    case "CLEAR_FEEDBACK": {
      return {
        ...state,
        feedback: null
      };
    }

    default:
      return state;
  }
};
