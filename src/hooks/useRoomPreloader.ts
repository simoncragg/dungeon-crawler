import { useEffect, useRef } from 'react';
import { preloadRoomAssets, preloadAssets } from '../utils/assetLoader';
import { WORLD, DIRECTIONS } from '../data/gameData';
import type { Direction } from '../types';

export const useRoomPreloader = (currentRoomId: string, inventoryItems: (string | null)[]) => {
  const preloadedRooms = useRef<Set<string>>(new Set());

  const hasPreloadedRoom = (roomId: string) => preloadedRooms.current.has(roomId);
  const markRoomAsPreloaded = (roomId: string) => preloadedRooms.current.add(roomId);

  useEffect(() => {
    const currentRoom = WORLD[currentRoomId];
    if (!currentRoom) return;

    DIRECTIONS.forEach((dir: Direction) => {
      const exitId = currentRoom.exits[dir];
      if (!exitId) return;

      const lockInfo = currentRoom.lockedExits?.[dir];
      let shouldPreload = true;

      if (lockInfo) {
        const hasKey = inventoryItems.includes(lockInfo.keyId);
        if (!hasKey) {
          shouldPreload = false;
        }
      }

      if (shouldPreload) {
        if (currentRoom.transitionVideos && currentRoom.transitionVideos[dir]) {
          preloadAssets([currentRoom.transitionVideos[dir]!]).catch(console.warn);
        }

        if (!hasPreloadedRoom(exitId)) {
          markRoomAsPreloaded(exitId);
          const preLoadFn = () => preloadRoomAssets(exitId).catch(console.warn);
          if ("requestIdleCallback" in window) {
            requestIdleCallback(preLoadFn);
          } else {
            setTimeout(preLoadFn, 100);
          }
        }
      }
    });

  }, [currentRoomId, inventoryItems]);
};

