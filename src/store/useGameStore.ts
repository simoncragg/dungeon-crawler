import { create } from "zustand";
import { INITIAL_STATE } from "../data/initialState";
import type { GameStore } from "./storeTypes";
import { createNarrativeSlice } from "./slices/narrativeSlice";
import { createExplorationSlice } from "./slices/explorationSlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createCombatSlice } from "./slices/combatSlice";

export const useGameStore = create<GameStore>()((...a) => ({
    gameState: INITIAL_STATE,
    actions: {
        ...createNarrativeSlice(...a),
        ...createExplorationSlice(...a),
        ...createInventorySlice(...a),
        ...createCombatSlice(...a),
    },
}));
