import { useState, useEffect, useRef, useCallback } from "react";
import type { LogEntry } from "../types";
import { MOVEMENT_SETTINGS } from "../data/constants";

import { ITEMS } from "../data/gameData";
import { useGameStore } from "../store/useGameStore";
import useSoundFx from "./useSoundFx";
import { useRoomPreloader } from "./useRoomPreloader";
import { useMovement } from "./useMovement";
import { useCombat } from "./useCombat";
import { useInventory } from "./useInventory";

export const useGame = () => {

  const {
    gameState,
    actions
  } = useGameStore();

  const currentRoom = gameState.rooms[gameState.currentRoomId];

  const [viewingItemId, setViewingItemId] = useState<string | null>(null);

  useRoomPreloader(gameState.currentRoomId, gameState.inventory.items);

  const {
    playAmbientLoop,
    playDropSound,
    playSoundFile,
    playNarration
  } = useSoundFx();

  const addToLog = useCallback((text: string, type: LogEntry["type"] = "system") => {
    actions.addLog(text, type);
  }, [actions]);

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
        actions.setEnemyRevealed(true);
        actions.setQuestLogOpen(false);
        playSoundFile("danger.mp3");
      }
    }, 800);
  }, [gameState.rooms, gameState.isFirstVisit, addToLog, playSoundFile, actions]);

  /* useMovement */
  const movement = useMovement({
    processRoomEntry
  });

  /* useInventory */
  const {
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    handleUseItem,
    handleDropOnHotspot,
  } = useInventory({
    startTransition: movement.startTransition,
    triggerShutter: movement.triggerShutter
  });

  /* useCombat */
  const {
    startCombat,
    handleCombatAction
  } = useCombat();

  useEffect(() => {
    if (!gameState.feedback) return;

    const messageLength = gameState.feedback.message?.length || 0;
    const duration = Math.max(3500, messageLength * 80);

    const timer = setTimeout(() => {
      actions.clearFeedback();
    }, duration);

    return () => clearTimeout(timer);
  }, [gameState.feedback, actions]);

  useEffect(() => {
    if (!gameState.unlockedDirection) return;

    const timer = setTimeout(() => {
      actions.clearUnlockHighlight();
    }, 2500);

    return () => clearTimeout(timer);
  }, [gameState.unlockedDirection, actions]);

  useEffect(() => {
    const targetRoom = gameState.rooms[movement.sceneTitleProps.id];
    playAmbientLoop(targetRoom?.audioLoop || null, MOVEMENT_SETTINGS.TRANSITION_CROSSFADE_DURATION);
  }, [
    movement.sceneTitleProps.id,
    gameState.rooms,
    playAmbientLoop
  ]);

  useEffect(() => {
    if (currentRoom.narration && gameState.isFirstVisit) {
      let audioStop: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        audioStop = playNarration(currentRoom.narration!.path, currentRoom.narration!.volume);
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        if (audioStop) audioStop();
      };
    }
  }, [
    gameState.currentRoomId,
    gameState.isFirstVisit,
    currentRoom.narration,
    playNarration
  ]);

  const lastProcessedDropTime = useRef<number>(0);

  useEffect(() => {
    if (gameState.latestDrop && gameState.latestDrop.timestamp > lastProcessedDropTime.current) {
      if (ITEMS[gameState.latestDrop.itemId]) {
        lastProcessedDropTime.current = gameState.latestDrop.timestamp;

        playSoundFile("enemy-item-drop.mp3");

        const timer = setTimeout(() => {
          actions.clearDropAnimation();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.latestDrop, playSoundFile, playDropSound, actions]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = currentRoom.videoLoop?.volume ?? 0.4;
    }
  }, [currentRoom.videoLoop?.path, currentRoom.videoLoop?.volume]);

  const inspectRoom = () => {
    movement.triggerShutter(() => {
      actions.setHasInspected(true);
    });

    const room = gameState.rooms[gameState.currentRoomId];
    let desc = "You scan the area.";
    if (room.items.length > 0) {
      const itemNames = room.items.map((id: string) => ITEMS[id].name).join(", ");
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
    viewingItemId,
    setViewingItemId,
    currentRoom,
    ...movement,
    inspectRoom,
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    startCombat,
    handleCombatAction,
    handleUseItem,
    videoRef,
    handleDropOnHotspot,
  };
};
