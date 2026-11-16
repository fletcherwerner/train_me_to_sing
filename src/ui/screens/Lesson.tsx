import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAppStore } from '../../storage/store';
import { unlockAudio } from '../../audio/audioEngine';
import { playExercise, playPreviewNote, type PlaybackHandle } from '../../audio/exercisePlayer';
import { createPitchSource, recordFrames, registerSimExercise, clearSimExercise } from '../../audio/pitch';
import type { PitchSource } from '../../audio/pitch/PitchSource';
import { getLesson } from '../../content/registry';
import type { Lesson as LessonData } from '../../content/types';
import { displayRange, fit } from '../../core/exercise/fit';
import { phraseFor, slicePhrase } from '../../core/exercise/phrases';
import { midiToName } from '../../core/music/notes';
import { evaluateAttempt } from '../../core/scoring/evaluate';
import { getTolerance } from '../../core/scoring/tolerance';
import { pickTip } from '../../core/scoring/tips';
import type { AttemptResult } from '../../core/scoring/types';
import { INITIAL_SESSION, reduce } from '../../core/session/sessionMachine';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { CentsMeter } from '../components/CentsMeter';
import { SequenceStrip } from '../components/SequenceStrip';
import { NowSinging } from '../components/NowSinging';
import { PitchGraph, ResultsGraph } from '../components/PitchGraph';
import type { PitchFrame } from '../../audio/pitch/PitchSource';
import { BeatIndicator } from '../components/BeatIndicator';
import { useLiveAttempt } from '../hooks/useLiveAttempt';
import { useWakeLock } from '../hooks/useWakeLock';
import { describeReason } from '../describeReason';
import { describeTolerance } from '../describeTolerance';
import './Lesson.css';

export interface LessonProps {
  /** Called when a You do attempt ends. Progress is already saved. */
  onAttemptComplete?: (result: AttemptResult) => void;
}

const INSTRUCTIONS: Record<'iDo' | 'weDo' | 'youDo', string> = {
  iDo: 'Listen and watch.',
  weDo: 'Sing along with the piano.',
  youDo: 'Your turn. The piano is silent; follow the lit key.',
};

const STEP_LABELS: { step: 'iDo' | 'weDo' | 'youDo'; label: string }[] = [
  { step: 'iDo', label: 'I do' },
  { step: 'weDo', label: 'We do' },
  { step: 'youDo', label: 'You do' },
];

export function Lesson({ onAttemptComplete }: LessonProps) {
  const { lessonId } = useParams();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const range = useAppStore((s) => s.range);
  if (!range) return <Navigate to="/range" replace />;
  if (!lesson) {
    return (
      <main className="dev-page lesson-page">
        <p>
          <Link className="lesson-home-button" to="/">
            Home
          </Link>
        </p>
        <h1>Lesson not found</h1>
        <p>We couldn&apos;t find that lesson. Go back home and pick another.</p>
      </main>
    );
  }
  return <LessonRun key={lesson.id} lesson={lesson} range={range} onAttemptComplete={onAttemptComplete} />;
}

function LessonRun({
  lesson,
  range,
  onAttemptComplete,
}: {
  lesson: LessonData;
  range: { lowMidi: number; highMidi: number };
  onAttemptComplete?: (result: AttemptResult) => void;
}) {
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const calibrated = useAppStore((s) => s.settings.calibratedAt !== undefined);
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const [session, dispatch] = useReducer(reduce, INITIAL_SESSION);
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);
  const [source, setSource] = useState<PitchSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const sourceRef = useRef<PitchSource | null>(null);
  const runRef = useRef(0);

  const tol = getTolerance(lesson.toleranceId);
  const fitted = useMemo(() => fit(lesson.exercise, range), [lesson, range]);
  const exercise = fitted.ok ? fitted.exercise : null;
  const { step, activity } = session;
  const running = activity === 'running';
  const graded = step === 'weDo' || step === 'youDo';
  const phrases = lesson.exercise.phrases;
  // null = whole song. Only I do and We do use a phrase; You do and Results use the whole song.
  const [phraseIdx, setPhraseIdx] = useState<number | null>(null);
  // Frames of the run in progress (filled live) and of the last We do and You do attempts. In memory only, never saved.
  const [liveFrames, setLiveFrames] = useState<PitchFrame[] | null>(null);
  const [weDoFrames, setWeDoFrames] = useState<PitchFrame[] | null>(null);
  const [youDoFrames, setYouDoFrames] = useState<PitchFrame[] | null>(null);
  const [resultPhrase, setResultPhrase] = useState<number | null>(null);
  const activePhraseIdx = step === 'iDo' || step === 'weDo' ? phraseIdx : null;
  const playEx = useMemo(
    () => (exercise && phrases && activePhraseIdx !== null ? slicePhrase(exercise, phrases[activePhraseIdx]) : exercise),
    [exercise, activePhraseIdx, phrases],
  );
  const live = useLiveAttempt(graded ? source : null, handle, playEx, tol);

  useWakeLock(running);

  // Returning from the background can leave the AudioContext suspended: abandon the run.
  const stopRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      stopRef.current();
      setNotice('Paused — tap to restart');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  useEffect(
    () => () => {
      runRef.current++;
      handleRef.current?.stop();
      sourceRef.current?.stop();
      clearSimExercise();
    },
    [],
  );

  if (!fitted.ok) {
    return (
      <main className="dev-page lesson-page">
        <p>
          <Link className="lesson-home-button" to="/">
            Home
          </Link>
        </p>
        <h1>{lesson.title}</h1>
        <p data-testid="fit-info">
          This lesson needs {fitted.neededSemitones} semitones, but your range is {fitted.haveSemitones}. Redo your
          range test, or pick another lesson.
        </p>
      </main>
    );
  }
  const fullEx = fitted.exercise;
  const ex = playEx ?? fullEx;

  const begin = async () => {
    setError(null);
    setStarting(true);
    try {
      await unlockAudio();
      const src = createPitchSource();
      await src.start();
      sourceRef.current?.stop();
      sourceRef.current = src;
      setSource(src);
      dispatch({ type: 'BEGIN' });
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'mic-denied'
          ? 'Microphone access denied. Allow microphone access in your browser settings, reload, and press Start again.'
          : 'We could not start the microphone. Check your settings and press Start again.',
      );
    } finally {
      setStarting(false);
    }
  };

  const run = async () => {
    if (step !== 'iDo' && step !== 'weDo' && step !== 'youDo') return;
    if (running) return;
    const myRun = ++runRef.current;
    const thisStep = step;
    setNotice(null);
    if (thisStep === 'youDo') setYouDoFrames(null);
    if (thisStep === 'weDo') setWeDoFrames(null);
    setResultPhrase(activePhraseIdx);
    dispatch({ type: 'RUN' });
    await unlockAudio();
    if (myRun !== runRef.current) return;
    const h = playExercise(ex, {
      playMelody: thisStep !== 'youDo',
      metronome: true,
      playStartNote: thisStep === 'youDo',
    });
    handleRef.current = h;
    setHandle(h);
    let rec: ReturnType<typeof recordFrames> | null = null;
    if (thisStep !== 'iDo' && sourceRef.current) {
      registerSimExercise(ex, h.startSec);
      rec = recordFrames(sourceRef.current, h.startSec, h.endSec, latencyMs / 1000);
      setLiveFrames(rec.frames);
    }
    await h.done;
    rec?.stop();
    if (myRun !== runRef.current) return;
    handleRef.current = null;
    setHandle(null);
    setLiveFrames(null);
    if (thisStep === 'youDo') setYouDoFrames(rec ? rec.frames : null);
    if (thisStep === 'weDo') setWeDoFrames(rec ? rec.frames : null);
    const result = rec ? evaluateAttempt(ex, rec.frames, tol, lesson.passScore) : undefined;
    dispatch({ type: 'RUN_ENDED', result });
    if (thisStep === 'youDo' && !result) setNotice('We could not hear the microphone for that run. Press Try again.');
    if (thisStep === 'youDo' && result) {
      dispatch({ type: 'SHOW_RESULTS' });
      recordAttempt(lesson.id, result);
      onAttemptComplete?.(result);
    }
  };

  const stop = () => {
    runRef.current++;
    handleRef.current?.stop();
    handleRef.current = null;
    setHandle(null);
    setLiveFrames(null);
    dispatch({ type: 'STOP' });
  };
  stopRef.current = stop;

  const disp = displayRange(range);
  const hasStrip = step === 'weDo' || step === 'youDo';
  const shownResult = step === 'weDo' ? session.weDoResult : step === 'youDo' ? session.youDoResult : null;
  const resultMatches = shownResult !== null && resultPhrase === activePhraseIdx;
  const strip = shownResult && resultMatches ? shownResult.notes.map((n) => n.hit) : undefined;
  const hasLyrics = ex.notes.some((n) => n.lyric);
  const header = (
    <>
      <p>
        <Link className="lesson-home-button" to="/">
          Home
        </Link>
      </p>
      <h1 className="lesson-title">{lesson.title}</h1>
    </>
  );

  if (step === 'intro') {
    return (
      <main className="dev-page lesson-page">
        {header}
        <p data-testid="lesson-goal">{lesson.goal}</p>
        <p data-testid="lesson-tolerance">{describeTolerance(tol)}</p>
        <p>Put on headphones so the piano does not get picked up by the microphone.</p>
        {lesson.stage === 2 && !calibrated && lesson.order === 1 ? (
          <p data-testid="calibrate-hint">
            Tip: timing is graded fairly only if the app knows your device&apos;s delay.{' '}
            <Link to="/settings/calibrate">Calibrate timing</Link> first.
          </p>
        ) : null}
        <p>
          <button onClick={begin} disabled={starting}>
            Start
          </button>
        </p>
        {error ? (
          <p className="tuner-error" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    );
  }

  if (step === 'results') {
    const r = session.youDoResult;
    if (!r) return null;
    const hits = r.notes.filter((n) => n.hit).length;
    const misses = r.notes.filter((n) => !n.hit);
    return (
      <main className="dev-page lesson-page" data-testid="results">
        {header}
        <h2 className="lesson-verdict" data-testid="results-verdict">
          {r.passed ? 'Passed' : 'Not yet'}
        </h2>
        <p className="lesson-score" data-testid="results-score">
          {hits} of {r.notes.length} notes ({Math.round(r.score * 100)}%)
        </p>
        <p>Pass mark: {Math.round(lesson.passScore * 100)}%</p>
        <p className="lesson-tip" data-testid="results-tip">
          <strong>Tip:</strong> {pickTip(r)}
        </p>
        {youDoFrames ? <ResultsGraph exercise={ex} range={range} frames={youDoFrames} /> : null}
        <SequenceStrip
          expanded
          notes={ex.notes}
          currentIndex={null}
          results={r.notes.map((n) => n.hit)}
          onChipPress={(i) => playPreviewNote(ex.notes[i].midi)}
        />
        {phrases && misses.length > 0 ? (
          <ul className="lesson-misses lesson-misses--lines" data-testid="missed-by-phrase">
            {phrases
              .map((p) => ({ label: p.label, count: misses.filter((m) => phraseFor([p], m.index)).length }))
              .filter((g) => g.count > 0)
              .map((g) => (
                <li key={g.label}>
                  {g.label}: {g.count} missed
                </li>
              ))}
          </ul>
        ) : null}
        {misses.length > 0 ? (
          <ul className="lesson-misses" data-testid="missed-notes">
            {misses.map((m) => (
              <li key={m.index}>
                Note {m.index + 1} ({midiToName(m.targetMidi)}): {describeReason(m)}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="lesson-controls">
          <button onClick={() => dispatch({ type: 'BACK_TO', step: 'youDo' })}>Try again</button>
          <button onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>Hear it again</button>
          <Link className="lesson-home-button" to="/">
            Home
          </Link>
        </p>
      </main>
    );
  }

  const weDoLine =
    step === 'weDo' && session.weDoResult && resultMatches
      ?`Practice run: ${session.weDoResult.notes.filter((n) => n.hit).length} of ${session.weDoResult.notes.length} notes.`
      : null;
  const ranOnce =
    step === 'iDo' ? session.iDoPlays > 0 : step === 'weDo' ? session.weDoResult !== null : session.youDoResult !== null;

  return (
    <main className="dev-page lesson-page">
      {header}
      <ol className="lesson-steps" aria-label="Lesson steps">
        {STEP_LABELS.map(({ step: s, label }, i) => (
          <li
            key={s}
            className={s === step ? 'lesson-steps__item lesson-steps__item--current' : 'lesson-steps__item'}
            aria-current={s === step ? 'step' : undefined}
          >
            {i > 0 ? <span aria-hidden="true"> · </span> : null}
            {label}
          </li>
        ))}
      </ol>
      <p className="lesson-instruction" data-testid="instruction">
        {INSTRUCTIONS[step]}
      </p>
      <BeatIndicator
        beatsPerBar={ex.beatsPerBar}
        beatInBar={live.position.beatInBar}
        countInRemaining={live.position.countInRemaining}
      />
      {phrases && (step === 'iDo' || step === 'weDo') ? (
        <p className="lesson-phrase">
          <label>
            Practise:{' '}
            <select
              data-testid="phrase-select"
              value={phraseIdx === null ? '' : String(phraseIdx)}
              disabled={running}
              onChange={(e) => setPhraseIdx(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">Whole song</option>
              {phrases.map((p, i) => (
                <option key={p.label} value={String(i)}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </p>
      ) : phrases ? (
        <p className="lesson-phrase lesson-phrase--spacer" aria-hidden="true" />
      ) : null}
      {hasLyrics ? <NowSinging notes={ex.notes} currentIndex={running ? live.currentNoteIndex : null} /> : null}
      <PitchGraph
        exercise={ex}
        range={range}
        startSec={handle?.startSec ?? null}
        frames={liveFrames}
        showSung={step !== 'iDo'}
      />
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        targetMidi={live.targetMidi}
        sungMidi={live.sungMidi}
        rangeMarkers={{ lowMidi: range.lowMidi, highMidi: range.highMidi }}
      />
      <p className="lesson-notes" data-testid="note-labels">
        Target: {live.targetMidi === null ? '—' : midiToName(live.targetMidi)}
        {graded ? <> · Sung: {live.sungMidi === null ? '—' : midiToName(live.sungMidi)}</> : null}
      </p>
      {step !== 'iDo' ? <CentsMeter cents={live.cents} toleranceCents={tol.cents} /> : null}
      <SequenceStrip
        notes={ex.notes}
        currentIndex={live.currentNoteIndex}
        results={hasStrip && !running ? strip : undefined}
      />
      {notice ? (
        <p className="tuner-error" role="alert">
          {notice}
        </p>
      ) : null}
      {weDoLine ? (
        <p data-testid="practice-line">{weDoLine}</p>
      ) : null}
      {weDoLine && weDoFrames && !running ? <ResultsGraph exercise={ex} range={range} frames={weDoFrames} /> : null}
      <p className="lesson-controls">
        {running ? (
          <button onClick={stop}>Stop</button>
        ) : (
          <>
            <button onClick={run} data-testid="run-button">
              {step === 'iDo' ? (ranOnce ? 'Repeat' : 'Play') : step === 'weDo' ? (ranOnce ? 'Repeat' : 'Sing along') : ranOnce ? 'Try again' : 'Start'}
            </button>
            {step === 'iDo' ? (
              <button onClick={() => dispatch({ type: 'NEXT' })} disabled={session.iDoPlays < 1}>
                Next
              </button>
            ) : null}
            {step === 'weDo' ? (
              <>
                <button onClick={() => dispatch({ type: 'NEXT' })}>Next</button>
                <button onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>Back to I do</button>
              </>
            ) : null}
            {step === 'youDo' ? (
              <>
                <button onClick={() => dispatch({ type: 'SHOW_RESULTS' })} disabled={!session.youDoResult}>
                  See results
                </button>
                <button onClick={() => dispatch({ type: 'BACK_TO', step: 'weDo' })}>Back</button>
              </>
            ) : null}
          </>
        )}
      </p>
    </main>
  );
}
