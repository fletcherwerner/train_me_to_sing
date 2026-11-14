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
}
