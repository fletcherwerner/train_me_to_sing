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
import {
  createPitchSource,
  recordFrames,
  registerSimExercise,
  clearSimExercise,
  isSimulated,
  wantsRandomKey,
} from '../../audio/pitch';
import type { PitchSource } from '../../audio/pitch/PitchSource';
import { decodeTake, startTakeRecording, synthTake, type TakeRecording } from '../../audio/takeRecorder';
import { getLesson } from '../../content/registry';
import type { Lesson as LessonData } from '../../content/types';
import { displayRange, fit, pickTonic, tonicCount } from '../../core/exercise/fit';
import type { ResolvedExercise } from '../../core/exercise/types';
import { phraseFor, slicePhrase } from '../../core/exercise/phrases';
import { qualifiesForEcho } from '../../core/scoring/bestTake';
import { createSession, LEVELS, reduce, type Level } from '../../core/session/sessionMachine';
import { scoopCountsAsMiss, usesMastery } from '../../content/mastery';
import { proofTonics } from '../../core/progress/mastery';
import { MatchRun } from './MatchRun';
import { LessonHeader } from '../components/LessonHeader';
import { AccuracyResultLine, BestAccuracyLine, storedBestAccuracy } from '../components/BestAccuracy';
import { midiToName } from '../../core/music/notes';
import { applyGate, bleedGate, measureBleed } from '../../core/scoring/bleed';
import { evaluateAttempt } from '../../core/scoring/evaluate';
import { getTolerance } from '../../core/scoring/tolerance';
import { pickTip } from '../../core/scoring/tips';
import { buildRunRecord, melodyNoteRecords } from '../../core/insights/record';
import type { RunRecord } from '../../core/insights/types';
import { todayString } from '../../storage/today';
import { RunFocus } from '../components/RunFocus';
import { flushPracticeTime, usePracticeTime } from '../hooks/usePracticeTime';
import type { AttemptResult } from '../../core/scoring/types';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { NoteGuide } from '../components/NoteGuide';
import { useGuideRescue } from '../hooks/useGuideRescue';
import { SequenceStrip } from '../components/SequenceStrip';
import { NowSinging } from '../components/NowSinging';
import { GraphLegend, PitchGraph, ResultsGraph } from '../components/PitchGraph';
import type { PitchFrame } from '../../audio/pitch/PitchSource';
import { BeatIndicator } from '../components/BeatIndicator';
import { useLiveAttempt } from '../hooks/useLiveAttempt';
import { useWakeLock } from '../hooks/useWakeLock';
import { describeReason } from '../describeReason';
import { describeTolerance } from '../describeTolerance';
import { BackToLessonsLink, NextLessonLink, useNextLesson } from '../components/ResultsNav';
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
  if (lesson.kind === 'match') {
    return <MatchRun key={lesson.id} lesson={lesson} range={range} onAttemptComplete={onAttemptComplete} />;
  }
  return <LessonRun key={lesson.id} lesson={lesson} range={range} onAttemptComplete={onAttemptComplete} />;
}

const LEVEL_NAMES: Record<Level, string> = { learn: 'Learn', practise: 'Practise', prove: 'Prove' };
const LEVEL_HELP: Record<Level, string> = {
  learn: 'Full help: the live graph, the piano and the note guide.',
  practise: 'Less help: the piano shows the targets, but not your voice. The graph comes after.',
  prove: 'No live help. Sing it from memory; your score comes after.',
};

/** An echo take: the student's own voice, and the exercise (key) it was sung against. */
interface EchoTake {
  ex: ResolvedExercise;
  buffer: AudioBuffer;
  from: 'weDo' | 'youDo';
}

export function LessonRun({
  lesson,
  range,
  onAttemptComplete,
  forceLevel,
  embedded,
}: {
  lesson: LessonData;
  range: { lowMidi: number; highMidi: number };
  onAttemptComplete?: (result: AttemptResult) => void;
  /** Start at this level instead of the one the student has reached (reviews start at Prove). */
  forceLevel?: Level;
  /** Shown inside Today's practice: the practice bar owns "what next", so no Next lesson / Back to lessons. */
  embedded?: boolean;
}) {
  const { search } = useLocation();
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const calibrated = useAppStore((s) => s.settings.calibratedAt !== undefined);
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const nextLesson = useNextLesson(lesson.id, range);
  const [session, dispatch] = useReducer(reduce, undefined, () =>
    createSession(lesson.levels, forceLevel ?? useAppStore.getState().progress[lesson.id]?.level ?? 'learn'),
  );
  const level = session.level;
  const randomKey = wantsRandomKey();
  const mastery = usesMastery(lesson);
  const singleKey = tonicCount(lesson.exercise, range) <= 1;
  // Keys the student has already passed in. The next proof is in a different one when the range allows.
  const usedKeys = () => proofTonics(useAppStore.getState().progress[lesson.id]);
  /**
   * The key for the next attempt, or null for the centred key. Practise and Prove sing in a new key each attempt
   * (not in ?sim= runs, which stay centred for stable tests, unless &key=random). Any mastery lesson avoids the
   * keys it was already passed in, in ?sim= runs too, so a second proof can be in a new key.
   */
  const chooseTonic = (lvl: Level, justUsed?: number): number | null => {
    const avoid = [...usedKeys(), ...(justUsed !== undefined ? [justUsed] : [])];
    const varies = lesson.levels ? lvl !== 'learn' : false;
    if (varies && randomKey) return pickTonic(lesson.exercise, range, Math.random, avoid);
    if (mastery && usedKeys().length > 0 && (varies || !lesson.levels)) {
      return pickTonic(lesson.exercise, range, randomKey ? Math.random : () => 0, avoid);
    }
    return null;
  };
  const [tonic, setTonic] = useState<number | null>(() => chooseTonic(session.level));
  const keyed = tonic !== null;
  /** The stored best accuracy from before the last saved attempt, for "New best! (was …)". */
  const [prevBest, setPrevBest] = useState<number | undefined>(undefined);
  const [echo, setEcho] = useState<EchoTake | null>(null);
  const echoRef = useRef<EchoTake | null>(null);
  const [echoing, setEchoing] = useState(false);
  const [echoResult, setEchoResult] = useState<AttemptResult | null>(null);
  const echoPendingRef = useRef(false);
  const runEchoRef = useRef<() => void>(() => undefined);
  const recordingRef = useRef<TakeRecording | null>(null);
  // The exercise the last You do ran against, so Results still match after the key changes.
  const [resultEx, setResultEx] = useState<ResolvedExercise | null>(null);
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
  const fitted = useMemo(
    () => fit(lesson.exercise, range, keyed && tonic !== null ? { tonicMidi: tonic } : undefined),
    [lesson, range, keyed, tonic],
  );
  const exercise = fitted.ok ? fitted.exercise : null;
  const { step, activity } = session;
  const running = activity === 'running';
  usePracticeTime(running);
  /** Wall-clock start of the run in progress, for the logged duration only. */
  const runStartedAtRef = useRef(0);
  /** The log entry of the last finished You do run, for the "Focus next" section. */
  const [runRecord, setRunRecord] = useState<RunRecord | null>(null);
  const graded =step === 'weDo' || step === 'youDo';
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
    () =>
      echoing && echo && step === 'weDo'
        ? echo.ex
        : exercise && phrases && activePhraseIdx !== null
          ? slicePhrase(exercise, phrases[activePhraseIdx])
          : exercise,
    [exercise, activePhraseIdx, phrases, echoing, echo, step],
  );
  const live = useLiveAttempt(
    graded ? source : null,
    handle,
    playEx,
    tol,
    step === 'weDo' ? bleedGate(bleedRms) : null,
  );

  // Practise rescue: the guide fades in after a moment off the note (You do only).
  const rescueActive = running && step === 'youDo' && session.levels !== undefined && level === 'practise';
  const rescue = useGuideRescue(
    rescueActive,
    live.currentNoteIndex,
    live.cents,
    tol.cents,
    live.currentNoteIndex !== null && playEx ? (playEx.notes[live.currentNoteIndex]?.durationSec ?? null) : null,
  );
  const rescueRef = useRef(rescue);
  rescueRef.current = rescue;
  const [guideHelped, setGuideHelped] = useState(0);

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
      recordingRef.current?.discard(); // takes live in memory only and are dropped on leaving the lesson
      clearSimExercise();
    },
    [],
  );

  // "Echo yourself" from the results screen: go to We do, then start the echo run once it is showing.
  useEffect(() => {
    if (echoPendingRef.current && session.step === 'weDo' && session.activity === 'idle') {
      echoPendingRef.current = false;
      runEchoRef.current();
    }
  }, [session.step, session.activity]);

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

  /** Picks the key for the next Practise or Prove attempt, never the one just used when another fits. */
  const rollTonic = (avoid: number, lvl: Level = level) => {
    setTonic(chooseTonic(lvl, avoid));
  };

  const run = async (mode: 'normal' | 'echo' = 'normal') => {
    if (step !== 'iDo' && step !== 'weDo' && step !== 'youDo') return;
    if (running) return;
    const isEcho = mode === 'echo' && echo !== null && step === 'weDo';
    if (mode === 'echo' && !isEcho) return;
    const myRun = ++runRef.current;
    const thisStep = step;
    const runEx = isEcho && echo ? echo.ex : (playEx ?? fullEx);
    const echoBuffer = isEcho && echo ? echo.buffer : undefined;
    const priorWeDo = session.weDoResult;
    const runLevel = level;
    setNotice(null);
    setSoundFailed(false);
    setEchoing(isEcho);
    if (isEcho) setEchoResult(null);
    if (thisStep === 'youDo') {
      rescueRef.current.reset();
      setYouDoFrames(null);
      setResultEx(runEx);
    }
    if (thisStep === 'weDo' && !isEcho) setWeDoFrames(null);
    setResultPhrase(activePhraseIdx);
    runStartedAtRef.current = Date.now();
    dispatch({ type: 'RUN' });
    const audioOk = await ensureAudioRunning();
    if (myRun !== runRef.current) return;
    if (!audioOk) {
      dispatch({ type: 'STOP' });
      setSoundFailed(true);
      setNotice(SOUND_PAUSED_MSG);
      return;
    }
    const h = playExercise(runEx, {
      playMelody: thisStep !== 'youDo' && !isEcho,
      metronome: true,
      playStartNote: thisStep === 'youDo',
      melodyBuffer: echoBuffer,
    });
    handleRef.current = h;
    setHandle(h);
    let rec: ReturnType<typeof recordFrames> | null = null;
    // Echo yourself: also record the voice of a We do or You do run (not of the echo run itself).
    const wantsTake = lesson.echo && !isEcho && thisStep !== 'iDo';
    recordingRef.current?.discard();
    recordingRef.current = null;
    const stream = sourceRef.current?.getStream?.() ?? null;
    if (wantsTake && stream && !isSimulated()) recordingRef.current = startTakeRecording(stream);
    const takeRec = recordingRef.current;
    if (sourceRef.current) {
      registerSimExercise(runEx, h.startSec, thisStep !== 'youDo', thisStep !== 'iDo');
      // We do: gate frames as they arrive so the live red line does not follow the piano.
      const gate = thisStep === 'weDo' ? bleedGate(bleedRms) : null;
      rec = recordFrames(
        sourceRef.current,
        h.startSec,
        h.endSec,
        latencyMs / 1000,
        gate === null ? undefined : (f) => applyGate([f], runEx.notes, gate)[0],
      );
      setLiveFrames(rec.frames);
    }
    await h.done;
    rec?.stop();
    const helpedNotes = thisStep === 'youDo' && runLevel === 'practise' ? rescueRef.current.helped() : 0;
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
    if (thisStep === 'iDo' && rec) setBleedRms(measureBleed(rec.frames, runEx.notes));
    const frames = rec
      ? thisStep === 'weDo'
        ? applyGate(rec.frames, runEx.notes, bleedGate(bleedRms))
        : rec.frames
      : null;
    if (thisStep === 'youDo') setYouDoFrames(frames);
    if (thisStep === 'weDo' && !isEcho) setWeDoFrames(frames);
    const result = thisStep !== 'iDo' && frames ? evaluateAttempt(runEx, frames, tol, lesson.passScore, {
            scoopIsMiss: thisStep === 'youDo' && scoopCountsAsMiss(lesson, runLevel),
          })
        : undefined;
    if (isEcho) {
      // The echo run is scored and shown like We do, but never saved and it leaves the We do result alone.
      setEchoResult(result ?? null);
      dispatch({ type: 'RUN_ENDED', result: priorWeDo ?? undefined });
      return;
    }
    dispatch({ type: 'RUN_ENDED', result });
    if (wantsTake) void keepTake(takeRec, result, runEx, h.startSec, thisStep as 'weDo' | 'youDo');
    if (thisStep === 'youDo' && !result) setNotice('We could not hear the microphone for that run. Press Try again.');
    if (thisStep === 'youDo' && result) {
      dispatch({ type: 'SHOW_RESULTS' });
      setPrevBest(storedBestAccuracy(lesson.id));
      const logged = buildRunRecord({
        lessonId: lesson.id,
        kind: 'melody',
        date: todayString(),
        endedAt: new Date().toISOString(),
        durationSec: (Date.now() - runStartedAtRef.current) / 1000,
        level: lesson.levels ? runLevel : undefined,
        inPractice: embedded === true,
        tonicMidi: runEx.tonicMidi,
        range,
        result,
        notes: melodyNoteRecords(result),
        guideHelped: helpedNotes > 0 ? helpedNotes : undefined,
      });
      setRunRecord(logged);
      setGuideHelped(helpedNotes);
      recordAttempt(
        lesson.id,
        result,
        lesson.levels ? runLevel : undefined,
        { mastery, tonicMidi: runEx.tonicMidi, singleKey },
        logged,
      );
      flushPracticeTime();
      onAttemptComplete?.(result);
      // The next Practise or Prove attempt gets a new key.
      if ((lesson.levels && runLevel !== 'learn') || (mastery && !lesson.levels)) rollTonic(runEx.tonicMidi, runLevel);
    }
  };

  /** Keeps this run's voice for "Echo yourself" if the run was clean. Hides the button on any failure. */
  const keepTake = async (
    takeRec: TakeRecording | null,
    result: AttemptResult | undefined,
    runEx: ResolvedExercise,
    startSec: number,
    from: 'weDo' | 'youDo',
  ) => {
    const recorded = takeRec ? await takeRec.stop() : null;
    if (recordingRef.current === takeRec) recordingRef.current = null;
    if (!result || !qualifiesForEcho(result)) return;
    // A You do take (no piano underneath) replaces anything; a We do take only fills an empty slot or an older We do take.
    if (from === 'weDo' && echoRef.current?.from === 'youDo') return;
    let buffer: AudioBuffer | null = null;
    if (isSimulated()) buffer = synthTake(runEx);
    else if (recorded) {
      // Trimmed to the notes' window, so the buffer's time 0 is the exercise start.
      buffer = await decodeTake(recorded, startSec, startSec + runEx.totalSec);
    }
    if (!buffer) return;
    echoRef.current = { ex: runEx, buffer, from };
    setEcho(echoRef.current);
  };
  runEchoRef.current = () => void run('echo');

  const stop = () => {
    runRef.current++;
    handleRef.current?.stop();
    handleRef.current = null;
    recordingRef.current?.discard();
    recordingRef.current = null;
    setHandle(null);
    setLiveFrames(null);
    setEchoing(false);
    dispatch({ type: 'STOP' });
  };
  stopRef.current = stop;

  const advance = () => {
    dispatch({ type: 'ADVANCE' });
    setEchoResult(null);
    rollTonic(fullEx.tonicMidi, LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(level) + 1)]);
  };
  const stepDown = () => {
    dispatch({ type: 'STEP_DOWN' });
    setEchoResult(null);
    rollTonic(fullEx.tonicMidi, LEVELS[Math.max(0, LEVELS.indexOf(level) - 1)]);
  };
  const requestEchoFromResults = () => {
    echoPendingRef.current = true;
    dispatch({ type: 'BACK_TO', step: 'weDo' });
  };
  // Help shown while singing: only You do at Practise and Prove is reduced; I do and We do are always the full help.
  const helpLevel: Level = session.levels && step === 'youDo' ? level : 'learn';
  const startNote = fullEx.notes[0]?.midi ?? null;

  const disp = displayRange(range);
  const hasStrip = step === 'weDo' || step === 'youDo';
  const shownResult = step === 'weDo' ? session.weDoResult : step === 'youDo' ? session.youDoResult : null;
  const resultMatches = shownResult !== null && resultPhrase === activePhraseIdx;
  const strip = shownResult && resultMatches ? shownResult.notes.map((n) => n.hit) : undefined;
  const hasLyrics = ex.notes.some((n) => n.lyric);
  const header = (
    <LessonHeader title={lesson.title} right={<BestAccuracyLine lessonId={lesson.id} />} />
  );

  if (step === 'intro') {
    return (
      <main className="dev-page lesson-page">
        <LessonHeader title={lesson.title} />
        <p data-testid="lesson-goal">{lesson.goal}</p>
        <BestAccuracyLine lessonId={lesson.id} />
        <p data-testid="lesson-tolerance">{describeTolerance(tol)}</p>
        <p>Put on headphones so the piano does not get picked up by the microphone.</p>
        {mastery && singleKey ? (
          <p data-testid="single-key-note">Only one key fits your range, so passing on two days in one key is enough.</p>
        ) : null}
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
    const rex = resultEx ?? ex;
    const nextLevel: Level | null = session.levels && level !== 'prove' ? (level === 'learn' ? 'practise' : 'prove') : null;
    const levelPassed = r.passed && nextLevel !== null;
    const finalPass = r.passed && !levelPassed;
    const comeBackTomorrow =
      mastery && finalPass && !useAppStore.getState().progress[lesson.id]?.passed;
    // The primary is the most likely next step. Inside Today's practice the practice bar owns it.
    const nextPrimary = !embedded && finalPass && nextLesson !== null;
    const backPrimary = !embedded && finalPass && nextLesson === null;
    const tryPrimary = !r.passed;
    return (
      <main className="dev-page lesson-page" data-testid="results">
        {header}
        {session.levels ? (
          <p className="lesson-level" data-testid="level-label">
            Level: {LEVEL_NAMES[level]}
          </p>
        ) : null}
        <h2 className={r.passed ? 'lesson-verdict lesson-verdict--pass' : 'lesson-verdict'} data-testid="results-verdict">
          {r.passed ? (levelPassed ? 'Level passed' : 'Passed') : 'Not yet'}
        </h2>
        {session.levels && r.passed ? (
          <p data-testid="results-level">
            {nextLevel ? `${LEVEL_NAMES[nextLevel]} is unlocked.` : 'You passed this lesson without any live help.'}
          </p>
        ) : null}
        {mastery && r.passed && (!session.levels || level === 'prove') ? (
          <p data-testid="results-mastery">
            {useAppStore.getState().progress[lesson.id]?.passed
              ? 'Mastered: passed on two days in two keys.'
              : singleKey
                ? 'Passed once — come back tomorrow. Only one key fits your range, so one key is enough.'
                : 'Passed once — come back tomorrow in a new key.'}
          </p>
        ) : null}
        {comeBackTomorrow ? (
          <p data-testid="results-come-back">Come back tomorrow to finish this one.</p>
        ) : null}
        <p className="lesson-score" data-testid="results-score">
          {hits} of {r.notes.length} notes hit · pass mark {Math.round(lesson.passScore * 100)}%
        </p>
        {session.levels && level === 'practise' && guideHelped > 0 ? (
          <p className="lesson-guide-helped" data-testid="guide-helped">
            The guide helped on {guideHelped} of {r.notes.length} notes.
          </p>
        ) : null}
        {r.accuracy !== undefined ? <AccuracyResultLine accuracy={r.accuracy} prevBest={prevBest} /> : null}
        {runRecord ? <RunFocus run={runRecord} links={!embedded} /> : null}
        {r.notes.some((n) => n.reason === 'wrong-octave') ? (
          // Wrong octaves are not a pitch category, so their advice stays.
          <p className="lesson-tip" data-testid="results-tip">
            <strong>Tip:</strong> {pickTip(r)}
          </p>
        ) : null}
        <p className="lesson-actions" data-testid="results-actions">
          {levelPassed && nextLevel ? (
            <button className={embedded ? 'btn' : 'btn btn--primary'} data-testid="advance-level" onClick={() => advance()}>
              Go to {LEVEL_NAMES[nextLevel]}
            </button>
          ) : null}
          {nextPrimary && nextLesson ? <NextLessonLink lesson={nextLesson} /> : null}
          {backPrimary ? <BackToLessonsLink primary /> : null}
          <button
            className={tryPrimary && !embedded ? 'btn btn--primary' : 'btn'}
            onClick={() => dispatch({ type: 'BACK_TO', step: 'youDo' })}
          >
            Try again
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>
            Hear it again
          </button>
          {session.levels && level !== 'learn' ? (
            <button className="btn" data-testid="step-down" onClick={() => stepDown()}>
              {level === 'prove' ? 'Practise with help' : 'Learn with help'}
            </button>
          ) : null}
          {echo ? (
            <button className="btn" data-testid="echo-button" onClick={requestEchoFromResults}>
              Echo yourself
            </button>
          ) : null}
          {embedded || backPrimary ? null : <BackToLessonsLink />}
        </p>
        {youDoFrames ? (
          <>
            <GraphLegend />
            <ResultsGraph exercise={rex} range={range} frames={youDoFrames} />
          </>
        ) : null}
        <SequenceStrip
          expanded
          notes={rex.notes}
          currentIndex={null}
          results={r.notes.map((n) => n.hit)}
          accuracies={r.notes.map((n) => n.accuracy)}
          onChipPress={(i) => playPreviewNote(rex.notes[i].midi)}
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

  // The primary is the most likely next step: once a listen or sing-along is done, that is "Next", not a repeat.
  const forwardPrimary = !soundFailed && !micLost && (step === 'iDo' || step === 'weDo') && ranOnce;
  const nextIsPrimary = forwardPrimary;
  const runIsPrimary = !forwardPrimary;

  return (
    <main className="dev-page lesson-page">
      {header}
      <ol className="lesson-steps" aria-label="Lesson steps">
        {STEP_LABELS.map(({ step: s, label }, i) => {
          const state = s === step ? 'current' : i < STEP_LABELS.findIndex((x) => x.step === step) ? 'done' : 'later';
          return (
            <li
              key={s}
              className={`lesson-steps__item lesson-steps__item--${state}`}
              aria-current={s === step ? 'step' : undefined}
            >
              <span className="lesson-steps__label">{label}</span>
              {state === 'done' ? <span className="visually-hidden"> (done)</span> : null}
            </li>
          );
        })}
      </ol>
      {session.levels ? (
        <div className="lesson-meta">
          <p className="lesson-level" data-testid="level-label">
            Level: {LEVEL_NAMES[level]}
          </p>
          <p className="lesson-level-help" data-testid="level-help">
            {LEVEL_HELP[level]}
          </p>
          <p className="lesson-start-note" data-testid="start-note">
            Starting on {startNote === null ? '—' : midiToName(startNote)}
          </p>
        </div>
      ) : null}
      <p className="lesson-instruction" data-testid="instruction">
        {step === 'youDo' && session.levels && level === 'prove'
          ? running
            ? 'Sing it from memory.'
            : 'Your turn. Start on the lit note, then sing from memory.'
          : INSTRUCTIONS[step]}
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
      {helpLevel === 'learn' || (helpLevel === 'practise' && rescue.visible) ? (
        <NoteGuide
          target={
            live.targetMidi !== null ? midiToName(live.targetMidi) : startNote !== null ? midiToName(startNote) : '—'
          }
          cents={live.cents}
          toleranceCents={tol.cents}
          // Idle (before the count-in) it is the compact target strip, so the screen still fits the window.
          showDot={step !== 'iDo' && running}
          fadeIn={helpLevel === 'practise'}
        />
      ) : null}
      {helpLevel !== 'prove' ? (
        <>
          <PitchGraph
            exercise={ex}
            range={range}
            startSec={handle?.startSec ?? null}
            frames={liveFrames}
            showSung={step !== 'iDo' && helpLevel === 'learn'}
          />
          <GraphLegend showYou={step !== 'iDo' && helpLevel === 'learn'} />
        </>
      ) : null}
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        // Prove shows only the starting note, and only before the count-in. Practise shows targets, never the sung key.
        targetMidi={
          helpLevel === 'prove'
            ? running
              ? null
              : startNote
            : helpLevel === 'practise'
              ? (live.targetMidi ?? (running ? null : startNote))
              : live.targetMidi
        }
        sungMidi={helpLevel === 'learn' ? live.sungMidi : null}
        matchCents={tol.cents}
        rangeMarkers={{ lowMidi: range.lowMidi, highMidi: range.highMidi }}
      />
      {helpLevel !== 'prove' ? (
        <p className="lesson-notes" data-testid="note-labels">
          Target: {live.targetMidi === null ? '—' : midiToName(live.targetMidi)}
          {graded && helpLevel === 'learn' ? <> · Sung: {live.sungMidi === null ? '—' : midiToName(live.sungMidi)}</> : null}
        </p>
      ) : null}
      {helpLevel !== 'prove' ? (
        <SequenceStrip
          notes={ex.notes}
          currentIndex={live.currentNoteIndex}
          results={hasStrip && !running ? strip : undefined}
        />
      ) : null}
      {notice ? (
        <p className="tuner-error" role="alert">
          {notice}
        </p>
      ) : null}
      {weDoLine ? (
        <p data-testid="practice-line">{weDoLine}</p>
      ) : null}
      {step === 'weDo' && echoResult ? (
        <p data-testid="echo-line">
          Echo run: {echoResult.notes.filter((n) => n.hit).length} of {echoResult.notes.length} notes.
        </p>
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
              <button
                className={runIsPrimary ? 'btn btn--primary' : 'btn'}
                onClick={() => void run()}
                data-testid="run-button"
              >
                {soundFailed
                  ? 'Try again'
                  : step === 'iDo'
                    ? ranOnce
                      ? 'Play again'
                      : 'Play'
                    : step === 'weDo'
                      ? ranOnce
                        ? 'Sing along again'
                        : 'Sing along'
                      : ranOnce
                        ? 'Try again'
                        : 'Start'}
              </button>
            )}
            {step === 'iDo' ? (
              <button
                className={nextIsPrimary ? 'btn btn--primary' : 'btn'}
                onClick={() => dispatch({ type: 'NEXT' })}
                disabled={session.iDoPlays < 1}
              >
                Next: We do
              </button>
            ) : null}
            {step === 'weDo' ? (
              <>
                <button className={nextIsPrimary ? 'btn btn--primary' : 'btn'} onClick={() => dispatch({ type: 'NEXT' })}>
                  Next: You do
                </button>
                <button className="btn" onClick={() => dispatch({ type: 'BACK_TO', step: 'iDo' })}>
                  Back to I do
                </button>
                {echo ? (
                  <button className="btn" data-testid="echo-button" onClick={() => void run('echo')}>
                    Echo yourself
                  </button>
                ) : null}
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
                {session.levels && level !== 'learn' ? (
                  <button className="btn" data-testid="step-down" onClick={() => stepDown()}>
                    {level === 'prove' ? 'Practise with help' : 'Learn with help'}
                  </button>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </p>
    </main>
  );
}
