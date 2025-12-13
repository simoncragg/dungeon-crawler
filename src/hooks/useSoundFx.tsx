import { getAudioContext, getBuffer, setBuffer, decodeAudioData } from "../utils/audioSystem";

let currentAmbientSource: AudioBufferSourceNode | null = null;
let currentAmbientUrl: string | null = null;

const createNoiseBuffer = (ctx: AudioContext, duration: number, key: string) => {
  const existing = getBuffer(key);
  if (existing) return existing;

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  setBuffer(key, buffer);
  return buffer;
};

const playShuffleSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime;

  // White Noise Footstep
  const buffer = createNoiseBuffer(ctx, 0.1, "shuffle");

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
};

const playItemSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime;

  const buffer = createNoiseBuffer(ctx, 0.3, "item");

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1;
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.linearRampToValueAtTime(1200, t + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(1.0, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
};

const playAudioFromUrl = async (url: string, volume: number = 1.0, loop: boolean = false): Promise<{ source: AudioBufferSourceNode, gain: GainNode } | null> => {
  const ctx = getAudioContext();
  if (!ctx) return null;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    let audioBuffer = getBuffer(url);

    if (!audioBuffer) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await decodeAudioData(arrayBuffer);
      setBuffer(url, audioBuffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);

    return { source, gain };
  } catch (error) {
    console.error(`Failed to play audio from ${url}:`, error);
    return null;
  }
};

const playAmbientLoop = async (audioLoop: string | null) => {
  if (currentAmbientUrl === audioLoop) return;
  currentAmbientUrl = audioLoop;

  if (currentAmbientSource) {
    currentAmbientSource.stop();
    currentAmbientSource = null;
  }

  if (!audioLoop) return;

  const result = await playAudioFromUrl(audioLoop, 0.3, true);

  if (currentAmbientUrl !== audioLoop) {
    if (result) {
      result.source.stop();
    }
    return;
  }

  if (result) {
    currentAmbientSource = result.source;
  }
};

const playSoundFile = (audioFilename: string, volume: number = 0.5) => {
  let source: AudioBufferSourceNode | null = null;
  let isCancelled = false;

  playAudioFromUrl(`/audio/${audioFilename}`, volume).then((result) => {
    if (isCancelled) {
      if (result) {
        try {
          result.source.stop();
        } catch {
          // Ignore
        }
      }
      return;
    }
    if (result) {
      source = result.source;
    }
  });

  return () => {
    isCancelled = true;
    if (source) {
      try {
        source.stop();
      } catch {
        // Ignore
      }
    }
  };
};

const playNarration = (url: string, volume: number = 1.0, onEnded?: () => void) => {
  let sourceNode: AudioBufferSourceNode | null = null;
  let isCancelled = false;

  playAudioFromUrl(url, volume).then((result) => {
    if (isCancelled) {
      if (result) {
        try {
          result.source.stop();
        } catch {
          // Ignore
        }
      }
      return;
    }

    if (result) {
      sourceNode = result.source;
      if (onEnded) {
        sourceNode.onended = onEnded;
      }
    } else {
      // Failed to play
      if (onEnded) onEnded();
    }
  });

  return () => {
    isCancelled = true;
    if (sourceNode) {
      try {
        sourceNode.stop();
        sourceNode.onended = null; // Prevent callback
      } catch {
        // Ignore
      }
    }
  };
};

const useSoundFx = () => {
  return {
    playAmbientLoop,
    playShuffleSound,
    playItemSound,
    playSoundFile,
    playNarration,
  };
};

export default useSoundFx;
