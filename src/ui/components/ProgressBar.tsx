/** A thin bar for "3 of 7 passed". Decorative: the count is always written next to it. */
export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <span className="progress-bar" aria-hidden="true">
      <span className="progress-bar__fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
