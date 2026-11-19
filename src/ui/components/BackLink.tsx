import { Link, useLocation } from 'react-router-dom';

/** "‹ Lessons": the one way back to Home on every screen. Keeps the query string (?sim=...). */
export function BackLink() {
  const { search } = useLocation();
  return (
    <Link className="nav-link back-link" to={{ pathname: '/', search }} aria-label="Back to lessons">
      <span aria-hidden="true">‹ </span>Lessons
    </Link>
  );
}
