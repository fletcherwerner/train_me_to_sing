import { Link } from 'react-router-dom';

export function Home() {
  return (
    <main className="dev-page">
      <h1>Train Me To Sing</h1>
      <p>Placeholder home. Dev pages:</p>
      <ul>
        <li>
          <Link to="/dev/piano">Piano keyboard</Link>
        </li>
      </ul>
    </main>
  );
}
