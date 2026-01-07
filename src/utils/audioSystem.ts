
let globalAudioCtx: AudioContext | null = null;
const bufferCache: Record<string, AudioBuffer> = {};

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) {
      globalAudioCtx = new AudioCtor();
    }
  }
  return globalAudioCtx;
};

export const getBuffer = (key: string): AudioBuffer | undefined => {
  return bufferCache[key];
};

export const setBuffer = (key: string, buffer: AudioBuffer): void => {
  bufferCache[key] = buffer;
};

export const decodeAudioData = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  if (!ctx) throw new Error("AudioContext not available");
  return await ctx.decodeAudioData(arrayBuffer);
};
