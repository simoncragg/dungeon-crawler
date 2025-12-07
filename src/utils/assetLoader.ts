import { ITEMS, WORLD } from "../data/gameData";
import { getEnemyImage } from "../reducers/gameReducer";

export const getGameAssets = (): string[] => {
  const assets: Set<string> = new Set();

  // Title Screen Audio
  assets.add("/audio/boom.mp3");

  // World Images & Audio
  Object.values(WORLD).forEach(room => {
    if (room.image) assets.add(room.image);
    if (room.audioLoop) assets.add(room.audioLoop);

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
  });

  // Item Sounds
  Object.values(ITEMS).forEach(item => {
    if (item.sounds) {
      Object.values(item.sounds).forEach(sound => {
        assets.add(`/audio/${sound}`);
      });
    }
  });

  // Miscellaneous sounds
  assets.add("/audio/danger.mp3");
  assets.add("/audio/enemy-defeat.mp3");
  assets.add("/audio/battle-music.mp3");

  return Array.from(assets);
};

import { decodeAudioData, setBuffer } from "./audioSystem";

export const preloadAssets = async (assets: string[], onProgress: (progress: number) => void) => {
  let loaded = 0;
  const total = assets.length;

  const updateProgress = () => {
    loaded++;
    onProgress(Math.round((loaded / total) * 100));
  };

  const loadPromises = assets.map(async (src) => {
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
    // Image file
    else {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
        updateProgress();
      } catch (e) {
        console.warn(`Failed to decode image: ${src}`, e);
        // Still count as progress so we don't hang
        updateProgress();
      }
    }
  });

  await Promise.all(loadPromises);
};
