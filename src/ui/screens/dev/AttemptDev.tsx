import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../../storage/store';
import { unlockAudio } from '../../../audio/audioEngine';
import { playExercise, type PlaybackHandle } from '../../../audio/exercisePlayer';
import { createPitchSource, recordFrames, registerSimExercise, clearSimExercise } from '../../../audio/pitch';
import type { PitchSource } from '../../../audio/pitch/PitchSource';
import { displayRange, fit } from '../../../core/exercise/fit';
import { parseNotation } from '../../../core/exercise/notation';
import type { ExerciseTemplate } from '../../../core/exercise/types';
import { midiToName } from '../../../core/music/notes';
import { evaluateAttempt } from '../../../core/scoring/evaluate';
import { TOLERANCES, getTolerance } from '../../../core/scoring/tolerance';
import type { AttemptResult } from '../../../core/scoring/types';
import { describeReason } from '../../describeReason';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { CentsMeter } from '../../components/CentsMeter';
import { SequenceStrip } from '../../components/SequenceStrip';
import { BeatIndicator } from '../../components/BeatIndicator';
import { useLiveAttempt } from '../../hooks/useLiveAttempt';

const PASS_SCORE = 0.8;

const DEV_TEMPLATES: ExerciseTemplate[] = [
  { id: 'dev-three', title: 'Three notes (0 2 4)', tempoBpm: 60, beatsPerBar: 4, notes: parseNotation('0 2 4') },
  {
    id: 'dev-scale',
    title: 'Scale up and down',
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: parseNotation('0 2 4 5 7 5 4 2 0:2'),
  },
  { id: 'dev-repeat', title: 'Repeated note (0 0 0)', tempoBpm: 60, beatsPerBar: 4, notes: parseNotation('0 0 0') },
];

export function AttemptDev() {
  const range = useAppStore((s) => s.range);
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const [templateId, setTemplateId] = useState(DEV_TEMPLATES[0].id);
  const [tolId, setTolId] = useState('t1');
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);
  const [source, setSource] = useState<PitchSource | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const sourceRef = useRef<PitchSource | null>(null);
  const runRef = useRef(0);
  const resultRef = useRef<HTMLElement | null>(null);

  const template = DEV_TEMPLATES.find((t) => t.id === templateId) ?? DEV_TEMPLATES[0];
  const tol = getTolerance(tolId);
  const fitted = useMemo(() => (range ? fit(template, range) : null), [template, range]);
  const exercise = fitted && fitted.ok ? fitted.exercise : null;
  const live = useLiveAttempt(source, handle, exercise, tol);

  useEffect(
    () => () => {
      runRef.current++;
      handleRef.current?.stop();
      sourceRef.current?.stop();
      clearSimExercise();
    },
    [],
  );

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView?.({ block: 'start' });
  }, [result]);

  if (!range) {
    return (
      <main className="dev-page">
        <p>
          <Link className="dev-home" to="/">
            Home
          </Link>
        </p>
        <h1>Graded attempt</h1>
        <p>
          No range set. <Link to="/range">Set your range</Link> first.
        </p>
      </main>
    );
  }

  const cleanup = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    sourceRef.current?.stop();
    sourceRef.current = null;
    clearSimExercise();
    setHandle(null);
    setSource(null);
  };

  const start = async () => {
    if (!exercise) return;
    const run = ++runRef.current;
    cleanup();
    setResult(null);
    setError(null);
    try {
      await unlockAudio();
      const src = createPitchSource();
      await src.start();
      if (run !== runRef.current) {
        src.stop();
        return;
      }
      sourceRef.current = src;
      const h = playExercise(exercise, { playMelody: false, metronome: true, playStartNote: true });
      registerSimExercise(exercise, h.startSec);
      const rec = recordFrames(src, h.startSec, h.endSec, latencyMs / 1000);
      handleRef.current = h;
      setSource(src);
      setHandle(h);
      await h.done;
      rec.stop();
      if (run !== runRef.current) return;
      setResult(evaluateAttempt(exercise, rec.frames, tol, PASS_SCORE));
      cleanup();
    } catch (err) {
      cleanup();
      setError(
        err instanceof Error && err.message === 'mic-denied'
          ? 'Microphone access denied. Allow microphone access in your browser settings and reload.'
          : 'Failed to start the microphone. Check your settings and try again.',
      );
    }
  };

  const stop = () => {
    runRef.current++;
    cleanup();
  };

  const running = handle !== null;
  const disp = displayRange(range);
  const strip = result ? result.notes.map((n) => n.hit) : undefined;
  const hits = result ? result.notes.filter((n) => n.hit).length : 0;

  return (
    <main className="dev-page">
      <p>
        <Link className="dev-home" to="/">
          Home
        </Link>
      </p>
      <h1>Graded attempt</h1>
      <p>
        <label>
          Exercise{' '}
          <select
            value={templateId}
            onChange={(e) => {
              stop();
              setResult(null);
              setTemplateId(e.target.value);
            }}
          >
            {DEV_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.tempoBpm} bpm)
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Tolerance{' '}
          <select value={tolId} onChange={(e) => setTolId(e.target.value)} disabled={running}>
            {TOLERANCES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} (±{t.cents}¢, {t.timingMs} ms)
              </option>
            ))}
          </select>
        </label>
      </p>
      {fitted && !fitted.ok ? (
        <p data-testid="fit-info">
          Needs {fitted.neededSemitones} semitones; your range is {fitted.haveSemitones}.
        </p>
      ) : null}
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        targetMidi={live.targetMidi}
        sungMidi={live.sungMidi}
        rangeMarkers={{ lowMidi: range.lowMidi, highMidi: range.highMidi }}
      />
      <p data-testid="note-labels" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '8px 0' }}>
        Target: {live.targetMidi === null ? '—' : midiToName(live.targetMidi)} · Sung:{' '}
        {live.sungMidi === null ? '—' : midiToName(live.sungMidi)}
      </p>
      <CentsMeter cents={live.cents} toleranceCents={tol.cents} />
      {exercise ? (
        <>
          <SequenceStrip notes={exercise.notes} currentIndex={live.currentNoteIndex} results={strip} />
          <BeatIndicator
            beatsPerBar={exercise.beatsPerBar}
            beatInBar={live.position.beatInBar}
            countInRemaining={live.position.countInRemaining}
          />
        </>
      ) : null}
      <p>
        <button onClick={start} disabled={!exercise || running}>
          Start attempt
        </button>{' '}
        <button onClick={stop} disabled={!running}>
          Stop
        </button>
      </p>
      {error ? <p className="tuner-error">{error}</p> : null}
      {result && exercise ? (
        <section data-testid="attempt-result" ref={resultRef}>
          <h2>
            <span data-testid="attempt-score">
              {hits} of {result.notes.length} notes ({Math.round(result.score * 100)}%)
            </span>{' '}
            — <strong data-testid="attempt-verdict">{result.passed ? 'Pass' : 'Fail'}</strong>
          </h2>
          <table>
            <thead>
              <tr>
                <th>Note</th>
                <th>Result</th>
                <th>Reason</th>
                <th>Median cents</th>
                <th>Held</th>
                <th>Onset ms</th>
              </tr>
            </thead>
            <tbody>
              {result.notes.map((r) => (
                <tr key={r.index} data-testid={`result-row-${r.index}`}>
                  <td>{midiToName(r.targetMidi)}</td>
                  <td>{r.hit ? 'Hit' : 'Miss'}</td>
                  <td>{describeReason(r)}</td>
                  <td>{r.medianCents === null ? '—' : Math.round(r.medianCents)}</td>
                  <td>{Math.round(r.heldFraction * 100)}%</td>
                  <td>{r.onsetErrorMs === null ? '—' : Math.round(r.onsetErrorMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}
