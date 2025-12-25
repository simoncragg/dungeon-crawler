import { useState, useCallback } from "react";
import type { Room } from "../types";

export const useTransition = (currentRoom: Room, rooms: Record<string, Room>, feedback: { message: string | null }, isWalking: boolean) => {
    const [activeTransitionVideo, setActiveTransitionVideo] = useState<string | null>(null);
    const [pendingMove, setPendingMove] = useState<{ nextRoomId: string } | null>(null);
    const [transitionTitle, setTransitionTitle] = useState<{ id: string; name: string } | null>(null);
    const [isShutterActive, setIsShutterActive] = useState(false);

    const activeTitle = transitionTitle && activeTransitionVideo ? transitionTitle : { id: currentRoom.id, name: currentRoom.name };

    const triggerShutter = useCallback(() => {
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 400);
    }, []);

    const startTransition = useCallback((video: string, nextRoomId: string) => {
        setActiveTransitionVideo(video);
        setPendingMove({ nextRoomId });
        setTransitionTitle({ id: currentRoom.id, name: currentRoom.name });
    }, [currentRoom.id, currentRoom.name]);

    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (activeTransitionVideo && pendingMove) {
            const video = e.currentTarget;
            if (video.currentTime > video.duration / 2) {
                const nextRoom = rooms[pendingMove.nextRoomId];
                if (nextRoom && transitionTitle?.id !== nextRoom.id) {
                    setTransitionTitle({ id: nextRoom.id, name: nextRoom.name });
                }
            }
        }
    }, [activeTransitionVideo, pendingMove, rooms, transitionTitle?.id]);

    const resetTransition = useCallback(() => {
        setActiveTransitionVideo(null);
        setPendingMove(null);
        setTransitionTitle(null);
        triggerShutter();
    }, [triggerShutter]);

    const sceneTitleProps = {
        key: activeTitle.id,
        title: activeTitle.name,
        forceHide: !!feedback.message || (activeTransitionVideo !== null && activeTitle.id === currentRoom.id) || (isWalking && activeTitle.id === currentRoom.id)
    };

    return {
        activeTransitionVideo,
        pendingMove,
        isShutterActive,
        sceneTitleProps,
        startTransition,
        handleVideoTimeUpdate,
        resetTransition,
        triggerShutter
    };
};
