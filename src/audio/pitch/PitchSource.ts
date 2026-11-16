export interface PitchFrame {
  tSec: number;
  midi: number | null;
  clarity: number;
  rms: number;
}

export interface PitchSource {
  start(): Promise<void>;
  stop(): void;
  subscribe(cb: (f: PitchFrame) => void): () => void;
  /** Called once if the source stops producing input by itself (the mic was unplugged). Returns unsubscribe. */
  onLost?(cb: () => void): () => void;
}
