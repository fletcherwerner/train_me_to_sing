import { describe, expect, it } from 'vitest';
import { addDays } from '../progress/dates';
import { bestRuns, improvements, KEEP_GOING_TEXT, patterns, todayCard, weeklyTrend } from './summary';
import { run, times } from './fixtures';
import type { History, NoteRecord, RunRecord } from './types';

const TODAY = '2026-11-23';
const ago = (n: number) => addDays(TODAY, -n);

/** One run of `total` voiced notes, `flat` of them 30 cents flat. */
const flatRun = (date: string, flat: number, total = 10, over: Partial<RunRecord> = {}): RunRecord =>
  run({ date, accuracy: 0.6, score: 0.5, notes: [...times(flat, -30), ...times(total - flat, 0)] as NoteRecord[], ...over });

const hist = (runs: RunRecord[]): History => ({ runs, days: {} });
const titleOf = (id: string) => id;

describe('patterns window', () => {
  it('uses the last 14 days with 60 voiced notes over 3 active days', () => {
    const h = hist([flatRun(ago(1), 5, 20), flatRun(ago(5), 5, 20), flatRun(ago(12), 5, 20)]);
    const p = patterns(h, TODAY);
    expect(p.windowDays).toBe(14);
    expect(p.heading).toBe('Last 2 weeks');
  });
  it('falls back to 7 days with 30 voiced notes over 2 active days', () => {
    const h = hist([flatRun(ago(1), 5, 20), flatRun(ago(3), 5, 20)]);
    const p = patterns(h, TODAY);
    expect(p.windowDays).toBe(7);
    expect(p.heading).toBe('Last week');
  });
  it('does not use the 14-day window when its days are spread but the notes are few', () => {
    const h = hist([flatRun(ago(1), 5, 10), flatRun(ago(5), 5, 10), flatRun(ago(12), 5, 10)]);
    expect(patterns(h, TODAY).windowDays).toBeNull();
  });
  it('shows no window and asks for more days when there is too little', () => {
    const p = patterns(hist([flatRun(ago(1), 5, 10)]), TODAY);
    expect(p.windowDays).toBeNull();
    expect(p.items).toEqual([]);
    expect(p.message).toContain('Sing on a few more days');
    expect(p.moreDaysNeeded).toBe(1);
  });
});

describe('patterns', () => {
  it('names a category flagged over the window and on at least half its days', () => {
    const h = hist([flatRun(ago(1), 7, 20), flatRun(ago(3), 7, 20), flatRun(ago(5), 7, 20)]);
    const p = patterns(h, TODAY);
    const flat = p.items.find((i) => i.id === 'flat')!;
    expect(flat).toBeDefined();
    expect(flat.daysFlagged).toBe(3);
    expect(flat.daysJudged).toBe(3);
    expect(flat.tip).toContain('aim a little higher');
  });
  it('one bad day is not a pattern', () => {
    // 1 very bad day of 3: flagged over the window (10 of 40 = 25% is not enough), so make it bad enough
    const h = hist([flatRun(ago(1), 20, 20), flatRun(ago(3), 0, 20), flatRun(ago(5), 0, 20), flatRun(ago(6), 0, 20)]);
    const p = patterns(h, TODAY);
    expect(p.windowDays).toBe(14);
    // window rate 20/80 = 25%: not flagged; and even at 30%+ only 1 of 4 days is flagged
    expect(p.items.find((i) => i.id === 'flat')).toBeUndefined();
    const h2 = hist([flatRun(ago(1), 20, 20), flatRun(ago(3), 4, 20), flatRun(ago(5), 0, 20), flatRun(ago(6), 0, 20)]);
    // window 24/80 = 30% flagged, but only day 1 flagged day-by-day (4/20 = 20%)
    const p2 = patterns(h2, TODAY);
    expect(p2.items.find((i) => i.id === 'flat')).toBeUndefined();
  });
  it('lists at most 3, worst first', () => {
    const many = (d: string) =>
      run({
        date: d,
        notes: [...times(6, -30, { h: 0.2, sc: true, o: 500, r: 'late' }), ...times(14, -30, { h: 0.2, sc: true, o: 500, r: 'late' })],
      });
    const p = patterns(hist([many(ago(1)), many(ago(2)), many(ago(3))]), TODAY);
    expect(p.items.length).toBeLessThanOrEqual(3);
    expect(p.items.length).toBeGreaterThan(0);
  });
});

describe('improvements', () => {
  /** 20 days of data: before = days 15-28 back, recent = days 1-14 back. */
  const twoWindows = (beforeFlat: number, recentFlat: number, beforeAcc = 0.6, recentAcc = 0.6) =>
    hist([
      flatRun(ago(20), beforeFlat, 20, { accuracy: beforeAcc }),
      flatRun(ago(18), beforeFlat, 20, { accuracy: beforeAcc }),
      flatRun(ago(8), recentFlat, 20, { accuracy: recentAcc }),
      flatRun(ago(4), recentFlat, 20, { accuracy: recentAcc }),
    ]);
  it('recognises a rate that fell by 10 points and a third', () => {
    const r = improvements(twoWindows(8, 4), TODAY, {}, titleOf); // 40% -> 20%
    expect(r.comparable).toBe(true);
    expect(r.categories).toContain('flat');
    expect(r.lines[0]).toBe('Landing flat: 40% of notes → 20%');
  });
  it('does not count a 10-point drop that is under a third of the earlier rate', () => {
    // 80% -> 70%: drop 10 points but a third of 80% is 26.7 points
    const r = improvements(twoWindows(16, 14), TODAY, {}, titleOf);
    expect(r.categories).not.toContain('flat');
  });
  it('does not count a third of the earlier rate that is under 10 points', () => {
    // 15% -> 10%: a third (5 points) but not 10 points
    const r = improvements(twoWindows(3, 2), TODAY, {}, titleOf);
    expect(r.categories).not.toContain('flat');
  });
  it('says keep going when the earlier window has too little data', () => {
    const h = hist([flatRun(ago(8), 4, 20), flatRun(ago(4), 4, 20)]);
    const r = improvements(h, TODAY, {}, titleOf);
    expect(r.comparable).toBe(false);
    expect(r.text).toBe(KEEP_GOING_TEXT);
  });
  it('recognises accuracy up by 5 points', () => {
    const r = improvements(twoWindows(4, 4, 0.62, 0.71), TODAY, {}, titleOf);
    expect(r.lines).toContain('Your accuracy went from 62% to 71%');
  });
  it('recognises a lesson mastered in the recent window', () => {
    const r = improvements(twoWindows(4, 4), TODAY, { 's1b-04': { passed: true, proofs: [{ date: ago(6) }] } }, titleOf);
    expect(r.lines).toContain('You mastered s1b-04');
  });
  it('recognises more active days', () => {
    const h = hist([
      flatRun(ago(20), 4, 20), flatRun(ago(18), 4, 20),
      flatRun(ago(10), 4, 20), flatRun(ago(8), 4, 20), flatRun(ago(5), 4, 20),
    ]);
    expect(improvements(h, TODAY, {}, titleOf).lines).toContain('You practised on more days: 3, up from 2');
  });
  it('shows consistency when nothing improved, and never an empty box', () => {
    const r = improvements(twoWindows(4, 4), TODAY, {}, titleOf);
    expect(r.comparable).toBe(true);
    expect(r.lines).toEqual(['You practised 2 days in the last two weeks.']);
  });
});

describe('today card', () => {
  it('combines the day: runs, lessons, new bests and areas', () => {
    const before = flatRun(ago(2), 0, 10, { lessonId: 'a', score: 0.5, accuracy: 0.5 });
    const t1 = flatRun(TODAY, 6, 10, { lessonId: 'a', score: 0.7, accuracy: 0.6 });
    const t2 = flatRun(TODAY, 6, 10, { lessonId: 'b', score: 0.4, accuracy: 0.4 });
    const h: History = { runs: [before, t1, t2], days: { [TODAY]: { seconds: 300 } } };
    const c = todayCard(h, TODAY);
    expect(c.runCount).toBe(2);
    expect(c.seconds).toBe(300);
    expect(c.lessonIds).toEqual(['a', 'b']);
    expect(c.newBests).toContainEqual({ lessonId: 'a', what: 'score' });
    expect(c.areas[0].id).toBe('flat');
    expect(c.fromLastRun).toBe(false);
  });
  it('below the full minimums it shows the last run areas', () => {
    const c = todayCard(hist([flatRun(TODAY, 5, 5)]), TODAY);
    expect(c.fromLastRun).toBe(true);
    expect(c.areas[0].id).toBe('flat');
  });
  it('is empty with no runs today', () => {
    const c = todayCard(hist([flatRun(ago(1), 5)]), TODAY);
    expect(c.runCount).toBe(0);
    expect(c.areas).toEqual([]);
  });
});

describe('weekly trend and best runs', () => {
  it('has 8 weeks, oldest first, with the mean accuracy and minutes', () => {
    const h: History = { runs: [flatRun(TODAY, 0, 10, { accuracy: 0.8 }), flatRun(TODAY, 0, 10, { accuracy: 0.6 })], days: { [TODAY]: { seconds: 600 } } };
    const t = weeklyTrend(h, TODAY, 8);
    expect(t).toHaveLength(8);
    expect(t[7].weekStart).toBe('2026-11-23');
    expect(t[7].accuracy).toBeCloseTo(0.7);
    expect(t[7].minutes).toBe(10);
    expect(t[0].accuracy).toBeNull();
  });
  it('marks personal bests set in the last 7 days', () => {
    const h = hist([
      flatRun(ago(30), 0, 10, { lessonId: 'a', score: 0.6, accuracy: 0.6 }),
      flatRun(ago(2), 0, 10, { lessonId: 'a', score: 0.9, accuracy: 0.9 }),
      flatRun(ago(30), 0, 10, { lessonId: 'b', score: 0.9, accuracy: 0.9 }),
      flatRun(ago(2), 0, 10, { lessonId: 'b', score: 0.5, accuracy: 0.5 }),
    ]);
    const prog = { a: { bestScore: 0.9, bestAccuracy: 0.9 }, b: { bestScore: 0.9, bestAccuracy: 0.9 } };
    const b = bestRuns(prog, h, TODAY);
    expect(b.find((x) => x.lessonId === 'a')).toMatchObject({ newScore: true, newAccuracy: true });
    expect(b.find((x) => x.lessonId === 'b')).toMatchObject({ newScore: false, newAccuracy: false });
  });
  it('lists best accuracy first', () => {
    const b = bestRuns({ a: { bestScore: 1, bestAccuracy: 0.5 }, b: { bestScore: 0.5, bestAccuracy: 0.9 }, c: { bestScore: 0, } }, hist([]), TODAY);
    expect(b.map((x) => x.lessonId)).toEqual(['b', 'a']);
  });
});
