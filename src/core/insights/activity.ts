import { addDays } from '../progress/dates';
import type { History } from './types';

/** Active days needed in a week to meet the weekly goal. */
export const WEEKLY_GOAL_DAYS = 4;

/** Monday of the week that holds `date` (weeks run Monday to Sunday). */
export function weekStartOf(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

/** The seven dates of the week starting `weekStart`. */
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** The dates in that week with at least one finished run. Stopped runs are never logged, so they never count. */
export function activeDays(history: History, weekStart: string): string[] {
  const days = new Set(history.runs.map((r) => r.date));
  return weekDates(weekStart).filter((d) => days.has(d));
}

/** All dates with a finished run. */
export function activeDateSet(history: History): Set<string> {
  return new Set(history.runs.map((r) => r.date));
}

export interface WeekSummary {
  weekStart: string;
  /** Monday..Sunday: was the day active. */
  days: boolean[];
  /** The dates, Monday..Sunday. */
  dates: string[];
  count: number;
  lastWeekCount: number;
  goalMet: boolean;
  /** Whole weeks in a row with the goal met: counted back from last week, plus this week once it is met. */
  streak: number;
  /** Days still needed this week (0 when met). */
  daysToGo: number;
}

export function weekSummary(history: History, today: string): WeekSummary {
  const weekStart = weekStartOf(today);
  const dates = weekDates(weekStart);
  const set = activeDateSet(history);
  const days = dates.map((d) => set.has(d));
  const count = days.filter(Boolean).length;
  const lastStart = addDays(weekStart, -7);
  const lastWeekCount = activeDays(history, lastStart).length;
  const goalMet = count >= WEEKLY_GOAL_DAYS;
  const earliest = history.runs.reduce<string | null>((m, r) => (m === null || r.date < m ? r.date : m), null);
  let streak = goalMet ? 1 : 0;
  if (earliest !== null) {
    for (let w = lastStart; addDays(w, 6) >= earliest; w = addDays(w, -7)) {
      if (activeDays(history, w).length >= WEEKLY_GOAL_DAYS) streak++;
      else break;
    }
  }
  return { weekStart, days, dates, count, lastWeekCount, goalMet, streak, daysToGo: Math.max(0, WEEKLY_GOAL_DAYS - count) };
}

/** Practice seconds in the week starting `weekStart`. */
export function weekSeconds(history: History, weekStart: string): number {
  return weekDates(weekStart).reduce((sum, d) => sum + (history.days[d]?.seconds ?? 0), 0);
}
