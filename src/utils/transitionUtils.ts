import type { Direction, SoundAsset } from "../types";

/**
 * Pure function to calculate which transition videos should be rendered in the DOM.
 * Includes the active video and any unvisited routes for pre-warming.
 */
export const getVideosToRender = (
    transitionVideos: Partial<Record<Direction, string | SoundAsset>> | undefined,
    exits: Partial<Record<Direction, string>>,
    visitedRooms: string[],
    activeTransitionVideo: string | null
) => {
    return (Object.entries(transitionVideos || {}) as [Direction, string | SoundAsset][]).map(([dir, video]) => {
        const path = typeof video === 'string' ? video : video.path;
        const nextRoomId = exits[dir];
        const isVisited = nextRoomId ? visitedRooms.includes(nextRoomId) : false;
        const isActive = activeTransitionVideo === path;

        return {
            path,
            dir,
            isActive,
            isVisited,
            shouldRender: isActive || !isVisited
        };
    }).filter(v => v.shouldRender);
};

/**
 * Logic to determine if the Scene Title should be hidden.
 */
export const shouldHideSceneTitle = (
    feedbackMessage: string | null | undefined,
    activeTransitionVideo: string | null,
    activeTitleId: string,
    pendingMoveId: string | undefined,
    isWalking: boolean,
    currentRoomId: string
) => {
    if (feedbackMessage) return true;

    if (activeTransitionVideo) {
        return activeTitleId !== pendingMoveId;
    }

    return isWalking && activeTitleId === currentRoomId;
};
