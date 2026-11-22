import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

/** "‹ Lessons" at the left, title centred, on one row. The link keeps the query string (?sim=...). */
export function LessonHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="page-header lesson-header">
      <BackLink />
      {right ? (
        <div className="lesson-titleblock">
          <h1 className="lesson-title">{title}</h1>
          {right}
        </div>
      ) : (
        <h1 className="lesson-title">{title}</h1>
      )}
      <span />
    </header>
  );
}
