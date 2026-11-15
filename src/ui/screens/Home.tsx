import { Link } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { midiToName } from '../../core/music/notes';

export function Home() {
  const range = useAppStore((s) => s.range);

  return (
    <main className="dev-page">
      <h1>Train Me To Sing</h1>
      {range != null ? (
        <div>
          <p>
            Your range: <strong>{midiToName(range.lowMidi)} – {midiToName(range.highMidi)}</strong>
            {' '}({range.highMidi - range.lowMidi} semitones)
          </p>
          <p>
            <Link to="/range">Redo range test</Link>
          </p>
        </div>
      ) : (
        <p>
          No range set. <Link to="/range">Set your range</Link>.
        </p>
      )}
      <p>Dev pages:</p>
      <ul>
        <li>
          <Link to="/dev/piano">Piano keyboard</Link>
        </li>
        <li>
          <Link to="/dev/tuner">Tuner (pitch detection)</Link>
        </li>
      </ul>
    </main>
  );
}
