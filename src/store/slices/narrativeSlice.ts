import type { StateCreator } from "zustand";
import type { GameStore } from "../storeTypes";
import { addLog, getFeedback } from "../utils";

export type NarrativeSlice = Pick<GameStore["actions"],
    | "setQuestLogOpen"
    | "addLog"
    | "clearFeedback"
    | "setQuestLog"
    | "setPerceivedRoomId"
>;

export const createNarrativeSlice: StateCreator<GameStore, [], [], NarrativeSlice> = (set) => ({
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

    setQuestLog: (log) => set((state) => ({
        gameState: { ...state.gameState, questLog: log }
    })),

    setPerceivedRoomId: (roomId) => set((state) => ({
        gameState: { ...state.gameState, perceivedRoomId: roomId }
    })),
});
