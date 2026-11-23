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
import { matchAccuracy } from '../../core/scoring/accuracy';
import {
  describeMatch,
  describeMatchMiss,
  matchTarget,
  MATCH_SING_SEC,
  type MatchDescription,
  placeTarget,
  scoreMatch,
  type MatchOutcome,
} from '../../core/scoring/matchScoring';
import { getTolerance } from '../../core/scoring/tolerance';
import type { AttemptResult } from '../../core/scoring/types';
import { AccuracyResultLine, BestAccuracyLine, storedBestAccuracy } from '../components/BestAccuracy';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { GraphLegend, PitchGraph } from '../components/PitchGraph';
import { LessonHeader } from '../components/LessonHeader';
import { BackToLessonsLink, NextLessonLink, useNextLesson } from '../components/ResultsNav';
import { useWakeLock } from '../hooks/useWakeLock';
import { flushPracticeTime, usePracticeTime } from '../hooks/usePracticeTime';
import { buildRunRecord, matchNoteRecords } from '../../core/insights/record';
import type { RunRecord } from '../../core/insights/types';
import { todayString } from '../../storage/today';
import { RunFocus } from '../components/RunFocus';
import { describeTolerance } from '../describeTolerance';
import { describeMatchLine } from '../describeReason';
import './Lesson.css';

const PIANO_SEC = 1.5;
const FEEDBACK_SEC = 0.6;

interface Take {
  midi: number;
  buffer: AudioBuffer;
}

class Cancelled extends Error {}

/** One flat target line as an exercise, for the graph. */
function targetExercise(midi: number, sec: number): ResolvedExercise {
  return {
    templateId: 'match',
    tonicMidi: midi,
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: [{ index: 0, midi, startSec: 0, durationSec: sec }],
    totalSec: sec,
  };
}

function toAttemptResult(
  targets: number[],
  outcomes: MatchOutcome[],
  passScore: number,
  accuracies: number[],
): AttemptResult {
  const s = scoreMatch(outcomes, passScore, accuracies);
  return {
    notes: outcomes.map((o, i) => ({
      index: i,
      targetMidi: targets[i],
      hit: o.matched,
      ...(o.matched ? {} : { reason: o.reason === 'silent' ? ('silent' as const) : ('wrong-note' as const) }),
      medianCents: null,
      heldFraction: o.matched ? 1 : 0,
      onsetErrorMs: null,
      accuracy: accuracies[i] ?? 0,
    })),
    score: s.score,
    passed: s.passed,
    accuracy: s.accuracy,
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
  const singSec = lesson.singSec ?? MATCH_SING_SEC;

  const [phase, setPhase] = useState<Phase>('intro');
  usePracticeTime(phase === 'running');
  /** The log entry of the last finished run, for the "Focus next" section. */
  const [runRecord, setRunRecord] = useState<RunRecord | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [outcomes, setOutcomes] = useState<MatchOutcome[]>([]);
  const [accuracies, setAccuracies] = useState<number[]>([]);
  const [descs, setDescs] = useState<MatchDescription[]>([]);
  const [remainingSec, setRemainingSec] = useState(0);
  /** The stored best accuracy from before the last saved attempt, for "New best! (was …)". */
  const [prevBest, setPrevBest] = useState<number | undefined>(undefined);
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
   * One target: the piano (or `buffer`, the student's own voice) plays, then the student sings for the full
   * `singSec` whether or not the note is matched; the match is judged once at the end.
   */
  const runTarget = async (
    midi: number,
    myRun: number,
    opts: { buffer?: Take['buffer']; keepTake: boolean },
  ): Promise<{ outcome: MatchOutcome; take: Take | null; accuracy: number; desc: MatchDescription }> => {
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
    registerSimExercise(targetExercise(midi, singSec), start, false, true);
    const rec = recordFrames(src, start, start + singSec, latencyMs / 1000);
    const unsubSung = src.subscribe((f) => setSungMidi((prev) => (prev === f.midi ? prev : f.midi)));
    setLiveFrames(rec.frames);
    setListenStart(start);
    setSinging(true);
    setStatus('Now sing it and hold the note.');
    setRemainingSec(singSec);

    let outcome: MatchOutcome = { matched: false, timeToMatchSec: null, reason: 'silent' };
    try {
      let found = false;
      for (;;) {
        await new Promise((r) => setTimeout(r, 40));
        if (myRun !== runIdRef.current) throw new Cancelled();
        const t = now() - start;
        setRemainingSec(Math.max(0, singSec - t));
        if (t >= singSec) break;
        if (!found && matchTarget(rec.frames, midi, tol, holdSec, landWithinSec, singSec).matched) {
          found = true;
          setStatus('Now sing it and hold the note. ✓ Found it — keep holding');
        }
      }
      outcome = matchTarget(rec.frames, midi, tol, holdSec, landWithinSec, singSec);
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
        const hold = targetExercise(midi, singSec);
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
    return {
      outcome,
      take: kept,
      accuracy: matchAccuracy(rec.frames, midi, singSec),
      desc: describeMatch(rec.frames, midi, tol, outcome, singSec),
    };
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
    const startedAt = Date.now();
    const results: MatchOutcome[] = [];
    const accs: number[] = [];
    const ds: MatchDescription[] = [];
    setDescs([]);
    let lastTake: Take | null = null;
    try {
      for (let i = 0; i < placed.length; i++) {
        setIdx(i);
        const { outcome, take: kept, accuracy, desc } = await runTarget(placed[i], myRun, { keepTake: true });
        accs.push(accuracy);
        ds.push(desc);
        results.push(outcome);
        setOutcomes([...results]);
        setDescs([...ds]);
        if (kept) lastTake = kept;
        setStatus(describeMatchLine(outcome, desc));
        await waitUntil(now() + FEEDBACK_SEC, myRun);
      }
    } catch (err) {
      if (err instanceof Cancelled) return;
      throw err;
    }
    const result = toAttemptResult(placed, results, lesson.passScore, accs);
    setAccuracies(accs);
    setPrevBest(storedBestAccuracy(lesson.id));
    setTake(lastTake);
    setPhase('results');
    const logged = buildRunRecord({
      lessonId: lesson.id,
      kind: 'match',
      date: todayString(),
      endedAt: new Date().toISOString(),
      durationSec: (Date.now() - startedAt) / 1000,
      inPractice: embedded === true,
      range,
      result,
      notes: matchNoteRecords(placed, results, ds, accs),
    });
    setRunRecord(logged);
    recordAttempt(lesson.id, result, undefined, undefined, logged);
    flushPracticeTime();
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

  const header = (
    <LessonHeader title={lesson.title} right={<BestAccuracyLine lessonId={lesson.id} />} />
  );
  const disp = displayRange(range);
  const target = echoRunning && take ? take.midi : (targets[idx] ?? null);
  const graphEx = useMemo(() => (target === null ? null : targetExercise(target, singSec)), [target, singSec]);

  if (phase === 'intro') {
    return (
      <main className="dev-page lesson-page" data-testid="match-intro">
        <LessonHeader title={lesson.title} />
        <p data-testid="lesson-goal">{lesson.goal}</p>
        <BestAccuracyLine lessonId={lesson.id} />
        <p data-testid="lesson-tolerance">{describeTolerance(tol)}</p>
        <p data-testid="match-how">
          {specs.length} notes. Listen to each one, then sing it and hold it for {holdSec} second{holdSec === 1 ? '' : 's'}.
          Each note runs for {singSec} seconds. Keep holding it until the bar runs out.{' '}
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
    const result = toAttemptResult(targets, outcomes, lesson.passScore, accuracies);
    const matched = outcomes.filter((o) => o.matched).length;
    const firstMiss = outcomes.find((o) => !o.matched);
    return (
      <main className="dev-page lesson-page" data-testid="results">
        {header}
        <h2 className="lesson-verdict" data-testid="results-verdict">
          {result.passed ? 'Passed' : 'Not yet'}
        </h2>
        <p className="lesson-score" data-testid="results-score">
          {matched} of {outcomes.length} notes matched · pass mark {Math.round(lesson.passScore * 100)}%
        </p>
        {result.accuracy !== undefined && accuracies.length > 0 ? (
          <AccuracyResultLine accuracy={result.accuracy} prevBest={prevBest} />
        ) : null}
        <p className="lesson-tip" data-testid="results-tip">
          <strong>Tip:</strong>{' '}
          {firstMiss ? describeMatchMiss(firstMiss.reason) : 'Every note matched. Move on to the next lesson, or try again to match faster.'}
        </p>
        {runRecord ? <RunFocus run={runRecord} links={!embedded} /> : null}
        <ol className="lesson-misses" data-testid="match-results">
          {outcomes.map((o, i) => (
            <li key={i} data-testid={`match-result-${i}`}>
              Note {i + 1} ({midiToName(targets[i])}): {describeMatchLine(o, descs[i])}
              {accuracies[i] !== undefined ? (
                <span data-testid={`note-accuracy-${i}`}> · accuracy {Math.round(accuracies[i] * 100)}%</span>
              ) : null}
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
      {outcomes.length > 0 && !echoRunning ? (
        <ol className="lesson-misses" data-testid="match-lines">
          {outcomes.map((o, i) => (
            <li key={i} data-testid={`match-line-${i}`}>
              Note {i + 1}: {describeMatchLine(o, descs[i])}
            </li>
          ))}
        </ol>
      ) : null}
      {singing ? (
        <div
          className="match-countdown"
          data-testid="match-countdown"
          role="progressbar"
          aria-label="Time left to sing this note"
          aria-valuemin={0}
          aria-valuemax={singSec}
          aria-valuenow={Math.round(remainingSec * 10) / 10}
          style={{ height: 6, background: '#ddd', borderRadius: 3, margin: '4px 0 8px' }}
        >
          <div style={{ height: '100%', width: `${(remainingSec / singSec) * 100}%`, background: '#2a7', borderRadius: 3 }} />
        </div>
      ) : null}
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
