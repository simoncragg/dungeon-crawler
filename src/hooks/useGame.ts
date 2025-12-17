import { useReducer, useState, useEffect, useRef, useCallback } from "react";

import type { LogEntry } from "../types";
import { ITEMS } from "../data/gameData";
import { INITIAL_STATE } from "../data/initialState";

import useSoundFx from "./useSoundFx";
import { gameReducer } from "../reducers/gameReducer";
import { useRoomPreloader } from "./useRoomPreloader";
import { useMovement } from "./useMovement";
import { useCombat } from "./useCombat";
import { useInventory } from "./useInventory";

export const useGame = () => {

  const [gameState, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const [hasInspected, setHasInspected] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [isEnemyRevealed, setIsEnemyRevealed] = useState(true);

  useRoomPreloader(gameState.currentRoomId, gameState.inventory.items);

  const { playAmbientLoop, playShuffleSound, playItemSound, playSoundFile, playNarration } = useSoundFx();

  const addToLog = useCallback((text: string, type: LogEntry["type"] = "system") => {
    dispatch({ type: "ADD_LOG", message: text, logType: type });
  }, []);

  const processRoomEntry = useCallback((nextRoomId: string) => {
    setHasInspected(false);
    const nextRoom = gameState.rooms[nextRoomId];
    const isRevisit = gameState.visitedRooms.includes(nextRoomId);

    if (nextRoom.enemy) {
      setIsEnemyRevealed(isRevisit);
    }

    setTimeout(() => {
      addToLog(nextRoom.name, "room-title");
      addToLog(nextRoom.description, "room-description");

      if (nextRoom.enemy) {
        const enemyName = nextRoom.enemy.name;
        if (isRevisit) {
          addToLog(`A ${enemyName} blocks your path!`, "danger");
        } else {
          const delay = nextRoom.description.length * 10 + 500;
          setTimeout(() => {
            addToLog(`A ${enemyName} blocks your path!`, "danger");
            setIsEnemyRevealed(true);
            dispatch({ type: "SET_NARRATOR_VISIBLE", visible: false });
            playSoundFile("danger.mp3");
          }, delay);
        }
      }
    }, 600);
  }, [gameState.rooms, gameState.visitedRooms, addToLog, playSoundFile]);

  /*
   * useMovement
  */
  const {
    isWalking,
    walkingDirection,
    walkStepScale,
    activeTransitionVideo,
    isShutterActive,
    handleMove,
    handleTransitionEnd
  } = useMovement({
    gameState,
    dispatch,
    addToLog,
    playAmbientLoop,
    playShuffleSound,
    processRoomEntry
  });

  /*
   * useInventory
  */
  const { takeItem, dropItem, equipItem, useItem, hasItem } = useInventory({
    gameState,
    dispatch,
    addToLog,
    playSoundFile,
    playItemSound
  });

  /*
   * useCombat
   */
  const { startCombat, handleCombatAction } = useCombat({
    gameState,
    dispatch,
    playSoundFile
  });

  useEffect(() => {
    if (!gameState.feedback) return;

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, 3000);

    return () => clearTimeout(timer);
  }, [gameState.feedback]);

  const stopNarrationRef = useRef<(() => void) | null>(null);
  const currentRoom = gameState.rooms[gameState.currentRoomId];

  useEffect(() => {
    playAmbientLoop(currentRoom.audioLoop || null);

    if (stopNarrationRef.current) {
      stopNarrationRef.current();
      stopNarrationRef.current = null;
    }

    if (currentRoom.narration) {
      let audioStop: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        audioStop = playNarration(currentRoom.narration!.path, currentRoom.narration!.volume || 1.0);
      }, 2000);

      stopNarrationRef.current = () => {
        clearTimeout(timeoutId);
        if (audioStop) audioStop();
      };
    }
  }, [
    gameState.currentRoomId,
    currentRoom.narration,
    currentRoom.audioLoop,
    playAmbientLoop,
    playNarration
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = currentRoom.videoLoop?.volume ?? 0.4;
    }
  }, [currentRoom.videoLoop?.path, currentRoom.videoLoop?.volume]);

  const inspectRoom = () => {
    const room = gameState.rooms[gameState.currentRoomId];
    setHasInspected(true);
    let desc = "You scan the area.";
    if (room.items.length > 0) {
      const itemNames = room.items.map(id => ITEMS[id].name).join(", ");
      desc += ` You see: ${itemNames}.`;
    } else {
      desc += " You don't see anything useful here.";
    }

    if (room.enemy) {
      desc += ` WARNING: A ${room.enemy.name} is here!`;
    }
    addToLog(desc, "info");
  };

  return {
    gameState,
    questLog: gameState.questLog,
    hasInspected,
    viewingItemId,
    setViewingItemId,
    isWalking,
    walkingDirection,
    walkStepScale,
    isEnemyRevealed,
    attackPower: gameState.attack,
    defensePower: gameState.defense,
    currentRoom,
    hasItem,
    handleMove,
    handleTransitionEnd,
    activeTransitionVideo,
    isShutterActive,
    inspectRoom,
    takeItem,
    dropItem,
    equipItem,
    startCombat,
    handleCombatAction,
    useItem,
    feedback: gameState.feedback || { message: null, type: null, id: 0 },
    setNarratorVisible: (visible: boolean) => dispatch({ type: "SET_NARRATOR_VISIBLE", visible }),
    videoRef
  };
};
