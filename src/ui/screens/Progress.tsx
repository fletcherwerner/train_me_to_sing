import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { todayString } from '../../storage/today';
import { getAllLessons, getLesson } from '../../content/registry';
import { WEEKLY_GOAL_DAYS, weekSeconds, weekSummary } from '../../core/insights/activity';
import { QUIET_NOTICE, pctText } from '../../core/insights/categories';
import { addDays } from '../../core/progress/dates';
import {
  bestRuns,
  formatMinutes,
  improvements,
  patterns,
  todayCard,
  weeklyTrend,
  type WeekPoint,
} from '../../core/insights/summary';
import { EMPTY_HISTORY } from '../../core/insights/types';
import { LessonHeader } from '../components/LessonHeader';
import { WeekRing } from '../components/WeekRing';
import { INSIGHT_OPTS } from '../insightOptions';
import { usePracticeTime } from '../hooks/usePracticeTime';
import '../components/WeekRing.css';
import './Progress.css';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The streak line under the ring. Never discouraging: a missed week simply shows no streak. */
export function streakText(s: { goalMet: boolean; streak: number; daysToGo: number }): string | null {
  if (s.goalMet) return s.streak >= 2 ? `Goal met ${s.streak} weeks in a row` : 'Goal met this week';
  if (s.streak > 0) return `Keep it going: ${plural(s.daysToGo, 'more day', 'more days')} to keep your ${s.streak}-week streak`;
  return null;
}

function Trend({ points }: { points: WeekPoint[] }) {
  const W = 320;
  const H = 120;
  const pad = 14;
  const maxMin = Math.max(10, ...points.map((p) => p.minutes));
  const step = (W - pad * 2) / points.length;
  const x = (i: number) => pad + step * i + step / 2;
  const accPoints = points.map((p, i) => (p.accuracy === null ? null : { x: x(i), y: H - 20 - p.accuracy * (H - 40) }));
  const path = accPoints
    .map((p, i) => (p ? `${accPoints.slice(0, i).some(Boolean) && accPoints[i - 1] ? 'L' : 'M'}${p.x},${p.y}` : ''))
    .filter(Boolean)
    .join(' ');
  const withAcc = points.filter((p) => p.accuracy !== null);
  const summary =
    withAcc.length === 0
      ? 'No accuracy yet.'
      : `Mean accuracy by week, oldest first: ${withAcc.map((p) => pctText(p.accuracy as number)).join(', ')}. Practice minutes by week: ${points.map((p) => Math.round(p.minutes)).join(', ')}.`;
  return (
    <figure data-testid="trend" style={{ margin: 0 }}>
      <svg className="progress__trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {points.map((p, i) => {
          const h = (p.minutes / maxMin) * (H - 40);
          return <rect key={p.weekStart} className="progress__trend-bar" x={x(i) - step * 0.35} y={H - 20 - h} width={step * 0.7} height={h} />;
        })}
        {path ? <path className="progress__trend-line" d={path} /> : null}
        {accPoints.map((p, i) => (p ? <circle key={i} className="progress__trend-dot" cx={p.x} cy={p.y} r="3" /> : null))}
        {points.map((p, i) => (
          <text key={p.weekStart} className="progress__trend-label" x={x(i)} y={H - 6} textAnchor="middle">
            {p.weekStart.slice(5)}
          </text>
        ))}
      </svg>
      <figcaption className="progress__muted">Line: mean accuracy per week. Bars: practice minutes per week (last 8 weeks).</figcaption>
      <p className="visually-hidden">{summary}</p>
    </figure>
  );
}

export function Progress() {
  const { search } = useLocation();
  usePracticeTime(false);
  const history = useAppStore((s) => s.history) ?? EMPTY_HISTORY;
  const progress = useAppStore((s) => s.progress);
  const today = todayString();
  const titleOf = (id: string) => getLesson(id)?.title ?? (id === 'warmup' ? 'Warm-up' : id);
  const week = useMemo(() => weekSummary(history, today), [history, today]);
  const card = useMemo(() => todayCard(history, today, INSIGHT_OPTS), [history, today]);
  const pats = useMemo(() => patterns(history, today, INSIGHT_OPTS), [history, today]);
  const imps = useMemo(
    () => improvements(history, today, progress, (id) => getAllLessons().find((l) => l.id === id)?.title ?? id, INSIGHT_OPTS),
    [history, today, progress],
  );
  const trend = useMemo(() => weeklyTrend(history, today, 8), [history, today]);
  const bests = useMemo(() => bestRuns(progress, history, today), [progress, history, today]);
  const lastStart = addDays(week.weekStart, -7);
  const diff = week.count - week.lastWeekCount;
  const streak = streakText(week);
  const lessonLink = (id: string) => (getLesson(id) ? { pathname: `/lesson/${id}`, search } : null);
  const empty = history.runs.length === 0;

  return (
    <main className="dev-page progress" data-testid="progress">
      <LessonHeader title="Progress" />

      <section className="progress__card" data-testid="week-goal" aria-label="This week">
        <h2>This week</h2>
        <div className="progress__week">
          <WeekRing count={week.count} />
          <div className="progress__week-text">
            <span className="progress__big" data-testid="week-count">
              {week.count} of {WEEKLY_GOAL_DAYS} days
            </span>
            {week.goalMet ? (
              <span className="progress__goal-met" data-testid="goal-met">
                Goal met
              </span>
            ) : null}
            <span data-testid="last-week">Last week: {plural(week.lastWeekCount, 'day', 'days')}</span>
            {diff > 0 && week.lastWeekCount >= 0 ? (
              <span className="progress__muted" data-testid="week-compare">
                {diff} more than last week
              </span>
            ) : null}
            {streak ? <span data-testid="streak">{streak}</span> : null}
          </div>
        </div>
        <ol className="progress__dots" aria-label="Days this week">
          {week.dates.map((d, i) => (
            <li
              key={d}
              className="progress__dot"
              data-testid={`day-dot-${i}`}
              data-active={week.days[i]}
              data-today={d === today}
              aria-label={`${DAY_NAMES[i]}${d === today ? ' (today)' : ''}: ${week.days[i] ? 'practised' : 'not yet'}`}
            >
              {DAY_LETTERS[i]}
            </li>
          ))}
        </ol>
      </section>

      <section className="progress__card" data-testid="practice-time" aria-label="Practice time">
        <h2>Time practised</h2>
        <ul className="progress__times">
          <li>
            <strong data-testid="time-today">{formatMinutes(history.days[today]?.seconds ?? 0)}</strong>
            <span className="progress__muted">Today</span>
          </li>
          <li>
            <strong data-testid="time-week">{formatMinutes(weekSeconds(history, week.weekStart))}</strong>
            <span className="progress__muted">This week</span>
          </li>
          <li>
            <strong data-testid="time-last-week">{formatMinutes(weekSeconds(history, lastStart))}</strong>
            <span className="progress__muted">Last week</span>
          </li>
        </ul>
      </section>

      {empty ? (
        <p className="progress__card" data-testid="progress-empty">
          Sing your first lesson to start your week.
        </p>
      ) : (
        <>
          <section className="progress__card" data-testid="today-card" aria-label="Today">
            <h2>Today</h2>
            {card.runCount === 0 ? (
              <p>No runs yet today.</p>
            ) : (
              <>
                <p data-testid="today-summary">
                  {plural(card.runCount, 'run', 'runs')} · {formatMinutes(card.seconds)}
                  {card.lessonIds.length > 0 ? ` · ${card.lessonIds.map(titleOf).join(', ')}` : ''}
                </p>
                {card.newBests.length > 0 ? (
                  <p data-testid="today-bests">
                    New best: {card.newBests.map((b) => `${titleOf(b.lessonId)} (${b.what})`).join(', ')}
                  </p>
                ) : null}
                <ul className="progress__list">
                  {card.areas.map((a) => (
                    <li key={a.id}>
                      <strong>{a.name}:</strong> {a.evidence}
                      {a.tip ? ` ${a.tip}` : ''}
                    </li>
                  ))}
                </ul>
                {card.quiet ? <p data-testid="today-quiet">{QUIET_NOTICE}</p> : null}
              </>
            )}
          </section>

          <section className="progress__card" data-testid="patterns" aria-label="Your patterns">
            <h2>Your patterns</h2>
            <p className="progress__muted" data-testid="patterns-window">
              {pats.heading}
            </p>
            {pats.items.length > 0 ? (
              <ul className="progress__list">
                {pats.items.map((p) => {
                  const link = p.lessonId ? lessonLink(p.lessonId) : null;
                  return (
                    <li key={p.id} data-testid={`pattern-${p.id}`}>
                      <strong>{p.name}</strong> (on {p.daysFlagged} of {p.daysJudged} days, {pctText(p.rate)})
                      <br />
                      {p.evidence} {p.tip}
                      {link ? (
                        <>
                          {' '}
                          <Link to={link}>Practise: {titleOf(p.lessonId as string)}</Link>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p data-testid="patterns-message">{pats.message}</p>
            )}
            {pats.quiet ? <p data-testid="patterns-quiet">{QUIET_NOTICE}</p> : null}
          </section>

          <section className="progress__card" data-testid="improvements" aria-label="Improvements">
            <h2>Improvements</h2>
            {imps.text ? (
              <p>{imps.text}</p>
            ) : (
              <ul className="progress__list">
                {imps.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="progress__card" aria-label="Trend">
            <h2>Trend</h2>
            <Trend points={trend} />
          </section>
        </>
      )}

      <section className="progress__card" data-testid="best-runs" aria-label="Best runs">
        <h2>Best runs</h2>
        {bests.length === 0 ? (
          <p className="progress__muted">Your best scores show here once you finish a lesson.</p>
        ) : (
          <ul className="progress__best">
            {bests.map((b) => {
              const link = lessonLink(b.lessonId);
              const body = (
                <>
                  <span>
                    {titleOf(b.lessonId)}
                    {b.newScore || b.newAccuracy ? <span className="progress__tag">New this week</span> : null}
                  </span>
                  <span className="progress__muted">
                    {b.bestAccuracy !== undefined ? `Best accuracy ${pctText(b.bestAccuracy)} · ` : ''}Best score {pctText(b.bestScore)}
                  </span>
                </>
              );
              return (
                <li key={b.lessonId} data-testid={`best-${b.lessonId}`}>
                  {link ? <Link to={link}>{body}</Link> : <div>{body}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
