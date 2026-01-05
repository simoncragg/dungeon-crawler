import type { StateCreator } from "zustand";
import type { GameStore } from "../storeTypes";

export type ExplorationSlice = Pick<GameStore["actions"],
    | "move"
    | "updateMapPosition"
    | "unlockDoor"
    | "setRoomAudio"
    | "clearUnlockHighlight"
    | "setHasInspected"
>;

export const createExplorationSlice: StateCreator<GameStore, [], [], ExplorationSlice> = (set) => ({
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

    unlockDoor: (direction) => set((state) => {
        const newRooms = { ...state.gameState.rooms };
        const currentRoom = newRooms[state.gameState.currentRoomId];

        if (currentRoom.lockedExits) {
            const lockedExit = currentRoom.lockedExits[direction];
            const newLockedExits = { ...currentRoom.lockedExits };
            delete newLockedExits[direction];

            let newImage = currentRoom.image;
            let newVideoLoop = currentRoom.videoLoop;

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

    clearUnlockHighlight: () => set((state) => ({
        gameState: { ...state.gameState, unlockedDirection: null }
    })),

    setHasInspected: (inspected) => set((state) => ({
        gameState: { ...state.gameState, hasInspected: inspected }
    })),
});
