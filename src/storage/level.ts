import { LEVELS, type Level } from '../core/session/sessionMachine';

/** The higher of two levels; a missing level counts as Learn. */
export function maxLevel(a: Level | undefined, b: Level | undefined): Level {
  return LEVELS[Math.max(LEVELS.indexOf(a ?? 'learn'), LEVELS.indexOf(b ?? 'learn'))];
}

/** Passes at Learn that unlock Practise in a Stage 1 lesson. Other stages unlock after one. */
export const LEARN_PASSES_TO_UNLOCK = 2;

/**
 * Learn passes so far. An entry from before the count was kept that is already at Practise or Prove counts as having
 * enough, so it keeps its level and shows no "1 of 2" line.
 */
export function learnPassesOf(entry: { level?: Level; learnPasses?: number } | undefined): number {
  if (entry?.learnPasses !== undefined) return entry.learnPasses;
  return entry?.level && entry.level !== 'learn' ? LEARN_PASSES_TO_UNLOCK : 0;
}

/** The level unlocked by passing You do at `level`: Learn -> Practise, Practise -> Prove, Prove stays. */
export function unlockedBy(level: Level): Level {
  return LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(level) + 1)];
}
