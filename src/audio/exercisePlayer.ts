import type { ResolvedExercise } from '../core/exercise/types';
import { buildTimeline, LEAD_IN_CLICKS } from '../core/exercise/timeline';
import { now } from './audioEngine';
import { scheduleClick, stopClicks } from './metronome';
import { createTonePlayer, type TonePlayer } from './tonePlayer';

export { LEAD_IN_CLICKS };

export interface PlaybackOptions {
  playMelody: boolean; // false in "You do"
  metronome: boolean;
  playStartNote: boolean; // play the first note for 1 beat before the lead-in
}

export interface PlaybackHandle {
  startSec: number; // audio-clock time of exercise beat 0
  endSec: number;
  stop(): void;
  done: Promise<void>; // resolves at endSec, or when stopped
}

let tonePlayer: TonePlayer | null = null;

/** Plays one note now (used when the student taps a chip). */
export function playPreviewNote(midi: number, durationSec = 0.8): void {
  tonePlayer ??= createTonePlayer();
  tonePlayer.playNote(midi, now() + 0.02, durationSec);
}
let current: PlaybackHandle | null = null;

export function playExercise(ex: ResolvedExercise, opts: PlaybackOptions): PlaybackHandle {
  tonePlayer ??= createTonePlayer();
  const player = tonePlayer;
  current?.stop();

  const beat = 60 / ex.tempoBpm;
  const t0 = now() + 0.2;
  const tl = buildTimeline(ex, opts, t0);

  if (tl.startNoteSec !== null && ex.notes.length > 0) {
    player.playNote(ex.notes[0].midi, tl.startNoteSec, beat);
  }
  for (const c of tl.leadInClicks) scheduleClick(c.tSec, c.accent);
  for (const c of tl.exerciseClicks) scheduleClick(c.tSec, c.accent);
  if (opts.playMelody) {
    for (const n of ex.notes) player.playNote(n.midi, tl.startSec + n.startSec, n.durationSec);
  }

  let resolveDone!: () => void;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });
  let finished = false;
  // Non-musical: only resolves the promise; all sound is scheduled on the audio clock.
  const timer = window.setTimeout(
    () => {
      if (finished) return;
      finished = true;
      if (current === handle) current = null;
      resolveDone();
    },
    Math.max(0, (tl.endSec - now()) * 1000) + 50,
  );
  const handle: PlaybackHandle = {
    startSec: tl.startSec,
    endSec: tl.endSec,
    stop() {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      player.stopAll();
      stopClicks();
      if (current === handle) current = null;
      resolveDone();
    },
    done,
  };
  current = handle;
  return handle;
}
