import { useState, useRef, useCallback } from "react";
import type { Direction, Room, GameState, LogEntry, GameAction } from "../types";
import { MOVEMENT_SETTINGS } from "../data/constants";
import { useTransition } from "./useTransition";

interface UseMovementProps {
  gameState: GameState;
  currentRoom: Room;
  dispatch: React.Dispatch<GameAction>;
  addToLog: (text: string, type?: LogEntry["type"]) => void;
  playAmbientLoop: (file: string | null, fadeDuration?: number) => void;
  playShuffleSound: () => void;
  processRoomEntry: (nextRoomId: string) => void;
}

export const useMovement = ({
  gameState,
  currentRoom,
  dispatch,
  addToLog,
  playAmbientLoop,
  playShuffleSound,
  processRoomEntry
}: UseMovementProps) => {
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState<Direction | null>(null);
  const [walkStepScale, setWalkStepScale] = useState(1);

  const walkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    activeTransitionVideo,
    pendingMove,
    isShutterActive,
    sceneTitleProps,
    startTransition,
    handleVideoTimeUpdate,
    resetTransition,
    triggerShutter
  } = useTransition(currentRoom, gameState.rooms, gameState.feedback || { message: null }, isWalking);

  const stopWalking = useCallback(() => {
    if (walkingTimerRef.current) {
      clearTimeout(walkingTimerRef.current);
      walkingTimerRef.current = null;
    }
    setIsWalking(false);
    setWalkingDirection(null);
    setWalkStepScale(1);
  }, []);

  const startWalking = useCallback((direction: Direction) => {
    stopWalking();
    setIsWalking(true);
    setWalkingDirection(direction);

    let stepCounter = 0;
    const baseInterval = MOVEMENT_SETTINGS.TRANSITION_BASE_INTERVAL;

    const scheduleNextStep = () => {
      const variance = Math.random() * (MOVEMENT_SETTINGS.TRANSITION_VARIANCE * 2) - MOVEMENT_SETTINGS.TRANSITION_VARIANCE;
      const nextDelay = baseInterval + variance;

      walkingTimerRef.current = setTimeout(() => {
        setWalkStepScale(stepCounter % 2 === 0 ? -1 : 1);
        playShuffleSound();
        stepCounter++;
        scheduleNextStep();
      }, nextDelay);
    };

    scheduleNextStep();
  }, [playShuffleSound, stopWalking]);

  const performStandardMoveSteps = useCallback((direction: Direction, stepCount: number, startDelay: number, stepInterval: number, onComplete: () => void) => {
    stopWalking();
    setIsWalking(true);
    setWalkingDirection(direction);

    for (let i = 0; i < stepCount; i++) {
      setTimeout(() => {
        setWalkStepScale(i % 2 === 0 ? -1 : 1);
        playShuffleSound();
      }, startDelay + (i * stepInterval));
    }

    setTimeout(() => {
      stopWalking();
      onComplete();
    }, startDelay + (stepCount * stepInterval));
  }, [playShuffleSound, stopWalking]);

  const handleMove = useCallback((direction: Direction) => {
    const nextRoomId = currentRoom.exits[direction];
    const isLocked = currentRoom.lockedExits && currentRoom.lockedExits[direction];

    if (!nextRoomId && !isLocked) {
      addToLog("You can't go that way.", "system");
      return;
    }

    if (isLocked) {
      const lockedExit = currentRoom.lockedExits?.[direction];
      if (lockedExit) {
        performStandardMoveSteps(direction, MOVEMENT_SETTINGS.LOCKED_STEP_COUNT, 300, MOVEMENT_SETTINGS.STANDARD_STEP_INTERVAL, () => {
          addToLog(lockedExit.lockedMessage, "warning");
        });
      }
      return;
    }

    const transitionVideo = currentRoom.transitionVideos?.[direction];

    if (transitionVideo) {
      triggerShutter();
      startTransition(transitionVideo, nextRoomId!);
      startWalking(direction);
      const nextRoom = gameState.rooms[nextRoomId!];
      if (nextRoom) {
        playAmbientLoop(nextRoom.audioLoop || null, MOVEMENT_SETTINGS.TRANSITION_CROSSFADE_DURATION);
      }
    } else {
      const isFleeing = !!currentRoom.enemy;
      const stepCount = isFleeing ? MOVEMENT_SETTINGS.FLEEING_STEP_COUNT : MOVEMENT_SETTINGS.STANDARD_STEP_COUNT;
      const stepInterval = isFleeing ? MOVEMENT_SETTINGS.FLEEING_STEP_INTERVAL : MOVEMENT_SETTINGS.STANDARD_STEP_INTERVAL;

      performStandardMoveSteps(direction, stepCount, 300, stepInterval, () => {
        dispatch({ type: "MOVE", nextRoomId: nextRoomId! });
        processRoomEntry(nextRoomId!);
      });
    }
  }, [currentRoom, startTransition, startWalking, performStandardMoveSteps, addToLog, dispatch, gameState.rooms, playAmbientLoop, processRoomEntry, triggerShutter]);

  const handleTransitionEnd = useCallback(() => {
    if (pendingMove) {
      dispatch({ type: "MOVE", nextRoomId: pendingMove.nextRoomId });
      processRoomEntry(pendingMove.nextRoomId);
    }
    resetTransition();
    stopWalking();
  }, [pendingMove, dispatch, processRoomEntry, resetTransition, stopWalking]);

  return {
    isWalking,
    walkingDirection,
    walkStepScale,
    activeTransitionVideo,
    isShutterActive,
    sceneTitleProps,
    handleMove,
    handleTransitionEnd,
    handleVideoTimeUpdate,
    pendingMove
  };
};
