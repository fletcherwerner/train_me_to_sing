import { LEVELS, type Level } from '../core/session/sessionMachine';

/** The higher of two levels; a missing level counts as Learn. */
export function maxLevel(a: Level | undefined, b: Level | undefined): Level {
  return LEVELS[Math.max(LEVELS.indexOf(a ?? 'learn'), LEVELS.indexOf(b ?? 'learn'))];
}

/** The level unlocked by passing You do at `level`: Learn -> Practise, Practise -> Prove, Prove stays. */
export function unlockedBy(level: Level): Level {
  return LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(level) + 1)];
}
