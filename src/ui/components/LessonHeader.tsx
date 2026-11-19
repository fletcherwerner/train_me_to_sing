import { BackLink } from './BackLink';

/** "‹ Lessons" at the left, title centred, on one row. The link keeps the query string (?sim=...). */
export function LessonHeader({ title }: { title: string }) {
  return (
    <header className="page-header lesson-header">
      <BackLink />
      <h1 className="lesson-title">{title}</h1>
      <span />
    </header>
  );
}
