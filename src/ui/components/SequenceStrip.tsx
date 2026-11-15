import { useEffect, useRef } from 'react';
import { midiToName } from '../../core/music/notes';
import type { ResolvedNote } from '../../core/exercise/types';
import './SequenceStrip.css';

export interface SequenceStripProps {
  notes: ResolvedNote[];
  currentIndex: number | null;
  results?: (boolean | undefined)[];
  onChipPress?: (index: number) => void;
}

const PX_PER_SEC = 40;
const MIN_W = 28;
const MIN_W_RESULT = 60; // wide enough for "F#3" and "✗ miss" on a phone

export function SequenceStrip({ notes, currentIndex, results, onChipPress }: SequenceStripProps) {
  const currentRef = useRef<HTMLLIElement | null>(null);

  const listRef = useRef<HTMLOListElement | null>(null);

  // Scroll the strip itself (never the page) so the current chip stays visible.
  useEffect(() => {
    const list = listRef.current;
    const chip = currentRef.current;
    if (!list || !chip) return;
    const top = chip.offsetTop;
    const bottom = top + chip.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [currentIndex]);

  return (
    <ol className="sequence-strip" aria-label="Exercise notes" ref={listRef}>
      {notes.map((n) => {
        const cls = ['sequence-chip'];
        const isCurrent = n.index === currentIndex;
        if (isCurrent) cls.push('sequence-chip--current');
        const r = results?.[n.index];
        if (r === true) cls.push('sequence-chip--hit');
        if (r === false) cls.push('sequence-chip--miss');
        const inner = (
          <>
            <span className="sequence-chip__name">{midiToName(n.midi)}</span>
            {n.lyric ? <span className="sequence-chip__lyric">{n.lyric}</span> : null}
            {r === true ? <span className="sequence-chip__mark">✓ hit</span> : null}
            {r === false ? <span className="sequence-chip__mark">✗ miss</span> : null}
          </>
        );
        return (
          <li
            key={n.index}
            ref={isCurrent ? currentRef : undefined}
            className={cls.join(' ')}
            data-testid={`chip-${n.index}`}
            aria-current={isCurrent ? 'true' : undefined}
            style={{ width: Math.max(r === undefined ? MIN_W : MIN_W_RESULT, n.durationSec * PX_PER_SEC) }}
          >
            {onChipPress ? (
              <button
                type="button"
                className="sequence-chip__button"
                aria-label={`Play ${midiToName(n.midi)}`}
                onClick={() => onChipPress(n.index)}
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
