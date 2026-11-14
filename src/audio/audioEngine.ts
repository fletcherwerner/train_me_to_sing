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
