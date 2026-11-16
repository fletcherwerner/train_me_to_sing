import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PitchGraph, ResultsGraph } from './PitchGraph';
import { fit } from '../../core/exercise/fit';
import { parseNotation } from '../../core/exercise/notation';
import { slicePhrase } from '../../core/exercise/phrases';
import { midiToY, resultsPitchBounds } from '../../core/exercise/pitchGraph';
import { simPitchAt, type SimBehaviour } from '../../audio/pitch/simSinger';

const range = { lowMidi: 48, highMidi: 67 };
const tpl = {
  id: 't',
  title: 't',
  tempoBpm: 60,
  beatsPerBar: 4,
  notes: parseNotation('0 2 4:2 2 0'),
};
const fitted = fit(tpl, range);
if (!fitted.ok) throw new Error('fit');
const ex = fitted.exercise;

function framesFor(behaviour: SimBehaviour) {
  const out = [];
  for (let t = 0; t < ex.totalSec; t += 1 / 60) out.push({ tSec: t, midi: simPitchAt(ex, behaviour, t) });
  return out;
}

const live = (props: Partial<React.ComponentProps<typeof PitchGraph>>) =>
  render(
    <PitchGraph exercise={ex} range={range} startSec={100} frames={null} showSung clock={() => 101.5} {...props} />,
  );

describe('PitchGraph', () => {
  it('I do shows black targets and no red line', () => {
    live({ showSung: false, frames: framesFor('perfect') });
    expect(screen.getAllByTestId('graph-target')).toHaveLength(ex.notes.length);
    expect(screen.getByTestId('graph-sung').getAttribute('d')).toBe('');
  });

  it('You do with frames renders a red path', () => {
    live({ frames: framesFor('perfect') });
    expect(screen.getByTestId('graph-sung').getAttribute('d')).toMatch(/^M/);
  });

  it('is decorative for screen readers', () => {
    live({});
    expect(screen.getByTestId('pitch-graph')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows only the phrase notes when given a phrase', () => {
    const phrase = slicePhrase(ex, { startNote: 1, endNote: 3, label: 'p' });
    live({ exercise: phrase });
    expect(screen.getAllByTestId('graph-target')).toHaveLength(3);
  });

  it('moves the scroll group with the clock', () => {
    const { container } = live({});
    const g = container.querySelector('g[transform]');
    expect(g).not.toBeNull();
    expect(g!.getAttribute('transform')).toMatch(/^translate\(/);
  });

  it('leaves a gap in the red line where there is no voice', () => {
    const frames = framesFor('perfect').map((f) => (f.tSec > 0.5 && f.tSec < 0.8 ? { ...f, midi: null } : f));
    live({ frames });
    const d = screen.getByTestId('graph-sung').getAttribute('d')!;
    expect(d.split('M').length - 1).toBe(2);
  });
});

function yValues(d: string): number[] {
  return [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => Number(m[2]));
}

describe('ResultsGraph', () => {
  it('sim=perfect: every red point is within 50 cents of its note', () => {
    const frames = framesFor('perfect');
    render(<ResultsGraph exercise={ex} range={range} frames={frames} />);
    const d = screen.getByTestId('graph-sung').getAttribute('d')!;
    const bounds = resultsPitchBounds(range, ex.notes, frames);
    const ys = yValues(d);
    const pts = frames.filter((f) => f.midi !== null);
    expect(ys.length).toBeGreaterThan(10);
    expect(ys).toHaveLength(pts.length);
    const rowPx = 220 / (bounds.highMidi - bounds.lowMidi);
    pts.forEach((f, i) => {
      const note = ex.notes.find((n) => f.tSec >= n.startSec && f.tSec < n.startSec + n.durationSec)!;
      expect(Math.abs(ys[i] - midiToY(note.midi, bounds, 220)) / rowPx).toBeLessThanOrEqual(0.5);
    });
  });

  it('sim=octaveDown: red is 12 semitones below and not pinned to the edge', () => {
    const frames = framesFor('octaveDown');
    render(<ResultsGraph exercise={ex} range={range} frames={frames} />);
    const bounds = resultsPitchBounds(range, ex.notes, frames);
    const ys = yValues(screen.getByTestId('graph-sung').getAttribute('d')!);
    const rowPx = 220 / (bounds.highMidi - bounds.lowMidi);
    expect(ys[0] - midiToY(ex.notes[0].midi, bounds, 220)).toBeCloseTo(12 * rowPx, 0);
    expect(Math.max(...ys)).toBeLessThan(220);
    expect(Math.min(...ys)).toBeGreaterThan(0);
  });

  it('has black target lines for every note and is aria-hidden', () => {
    render(<ResultsGraph exercise={ex} range={range} frames={[]} />);
    expect(screen.getAllByTestId('graph-target')).toHaveLength(ex.notes.length);
    expect(screen.getByTestId('results-graph')).toHaveAttribute('aria-hidden', 'true');
  });

  it('scrolls inside its own box for attempts longer than 30 s', () => {
    render(<ResultsGraph exercise={{ ...ex, totalSec: 60 }} range={range} frames={[]} />);
    const box = screen.getByTestId('results-graph-scroll');
    const svg = box.querySelector('svg')!;
    expect(Number(svg.getAttribute('width'))).toBeGreaterThan(parseFloat(box.style.width) * 1.9);
  });
});
