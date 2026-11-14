import { midiToFreq } from '../core/music/notes';
import { getAudioContext } from './audioEngine';

export interface TonePlayer {
  /** startSec is on the audio clock. */
  playNote(midi: number, startSec: number, durationSec: number): void;
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
    playNote(midi, startSec, durationSec) {
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
