import type { AttemptResult, MissReason } from './types';

const PRIORITY: MissReason[] = ['silent', 'wrong-octave', 'wrong-note', 'wavered', 'late', 'early'];

/** One tip, chosen from the most common miss reason (ties go to the earlier in PRIORITY). */
export function pickTip(result: AttemptResult): string {
  const misses = result.notes.filter((n) => !n.hit && n.reason);
  if (misses.length === 0) {
    return 'Nice work. Try again and see if you can keep every note steady.';
  }
  const counts = new Map<MissReason, number>();
  for (const m of misses) counts.set(m.reason as MissReason, (counts.get(m.reason as MissReason) ?? 0) + 1);
  let best: MissReason = PRIORITY[0];
  let bestN = -1;
  for (const r of PRIORITY) {
    // early and late share one tip, so they count together
    const n = (counts.get(r) ?? 0) + (r === 'late' ? (counts.get('early') ?? 0) : 0);
    if (r === 'early') continue;
    if (n > bestN) {
      best = r;
      bestN = n;
    }
  }
  switch (best) {
    case 'wrong-octave':
      return "You're singing the right note in a different octave. Listen to the first note again and match how high it is.";
    case 'wrong-note': {
      const flat = misses.filter((m) => m.reason === 'wrong-note' && (m.medianCents ?? 0) < 0).length;
      const sharp = misses.filter((m) => m.reason === 'wrong-note' && (m.medianCents ?? 0) > 0).length;
      return sharp > flat
        ? 'You tend to land sharp. Watch the meter and nudge down.'
        : 'You tend to land flat. Watch the meter and nudge up.';
    }
    case 'wavered':
      return 'Hold each note steady until the next chip lights.';
    case 'early':
    case 'late':
      return 'Start each note on the click.';
    case 'silent':
      return "We couldn't hear you. Check the mic and sing a little louder.";
  }
}
