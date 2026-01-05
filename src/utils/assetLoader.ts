import { ITEMS, WORLD } from "../data/gameData";
import { getEnemyImage } from "./gameUtils";
import { decodeAudioData, setBuffer } from "./audioSystem";
import type { Room, SoundAsset, NarrationAsset, Direction } from "../types";

const getAssetPath = (asset: string | SoundAsset | NarrationAsset): string => {
  if (typeof asset === 'string') return asset;
  return asset.path;
};

const getExitAssets = (room: Room, assets: Set<string>, inventoryItems: (string | null)[] = []) => {
  if (room.lockedExits) {
    Object.values(room.lockedExits).forEach(locked => {
      if (inventoryItems.includes(locked.keyId)) {
        if (locked.unlockImage) assets.add(locked.unlockImage);
        if (locked.unlockVideoLoop) assets.add(getAssetPath(locked.unlockVideoLoop));
        if (locked.unlockAudioLoop) assets.add(getAssetPath(locked.unlockAudioLoop));
      }
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
    assets.add(getEnemyImage(id, "DEFEAT"));
  }
};

const getItemAssets = (room: Room, assets: Set<string>, roomId: string, inventoryItems?: (string | null)[]) => {
  if (room.items) {
    room.items.forEach((itemId: string) => {
      const item = ITEMS[itemId];
      if (item.image) assets.add(item.image);

      if (item.useVideos?.[roomId]) {
        assets.add(getAssetPath(item.useVideos[roomId]));
      }

      if (item.sounds) {
        Object.values(item.sounds).forEach(sound => {
          if (typeof sound === 'string') {
            assets.add(`/audio/${sound}`);
          } else {
            assets.add(getAssetPath(sound));
          }
        });
      }
    });
  }

  if (inventoryItems) {
    inventoryItems.forEach(itemId => {
      if (!itemId) return;
      const item = ITEMS[itemId];

      if (item.useVideos?.[roomId]) {
        assets.add(getAssetPath(item.useVideos[roomId]));
      }

      if (item.sounds) {
        Object.values(item.sounds).forEach(sound => {
          if (typeof sound === 'string') {
            assets.add(`/audio/${sound}`);
          } else {
            assets.add(getAssetPath(sound));
          }
        });
      }
    });
  }
};

export const getRoomAssets = (roomId: string, inventoryItems?: (string | null)[]): string[] => {
  const assets: Set<string> = new Set();
  const room = WORLD[roomId];

  if (!room) return [];

  if (room.image) assets.add(room.image);
  if (room.audioLoop) assets.add(getAssetPath(room.audioLoop));
  if (room.videoLoop) assets.add(getAssetPath(room.videoLoop));
  if (room.narration) assets.add(getAssetPath(room.narration));

  if (room.transitionVideos) {
    Object.entries(room.transitionVideos).forEach(([dir, video]) => {
      const lockInfo = room.lockedExits?.[dir as Direction];
      const items = inventoryItems || [];
      const hasKey = lockInfo ? items.includes(lockInfo.keyId) : true;

      if (hasKey) {
        assets.add(getAssetPath(video));
      }
    });
  }

  getExitAssets(room, assets, inventoryItems);
  getEnemyAssets(room, assets);
  getItemAssets(room, assets, roomId, inventoryItems);

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
  assets.add("/audio/sword-take.wav");
};

export const getInitialAssets = (): string[] => {
  const assets: Set<string> = new Set();

  getGlobalAssets(assets);
  getRoomAssets("start", []).forEach(asset => assets.add(asset));

  return Array.from(assets);
};

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

export const preloadRoomAssets = async (roomId: string, inventoryItems?: (string | null)[]) => {
  const assets = getRoomAssets(roomId, inventoryItems);
  await preloadAssets(assets);
};

