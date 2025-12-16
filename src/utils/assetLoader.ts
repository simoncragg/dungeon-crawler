import { ITEMS, WORLD } from "../data/gameData";
import { getEnemyImage } from "../reducers/gameReducer";
import { decodeAudioData, setBuffer } from "./audioSystem";

export const getRoomAssets = (roomId: string): string[] => {
  const assets: Set<string> = new Set();
  const room = WORLD[roomId];

  if (!room) return [];

  if (room.image) assets.add(room.image);
  if (room.audioLoop) assets.add(room.audioLoop);
  if (room.videoLoop?.path) assets.add(room.videoLoop.path);
  if (room.narration?.path) assets.add(room.narration.path);

  // Unlocked exit images
  if (room.lockedExits) {
    Object.values(room.lockedExits).forEach(locked => {
      if (locked.unlockImage) assets.add(locked.unlockImage);
    });
  }

  // Enemy images
  if (room.enemy) {
    assets.add(getEnemyImage(room.enemy.id, "IDLE"));
    assets.add(getEnemyImage(room.enemy.id, "DAMAGE"));
    assets.add(getEnemyImage(room.enemy.id, "BLOCK"));
    assets.add(getEnemyImage(room.enemy.id, "ATTACK"));
  }

  // items
  if (room.items) {
    room.items.forEach(itemId => {
      const item = ITEMS[itemId];
      if (item.image) {
        assets.add(item.image);
      }

      if (item.sounds) {
        Object.values(item.sounds).forEach(sound => {
          assets.add(`/audio/${sound}`);
        });
      }
    });
  }

  return Array.from(assets);
};

export const getInitialAssets = (): string[] => {
  const assets: Set<string> = new Set();

  // Title Screen Audio
  assets.add("/audio/boom.mp3");

  // Intro Audio
  assets.add("/audio/narration/intro.mp3");

  // Global sounds
  assets.add("/audio/inspect.mp3");
  assets.add("/audio/danger.mp3");
  assets.add("/audio/enemy-defeat.mp3");
  assets.add("/audio/battle-music.mp3");
  assets.add("/audio/sword-defeat.mp3");

  // Item Sounds (Global for now, could be lazy loaded but they are small)
  Object.values(ITEMS).forEach(item => {
    if (item.sounds) {
      Object.values(item.sounds).forEach(sound => {
        assets.add(`/audio/${sound}`);
      });
    }
  });

  // Start Room assets
  const startRoomAssets = getRoomAssets("start");
  startRoomAssets.forEach(asset => assets.add(asset));

  return Array.from(assets);
};

// Track loaded assets to prevent duplicate requests
const loadedAssets = new Set<string>();

export const preloadAssets = async (assets: string[], onProgress?: (progress: number) => void) => {
  let loadedCount = 0;
  // Filter out already loaded assets
  const assetsToLoad = assets.filter(src => !loadedAssets.has(src));
  const total = assetsToLoad.length;

  if (total === 0) {
    onProgress?.(100);
    return;
  }

  const updateProgress = () => {
    loadedCount++;
    onProgress?.(Math.round((loadedCount / total) * 100));
  };

  const loadPromises = assetsToLoad.map(async (src) => {
    // Mark as loaded immediately to prevent race conditions
    loadedAssets.add(src);

    // Audio file
    if (src.endsWith('.mp3') || src.endsWith('.wav')) {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await decodeAudioData(arrayBuffer);
        setBuffer(src, audioBuffer);
        updateProgress();
      } catch (e) {
        console.warn(`Failed to load audio: ${src}`, e);
        updateProgress();
      }
    }
    // Video file
    else if (src.endsWith('.mp4')) {
      try {
        // Fetch/Blob approach to force partial cache
        const response = await fetch(src);
        await response.blob();
        updateProgress();
      } catch (e) {
        console.warn(`Failed to preload video: ${src}`, e);
        updateProgress();
      }
    }
    // Image file
    else {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
        updateProgress();
      } catch (e) {
        console.warn(`Failed to decode image: ${src}`, e);
        updateProgress();
      }
    }
  });

  await Promise.all(loadPromises);
};

export const preloadRoomAssets = async (roomId: string) => {
  const assets = getRoomAssets(roomId);
  await preloadAssets(assets);
};

