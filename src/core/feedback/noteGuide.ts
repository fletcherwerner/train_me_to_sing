/** The note guide's maths: is the singer above or below the note, and by how much. Pure. */

export type GuideDirection = 'up' | 'down';

export type GuideState =
  | { kind: 'silent' }
  | { kind: 'on'; cents: number }
  | { kind: 'octave'; direction: GuideDirection }
  | { kind: 'near'; direction: GuideDirection; cents: number }
  | { kind: 'far'; direction: GuideDirection; semitones: number };

/** Extra cents of slack before the guide leaves "on it" (stops flicker at the tolerance edge). */
export const GUIDE_HYSTERESIS_CENTS = 5;

/**
 * `cents` is the sung pitch minus the target. `direction` is what the singer should do: 'up' when too low.
 * `wasOn` applies the hysteresis.
 */
export function guideState(cents: number | null, toleranceCents: number, wasOn = false): GuideState {
  if (cents === null) return { kind: 'silent' };
  const abs = Math.abs(cents);
  const limit = wasOn ? toleranceCents + GUIDE_HYSTERESIS_CENTS : toleranceCents;
  if (abs <= limit) return { kind: 'on', cents };
  const direction: GuideDirection = cents < 0 ? 'up' : 'down';
  // Same note, wrong octave: within tolerance of the target ±12 or ±24 semitones.
  for (const octaves of [1, 2]) {
    if (Math.abs(abs - 1200 * octaves) <= toleranceCents) return { kind: 'octave', direction };
  }
  if (abs < 100) return { kind: 'near', direction, cents };
  return { kind: 'far', direction, semitones: Math.round(abs / 100) };
}

/** Where the dot sits, −1..1 (+ above the line). Piecewise linear: small errors show, big ones still fit. */
export function guideOffset(cents: number): number {
  const abs = Math.abs(cents);
  let o: number;
  if (abs <= 100) o = (abs / 100) * 0.45;
  else if (abs <= 700) o = 0.45 + ((abs - 100) / 600) * 0.5;
  else o = 0.95;
  // A sung pitch above the target (cents > 0) is above the line.
  return cents < 0 ? -o : o;
}

/** Offset for a state: octave states sit at the edge on the octave's side. */
export function guideStateOffset(s: GuideState, cents: number | null): number | null {
  if (s.kind === 'silent' || cents === null) return null;
  if (s.kind === 'octave') return s.direction === 'up' ? -0.95 : 0.95;
  return guideOffset(cents);
}

export function guideText(s: GuideState): string {
  switch (s.kind) {
    case 'silent':
      return 'Sing to see your dot';
    case 'on':
      return 'On it';
    case 'octave':
      return s.direction === 'up'
        ? 'Right note, but an octave too low: try higher'
        : 'Right note, but an octave too high: try lower';
    case 'near': {
      const n = Math.round(s.cents);
      const num = `(${n < 0 ? '−' : '+'}${Math.abs(n)} cents)`;
      return s.direction === 'up' ? `A little low: go up ${num}` : `A little high: come down ${num}`;
    }
    case 'far': {
      const notes = `${s.semitones} ${s.semitones === 1 ? 'note' : 'notes'}`;
      return s.direction === 'up' ? `About ${notes} too low: go up` : `About ${notes} too high: come down`;
    }
  }
}
