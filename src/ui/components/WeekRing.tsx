import { WEEKLY_GOAL_DAYS } from '../../core/insights/activity';

/** A ring that fills a quarter for each active day this week and is full, with a tick, at the goal. Decorative: the count is written next to it. */
export function WeekRing({ count, size = 96 }: { count: number; size?: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const shown = Math.min(count, WEEKLY_GOAL_DAYS);
  const met = count >= WEEKLY_GOAL_DAYS;
  return (
    <svg className={`week-ring${met ? ' week-ring--met' : ''}`} width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle className="week-ring__track" cx="22" cy="22" r={r} fill="none" strokeWidth="5" />
      <circle
        className="week-ring__fill"
        cx="22"
        cy="22"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(shown / WEEKLY_GOAL_DAYS) * circ} ${circ}`}
        transform="rotate(-90 22 22)"
      />
      <text className="week-ring__text" x="22" y="22" textAnchor="middle" dominantBaseline="central" fontSize={met ? 16 : 14} fontWeight="700">
        {met ? '✓' : `${count}`}
      </text>
    </svg>
  );
}
