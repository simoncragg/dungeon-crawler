import { ITEMS, WORLD } from "../data/gameData";
import { getEnemyImage } from "../reducers/gameReducer";
import { decodeAudioData, setBuffer } from "./audioSystem";
import type { Room } from "../types";

const getExitAssets = (room: Room, assets: Set<string>) => {
  if (room.lockedExits) {
    Object.values(room.lockedExits).forEach(locked => {
      if (locked.unlockImage) assets.add(locked.unlockImage);
    });
  }
};

const getEnemyAssets = (room: Room, assets: Set<string>) => {
  if (room.enemy) {
    const { id } = room.enemy;
    assets.add(getEnemyImage(id, "IDLE"));
    assets.add(getEnemyImage(id, "DAMAGE"));
    assets.add(getEnemyImage(id, "BLOCK"));
    assets.add(getEnemyImage(id, "ATTACK"));
    assets.add(getEnemyImage(id, "TELEGRAPH"));
    assets.add(getEnemyImage(id, "STAGGER"));
  }
};

const getItemAssets = (room: Room, assets: Set<string>) => {
  if (room.items) {
    room.items.forEach((itemId: string) => {
      const item = ITEMS[itemId];
      if (item.image) assets.add(item.image);
      if (item.sounds) {
        Object.values(item.sounds).forEach(sound => {
          assets.add(`/audio/${sound}`);
        });
      }
    });
  }
};

export const getRoomAssets = (roomId: string): string[] => {
  const assets: Set<string> = new Set();
  const room = WORLD[roomId];

  if (!room) return [];

  if (room.image) assets.add(room.image);
  if (room.audioLoop?.path) assets.add(room.audioLoop.path);
  if (room.videoLoop?.path) assets.add(room.videoLoop.path);
  if (room.narration?.path) assets.add(room.narration.path);

  getExitAssets(room, assets);
  getEnemyAssets(room, assets);
  getItemAssets(room, assets);

  return Array.from(assets);
};

const getGlobalAssets = (assets: Set<string>) => {
  assets.add("/audio/boom.mp3");
  assets.add("/audio/narration/intro.mp3");

  assets.add("/audio/inspect.mp3");
  assets.add("/audio/equip.mp3");
  assets.add("/audio/unequip.mp3");

  assets.add("/audio/danger.mp3");
  assets.add("/audio/battle-music.mp3");
  assets.add("/audio/crit-damage.mp3");
  assets.add("/audio/enemy-defeat.mp3");
  assets.add("/audio/enemy-item-drop.mp3");
  assets.add("/audio/swing.mp3");
  assets.add("/audio/sword-defeat.mp3");
  assets.add("/audio/use-key.mp3");
};

export const getInitialAssets = (): string[] => {
  const assets: Set<string> = new Set();

  getGlobalAssets(assets);
  getRoomAssets("start").forEach(asset => assets.add(asset));

  return Array.from(assets);
};

// Track loaded assets and their Object URLs
const assetMap = new Map<string, string>();
const loadedAssets = new Set<string>();

export const getPreloadedUrl = (src: string): string => {
  return assetMap.get(src) || src;
};

const loadAudioAsset = async (src: string): Promise<void> => {
  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await decodeAudioData(arrayBuffer);
    setBuffer(src, audioBuffer);
  } catch (e) {
    console.warn(`Failed to load audio: ${src}`, e);
  }
};

const loadVideoAsset = async (src: string): Promise<void> => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    assetMap.set(src, url);
  } catch (e) {
    console.warn(`Failed to preload video: ${src}`, e);
  }
};

const loadImageAsset = async (src: string): Promise<void> => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    assetMap.set(src, url);

    const img = new Image();
    img.src = url;
    await img.decode();
  } catch (e) {
    console.warn(`Failed to decode image: ${src}`, e);
  }
};

export const preloadAssets = async (assets: string[], onProgress?: (progress: number) => void) => {
  const assetsToLoad = assets.filter(src => !loadedAssets.has(src));
  const total = assetsToLoad.length;

  if (total === 0) {
    onProgress?.(100);
    return;
  }

  let loadedCount = 0;
  const updateProgress = () => {
    loadedCount++;
    onProgress?.(Math.round((loadedCount / total) * 100));
  };

  const loadPromises = assetsToLoad.map(async (src) => {
    loadedAssets.add(src);

    if (src.endsWith('.mp3') || src.endsWith('.wav')) {
      await loadAudioAsset(src);
    } else if (src.endsWith('.mp4')) {
      await loadVideoAsset(src);
    } else {
      await loadImageAsset(src);
    }

    updateProgress();
  });

  await Promise.all(loadPromises);
};

export const preloadRoomAssets = async (roomId: string) => {
  const assets = getRoomAssets(roomId);
  await preloadAssets(assets);
};

