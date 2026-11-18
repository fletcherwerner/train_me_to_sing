import { midiToFreq } from '../core/music/notes';
import { getAudioContext } from './audioEngine';

export interface TonePlayer {
  /** startSec is on the audio clock. With `glideToMidi` the pitch slides linearly to it over the duration. */
  playNote(midi: number, startSec: number, durationSec: number, glideToMidi?: number): void;
  stopAll(): void;
}

const PEAK = 0.3;
const ATTACK = 0.01;
const RELEASE = 0.06;

interface ActiveNote {
  oscs: OscillatorNode[];
  nodes: AudioNode[];
}

export function createTonePlayer(): TonePlayer {
  const active = new Set<ActiveNote>();

  return {
    playNote(midi, startSec, durationSec, glideToMidi) {
      const ctx = getAudioContext();
      const freq = midiToFreq(midi);
      const end = startSec + durationSec;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, startSec);
      env.gain.linearRampToValueAtTime(PEAK, startSec + ATTACK);
      const releaseStart = Math.max(startSec + ATTACK, end - RELEASE);
      env.gain.setValueAtTime(PEAK, releaseStart);
      env.gain.linearRampToValueAtTime(0, Math.max(end, releaseStart));
      env.connect(ctx.destination);

      const tri = ctx.createOscillator();
      tri.type = 'triangle';
      tri.frequency.value = freq;
      tri.connect(env);

      const sine = ctx.createOscillator();
      sine.type = 'sine';
      sine.frequency.value = freq * 2;
      const sineGain = ctx.createGain();
      sineGain.gain.value = 0.3;
      sine.connect(sineGain);
      sineGain.connect(env);

      if (glideToMidi !== undefined) {
        const endFreq = midiToFreq(glideToMidi);
        tri.frequency.setValueAtTime(freq, startSec);
        tri.frequency.linearRampToValueAtTime(endFreq, end);
        sine.frequency.setValueAtTime(freq * 2, startSec);
        sine.frequency.linearRampToValueAtTime(endFreq * 2, end);
      }

      const note: ActiveNote = { oscs: [tri, sine], nodes: [env, sineGain] };
      active.add(note);
      tri.onended = () => {
        active.delete(note);
        note.nodes.forEach((n) => n.disconnect());
      };

      for (const o of note.oscs) {
        o.start(startSec);
        o.stop(Math.max(end, startSec) + 0.02);
      }
    },

    stopAll() {
      for (const note of active) {
        note.nodes.forEach((n) => n.disconnect());
        for (const o of note.oscs) {
          try {
            o.stop();
          } catch {
            /* not started or already stopped */
          }
        }
      }
      active.clear();
    },
  };
}
