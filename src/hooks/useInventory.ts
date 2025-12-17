import React from "react";
import type { GameState, LogEntry } from "../types";
import { ITEMS } from "../data/gameData";

interface UseInventoryProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>;
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
    // Check if we will auto-equip (when slot is empty)
    if (item.type === "weapon" && !gameState.equippedItems.weapon) autoEquip = true;
    if (item.type === "armor" && !gameState.equippedItems.armor) autoEquip = true;

    // We need a free slot if:
    // 1. We are NOT auto-equipping into an empty slot (so it goes to inventory)
    // 2. OR We ARE auto-equipping but will swap (so old item goes to inventory) -> The swap logic implies we are NOT auto-equipping into an *empty* slot, so logic holds.
    // Wait, if we swap, my variable `autoEquip` above is false.
    // So `needsSlot` logic:
    // If autoEquip is true, we don't need a slot.
    // If autoEquip is false, we need a slot (either for the new item, or for the old swapped item).

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
    // Note: The reducer handles the "Swap" log message logic implicitly or we can adjust here if we knew.
    // But since we dispatch TAKE_ITEM, the reducer does the work.
    // We just need to give a generic "Attempting to take" or let reducer log?
    // The reducer updates the log. But here we construct `logMessage` passed to action.
    // If we swap, it's nice to say "Equipped X".

    // We can predict if we will swap:
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
