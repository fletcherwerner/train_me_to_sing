export interface ToleranceProfile {
  id: string;
  cents: number; // max |cents| to count as on the note
  holdFraction: number; // share of the note's frames that must be on the note
  timingMs: number; // max onset error
}

export type MissReason = 'silent' | 'wrong-octave' | 'wrong-note' | 'wavered' | 'early' | 'late' | 'scooped';

export interface NoteResult {
  index: number;
  targetMidi: number;
  hit: boolean;
  reason?: MissReason; // set when hit is false
  medianCents: number | null;
  heldFraction: number;
  onsetErrorMs: number | null;
  /** The voice slid into this note from at least 70 cents away. A tip, or a miss ('scooped') where the lesson says so. */
  scooped?: boolean;
  /** How closely the sung pitch followed this note, 0..1 (see accuracy.ts). */
  accuracy?: number;
}

export interface AttemptResult {
  notes: NoteResult[];
  score: number; // hits / notes, 0..1
  passed: boolean; // score >= passScore
  /** Mean of the notes' accuracies, 0..1. Does not affect `passed`. */
  accuracy?: number;
}
