import { describe, expect, it } from 'vitest';
import { evaluateAttempt } from '../../core/scoring/evaluate';
import { getTolerance } from '../../core/scoring/tolerance';
import { fit } from '../../core/exercise/fit';
import { getLesson } from '../../content/registry';
import { simPitchAt } from './simSinger';
import { recordFrames } from './frameRecorder';
import type { PitchFrame, PitchSource } from './PitchSource';

const DT = 1 / 60;
const range = { lowMidi: 45, highMidi: 64 };

function resolve(id: string) {
  const fitted = fit(getLesson(id)!.exercise, range);
  if (!fitted.ok) throw new Error('fit');
  return fitted.exercise;
}

describe('recorder latency and short notes', () => {
  it('late300 frames with a 0.3 s offset applied by the recorder all hit under t4', () => {
    const ex = resolve('s2-01');
    const startSec = 5;
    let cb: (f: PitchFrame) => void = () => {};
    const source: PitchSource = {
      start: async () => {},
      stop: () => {},
      subscribe: (c) => {
        cb = c;
        return () => {};
      },
    };
    const feed = () => {
      for (let t = -1; t < ex.totalSec + 0.4; t += DT) {
        cb({ tSec: startSec + t, midi: simPitchAt(ex, 'late300', t), clarity: 1, rms: 0.1 });
      }
    };
    const rec = recordFrames(source, startSec, startSec + ex.totalSec, 0.3);
    feed();
    const r = evaluateAttempt(ex, rec.frames, getTolerance('t4'), 0.8);
    expect(r.score).toBe(1);
    expect(r.notes.every((n) => n.hit)).toBe(true);

    // Without the offset the same singing is graded late.
    const rec0 = recordFrames(source, startSec, startSec + ex.totalSec, 0);
    feed();
    expect(evaluateAttempt(ex, rec0.frames, getTolerance('t4'), 0.8).score).toBeLessThan(1);
  });

  it('perfect singing of s2-07 (0.42 s eighths) scores 1 under t3', () => {
    const ex = resolve('s2-07');
    expect(ex.notes[0].durationSec).toBeCloseTo(0.4167, 3);
    const frames = [];
    for (let t = -0.5; t < ex.totalSec + 0.3; t += DT) frames.push({ tSec: t, midi: simPitchAt(ex, 'perfect', t) });
    expect(evaluateAttempt(ex, frames, getTolerance('t3'), 0.8).score).toBe(1);
  });
});
