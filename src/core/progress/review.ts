import { addDays } from './dates';
import type { ReviewState } from './types';

/** Days after mastery (step 0), then after each passed review. Later steps repeat the last gap. */
const GAPS = [1, 3, 7, 14];

export function gapForStep(step: number): number {
  return GAPS[Math.min(Math.max(step, 0), GAPS.length - 1)];
}

/** The review a lesson gets the day it is mastered. */
export function initialReview(today: string): ReviewState {
  return { step: 0, dueOn: addDays(today, gapForStep(0)) };
}

/** A pass moves to the next step; a fail goes back to step 0, due tomorrow. */
export function afterReview(review: ReviewState, passed: boolean, today: string): ReviewState {
  if (!passed) return initialReview(today);
  const step = review.step + 1;
  return { step, dueOn: addDays(today, gapForStep(step)) };
}

export function isDue(review: ReviewState | null, today: string): boolean {
  return review !== null && review.dueOn <= today;
}

export interface DueReview {
  lessonId: string;
  step: number;
  dueOn: string;
}

/** Due reviews of mastered lessons, oldest first (ties by lesson id). */
export function dueReviews(
  progress: Record<string, { passed: boolean; review: ReviewState | null }>,
  today: string,
): DueReview[] {
  const out: DueReview[] = [];
  for (const [lessonId, p] of Object.entries(progress)) {
    if (p.passed && p.review && isDue(p.review, today)) out.push({ lessonId, step: p.review.step, dueOn: p.review.dueOn });
  }
  return out.sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.lessonId.localeCompare(b.lessonId));
}
