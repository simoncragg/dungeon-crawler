import React, { useState, useRef } from "react";
import type { Direction, GameState, LogEntry, GameAction } from "../types";
import { MOVEMENT_SETTINGS } from "../data/constants";
import { DIRECTIONS } from "../data/gameData";

interface UseMovementProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  addToLog: (text: string, type?: LogEntry["type"]) => void;

  playAmbientLoop: (file: string | null, fadeDuration?: number) => void;
  playShuffleSound: () => void;
  processRoomEntry: (nextRoomId: string) => void;
}

export const useMovement = ({
  gameState,
  dispatch,
  addToLog,
  playAmbientLoop,
  playShuffleSound,
  processRoomEntry
}: UseMovementProps) => {
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState<Direction | null>(null);
  const [walkStepScale, setWalkStepScale] = useState(1);
  const [activeTransitionVideo, setActiveTransitionVideo] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ direction: Direction; nextRoomId: string } | null>(null);
  const [isShutterActive, setIsShutterActive] = useState(false);

  const walkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeMove = (direction: Direction) => {
    const room = gameState.rooms[gameState.currentRoomId];
    const nextRoomId = room.exits[direction];

    if (!nextRoomId) {
      addToLog("You can't go that way.", "system");
      return;
    }

    // Check for transition video
    if (room.transitionVideos && room.transitionVideos[direction]) {
      setActiveTransitionVideo(room.transitionVideos[direction]!);
      setPendingMove({ direction, nextRoomId });
      return;
    }

    // Check for locked exits
    if (room.lockedExits && room.lockedExits[direction]) {
      dispatch({ type: "MOVE", direction, nextRoomId: gameState.currentRoomId });
      addToLog(room.lockedExits[direction].lockedMessage, "warning");
      setIsWalking(false);
      setWalkingDirection(null);
      return;
    }

    dispatch({ type: "MOVE", direction, nextRoomId });
    processRoomEntry(nextRoomId);

    setIsWalking(false);
    setWalkingDirection(null);
  };

  const performTransitionMove = (direction: Direction, nextRoomId: string) => {
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 250);
    executeMove(direction);

    const nextRoom = gameState.rooms[nextRoomId];
    if (nextRoom) {
      playAmbientLoop(nextRoom.audioLoop || null, MOVEMENT_SETTINGS.TRANSITION_CROSSFADE_DURATION);
    }

    const baseInterval = MOVEMENT_SETTINGS.TRANSITION_BASE_INTERVAL;
    let stepCounter = 0;

    if (walkingTimerRef.current) clearTimeout(walkingTimerRef.current);

    setWalkStepScale(-1);
    playShuffleSound();
    stepCounter++;

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
  };

  const performStandardMove = (direction: Direction, stepCount: number, startDelay: number, stepInterval: number) => {
    for (let i = 0; i < stepCount; i++) {
      setTimeout(() => {
        setWalkStepScale(i % 2 === 0 ? -1 : 1);
        playShuffleSound();
      }, startDelay + (i * stepInterval));
    }

    setTimeout(() => {
      setWalkStepScale(1);
      executeMove(direction);
    }, startDelay + (stepCount * stepInterval));
  };

  const handleMove = (direction: Direction) => {
    if (!DIRECTIONS.includes(direction)) {
      addToLog("Go where?", "system");
      return;
    }

    const currentRoom = gameState.rooms[gameState.currentRoomId];
    const isFleeing = !!currentRoom.enemy;
    const isLocked = currentRoom.lockedExits && currentRoom.lockedExits[direction];
    const hasExit = !!currentRoom.exits[direction];

    if (!hasExit && !isLocked) {
      addToLog("You can't go that way.", "system");
      return;
    }

    setIsWalking(true);
    setWalkingDirection(direction);

    const textRenderDelay = 0;

    let stepCount = MOVEMENT_SETTINGS.STANDARD_STEP_COUNT;
    if (isFleeing) stepCount = MOVEMENT_SETTINGS.FLEEING_STEP_COUNT;
    if (isLocked) stepCount = MOVEMENT_SETTINGS.LOCKED_STEP_COUNT;

    const stepInterval = isFleeing ? MOVEMENT_SETTINGS.FLEEING_STEP_INTERVAL : MOVEMENT_SETTINGS.STANDARD_STEP_INTERVAL;
    const startDelay = (isFleeing ? 150 : 300) + textRenderDelay;

    const isTransition = currentRoom.transitionVideos && currentRoom.transitionVideos[direction];

    if (isTransition) {
      const nextRoomId = currentRoom.exits[direction];
      if (nextRoomId) {
        performTransitionMove(direction, nextRoomId);
      }
    } else {
      performStandardMove(direction, stepCount, startDelay, stepInterval);
    }
  };

  const handleTransitionEnd = () => {
    if (walkingTimerRef.current) {
      clearTimeout(walkingTimerRef.current);
      walkingTimerRef.current = null;
    }
    setWalkStepScale(1);
    setIsWalking(false);
    setWalkingDirection(null);

    if (pendingMove) {
      dispatch({ type: "MOVE", direction: pendingMove.direction, nextRoomId: pendingMove.nextRoomId });
      processRoomEntry(pendingMove.nextRoomId);
    }
    setActiveTransitionVideo(null);
    setPendingMove(null);
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 250);
  };

  return {
    isWalking,
    walkingDirection,
    walkStepScale,
    activeTransitionVideo,
    isShutterActive,
    handleMove,
    handleTransitionEnd
  };
};
