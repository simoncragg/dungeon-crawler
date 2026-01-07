import type { VideoAsset } from "../types";

/**
 * Logic to determine if the Scene Title should be hidden.
 */
export const shouldHideSceneTitle = (
  feedbackMessage: string | null | undefined,
  activeTransitionVideo: VideoAsset | null,
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
