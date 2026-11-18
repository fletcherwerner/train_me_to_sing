import { describe, expect, it } from 'vitest';
import { addDays, isDateString } from './dates';
import { afterReview, dueReviews, gapForStep, initialReview, isDue } from './review';

describe('dates', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-11-20', 1)).toBe('2026-11-21');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 3)).toBe('2027-01-03');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('validates date strings', () => {
    expect(isDateString('2026-11-20')).toBe(true);
    expect(isDateString('2026-13-01')).toBe(false);
    expect(isDateString('tomorrow')).toBe(false);
  });
});

describe('review schedule', () => {
  it('steps are +1, +3, +7, then +14 repeating', () => {
    expect([0, 1, 2, 3, 4, 9].map(gapForStep)).toEqual([1, 3, 7, 14, 14, 14]);
  });
  it('mastery sets step 0 due tomorrow', () => {
    expect(initialReview('2026-11-20')).toEqual({ step: 0, dueOn: '2026-11-21' });
  });
  it('a pass moves to the next step from the day it was done', () => {
    let r = initialReview('2026-11-20');
    r = afterReview(r, true, '2026-11-21');
    expect(r).toEqual({ step: 1, dueOn: '2026-11-24' });
    r = afterReview(r, true, '2026-11-24');
    expect(r).toEqual({ step: 2, dueOn: '2026-12-01' });
    r = afterReview(r, true, '2026-12-01');
    expect(r).toEqual({ step: 3, dueOn: '2026-12-15' });
    r = afterReview(r, true, '2026-12-15');
    expect(r).toEqual({ step: 4, dueOn: '2026-12-29' });
  });
  it('a fail goes back to step 0, due tomorrow', () => {
    expect(afterReview({ step: 3, dueOn: '2026-12-15' }, false, '2026-12-16')).toEqual({ step: 0, dueOn: '2026-12-17' });
  });
  it('isDue on or after the due day', () => {
    expect(isDue({ step: 0, dueOn: '2026-11-21' }, '2026-11-20')).toBe(false);
    expect(isDue({ step: 0, dueOn: '2026-11-21' }, '2026-11-21')).toBe(true);
    expect(isDue(null, '2026-11-21')).toBe(false);
  });
  it('dueReviews lists mastered due lessons, oldest first, ties by id', () => {
    const p = (dueOn: string | null, passed = true) => ({ passed, review: dueOn ? { step: 0, dueOn } : null });
    const list = dueReviews(
      {
        b: p('2026-11-20'),
        a: p('2026-11-20'),
        c: p('2026-11-18'),
        d: p('2026-11-25'),
        e: p(null),
        f: p('2026-11-19', false),
      },
      '2026-11-21',
    );
    expect(list.map((d) => d.lessonId)).toEqual(['c', 'a', 'b']);
  });
});
