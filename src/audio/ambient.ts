import { useEffect, useRef } from 'react';
import type { SceneId } from '../data/worlds';

/**
 * Ambient sound is generated live rather than streamed — no audio files, no
 * autoplay, and it only ever exists after the visitor asks for it.
 */
interface Voice {
  root: number;
  filter: number;
  noise: number;
  wave: OscillatorType;
}

const VOICES: Record<SceneId, Voice> = {
  home: { root: 110, filter: 720, noise: 0.05, wave: 'sine' },
  about: { root: 110, filter: 760, noise: 0.05, wave: 'sine' },
  games: { root: 98, filter: 460, noise: 0.1, wave: 'sine' },
  strategy: { root: 130.81, filter: 940, noise: 0.03, wave: 'sine' },
  words: { root: 146.83, filter: 1050, noise: 0.03, wave: 'sine' },
  tech: { root: 123.47, filter: 1500, noise: 0.055, wave: 'triangle' },
  omarchy: { root: 123.47, filter: 1400, noise: 0.05, wave: 'triangle' },
  automation: { root: 116.54, filter: 1250, noise: 0.045, wave: 'triangle' },
  driving: { root: 87.31, filter: 360, noise: 0.17, wave: 'sine' },
  dog: { root: 164.81, filter: 640, noise: 0.075, wave: 'sine' },
  outro: { root: 110, filter: 700, noise: 0.04, wave: 'sine' },
};

type Ctor = typeof AudioContext;
let shared: AudioContext | null = null;

/**
 * Safari on iOS only honours audio that starts inside a real user gesture,
 * and React effects run after the handler returns — so the context is created
 * and resumed straight from the click, then reused for the rest of the visit.
 */
export function primeAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!shared || shared.state === 'closed') shared = new Ctor();
  void shared.resume();
  return shared;
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  noiseGain: GainNode;
  noiseFilter: BiquadFilterNode;
  padFilter: BiquadFilterNode;
  oscs: { osc: OscillatorNode; ratio: number }[];
  teardown: () => void;
}

function buildNoiseBuffer(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    // Cheap pink-ish filtering — softer than white noise.
    b0 = 0.99765 * b0 + white * 0.099;
    b1 = 0.963 * b1 + white * 0.2965;
    b2 = 0.57 * b2 + white * 1.0526;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }
  return buffer;
}

function build(ctx: AudioContext): Graph {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buildNoiseBuffer(ctx);
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 700;
  noiseFilter.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
  noiseSource.start();

  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 900;
  padFilter.connect(master);

  const lfos: OscillatorNode[] = [];
  const oscs = [1, 1.5, 2, 3].map((ratio, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 110 * ratio;
    osc.detune.value = i * 4 - 6;
    const gain = ctx.createGain();
    gain.gain.value = [0.09, 0.05, 0.035, 0.018][i];
    osc.connect(gain).connect(padFilter);

    // Very slow breathing so the pad never sits still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04 + i * 0.017;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    osc.start();
    lfos.push(lfo);
    return { osc, ratio };
  });

  master.gain.setTargetAtTime(0.16, ctx.currentTime, 1.4);

  const teardown = () => {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(0, t, 0.25);
    window.setTimeout(() => {
      for (const { osc } of oscs) {
        try { osc.stop(); } catch { /* already stopped */ }
      }
      for (const lfo of lfos) {
        try { lfo.stop(); } catch { /* already stopped */ }
      }
      try { noiseSource.stop(); } catch { /* already stopped */ }
      master.disconnect();
      // Keep the context itself alive but idle: re-creating one outside a
      // gesture would be blocked on iOS.
      void ctx.suspend();
    }, 900);
  };

  return { ctx, master, noiseGain, noiseFilter, padFilter, oscs, teardown };
}

export function useAmbient(on: boolean, scene: SceneId) {
  const graph = useRef<Graph | null>(null);

  useEffect(() => {
    if (!on) return;
    const ctx = primeAudio();
    if (!ctx) return;
    graph.current = build(ctx);
    return () => {
      graph.current?.teardown();
      graph.current = null;
    };
  }, [on]);

  /* Move the voice toward whichever world is on screen. */
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    const v = VOICES[scene];
    const t = g.ctx.currentTime;
    g.noiseFilter.frequency.setTargetAtTime(v.filter, t, 1.2);
    g.noiseGain.gain.setTargetAtTime(v.noise, t, 1.2);
    g.padFilter.frequency.setTargetAtTime(Math.max(420, v.filter * 0.9), t, 1.2);
    for (const { osc, ratio } of g.oscs) {
      osc.type = v.wave;
      osc.frequency.setTargetAtTime(v.root * ratio, t, 1.6);
    }
  }, [scene, on]);
}
