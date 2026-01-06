import { useState, useCallback, useRef } from "react";

import type { Room, SoundAsset } from "../types";
import { shouldHideSceneTitle } from "../utils/transitionUtils";
import { useGameStore } from "../store/useGameStore";

interface UseTransitionProps {
    currentRoom: Room;
    rooms: Record<string, Room>;
    feedback: { message: string | null };
    isWalking: boolean;
}

export const useTransition = ({
    currentRoom,
    rooms,
    feedback,
    isWalking,
}: UseTransitionProps) => {
    const { actions } = useGameStore();
    const [activeTransitionVideo, setActiveTransitionVideo] = useState<string | null>(null);
    const [activeTransitionVolume, setActiveTransitionVolume] = useState<number>(0.4);
    const [pendingMove, setPendingMove] = useState<{ nextRoomId: string } | null>(null);
    const [onMidpointAction, setOnMidpointAction] = useState<{ fn: () => void } | null>(null);
    const [onCompleteAction, setOnCompleteAction] = useState<{ fn: () => void } | null>(null);
    const [isShutterActive, setIsShutterActive] = useState(false);
    const midpointReachedRef = useRef(false);


    const triggerShutter = useCallback((onMidpoint?: () => void, nextRoomId?: string) => {
        setIsShutterActive(true);

        setTimeout(() => {
            const targetRoomId = nextRoomId || pendingMove?.nextRoomId;
            if (targetRoomId) {
                actions.setPerceivedRoomId(targetRoomId);
            }

            if (onMidpoint) onMidpoint();
        }, 200);

        setTimeout(() => {
            setIsShutterActive(false);
        }, 400);
    }, [pendingMove, actions]);

    const startTransition = useCallback((video: string | SoundAsset, nextRoomId?: string, onComplete?: () => void, onMidpoint?: () => void) => {
        if (typeof video === 'string') {
            setActiveTransitionVideo(video);
            setActiveTransitionVolume(0.4);
        } else {
            setActiveTransitionVideo(video.path);
            setActiveTransitionVolume(video.volume ?? 0.4);
        }

        if (nextRoomId) {
            setPendingMove({ nextRoomId });
        } else {
            setPendingMove(null);
        }

        if (onMidpoint) {
            setOnMidpointAction({ fn: onMidpoint });
        } else {
            setOnMidpointAction(null);
        }

        if (onComplete) {
            setOnCompleteAction({ fn: onComplete });
        } else {
            setOnCompleteAction(null);
        }

        midpointReachedRef.current = false;
    }, []);

    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (activeTransitionVideo) {
            const video = e.currentTarget;
            if (video.currentTime > video.duration / 2 && !midpointReachedRef.current) {
                midpointReachedRef.current = true;

                if (pendingMove) {
                    actions.setPerceivedRoomId(pendingMove.nextRoomId);
                }

                if (onMidpointAction) onMidpointAction.fn();
            }
        }
    }, [activeTransitionVideo, pendingMove, onMidpointAction, actions]);

    const resetTransition = useCallback(() => {
        const completeFn = onCompleteAction?.fn;

        triggerShutter(() => {
            if (completeFn) completeFn();
            setPendingMove(null);
        });

        setActiveTransitionVideo(null);
        setActiveTransitionVolume(0.4);
        setOnMidpointAction(null);
        setOnCompleteAction(null);
        midpointReachedRef.current = false;
    }, [triggerShutter, onCompleteAction]);

    const perceivedRoomId = useGameStore(state => state.gameState.perceivedRoomId);
    const visibleRoom = rooms[perceivedRoomId] || currentRoom;

    const sceneTitleProps = {
        id: visibleRoom.id,
        title: visibleRoom.name,
        forceHide: shouldHideSceneTitle(
            feedback.message,
            activeTransitionVideo,
            visibleRoom.id,
            pendingMove?.nextRoomId,
            isWalking,
            currentRoom.id
        )
    };

    return {
        activeTransitionVideo,
        activeTransitionVolume,
        pendingMove,
        isShutterActive,
        sceneTitleProps,
        startTransition,
        handleVideoTimeUpdate,
        resetTransition,
        triggerShutter,
        visibleRoom
    };
};
