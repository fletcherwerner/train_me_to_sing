export interface ToleranceProfile {
  id: string;
  cents: number; // max |cents| to count as on the note
  holdFraction: number; // share of the note's frames that must be on the note
  timingMs: number; // max onset error
}

export type MissReason = 'silent' | 'wrong-octave' | 'wrong-note' | 'wavered' | 'early' | 'late';

export interface NoteResult {
  index: number;
  targetMidi: number;
  hit: boolean;
  reason?: MissReason; // set when hit is false
  medianCents: number | null;
  heldFraction: number;
  onsetErrorMs: number | null;
}

export interface AttemptResult {
  notes: NoteResult[];
  score: number; // hits / notes, 0..1
  passed: boolean; // score >= passScore
}
