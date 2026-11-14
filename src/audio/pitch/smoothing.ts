/**
 * Median smoothing for pitch values.
 * Takes the last 5 raw midi values (some may be null).
 * If at least 3 are non-null, returns the median of the non-null ones.
 * Otherwise returns null.
 */
export function smoothPitch(values: (number | null)[]): number | null {
  const nonNull = values.filter((v): v is number => v != null);
  if (nonNull.length < 3) return null;
  nonNull.sort((a, b) => a - b);
  const mid = Math.floor(nonNull.length / 2);
  // For odd-length arrays, pick the middle element.
  // For even-length (4 or 5), pick the lower middle.
  return nonNull[mid];
}
