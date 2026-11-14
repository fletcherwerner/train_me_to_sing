import { useEffect, useRef, useState } from 'react';
import { unlockAudio, now } from '../../../audio/audioEngine';
import { createTonePlayer, type TonePlayer } from '../../../audio/tonePlayer';
import { PianoKeyboard } from '../../components/PianoKeyboard';

export function PianoDev() {
  const [started, setStarted] = useState(false);
  const [low, setLow] = useState(48);
  const [high, setHigh] = useState(72);
  const [target, setTarget] = useState<number | null>(null);
  const player = useRef<TonePlayer | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = async () => {
    await unlockAudio();
    player.current ??= createTonePlayer();
    setStarted(true);
  };

  const press = (midi: number) => {
    setTarget(midi);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTarget(null), 500);
    if (player.current) player.current.playNote(midi, now(), 0.5);
  };

  return (
    <main className="dev-page">
      <h1>Piano</h1>
      <p>
        <button onClick={start} disabled={started}>
          {started ? 'Started' : 'Start'}
        </button>
      </p>
      <PianoKeyboard lowMidi={low} highMidi={high} targetMidi={target} onKeyPress={press} />
      <p>
        <label>
          Low MIDI{' '}
          <input type="number" value={low} onChange={(e) => setLow(Number(e.target.value))} />
        </label>{' '}
        <label>
          High MIDI{' '}
          <input type="number" value={high} onChange={(e) => setHigh(Number(e.target.value))} />
        </label>
      </p>
    </main>
  );
}
