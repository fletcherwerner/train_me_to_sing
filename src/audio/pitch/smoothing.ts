/**
 * Median smoothing for pitch values.
 * Takes the last raw midi values (some may be null).
 * If at least `minNonNull` are non-null, returns the median of the non-null ones; otherwise null.
 * The scoring value uses 5 frames and needs 3; the live display uses 3 frames and needs 2.
 */
export function smoothPitch(values: (number | null)[], minNonNull = 3): number | null {
  const nonNull = values.filter((v): v is number => v != null);
  if (nonNull.length < minNonNull) return null;
  nonNull.sort((a, b) => a - b);
  const mid = Math.floor(nonNull.length / 2);
  // For odd lengths this is the middle element; for even lengths, the upper middle.
  return nonNull[mid];
}

/** The median of the last `window` raw values, for the live display (a shorter window than scoring). */
export function smoothDisplay(values: (number | null)[], window: number): number | null {
  return smoothPitch(values.slice(-window), Math.ceil(window / 2));
}
