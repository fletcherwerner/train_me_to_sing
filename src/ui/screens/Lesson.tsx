import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAppStore } from '../../storage/store';
import { ensureAudioRunning, now, watchAudioClock } from '../../audio/audioEngine';
import {
  isMicMissing,
  MIC_LOST_MSG,
  MIC_MISSING_MSG,
  SOUND_PAUSED_MSG,
  SOUND_STOPPED_MSG,
} from '../audioMessages';
import { playExercise, playPreviewNote, type PlaybackHandle } from '../../audio/exercisePlayer';
import { createPitchSource, recordFrames, registerSimExercise, clearSimExercise } from '../../audio/pitch';
import type { PitchSource } from '../../audio/pitch/PitchSource';
import { getLesson } from '../../content/registry';
import type { Lesson as LessonData } from '../../content/types';
import { displayRange, fit } from '../../core/exercise/fit';
import { phraseFor, slicePhrase } from '../../core/exercise/phrases';
import { midiToName } from '../../core/music/notes';
import { applyGate, bleedGate, measureBleed } from '../../core/scoring/bleed';
import { evaluateAttempt } from '../../core/scoring/evaluate';
import { getTolerance } from '../../core/scoring/tolerance';
import { pickTip } from '../../core/scoring/tips';
import type { AttemptResult } from '../../core/scoring/types';
import { INITIAL_SESSION, reduce } from '../../core/session/sessionMachine';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { CentsMeter } from '../components/CentsMeter';
import { SequenceStrip } from '../components/SequenceStrip';
import { NowSinging } from '../components/NowSinging';
import { GraphLegend, PitchGraph, ResultsGraph } from '../components/PitchGraph';
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

/** Home at the left, title centred, on one row. Home keeps the query string (?sim=...). */
function LessonHeader({ title }: { title: string }) {
  const { search } = useLocation();
  return (
    <header className="page-header lesson-header">
      <Link className="nav-link" to={{ pathname: '/', search }}>
        Home
      </Link>
      <h1 className="lesson-title">{title}</h1>
      <span />
    </header>
  );
}

export function Lesson({ onAttemptComplete }: LessonProps) {
  const { lessonId } = useParams();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const range = useAppStore((s) => s.range);
  const { search } = useLocation();
  // No range yet: back to Home, which offers the range test or loading a profile.
  if (!range) return <Navigate to={{ pathname: '/', search }} replace />;
  if (!lesson) {
    return (
      <main className="dev-page lesson-page">
        <LessonHeader title="Lesson not found" />
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
  const { search } = useLocation();
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const calibrated = useAppStore((s) => s.settings.calibratedAt !== undefined);
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const [session, dispatch] = useReducer(reduce, INITIAL_SESSION);
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);
  const [source, setSource] = useState<PitchSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** The last run did not complete because sound stopped; the run button then reads "Try again". */
  const [soundFailed, setSoundFailed] = useState(false);
  const [micLost, setMicLost] = useState(false);
  const offLostRef = useRef<(() => void) | null>(null);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const sourceRef = useRef<PitchSource | null>(null);
  const runRef = useRef(0);
  /** Piano level at the microphone, measured in the last I do play of this visit. null = not measured. */
  const [bleedRms, setBleedRms] = useState<number | null>(null);

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

  // If the audio clock stops mid-run, abandon the run: nothing is scored or saved.
  useEffect(() => {
    if (!running) return;
    return watchAudioClock(() => {
      stopRef.current();
      setSoundFailed(true);
      setNotice(SOUND_STOPPED_MSG);
    });
  }, [running]);

  useEffect(
    () => () => {
      offLostRef.current?.();
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
        <LessonHeader title={lesson.title} />
        <p data-testid="fit-info">
          This lesson needs {fitted.neededSemitones} semitones, but your range is {fitted.haveSemitones}. Redo your
          range test, or pick another lesson.
        </p>
      </main>
    );
  }
  const fullEx = fitted.exercise;
  const ex = playEx ?? fullEx;

  /** Creates and starts a new microphone source. Throws on failure (mic-denied, mic-missing, ...). */
  const connectSource = async () => {
    const src = createPitchSource();
    await src.start();
    offLostRef.current?.();
    sourceRef.current?.stop();
    sourceRef.current = src;
    offLostRef.current =
      src.onLost?.(() => {
        // The microphone went away by itself: abandon any run (no attempt is saved) and offer to reconnect.
        stopRef.current();
        setMicLost(true);
        setSoundFailed(false);
        setNotice(MIC_LOST_MSG);
      }) ?? null;
    setSource(src);
  };

  const startError = (err: unknown) =>
    isMicMissing(err)
      ? MIC_MISSING_MSG
      : err instanceof Error && err.message === 'mic-denied'
        ? 'Microphone access denied. Allow microphone access in your browser settings, reload, and press Start again.'
        : 'We could not start the microphone. Check your settings and press Start again.';

  const begin = async () => {
    setError(null);
    setStarting(true);
    try {
      if (!(await ensureAudioRunning())) {
        setError(SOUND_PAUSED_MSG);
        return;
      }
      await connectSource();
      dispatch({ type: 'BEGIN' });
    } catch (err) {
      setError(startError(err));
    } finally {
      setStarting(false);
    }
  };

  const reconnect = async () => {
    setStarting(true);
    try {
      if (!(await ensureAudioRunning())) {
        setSoundFailed(true);
        setNotice(SOUND_PAUSED_MSG);
        return;
      }
      await connectSource();
      setMicLost(false);
      setNotice(null);
    } catch (err) {
      setNotice(startError(err));
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
    setSoundFailed(false);
    if (thisStep === 'youDo') setYouDoFrames(null);
    if (thisStep === 'weDo') setWeDoFrames(null);
    setResultPhrase(activePhraseIdx);
    dispatch({ type: 'RUN' });
    const audioOk = await ensureAudioRunning();
    if (myRun !== runRef.current) return;
    if (!audioOk) {
      dispatch({ type: 'STOP' });
      setSoundFailed(true);
      setNotice(SOUND_PAUSED_MSG);
      return;
    }
    const h = playExercise(ex, {
      playMelody: thisStep !== 'youDo',
      metronome: true,
      playStartNote: thisStep === 'youDo',
    });
    handleRef.current = h;
    setHandle(h);
    let rec: ReturnType<typeof recordFrames> | null = null;
    if (sourceRef.current) {
      registerSimExercise(ex, h.startSec, thisStep !== 'youDo', thisStep !== 'iDo');
      // We do: gate frames as they arrive so the live red line does not follow the piano.
      const gate = thisStep === 'weDo' ? bleedGate(bleedRms) : null;
      rec = recordFrames(
        sourceRef.current,
        h.startSec,
        h.endSec,
        latencyMs / 1000,
        gate === null ? undefined : (f) => applyGate([f], ex.notes, gate)[0],
      );
      setLiveFrames(rec.frames);
    }
    await h.done;
    rec?.stop();
    if (myRun !== runRef.current) return;
    handleRef.current = null;
    setHandle(null);
    setLiveFrames(null);
    // The run ends on a wall-clock timer. If the audio clock never got to the end, it stalled: do not score.
    if (h.endSec - now() > 0.5) {
      dispatch({ type: 'STOP' });
      setSoundFailed(true);
      setNotice(SOUND_STOPPED_MSG);
      return;
    }
    if (thisStep === 'iDo' && rec) setBleedRms(measureBleed(rec.frames, ex.notes));
    const frames = rec
      ? thisStep === 'weDo'
        ? applyGate(rec.frames, ex.notes, bleedGate(bleedRms))
        : rec.frames
      : null;
    if (thisStep === 'youDo') setYouDoFrames(frames);
    if (thisStep === 'weDo') setWeDoFrames(frames);
    const result = thisStep !== 'iDo' && frames ? evaluateAttempt(ex, frames, tol, lesson.passScore) : undefined;
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
  const header = <LessonHeader title={lesson.title} />;

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
            <Link to={{ pathname: '/settings/calibrate', search }} className="nav-link">
              Calibrate timing
            </Link>{' '}
            first.
          </p>
        ) : null}
        <p>
          <button className="btn btn--primary" onClick={begin} disabled={starting}>
            {error === SOUND_PAUSED_MSG ? 'Try again' : 'Start'}
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
        <p className="lesson-actions" data-testid="results-actions">
          <button
            className={r.passed ? 'btn' : 'btn btn--primary'}
            onClick={() => dispatch({ type: 'BACK_TO', step: 'youDo' })}
          >
            Try again
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>
            Hear it again
          </button>
        </p>
        {youDoFrames ? (
          <>
            <GraphLegend />
            <ResultsGraph exercise={ex} range={range} frames={youDoFrames} />
          </>
        ) : null}
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
          <section className="lesson-missed">
            <h2 className="lesson-missed__heading">Missed notes</h2>
            <ul className="lesson-misses" data-testid="missed-notes">
              {misses.map((m) => (
                <li key={m.index}>
                  Note {m.index + 1} ({midiToName(m.targetMidi)}): {describeReason(m)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
        {STEP_LABELS.map(({ step: s, label }) => (
          <li
            key={s}
            className={s === step ? 'lesson-steps__item lesson-steps__item--current' : 'lesson-steps__item'}
            aria-current={s === step ? 'step' : undefined}
          >
            <span className="lesson-steps__label">{label}</span>
          </li>
        ))}
      </ol>
      <p className="lesson-instruction" data-testid="instruction">
        {INSTRUCTIONS[step]}
      </p>
      {step === 'weDo' && bleedGate(bleedRms) > 0.02 ? (
        <p className="tuner-error" role="alert" data-testid="bleed-notice">
          The microphone can hear the piano. Use headphones, or sing louder than the piano.
        </p>
      ) : null}
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
      ) : null}
      {hasLyrics ? <NowSinging notes={ex.notes} currentIndex={running ? live.currentNoteIndex : null} /> : null}
      <PitchGraph
        exercise={ex}
        range={range}
        startSec={handle?.startSec ?? null}
        frames={liveFrames}
        showSung={step !== 'iDo'}
      />
      <GraphLegend showYou={step !== 'iDo'} />
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        targetMidi={live.targetMidi}
        sungMidi={live.sungMidi}
        matchCents={tol.cents}
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
      {weDoLine && weDoFrames && !running ? (
        <>
          <GraphLegend />
          <ResultsGraph exercise={ex} range={range} frames={weDoFrames} />
        </>
      ) : null}
      <p className="lesson-controls">
        {running ? (
          <button className="btn btn--primary" onClick={stop}>
            Stop
          </button>
        ) : (
          <>
            {micLost ? (
              <button className="btn btn--primary" onClick={reconnect} disabled={starting} data-testid="reconnect-mic">
                Reconnect microphone
              </button>
            ) : (
              <button className="btn btn--primary" onClick={run} data-testid="run-button">
                {soundFailed
                  ? 'Try again'
                  : step === 'iDo'
                    ? ranOnce
                      ? 'Repeat'
                      : 'Play'
                    : step === 'weDo'
                      ? ranOnce
                        ? 'Repeat'
                        : 'Sing along'
                      : ranOnce
                        ? 'Try again'
                        : 'Start'}
              </button>
            )}
            {step === 'iDo' ? (
              <button className="btn" onClick={() => dispatch({ type: 'NEXT' })} disabled={session.iDoPlays < 1}>
                Next
              </button>
            ) : null}
            {step === 'weDo' ? (
              <>
                <button className="btn" onClick={() => dispatch({ type: 'NEXT' })}>
                  Next
                </button>
                <button className="btn" onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>
                  Back to I do
                </button>
              </>
            ) : null}
            {step === 'youDo' ? (
              <>
                <button className="btn" onClick={() => dispatch({ type: 'SHOW_RESULTS' })} disabled={!session.youDoResult}>
                  See results
                </button>
                <button className="btn" onClick={() => dispatch({ type: 'BACK_TO', step: 'weDo' })}>
                  Back
                </button>
              </>
            ) : null}
          </>
        )}
      </p>
    </main>
  );
}
