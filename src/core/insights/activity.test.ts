import { describe, expect, it } from 'vitest';
import { activeDays, weekDates, weekSeconds, weekStartOf, weekSummary } from './activity';
import { run } from './fixtures';
import type { History } from './types';

const hist = (dates: string[], days: History['days'] = {}): History => ({ runs: dates.map((date) => run({ date })), days });

describe('weeks run Monday to Sunday', () => {
  it('finds the Monday of any date', () => {
    expect(weekStartOf('2026-11-23')).toBe('2026-11-23'); // a Monday
    expect(weekStartOf('2026-11-29')).toBe('2026-11-23'); // the Sunday
    expect(weekStartOf('2026-11-30')).toBe('2026-11-30');
  });
  it('crosses a month boundary', () => {
    expect(weekStartOf('2026-12-02')).toBe('2026-11-30');
    expect(weekDates('2026-11-30')).toEqual([
      '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06',
    ]);
  });
  it('crosses a year boundary', () => {
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28');
    expect(weekDates('2026-12-28')[6]).toBe('2027-01-03');
  });
});

describe('active days', () => {
  it('lists the dates in the week that have a finished run, once each', () => {
    const h = hist(['2026-11-23', '2026-11-23', '2026-11-25', '2026-11-30']);
    expect(activeDays(h, '2026-11-23')).toEqual(['2026-11-23', '2026-11-25']);
  });
  it('a stopped run is never logged, so a day with no log entry is not active', () => {
    expect(activeDays(hist([]), '2026-11-23')).toEqual([]);
  });
});

describe('week summary and streak', () => {
  const today = '2026-11-25'; // Wednesday
  it('counts this week and last week', () => {
    const h = hist(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-23', '2026-11-25']);
    const s = weekSummary(h, today);
    expect(s.count).toBe(2);
    expect(s.days).toEqual([true, false, true, false, false, false, false]);
    expect(s.lastWeekCount).toBe(3);
    expect(s.goalMet).toBe(false);
    expect(s.daysToGo).toBe(2);
  });
  it('meets the goal at 4 active days and counts this week in the streak', () => {
    const h = hist([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', // week before last: met
      '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', // last week: met
      '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', // this week: met (Thursday is in the future, but the log says so)
    ]);
    const s = weekSummary(h, '2026-11-26');
    expect(s.goalMet).toBe(true);
    expect(s.streak).toBe(3);
  });
  it('when this week is not met yet the streak runs up to last week', () => {
    const h = hist(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-23']);
    const s = weekSummary(h, today);
    expect(s.goalMet).toBe(false);
    expect(s.streak).toBe(2);
  });
  it('when last week was missed the streak is 0', () => {
    const h = hist(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-16', '2026-11-17', '2026-11-23']);
    expect(weekSummary(h, today).streak).toBe(0);
  });
  it('a week at exactly 3 days does not count', () => {
    const h = hist(['2026-11-16', '2026-11-17', '2026-11-18']);
    expect(weekSummary(h, today).streak).toBe(0);
  });
  it('streak counts across a year boundary', () => {
    const h = hist(['2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-28', '2026-12-29', '2026-12-30', '2027-01-01']);
    const s = weekSummary(h, '2027-01-04');
    expect(s.streak).toBe(2);
    expect(s.lastWeekCount).toBe(4);
  });
});

describe('time per week', () => {
  it('sums the days of the week only', () => {
    const h = hist([], {
      '2026-11-22': { seconds: 100 }, // Sunday before
      '2026-11-23': { seconds: 60 },
      '2026-11-29': { seconds: 30 },
      '2026-11-30': { seconds: 500 },
    });
    expect(weekSeconds(h, '2026-11-23')).toBe(90);
  });
});
