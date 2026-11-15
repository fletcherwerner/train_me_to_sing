import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { midiToName } from '../../core/music/notes';
import './Home.css';

export function Settings() {
  const range = useAppStore((s) => s.range);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const { search } = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <main className="dev-page">
      <p>
        <Link to={{ pathname: '/', search }} className="tap-link">
          Home
        </Link>
      </p>
      <h1>Settings</h1>

      <h2>Your range</h2>
      {range ? (
        <p data-testid="settings-range">
          <strong>
            {midiToName(range.lowMidi)} – {midiToName(range.highMidi)}
          </strong>{' '}
          ({range.highMidi - range.lowMidi} semitones)
        </p>
      ) : (
        <p>No range set yet.</p>
      )}
      <p>
        <Link to={{ pathname: '/range', search }} className="tap-link">
          Redo range test
        </Link>
      </p>

      <h2>Progress</h2>
      <p>
        <button onClick={() => setConfirming(true)}>Reset progress</button>
      </p>
      {done ? <p role="status">Progress cleared. Your range was kept.</p> : null}
      {confirming ? (
        <div role="alertdialog" aria-modal="true" aria-labelledby="reset-title" className="settings__dialog">
          <p id="reset-title">Clear all lesson progress? Your range is kept. This cannot be undone.</p>
          <button
            onClick={() => {
              resetProgress();
              setConfirming(false);
              setDone(true);
            }}
          >
            Yes, clear progress
          </button>{' '}
          <button onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      ) : null}

      <h2>Developer pages</h2>
      <ul>
        <li>
          <Link to="/dev/tuner">Tuner (pitch detection)</Link>
        </li>
        <li>
          <Link to="/dev/piano">Piano keyboard</Link>
        </li>
        <li>
          <Link to="/dev/exercise">Exercise playback</Link>
        </li>
        <li>
          <Link to="/dev/attempt">Attempt scoring</Link>
        </li>
      </ul>
    </main>
  );
}
