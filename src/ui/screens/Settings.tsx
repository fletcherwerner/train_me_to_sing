import { useRef, useState, type ChangeEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import type { StoredData } from '../../storage/schema';
import { parseImport, saveExport, summarizeImport } from '../../storage/exportImport';
import { midiToName } from '../../core/music/notes';
import './Home.css';

export function Settings() {
  const range = useAppStore((s) => s.range);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const importProgress = useAppStore((s) => s.importProgress);
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const setLatencyOffset = useAppStore((s) => s.setLatencyOffset);
  const { search } = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState<string | null>(null);
  const [pending, setPending] = useState<StoredData | null>(null);

  const onExport = async () => {
    const s = useAppStore.getState();
    const result = await saveExport({
      version: s.version,
      range: s.range,
      settings: s.settings,
      progress: s.progress,
      importedLessons: s.importedLessons,
    });
    setExportMsg(
      result === 'shared' ? 'Export shared.' : result === 'downloaded' ? 'Export downloaded.' : 'Export cancelled.',
    );
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setImportError(null);
    setImportDone(null);
    setPending(null);
    if (!file) return;
    const result = parseImport(await file.text());
    if (result.ok) setPending(result.data);
    else setImportError(result.error);
  };

  const applyImport = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    importProgress(pending, mode);
    setPending(null);
    setImportDone(mode === 'merge' ? 'Merged. Your progress was combined.' : 'Replaced. Your progress was imported.');
  };

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

      <h2>Timing delay</h2>
      <p>
        <label>
          Delay: <output data-testid="latency-value">{latencyMs} ms</output>
          <br />
          <input
            className="latency-slider"
            type="range"
            min={0}
            max={500}
            step={10}
            value={latencyMs}
            onChange={(e) => setLatencyOffset(Number(e.target.value), false)}
            aria-label="Latency offset in milliseconds"
            data-testid="latency-slider"
          />
        </label>
      </p>
      <p>
        <button type="button" onClick={() => setLatencyOffset(Math.max(0, latencyMs - 10), false)}>
          −10
        </button>{' '}
        <button type="button" onClick={() => setLatencyOffset(Math.min(500, latencyMs + 10), false)}>
          +10
        </button>{' '}
        <span>Range 0–500 ms</span>
      </p>
      <p>
        <Link to={{ pathname: '/settings/calibrate', search }} className="tap-link">
          Calibrate timing
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

      <h2>Move progress between devices</h2>
      <p>
        <button type="button" onClick={onExport} data-testid="export-button">
          Export progress
        </button>
      </p>
      {exportMsg ? <p role="status">{exportMsg}</p> : null}
      <p>
        <button type="button" onClick={() => fileRef.current?.click()} data-testid="import-button">
          Import progress
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="import-file"
          onChange={onPickFile}
        />
      </p>
      {importError ? (
        <p className="tuner-error" role="alert" data-testid="import-error">
          {importError}
        </p>
      ) : null}
      {pending ? (
        <div role="alertdialog" aria-modal="true" aria-labelledby="import-title" className="settings__dialog">
          <p id="import-title" data-testid="import-summary">
            {summarizeImport(pending)}. Replace everything on this device, or merge it with what you have?
          </p>
          <button type="button" onClick={() => applyImport('replace')}>
            Replace
          </button>{' '}
          <button type="button" onClick={() => applyImport('merge')}>
            Merge
          </button>{' '}
          <button type="button" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      ) : null}
      {importDone ? <p role="status">{importDone}</p> : null}
      <p>Your timing delay is never imported; it belongs to this device.</p>

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
