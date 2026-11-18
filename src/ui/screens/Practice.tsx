import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { todayString } from '../../storage/today';
import { getAllLessons } from '../../content/registry';
import type { Lesson as LessonData } from '../../content/types';
import { fit } from '../../core/exercise/fit';
import { addDays } from '../../core/progress/dates';
import { dueReviews } from '../../core/progress/review';
import { goodSessionNote, planToday, type PracticePart } from '../../core/session/practicePlan';
import type { AttemptResult } from '../../core/scoring/types';
import { LessonRun } from './Lesson';
import { MatchRun } from './MatchRun';
import { Warmup } from './Warmup';
import './Practice.css';

type Outcome = 'done' | 'passed' | 'not yet' | 'skipped';

interface PartRecord {
  label: string;
  outcome: Outcome;
}

const OUTCOME_TEXT: Record<Outcome, string> = {
  done: 'done',
  passed: 'passed',
  'not yet': 'not passed yet',
  skipped: 'skipped',
};

/** Practice minutes from `?minutes=N`, so the 20-minute note can be seen without waiting. */
function startingMinutes(search: string): number {
  const n = Number(new URLSearchParams(search).get('minutes'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function Practice() {
  const range = useAppStore((s) => s.range);
  const { search } = useLocation();
  if (!range) return <Navigate to={{ pathname: '/', search }} replace />;
  return <PracticeRun range={range} />;
}

function PracticeRun({ range }: { range: { lowMidi: number; highMidi: number } }) {
  const { search } = useLocation();
  const today = todayString();
  const lessons = useMemo(() => getAllLessons(), []);
  // The plan is made once, when practice starts, so it does not change under the student as lessons are saved.
  const [parts] = useState<PracticePart[]>(() =>
    planToday(
      lessons.filter((l) => fit(l.exercise, range).ok),
      useAppStore.getState().progress,
      today,
      Math.random,
    ),
  );
  const [idx, setIdx] = useState(0);
  const [records, setRecords] = useState<PartRecord[]>([]);
  const [finishedPart, setFinishedPart] = useState(false);
  const [lastResult, setLastResult] = useState<AttemptResult | null>(null);
  const [stopped, setStopped] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Practice time: how long this screen has been open. Not musical timing, so the wall clock is fine.
  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsedMs(Date.now() - t0), 5000);
    return () => window.clearInterval(id);
  }, []);
  const minutes = startingMinutes(search) + elapsedMs / 60000;
  const note = goodSessionNote(minutes);

  const lessonOf = (id: string): LessonData | undefined => lessons.find((l) => l.id === id);
  const labelOf = (p: PracticePart): string => {
    switch (p.kind) {
      case 'warmup':
        return 'Warm-up';
      case 'pitch':
        return `Pitch finding: ${lessonOf(p.lessonId)?.title ?? ''}`;
      case 'new':
        return `New pattern: ${lessonOf(p.lessonId)?.title ?? ''}`;
      case 'review':
        return `Review: ${lessonOf(p.lessonId)?.title ?? ''}`;
      case 'wrapup':
        return 'Wrap-up';
    }
  };

  const part = stopped ? ({ kind: 'wrapup' } as const) : parts[idx];
  const finish = (outcome: Outcome) => {
    setRecords((r) => [...r, { label: labelOf(parts[idx]), outcome }]);
    setFinishedPart(false);
    setLastResult(null);
    setIdx((i) => i + 1);
  };
  /** Ends practice now. The part in progress is recorded as far as it got. */
  const stopForToday = () => {
    if (parts[idx] && parts[idx].kind !== 'wrapup') {
      setRecords((r) => [...r, { label: labelOf(parts[idx]), outcome: finishedPart ? resultOutcome : 'skipped' }]);
    }
    setStopped(true);
  };
  const resultOutcome: Outcome = lastResult ? (lastResult.passed ? 'passed' : 'not yet') : 'done';

  const body = (() => {
    switch (part.kind) {
      case 'warmup':
        return <Warmup key={idx} range={range} onDone={() => finish('done')} />;
      case 'pitch': {
        const lesson = lessonOf(part.lessonId);
        if (!lesson) return null;
        // One round: the first few targets of the lesson.
        const round: LessonData = { ...lesson, matchTargets: (lesson.matchTargets ?? []).slice(0, part.targets) };
        return (
          <MatchRun
            key={idx}
            lesson={round}
            range={range}
            onAttemptComplete={(r) => {
              setLastResult(r);
              setFinishedPart(true);
            }}
          />
        );
      }
      case 'new':
      case 'review': {
        const lesson = lessonOf(part.lessonId);
        if (!lesson) return null;
        return (
          <LessonRun
            key={idx}
            lesson={lesson}
            range={range}
            forceLevel={part.kind === 'review' && lesson.levels ? 'prove' : undefined}
            onAttemptComplete={(r) => {
              setLastResult(r);
              setFinishedPart(true);
            }}
          />
        );
      }
      case 'wrapup':
        return <WrapUp records={records} minutes={minutes} today={today} search={search} />;
    }
  })();

  const inWrapUp = part.kind === 'wrapup';
  return (
    <div className="practice" data-testid="practice">
      <div className="practice-bar" data-testid="practice-bar">
        <span className="practice-bar__where" data-testid="practice-part">
          {inWrapUp ? 'Wrap-up' : `Part ${idx + 1} of ${parts.length - 1}: ${labelOf(part)}`}
        </span>
        <span className="practice-bar__actions">
          {inWrapUp ? null : finishedPart ? (
            <button className="btn btn--primary" onClick={() => finish(resultOutcome)} data-testid="practice-next">
              Next part
            </button>
          ) : (
            <button className="btn" onClick={() => finish('skipped')} data-testid="practice-skip">
              Skip this part
            </button>
          )}
          {inWrapUp ? null : (
            <button className="btn" onClick={stopForToday} data-testid="practice-stop">
              Stop for today
            </button>
          )}
        </span>
      </div>
      {note ? (
        <p className="practice-note" role="status" data-testid="practice-good-session">
          {note}
        </p>
      ) : null}
      {body}
    </div>
  );
}

function WrapUp({ records, minutes, today, search }: { records: PartRecord[]; minutes: number; today: string; search: string }) {
  const progress = useAppStore((s) => s.progress);
  const tomorrow = addDays(today, 1);
  const dueTomorrow = dueReviews(progress, tomorrow);
  const lessonTitle = (id: string) => getAllLessons().find((l) => l.id === id)?.title ?? id;
  const mins = Math.max(1, Math.round(minutes));
  return (
    <main className="dev-page practice-wrapup" data-testid="wrapup">
      <h1>Done for today</h1>
      <h2>What you practised</h2>
      {records.length === 0 ? (
        <p>Nothing yet. Come back when you are ready.</p>
      ) : (
        <ul data-testid="wrapup-practised">
          {records.map((r, i) => (
            <li key={i}>
              {r.label} — {OUTCOME_TEXT[r.outcome]}
            </li>
          ))}
        </ul>
      )}
      <h2>Due tomorrow</h2>
      <p data-testid="wrapup-due">
        {dueTomorrow.length === 0
          ? 'No reviews are due tomorrow.'
          : `${dueTomorrow.length} ${dueTomorrow.length === 1 ? 'review' : 'reviews'}: ${dueTomorrow.map((d) => lessonTitle(d.lessonId)).join(', ')}`}
      </p>
      <p data-testid="wrapup-time">
        Practice time: {mins} {mins === 1 ? 'minute' : 'minutes'}
      </p>
      <p>Short, regular practice works better than one long session. Rest your voice now.</p>
      <p>
        <Link to={{ pathname: '/', search }} className="btn btn--primary" data-testid="wrapup-home">
          Back to Home
        </Link>
      </p>
    </main>
  );
}
