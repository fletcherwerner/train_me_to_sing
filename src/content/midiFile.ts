import { Midi } from '@tonejs/midi';
import type { RawMidiTrack } from '../core/exercise/fromMidi';

export interface ParsedMidiFile {
  tempoBpm: number;
  beatsPerBar: number;
  tracks: RawMidiTrack[]; // only tracks that have notes
}

export const DEFAULT_TEMPO = 100;

/** Parses MIDI bytes. Ticks are converted to beats (quarter notes) with the file's PPQ. Throws on invalid files. */
export function parseMidiFile(bytes: ArrayBuffer | Uint8Array): ParsedMidiFile {
  const midi = new Midi(bytes);
  const ppq = midi.header.ppq || 480;
  const tempo = midi.header.tempos[0]?.bpm;
  const sig = midi.header.timeSignatures[0]?.timeSignature;
  const tracks: RawMidiTrack[] = [];
  midi.tracks.forEach((t, i) => {
    if (t.notes.length === 0) return;
    tracks.push({
      name: t.name?.trim() || `Track ${i + 1}`,
      notes: t.notes.map((n) => ({ midi: n.midi, startBeat: n.ticks / ppq, durationBeats: n.durationTicks / ppq })),
    });
  });
  return {
    tempoBpm: tempo ? Math.round(tempo) : DEFAULT_TEMPO,
    beatsPerBar: sig && sig[0] > 0 ? sig[0] : 4,
    tracks,
  };
}
