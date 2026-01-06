import { useState, useCallback, useRef } from "react";

import type { Room, SoundAsset } from "../types";
import { shouldHideSceneTitle } from "../utils/transitionUtils";
import { useGameStore } from "../store/useGameStore";
import { SHUTTER_SETTINGS, TRANSITION_SETTINGS } from "../data/constants";

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
}: UseTransitionProps) => {
    const { gameState, actions } = useGameStore();
    const { activeTransitionVideo, activeTransitionVolume, isShutterActive } = gameState;

    const [pendingMove, setPendingMove] = useState<{ nextRoomId: string } | null>(null);
    const [onEyesOpen, setOnEyesOpen] = useState<{ fn: () => void } | null>(null);
    const [onEyesShut, setOnEyesShut] = useState<{ fn: () => void } | null>(null);
    const videoMidpointReachedRef = useRef(false);
    const blinkMidpointReachedRef = useRef(false);

    const triggerShutter = useCallback((onShut: () => void) => {
        actions.setShutter(true);
        setTimeout(() => onShut(), SHUTTER_SETTINGS.MIDPOINT);
        setTimeout(() => actions.setShutter(false), SHUTTER_SETTINGS.DURATION);
    }, [actions]);

    const startTransition = useCallback((video: string | SoundAsset, nextRoomId?: string, onEyesOpen?: () => void, onEyesShut?: () => void) => {
        const path = typeof video === 'string' ? video : video.path;
        const volume = typeof video === 'string' ? TRANSITION_SETTINGS.DEFAULT_VOLUME : (video.volume ?? TRANSITION_SETTINGS.DEFAULT_VOLUME);

        actions.setTransitionVideo(path, volume);
        setPendingMove(nextRoomId ? { nextRoomId } : null);
        setOnEyesShut(onEyesShut ? { fn: onEyesShut } : null);
        setOnEyesOpen(onEyesOpen ? { fn: onEyesOpen } : null);

        videoMidpointReachedRef.current = false;
        blinkMidpointReachedRef.current = false;
    }, [actions, setPendingMove, setOnEyesShut, setOnEyesOpen]);

    const finalizeTransition = useCallback((oneOffCallback?: () => void) => {
        actions.setTransitionVideo(null);

        if (onEyesShut) onEyesShut.fn();
        if (oneOffCallback) oneOffCallback();
        if (onEyesOpen) onEyesOpen.fn();

        setPendingMove(null);
        setOnEyesShut(null);
        setOnEyesOpen(null);
    }, [actions, onEyesShut, onEyesOpen, setPendingMove, setOnEyesShut, setOnEyesOpen]);

    const resetTransition = useCallback((onEyesShut?: () => void) => {
        if (blinkMidpointReachedRef.current) return;
        blinkMidpointReachedRef.current = true;
        triggerShutter(() => finalizeTransition(onEyesShut));
    }, [triggerShutter, finalizeTransition]);

    const performCinematicReveal = useCallback(() => {
        if (videoMidpointReachedRef.current) return;
        videoMidpointReachedRef.current = true;

        if (pendingMove) {
            actions.setPerceivedRoomId(pendingMove.nextRoomId);
        }
    }, [pendingMove, actions]);
    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (!activeTransitionVideo) return;

        const video = e.currentTarget;
        if (video.currentTime > video.duration / 2) {
            performCinematicReveal();
        }

        const timeLeft = video.duration - video.currentTime;
        if (timeLeft <= TRANSITION_SETTINGS.VIDEO_END_THRESHOLD) {
            resetTransition();
        }
    }, [activeTransitionVideo, performCinematicReveal, resetTransition]);

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
            gameState.isWalking,
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
