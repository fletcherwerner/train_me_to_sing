import { useEffect, useRef } from 'react';
import { midiToName } from '../../core/music/notes';
import type { ResolvedNote } from '../../core/exercise/types';
import './SequenceStrip.css';

export interface SequenceStripProps {
  notes: ResolvedNote[];
  currentIndex: number | null;
  results?: (boolean | undefined)[];
  /** Accuracy per note (0..1), shown with hit/miss in the results view. */
  accuracies?: (number | undefined)[];
  onChipPress?: (index: number) => void;
  /** Show every chip (results view); the live run caps the strip at three rows. */
  expanded?: boolean;
}

const PX_PER_SEC = 40;
const MIN_W = 28;
const MIN_W_RESULT = 60; // wide enough for "F#3" and "✗ miss" on a phone

export function SequenceStrip({ notes, currentIndex, results, accuracies, onChipPress, expanded }: SequenceStripProps) {
  const currentRef = useRef<HTMLLIElement | null>(null);

  const listRef = useRef<HTMLOListElement | null>(null);

  // Scroll the strip itself (never the page) so the current chip stays visible.
  useEffect(() => {
    const list = listRef.current;
    const chip = currentRef.current;
    if (!list || !chip) return;
    // Live strip: one row scrolling sideways. Expanded strip: wraps, scrolls (if at all) vertically.
    const left = chip.offsetLeft - list.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
  }, [currentIndex]);

  return (
    <ol className={expanded ? 'sequence-strip sequence-strip--expanded' : 'sequence-strip'} aria-label="Exercise notes" ref={listRef}>
      {notes.map((n) => {
        const cls = ['sequence-chip'];
        if (results?.[n.index] !== undefined) cls.push('sequence-chip--result');
        const isCurrent = n.index === currentIndex;
        if (isCurrent) cls.push('sequence-chip--current');
        const r = results?.[n.index];
        if (r === true) cls.push('sequence-chip--hit');
        if (r === false) cls.push('sequence-chip--miss');
        const a = accuracies?.[n.index];
        const accText = a === undefined ? '' : ` · ${Math.round(a * 100)}%`;
        const inner = (
          <>
            <span className="sequence-chip__name">{midiToName(n.midi)}</span>
            {n.lyric ? <span className="sequence-chip__lyric">{n.lyric}</span> : null}
            {r === true ? (
              <span className="sequence-chip__mark" data-testid={`note-accuracy-${n.index}`}>
                ✓ hit{accText}
              </span>
            ) : null}
            {r === false ? (
              <span className="sequence-chip__mark" data-testid={`note-accuracy-${n.index}`}>
                ✗ miss{accText}
              </span>
            ) : null}
          </>
        );
        return (
          <li
            key={n.index}
            ref={isCurrent ? currentRef : undefined}
            className={cls.join(' ')}
            data-testid={`chip-${n.index}`}
            aria-current={isCurrent ? 'true' : undefined}
            // Duration only sets a minimum width; the chip grows to fit its text.
            style={{ minWidth: Math.max(r === undefined ? MIN_W : MIN_W_RESULT, n.durationSec * PX_PER_SEC) }}
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
