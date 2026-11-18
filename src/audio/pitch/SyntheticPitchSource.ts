import { now, setLoseMicHook } from '../audioEngine';
import type { PitchFrame, PitchSource } from './PitchSource';

export type SynthBehaviour = (tSec: number) => number | null;
/** Optional per-frame input level; default 0.1. */
export type SynthRms = (tSec: number) => number;

export function createSyntheticPitchSource(
  behaviour: SynthBehaviour,
  rmsAt?: SynthRms,
): PitchSource & { loseForTest(): void } {
  const listeners = new Set<(f: PitchFrame) => void>();
  const lostListeners = new Set<() => void>();
  let animFrameId: number | null = null;
  let running = false;
  let lost = false;
  let lastTime: number | null = null;

  function tick() {
    if (!running || lost) return;
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
      rms: rmsAt ? rmsAt(t + elapsed) : 0.1,
    };
    for (const cb of listeners) cb(frame);
    animFrameId = requestAnimationFrame(tick);
  }

  /** Simulates the microphone disconnecting. Used by window.__tmtsTest.loseMic(). */
  function lose() {
    if (lost) return;
    lost = true;
    running = false;
    if (animFrameId != null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    for (const cb of [...lostListeners]) cb();
    lostListeners.clear();
  }

  async function start(): Promise<void> {
    running = true;
    lost = false;
    lastTime = null;
    setLoseMicHook(lose);
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

  function onLost(cb: () => void) {
    lostListeners.add(cb);
    return () => lostListeners.delete(cb);
  }

  return { start, stop, subscribe, onLost, loseForTest: lose };
}

export function constantPitch(midi: number): SynthBehaviour {
  return () => midi;
}
