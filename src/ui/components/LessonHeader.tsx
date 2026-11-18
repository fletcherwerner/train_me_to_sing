import { Link, useLocation } from 'react-router-dom';

/** Home at the left, title centred, on one row. Home keeps the query string (?sim=...). */
export function LessonHeader({ title }: { title: string }) {
  const { search } = useLocation();
  return (
    <header className="page-header lesson-header">
      <Link className="nav-link" to={{ pathname: '/', search }}>
        Home
      </Link>
      <h1 className="lesson-title">{title}</h1>
      <span />
    </header>
  );
}
