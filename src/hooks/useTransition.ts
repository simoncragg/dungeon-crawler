import { useState, useCallback, useRef } from "react";
import type { Room } from "../types";

interface UseTransitionProps {
    currentRoom: Room;
    rooms: Record<string, Room>;
    feedback: { message: string | null };
    isWalking: boolean;
    onMidpoint?: () => void;
}

export const useTransition = ({
    currentRoom,
    rooms,
    feedback,
    isWalking,
    onMidpoint
}: UseTransitionProps) => {
    const [activeTransitionVideo, setActiveTransitionVideo] = useState<string | null>(null);
    const [pendingMove, setPendingMove] = useState<{ nextRoomId: string } | null>(null);
    const [transitionTitle, setTransitionTitle] = useState<{ id: string; name: string } | null>(null);
    const [isShutterActive, setIsShutterActive] = useState(false);
    const midpointReachedRef = useRef(false);

    const activeTitle = transitionTitle && activeTransitionVideo ? transitionTitle : { id: currentRoom.id, name: currentRoom.name };

    const triggerShutter = useCallback(() => {
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 400);
    }, []);

    const startTransition = useCallback((video: string, nextRoomId: string) => {
        setActiveTransitionVideo(video);
        setPendingMove({ nextRoomId });
        setTransitionTitle({ id: currentRoom.id, name: currentRoom.name });
        midpointReachedRef.current = false;
    }, [currentRoom.id, currentRoom.name]);

    const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (activeTransitionVideo && pendingMove) {
            const video = e.currentTarget;
            if (video.currentTime > video.duration / 2 && !midpointReachedRef.current) {
                midpointReachedRef.current = true;
                const nextRoom = rooms[pendingMove.nextRoomId];
                if (nextRoom) {
                    setTransitionTitle({ id: nextRoom.id, name: nextRoom.name });
                }
                if (onMidpoint) onMidpoint();
            }
        }
    }, [activeTransitionVideo, pendingMove, rooms, onMidpoint]);

    const resetTransition = useCallback(() => {
        setActiveTransitionVideo(null);
        setPendingMove(null);
        setTransitionTitle(null);
        midpointReachedRef.current = false;
        triggerShutter();
    }, [triggerShutter]);

    const sceneTitleProps = {
        key: activeTitle.id,
        title: activeTitle.name,
        forceHide: !!feedback.message ||
            (activeTransitionVideo !== null ? (activeTitle.id !== pendingMove?.nextRoomId) : (isWalking && activeTitle.id === currentRoom.id))
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
