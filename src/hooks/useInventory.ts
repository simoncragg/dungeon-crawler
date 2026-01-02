import React, { useCallback } from "react";
import type { GameState, LogEntry, GameAction, Direction, SoundAsset, Item, Hotspot } from "../types";
import { ITEMS } from "../data/gameData";

interface UseInventoryProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  addToLog: (text: string, type?: LogEntry["type"]) => void;
  playSoundFile: (file: string | SoundAsset, volume?: number) => void;
  playItemSound: () => void;
  startTransition: (video: string | SoundAsset, nextRoomId?: string, onComplete?: () => void, onMidpoint?: () => void) => void;
  triggerShutter: () => void;
}

export const useInventory = ({ gameState, dispatch, addToLog, playSoundFile, playItemSound, startTransition, triggerShutter }: UseInventoryProps) => {

  const hasItem = (itemId: string) => {
    if (gameState.equippedItems.weapon === itemId) return true;
    if (gameState.equippedItems.armor === itemId) return true;
    return gameState.inventory.items.includes(itemId);
  };

  const performUnlock = useCallback((item: Item, direction: Direction, logMessage: string, suppressHighlight: boolean) => {
    if (item.sounds?.use) {
      playSoundFile(item.sounds.use);
    }
    dispatch({
      type: "UNLOCK_DOOR",
      direction,
      keyId: item.id,
      logMessage,
      suppressHighlight
    });
  }, [dispatch, playSoundFile]);

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

  const handleUseItem = (itemId: string, targetDirection?: Direction) => {
    const room = gameState.rooms[gameState.currentRoomId];

    const itemIndex = gameState.inventory.items.findIndex(id => id === itemId);
    if (itemIndex === -1) {
      addToLog("You don't have that.", "system");
      return;
    }

    const item = ITEMS[itemId];
    const useVideo = item.useVideos?.[gameState.currentRoomId];

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
      if (room.lockedExits) {
        const matchingDirection = targetDirection || (Object.keys(room.lockedExits) as Direction[]).find(
          dir => room.lockedExits![dir]?.keyId === item.id
        );

        if (matchingDirection) {
          const lockedExit = room.lockedExits[matchingDirection];

          if (lockedExit?.keyId === item.id) {
            const unlockMessage = lockedExit.unlockMessage || `Unlocked the way to the ${matchingDirection} with ${item.name}.`;

            if (useVideo) {
              triggerShutter();
              startTransition(useVideo, undefined, undefined, () => performUnlock(item, matchingDirection, unlockMessage, true));
            } else {
              performUnlock(item, matchingDirection, unlockMessage, false);
            }
            return;
          } else if (targetDirection) {
            addToLog(`The ${item.name} doesn't seem to fit the ${targetDirection} exit.`, "system");
            return;
          }
        }
      }
      addToLog(`The ${item.name} doesn't seem to fit any doors here.`, "system");
      return;
    }
    if (["weapon", "armor"].includes(item.type)) {
      equipItem(itemId);
      return;
    }
  };


  const handleDropOnHotspot = (e: React.DragEvent, hotspot: Hotspot) => {
    const itemId = e.dataTransfer.getData("application/x-dungeon-item-id");

    if (itemId && hotspot.type === "door") {
      handleUseItem(itemId, hotspot.direction as Direction);
    }
  };

  const reorderInventory = (fromIndex: number, toIndex: number) => {
    dispatch({ type: "REORDER_INVENTORY", fromIndex, toIndex });
  };

  const equipFromInventory = (inventoryIndex: number, slotType: "weapon" | "armor") => {
    const itemId = gameState.inventory.items[inventoryIndex];
    if (itemId) {
      const item = ITEMS[itemId];
      playSoundFile(item.sounds?.take ?? "equip.mp3");
    }
    dispatch({ type: "EQUIP_ITEM", inventoryIndex, slotType });
  };

  const unequipToInventory = (slotType: "weapon" | "armor", inventoryIndex: number) => {
    const itemId = gameState.equippedItems[slotType];
    if (itemId) {
      const item = ITEMS[itemId];
      playSoundFile(item.sounds?.unequip ?? "unequip.mp3");
    }
    dispatch({ type: "UNEQUIP_ITEM", slotType, inventoryIndex });
  };

  return {
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    handleUseItem,
    hasItem,
    handleDropOnHotspot,
    reorderInventory,
    equipFromInventory,
    unequipToInventory
  };
};
