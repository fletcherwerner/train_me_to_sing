import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BackLink } from '../components/BackLink';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import type { StoredData } from '../../storage/schema';
import { parseImport, saveExport, summarizeImport } from '../../storage/exportImport';
import { getFileStore } from '../../storage/fileStore';
import { useFileStatus } from '../../storage/fileSync';
import { midiToName } from '../../core/music/notes';
import { ProfilesSection } from '../components/ProfilesSection';
import './Home.css';

export function Settings() {
  const range = useAppStore((s) => s.range);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const importProgress = useAppStore((s) => s.importProgress);
  const latencyMs = useAppStore((s) => s.settings.latencyOffsetMs);
  const setLatencyOffset = useAppStore((s) => s.setLatencyOffset);
  const { search } = useLocation();
  const hasFile = getFileStore() !== null;
  const lastFileSaveAt = useFileStatus((s) => s.lastFileSaveAt);
  const fileSaveFailed = useFileStatus((s) => s.fileSaveFailed);
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

  const promptRef = useRef<HTMLDivElement>(null);
  const promptHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!pending) return;
    promptRef.current?.scrollIntoView?.({ block: 'center' });
    promptHeadingRef.current?.focus({ preventScroll: true });
  }, [pending]);

  const applyImport = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    importProgress(pending, mode);
    setPending(null);
    setImportDone(mode === 'merge' ? 'Merged. Your progress was combined.' : 'Replaced. Your progress was imported.');
  };

  return (
    <main className="dev-page">
      <header className="page-header">
        <BackLink />
        <h1>Settings</h1>
        <span />
      </header>

      <ProfilesSection />

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
        <Link to={{ pathname: '/range', search }} className="nav-link">
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
        <button type="button" className="btn" onClick={() => setLatencyOffset(Math.max(0, latencyMs - 10), false)}>
          −10
        </button>{' '}
        <button type="button" className="btn" onClick={() => setLatencyOffset(Math.min(500, latencyMs + 10), false)}>
          +10
        </button>{' '}
        <span>Range 0–500 ms</span>
      </p>
      <p>
        <Link to={{ pathname: '/settings/calibrate', search }} className="nav-link">
          Calibrate timing
        </Link>
      </p>

      <h2>Progress</h2>
      <p>
        <button className="btn btn--danger" onClick={() => setConfirming(true)}>
          Reset progress
        </button>
      </p>
      {done ? <p role="status">Progress cleared. Your range was kept.</p> : null}
      {confirming ? (
        <div role="alertdialog" aria-modal="true" aria-labelledby="reset-title" className="settings__dialog">
          <p id="reset-title">Clear all lesson progress and your practice history (days, time and focus areas)? Your range is kept. This cannot be undone.</p>
          <button
            className="btn btn--danger"
            onClick={() => {
              resetProgress();
              setConfirming(false);
              setDone(true);
            }}
          >
            Yes, clear progress
          </button>{' '}
          <button className="btn" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : null}

      <h2>Move progress between devices</h2>
      {hasFile ? (
        <>
          <p>Saved on this iPhone in Files › On My iPhone › Train Me To Sing › progress.json</p>
          <p data-testid="file-save-status" role="status">
            {fileSaveFailed
              ? "Couldn't save to the file. Your progress is still kept in the app."
              : lastFileSaveAt
                ? `Last saved: ${new Date(lastFileSaveAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'Not saved to the file yet in this session.'}
          </p>
          <p>Deleting the app deletes this folder. To keep a copy elsewhere, use Export or copy the file in Files.</p>
        </>
      ) : null}
      <p>
        <button type="button" className="btn" onClick={onExport} data-testid="export-button">
          Export progress
        </button>
      </p>
      {exportMsg ? <p role="status">{exportMsg}</p> : null}
      <p>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()} data-testid="import-button">
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
        <div
          ref={promptRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="import-heading"
          className="settings__dialog"
          data-testid="import-prompt"
        >
          <h3 id="import-heading" ref={promptHeadingRef} tabIndex={-1}>
            Import progress
          </h3>
          <p id="import-title" data-testid="import-summary">
            {summarizeImport(pending)}. Merge it with what you have, or replace everything on this device?
          </p>
          <div className="settings__dialog-actions">
            <button type="button" className="btn btn--primary" onClick={() => applyImport('merge')}>
              Merge
            </button>
            <button type="button" className="btn" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
          <div className="settings__dialog-danger">
            <p>Replace deletes the range and progress on this device. This cannot be undone.</p>
            <button type="button" className="btn btn--danger" onClick={() => applyImport('replace')}>
              Replace
            </button>
          </div>
        </div>
      ) : null}
      {importDone ? <p role="status">{importDone}</p> : null}
      <p>Your timing delay is never imported; it belongs to this device.</p>

      <h2>Check your microphone</h2>
      <p>
        <Link to={{ pathname: '/mic-check', search }} className="nav-link">
          Mic check
        </Link>{' '}
        shows whether we can hear you and which note you sang.{' '}
        <Link to={{ pathname: '/dev/tuner', search }} className="nav-link">
          Open the tuner
        </Link>{' '}
        for the exact pitch in cents.
      </p>
      {import.meta.env.DEV ? (
        <ul className="settings__dev-links" data-testid="dev-links">
          <li>
            <Link to={{ pathname: '/dev/piano', search }} className="nav-link">
              Piano keyboard
            </Link>
          </li>
          <li>
            <Link to={{ pathname: '/dev/exercise', search }} className="nav-link">
              Exercise playback
            </Link>
          </li>
          <li>
            <Link to={{ pathname: '/dev/attempt', search }} className="nav-link">
              Attempt scoring
            </Link>
          </li>
        </ul>
      ) : null}
    </main>
  );
}
