import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { ensureAudioRunning, now, watchAudioClock } from '../../audio/audioEngine';
import {
  isMicMissing,
  MIC_LOST_MSG,
  MIC_MISSING_MSG,
  SOUND_PAUSED_MSG,
  SOUND_STOPPED_MSG,
} from '../audioMessages';
import { scheduleClick, stopClicks } from '../../audio/metronome';
import { createPitchSource } from '../../audio/pitch';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { measureLatency } from '../../core/scoring/calibration';
import './Home.css';

const COUNT_IN = 4;
const MEASURED = 8;
const BEAT_SEC = 1; // 60 bpm

type Phase = 'intro' | 'running' | 'result' | 'failed' | 'error';

/** Test hook: ?sim=calibrate:<ms> is a fake singer who says "ta" <ms> after each measured click. */
function simulatedSource(search: string): PitchSource | null {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?')) : search);
  const sim = params.get('sim');
  if (!sim?.startsWith('calibrate:')) return null;
  const delayMs = parseFloat(sim.slice(10));
  if (!Number.isFinite(delayMs)) return null;
  const listeners = new Set<(f: PitchFrame) => void>();
  let timer: number | null = null;
  let t0 = 0;
  return {
    async start() {
      t0 = now() + 0.5;
      timer = window.setInterval(() => {
        const t = now();
        const rel = t - t0 - delayMs / 1000;
        const loud = rel >= COUNT_IN * BEAT_SEC && rel % BEAT_SEC < 0.15;
        listeners.forEach((cb) => cb({ tSec: t, midi: null, clarity: 1, rms: loud ? 0.2 : 0.01 }));
      }, 10);
    },
    stop() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function Calibrate() {
  const { search } = useLocation();
  const setLatencyOffset = useAppStore((s) => s.setLatencyOffset);
  const [phase, setPhase] = useState<Phase>('intro');
  const [measured, setMeasured] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [beat, setBeat] = useState(0); // 0 = waiting, 1..12 = clicks played so far
  const [pulse, setPulse] = useState(false);
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

  const stop = () => {
    runRef.current++;
    stopClicks();
    sourceRef.current?.stop();
    setPhase('intro');
  };

  const start = async () => {
    const myRun = ++runRef.current;
    setSaved(false);
    let stopWatch: (() => void) | null = null;
    let offLost: (() => void) | null = null;
    // Abandons the measurement and offers Retry.
    const abandon = (message: string) => {
      if (myRun !== runRef.current) return;
      runRef.current++;
      stopClicks();
      sourceRef.current?.stop();
      setError(message);
      setPhase('error');
    };
    try {
      if (!(await ensureAudioRunning())) {
        abandon(SOUND_PAUSED_MSG);
        return;
      }
      sourceRef.current?.stop();
      const src = simulatedSource(search) ?? createPitchSource();
      await src.start();
      sourceRef.current = src;
      offLost = src.onLost?.(() => abandon(MIC_LOST_MSG)) ?? null;
      stopWatch = watchAudioClock(() => abandon(SOUND_STOPPED_MSG));
      const frames: PitchFrame[] = [];
      const unsub = src.subscribe((f) => frames.push(f));
      const t0 = now() + 0.5;
      const clicks = Array.from({ length: COUNT_IN + MEASURED }, (_, i) => t0 + i * BEAT_SEC);
      clicks.forEach((t, i) => scheduleClick(t, i === 0 || i === COUNT_IN));
      setBeat(0);
      setPhase('running');
      const ticker = window.setInterval(() => {
        const idx = clicks.filter((c) => c <= now()).length;
        setBeat((b) => {
          if (idx !== b) setPulse(true);
          return idx;
        });
      }, 50);
      const pulseTimer = window.setInterval(() => setPulse(false), 250);
      const endSec = clicks[clicks.length - 1] + 1;
      await new Promise<void>((resolve) => {
        const timer = window.setInterval(() => {
          if (myRun !== runRef.current || now() >= endSec) {
            window.clearInterval(timer);
            resolve();
          }
        }, 100);
      });
      window.clearInterval(ticker);
      window.clearInterval(pulseTimer);
      stopWatch();
      offLost?.();
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
      stopWatch?.();
      offLost?.();
      setError(
        isMicMissing(err)
          ? MIC_MISSING_MSG
          : err instanceof Error && err.message === 'mic-denied'
            ? 'Microphone access denied. Allow microphone access in your browser settings, reload, and try again.'
            : 'We could not start the microphone. Check your settings and try again.',
      );
      setPhase('error');
    }
  };

  return (
    <main className="dev-page">
      <p className="nav-row">
        <Link to={{ pathname: '/', search }} className="nav-link">
          Home
        </Link>{' '}
        <Link to={{ pathname: '/settings', search }} className="nav-link">
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
            <button className="btn btn--primary" onClick={start} data-testid="calibrate-start">
              {phase === 'intro' ? 'Start' : 'Try again'}
            </button>
          </p>
        </>
      ) : null}

      {phase === 'running' ? (
        <div role="status" data-testid="calibrate-running">
          <p>Listen to the 4 count-in clicks, then say &apos;ta&apos; on each of the next 8.</p>
          <p
            data-testid="calibrate-beat"
            style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', opacity: pulse ? 1 : 0.6 }}
          >
            {beat === 0
              ? 'Get ready…'
              : beat <= COUNT_IN
                ? `Count-in ${beat} of ${COUNT_IN}`
                : `Click ${Math.min(beat - COUNT_IN, MEASURED)} of ${MEASURED} — say "ta"`}
          </p>
          <p>
            <button className="btn btn--primary" onClick={stop} data-testid="calibrate-stop">
              Stop
            </button>
          </p>
        </div>
      ) : null}

      {phase === 'result' && measured !== null ? (
        <>
          <p data-testid="calibrate-result">Measured delay: {measured} ms</p>
          <p>
            <button
              className="btn btn--primary"
              onClick={() => {
                setLatencyOffset(measured, true);
                setSaved(true);
              }}
              disabled={saved}
            >
              Save
            </button>{' '}
            <button className="btn" onClick={start}>
              Retry
            </button>
          </p>
          {saved ? <p role="status">Saved.</p> : null}
        </>
      ) : null}
    </main>
  );
}
