
let globalAudioCtx: AudioContext | null = null;
const bufferCache: Record<string, AudioBuffer> = {};
let currentAmbientSource: AudioBufferSourceNode | null = null;

const createNoiseBuffer = (ctx: AudioContext, duration: number, key: string) => {
  if (bufferCache[key]) return bufferCache[key];

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  bufferCache[key] = buffer;
  return buffer;
};

const useSoundFx = () => {

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!globalAudioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) {
        globalAudioCtx = new AudioCtor();
      }
    }
    return globalAudioCtx;
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
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  };

  const playSwordSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const t = ctx.currentTime;

    // 1. Tiny Impact Click (Immediate attack)
    const buffer = createNoiseBuffer(ctx, 0.01, "sword_impact");

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    // 2. The "Ring" - High pitched sines (Original)
    const freqs = [1200, 2500, 4500];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      // Faster attack for "velocity"
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + (i * 0.2));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1);
    });
  };

  const playAudioFromUrl = async (url: string, volume: number = 1.0, loop: boolean = false): Promise<{ source: AudioBufferSourceNode, gain: GainNode } | null> => {
    const ctx = getAudioContext();
    if (!ctx) return null;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    try {
      let audioBuffer = bufferCache[url];

      if (!audioBuffer) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferCache[url] = audioBuffer;
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
    if (currentAmbientSource) {
      currentAmbientSource.stop();
      currentAmbientSource = null;
    }

    if (!audioLoop) return;

    const result = await playAudioFromUrl(audioLoop, 0.3, true);
    if (result) {
      currentAmbientSource = result.source;
    }
  };

  const playBoomSound = async () => {
    await playAudioFromUrl("/audio/boom.mp3", 0.5);
  };

  return {
    playAmbientLoop,
    playShuffleSound,
    playItemSound,
    playSwordSound,
    playBoomSound
  };
};

export default useSoundFx;
