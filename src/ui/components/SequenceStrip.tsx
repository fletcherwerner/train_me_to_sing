import { useEffect, useRef } from 'react';
import { midiToName } from '../../core/music/notes';
import type { ResolvedNote } from '../../core/exercise/types';
import './SequenceStrip.css';

export interface SequenceStripProps {
  notes: ResolvedNote[];
  currentIndex: number | null;
  results?: (boolean | undefined)[];
}

const PX_PER_SEC = 40;
const MIN_W = 28;

export function SequenceStrip({ notes, currentIndex, results }: SequenceStripProps) {
  const currentRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [currentIndex]);

  return (
    <ol className="sequence-strip" aria-label="Exercise notes">
      {notes.map((n) => {
        const cls = ['sequence-chip'];
        const isCurrent = n.index === currentIndex;
        if (isCurrent) cls.push('sequence-chip--current');
        const r = results?.[n.index];
        if (r === true) cls.push('sequence-chip--hit');
        if (r === false) cls.push('sequence-chip--miss');
        return (
          <li
            key={n.index}
            ref={isCurrent ? currentRef : undefined}
            className={cls.join(' ')}
            data-testid={`chip-${n.index}`}
            aria-current={isCurrent ? 'true' : undefined}
            style={{ width: Math.max(MIN_W, n.durationSec * PX_PER_SEC) }}
          >
            <span className="sequence-chip__name">{midiToName(n.midi)}</span>
            {n.lyric ? <span className="sequence-chip__lyric">{n.lyric}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
