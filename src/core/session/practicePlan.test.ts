import { describe, expect, it } from 'vitest';
import {
  describePlan,
  goodSessionNote,
  planToday,
  type PlanLesson,
  type PlanProgress,
  type PracticePart,
} from './practicePlan';

const lesson = (id: string, stage: number, order: number, kind: 'melody' | 'match', unit?: string, source: 'builtin' | 'imported' = 'builtin'): PlanLesson => ({
  id,
  stage,
  order,
  title: id,
  kind,
  source,
  ...(unit ? { unit: { id: unit } } : {}),
});

const LESSONS: PlanLesson[] = [
  lesson('s1a-01', 1, 1, 'match', 'A'),
  lesson('s1a-02', 1, 2, 'match', 'A'),
  lesson('s1a-03', 1, 3, 'match', 'A'),
  lesson('s1b-01', 1, 4, 'melody', 'B'),
  lesson('s1b-02', 1, 5, 'melody', 'B'),
  lesson('s1b-03', 1, 6, 'melody', 'B'),
  lesson('s2-01', 2, 1, 'melody'),
  lesson('imp-1', 3, 1, 'melody', undefined, 'imported'),
];

const prog = (over: Partial<PlanProgress> = {}): PlanProgress => ({ passed: false, proofs: [], review: null, ...over });
const kinds = (parts: PracticePart[]) => parts.map((p) => p.kind);
const mastered = (dueOn: string | null = null): PlanProgress =>
  prog({ passed: true, proofs: [{ date: '2026-11-01' }, { date: '2026-11-02' }], review: dueOn ? { step: 0, dueOn } : null });

const TODAY = '2026-11-20';

describe('planToday', () => {
  it('a new student: warm-up, 4 notes from the first Unit A lesson, the first pattern, wrap-up', () => {
    const parts = planToday(LESSONS, {}, TODAY, () => 0);
    expect(parts).toEqual([
      { kind: 'warmup' },
      { kind: 'pitch', lessonId: 's1a-01', targets: 4 },
      { kind: 'new', lessonId: 's1b-01', level: 'learn' },
      { kind: 'wrapup' },
    ]);
  });

  it('uses the current Unit A lesson, then s1a-03 once Unit A is passed', () => {
    const some = { 's1a-01': prog({ passed: true }) };
    expect(planToday(LESSONS, some, TODAY, () => 0)[1]).toMatchObject({ lessonId: 's1a-02' });
    const all = { 's1a-01': prog({ passed: true }), 's1a-02': prog({ passed: true }), 's1a-03': prog({ passed: true }) };
    expect(planToday(LESSONS, all, TODAY, () => 0)[1]).toMatchObject({ kind: 'pitch', lessonId: 's1a-03' });
  });

  it('mid-Unit B: the next pattern is at its current level, mastered earlier ones come back as practice', () => {
    const progress = {
      's1a-01': prog({ passed: true }),
      's1a-02': prog({ passed: true }),
      's1a-03': prog({ passed: true }),
      's1b-01': mastered(),
      's1b-02': prog({ level: 'practise' }),
    };
    const parts = planToday(LESSONS, progress, TODAY, () => 0);
    expect(parts).toEqual([
      { kind: 'warmup' },
      { kind: 'pitch', lessonId: 's1a-03', targets: 4 },
      { kind: 'new', lessonId: 's1b-02', level: 'practise' },
      { kind: 'review', lessonId: 's1b-01', due: false },
      { kind: 'wrapup' },
    ]);
  });

  it('a day with due reviews: up to 3, oldest first, instead of spare practice', () => {
    const progress = {
      's1b-01': mastered('2026-11-18'),
      's1b-02': mastered('2026-11-19'),
      's1b-03': mastered('2026-11-20'),
      's2-01': mastered('2026-11-17'),
    };
    const parts = planToday(LESSONS, progress, TODAY, () => 0);
    const reviews = parts.filter((p) => p.kind === 'review');
    expect(reviews).toEqual([
      { kind: 'review', lessonId: 's2-01', due: true },
      { kind: 'review', lessonId: 's1b-01', due: true },
      { kind: 'review', lessonId: 's1b-02', due: true },
    ]);
  });

  it('a review that is not due yet is only spare practice', () => {
    const progress = { 's1b-01': mastered('2026-11-21') };
    const parts = planToday(LESSONS, progress, TODAY, () => 0);
    expect(parts.filter((p) => p.kind === 'review')).toEqual([{ kind: 'review', lessonId: 's1b-01', due: false }]);
  });

  it('a day where every lesson has a proof today skips the new pattern', () => {
    const today = prog({ proofs: [{ date: TODAY }] });
    const progress = {
      's1a-01': prog({ passed: true }),
      's1a-02': prog({ passed: true }),
      's1a-03': prog({ passed: true }),
      's1b-01': today,
      's1b-02': today,
      's1b-03': today,
      's2-01': today,
    };
    expect(kinds(planToday(LESSONS, progress, TODAY, () => 0))).toEqual(['warmup', 'pitch', 'wrapup']);
  });

  it('skips a pattern that already has a proof today and takes the next', () => {
    const progress = { 's1b-01': prog({ proofs: [{ date: TODAY }] }) };
    expect(planToday(LESSONS, progress, TODAY, () => 0)[2]).toMatchObject({ kind: 'new', lessonId: 's1b-02' });
  });

  it('never plans imported songs', () => {
    const parts = planToday(LESSONS.filter((l) => l.source === 'imported'), {}, TODAY, () => 0);
    expect(kinds(parts)).toEqual(['warmup', 'wrapup']);
  });

  it('spare practice picks at most 2 mastered lessons from earlier than the new pattern', () => {
    const progress = {
      's1b-01': mastered(),
      's1b-02': mastered(),
      's1b-03': mastered(),
    };
    const parts = planToday(LESSONS, progress, TODAY, () => 0.3);
    const reviews = parts.filter((p) => p.kind === 'review');
    expect(reviews).toHaveLength(2);
    // The next pattern is s2-01, so all three Unit B lessons are earlier.
    expect(parts.find((p) => p.kind === 'new')).toMatchObject({ lessonId: 's2-01' });
  });
});

describe('describePlan', () => {
  it('names what the day contains', () => {
    const parts: PracticePart[] = [
      { kind: 'warmup' },
      { kind: 'pitch', lessonId: 's1a-01', targets: 4 },
      { kind: 'new', lessonId: 's1b-01', level: 'learn' },
      { kind: 'review', lessonId: 'x', due: true },
      { kind: 'review', lessonId: 'y', due: true },
      { kind: 'wrapup' },
    ];
    expect(describePlan(parts, () => 'Sol–mi')).toBe('Warm-up, 4 notes, Sol–mi, 2 reviews');
  });
});

describe('goodSessionNote', () => {
  it('appears from 20 minutes', () => {
    expect(goodSessionNote(19.9)).toBeNull();
    expect(goodSessionNote(20)).toBe("That's a good session. Stop if your voice feels tired.");
  });
});
