import type { StateCreator } from "zustand";
import type { GameStore } from "../storeTypes";

export type ExplorationSlice = Pick<GameStore["actions"],
    | "move"
    | "updateMapPosition"
    | "unlockDoor"
    | "setRoomAudio"
    | "clearUnlockHighlight"
    | "setWalking"
    | "setWalkingDirection"
    | "setShutter"
    | "setTransitionVideo"
    | "setDebugMode"
>;

export const createExplorationSlice: StateCreator<GameStore, [], [], ExplorationSlice> = (set) => ({
    move: (nextRoomId) => set((state) => ({
        gameState: {
            ...state.gameState,
            currentRoomId: nextRoomId,
            mapOverrideRoomId: undefined,
            visitedRooms: Array.from(new Set([...state.gameState.visitedRooms, nextRoomId])),
            feedback: null,
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
        const lockedExit = currentRoom.lockedExits?.[direction];

        if (currentRoom.lockedExits) {
            const newLockedExits = { ...currentRoom.lockedExits };
            delete newLockedExits[direction];

            let newImage = currentRoom.image;
            let newVideoLoop = currentRoom.videoLoop;

            if (lockedExit?.unlockImage) {
                newImage = lockedExit.unlockImage;
                if (!lockedExit.unlockVideo) {
                    newVideoLoop = undefined;
                }
            }

            if (lockedExit?.unlockVideo) {
                newVideoLoop = lockedExit.unlockVideo;
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
                unlockedDirection: lockedExit?.unlockVideo ? null : direction
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
    setWalking: (isWalking) => set((state) => ({
        gameState: { ...state.gameState, isWalking }
    })),
    setWalkingDirection: (direction) => set((state) => ({
        gameState: { ...state.gameState, walkingDirection: direction }
    })),
    setShutter: (active) => set((state) => ({
        gameState: { ...state.gameState, isShutterActive: active }
    })),
    setTransitionVideo: (video, volume) => set((state) => ({
        gameState: {
            ...state.gameState,
            activeTransitionVideo: video,
            activeTransitionVolume: volume ?? 0.4
        }
    })),
    setDebugMode: (enabled) => set((state) => ({
        gameState: { ...state.gameState, isDebugMode: enabled }
    })),
});
