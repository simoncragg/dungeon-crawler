import type { GameState, GameAction, LogEntry, Feedback } from "../types";
import { ITEMS } from "../data/gameData";

export const gameReducer = (state: GameState, action: GameAction): GameState => {

  const addLog = (currentLog: LogEntry[], message: string, type: LogEntry["type"] = "system"): LogEntry[] => {
    return [...currentLog, { id: Date.now() + Math.random(), text: message, type }];
  };

  const getFeedback = (message: string, type: LogEntry["type"] = "system"): Feedback | null => {
    if (type === 'room-title' || type === 'room-description') return null;
    if (type === 'system' && message.length > 50) return null;
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

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
        rooms: newRooms,
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

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
        rooms: newRooms,
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

      return {
        ...state,
        inventory: newInventory,
        equippedItems: newEquippedItems,
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

    case "COMBAT_ROUND": {
      const { damageDealt, damageTaken, enemyName, logMessage, playerDied } = action;
      const newRooms = { ...state.rooms };
      const currentRoom = newRooms[state.currentRoomId];

      let newLog = addLog(state.questLog, `You hit ${enemyName} for ${damageDealt} DMG.`, "success");

      if (currentRoom.enemy) {
        newRooms[state.currentRoomId] = {
          ...currentRoom,
          enemy: {
            ...currentRoom.enemy,
            hp: currentRoom.enemy.hp - damageDealt
          }
        };
      }

      const newHealth = Math.max(0, state.health - damageTaken);

      if (damageTaken > 0) {
        newLog = addLog(newLog, logMessage, "damage");
      }

      if (playerDied) {
        newLog = addLog(newLog, "*** YOU HAVE DIED ***", "danger");
      }

      let feedback = getFeedback(`You hit ${enemyName} for ${damageDealt} DMG.`, "success");
      if (damageTaken > 0) {
        feedback = getFeedback(logMessage, "damage");
      }
      if (playerDied) {
        feedback = getFeedback("*** YOU HAVE DIED ***", "danger");
      }

      return {
        ...state,
        health: newHealth,
        rooms: newRooms,
        questLog: newLog,
        feedback
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
        feedback: getFeedback(logMessage, "success")
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
