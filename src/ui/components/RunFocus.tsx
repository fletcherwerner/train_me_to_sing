import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLesson } from '../../content/registry';
import { runFocus } from '../../core/insights/runFocus';
import type { RunRecord } from '../../core/insights/types';
import { INSIGHT_OPTS } from '../insightOptions';
import './RunFocus.css';

/** "Focus next": one or two areas from a finished run, each with evidence, a tip and a suggested lesson. */
export function RunFocus({ run, links = true }: { run: RunRecord; links?: boolean }) {
  const { search } = useLocation();
  const items = useMemo(() => runFocus(run, INSIGHT_OPTS), [run]);
  return (
    <section className="run-focus" data-testid="run-focus" aria-label="Focus next">
      <h3 className="run-focus__title">Focus next</h3>
      <ul className="run-focus__list">
        {items.map((it) => {
          const lesson = it.lessonId ? getLesson(it.lessonId) : undefined;
          return (
            <li key={it.id} className="run-focus__item" data-testid={`run-focus-${it.id}`}>
              <strong>{it.name}:</strong> <span>{it.evidence}</span>
              {it.tip ? <span className="run-focus__tip"> {it.tip}</span> : null}
              {links && lesson && run.lessonId !== lesson.id ? (
                <>
                  {' '}
                  <Link className="run-focus__link" to={{ pathname: `/lesson/${lesson.id}`, search }}>
                    Practise: {lesson.title}
                  </Link>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
