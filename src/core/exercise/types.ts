export interface TemplateNote {
  offset: number; // semitones from the tonic; may be negative
  startBeat: number; // 0-based, quarter note = 1 beat
  durationBeats: number;
  lyric?: string;
}

export interface Phrase {
  startNote: number; // note index, inclusive
  endNote: number; // note index, inclusive
  label: string;
}

export interface ExerciseTemplate {
  id: string;
  title: string;
  tempoBpm: number;
  beatsPerBar: number; // for the beat indicator (the lead-in is always 4 clicks)
  notes: TemplateNote[]; // sorted by startBeat, never overlapping (monophonic)
  phrases?: Phrase[]; // optional practice phrases (note indices, inclusive)
}

export interface StudentRange {
  lowMidi: number;
  highMidi: number;
} // inclusive integers

export interface ResolvedNote {
  index: number;
  midi: number;
  startSec: number; // relative to exercise start
  durationSec: number;
  lyric?: string;
}

export interface ResolvedExercise {
  templateId: string;
  tonicMidi: number;
  tempoBpm: number;
  beatsPerBar: number;
  notes: ResolvedNote[];
  totalSec: number;
}
