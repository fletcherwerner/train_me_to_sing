import { useMemo, useState } from 'react';
import { todayString } from '../../storage/today';
import { usesMastery } from '../../content/mastery';
import { isDue } from '../../core/progress/review';
import { nextLesson } from '../../core/progress/next';
import { ProgressBar } from '../components/ProgressBar';
import { describePlan, planToday } from '../../core/session/practicePlan';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { midiToName } from '../../core/music/notes';
import { getAllLessons } from '../../content/registry';
import { fit } from '../../core/exercise/fit';
import type { Lesson } from '../../content/types';
import { useProfileStatus } from '../../storage/profiles';
import {
  dismissFileUnreadableNotice,
  dismissStage1Notice,
  FILE_UNREADABLE_TEXT,
  STAGE1_NOTICE_TEXT,
  useNotices,
} from '../../storage/notices';
import { WEEKLY_GOAL_DAYS, weekSummary } from '../../core/insights/activity';
import { EMPTY_HISTORY } from '../../core/insights/types';
import { WeekRing } from '../components/WeekRing';
import '../components/WeekRing.css';
import './Progress.css';
import './Home.css';

const LEVEL_TEXT = { learn: 'Learn', practise: 'Practise', prove: 'Prove' } as const;

const STAGE_NAMES: Record<number, string> = {
  1: 'Stage 1 — Note matching',
  2: 'Stage 2 — Scales',
  3: 'Stage 3 — Songs',
};

const STRICTER_NOTE: Record<number, string> = {
  2: 'Stricter than Stage 1: tighter pitch, longer holds and tighter timing.',
};

type Item = { lesson: Lesson; fitResult: ReturnType<typeof fit> | null };

/** Stage 1 is shown in its units; other stages are one group. */
function groupsOf(items: Item[]): { key: string; unit: Lesson['unit'] | null; items: Item[] }[] {
  const out: { key: string; unit: Lesson['unit'] | null; items: Item[] }[] = [];
  for (const it of items) {
    const unit = it.lesson.unit ?? null;
    const key = unit?.id ?? 'all';
    const last = out[out.length - 1];
    if (last && last.key === key) last.items.push(it);
    else out.push({ key, unit, items: [it] });
  }
  return out;
}

export function Home() {
  const range = useAppStore((s) => s.range);
  const progress = useAppStore((s) => s.progress);
  const history = useAppStore((s) => s.history) ?? EMPTY_HISTORY;
  const removeImportedLesson = useAppStore((s) => s.removeImportedLesson);
  const importedRaw = useAppStore((s) => s.importedLessons);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  void importedRaw; // subscribe so the list refreshes when songs are added or removed
  const profileName = useProfileStatus((s) => s.activeName);
  const { search } = useLocation();
  // Without a range nothing can be fitted yet: every lesson waits for the range test (or a loaded profile).
  const all = getAllLessons().map((lesson) => ({ lesson, fitResult: range ? fit(lesson.exercise, range) : null }));
  const lessons = all.filter((l) => l.lesson.source !== 'imported');
  const mySongs = all.filter((l) => l.lesson.source === 'imported');
  const today = todayString();
  const weekCount = useMemo(() => weekSummary(history, today).count, [history, today]);
  const plan = useMemo(
    () =>
      range
        ? planToday(
            lessons.filter((l) => l.fitResult?.ok).map((l) => l.lesson),
            progress,
            today,
            Math.random,
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, progress, today],
  );
  const titleOf = (id: string) => all.find((l) => l.lesson.id === id)?.lesson.title ?? id;
  const pitchPart = plan.find((p) => p.kind === 'pitch');
  const stages = [...new Set(lessons.map((l) => l.lesson.stage))];
  // The same rule as "Next lesson" on the results screen (UR-20).
  const recommendedId = range
    ? (nextLesson(
        lessons.map((l) => l.lesson),
        progress,
        range,
      )?.id ?? null)
    : null;

  const status = (lesson: Lesson) => {
    const p = progress[lesson.id];
    if (!p || p.attempts === 0) return { kind: 'new', text: 'Not started', icon: '○' };
    // Best accuracy, not the notes-hit score. Older data has none: show the status without a percentage.
    const acc = p.bestAccuracy === undefined ? null : `${Math.round(p.bestAccuracy * 100)}%`;
    if (p.passed) {
      const due = isDue(p.review, today) ? ' · Review due' : '';
      return { kind: 'passed', text: `Passed${acc ? ` · ${acc}` : ''}${due}`, icon: '✓' };
    }
    if (usesMastery(lesson) && p.proofs.length > 0) {
      return {
        kind: 'attempted',
        text: `Passed once${acc ? ` · ${acc}` : ''} — come back tomorrow in a new key`,
        icon: '◐',
      };
    }
    // Lessons with levels show the level reached.
    const levelText = lesson.levels ? `${LEVEL_TEXT[p.level ?? 'learn']} · ` : '';
    return { kind: 'attempted', text: `${levelText}${acc ? `Best ${acc}` : 'Started'}`, icon: '◐' };
  };
  const stage1Notice = useNotices((s) => s.stage1Rebuilt);
  const fileNotice = useNotices((s) => s.fileUnreadable);

  return (
    <main className="dev-page home">
      <header className="home__header">
        <div>
          <h1>Train Me To Sing</h1>
          {profileName ? (
            <p>
              <Link to={{ pathname: '/settings', search }} className="home__profile" data-testid="home-profile">
                Profile:{' '}<strong>{profileName}</strong>
              </Link>
            </p>
          ) : null}
          <p data-testid="home-range">
            {range ? (
              <>
                Your range: <strong>{midiToName(range.lowMidi)} – {midiToName(range.highMidi)}</strong>
              </>
            ) : (
              <>Your range: not set yet</>
            )}
          </p>
        </div>
        <nav className="home__links" aria-label="Tools">
          <Link to={{ pathname: '/settings', search }} className="nav-link home__settings">
            <span aria-hidden="true">⚙</span>{' '}
            Settings
          </Link>
          <Link to={{ pathname: '/mic-check', search }} className="nav-link" data-testid="home-mic-check">
            <span aria-hidden="true">🎤</span>{' '}
            Mic check
          </Link>
          <Link to={{ pathname: '/progress', search }} className="nav-link" data-testid="home-progress">
            <span aria-hidden="true">📈</span>{' '}
            Progress
          </Link>
        </nav>
      </header>
      <Link to={{ pathname: '/progress', search }} className="home__week-ring" data-testid="home-week-ring">
        <WeekRing count={weekCount} size={44} />
        <span>
          {weekCount} of {WEEKLY_GOAL_DAYS} days this week
        </span>
      </Link>

      {stage1Notice ? (
        <section className="home__continue" data-testid="stage1-notice" role="status">
          <p>{STAGE1_NOTICE_TEXT}</p>
          <button type="button" className="btn" onClick={dismissStage1Notice} data-testid="stage1-notice-dismiss">
            OK
          </button>
        </section>
      ) : null}

      {fileNotice ? (
        <section className="home__continue" data-testid="file-unreadable-notice" role="status">
          <p>{FILE_UNREADABLE_TEXT}</p>
          <button type="button" className="btn" onClick={dismissFileUnreadableNotice} data-testid="file-unreadable-dismiss">
            OK
          </button>
        </section>
      ) : null}

      {!range ? (
        <section className="home__continue" data-testid="setup-card">
          <h2>Get started</h2>
          <p>Find your vocal range so every lesson fits your voice. It takes about a minute.</p>
          <Link to={{ pathname: '/range', search }} className="btn btn--primary home__continue-link">
            Find my range
          </Link>
          <p className="home__setup-alt">
            Already have a profile?{' '}
            <Link to={{ pathname: '/settings', search }} className="nav-link">
              Load it in Settings
            </Link>
          </p>
        </section>
      ) : null}

      {range ? (
        <section className="home__continue" data-testid="continue-card">
          <h2>Today&apos;s practice</h2>
          <p data-testid="practice-summary">{describePlan(plan, titleOf)}</p>
          {pitchPart ? <p>Pitch finding: {titleOf((pitchPart as { lessonId: string }).lessonId)}</p> : null}
          <p>About 12–15 minutes.</p>
          <Link
            to={{ pathname: '/practice', search }}
            className="btn btn--primary home__continue-link"
            data-testid="start-practice"
          >
            Start today&apos;s practice
          </Link>
        </section>
      ) : null}

      {stages.map((stage) => {
        const inStage = lessons.filter((l) => l.lesson.stage === stage);
        const passedCount = inStage.filter((l) => progress[l.lesson.id]?.passed).length;
        return (
          <section key={stage} className="home__stage" aria-label={STAGE_NAMES[stage]}>
            <h2>{STAGE_NAMES[stage]}</h2>
            <p className="home__count" data-testid={`stage-${stage}-count`}>
              {passedCount} of {inStage.length} passed
              <ProgressBar value={passedCount} max={inStage.length} />
            </p>
            {STRICTER_NOTE[stage] ? (
              <p className="home__count" data-testid={`stage-${stage}-note`}>
                {STRICTER_NOTE[stage]}{' '}
                <Link to={{ pathname: '/settings/calibrate', search }} className="nav-link">
                  Calibrate timing
                </Link>{' '}
                first.
              </p>
            ) : null}
            {groupsOf(inStage).map((group) => (
            <div key={group.key} data-testid={group.unit ? `unit-${group.unit.id}` : undefined}>
            {group.unit ? (
              <>
                <h3 className="home__unit">
                  Unit {group.unit.id} — {group.unit.title}
                </h3>
                <p className="home__count" data-testid={`unit-${group.unit.id}-count`}>
                  {group.items.filter((l) => progress[l.lesson.id]?.passed).length} of {group.items.length} passed
                  <ProgressBar
                    value={group.items.filter((l) => progress[l.lesson.id]?.passed).length}
                    max={group.items.length}
                  />
                </p>
              </>
            ) : null}
            <ul className="home__list">
              {group.items.map(({ lesson, fitResult }) => {
                const noteCount = lesson.kind === 'match' ? (lesson.matchTargets?.length ?? 0) : lesson.exercise.notes.length;
                const st = status(lesson);
                const body = (
                  <>
                    <span className="home__row-main">
                      <span className="home__row-title">
                        {lesson.title}
                        {lesson.id === recommendedId ? (
                          <span className="home__next-tag" data-testid="next-tag">
                            Next
                          </span>
                        ) : null}
                      </span>
                      <span className="home__row-notes">
                        {noteCount} {lesson.kind === 'match' ? 'targets' : 'notes'}
                      </span>
                    </span>
                    {fitResult == null ? (
                      <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                        Find your range first
                      </span>
                    ) : fitResult.ok ? (
                      <span className={`home__status home__status--${st.kind}`} data-testid={`status-${lesson.id}`}>
                        <span aria-hidden="true">{st.icon} </span>
                        {st.text}
                      </span>
                    ) : (
                      <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                        Doesn&apos;t fit: needs {fitResult.neededSemitones} semitones; your range is {fitResult.haveSemitones}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={lesson.id}>
                    {fitResult?.ok ? (
                      <Link
                        className={lesson.id === recommendedId ? 'home__row home__row--next' : 'home__row'}
                        data-testid={`lesson-${lesson.id}`}
                        to={{ pathname: `/lesson/${lesson.id}`, search }}
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="home__row home__row--disabled" data-testid={`lesson-${lesson.id}`} aria-disabled="true">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            </div>
            ))}
          </section>
        );
      })}

      {mySongs.length > 0 ? (
        <section className="home__stage" aria-label="My songs" data-testid="my-songs">
          <h2>My songs</h2>
          <ul className="home__list">
            {mySongs.map(({ lesson, fitResult }) => {
              const st = status(lesson);
              const body = (
                <>
                  <span className="home__row-main">
                    <span className="home__row-title">{lesson.title}</span>
                    <span className="home__row-notes">{lesson.exercise.notes.length} notes</span>
                  </span>
                  {fitResult == null ? (
                    <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                      Find your range first
                    </span>
                  ) : fitResult.ok ? (
                    <span className={`home__status home__status--${st.kind}`} data-testid={`status-${lesson.id}`}>
                      <span aria-hidden="true">{st.icon} </span>
                      {st.text}
                    </span>
                  ) : (
                    <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                      Doesn&apos;t fit: needs {fitResult.neededSemitones} semitones; your range is {fitResult.haveSemitones}
                    </span>
                  )}
                </>
              );
              return (
                <li key={lesson.id} className="home__mysongs-item">
                  <div className="home__mysongs-row">
                    {fitResult?.ok ? (
                      <Link className="home__row" data-testid={`lesson-${lesson.id}`} to={{ pathname: `/lesson/${lesson.id}`, search }}>
                        {body}
                      </Link>
                    ) : (
                      <div className="home__row home__row--disabled" data-testid={`lesson-${lesson.id}`} aria-disabled="true">
                        {body}
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn--danger home__delete"
                      onClick={() => setConfirmId(lesson.id)}
                      aria-label={`Delete ${lesson.title}`}
                      data-testid={`delete-${lesson.id}`}
                    >
                      Delete
                    </button>
                  </div>
                  {confirmId === lesson.id ? (
                    <div className="home__confirm" role="alertdialog" aria-label={`Delete ${lesson.title}?`} data-testid={`confirm-${lesson.id}`}>
                      <p>Delete “{lesson.title}” and its progress?</p>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => {
                          removeImportedLesson(lesson.id);
                          setConfirmId(null);
                        }}
                        data-testid={`confirm-delete-${lesson.id}`}
                      >
                        Delete
                      </button>{' '}
                      <button type="button" className="btn" onClick={() => setConfirmId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="home__link-row">
        <Link to={{ pathname: '/import', search }} className="nav-link" data-testid="import-midi-link">
          Import a MIDI file
        </Link>
      </p>
    </main>
  );
}
