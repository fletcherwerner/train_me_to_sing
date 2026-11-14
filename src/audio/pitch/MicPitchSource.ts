import { freqToMidi } from '../../core/music/notes';
import { getAudioContext } from '../audioEngine';
import { PitchDetector } from 'pitchy';
import type { PitchFrame, PitchSource } from './PitchSource';

export const PITCH_CONFIG = {
  MIN_CLARITY: 0.9,
  MIN_RMS: 0.01,
  MIN_FREQ: 60,
  MAX_FREQ: 1100,
  SMOOTH_WINDOW: 5,
} as const;

let detector: ReturnType<typeof PitchDetector.forFloat32Array> | undefined;

function getDetector() {
  if (detector === undefined) {
    detector = PitchDetector.forFloat32Array(2048);
  }
  return detector;
}

export function createMicPitchSource(): PitchSource {
  let stream: MediaStream | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let analyserNode: AnalyserNode | null = null;
  let animFrameId: number | null = null;
  const listeners = new Set<(f: PitchFrame) => void>();
  const buffer = new Float32Array(2048);

  function emit(midi: number | null, clarity: number, rms: number) {
    const frame: PitchFrame = {
      tSec: getAudioContext().currentTime,
      midi,
      clarity,
      rms,
    };
    for (const cb of listeners) cb(frame);
  }

  async function start() {
    const ctx = getAudioContext();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    sourceNode = ctx.createMediaStreamSource(stream);
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 2048;
    sourceNode.connect(analyserNode);

    const sampleRate = ctx.sampleRate;
    const pitchy = getDetector();

    function tick() {
      animFrameId = requestAnimationFrame(tick);
      analyserNode!.getFloatTimeDomainData(buffer);

      // RMS
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);

      // Pitch detection
      const [freq, clarity] = pitchy.findPitch(buffer, sampleRate);

      // Apply thresholds
      let midi: number | null = null;
      if (clarity >= PITCH_CONFIG.MIN_CLARITY && rms >= PITCH_CONFIG.MIN_RMS && freq >= PITCH_CONFIG.MIN_FREQ && freq <= PITCH_CONFIG.MAX_FREQ) {
        midi = freqToMidi(freq);
      }

      emit(midi, clarity, rms);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function stop() {
    if (animFrameId != null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (analyserNode) {
      analyserNode.disconnect();
      analyserNode = null;
    }
  }

  function subscribe(cb: (f: PitchFrame) => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  return { start, stop, subscribe };
}
