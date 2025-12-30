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
