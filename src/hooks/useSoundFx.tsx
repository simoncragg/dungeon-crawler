import { getAudioContext, getBuffer, setBuffer, decodeAudioData } from "../utils/audioSystem";
import type { SoundAsset, NarrationAsset } from "../types";

import { AUDIO_SETTINGS, MOVEMENT_SETTINGS } from "../data/constants";

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

const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number) => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  // RT60 is the time it takes for the sound to decay by 60dB.
  // 60dB decay means a factor of 10^-3 (0.001).
  // e^(-t / tau) = 0.001 => tau = decay / ln(1000) approx decay / 6.91
  const tau = decay / 6.91;

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Exponential decay: e^(-t / tau)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t / tau);
    }
  }

  return impulse;
};

const createReverbConvolver = (ctx: AudioContext, reverb: { wet: number; decay: number }) => {
  const convolver = ctx.createConvolver();
  // Duration should be at least the decay time to capture the full tail
  const duration = Math.max(0.5, reverb.decay);
  const reverbKey = `reverb-${duration}-${reverb.decay}`;

  let impulse = getBuffer(reverbKey);
  if (!impulse) {
    impulse = createReverbImpulse(ctx, duration, reverb.decay);
    setBuffer(reverbKey, impulse);
  }
  convolver.buffer = impulse;

  const wetGain = ctx.createGain();
  wetGain.gain.value = reverb.wet;

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;

  return { convolver, wetGain, dryGain };
};


const playShuffleSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime;
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

const playDropSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime;
  const buffer = createNoiseBuffer(ctx, 0.4, "drop");
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
};

interface AmbientTrack {
  source: AudioBufferSourceNode;
  gain: GainNode;
  url: string;
  isFadingOut?: boolean;
}

let currentAmbient: AmbientTrack | null = null;

const playAmbientLoop = async (audioLoop: SoundAsset | null, fadeDuration: number | null = null) => {
  if (currentAmbient?.url === audioLoop?.path && !currentAmbient?.isFadingOut) return;

  const crossFadeDuration = fadeDuration ?? MOVEMENT_SETTINGS.TRANSITION_CROSSFADE_DURATION;
  const ctx = getAudioContext();
  if (!ctx) return;

  const previousAmbient = currentAmbient;
  if (previousAmbient) {
    fadeOutAmbientLoop(previousAmbient, crossFadeDuration, ctx);
  }

  if (!audioLoop) {
    currentAmbient = null;
    return;
  }

  const targetVolume = audioLoop.volume ?? AUDIO_SETTINGS.DEFAULT_AMBIENT_VOLUME;
  const startVolume = crossFadeDuration > 0 ? 0 : targetVolume;
  const result = await playAudioFromUrl(audioLoop.path, startVolume, true);

  if (result) {
    if (currentAmbient !== previousAmbient) {
      try { result.source.stop(); } catch { /* ignore */ }
      return;
    }

    currentAmbient = {
      source: result.source,
      gain: result.gain,
      url: audioLoop.path,
      isFadingOut: false
    };

    if (crossFadeDuration > 0) {
      const t = ctx.currentTime;
      result.gain.gain.setValueAtTime(0, t);
      result.gain.gain.linearRampToValueAtTime(targetVolume, t + crossFadeDuration);
    }
  }
};

const fadeOutAmbientLoop = (track: AmbientTrack, duration: number, ctx: AudioContext) => {
  track.isFadingOut = true;
  try {
    const t = ctx.currentTime;
    track.gain.gain.cancelScheduledValues(t);
    track.gain.gain.setValueAtTime(track.gain.gain.value, t);

    if (duration > 0) {
      track.gain.gain.linearRampToValueAtTime(0, t + duration);
      track.source.stop(t + duration);
    } else {
      track.gain.gain.value = 0;
      track.source.stop(t);
    }
  } catch (e) {
    console.warn("Error stopping track:", e);
  }
};

const playNarration = (asset: NarrationAsset, onEnded?: () => void) => {
  let sourceNode: AudioBufferSourceNode | null = null;
  let isCancelled = false;

  const volume = asset.volume ?? AUDIO_SETTINGS.DEFAULT_NARRATION_VOLUME;

  playAudioFromUrl(asset.path, volume).then((result) => {
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
        sourceNode.onended = null;
      } catch {
        // Ignore
      }
    }
  };
};

const playSoundFile = (
  audioAsset: SoundAsset,
  options: { volume?: number; reverb?: { wet: number; decay: number } } = {}
) => {
  let source: AudioBufferSourceNode | null = null;
  let isCancelled = false;

  const path = audioAsset.path.startsWith("/") ? audioAsset.path : `/audio/${audioAsset.path}`;
  const finalVolume = options.volume ?? audioAsset.volume ?? AUDIO_SETTINGS.DEFAULT_SFX_VOLUME;

  playAudioFromUrl(path, finalVolume, false, options.reverb).then((result) => {
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

const playAudioFromUrl = async (
  url: string,
  volume: number = 1.0,
  loop: boolean = false,
  reverb?: { wet: number; decay: number }
): Promise<{ source: AudioBufferSourceNode, gain: GainNode } | null> => {
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

    if (reverb) {
      const { convolver, wetGain, dryGain } = createReverbConvolver(ctx, reverb);

      source.connect(dryGain);
      dryGain.connect(gain);

      source.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(ctx.destination);
    source.start(0);

    return { source, gain };
  } catch (error) {
    console.error(`Failed to play audio from ${url}:`, error);
    return null;
  }
};

const useSoundFx = () => {
  return {
    playAmbientLoop,
    playShuffleSound,
    playItemSound,
    playDropSound,
    playSoundFile,
    playNarration,
  };
};

export default useSoundFx;
