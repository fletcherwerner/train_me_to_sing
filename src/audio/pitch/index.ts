import { createMicPitchSource } from './MicPitchSource';
import { constantPitch, createSyntheticPitchSource } from './SyntheticPitchSource';
import type { PitchSource } from './PitchSource';

export function createPitchSource(): PitchSource {
  // HashRouter puts query params inside the hash: /#/dev/tuner?sim=const:60
  const hash = window.location.hash;
  const hashParams = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
  const params = new URLSearchParams(hashParams || window.location.search);
  const sim = params.get('sim');

  if (sim?.startsWith('const:')) {
    const midi = parseFloat(sim.slice(6));
    if (Number.isFinite(midi)) {
      return createSyntheticPitchSource(constantPitch(midi));
    }
  }

  return createMicPitchSource();
}
