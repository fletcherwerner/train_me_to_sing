import { Link } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../../storage/store';
import { unlockAudio } from '../../../audio/audioEngine';
import { playExercise, type PlaybackHandle } from '../../../audio/exercisePlayer';
import { displayRange, fit } from '../../../core/exercise/fit';
import { parseNotation } from '../../../core/exercise/notation';
import type { ExerciseTemplate } from '../../../core/exercise/types';
import { midiToName } from '../../../core/music/notes';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { SequenceStrip } from '../../components/SequenceStrip';
import { BeatIndicator } from '../../components/BeatIndicator';
import { usePlaybackPosition } from '../../hooks/usePlaybackPosition';

const HOT_CROSS_LYRICS = (
  'Hot cross buns hot cross buns one a pen ny two a pen ny hot cross buns'
).split(' ');

const DEV_TEMPLATES: ExerciseTemplate[] = [
  {
    id: 'dev-three',
    title: 'Three notes (0 2 4)',
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: parseNotation('0 2 4'),
  },
  {
    id: 'dev-scale',
    title: 'Scale up and down',
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: parseNotation('0 2 4 5 7 5 4 2 0:2'),
  },
  {
    id: 's3-01',
    title: 'Hot Cross Buns',
    tempoBpm: 72,
    beatsPerBar: 4,
    notes: parseNotation(
      '4 2 0:2 4 2 0:2 0:.5 0:.5 0:.5 0:.5 2:.5 2:.5 2:.5 2:.5 4 2 0:2',
      HOT_CROSS_LYRICS,
    ),
  },
];

export function ExerciseDev() {
  const range = useAppStore((s) => s.range);
  const [templateId, setTemplateId] = useState(DEV_TEMPLATES[0].id);
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);
  const handleRef = useRef<PlaybackHandle | null>(null);

  const template = DEV_TEMPLATES.find((t) => t.id === templateId) ?? DEV_TEMPLATES[0];
  const fitted = useMemo(() => (range ? fit(template, range) : null), [template, range]);
  const exercise = fitted && fitted.ok ? fitted.exercise : null;
  const pos = usePlaybackPosition(handle, exercise);

  if (!range) {
    return (
      <main className="dev-page">
        <p>
          <Link className="dev-home" to="/">
            Home
          </Link>
        </p>
        <h1>Exercise playback</h1>
        <p>
          No range set. <Link to="/range">Set your range</Link> first.
        </p>
      </main>
    );
  }

  const play = async () => {
    if (!exercise) return;
    await unlockAudio();
    handleRef.current?.stop();
    const h = playExercise(exercise, { playMelody: true, metronome: true, playStartNote: false });
    handleRef.current = h;
    setHandle(h);
  };
  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    setHandle(null);
  };
  const change = (id: string) => {
    stop();
    setTemplateId(id);
  };

  const playing = pos.phase !== 'done';
  const current = exercise && pos.currentNoteIndex !== null ? exercise.notes[pos.currentNoteIndex] : null;
  const lowest = exercise ? Math.min(...exercise.notes.map((n) => n.midi)) : 0;
  const highest = exercise ? Math.max(...exercise.notes.map((n) => n.midi)) : 0;
  const disp = displayRange(range);

  return (
    <main className="dev-page">
      <p>
        <Link className="dev-home" to="/">
          Home
        </Link>
      </p>
      <h1>Exercise playback</h1>
      <p>
        <label>
          Exercise{' '}
          <select value={templateId} onChange={(e) => change(e.target.value)}>
            {DEV_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.tempoBpm} bpm)
              </option>
            ))}
          </select>
        </label>
      </p>
      {fitted && fitted.ok && exercise ? (
        <p data-testid="fit-info">
          Fits your range ({midiToName(range.lowMidi)}–{midiToName(range.highMidi)}). Tonic{' '}
          <strong>{midiToName(exercise.tonicMidi)}</strong>, lowest note{' '}
          <strong>{midiToName(lowest)}</strong>, highest note <strong>{midiToName(highest)}</strong>.
        </p>
      ) : fitted && !fitted.ok ? (
        <p data-testid="fit-info">
          Needs {fitted.neededSemitones} semitones; your range is {fitted.haveSemitones}.
        </p>
      ) : null}
      <PianoKeyboard
        lowMidi={disp.lowMidi}
        highMidi={disp.highMidi}
        targetMidi={current ? current.midi : null}
        rangeMarkers={{ lowMidi: range.lowMidi, highMidi: range.highMidi }}
      />
      {exercise ? (
        <>
          <SequenceStrip notes={exercise.notes} currentIndex={pos.currentNoteIndex} />
          <BeatIndicator
            beatsPerBar={exercise.beatsPerBar}
            beatInBar={pos.beatInBar}
            countInRemaining={pos.countInRemaining}
          />
        </>
      ) : null}
      <p>
        <button onClick={play} disabled={!exercise || playing}>
          Play
        </button>{' '}
        <button onClick={play} disabled={!exercise}>
          Repeat
        </button>{' '}
        <button onClick={stop} disabled={!playing}>
          Stop
        </button>
      </p>
    </main>
  );
}
