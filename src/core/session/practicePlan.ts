import { dueReviews } from '../progress/review';
import type { Level } from './sessionMachine';

/** The part of a lesson the plan needs. `Lesson` from content satisfies it. */
export interface PlanLesson {
  id: string;
  stage: number;
  order: number;
  title: string;
  kind: 'melody' | 'match';
  source: 'builtin' | 'imported';
  unit?: { id: string };
}

/** The part of a lesson's saved progress the plan needs. */
export interface PlanProgress {
  passed: boolean;
  level?: Level;
  proofs: { date: string }[];
  review: { step: number; dueOn: string } | null;
}

export type PracticePart =
  /** Three glides. Never scored. */
  | { kind: 'warmup' }
  /** One round of a Unit A lesson with `targets` single notes. */
  | { kind: 'pitch'; lessonId: string; targets: number }
  /** The next lesson that is not mastered yet, at the level the student has reached. */
  | { kind: 'new'; lessonId: string; level: Level }
  /** A mastered lesson again at Prove in a new key. `due` is false for a spare practice pick. */
  | { kind: 'review'; lessonId: string; due: boolean }
  | { kind: 'wrapup' };

export const PITCH_TARGETS = 4;
export const MAX_DUE_REVIEWS = 3;
export const MAX_SPARE_REVIEWS = 2;
/** After this many minutes of practice the screen says it is a good session. */
export const GOOD_SESSION_MINUTES = 20;
export const GOOD_SESSION_NOTE = "That's a good session. Stop if your voice feels tired.";

const compare = (a: PlanLesson, b: PlanLesson) => a.stage - b.stage || a.order - b.order;

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Today's practice. `lessons` are the built-in lessons that fit the student's range.
 * Order: warm-up, pitch finding, new pattern, review, wrap-up. Parts with nothing to do are left out
 * (the warm-up and wrap-up are always there).
 */
export function planToday(
  lessons: PlanLesson[],
  progress: Record<string, PlanProgress | undefined>,
  today: string,
  rng: () => number,
): PracticePart[] {
  const builtin = lessons.filter((l) => l.source === 'builtin').sort(compare);
  const parts: PracticePart[] = [{ kind: 'warmup' }];

  const unitA = builtin.filter((l) => l.kind === 'match' && l.unit?.id === 'A');
  if (unitA.length > 0) {
    const current = unitA.find((l) => !progress[l.id]?.passed);
    const target = current ?? unitA.find((l) => l.id === 's1a-03') ?? unitA[unitA.length - 1];
    parts.push({ kind: 'pitch', lessonId: target.id, targets: PITCH_TARGETS });
  }

  const melodies = builtin.filter((l) => l.kind === 'melody');
  const next = melodies.find((l) => {
    const p = progress[l.id];
    return !p?.passed && !p?.proofs.some((x) => x.date === today);
  });
  if (next) parts.push({ kind: 'new', lessonId: next.id, level: progress[next.id]?.level ?? 'learn' });

  const fitting = new Set(melodies.map((l) => l.id));
  const due = dueReviews(
    Object.fromEntries(Object.entries(progress).flatMap(([id, p]) => (p && fitting.has(id) ? [[id, p]] : []))),
    today,
  ).slice(0, MAX_DUE_REVIEWS);
  if (due.length > 0) {
    for (const d of due) parts.push({ kind: 'review', lessonId: d.lessonId, due: true });
  } else {
    const earlier = melodies.filter((l) => progress[l.id]?.passed && (!next || compare(l, next) < 0));
    for (const l of shuffled(earlier, rng).slice(0, MAX_SPARE_REVIEWS)) {
      parts.push({ kind: 'review', lessonId: l.id, due: false });
    }
  }

  parts.push({ kind: 'wrapup' });
  return parts;
}

/** "Warm-up, 4 notes, Sol–mi, 2 reviews" */
export function describePlan(parts: PracticePart[], titleOf: (lessonId: string) => string): string {
  const out: string[] = [];
  let reviews = 0;
  for (const p of parts) {
    if (p.kind === 'warmup') out.push('Warm-up');
    else if (p.kind === 'pitch') out.push(`${p.targets} notes`);
    else if (p.kind === 'new') out.push(titleOf(p.lessonId));
    else if (p.kind === 'review') reviews++;
  }
  if (reviews > 0) out.push(`${reviews} ${reviews === 1 ? 'review' : 'reviews'}`);
  return out.join(', ');
}

/** The note shown once practice time passes 20 minutes, or null before. */
export function goodSessionNote(practiceMinutes: number): string | null {
  return practiceMinutes >= GOOD_SESSION_MINUTES ? GOOD_SESSION_NOTE : null;
}
