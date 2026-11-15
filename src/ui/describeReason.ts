import type { NoteResult } from '../core/scoring/types';

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
    case 'early':
      return 'Came in early';
    case 'late':
      return 'Came in late';
    default:
      return '';
  }
}
