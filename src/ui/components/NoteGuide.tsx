import { useEffect, useRef, useState } from 'react';
import { guideState, guideStateOffset, guideText, type GuideState } from '../../core/feedback/noteGuide';
import './NoteGuide.css';

export interface NoteGuideProps {
  /** Name of the target note, e.g. "E4". Changing it relabels the line and makes the dot jump. */
  target: string;
  /** Sung pitch minus target, in cents; null when there is no voice. */
  cents: number | null;
  toleranceCents: number;
  /** false: show the target line and its name only (I do, or while the piano plays). */
  showDot?: boolean;
  /** Fade the guide in on mount (the Practise rescue). */
  fadeIn?: boolean;
}

const SILENCE_MS = 250;
const TEXT_MIN_MS = 1000;

const dirOf = (s: GuideState): 'up' | 'down' | undefined => ('direction' in s ? s.direction : undefined);

export function NoteGuide({ target, cents, toleranceCents, showDot = true, fadeIn = false }: NoteGuideProps) {
  // Silence is only believed after 250 ms; until then the last voiced value stays.
  const [heldCents, setHeldCents] = useState<number | null>(cents);
  useEffect(() => {
    if (cents !== null) {
      setHeldCents(cents);
      return;
    }
    const t = setTimeout(() => setHeldCents(null), SILENCE_MS);
    return () => clearTimeout(t);
  }, [cents]);

  const wasOn = useRef(false);
  const state = showDot ? guideState(heldCents, toleranceCents, wasOn.current) : null;
  wasOn.current = state?.kind === 'on';

  // The text changes only when the kind or direction does, and at most once a second.
  const kind = state?.kind ?? 'idle';
  const direction = state ? dirOf(state) : undefined;
  const [shown, setShown] = useState<{ text: string }>({ text: state ? guideText(state) : '' });
  const lastTextAt = useRef(0);
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    const apply = () => {
      lastTextAt.current = Date.now();
      const s = latest.current;
      setShown({ text: s ? guideText(s) : '' });
    };
    const wait = lastTextAt.current + TEXT_MIN_MS - Date.now();
    if (wait <= 0) {
      apply();
      return;
    }
    const t = setTimeout(apply, wait);
    return () => clearTimeout(t);
  }, [kind, direction]);

  const offset = state ? guideStateOffset(state, heldCents) : null;
  const bandFraction = Math.min(toleranceCents, 100) * 0.0045 * 0.84;
  const mark = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '';

  return (
    <div
      className={`note-guide${fadeIn ? ' note-guide--fade' : ''}${showDot ? '' : ' note-guide--line'}`}
      data-testid="note-guide"
      data-state={kind}
      data-direction={direction}
    >
      <div className="note-guide__box" role="img" aria-label={shown.text || `Target ${target}`}>
        <div className="note-guide__band" style={{ height: `max(4px, calc(var(--guide-h) * ${bandFraction}))` }} />
        <div className="note-guide__line" />
        <span className="note-guide__note" data-testid="note-guide-note">
          {target}
        </span>
        {offset !== null ? (
          // Keyed on the target so a new note starts the dot in place with no easing.
          <div key={target} className="note-guide__track" style={{ transform: `translateY(calc((var(--guide-h) / 2 - 16px) * ${-offset}))` }}>
            <span className={`note-guide__dot note-guide__dot--${kind}`} data-testid="note-guide-dot">
              {mark ? (
                <span className="note-guide__mark" aria-hidden="true">
                  {mark}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
      {showDot ? (
        <p className={`note-guide__text note-guide__text--${kind}`} data-testid="note-guide-text" aria-live="polite">
          {shown.text}
        </p>
      ) : null}
    </div>
  );
}
