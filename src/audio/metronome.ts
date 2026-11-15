import { getAudioContext } from './audioEngine';

const active = new Set<OscillatorNode>();

/** A 30 ms square-wave tick at tSec (audio clock). */
export function scheduleClick(tSec: number, accent: boolean): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = accent ? 1500 : 1000;
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  osc.connect(gain);
  gain.connect(ctx.destination);
  active.add(osc);
  osc.onended = () => {
    active.delete(osc);
    gain.disconnect();
  };
  osc.start(tSec);
  osc.stop(tSec + 0.03);
}

export function stopClicks(): void {
  for (const osc of active) {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
    osc.disconnect();
  }
  active.clear();
}
