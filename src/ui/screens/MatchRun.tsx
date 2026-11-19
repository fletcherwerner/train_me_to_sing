import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../storage/store';
import { ensureAudioRunning, now, watchAudioClock } from '../../audio/audioEngine';
import {
  isMicMissing,
  MIC_LOST_MSG,
  MIC_MISSING_MSG,
  SOUND_PAUSED_MSG,
  SOUND_STOPPED_MSG,
} from '../audioMessages';
import { playBufferClip, playNoteClip, type ClipHandle } from '../../audio/exercisePlayer';
import {
  clearSimExercise,
  createPitchSource,
  isSimulated,
  recordFrames,
  registerSimExercise,
  wantsRandomKey,
} from '../../audio/pitch';
import type { PitchFrame, PitchSource } from '../../audio/pitch/PitchSource';
import { decodeTake, startTakeRecording, synthTake, type TakeRecording } from '../../audio/takeRecorder';
import type { Lesson } from '../../content/types';
import { displayRange } from '../../core/exercise/fit';
import type { ResolvedExercise } from '../../core/exercise/types';
import { midiToName } from '../../core/music/notes';
import {
  describeMatchMiss,
  matchTarget,
  MATCH_WINDOW_SEC,
  placeTarget,
  scoreMatch,
  type MatchOutcome,
} from '../../core/scoring/matchScoring';
import { getTolerance } from '../../core/scoring/tolerance';
import type { AttemptResult } from '../../core/scoring/types';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { GraphLegend, PitchGraph } from '../components/PitchGraph';
import { LessonHeader } from '../components/LessonHeader';
import { BackToLessonsLink, NextLessonLink, useNextLesson } from '../components/ResultsNav';
import { useWakeLock } from '../hooks/useWakeLock';
import { describeTolerance } from '../describeTolerance';
import './Lesson.css';

const PIANO_SEC = 1.5;
const FEEDBACK_SEC = 0.6;

interface Take {
  midi: number;
  buffer: AudioBuffer;
}

class Cancelled extends Error {}

/** One flat target line as an exercise, for the graph. */
function targetExercise(midi: number): ResolvedExercise {
  return {
    templateId: 'match',
    tonicMidi: midi,
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: [{ index: 0, midi, startSec: 0, durationSec: MATCH_WINDOW_SEC }],
    totalSec: MATCH_WINDOW_SEC,
  };
}

function toAttemptResult(targets: number[], outcomes: MatchOutcome[], passScore: number): AttemptResult {
  const s = scoreMatch(outcomes, passScore);
  return {
    notes: outcomes.map((o, i) => ({
      index: i,
      targetMidi: targets[i],
      hit: o.matched,
      ...(o.matched ? {} : { reason: o.reason === 'silent' ? ('silent' as const) : ('wrong-note' as const) }),
      medianCents: null,
      heldFraction: o.matched ? 1 : 0,
      onsetErrorMs: null,
    })),
    score: s.score,
    passed: s.passed,
  };
}

type Phase = 'intro' | 'running' | 'results';

export function MatchRun({
  lesson,
  range,
  onAttemptComplete,
  embedded,
}: {
  lesson: Lesson;
  range: { lowMidi: number; highMidi: number };
  onAttemptComplete?: (result: AttemptResult) => void;
  /** Shown inside Today's practice: the practice bar owns "what next". */
  embedded?: boolean;
}) {
  const nextLesson = useNextLesson(lesson.id, range);
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const tol = getTolerance(lesson.toleranceId);
  const specs = useMemo(() => lesson.matchTargets ?? [], [lesson]);
  const holdSec = lesson.holdSec ?? 1;
  const landWithinSec = lesson.landWithinSec ?? null;

  const [phase, setPhase] = useState<Phase>('intro');
  const [targets, setTargets] = useState<number[]>([]);
  const [outcomes, setOutcomes] = useState<MatchOutcome[]>([]);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('');
  const [singing, setSinging] = useState(false);
  const [listenStart, setListenStart] = useState<number | null>(null);
  const [liveFrames, setLiveFrames] = useState<PitchFrame[] | null>(null);
  const [sungMidi, setSungMidi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [take, setTake] = useState<Take | null>(null);
  const [echoLine, setEchoLine] = useState<string | null>(null);
  const [echoRunning, setEchoRunning] = useState(false);

  const sourceRef = useRef<PitchSource | null>(null);
  const offLostRef = useRef<(() => void) | null>(null);
  const clipRef = useRef<ClipHandle | null>(null);
  const recRef = useRef<TakeRecording | null>(null);
  const runIdRef = useRef(0);
  const running = phase === 'running';
  useWakeLock(running);

  const cancel = () => {
    runIdRef.current++;
    clipRef.current?.stop();
    clipRef.current = null;
    recRef.current?.discard();
    recRef.current = null;
    clearSimExercise();
  };

  // Leaving the screen, going to the background or losing the audio clock abandons the run; nothing is saved.
  useEffect(
    () => () => {
      cancel();
      offLostRef.current?.();
      sourceRef.current?.stop();
    },
    [],
  );
  useEffect(() => {
    if (!running && !echoRunning) return;
    const abandon = (msg: string) => {
      cancel();
      setPhase((p) => (p === 'running' ? 'intro' : p));
      setEchoRunning(false);
      setSinging(false);
      setLiveFrames(null);
      setNotice(msg);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') abandon('Paused — tap to restart');
    };
    document.addEventListener('visibilitychange', onVisibility);
    const unwatch = watchAudioClock(() => abandon(SOUND_STOPPED_MSG));
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      unwatch();
    };
  }, [running, echoRunning]);

  const connect = async () => {
    const src = createPitchSource();
    await src.start();
    offLostRef.current?.();
    sourceRef.current?.stop();
    sourceRef.current = src;
    offLostRef.current =
      src.onLost?.(() => {
        cancel();
        setPhase('intro');
        setEchoRunning(false);
        setSinging(false);
        setNotice(MIC_LOST_MSG);
      }) ?? null;
  };

  /** Waits (on the audio clock) until `t`, or throws Cancelled if the run was abandoned. */
  const waitUntil = async (t: number, myRun: number) => {
    while (now() < t) {
      await new Promise((r) => setTimeout(r, 25));
      if (myRun !== runIdRef.current) throw new Cancelled();
    }
    if (myRun !== runIdRef.current) throw new Cancelled();
  };

  /**
   * One target: the piano (or `buffer`, the student's own voice) plays, then the student has up to 8 s to match it.
   * Ends as soon as the note is matched (or slid into when landing is required).
   */
  const runTarget = async (
    midi: number,
    myRun: number,
    opts: { buffer?: Take['buffer']; keepTake: boolean },
  ): Promise<{ outcome: MatchOutcome; take: Take | null }> => {
    const src = sourceRef.current;
    if (!src) throw new Cancelled();
    setSinging(false);
    setListenStart(null);
    setLiveFrames(null);
    setSungMidi(null);
    setStatus(opts.buffer ? 'Listen to your own voice…' : 'Listen…');
    clearSimExercise();
    const clip = opts.buffer ? playBufferClip(opts.buffer) : playNoteClip(midi, PIANO_SEC);
    clipRef.current = clip;
    await waitUntil(clip.endSec + 0.15, myRun);
    clipRef.current = null;

    const start = now();
    const stream = src.getStream?.() ?? null;
    const takeRec = opts.keepTake && stream && !isSimulated() ? startTakeRecording(stream) : null;
    recRef.current = takeRec;
    registerSimExercise(targetExercise(midi), start, false, true);
    const rec = recordFrames(src, start, start + MATCH_WINDOW_SEC, latencyMs / 1000);
    const unsubSung = src.subscribe((f) => setSungMidi((prev) => (prev === f.midi ? prev : f.midi)));
    setLiveFrames(rec.frames);
    setListenStart(start);
    setSinging(true);
    setStatus('Now sing it and hold the note.');

    let outcome: MatchOutcome = { matched: false, timeToMatchSec: null, reason: 'silent' };
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 40));
        if (myRun !== runIdRef.current) throw new Cancelled();
        const t = now() - start;
        const o = matchTarget(rec.frames, midi, tol, holdSec, landWithinSec);
        if (o.matched || o.reason === 'slid') {
          outcome = o;
          break;
        }
        if (t >= MATCH_WINDOW_SEC) {
          outcome = o;
          break;
        }
      }
    } finally {
      rec.stop();
      unsubSung();
      clearSimExercise();
      setSinging(false);
      setSungMidi(null);
    }

    let kept: Take | null = null;
    if (outcome.matched && opts.keepTake && lesson.echo) {
      if (isSimulated()) {
        const hold = targetExercise(midi);
        hold.totalSec = holdSec;
        hold.notes = [{ ...hold.notes[0], durationSec: holdSec }];
        kept = { midi, buffer: synthTake(hold) };
      } else if (takeRec) {
        const recorded = await takeRec.stop();
        recRef.current = null;
        if (recorded && outcome.timeToMatchSec !== null) {
          const from = start + outcome.timeToMatchSec + latencyMs / 1000;
          const buffer = await decodeTake(recorded, from, from + holdSec);
          if (buffer) kept = { midi, buffer };
        }
      }
    }
    if (recRef.current === takeRec && takeRec) {
      takeRec.discard();
      recRef.current = null;
    }
    return { outcome, take: kept };
  };

  const begin = async () => {
    setError(null);
    setNotice(null);
    setStarting(true);
    try {
      if (!(await ensureAudioRunning())) {
        setError(SOUND_PAUSED_MSG);
        return;
      }
      await connect();
    } catch (err) {
      setError(
        isMicMissing(err)
          ? MIC_MISSING_MSG
          : err instanceof Error && err.message === 'mic-denied'
            ? 'Microphone access denied. Allow microphone access in your browser settings, reload, and press Start again.'
            : 'We could not start the microphone. Check your settings and press Start again.',
      );
      return;
    } finally {
      setStarting(false);
    }
    await runAll();
  };

  const runAll = async () => {
    const myRun = ++runIdRef.current;
    const rng = wantsRandomKey() ? Math.random : () => 0.5;
    const placed = specs.map((s) => placeTarget(s, range, rng));
    setTargets(placed);
    setOutcomes([]);
    setTake(null);
    setEchoLine(null);
    setNotice(null);
    setPhase('running');
    const results: MatchOutcome[] = [];
    let lastTake: Take | null = null;
    try {
      for (let i = 0; i < placed.length; i++) {
        setIdx(i);
        const { outcome, take: kept } = await runTarget(placed[i], myRun, { keepTake: true });
        results.push(outcome);
        setOutcomes([...results]);
        if (kept) lastTake = kept;
        setStatus(
          outcome.matched
            ? `Matched in ${(outcome.timeToMatchSec ?? 0).toFixed(1)} s`
            : outcome.reason === 'slid'
              ? 'You slid into it'
              : 'Not matched',
        );
        await waitUntil(now() + FEEDBACK_SEC, myRun);
      }
    } catch (err) {
      if (err instanceof Cancelled) return;
      throw err;
    }
    const result = toAttemptResult(placed, results, lesson.passScore);
    setTake(lastTake);
    setPhase('results');
    recordAttempt(lesson.id, result);
    onAttemptComplete?.(result);
  };

  const stop = () => {
    cancel();
    setPhase('intro');
    setEchoRunning(false);
    setSinging(false);
    setLiveFrames(null);
    setListenStart(null);
    setStatus('');
  };

  /** Echo yourself: your own best hold plays, and you match it. Scored here, never saved. */
  const echoYourself = async () => {
    if (!take || echoRunning) return;
    const myRun = ++runIdRef.current;
    setEchoLine(null);
    setEchoRunning(true);
    setPhase('running');
    try {
      const { outcome } = await runTarget(take.midi, myRun, { buffer: take.buffer, keepTake: false });
      setEchoLine(
        outcome.matched
          ? `Echo: matched in ${(outcome.timeToMatchSec ?? 0).toFixed(1)} s`
          : `Echo: not matched. ${describeMatchMiss(outcome.reason)}`,
      );
    } catch (err) {
      if (err instanceof Cancelled) return;
      throw err;
    }
    setEchoRunning(false);
    setPhase('results');
  };

  const header = <LessonHeader title={lesson.title} />;
  const disp = displayRange(range);
  const target = echoRunning && take ? take.midi : (targets[idx] ?? null);
  const graphEx = useMemo(() => (target === null ? null : targetExercise(target)), [target]);

  if (phase === 'intro') {
    return (
      <main className="dev-page lesson-page" data-testid="match-intro">
        {header}
        <p data-testid="lesson-goal">{lesson.goal}</p>
        <p data-testid="lesson-tolerance">{describeTolerance(tol)}</p>
        <p data-testid="match-how">
          {specs.length} notes. Listen to each one, then sing it and hold it for {holdSec} second{holdSec === 1 ? '' : 's'}.
          You have {MATCH_WINDOW_SEC} seconds for each.{' '}
          {landWithinSec === null
            ? 'Sliding up to the note is fine for now.'
            : `Start right on the note: you have ${landWithinSec} seconds from your first sound.`}
        </p>
        <p>Put on headphones so the piano does not get picked up by the microphone.</p>
        <p>
          <button className="btn btn--primary" onClick={() => void begin()} disabled={starting} data-testid="run-button">
            {error === SOUND_PAUSED_MSG ? 'Try again' : 'Start'}
          </button>
        </p>
        {notice ? (
          <p className="tuner-error" role="alert">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="tuner-error" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    );
  }

  if (phase === 'results') {
    const result = toAttemptResult(targets, outcomes, lesson.passScore);
    const matched = outcomes.filter((o) => o.matched).length;
    const firstMiss = outcomes.find((o) => !o.matched);
    return (
      <main className="dev-page lesson-page" data-testid="results">
        {header}
        <h2 className="lesson-verdict" data-testid="results-verdict">
          {result.passed ? 'Passed' : 'Not yet'}
        </h2>
        <p className="lesson-score" data-testid="results-score">
          {matched} of {outcomes.length} notes matched ({Math.round(result.score * 100)}%)
        </p>
        <p>Pass mark: {Math.round(lesson.passScore * 100)}%</p>
        <p className="lesson-tip" data-testid="results-tip">
          <strong>Tip:</strong>{' '}
          {firstMiss ? describeMatchMiss(firstMiss.reason) : 'Every note matched. Move on to the next lesson, or try again to match faster.'}
        </p>
        <ol className="lesson-misses" data-testid="match-results">
          {outcomes.map((o, i) => (
            <li key={i} data-testid={`match-result-${i}`}>
              Note {i + 1} ({midiToName(targets[i])}):{' '}
              {o.matched
                ? `matched in ${(o.timeToMatchSec ?? 0).toFixed(1)} s`
                : `not matched. ${describeMatchMiss(o.reason)}`}
            </li>
          ))}
        </ol>
        {echoLine ? <p data-testid="echo-line">{echoLine}</p> : null}
        {notice ? (
          <p className="tuner-error" role="alert">
            {notice}
          </p>
        ) : null}
        <p className="lesson-actions" data-testid="results-actions">
          {!embedded && result.passed && nextLesson ? <NextLessonLink lesson={nextLesson} /> : null}
          {!embedded && result.passed && !nextLesson ? <BackToLessonsLink primary /> : null}
          <button className={!result.passed && !embedded ? 'btn btn--primary' : 'btn'} onClick={() => void runAll()}>
            Try again
          </button>
          {take ? (
            <button className="btn" data-testid="echo-button" onClick={() => void echoYourself()}>
              Echo yourself
            </button>
          ) : null}
          {embedded || (result.passed && !nextLesson) ? null : <BackToLessonsLink />}
        </p>
      </main>
    );
  }

  return (
    <main className="dev-page lesson-page" data-testid="match-run">
      {header}
      <p className="lesson-instruction" data-testid="match-target">
        {echoRunning ? 'Echo yourself' : `Note ${idx + 1} of ${targets.length}`}
      </p>
      <p className="lesson-instruction" data-testid="match-status" aria-live="polite">
        {status}
      </p>
      {graphEx ? (
        <>
          <PitchGraph exercise={graphEx} range={range} startSec={listenStart} frames={liveFrames} showSung />
          <GraphLegend />
        </>
      ) : null}
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        targetMidi={target}
        sungMidi={singing ? sungMidi : null}
        matchCents={tol.cents}
        rangeMarkers={{ lowMidi: range.lowMidi, highMidi: range.highMidi }}
      />
      <p className="lesson-notes" data-testid="note-labels">
        Target: {target === null ? '—' : midiToName(target)}
        {singing ? <> · Sung: {sungMidi === null ? '—' : midiToName(sungMidi)}</> : null}
      </p>
      <p className="lesson-controls">
        <button className="btn btn--primary" onClick={stop}>
          Stop
        </button>
      </p>
    </main>
  );
}
