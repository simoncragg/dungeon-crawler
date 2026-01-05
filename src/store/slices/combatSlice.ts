import type { StateCreator } from "zustand";
import type { GameStore } from "../storeTypes";
import { getEnemyImage } from "../../utils/gameUtils";
import { addLog, getFeedback } from "../utils";

export type CombatSlice = Pick<GameStore["actions"],
    | "startCombat"
    | "setCombatProcessing"
    | "setEnemyAction"
    | "setCombatResult"
    | "combatRound"
    | "combatRoundEnd"
    | "setCombatRiposte"
    | "enemyDefeat"
    | "setEnemyRevealed"
>;

export const createCombatSlice: StateCreator<GameStore, [], [], CombatSlice> = (set) => ({
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

    setEnemyRevealed: (revealed) => set((state) => ({
        gameState: { ...state.gameState, isEnemyRevealed: revealed }
    })),
});
