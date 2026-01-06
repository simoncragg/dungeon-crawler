import { useRef, useCallback } from "react";
import type { Direction, LogEntry } from "../types";
import { MOVEMENT_SETTINGS } from "../data/constants";
import { useTransition } from "./useTransition";
import useSoundFx from "./useSoundFx";
import { useGameStore } from "../store/useGameStore";

interface UseMovementProps {
  processRoomEntry: (nextRoomId: string) => void;
}

export const useMovement = ({
  processRoomEntry
}: UseMovementProps) => {
  const {
    gameState,
    actions
  } = useGameStore();

  const currentRoom = gameState.rooms[gameState.currentRoomId];
  const addToLog = useCallback((text: string, type?: LogEntry["type"]) => actions.addLog(text, type), [actions]);

  const { playShuffleSound } = useSoundFx();
  const { isWalking, walkingDirection } = gameState;

  const walkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
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
  } = useTransition({
    currentRoom,
    rooms: gameState.rooms,
    feedback: gameState.feedback || { message: null },
    isWalking,
  });

  const stopWalking = useCallback(() => {
    if (walkingTimerRef.current) {
      clearTimeout(walkingTimerRef.current);
      walkingTimerRef.current = null;
    }
    actions.setWalking(false);
    actions.setWalkingDirection(null);
  }, [actions]);

  const startWalking = useCallback((direction: Direction, shouldMute: boolean = false) => {
    stopWalking();
    actions.setWalking(true);
    actions.setWalkingDirection(direction);

    const baseInterval = MOVEMENT_SETTINGS.TRANSITION_BASE_INTERVAL;

    const scheduleNextStep = () => {
      const variance = Math.random() * (MOVEMENT_SETTINGS.TRANSITION_VARIANCE * 2) - MOVEMENT_SETTINGS.TRANSITION_VARIANCE;
      const nextDelay = baseInterval + variance;

      walkingTimerRef.current = setTimeout(() => {
        if (!shouldMute) {
          playShuffleSound();
        }
        scheduleNextStep();
      }, nextDelay);
    };

    scheduleNextStep();
  }, [playShuffleSound, stopWalking, actions]);

  const performStandardMoveSteps = useCallback((direction: Direction, stepCount: number, startDelay: number, stepInterval: number, onComplete: () => void) => {
    stopWalking();
    actions.setWalking(true);
    actions.setWalkingDirection(direction);

    for (let i = 0; i < stepCount; i++) {
      setTimeout(() => {
        playShuffleSound();
      }, startDelay + (i * stepInterval));
    }

    setTimeout(() => {
      stopWalking();
      onComplete();
    }, startDelay + (stepCount * stepInterval));
  }, [playShuffleSound, stopWalking, actions]);

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
        performStandardMoveSteps(direction, MOVEMENT_SETTINGS.LOCKED_STEP_COUNT, MOVEMENT_SETTINGS.START_DELAY, MOVEMENT_SETTINGS.STANDARD_STEP_INTERVAL, () => {
          addToLog(lockedExit.lockedMessage, "warning");
        });
      }
      return;
    }

    const transitionVideo = currentRoom.transitionVideos?.[direction];

    if (transitionVideo) {
      triggerShutter(() => {
        startTransition(
          transitionVideo,
          nextRoomId!,
          undefined,
          () => {
            if (nextRoomId) {
              actions.move(nextRoomId);
              actions.setPerceivedRoomId(nextRoomId);
              actions.updateMapPosition(nextRoomId);
              processRoomEntry(nextRoomId);
            }
          }
        );
      });
      startWalking(direction, true);
    } else {
      const isFleeing = !!currentRoom.enemy;
      const stepCount = isFleeing ? MOVEMENT_SETTINGS.FLEEING_STEP_COUNT : MOVEMENT_SETTINGS.STANDARD_STEP_COUNT;
      const stepInterval = isFleeing ? MOVEMENT_SETTINGS.FLEEING_STEP_INTERVAL : MOVEMENT_SETTINGS.STANDARD_STEP_INTERVAL;

      performStandardMoveSteps(direction, stepCount, MOVEMENT_SETTINGS.START_DELAY, stepInterval, () => {
        triggerShutter(() => {
          actions.move(nextRoomId!);
          actions.setPerceivedRoomId(nextRoomId!);
          actions.updateMapPosition(nextRoomId!);
          processRoomEntry(nextRoomId!);
        });
      });
    }
  }, [currentRoom, startTransition, startWalking, performStandardMoveSteps, addToLog, actions, processRoomEntry, triggerShutter]);

  const handleTransitionEnd = useCallback(() => {
    resetTransition();
    stopWalking();
  }, [resetTransition, stopWalking]);

  return {
    isWalking,
    walkingDirection,
    activeTransitionVideo,
    activeTransitionVolume,
    isShutterActive,
    sceneTitleProps,
    handleMove,
    handleTransitionEnd,
    handleVideoTimeUpdate,
    startTransition,
    triggerShutter,
    pendingMove,
    visibleRoom
  };
};
