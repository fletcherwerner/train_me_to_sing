import type { ResolvedNote } from '../../core/exercise/types';
import './NowSinging.css';

export interface NowSingingProps {
  notes: ResolvedNote[];
  /** Index of the note being sung, or null before the first note. */
  currentIndex: number | null;
}

/** Large lyric line: current syllable bold, previous one and next two lighter. */
export function NowSinging({ notes, currentIndex }: NowSingingProps) {
  const cur = currentIndex ?? -1;
  const at = (i: number) => (i >= 0 && i < notes.length ? notes[i].lyric ?? '' : '');
  return (
    <p className="now-singing" data-testid="now-singing" aria-live="off">
      <span className="now-singing__prev" data-testid="now-prev">{at(cur - 1)}</span>
      <span className="now-singing__current" data-testid="now-current">{at(cur)}</span>
      <span className="now-singing__next">{at(cur + 1)}</span>
      <span className="now-singing__next">{at(cur + 2)}</span>
    </p>
  );
}
