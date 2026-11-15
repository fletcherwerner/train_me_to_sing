import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { now, unlockAudio } from '../../audio/audioEngine';
import { scheduleClick, stopClicks } from '../../audio/metronome';
import { createPitchSource } from '../../audio/pitch';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { measureLatency } from '../../core/scoring/calibration';
import './Home.css';

const COUNT_IN = 4;
const MEASURED = 8;
const BEAT_SEC = 1; // 60 bpm

type Phase = 'intro' | 'running' | 'result' | 'failed' | 'error';

export function Calibrate() {
  const { search } = useLocation();
  const setLatencyOffset = useAppStore((s) => s.setLatencyOffset);
  const [phase, setPhase] = useState<Phase>('intro');
  const [measured, setMeasured] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const sourceRef = useRef<PitchSource | null>(null);
  const runRef = useRef(0);

  useEffect(
    () => () => {
      runRef.current++;
      stopClicks();
      sourceRef.current?.stop();
    },
    [],
  );

  const start = async () => {
    const myRun = ++runRef.current;
    setSaved(false);
    try {
      await unlockAudio();
      sourceRef.current?.stop();
      const src = createPitchSource();
      await src.start();
      sourceRef.current = src;
      const frames: PitchFrame[] = [];
      const unsub = src.subscribe((f) => frames.push(f));
      const t0 = now() + 0.5;
      const clicks = Array.from({ length: COUNT_IN + MEASURED }, (_, i) => t0 + i * BEAT_SEC);
      clicks.forEach((t, i) => scheduleClick(t, i === 0 || i === COUNT_IN));
      setPhase('running');
      const endSec = clicks[clicks.length - 1] + 1;
      await new Promise<void>((resolve) => {
        const timer = window.setInterval(() => {
          if (myRun !== runRef.current || now() >= endSec) {
            window.clearInterval(timer);
            resolve();
          }
        }, 100);
      });
      unsub();
      src.stop();
      if (myRun !== runRef.current) return;
      const result = measureLatency(frames, t0, clicks.slice(COUNT_IN));
      if (result === null) {
        setPhase('failed');
      } else {
        setMeasured(result);
        setPhase('result');
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'mic-denied'
          ? 'Microphone access denied. Allow microphone access in your browser settings, reload, and try again.'
          : 'We could not start the microphone. Check your settings and try again.',
      );
      setPhase('error');
    }
  };

  return (
    <main className="dev-page">
      <p>
        <Link to={{ pathname: '/settings', search }} className="tap-link">
          Settings
        </Link>
      </p>
      <h1>Calibrate timing</h1>

      {phase === 'intro' || phase === 'failed' || phase === 'error' ? (
        <>
          <p>
            Put on the headphones you practise with. You&apos;ll hear 8 clicks. Say &apos;ta&apos; sharply on each
            one.
          </p>
          {phase === 'failed' ? (
            <p role="alert" data-testid="calibrate-failed">
              Couldn&apos;t hear clear sounds — try again.
            </p>
          ) : null}
          {phase === 'error' ? <p role="alert">{error}</p> : null}
          <p>
            <button onClick={start} data-testid="calibrate-start">
              {phase === 'intro' ? 'Start' : 'Try again'}
            </button>
          </p>
        </>
      ) : null}

      {phase === 'running' ? (
        <p role="status" data-testid="calibrate-running">
          Listen to the 4 count-in clicks, then say &apos;ta&apos; on each of the next 8.
        </p>
      ) : null}

      {phase === 'result' && measured !== null ? (
        <>
          <p data-testid="calibrate-result">Measured delay: {measured} ms</p>
          <p>
            <button
              onClick={() => {
                setLatencyOffset(measured, true);
                setSaved(true);
              }}
              disabled={saved}
            >
              Save
            </button>{' '}
            <button onClick={start}>Retry</button>
          </p>
          {saved ? <p role="status">Saved.</p> : null}
        </>
      ) : null}
    </main>
  );
}
