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
  const currentRoom = gameState.rooms[gameState.currentRoomId];

  const [viewingItemId, setViewingItemId] = useState<string | null>(null);

  useRoomPreloader(gameState.currentRoomId, gameState.inventory.items);

  const {
    playAmbientLoop,
    playShuffleSound,
    playItemSound,
    playSoundFile,
    playNarration
  } = useSoundFx();

  const addToLog = useCallback((text: string, type: LogEntry["type"] = "system") => {
    dispatch({ type: "ADD_LOG", message: text, logType: type });
  }, []);

  const processRoomEntry = useCallback((nextRoomId: string) => {
    const nextRoom = gameState.rooms[nextRoomId];

    setTimeout(() => {
      addToLog(nextRoom.name, "room-title");
      addToLog(nextRoom.description, "room-description");

      if (nextRoom.narration?.text && gameState.isFirstVisit) {
        addToLog(nextRoom.narration!.text!, "narration");
      }

      if (nextRoom.enemy) {
        const enemyName = nextRoom.enemy.name;
        addToLog(`A ${enemyName} blocks your path!`, "danger");
        dispatch({ type: "SET_ENEMY_REVEALED", revealed: true });
        dispatch({ type: "SET_QUEST_LOG_OPEN", open: false });
        playSoundFile("danger.mp3");
      }
    }, 800);
  }, [gameState.rooms, gameState.isFirstVisit, addToLog, playSoundFile]);

  /*
   * Movement & Transitions
  */
  const movement = useMovement({
    gameState,
    currentRoom,
    dispatch,
    addToLog,
    playAmbientLoop,
    playShuffleSound,
    processRoomEntry
  });

  /*
   * useInventory
  */
  const { takeItem, dropItem, equipItem, unequipItem, useItem, hasItem } = useInventory({
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

    const messageLength = gameState.feedback.message?.length || 0;
    // Base 3s + 60ms per character for reading time
    const duration = Math.max(3000, messageLength * 60);

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, duration);

    return () => clearTimeout(timer);
  }, [gameState.feedback]);

  const stopNarrationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (movement.activeTransitionVideo) return;

    playAmbientLoop(currentRoom.audioLoop || null);

    if (stopNarrationRef.current) {
      stopNarrationRef.current();
      stopNarrationRef.current = null;
    }

    if (currentRoom.narration && gameState.isFirstVisit) {
      let audioStop: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        audioStop = playNarration(currentRoom.narration!.path, currentRoom.narration!.volume);
      }, 2000);

      stopNarrationRef.current = () => {
        clearTimeout(timeoutId);
        if (audioStop) audioStop();
      };
    }
  }, [
    gameState.isFirstVisit,
    currentRoom.narration,
    currentRoom.audioLoop,
    movement.activeTransitionVideo,
    playAmbientLoop,
    playNarration
  ]);

  const lastProcessedDropTime = useRef<number>(0);

  useEffect(() => {
    if (gameState.latestDrop && gameState.latestDrop.timestamp > lastProcessedDropTime.current) {
      if (ITEMS[gameState.latestDrop.itemId]) {
        lastProcessedDropTime.current = gameState.latestDrop.timestamp;

        // Sound still needs localized side effect, but state is already handled by reducer!
        playSoundFile("enemy-item-drop.mp3");

        const timer = setTimeout(() => {
          dispatch({ type: "CLEAR_DROP_ANIMATION" });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.latestDrop, playSoundFile]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = currentRoom.videoLoop?.volume ?? 0.4;
    }
  }, [currentRoom.videoLoop?.path, currentRoom.videoLoop?.volume]);

  const inspectRoom = () => {
    const room = gameState.rooms[gameState.currentRoomId];
    dispatch({ type: "SET_HAS_INSPECTED", inspected: true });
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
    hasInspected: gameState.hasInspected,
    viewingItemId,
    setViewingItemId,
    isEnemyRevealed: gameState.isEnemyRevealed,
    attackPower: gameState.attack,
    defensePower: gameState.defense,
    currentRoom,
    hasItem,
    ...movement,
    inspectRoom,
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    startCombat,
    handleCombatAction,
    useItem,
    recentDropId: gameState.recentDropId,
    isDropAnimating: gameState.isDropAnimating,
    feedback: gameState.feedback || { message: null, type: null, id: 0 },
    setQuestLogOpen: (open: boolean) => dispatch({ type: "SET_QUEST_LOG_OPEN", open }),
    videoRef
  };
};
