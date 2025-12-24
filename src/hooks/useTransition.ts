import { useState, useCallback, useEffect } from "react";
import type { Direction, Room } from "../types";

export const useTransition = (currentRoom: Room, rooms: Record<string, Room>, feedback: { message: string | null }, isWalking: boolean) => {
    const [activeTransitionVideo, setActiveTransitionVideo] = useState<string | null>(null);
    const [pendingMove, setPendingMove] = useState<{ direction: Direction; nextRoomId: string } | null>(null);
    const [activeTitle, setActiveTitle] = useState({ id: currentRoom.id, name: currentRoom.name });
    const [isShutterActive, setIsShutterActive] = useState(false);

    const triggerShutter = useCallback(() => {
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 400);
    }, []);

    const startTransition = useCallback((video: string, direction: Direction, nextRoomId: string) => {
        setActiveTransitionVideo(video);
        setPendingMove({ direction, nextRoomId });
        // Reset title to current room so it can be hidden during transition
        setActiveTitle({ id: currentRoom.id, name: currentRoom.name });
    }, [currentRoom.id, currentRoom.name]);

    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (activeTransitionVideo && pendingMove) {
            const video = e.currentTarget;
            if (video.currentTime > video.duration / 2) {
                const nextRoom = rooms[pendingMove.nextRoomId];
                if (nextRoom && activeTitle.id !== nextRoom.id) {
                    setActiveTitle({ id: nextRoom.id, name: nextRoom.name });
                }
            }
        }
    }, [activeTransitionVideo, pendingMove, rooms, activeTitle.id]);

    const resetTransition = useCallback(() => {
        setActiveTransitionVideo(null);
        setPendingMove(null);
        triggerShutter();
    }, [triggerShutter]);

    useEffect(() => {
        if (!activeTransitionVideo) {
            setActiveTitle({ id: currentRoom.id, name: currentRoom.name });
        }
    }, [currentRoom.id, currentRoom.name, activeTransitionVideo]);

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
