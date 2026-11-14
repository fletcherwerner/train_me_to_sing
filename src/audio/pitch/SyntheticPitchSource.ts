import { now } from '../audioEngine';
import type { PitchFrame, PitchSource } from './PitchSource';

export type SynthBehaviour = (tSec: number) => number | null;

export function createSyntheticPitchSource(behaviour: SynthBehaviour): PitchSource {
  const listeners = new Set<(f: PitchFrame) => void>();
  let animFrameId: number | null = null;
  let running = false;
  let lastTime: number | null = null;

  function tick() {
    if (!running) return;
    const t = now();
    // Track elapsed time for the behaviour function
    if (lastTime === null) {
      lastTime = t;
    }
    const elapsed = t - lastTime;
    lastTime = t;
    const midi = behaviour(t + elapsed);
    const frame: PitchFrame = {
      tSec: t,
      midi,
      clarity: 1,
      rms: 0.1,
    };
    for (const cb of listeners) cb(frame);
    animFrameId = requestAnimationFrame(tick);
  }

  async function start(): Promise<void> {
    running = true;
    lastTime = null;
    animFrameId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (animFrameId != null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function subscribe(cb: (f: PitchFrame) => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  return { start, stop, subscribe };
}

export function constantPitch(midi: number): SynthBehaviour {
  return () => midi;
}
