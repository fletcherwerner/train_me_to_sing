import { describeMatchMiss, type MatchDescription, type MatchOutcome } from '../core/scoring/matchScoring';
import type { NoteResult } from '../core/scoring/types';

/** "a little flat", "sharp", "about a semitone flat" ... for a number of cents (+ sharp, - flat). */
export function describeCents(cents: number): string {
  const a = Math.abs(cents);
  const dir = cents < 0 ? 'flat' : 'sharp';
  if (a <= 10) return 'right on';
  if (a <= 30) return `a little ${dir}`;
  if (a <= 60) return dir;
  if (a >= 85) return `about a semitone ${dir}`;
  return `far ${dir}`;
}

const signed = (cents: number) => `${cents < 0 ? '−' : '+'}${Math.round(Math.abs(cents))} cents`;

/** One line for a match target, in the run list and the results list. */
export function describeMatchLine(outcome: MatchOutcome, d: MatchDescription | undefined): string {
  const cents = d && d.typicalCents !== null ? `${describeCents(d.typicalCents)} (${signed(d.typicalCents)})` : null;
  if (outcome.matched) {
    const parts = [`✓ Found in ${(outcome.timeToMatchSec ?? 0).toFixed(1)} s`];
    if (d && d.onAfterFound !== null) parts.push(`on the note ${Math.round(d.onAfterFound * 100)}% after that`);
    if (cents) parts.push(cents);
    return parts.join(' · ');
  }
  if (outcome.reason === 'wrong-note' && cents) return `✗ Not found · mostly ${cents}`;
  return `✗ Not found · ${describeMatchMiss(outcome.reason)}`;
}

export function describeReason(r: NoteResult): string {
  switch (r.reason) {
    case 'silent':
      return 'No sound detected';
    case 'wrong-octave':
      return 'Right note, wrong octave';
    case 'wrong-note': {
      const c = Math.round(Math.abs(r.medianCents ?? 0));
      return (r.medianCents ?? 0) > 0 ? `Sharp by ${c} cents` : `Flat by ${c} cents`;
    }
    case 'wavered':
      return 'Drifted off the note';
    case 'scooped':
      return 'You slid into this note. Try to start right on it.';
    case 'early':
      return 'Came in early';
    case 'late':
      return 'Came in late';
    default:
      return '';
  }
}
