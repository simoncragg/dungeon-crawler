import type { StateCreator } from "zustand";
import type { GameStore } from "../storeTypes";
import { ITEMS } from "../../data/gameData";
import { getStats } from "../../utils/gameUtils";
import { addLog, getFeedback } from "../utils";

export type InventorySlice = Pick<GameStore["actions"],
    | "takeItem"
    | "dropItem"
    | "equipItem"
    | "unequipItem"
    | "reorderInventory"
    | "consumeItem"
    | "useConsumable"
    | "clearDropAnimation"
    | "setDropAnimating"
>;

export const createInventorySlice: StateCreator<GameStore, [], [], InventorySlice> = (set) => ({
    takeItem: (itemId, _autoEquip, logMessage) => set((state) => {
        const item = ITEMS[itemId];
        const currentRoom = state.gameState.rooms[state.gameState.currentRoomId];

        const newInventory = {
            ...state.gameState.inventory,
            items: [...state.gameState.inventory.items]
        };
        const newEquippedItems = { ...state.gameState.equippedItems };
        const newRooms = { ...state.gameState.rooms };

        newRooms[state.gameState.currentRoomId] = {
            ...currentRoom,
            items: currentRoom.items.filter(id => id !== itemId)
        };

        let taken = false;

        if (item.type === "weapon") {
            if (!newEquippedItems.weapon) {
                newEquippedItems.weapon = itemId;
                taken = true;
            } else {
                const slotIdx = newInventory.items.findIndex(s => s === null);
                if (slotIdx !== -1) {
                    newInventory.items[slotIdx] = newEquippedItems.weapon;
                    newEquippedItems.weapon = itemId;
                    taken = true;
                } else {
                    return {
                        gameState: {
                            ...state.gameState,
                            questLog: addLog(state.gameState.questLog, "Inventory full! Cannot swap weapon.", "danger"),
                            feedback: getFeedback("Inventory full!", "danger")
                        }
                    };
                }
            }
        } else if (item.type === "armor") {
            if (!newEquippedItems.armor) {
                newEquippedItems.armor = itemId;
                taken = true;
            } else {
                const slotIdx = newInventory.items.findIndex(s => s === null);
                if (slotIdx !== -1) {
                    newInventory.items[slotIdx] = newEquippedItems.armor;
                    newEquippedItems.armor = itemId;
                    taken = true;
                } else {
                    return {
                        gameState: {
                            ...state.gameState,
                            questLog: addLog(state.gameState.questLog, "Inventory full! Cannot swap armor.", "danger"),
                            feedback: getFeedback("Inventory full!", "danger")
                        }
                    };
                }
            }
        }

        if (!taken) {
            const slotIdx = newInventory.items.findIndex(s => s === null);
            if (slotIdx !== -1) {
                newInventory.items[slotIdx] = itemId;
            } else {
                return {
                    gameState: {
                        ...state.gameState,
                        questLog: addLog(state.gameState.questLog, "Inventory full!", "danger"),
                        feedback: getFeedback("Inventory full!", "danger")
                    }
                };
            }
        }

        const { attack, defense } = getStats(newEquippedItems);

        return {
            gameState: {
                ...state.gameState,
                inventory: newInventory,
                equippedItems: newEquippedItems,
                rooms: newRooms,
                attack,
                defense,
                questLog: addLog(state.gameState.questLog, logMessage, "info"),
                feedback: getFeedback(logMessage, "info"),
                recentDropId: itemId,
                isDropAnimating: false
            }
        };
    }),

    dropItem: (itemId, logMessage) => set((state) => {
        const newRooms = { ...state.gameState.rooms };
        const currentRoom = newRooms[state.gameState.currentRoomId];
        const newInventory = {
            ...state.gameState.inventory,
            items: state.gameState.inventory.items.map(id => id === itemId ? null : id)
        };

        newRooms[state.gameState.currentRoomId] = {
            ...currentRoom,
            items: [...currentRoom.items, itemId]
        };

        return {
            gameState: {
                ...state.gameState,
                inventory: newInventory,
                rooms: newRooms,
                questLog: addLog(state.gameState.questLog, logMessage, "info"),
                feedback: getFeedback(logMessage, "info")
            }
        };
    }),

    equipItem: (itemId, inventoryIndex, slotType, logMessage) => set((state) => {
        const newInventory = { ...state.gameState.inventory, items: [...state.gameState.inventory.items] };
        const newEquippedItems = { ...state.gameState.equippedItems };

        let targetIndex = inventoryIndex;
        if (targetIndex === undefined && itemId) {
            targetIndex = newInventory.items.indexOf(itemId);
        }

        if (targetIndex === undefined || targetIndex === -1) return state;
        const activeItemId = newInventory.items[targetIndex];
        if (!activeItemId) return state;

        const item = ITEMS[activeItemId];
        const resolvedSlotType = slotType || (item.type as "weapon" | "armor");
        if (resolvedSlotType !== "weapon" && resolvedSlotType !== "armor") return state;
        if (item.type !== resolvedSlotType) return state;

        const current = newEquippedItems[resolvedSlotType];
        newEquippedItems[resolvedSlotType] = activeItemId;
        newInventory.items[targetIndex] = current;

        const { attack, defense } = getStats(newEquippedItems);
        const msg = logMessage || `Equipped ${item.name}.`;

        return {
            gameState: {
                ...state.gameState,
                inventory: newInventory,
                equippedItems: newEquippedItems,
                attack,
                defense,
                questLog: addLog(state.gameState.questLog, msg, "success"),
                feedback: getFeedback(msg, "success")
            }
        };
    }),

    unequipItem: (itemId, slotType, inventoryIndex, logMessage) => set((state) => {
        const newInventory = { ...state.gameState.inventory, items: [...state.gameState.inventory.items] };
        const newEquippedItems = { ...state.gameState.equippedItems };

        let resolvedSlotType = slotType;
        if (!resolvedSlotType && itemId) {
            if (newEquippedItems.weapon === itemId) resolvedSlotType = "weapon";
            else if (newEquippedItems.armor === itemId) resolvedSlotType = "armor";
        }

        if (!resolvedSlotType) return state;
        const itemToUnequipId = newEquippedItems[resolvedSlotType];
        if (!itemToUnequipId) return state;

        let targetIndex = inventoryIndex;
        if (targetIndex === undefined) {
            targetIndex = newInventory.items.findIndex(s => s === null);
        }

        if (targetIndex === undefined || targetIndex === -1) {
            return {
                gameState: {
                    ...state.gameState,
                    questLog: addLog(state.gameState.questLog, "Inventory full! Cannot unequip.", "danger"),
                    feedback: getFeedback("Inventory Full!", "danger")
                }
            };
        }

        const inventorySlotId = newInventory.items[targetIndex];
        const inventoryItem = inventorySlotId ? ITEMS[inventorySlotId] : null;

        if (inventoryItem && inventoryItem.type === resolvedSlotType) {
            newEquippedItems[resolvedSlotType] = inventorySlotId;
            newInventory.items[targetIndex] = itemToUnequipId;
        } else if (!inventorySlotId) {
            newEquippedItems[resolvedSlotType] = null;
            newInventory.items[targetIndex] = itemToUnequipId;
        } else {
            return state;
        }

        const { attack, defense } = getStats(newEquippedItems);
        const msg = logMessage || `Unequipped ${ITEMS[itemToUnequipId].name}.`;

        return {
            gameState: {
                ...state.gameState,
                inventory: newInventory,
                equippedItems: newEquippedItems,
                attack,
                defense,
                questLog: addLog(state.gameState.questLog, msg, "info"),
                feedback: getFeedback(msg, "info")
            }
        };
    }),

    reorderInventory: (fromIndex, toIndex) => set((state) => {
        const newItems = [...state.gameState.inventory.items];
        const itemToMove = newItems[fromIndex];
        newItems[fromIndex] = newItems[toIndex];
        newItems[toIndex] = itemToMove;

        return {
            gameState: {
                ...state.gameState,
                inventory: {
                    ...state.gameState.inventory,
                    items: newItems
                }
            }
        };
    }),

    consumeItem: (itemId) => set((state) => ({
        gameState: {
            ...state.gameState,
            inventory: {
                ...state.gameState.inventory,
                items: state.gameState.inventory.items.map(id => id === itemId ? null : id)
            }
        }
    })),

    useConsumable: (itemId, effect, logMessage) => set((state) => {
        const newInventory = {
            ...state.gameState.inventory,
            items: [...state.gameState.inventory.items]
        };
        const itemIndex = newInventory.items.indexOf(itemId);

        if (itemIndex !== -1) {
            newInventory.items[itemIndex] = null;
        }

        const stateUpdates = effect(state.gameState);

        return {
            gameState: {
                ...state.gameState,
                ...stateUpdates,
                inventory: newInventory,
                questLog: addLog(state.gameState.questLog, logMessage, "success"),
                feedback: getFeedback(logMessage, "success")
            }
        };
    }),

    clearDropAnimation: () => set((state) => ({
        gameState: { ...state.gameState, isDropAnimating: false }
    })),

    setDropAnimating: (itemId) => set((state) => ({
        gameState: {
            ...state.gameState,
            recentDropId: itemId,
            isDropAnimating: true
        }
    })),
});
