/** Linear-interpolated quantile of an ascending-sorted list. */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Interquartile range of `values` (how much the pitch wobbled). 0 for fewer than two values. Pure. */
export function spreadOf(values: number[]): number {
  if (values.length < 2) return 0;
  const s = [...values].sort((a, b) => a - b);
  return quantile(s, 0.75) - quantile(s, 0.25);
}
