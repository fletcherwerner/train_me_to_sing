import { createStallDetector } from '../core/session/stallDetector';

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

/** Must be called from a click/tap handler. */
export async function unlockAudio(): Promise<void> {
  await getAudioContext().resume();
}

export function now(): number {
  return getAudioContext().currentTime;
}

// Clock rule: musical timing always uses the audio clock. The watchdog and the
// resume timeout below are the ONLY places wall time (setTimeout, performance.now)
// is used, because they exist to detect that the audio clock has stopped.

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resumes the context from a tap and confirms the clock is really advancing. Never throws. */
export async function ensureAudioRunning(timeoutMs = 1500): Promise<boolean> {
  try {
    const c = getAudioContext();
    const resumed = await Promise.race([
      c.resume().then(
        () => true,
        () => false,
      ),
      wait(timeoutMs).then(() => false),
    ]);
    if (!resumed || c.state !== 'running') return false;
    const t0 = c.currentTime;
    const deadline = performance.now() + 300;
    while (performance.now() < deadline) {
      if (c.currentTime > t0) return true;
      await wait(20);
    }
    return c.currentTime > t0;
  } catch {
    return false;
  }
}

/** Calls onStall once if the audio clock stops advancing. Returns a stop function. */
export function watchAudioClock(
  onStall: () => void,
  opts: { intervalMs?: number; stallMs?: number } = {},
): () => void {
  const { intervalMs = 250, stallMs = 1000 } = opts;
  const c = getAudioContext();
  const detector = createStallDetector(stallMs);
  const id = setInterval(() => {
    const stalled = c.state !== 'running' || detector.sample(c.currentTime, performance.now());
    if (stalled) {
      clearInterval(id);
      onStall();
    }
  }, intervalMs);
  return () => clearInterval(id);
}

declare global {
  interface Window {
    __tmtsTest?: { suspendAudio(): Promise<void>; resumeAudio(): Promise<void>; loseMic(): void };
  }
}

let loseMicHook: (() => void) | null = null;
/** Used by the synthetic pitch source so the test hook can disconnect it. */
export function setLoseMicHook(fn: (() => void) | null): void {
  loseMicHook = fn;
}

if (typeof window !== 'undefined') {
  const hash = window.location.hash;
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
  if (new URLSearchParams(q).has('sim') || new URLSearchParams(window.location.search).has('sim')) {
    window.__tmtsTest = {
      suspendAudio: () => getAudioContext().suspend(),
      resumeAudio: () => getAudioContext().resume(),
      loseMic: () => loseMicHook?.(),
    };
  }
}
