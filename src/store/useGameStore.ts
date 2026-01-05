import { create } from "zustand";
import type {
    GameState,
    GameAction,
    LogEntry,
    PlayerCombatAction,
    CombatAction,
    CombatResult
} from "../types";
import { INITIAL_STATE } from "../data/initialState";
import { gameReducer } from "../reducers/gameReducer";

interface GameStore {
    gameState: GameState;
    actions: {
        // Legacy support for the reducer until we fully migrate
        dispatch: (action: GameAction) => void;

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
    };
}

export const useGameStore = create<GameStore>((set) => ({
    gameState: INITIAL_STATE,

    actions: {
        dispatch: (action) => set((state) => ({
            gameState: gameReducer(state.gameState, action)
        })),

        addLog: (message, logType = "system") => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "ADD_LOG", message, logType })
        })),

        setQuestLogOpen: (open) => set((state) => ({
            gameState: { ...state.gameState, isQuestLogOpen: open }
        })),

        clearFeedback: () => set((state) => ({
            gameState: { ...state.gameState, feedback: null }
        })),

        move: (nextRoomId) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "MOVE", nextRoomId })
        })),

        updateMapPosition: (roomId) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "UPDATE_MAP_POSITION", roomId })
        })),

        startCombat: () => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "START_COMBAT" })
        })),

        setCombatProcessing: (processing, playerAction) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "SET_COMBAT_PROCESSING", processing, playerAction })
        })),

        setEnemyAction: (action) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "SET_ENEMY_ACTION", action })
        })),

        setCombatResult: (result) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "SET_COMBAT_RESULT", result })
        })),

        combatRound: (params) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "COMBAT_ROUND", ...params })
        })),

        combatRoundEnd: () => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "COMBAT_ROUND_END" })
        })),

        setCombatRiposte: (canRiposte) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "SET_COMBAT_RIPOSTE", canRiposte })
        })),

        enemyDefeat: (params) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "ENEMY_DEFEAT", ...params })
        })),

        takeItem: (itemId, autoEquip, logMessage) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "TAKE_ITEM", itemId, autoEquip, logMessage })
        })),

        dropItem: (itemId, logMessage) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "DROP_ITEM", itemId, logMessage })
        })),

        equipItem: (itemId, inventoryIndex, slotType, logMessage) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "EQUIP_ITEM", itemId, inventoryIndex, slotType, logMessage })
        })),

        unequipItem: (itemId, slotType, inventoryIndex, logMessage) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "UNEQUIP_ITEM", itemId, slotType, inventoryIndex, logMessage })
        })),

        reorderInventory: (fromIndex, toIndex) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "REORDER_INVENTORY", fromIndex, toIndex })
        })),

        consumeItem: (itemId) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "CONSUME_ITEM", itemId })
        })),

        useConsumable: (itemId, effect, logMessage) => set((state) => ({
            gameState: gameReducer(state.gameState, { type: "USE_CONSUMABLE", itemId, effect, logMessage })
        })),
    }
}));
