import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ensureAudioRunning } from '../../../audio/audioEngine';
import { isMicMissing, MIC_MISSING_MSG, SOUND_PAUSED_MSG } from '../../audioMessages';
import { createPitchSource } from '../../../audio/pitch';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { CentsMeter } from '../../components/CentsMeter';
import { centsBetween, midiToName, midiToFreq } from '../../../core/music/notes';
import type { PitchFrame } from '../../../audio/pitch/PitchSource';

export function TunerDev() {
  const { search } = useLocation();
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<PitchFrame | null>(null);
  const latestRef = useRef<PitchFrame | null>(null);
  const sourceRef = useRef<ReturnType<typeof createPitchSource> | null>(null);

  useEffect(() => {
    const src = createPitchSource();
    sourceRef.current = src;
    const unsub = src.subscribe((f) => {
      latestRef.current = f;
      // Throttle state updates to ~30fps
      setDisplay((prev) => {
        if (prev == null || f.tSec - prev.tSec >= 1 / 30) return f;
        return prev;
      });
    });
    return () => {
      unsub();
      src.stop();
    };
  }, []);

  const start = async () => {
    setError(null);
    try {
      if (!(await ensureAudioRunning())) {
        setError(SOUND_PAUSED_MSG);
        return;
      }
      await sourceRef.current?.start();
      setStarted(true);
    } catch (err) {
      if (isMicMissing(err)) {
        setError(MIC_MISSING_MSG);
      } else if (err instanceof Error && err.message === 'mic-denied') {
        setError('Microphone access denied. Please allow microphone access in your browser settings and reload.');
      } else {
        setError('Failed to start microphone. Please check your settings and try again.');
      }
    }
  };

  const stop = () => {
    sourceRef.current?.stop();
    setStarted(false);
    setError(null);
    setDisplay(null);
    latestRef.current = null;
  };

  const latest = latestRef.current;
  const frame = display ?? latest;

  // Nearest key (rounded integer MIDI)
  const nearestKey = frame?.midi == null ? null : Math.round(frame.midi);

  // Cents from nearest key
  const cents =
    frame?.midi == null ? null : centsBetween(frame.midi, nearestKey ?? 0);

  // Raw frequency in Hz
  const freq =
    frame?.midi == null ? null : midiToFreq(frame.midi);

  return (
    <main className="dev-page">
      <p>
        <Link className="nav-link" to={{ pathname: '/', search }}>
          Home
        </Link>
      </p>
      <h1>Tuner</h1>
      <p>
        {!started ? (
          <button className="btn btn--primary" onClick={start}>
            Start
          </button>
        ) : (
          <button className="btn btn--primary" onClick={stop}>
            Stop
          </button>
        )}
      </p>
      {error ? (
        <p className="tuner-error">{error}</p>
      ) : frame?.midi == null && started ? (
        <p className="tuner-silence">No pitch detected. Sing or hum into the microphone.</p>
      ) : null}
      <PianoKeyboard
        lowMidi={36}
        highMidi={84}
        sungMidi={frame?.midi}
      />
      {frame?.midi != null && nearestKey != null && (
        <div className="tuner-readout">
          <div className="tuner-note">{midiToName(nearestKey)}</div>
          <div className="tuner-freq">{freq != null ? freq.toFixed(2) : ''} Hz</div>
          <CentsMeter cents={cents} toleranceCents={50} />
          <div className="tuner-debug">
            clarity: {frame.clarity.toFixed(2)} rms: {frame.rms.toFixed(2)}
          </div>
        </div>
      )}
    </main>
  );
}
