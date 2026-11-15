import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { unlockAudio, now } from '../../audio/audioEngine';
import { createTonePlayer, type TonePlayer } from '../../audio/tonePlayer';
import { createPitchSource, acceptRangeLow, resetRangeSim } from '../../audio/pitch';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { midiToName } from '../../core/music/notes';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { findHeldNote } from '../../core/exercise/rangeAnalysis';
import { useAppStore } from '../../storage/store';
import './RangeSetup.css';

type Step = 'intro' | 'find' | 'record' | 'result' | 'fail' | 'confirm';
type Pick = 'lowest' | 'highest';

const COUNT_SEC = 3;
const WINDOW_SEC = 3;
const FIND_LOW = 36; // C2
const FIND_HIGH = 84; // C6
const MIN_SPAN = 5;
const WARN_SPAN = 7;

export function RangeSetup() {
  const navigate = useNavigate();
  const setRange = useAppStore((s) => s.setRange);
  const [step, setStep] = useState<Step>('intro');
  const [pick, setPick] = useState<Pick>('lowest');
  const [error, setError] = useState<string | null>(null);
  const [sungMidi, setSungMidi] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [lowNote, setLowNote] = useState<number | null>(null);
  const [highNote, setHighNote] = useState<number | null>(null);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);

  const sourceRef = useRef<PitchSource | null>(null);
  const playerRef = useRef<TonePlayer | null>(null);
  const framesRef = useRef<PitchFrame[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    resetRangeSim();
    return () => {
      clearTimer();
      sourceRef.current?.stop();
      playerRef.current?.stopAll();
    };
  }, []);

  const player = () => (playerRef.current ??= createTonePlayer());
  const playNote = useCallback((midi: number) => player().playNote(midi, now(), 0.7), []);

  const start = async () => {
    try {
      await unlockAudio();
      const src = createPitchSource();
      sourceRef.current = src;
      src.subscribe((f) => {
        framesRef.current.push(f);
        if (framesRef.current.length > 600) framesRef.current.splice(0, framesRef.current.length - 600);
        setSungMidi(f.midi);
      });
      await src.start();
      setStep('find');
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'mic-denied'
          ? 'Microphone access was denied. Allow it in your browser settings and reload.'
          : 'Could not start the microphone. Check your settings and try again.',
      );
    }
  };

  const record = () => {
    clearTimer();
    setStep('record');
    setCountdown(COUNT_SEC);
    setProgress(0);
    const t0 = now() + 0.05;
    // Clicks are scheduled on the audio clock.
    for (let i = 0; i < COUNT_SEC; i++) player().playNote(81, t0 + i, 0.06);
    const winStart = t0 + COUNT_SEC;
    const winEnd = winStart + WINDOW_SEC;
    timerRef.current = setInterval(() => {
      const t = now();
      if (t < winStart) {
        setCountdown(Math.max(1, Math.ceil(winStart - t)));
      } else if (t < winEnd) {
        setCountdown(null);
        setProgress((t - winStart) / WINDOW_SEC);
      } else {
        clearTimer();
        setProgress(1);
        const frames = framesRef.current.filter((f) => f.tSec >= winStart && f.tSec <= winEnd);
        const result = findHeldNote(frames, pick);
        if (result.ok) {
          if (pick === 'lowest') setLowNote(result.midi);
          else setHighNote(result.midi);
          setStep('result');
          playNote(result.midi);
        } else {
          setError(
            result.reason === 'no-voice'
              ? "We couldn't hear a steady note — try again, a little louder."
              : "We couldn't hear a steady note — try again and hold it as steady as you can.",
          );
          setStep('fail');
        }
      }
    }, 50);
  };

  const retry = () => {
    setError(null);
    setStep('find');
  };

  const useThis = () => {
    if (pick === 'lowest') {
      acceptRangeLow();
      setPick('highest');
      setStep('find');
    } else {
      let l = lowNote ?? 45;
      let h = highNote ?? 64;
      if (h < l + MIN_SPAN) h = l + MIN_SPAN;
      if (l > h - MIN_SPAN) l = h - MIN_SPAN;
      setLow(l);
      setHigh(h);
      setStep('confirm');
    }
  };

  const nudgeLow = (d: number) => {
    const v = Math.min(low + d, high - MIN_SPAN);
    setLow(v);
    playNote(v);
  };
  const nudgeHigh = (d: number) => {
    const v = Math.max(high + d, low + MIN_SPAN);
    setHigh(v);
    playNote(v);
  };

  const save = () => {
    setRange({ lowMidi: low, highMidi: high, assessedAt: new Date().toISOString() });
    sourceRef.current?.stop();
    navigate('/');
  };

  const redo = () => {
    resetRangeSim();
    setLowNote(null);
    setHighNote(null);
    setPick('lowest');
    setStep('find');
  };

  const cancel = () => {
    clearTimer();
    sourceRef.current?.stop();
    playerRef.current?.stopAll();
    navigate('/');
  };

  const cancelLink = (
    <p className="range-back">
      <button onClick={cancel}>Home</button>
    </p>
  );

  const heading = <h1>Vocal Range Assessment</h1>;
  const sungName = sungMidi != null ? midiToName(Math.round(sungMidi)) : '';
  const found = pick === 'lowest' ? lowNote : highNote;

  if (step === 'intro') {
    return (
      <main className="range-setup">
        {heading}
        <p>Put on headphones. You will hold your lowest comfortable note, then your highest.</p>
        {error && <p className="range-error">{error}</p>}
        <div className="range-buttons">
          <button onClick={start}>Start</button>
        </div>
        {cancelLink}
      </main>
    );
  }

  if (step === 'confirm') {
    const span = high - low;
    const kbLow = Math.floor(low / 12) * 12;
    const kbHigh = Math.ceil(high / 12) * 12;
    return (
      <main className="range-setup">
        {heading}
        <p className="range-range-display">
          Your range: {midiToName(low)} – {midiToName(high)} ({span} semitones)
        </p>
        <PianoKeyboard
          lowMidi={kbLow}
          highMidi={kbHigh}
          rangeMarkers={{ lowMidi: low, highMidi: high }}
          onKeyPress={playNote}
        />
        <div className="range-nudge">
          <span>Low:</span>
          <button onClick={() => nudgeLow(-1)} aria-label="Lower the low note">−</button>
          <span>{midiToName(low)}</span>
          <button onClick={() => nudgeLow(1)} aria-label="Raise the low note">+</button>
        </div>
        <div className="range-nudge">
          <span>High:</span>
          <button onClick={() => nudgeHigh(-1)} aria-label="Lower the high note">−</button>
          <span>{midiToName(high)}</span>
          <button onClick={() => nudgeHigh(1)} aria-label="Raise the high note">+</button>
        </div>
        {span < WARN_SPAN && (
          <p className="range-warning">Your range is narrow, so some lessons will not fit.</p>
        )}
        <div className="range-buttons">
          <button onClick={save}>Save</button>
          <button onClick={redo}>Redo</button>
        </div>
        {cancelLink}
      </main>
    );
  }

  return (
    <main className="range-setup">
      {heading}
      {step === 'fail' ? (
        <>
          <p className="range-error">{error}</p>
          <div className="range-buttons">
            <button onClick={retry}>Try again</button>
          </div>
        </>
      ) : (
        <>
          {step === 'result' ? (
            <p className="range-result-label">
              {pick === 'lowest' ? 'Lowest' : 'Highest'} note: {found != null ? midiToName(found) : '?'}
            </p>
          ) : (
            <p className="range-prompt">
              {pick === 'lowest'
                ? 'Sing your lowest comfortable note and hold it.'
                : 'Now sing your highest comfortable note and hold it.'}
            </p>
          )}
          <PianoKeyboard
            lowMidi={FIND_LOW}
            highMidi={FIND_HIGH}
            sungMidi={step === 'result' ? null : sungMidi}
            targetMidi={step === 'result' ? found : null}
            onKeyPress={step === 'result' ? playNote : undefined}
          />
          {step !== 'result' && <div className="range-note-name">{sungName}</div>}
          {step === 'find' && (
            <div className="range-buttons">
              <button onClick={record}>Record</button>
            </div>
          )}
          {step === 'record' &&
            (countdown != null ? (
              <div className="range-countdown" aria-live="polite">
                {[3, 2, 1].map((n, i) => (
                  <span key={n}>
                    {i > 0 && ' – '}
                    <span className={n === countdown ? 'range-countdown-number' : 'range-countdown-dim'}>{n}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="range-recording">
                <span>Recording… hold the note</span>
                <div className="range-progress-bar">
                  <div className="range-progress-fill" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            ))}
          {step === 'result' && (
            <div className="range-buttons">
              <button onClick={useThis}>Use this</button>
              <button onClick={retry}>Try again</button>
            </div>
          )}
        </>
      )}
      {cancelLink}
    </main>
  );
}
