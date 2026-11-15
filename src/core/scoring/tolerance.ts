import type { ToleranceProfile } from './types';

export const TOLERANCE_FLOOR = { cents: 25, timingMs: 150 } as const;

export const TOLERANCES: readonly ToleranceProfile[] = [
  { id: 't1', cents: 50, holdFraction: 0.5, timingMs: 400 },
  { id: 't2', cents: 40, holdFraction: 0.6, timingMs: 300 },
  { id: 't3', cents: 35, holdFraction: 0.65, timingMs: 250 },
  { id: 't4', cents: 30, holdFraction: 0.7, timingMs: 200 },
];

export function getTolerance(id: string): ToleranceProfile {
  const t = TOLERANCES.find((p) => p.id === id);
  if (!t) throw new Error(`Unknown tolerance profile: ${id}`);
  return t;
}
