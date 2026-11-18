import { createMicPitchSource } from './MicPitchSource';
import { constantPitch, createSyntheticPitchSource } from './SyntheticPitchSource';
import type { PitchSource } from './PitchSource';
import { isSimBehaviour, simBehaviour, simRms } from './simSinger';

export { registerSimExercise, clearSimExercise } from './simSinger';
export { recordFrames } from './frameRecorder';

// Module-level state for range simulation mode.
let rangeAccepted = false;

/**
 * Called from the RangeSetup screen when the user clicks "Use this"
 * on the lowest note. Switches the synthetic source to output the high note.
 */
export function acceptRangeLow(): void {
  rangeAccepted = true;
}

/** Reset range simulation state (for testing). */
export function resetRangeSim(): void {
  rangeAccepted = false;
}

function urlParams(): URLSearchParams {
  const hash = window.location.hash;
  const hashParams = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
  return new URLSearchParams(hashParams || window.location.search);
}

/** True when the URL asks for a simulated singer (`?sim=...`) instead of the microphone. */
export function isSimulated(): boolean {
  return urlParams().get('sim') !== null;
}

/** Simulated runs keep the centred key (stable tests) unless the URL adds `key=random`. */
export function wantsRandomKey(): boolean {
  return !isSimulated() || urlParams().get('key') === 'random';
}

export function createPitchSource(): PitchSource {
  // HashRouter puts query params inside the hash: /#/dev/tuner?sim=const:60
  const sim = urlParams().get('sim');

  if (sim?.startsWith('const:')) {
    const midi = parseFloat(sim.slice(6));
    if (Number.isFinite(midi)) {
      return createSyntheticPitchSource(constantPitch(midi));
    }
  }

  if (isSimBehaviour(sim)) {
    return createSyntheticPitchSource(simBehaviour(sim), simRms(sim));
  }

  if (sim?.startsWith('range:')) {
    const parts = sim.slice(6).split(',');
    const low = parseFloat(parts[0]);
    const high = parseFloat(parts[1]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return createSyntheticPitchSource(() => {
        return rangeAccepted ? high : low;
      });
    }
  }

  return createMicPitchSource();
}
