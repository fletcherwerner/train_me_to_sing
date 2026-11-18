import type { Proof } from './types';

/**
 * A lesson is mastered when it was passed at Prove on at least two different days and in at least
 * two different keys (-1, an unknown key from older data, counts as different from any known key).
 * `singleKey`: only one key fits the student's range, so one key is enough.
 */
export function isMastered(p: { proofs: Proof[] }, singleKey = false): boolean {
  const days = new Set(p.proofs.map((x) => x.date));
  const tonics = new Set(p.proofs.map((x) => x.tonicMidi));
  return days.size >= 2 && (singleKey ? tonics.size >= 1 : tonics.size >= 2);
}

/** Keys already used for a proof; the next Prove attempt avoids them. */
export function proofTonics(p: { proofs: Proof[] } | undefined): number[] {
  return [...new Set((p?.proofs ?? []).map((x) => x.tonicMidi).filter((t) => t >= 0))];
}

/** Adds a proof. A second proof for the same day and key keeps the better score. */
export function addProof(proofs: Proof[], proof: Proof): Proof[] {
  const i = proofs.findIndex((x) => x.date === proof.date && x.tonicMidi === proof.tonicMidi);
  if (i < 0) return [...proofs, proof];
  const next = [...proofs];
  next[i] = { ...next[i], score: Math.max(next[i].score, proof.score) };
  return next;
}
