export interface PitchFrame {
  tSec: number;
  midi: number | null;
  /** The live display's value: a shorter median than `midi`, so it reacts faster. Absent on simulated frames; use `midi`. */
  midiFast?: number | null;
  clarity: number;
  rms: number;
}

export interface PitchSource {
  start(): Promise<void>;
  stop(): void;
  subscribe(cb: (f: PitchFrame) => void): () => void;
  /** Called once if the source stops producing input by itself (the mic was unplugged). Returns unsubscribe. */
  onLost?(cb: () => void): () => void;
  /** The live microphone stream, for recording a take. Absent on simulated sources. */
  getStream?(): MediaStream | null;
}
