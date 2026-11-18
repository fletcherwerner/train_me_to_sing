import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../storage/store';
import { ensureAudioRunning } from '../../audio/audioEngine';
import { SOUND_PAUSED_MSG } from '../audioMessages';
import { playExercise, type PlaybackHandle } from '../../audio/exercisePlayer';
import { clearSimExercise, createPitchSource, recordFrames, registerSimExercise } from '../../audio/pitch';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { fit } from '../../core/exercise/fit';
import { warmupGlides } from '../../core/exercise/glides';
import type { StudentRange } from '../../core/exercise/types';
import { BeatIndicator } from '../components/BeatIndicator';
import { GraphLegend, PitchGraph } from '../components/PitchGraph';
import { useLiveAttempt } from '../hooks/useLiveAttempt';
import { useWakeLock } from '../hooks/useWakeLock';
import { getTolerance } from '../../core/scoring/tolerance';

/**
 * Three warm-up glides. Nothing here is scored or saved: the graph shows the sloped target
 * and, when the microphone works, the student's own line.
 */
export function Warmup({ range, onDone }: { range: StudentRange; onDone: () => void }) {
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const glides = useMemo(() => warmupGlides(range), [range]);
  const exercises = useMemo(
    () =>
      glides.map((g) => {
        const r = fit(g.template, range, { tonicMidi: range.lowMidi });
        return r.ok ? r.exercise : null;
      }),
    [glides, range],
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);
  const [source, setSource] = useState<PitchSource | null>(null);
  const [frames, setFrames] = useState<PitchFrame[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const sourceRef = useRef<PitchSource | null>(null);
  const runRef = useRef(0);
  const ex = exercises[idx];
  const running = phase === 'running';
  useWakeLock(running);
  const live = useLiveAttempt(source, handle, ex, getTolerance('t1'));

  useEffect(
    () => () => {
      runRef.current++;
      handleRef.current?.stop();
      sourceRef.current?.stop();
      clearSimExercise();
    },
    [],
  );

  if (!ex) return <p>The warm-up does not fit your range. Skip it for today.</p>;

  const start = async () => {
    const myRun = ++runRef.current;
    setNotice(null);
    if (!(await ensureAudioRunning())) {
      setNotice(SOUND_PAUSED_MSG);
      return;
    }
    if (!sourceRef.current) {
      try {
        const src = createPitchSource();
        await src.start();
        sourceRef.current = src;
        setSource(src);
      } catch {
        // The warm-up is not scored, so it still works without the microphone.
        setNotice('The microphone is not available. You can still follow the line with your voice.');
      }
    }
    if (myRun !== runRef.current) return;
    setPhase('running');
    const h = playExercise(ex, { playMelody: true, metronome: true, playStartNote: false });
    handleRef.current = h;
    setHandle(h);
    let rec: ReturnType<typeof recordFrames> | null = null;
    if (sourceRef.current) {
      registerSimExercise(ex, h.startSec, true, true);
      rec = recordFrames(sourceRef.current, h.startSec, h.endSec, latencyMs / 1000);
      setFrames(rec.frames);
    }
    await h.done;
    rec?.stop();
    if (myRun !== runRef.current) return;
    handleRef.current = null;
    setHandle(null);
    setFrames(null);
    setPhase('done');
  };

  const stop = () => {
    runRef.current++;
    handleRef.current?.stop();
    handleRef.current = null;
    setHandle(null);
    setFrames(null);
    setPhase('idle');
  };

  const last = idx === exercises.length - 1;
  const next = () => {
    if (last) {
      onDone();
      return;
    }
    setIdx(idx + 1);
    setPhase('idle');
  };

  return (
    <section className="practice-part" data-testid="warmup">
      <h2 data-testid="warmup-title">{glides[idx].template.title}</h2>
      <p data-testid="warmup-count">
        Glide {idx + 1} of {exercises.length}. Nothing here is scored.
      </p>
      <p data-testid="warmup-instruction">{glides[idx].instruction}</p>
      <p>Stop if your throat feels tight.</p>
      <BeatIndicator
        beatsPerBar={ex.beatsPerBar}
        beatInBar={live.position.beatInBar}
        countInRemaining={live.position.countInRemaining}
      />
      <PitchGraph exercise={ex} range={range} startSec={handle?.startSec ?? null} frames={frames} showSung />
      <GraphLegend />
      {notice ? (
        <p className="tuner-error" role="alert">
          {notice}
        </p>
      ) : null}
      <p className="lesson-actions">
        {running ? (
          <button className="btn" onClick={stop} data-testid="warmup-stop">
            Stop
          </button>
        ) : (
          <button className={phase === 'done' ? 'btn' : 'btn btn--primary'} onClick={() => void start()} data-testid="warmup-start">
            {phase === 'done' ? 'Again' : 'Start glide'}
          </button>
        )}
        {phase === 'done' ? (
          <button className="btn btn--primary" onClick={next} data-testid="warmup-next">
            {last ? 'Finish warm-up' : 'Next glide'}
          </button>
        ) : null}
      </p>
    </section>
  );
}
