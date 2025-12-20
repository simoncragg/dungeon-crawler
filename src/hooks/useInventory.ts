import React from "react";
import type { GameState, LogEntry, GameAction } from "../types";
import { ITEMS } from "../data/gameData";

interface UseInventoryProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  addToLog: (text: string, type?: LogEntry["type"]) => void;
  playSoundFile: (file: string) => void;
  playItemSound: () => void;
}

export const useInventory = ({ gameState, dispatch, addToLog, playSoundFile, playItemSound }: UseInventoryProps) => {
  const hasItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) return true;
    if (gameState.equippedItems.armor === itemId) return true;
    return gameState.inventory.items.includes(itemId);
  };

  const equipItem = (itemId: string) => {
    const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);

    if (itemIndex === -1) {
      addToLog("You don't have that.", "system");
      return;
    }

    const item = ITEMS[itemId];
    playSoundFile(item.sounds?.take ?? "equip.mp3");
    dispatch({ type: "EQUIP_ITEM", itemId, logMessage: `You equip the ${item.name}.` });
  };

  const unequipItem = (itemId: string) => {
    const emptySlotIndex = gameState.inventory.items.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
      addToLog("Inventory full! Cannot unequip.", "danger");
      return;
    }
    const item = ITEMS[itemId];
    playSoundFile(item.sounds?.unequip ?? "unequip.mp3");
    dispatch({ type: "UNEQUIP_ITEM", itemId, logMessage: `Unequipped ${item.name}.` });
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

    if (!autoEquip && emptySlotIndex === -1) {
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
    let willSwap = false;
    if (item.type === "weapon" && gameState.equippedItems.weapon) willSwap = true;
    if (item.type === "armor" && gameState.equippedItems.armor) willSwap = true;

    if (autoEquip || willSwap) {
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
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    useItem,
    hasItem
  };
};
