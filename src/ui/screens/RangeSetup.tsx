import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { unlockAudio, now } from '../../audio/audioEngine';
import { createTonePlayer, type TonePlayer } from '../../audio/tonePlayer';
import { createPitchSource, acceptRangeLow } from '../../audio/pitch';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { midiToName } from '../../core/music/notes';
import type { PitchFrame } from '../../audio/pitch/PitchSource';
import { findHeldNote } from '../../core/exercise/rangeAnalysis';
import { useAppStore } from '../../storage/store';
import './RangeSetup.css';

type Step = 'intro' | 'low-find' | 'low-record' | 'low-result' | 'high-find' | 'high-record' | 'high-result' | 'confirm';

export function RangeSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<PitchFrame | null>(null);
  const latestRef = useRef<PitchFrame | null>(null);
  const sourceRef = useRef<ReturnType<typeof createPitchSource> | null>(null);
  const playerRef = useRef<TonePlayer | null>(null);
  const framesRef = useRef<PitchFrame[]>([]);

  // Range results
  const [lowNote, setLowNote] = useState<number | null>(null);
  const [highNote, setHighNote] = useState<number | null>(null);

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null); // 3, 2, 1, or null (recording)
  const [recordProgress, setRecordProgress] = useState(0); // 0..1

  // Nudged range for confirm screen
  const [nudgedLow, setNudgedLow] = useState(0);
  const [nudgedHigh, setNudgedHigh] = useState(0);

  const setRange = useAppStore((s) => s.setRange);

  // Start audio and pitch source
  const startAudio = useCallback(async () => {
    try {
      await unlockAudio();
      const src = createPitchSource();
      sourceRef.current = src;
      const unsub = src.subscribe((f) => {
        latestRef.current = f;
        setDisplay(f);
      });
      await src.start();
      return unsub;
    } catch (err) {
      if (err instanceof Error && err.message === 'mic-denied') {
        setError('Microphone access denied. Please allow microphone access in your browser settings and reload.');
      } else {
        setError('Failed to start microphone. Please check your settings and try again.');
      }
      throw err;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      playerRef.current?.stopAll();
    };
  }, []);

  // Play a note back using the tone player
  const playNote = useCallback((midi: number) => {
    if (!playerRef.current) {
      playerRef.current = createTonePlayer();
    }
    playerRef.current.playNote(midi, now(), 0.5);
  }, []);

  const processRecording = useCallback((pick: 'lowest' | 'highest') => {
    const frames = framesRef.current;
    const result = findHeldNote(frames, pick);

    if (pick === 'lowest') {
      if (result.ok) {
        setLowNote(result.midi);
        setStep('low-result');
      } else {
        setError(result.reason === 'no-voice'
          ? "We couldn't hear a steady note — try again, a little louder."
          : "The note wavered too much — try holding it steadier.");
        setStep('low-find');
      }
    } else {
      if (result.ok) {
        setHighNote(result.midi);
        setStep('high-result');
      } else {
        setError(result.reason === 'no-voice'
          ? "We couldn't hear a steady note — try again, a little louder."
          : "The note wavered too much — try holding it steadier.");
        setStep('high-find');
      }
    }
  }, []);

  // Start the recording window with countdown
  const startRecording = useCallback((pick: 'lowest' | 'highest') => {
    framesRef.current = [];
    setCountdown(3);
    setRecordProgress(0);

    // Subscribe to pitch source and collect frames during recording window
    const unsub = sourceRef.current?.subscribe((f) => {
      framesRef.current.push(f);
    });

    // Countdown: 3 seconds total (1s each for 3, 2, 1)
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        // Play a click sound
        if (!playerRef.current) {
          playerRef.current = createTonePlayer();
        }
        playerRef.current.playNote(69, now(), 0.05); // A4 click
      } else {
        clearInterval(countdownInterval);
        unsub?.();
        setCountdown(null);
        // Start recording window: 3 seconds
        const startTime = now();
        const recordInterval = setInterval(() => {
          const elapsed = now() - startTime;
          if (elapsed >= 3) {
            clearInterval(recordInterval);
            setRecordProgress(1);
            // Process frames
            processRecording(pick);
          } else {
            setRecordProgress(elapsed / 3);
          }
        }, 50);
      }
    }, 1000);
  }, [processRecording]);

  // Handle "Use this" for lowest note
  const handleUseLow = useCallback(() => {
    acceptRangeLow();
    setStep('high-find');
  }, []);

  // Handle "Try again" for lowest note
  const handleRetryLow = useCallback(() => {
    setError(null);
    setStep('low-find');
  }, []);

  // Handle "Try again" for highest note
  const handleRetryHigh = useCallback(() => {
    setError(null);
    setStep('high-find');
  }, []);

  // Handle "Continue" from high-result → confirm (initialize nudged values)
  const handleContinue = useCallback(() => {
    setNudgedLow(lowNote ?? 45);
    setNudgedHigh(highNote ?? 64);
    setStep('confirm');
  }, [lowNote, highNote]);

  // Handle nudge on confirm screen
  const handleNudgeLow = useCallback((delta: number) => {
    setNudgedLow((prev) => Math.min(prev + delta, nudgedHigh - 5));
  }, [nudgedHigh]);

  const handleNudgeHigh = useCallback((delta: number) => {
    setNudgedHigh((prev) => Math.max(prev - delta, nudgedLow + 5));
  }, [nudgedLow]);

  // Handle save
  const handleSave = useCallback(() => {
    const range = {
      lowMidi: nudgedLow,
      highMidi: nudgedHigh,
      assessedAt: new Date().toISOString(),
    };
    setRange(range);
    navigate('/');
  }, [nudgedLow, nudgedHigh, setRange, navigate]);

  // Handle "Redo" from confirm
  const handleRedo = useCallback(() => {
    setLowNote(null);
    setHighNote(null);
    setStep('low-find');
  }, []);

  // Derived: keyboard range for display
  const kbLow = Math.min(nudgedLow || 0, nudgedHigh || 0) - 12;
  const kbHigh = Math.max(nudgedLow || 0, nudgedHigh || 0) + 12;

  // Render
  const sungMidi = display?.midi ?? null;

  if (error && (step === 'low-find' || step === 'high-find')) {
    // Show error with retry
    return (
      <main className="range-setup">
        <h1>Vocal Range Assessment</h1>
        <p className="range-error">{error}</p>
        <button onClick={() => { setError(null); }}>
          Try again
        </button>
        <p className="range-back">
          <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
            Cancel
          </button>
        </p>
      </main>
    );
  }

  switch (step) {
    case 'intro':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p>
            Put on your headphones. We need to find your lowest and highest comfortable notes.
          </p>
          <button onClick={async () => {
            await startAudio();
            setStep('low-find');
          }}>
            Start
          </button>
        </main>
      );

    case 'low-find':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-prompt">Sing your lowest comfortable note and hold it.</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            sungMidi={sungMidi}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
          />
          <div className="range-note-name">
            {sungMidi != null ? midiToName(Math.round(sungMidi)) : ''}
          </div>
          <div className="range-buttons">
            <button onClick={() => {
              setStep('low-record');
              startRecording('lowest');
            }}>
              Record
            </button>
          </div>
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'low-record':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-prompt">Sing your lowest comfortable note and hold it.</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            sungMidi={sungMidi}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
          />
          <div className="range-note-name">
            {sungMidi != null ? midiToName(Math.round(sungMidi)) : ''}
          </div>
          {countdown != null ? (
            <div className="range-countdown">
              <span className="range-countdown-number">{countdown}</span>
            </div>
          ) : recordProgress < 1 ? (
            <div className="range-recording">
              <span>Recording… hold the note</span>
              <div className="range-progress-bar">
                <div
                  className="range-progress-fill"
                  style={{ width: `${recordProgress * 100}%` }}
                />
              </div>
            </div>
          ) : null}
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'low-result':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-result-label">Lowest note: {lowNote != null ? midiToName(lowNote) : '?'}</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            targetMidi={lowNote}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
            onKeyPress={playNote}
          />
          <div className="range-buttons">
            <button onClick={handleUseLow}>Use this</button>
            <button onClick={handleRetryLow}>Try again</button>
          </div>
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'high-find':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-prompt">Now sing your highest comfortable note and hold it.</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            sungMidi={sungMidi}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
          />
          <div className="range-note-name">
            {sungMidi != null ? midiToName(Math.round(sungMidi)) : ''}
          </div>
          <div className="range-buttons">
            <button onClick={() => {
              setStep('high-record');
              startRecording('highest');
            }}>
              Record
            </button>
          </div>
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'high-record':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-prompt">Now sing your highest comfortable note and hold it.</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            sungMidi={sungMidi}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
          />
          <div className="range-note-name">
            {sungMidi != null ? midiToName(Math.round(sungMidi)) : ''}
          </div>
          {countdown != null ? (
            <div className="range-countdown">
              <span className="range-countdown-number">{countdown}</span>
            </div>
          ) : recordProgress < 1 ? (
            <div className="range-recording">
              <span>Recording… hold the note</span>
              <div className="range-progress-bar">
                <div
                  className="range-progress-fill"
                  style={{ width: `${recordProgress * 100}%` }}
                />
              </div>
            </div>
          ) : null}
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'high-result':
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-result-label">Highest note: {highNote != null ? midiToName(highNote) : '?'}</p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            targetMidi={highNote}
            rangeMarkers={{ lowMidi: kbLow, highMidi: kbHigh }}
            onKeyPress={playNote}
          />
          <div className="range-buttons">
            <button onClick={handleContinue}>Continue</button>
            <button onClick={handleRetryHigh}>Try again</button>
          </div>
          <p className="range-back">
            <button onClick={() => { sourceRef.current?.stop(); navigate('/'); }}>
              Cancel
            </button>
          </p>
        </main>
      );

    case 'confirm': {
      const span = nudgedHigh - nudgedLow;
      const tooSmall = span < 7;
      return (
        <main className="range-setup">
          <h1>Vocal Range Assessment</h1>
          <p className="range-range-display">
            Your range: {midiToName(nudgedLow)} – {midiToName(nudgedHigh)} ({span} semitones)
          </p>
          <PianoKeyboard
            lowMidi={kbLow}
            highMidi={kbHigh}
            targetMidi={null}
            rangeMarkers={{ lowMidi: nudgedLow, highMidi: nudgedHigh }}
            onKeyPress={playNote}
          />
          <div className="range-nudge">
            <span>Low:</span>
            <button onClick={() => handleNudgeLow(-1)} aria-label="Lower low note">−</button>
            <span>{midiToName(nudgedLow)}</span>
            <button onClick={() => handleNudgeLow(1)} aria-label="Raise low note">+</button>
          </div>
          <div className="range-nudge">
            <span>High:</span>
            <button onClick={() => handleNudgeHigh(-1)} aria-label="Lower high note">−</button>
            <span>{midiToName(nudgedHigh)}</span>
            <button onClick={() => handleNudgeHigh(1)} aria-label="Raise high note">+</button>
          </div>
          {tooSmall && (
            <p className="range-warning">
              Your range is narrow — some lessons will not fit. You can redo the test later in Settings.
            </p>
          )}
          <div className="range-buttons">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleRedo}>Redo</button>
          </div>
        </main>
      );
    }

    default:
      return null;
  }
}
