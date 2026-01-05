import { create } from "zustand";
import { ITEMS } from "../data/gameData";
import type {
    GameState,
    LogEntry,
    PlayerCombatAction,
    CombatAction,
    CombatResult,
    Direction,
    Feedback,
    SoundAsset
} from "../types";
import { INITIAL_STATE } from "../data/initialState";
import { getStats, getEnemyImage } from "../utils/gameUtils";

const addLog = (currentLog: LogEntry[], message: string, type: LogEntry["type"] = "system"): LogEntry[] => {
    return [...currentLog, { id: Date.now() + Math.random(), text: message, type }];
};

const getFeedback = (message: string, type: LogEntry["type"] = "system"): Feedback | null => {
    if (type === "room-title" || type === "room-description" || type === "narration") return null;
    return { message, type, id: Date.now() + Math.random() };
};

interface GameStore {
    gameState: GameState;
    actions: {
        // Native Zustand Actions for Inventory
        takeItem: (itemId: string, autoEquip: boolean, logMessage: string) => void;
        dropItem: (itemId: string, logMessage: string) => void;
        equipItem: (itemId: string | undefined, inventoryIndex: number | undefined, slotType: "weapon" | "armor" | undefined, logMessage?: string) => void;
        unequipItem: (itemId: string | undefined, slotType: "weapon" | "armor" | undefined, inventoryIndex: number | undefined, logMessage?: string) => void;
        reorderInventory: (fromIndex: number, toIndex: number) => void;
        consumeItem: (itemId: string) => void;
        useConsumable: (itemId: string, effect: (state: GameState) => Partial<GameState>, logMessage: string) => void;

        // Movement Actions
        move: (nextRoomId: string) => void;
        updateMapPosition: (roomId: string) => void;

        // Combat Actions
        startCombat: () => void;
        setCombatProcessing: (processing: boolean, playerAction?: PlayerCombatAction) => void;
        setEnemyAction: (action: CombatAction) => void;
        setCombatResult: (result: CombatResult) => void;
        combatRound: (params: { damageDealt: number; damageTaken: number; enemyName: string; logMessage: string; playerDied: boolean }) => void;
        combatRoundEnd: () => void;
        setCombatRiposte: (canRiposte: boolean) => void;
        enemyDefeat: (params: { enemyName: string; dropId: string | undefined; logMessages: string[]; feedbackMessage?: string; damageDealt: number }) => void;

        // UI Actions
        setQuestLogOpen: (open: boolean) => void;
        addLog: (message: string, logType?: LogEntry["type"]) => void;
        clearFeedback: () => void;
        setEnemyRevealed: (revealed: boolean) => void;
        setHasInspected: (inspected: boolean) => void;
        clearDropAnimation: () => void;
        clearUnlockHighlight: () => void;
        setQuestLog: (log: LogEntry[]) => void;
        setRoomAudio: (roomId: string, audioLoop: SoundAsset | undefined) => void;
        setDropAnimating: (itemId: string) => void;

        // Exploration
        unlockDoor: (direction: Direction) => void;
    };
}

export const useGameStore = create<GameStore>((set) => ({
    gameState: INITIAL_STATE,

    actions: {
        addLog: (message, logType = "system") => set((state) => ({
            gameState: {
                ...state.gameState,
                questLog: addLog(state.gameState.questLog, message, logType),
                feedback: getFeedback(message, logType)
            }
        })),

        setQuestLogOpen: (open) => set((state) => ({
            gameState: { ...state.gameState, isQuestLogOpen: open }
        })),

        clearFeedback: () => set((state) => ({
            gameState: { ...state.gameState, feedback: null }
        })),

        setEnemyRevealed: (revealed) => set((state) => ({
            gameState: { ...state.gameState, isEnemyRevealed: revealed }
        })),

        setHasInspected: (inspected) => set((state) => ({
            gameState: { ...state.gameState, hasInspected: inspected }
        })),

        clearDropAnimation: () => set((state) => ({
            gameState: { ...state.gameState, isDropAnimating: false }
        })),

        clearUnlockHighlight: () => set((state) => ({
            gameState: { ...state.gameState, unlockedDirection: null }
        })),

        setQuestLog: (log) => set((state) => ({
            gameState: { ...state.gameState, questLog: log }
        })),

        setRoomAudio: (roomId, audioLoop) => set((state) => {
            const newRooms = { ...state.gameState.rooms };
            newRooms[roomId] = {
                ...newRooms[roomId],
                audioLoop: audioLoop || undefined
            };
            return {
                gameState: {
                    ...state.gameState,
                    rooms: newRooms
                }
            };
        }),

        setDropAnimating: (itemId) => set((state) => ({
            gameState: {
                ...state.gameState,
                recentDropId: itemId,
                isDropAnimating: true
            }
        })),

        unlockDoor: (direction) => set((state) => {
            const newRooms = { ...state.gameState.rooms };
            const currentRoom = newRooms[state.gameState.currentRoomId];

            if (currentRoom.lockedExits) {
                const lockedExit = currentRoom.lockedExits[direction];
                const newLockedExits = { ...currentRoom.lockedExits };
                delete newLockedExits[direction];

                let newImage = currentRoom.image;
                let newVideoLoop: SoundAsset | undefined = currentRoom.videoLoop;

                if (lockedExit?.unlockImage) {
                    newImage = lockedExit.unlockImage;
                    if (!lockedExit.unlockVideoLoop) {
                        newVideoLoop = undefined;
                    }
                }

                if (lockedExit?.unlockVideoLoop) {
                    newVideoLoop = lockedExit.unlockVideoLoop;
                }

                newRooms[state.gameState.currentRoomId] = {
                    ...currentRoom,
                    lockedExits: newLockedExits,
                    image: newImage,
                    videoLoop: newVideoLoop,
                    audioLoop: lockedExit?.unlockAudioLoop || currentRoom.audioLoop
                };
            }

            return {
                gameState: {
                    ...state.gameState,
                    rooms: newRooms,
                    unlockedDirection: direction
                }
            };
        }),

        move: (nextRoomId) => set((state) => ({
            gameState: {
                ...state.gameState,
                currentRoomId: nextRoomId,
                mapOverrideRoomId: undefined,
                visitedRooms: Array.from(new Set([...state.gameState.visitedRooms, nextRoomId])),
                feedback: null,
                hasInspected: false,
                isEnemyRevealed: false,
                recentDropId: null,
                isDropAnimating: false,
                isFirstVisit: !state.gameState.visitedRooms.includes(nextRoomId)
            }
        })),

        updateMapPosition: (roomId) => set((state) => ({
            gameState: {
                ...state.gameState,
                mapOverrideRoomId: roomId
            }
        })),

        startCombat: () => set((state) => {
            const enemy = state.gameState.rooms[state.gameState.currentRoomId]?.enemy;
            if (!enemy) return state;

            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        inCombat: true,
                        round: 1,
                        isProcessing: false,
                        enemyAction: "IDLE",
                        enemyId: enemy.id,
                        enemyImage: getEnemyImage(enemy.id, "IDLE"),
                        lastResult: null
                    }
                }
            };
        }),

        setCombatProcessing: (processing, playerAction) => set((state) => {
            if (!state.gameState.combat) return state;
            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        ...state.gameState.combat,
                        isProcessing: processing,
                        playerAction: playerAction
                    }
                }
            };
        }),

        setEnemyAction: (action) => set((state) => {
            if (!state.gameState.combat) return state;
            const newImage = action === "DEFEAT"
                ? getEnemyImage(state.gameState.combat.enemyId, "DAMAGE")
                : getEnemyImage(state.gameState.combat.enemyId, action);

            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        ...state.gameState.combat,
                        enemyAction: action,
                        enemyImage: newImage
                    }
                }
            };
        }),

        setCombatResult: (result) => set((state) => {
            if (!state.gameState.combat) return state;
            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        ...state.gameState.combat,
                        lastResult: result
                    }
                }
            };
        }),

        combatRound: (params) => set((state) => {
            const { damageDealt, damageTaken, logMessage, playerDied } = params;
            const newRooms = { ...state.gameState.rooms };
            const currentRoom = newRooms[state.gameState.currentRoomId];

            let newLog = state.gameState.questLog;
            if (logMessage) {
                newLog = addLog(state.gameState.questLog, logMessage, "combat");
            }

            if (currentRoom.enemy) {
                newRooms[state.gameState.currentRoomId] = {
                    ...currentRoom,
                    enemy: {
                        ...currentRoom.enemy,
                        hp: Math.max(0, currentRoom.enemy.hp - damageDealt)
                    }
                };
            }

            const newHealth = Math.max(0, state.gameState.health - damageTaken);
            let questLog = newLog;
            if (playerDied) {
                questLog = addLog(newLog, "*** YOU HAVE DIED ***", "danger");
            }

            let feedback = state.gameState.feedback;
            if (damageTaken > 0) {
                feedback = getFeedback(logMessage, "damage");
            }

            let enemyAction = state.gameState.combat?.enemyAction || "IDLE";
            let enemyImage = state.gameState.combat?.enemyImage || "";

            if (state.gameState.combat && damageDealt > 0 && (enemyAction === "IDLE" || enemyAction === "STAGGER")) {
                enemyAction = "DAMAGE";
                enemyImage = getEnemyImage(state.gameState.combat.enemyId, "DAMAGE");
            } else if (state.gameState.combat) {
                enemyImage = getEnemyImage(state.gameState.combat.enemyId, enemyAction);
            }

            return {
                gameState: {
                    ...state.gameState,
                    health: newHealth,
                    rooms: newRooms,
                    questLog,
                    feedback,
                    combat: state.gameState.combat ? {
                        ...state.gameState.combat,
                        enemyAction,
                        enemyImage
                    } : null
                }
            };
        }),

        combatRoundEnd: () => set((state) => {
            if (!state.gameState.combat) return state;
            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        ...state.gameState.combat,
                        round: state.gameState.combat.round + 1,
                        isProcessing: false,
                        playerAction: undefined,
                        enemyAction: "IDLE",
                        enemyImage: getEnemyImage(state.gameState.combat.enemyId, "IDLE"),
                        lastResult: null,
                        canRiposte: false
                    }
                }
            };
        }),

        setCombatRiposte: (canRiposte) => set((state) => {
            if (!state.gameState.combat) return state;
            return {
                gameState: {
                    ...state.gameState,
                    combat: {
                        ...state.gameState.combat,
                        canRiposte: canRiposte
                    }
                }
            };
        }),

        enemyDefeat: (params) => set((state) => {
            const { dropId, logMessages, feedbackMessage } = params;
            const newRooms = { ...state.gameState.rooms };
            const currentRoom = newRooms[state.gameState.currentRoomId];

            const newRoom = { ...currentRoom };
            delete newRoom.enemy;

            if (dropId) {
                newRoom.items = [...newRoom.items, dropId];
            }

            newRooms[state.gameState.currentRoomId] = newRoom;

            let newLog = state.gameState.questLog;
            logMessages.forEach(msg => {
                newLog = addLog(newLog, msg, "success");
            });

            return {
                gameState: {
                    ...state.gameState,
                    rooms: newRooms,
                    questLog: newLog,
                    feedback: getFeedback(feedbackMessage || logMessages[0], "success"),
                    combat: null,
                    latestDrop: dropId ? { itemId: dropId, timestamp: Date.now() } : null,
                    recentDropId: dropId || null,
                    isDropAnimating: !!dropId,
                    hasInspected: !!dropId
                }
            };
        }),

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
                    feedback: getFeedback(logMessage, "info")
                }
            };
        }),

        dropItem: (itemId, logMessage) => set((state) => {
            const currentRoom = state.gameState.rooms[state.gameState.currentRoomId];
            const newInventory = {
                ...state.gameState.inventory,
                items: [...state.gameState.inventory.items]
            };
            const newEquippedItems = { ...state.gameState.equippedItems };
            const newRooms = { ...state.gameState.rooms };

            newRooms[state.gameState.currentRoomId] = {
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

        equipItem: (itemId, inventoryIndex, slotType: "weapon" | "armor" | undefined, logMessage) => set((state) => {
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

        unequipItem: (itemId, slotType: "weapon" | "armor" | undefined, inventoryIndex, logMessage) => set((state) => {
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
    }
}));
