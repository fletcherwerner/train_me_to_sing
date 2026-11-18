import { midiToFreq } from '../core/music/notes';
import type { ResolvedExercise } from '../core/exercise/types';
import { getAudioContext, now } from './audioEngine';

/**
 * Records the microphone of one run so the student can echo themselves. In memory only: a take is never
 * stored, and it is dropped when the lesson screen closes.
 */

/** A recording and the audio-clock time it started at. */
export interface RecordedTake {
  blob: Blob;
  startAudioSec: number;
}

export interface TakeRecording {
  /** Ends the recording. Resolves null if nothing usable was recorded. */
  stop(): Promise<RecordedTake | null>;
  /** Ends the recording and throws the audio away. */
  discard(): void;
}

/** Container types in order of preference. iOS Safari records `audio/mp4`; Chrome and Firefox record webm. */
const MIME_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

export function pickMimeType(isSupported: (type: string) => boolean): string | undefined {
  return MIME_TYPES.find((t) => isSupported(t));
}

/** True when this browser can record a stream at all. */
export function canRecordTakes(): boolean {
  return typeof MediaRecorder !== 'undefined';
}

/** Starts recording `stream`. Returns null when recording is unavailable or fails to start. */
export function startTakeRecording(stream: MediaStream): TakeRecording | null {
  if (!canRecordTakes()) return null;
  let rec: MediaRecorder;
  try {
    const mimeType = pickMimeType((t) => MediaRecorder.isTypeSupported(t));
    rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch {
    return null;
  }
  const chunks: Blob[] = [];
  let startAudioSec = now();
  let discarded = false;
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  rec.onstart = () => {
    startAudioSec = now();
  };
  const ended = new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
    rec.onerror = () => resolve();
  });
  try {
    rec.start();
  } catch {
    return null;
  }
  const end = () => {
    if (rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
  };
  return {
    async stop() {
      end();
      await ended;
      if (discarded || chunks.length === 0) return null;
      return { blob: new Blob(chunks, { type: rec.mimeType || chunks[0].type }), startAudioSec };
    },
    discard() {
      discarded = true;
      end();
    },
  };
}

/**
 * Decodes a take and keeps only [fromAudioSec, toAudioSec] (audio-clock times). Returns null if decoding
 * fails or the window is empty, in which case the echo button is hidden.
 */
export async function decodeTake(take: RecordedTake, fromAudioSec: number, toAudioSec: number): Promise<AudioBuffer | null> {
  try {
    const ctx = getAudioContext();
    const decoded = await ctx.decodeAudioData(await take.blob.arrayBuffer());
    return trimBuffer(decoded, fromAudioSec - take.startAudioSec, toAudioSec - take.startAudioSec);
  } catch {
    return null;
  }
}

/** A copy of `buffer` from `fromSec` to `toSec`, clamped to the buffer. Null if the window is empty. */
export function trimBuffer(buffer: AudioBuffer, fromSec: number, toSec: number): AudioBuffer | null {
  const rate = buffer.sampleRate;
  const from = Math.max(0, Math.floor(fromSec * rate));
  const to = Math.min(buffer.length, Math.ceil(toSec * rate));
  if (to - from < rate * 0.1) return null;
  const out = getAudioContext().createBuffer(buffer.numberOfChannels, to - from, rate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.getChannelData(c).set(buffer.getChannelData(c).subarray(from, to));
  }
  return out;
}

/** Test take for `?sim=` runs: a sine at each target pitch, silent between notes, like a perfect singer. */
export function synthTake(ex: ResolvedExercise): AudioBuffer {
  const ctx = getAudioContext();
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(ex.totalSec * rate)), rate);
  const data = buf.getChannelData(0);
  for (const n of ex.notes) {
    const w = (2 * Math.PI * midiToFreq(n.midi)) / rate;
    const from = Math.floor(n.startSec * rate);
    const to = Math.min(data.length, Math.floor((n.startSec + n.durationSec) * rate));
    for (let i = from; i < to; i++) data[i] = 0.3 * Math.sin(w * (i - from));
  }
  return buf;
}
