import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { midiToName } from '../../core/music/notes';
import { fit } from '../../core/exercise/fit';
import { summariseTrack, toTemplate } from '../../core/exercise/fromMidi';
import { parseMidiFile, type ParsedMidiFile } from '../../content/midiFile';
import { makeImportedLesson } from '../../content/importedSource';
import { getAllLessons } from '../../content/registry';
import { createTonePlayer, type TonePlayer } from '../../audio/tonePlayer';
import { now, unlockAudio } from '../../audio/audioEngine';
import './Home.css';
import './ImportMidi.css';

const CHORD_WARNING_RATIO = 0.3;
const PREVIEW_BARS = 8;

let previewPlayer: TonePlayer | null = null;

function fileTitle(name: string): string {
  return name.replace(/\.(mid|midi)$/i, '').replace(/[_-]+/g, ' ').trim() || 'My song';
}

export function ImportMidi() {
  const range = useAppStore((s) => s.range);
  const addImportedLesson = useAppStore((s) => s.addImportedLesson);
  const { search } = useLocation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedMidiFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackIdx, setTrackIdx] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [tempo, setTempo] = useState(100);
  const [startBar, setStartBar] = useState('');
  const [endBar, setEndBar] = useState('');

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setError(null);
    setParsed(null);
    setTrackIdx(null);
    if (!file) return;
    try {
      const p = parseMidiFile(await file.arrayBuffer());
      if (p.tracks.length === 0) {
        setError('That file has no notes, so there is nothing to import.');
        return;
      }
      setParsed(p);
      setTitle(fileTitle(file.name));
      setTempo(Math.min(160, Math.max(40, p.tempoBpm)));
      setStartBar('');
      setEndBar('');
      if (p.tracks.length === 1) setTrackIdx(0);
    } catch {
      setError('That file is not a MIDI file I can read, so nothing was imported.');
    }
  };

  const summaries = useMemo(() => parsed?.tracks.map((t) => summariseTrack(t)) ?? [], [parsed]);

  const preview = async (idx: number) => {
    if (!parsed) return;
    await unlockAudio();
    previewPlayer ??= createTonePlayer();
    previewPlayer.stopAll();
    const maxBeat = PREVIEW_BARS * parsed.beatsPerBar;
    const beatSec = 60 / tempo;
    const t0 = now() + 0.1;
    for (const n of parsed.tracks[idx].notes) {
      if (n.startBeat >= maxBeat) continue;
      const dur = Math.min(n.durationBeats, maxBeat - n.startBeat) * beatSec;
      previewPlayer.playNote(n.midi, t0 + n.startBeat * beatSec, Math.max(0.05, dur));
    }
  };

  const bars = (s: string): number | undefined => {
    const n = Number(s);
    return s.trim() !== '' && Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
  };

  const built = useMemo(() => {
    if (!parsed || trackIdx === null) return null;
    const sb = bars(startBar);
    const eb = bars(endBar);
    try {
      const template = toTemplate(parsed.tracks[trackIdx], {
        id: 'draft',
        title: title.trim() || 'My song',
        tempoBpm: tempo,
        beatsPerBar: parsed.beatsPerBar,
        startBeat: sb !== undefined ? (sb - 1) * parsed.beatsPerBar : undefined,
        endBeat: eb !== undefined ? eb * parsed.beatsPerBar : undefined,
      });
      return { ok: true as const, template };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'Could not build a lesson.' };
    }
  }, [parsed, trackIdx, startBar, endBar, title, tempo]);

  if (!range) return null;

  const tempoValid = tempo >= 40 && tempo <= 160;

  let fitText = '';
  let span = 0;
  if (built?.ok) {
    const offs = built.template.notes.map((n) => n.offset);
    span = Math.max(...offs) - Math.min(...offs);
    const f = fit(built.template, range);
    fitText = f.ok ? 'Fits your range' : `Needs ${f.neededSemitones} semitones; your range is ${f.haveSemitones}`;
  }

  const add = () => {
    if (!built?.ok || !tempoValid) return;
    const order = getAllLessons().filter((l) => l.source === 'imported').length + 1;
    addImportedLesson(makeImportedLesson(built.template, title.trim() || 'My song', order));
    navigate({ pathname: '/', search });
  };

  return (
    <main className="dev-page import-midi">
      <p>
        <Link to={{ pathname: '/', search }} className="tap-link">
          ← Home
        </Link>
      </p>
      <h1>Import a MIDI file</h1>
      <p>Choose a .mid file, pick the track with the melody, and add it as a lesson.</p>
      <p>
        <button type="button" onClick={() => fileRef.current?.click()} data-testid="midi-button">
          Choose MIDI file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          hidden
          data-testid="midi-file"
          onChange={onPickFile}
        />
      </p>
      {error ? (
        <p className="tuner-error" role="alert" data-testid="midi-error">
          {error}
        </p>
      ) : null}

      {parsed ? (
        <>
          <h2>Tracks</h2>
          <ul className="home__list" data-testid="track-list">
            {parsed.tracks.map((t, i) => {
              const s = summaries[i];
              const chords = s.overlapRatio > CHORD_WARNING_RATIO;
              return (
                <li key={i} className={`import-midi__track${trackIdx === i ? ' import-midi__track--selected' : ''}`} data-testid={`track-${i}`}>
                  <span className="home__row-main">
                    <span className="home__row-title">{t.name}</span>
                    <span className="home__row-notes">
                      {s.noteCount} notes · {midiToName(s.lowMidi)}–{midiToName(s.highMidi)}
                    </span>
                    {chords ? (
                      <span className="import-midi__warn" data-testid={`track-${i}-chords`}>
                        ⚠ Looks like chords, not a melody
                      </span>
                    ) : null}
                  </span>
                  <span className="import-midi__actions">
                    <button type="button" onClick={() => void preview(i)} data-testid={`preview-${i}`}>
                      Preview
                    </button>{' '}
                    <button
                      type="button"
                      aria-pressed={trackIdx === i}
                      onClick={() => setTrackIdx(i)}
                      data-testid={`select-${i}`}
                    >
                      {trackIdx === i ? 'Selected' : 'Use this track'}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>

          {trackIdx !== null ? (
            <section className="import-midi__options">
              <h2>Options</h2>
              <p>
                <label>
                  Title{' '}
                  <input
                    type="text"
                    className="import-midi__title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="import-title"
                  />
                </label>
              </p>
              <p>
                <label>
                  Tempo (40–160 bpm){' '}
                  <input
                    type="number"
                    min={40}
                    max={160}
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    data-testid="import-tempo"
                  />
                </label>
              </p>
              {!tempoValid ? (
                <p className="tuner-error" role="alert">
                  Tempo must be between 40 and 160.
                </p>
              ) : null}
              <p>
                <label>
                  First bar (optional){' '}
                  <input type="number" min={1} value={startBar} onChange={(e) => setStartBar(e.target.value)} data-testid="import-start-bar" />
                </label>{' '}
                <label>
                  Last bar (optional){' '}
                  <input type="number" min={1} value={endBar} onChange={(e) => setEndBar(e.target.value)} data-testid="import-end-bar" />
                </label>
              </p>

              <h2>Summary</h2>
              {built?.ok ? (
                <>
                  <p data-testid="import-summary">
                    {built.template.notes.length} notes, span {span} semitones.
                  </p>
                  <p data-testid="import-fit">{fitText}</p>
                  <p>
                    <button type="button" onClick={add} disabled={!tempoValid} data-testid="add-lesson">
                      Add lesson
                    </button>
                  </p>
                </>
              ) : (
                <p className="tuner-error" role="alert" data-testid="import-build-error">
                  {built?.message}
                </p>
              )}
            </section>
          ) : (
            <p>Choose a track to continue.</p>
          )}
        </>
      ) : null}
    </main>
  );
}
