import { isDateString, localDateString } from '../core/progress/dates';

/**
 * Today's local calendar day, `YYYY-MM-DD`. A `?today=2026-11-20` in the URL replaces it so the
 * tests can move between days. Practice days are not musical timing, so the wall clock is fine here.
 */
export function todayString(): string {
  const hash = window.location.hash;
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?')) : window.location.search;
  const override = new URLSearchParams(query).get('today');
  return override !== null && isDateString(override) ? override : localDateString(new Date());
}
