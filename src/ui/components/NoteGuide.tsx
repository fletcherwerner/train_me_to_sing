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
/** A change of state shows in the text after it has held for 2 frames (about 35 ms), so the edges do not flicker. */
const TEXT_HOLD_MS = 35;
/** Only the hidden screen-reader announcement is rate limited. */
const ANNOUNCE_MIN_MS = 1000;
/** The near-case cents number is shown to the nearest 5. */
const CENTS_STEP = 5;

const dirOf = (s: GuideState): 'up' | 'down' | undefined => ('direction' in s ? s.direction : undefined);

const rounded = (s: GuideState): GuideState =>
  s.kind === 'near' ? { ...s, cents: Math.round(s.cents / CENTS_STEP) * CENTS_STEP } : s;

export function NoteGuide({ target, cents, toleranceCents, showDot = true, fadeIn = false }: NoteGuideProps) {
  // Silence is only believed after 250 ms; until then the last voiced value stays. A voiced value is used at once.
  const lastVoiced = useRef<number | null>(cents);
  if (cents !== null) lastVoiced.current = cents;
  const [silenceBelieved, setSilenceBelieved] = useState(false);
  useEffect(() => {
    if (cents !== null) {
      setSilenceBelieved(false);
      return;
    }
    const t = setTimeout(() => setSilenceBelieved(true), SILENCE_MS);
    return () => clearTimeout(t);
  }, [cents]);
  const heldCents = cents ?? (silenceBelieved ? null : lastVoiced.current);

  const wasOn = useRef(false);
  const state = showDot ? guideState(heldCents, toleranceCents, wasOn.current) : null;
  wasOn.current = state?.kind === 'on';

  const kind = state?.kind ?? 'idle';
  const direction = state ? dirOf(state) : undefined;
  const key = `${kind}:${direction ?? ''}`;

  // Visible text: a new kind or direction shows after holding for 2 frames; the cents number inside one state is live.
  const [shownKey, setShownKey] = useState(key);
  useEffect(() => {
    if (key === shownKey) return;
    const t = setTimeout(() => setShownKey(key), TEXT_HOLD_MS);
    return () => clearTimeout(t);
  }, [key, shownKey]);
  const shownState = useRef<GuideState | null>(state);
  if (key === shownKey) shownState.current = state;
  const text = shownState.current ? guideText(rounded(shownState.current)) : '';

  // Screen readers: separate hidden element, at most once a second, and only when the kind or direction changes.
  const [announced, setAnnounced] = useState(text);
  const lastAnnounceAt = useRef(0);
  const latestText = useRef(text);
  latestText.current = text;
  useEffect(() => {
    const apply = () => {
      lastAnnounceAt.current = Date.now();
      setAnnounced(latestText.current);
    };
    const wait = lastAnnounceAt.current + ANNOUNCE_MIN_MS - Date.now();
    if (wait <= 0) {
      apply();
      return;
    }
    const t = setTimeout(apply, wait);
    return () => clearTimeout(t);
    // Only a change of kind or direction (the shown key) re-announces.
  }, [shownKey]);

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
      <div className="note-guide__box" role="img" aria-label={text || `Target ${target}`}>
        <div className="note-guide__band" style={{ height: `max(4px, calc(var(--guide-h) * ${bandFraction}))` }} />
        <div className="note-guide__line" />
        <span className="note-guide__note" data-testid="note-guide-note">
          {target}
        </span>
        {offset !== null ? (
          // The transform comes straight from the live value on every render. Keyed on the target so a new note
          // starts the dot in place with no easing.
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
        <>
          <p className={`note-guide__text note-guide__text--${shownState.current?.kind ?? 'idle'}`} data-testid="note-guide-text">
            {text}
          </p>
          <span className="visually-hidden" aria-live="polite" data-testid="note-guide-announce">
            {announced}
          </span>
        </>
      ) : null}
    </div>
  );
}
