const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK = new Set([1, 3, 6, 8, 10]);

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToName(midi: number): string {
  const m = Math.round(midi);
  const pc = ((m % 12) + 12) % 12;
  return `${NAMES[pc]}${Math.floor(m / 12) - 1}`;
}

export function nameToMidi(name: string): number {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(name.trim());
  if (!match) throw new Error(`Invalid note name: ${name}`);
  const pc = NAMES.indexOf(match[1] + match[2]);
  if (pc < 0) throw new Error(`Invalid note name: ${name}`);
  return (parseInt(match[3], 10) + 1) * 12 + pc;
}

export function centsBetween(sungMidi: number, targetMidi: number): number {
  return (sungMidi - targetMidi) * 100;
}

export function isBlackKey(midi: number): boolean {
  return BLACK.has((((Math.round(midi)) % 12) + 12) % 12);
}
