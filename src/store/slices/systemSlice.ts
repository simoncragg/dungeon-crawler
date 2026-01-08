import type { StateCreator } from "zustand";
import { INITIAL_STATE } from "../../data/initialState";
import type { GameStore } from "../storeTypes";

export type SystemSlice = {
    restartGame: () => void;
    setGameOver: (isGameOver: boolean) => void;
};

export const createSystemSlice: StateCreator<GameStore, [], [], SystemSlice> = (set) => ({
    restartGame: () => {
        set(() => ({
            gameState: {
                ...INITIAL_STATE,
            }
        }));
    },
    setGameOver: (isGameOver) => set((state) => ({
        gameState: { ...state.gameState, isGameOver }
    })),
});
