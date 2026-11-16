import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { midiToName } from '../../core/music/notes';
import { getAllLessons } from '../../content/registry';
import { fit } from '../../core/exercise/fit';
import type { Lesson } from '../../content/types';
import { useProfileStatus } from '../../storage/profiles';
import './Home.css';

const STAGE_NAMES: Record<number, string> = {
  1: 'Stage 1 — Note matching',
  2: 'Stage 2 — Scales',
  3: 'Stage 3 — Songs',
};

const STRICTER_NOTE: Record<number, string> = {
  2: 'Stricter than Stage 1: tighter pitch, longer holds and tighter timing.',
};

export function Home() {
  const range = useAppStore((s) => s.range);
  const progress = useAppStore((s) => s.progress);
  const removeImportedLesson = useAppStore((s) => s.removeImportedLesson);
  const importedRaw = useAppStore((s) => s.importedLessons);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  void importedRaw; // subscribe so the list refreshes when songs are added or removed
  const profileName = useProfileStatus((s) => s.activeName);
  const { search } = useLocation();
  if (!range) return null;

  const all = getAllLessons().map((lesson) => ({ lesson, fitResult: fit(lesson.exercise, range) }));
  const lessons = all.filter((l) => l.lesson.source !== 'imported');
  const mySongs = all.filter((l) => l.lesson.source === 'imported');
  const next = lessons.find((l) => l.fitResult.ok && !progress[l.lesson.id]?.passed);
  const stages = [...new Set(lessons.map((l) => l.lesson.stage))];

  const status = (lesson: Lesson) => {
    const p = progress[lesson.id];
    if (!p || p.attempts === 0) return { kind: 'new', text: 'Not started', icon: '○' };
    const pct = `${Math.round(p.bestScore * 100)}%`;
    return p.passed
      ? { kind: 'passed', text: `Passed · ${pct}`, icon: '✓' }
      : { kind: 'attempted', text: `Best ${pct}`, icon: '◐' };
  };

  return (
    <main className="dev-page home">
      <header className="home__header">
        <div>
          <h1>Train Me To Sing</h1>
          {profileName ? (
            <p>
              <Link to={{ pathname: '/settings', search }} className="home__profile" data-testid="home-profile">
                Profile: <strong>{profileName}</strong>
              </Link>
            </p>
          ) : null}
          <p data-testid="home-range">
            Your range: <strong>{midiToName(range.lowMidi)} – {midiToName(range.highMidi)}</strong>
          </p>
        </div>
        <Link to={{ pathname: '/settings', search }} className="tap-link home__settings" aria-label="Settings">
          <span aria-hidden="true">⚙</span> Settings
        </Link>
      </header>

      {next ? (
        <section className="home__continue" data-testid="continue-card">
          <h2>Continue</h2>
          <p>
            <strong>{next.lesson.title}</strong>
          </p>
          <p>{next.lesson.goal}</p>
          <Link to={{ pathname: `/lesson/${next.lesson.id}`, search }} className="home__continue-link">
            Start lesson
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
            </p>
            {STRICTER_NOTE[stage] ? (
              <p className="home__count" data-testid={`stage-${stage}-note`}>
                {STRICTER_NOTE[stage]}{' '}
                <Link to={{ pathname: '/settings/calibrate', search }}>Calibrate timing</Link> first.
              </p>
            ) : null}
            <ul className="home__list">
              {inStage.map(({ lesson, fitResult }) => {
                const noteCount = lesson.exercise.notes.length;
                const st = status(lesson);
                const body = (
                  <>
                    <span className="home__row-main">
                      <span className="home__row-title">{lesson.title}</span>
                      <span className="home__row-notes">{noteCount} notes</span>
                    </span>
                    {fitResult.ok ? (
                      <span className={`home__status home__status--${st.kind}`} data-testid={`status-${lesson.id}`}>
                        <span aria-hidden="true">{st.icon} </span>
                        {st.text}
                      </span>
                    ) : (
                      <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                        Needs {fitResult.neededSemitones} semitones; your range is {fitResult.haveSemitones}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={lesson.id}>
                    {fitResult.ok ? (
                      <Link
                        className="home__row"
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
                  {fitResult.ok ? (
                    <span className={`home__status home__status--${st.kind}`} data-testid={`status-${lesson.id}`}>
                      <span aria-hidden="true">{st.icon} </span>
                      {st.text}
                    </span>
                  ) : (
                    <span className="home__status home__status--locked" data-testid={`status-${lesson.id}`}>
                      Needs {fitResult.neededSemitones} semitones; your range is {fitResult.haveSemitones}
                    </span>
                  )}
                </>
              );
              return (
                <li key={lesson.id} className="home__mysongs-item">
                  <div className="home__mysongs-row">
                    {fitResult.ok ? (
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
                        onClick={() => {
                          removeImportedLesson(lesson.id);
                          setConfirmId(null);
                        }}
                        data-testid={`confirm-delete-${lesson.id}`}
                      >
                        Delete
                      </button>{' '}
                      <button type="button" onClick={() => setConfirmId(null)}>
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
        <Link to={{ pathname: '/import', search }} className="tap-link" data-testid="import-midi-link">
          Import a MIDI file
        </Link>
      </p>
    </main>
  );
}
