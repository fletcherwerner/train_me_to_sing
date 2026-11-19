import { BackLink } from '../components/BackLink';
import { useEffect, useRef, useState } from 'react';
import { ensureAudioRunning } from '../../audio/audioEngine';
import { isMicMissing, MIC_MISSING_MSG, SOUND_PAUSED_MSG } from '../audioMessages';
import { createPitchSource } from '../../audio/pitch';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { midiToName } from '../../core/music/notes';
import { createNoteCatcher, type CaughtNote } from '../../core/session/noteCatcher';
import './MicCheck.css';

const KB_LOW = 36; // C2
const KB_HIGH = 84; // C6
const MAX_CAUGHT = 8;
// The bar is on a log scale from near-silence to a loud voice.
const RMS_FLOOR = 0.002;
const RMS_CEIL = 0.3;
/** Below this the pitch detector ignores the input (MicPitchSource MIN_RMS). */
const RMS_ENOUGH = 0.01;
const RMS_SILENT = 0.004;

const levelOf = (rms: number) => {
  const v = (Math.log10(Math.max(rms, RMS_FLOOR)) - Math.log10(RMS_FLOOR)) / (Math.log10(RMS_CEIL) - Math.log10(RMS_FLOOR));
  return Math.min(1, Math.max(0, v));
};
const ENOUGH_MARK = levelOf(RMS_ENOUGH);

function statusOf(frame: PitchFrame | null): { kind: 'silent' | 'quiet' | 'noisy' | 'good'; text: string } {
  if (frame == null || frame.rms < RMS_SILENT) return { kind: 'silent', text: 'No sound yet. Sing or hum a steady note.' };
  if (frame.rms < RMS_ENOUGH) return { kind: 'quiet', text: 'Too quiet. Move closer to the microphone or sing louder.' };
  if (frame.midi == null) return { kind: 'noisy', text: 'We hear sound but no clear note. Hum one steady note.' };
  return { kind: 'good', text: 'We can hear you.' };
}

export function MicCheck() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<PitchFrame | null>(null);
  const [caught, setCaught] = useState<CaughtNote[]>([]);
  const sourceRef = useRef<PitchSource | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const catcher = useRef(createNoteCatcher());

  const stopSource = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    sourceRef.current?.stop();
    sourceRef.current = null;
    catcher.current.reset();
  };

  useEffect(() => stopSource, []);

  const start = async () => {
    setError(null);
    if (!(await ensureAudioRunning())) {
      setError(SOUND_PAUSED_MSG);
      return;
    }
    stopSource();
    const src = createPitchSource();
    sourceRef.current = src;
    let lastShown = -Infinity;
    const unsub = src.subscribe((f) => {
      const note = catcher.current.push(f);
      if (note) setCaught((c) => [note, ...c].slice(0, MAX_CAUGHT));
      // About 30 updates a second is enough for the bar and the note.
      if (f.tSec - lastShown >= 1 / 30) {
        lastShown = f.tSec;
        setFrame(f);
      }
    });
    const offLost =
      src.onLost?.(() => {
        stopSource();
        setRunning(false);
        setFrame(null);
        setError('The microphone disconnected. Reconnect it, then tap Start.');
      }) ?? (() => {});
    cleanupRef.current = () => {
      unsub();
      offLost();
    };
    try {
      await src.start();
      setRunning(true);
    } catch (err) {
      stopSource();
      setError(
        isMicMissing(err)
          ? MIC_MISSING_MSG
          : err instanceof Error && err.message === 'mic-denied'
            ? 'Microphone access was denied. Allow it in your browser settings and reload.'
            : 'Could not start the microphone. Check your settings and try again.',
      );
    }
  };

  const stop = () => {
    stopSource();
    setRunning(false);
    setFrame(null);
  };

  const status = statusOf(frame);
  const level = frame ? levelOf(frame.rms) : 0;
  const nowKey = frame?.midi == null ? null : Math.round(frame.midi);
  const last = caught[0] ?? null;

  return (
    <main className="dev-page mic-check">
      <p>
        <BackLink />
      </p>
      <h1>Mic check</h1>
      <p>Tap Start, then sing or hum a steady note. The bar shows how loud we hear you, and each note you hold is caught below.</p>
      <p>
        {running ? (
          <button className="btn" onClick={stop}>
            Stop
          </button>
        ) : (
          <button className="btn btn--primary" onClick={start}>
            Start
          </button>
        )}
      </p>
      {error ? (
        <p className="tuner-error" role="alert">
          {error}
        </p>
      ) : null}

      {running ? (
        <>
          <div
            className="mic-check__meter"
            role="meter"
            aria-label="Microphone level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level * 100)}
            data-testid="mic-level"
          >
            <div className={`mic-check__fill mic-check__fill--${status.kind}`} style={{ width: `${level * 100}%` }} />
            <div className="mic-check__mark" style={{ left: `${ENOUGH_MARK * 100}%` }} aria-hidden="true" />
          </div>
          <p className={`mic-check__status mic-check__status--${status.kind}`} aria-live="polite" data-testid="mic-status">
            {status.text}
          </p>
          <p className="mic-check__now">
            Hearing: <strong data-testid="mic-now">{nowKey != null ? midiToName(nowKey) : '—'}</strong>
          </p>
        </>
      ) : null}

      <PianoKeyboard lowMidi={KB_LOW} highMidi={KB_HIGH} sungMidi={frame?.midi ?? null} />

      <section className="mic-check__caught" aria-label="Notes caught">
        <h2>Notes caught</h2>
        {last ? (
          <>
            <p className="mic-check__last">
              Last note: <strong data-testid="mic-last">{midiToName(last.midi)}</strong>
            </p>
            <ol className="mic-check__list" data-testid="mic-caught">
              {caught.map((n) => (
                <li key={`${n.tSec}-${n.midi}`} className="mic-check__chip">
                  {midiToName(n.midi)}
                </li>
              ))}
            </ol>
            <button className="btn" onClick={() => setCaught([])}>
              Clear
            </button>
          </>
        ) : (
          <p className="mic-check__empty">None yet. Hold a note for a moment to catch it.</p>
        )}
      </section>
    </main>
  );
}
