import { describe, expect, it } from 'vitest';
import { FULL_MINIMUMS, RUN_MINIMUMS, analyse, type CategoryId } from './categories';
import { note, notes, run, times } from './fixtures';
import type { NoteRecord, RunRecord } from './types';

const D = '2026-11-23';
const stat = (ns: NoteRecord[], id: CategoryId, over: Partial<RunRecord> = {}) =>
  analyse([run({ date: D, notes: ns, ...over })]).stats.find((s) => s.id === id)!;
const statOf = (r: ReturnType<typeof run>, id: CategoryId, minimums = FULL_MINIMUMS) =>
  analyse([r], { minimums }).stats.find((s) => s.id === id)!;

describe('flat and sharp', () => {
  it('flags flat at 30% of 10 voiced notes, and not at 2 of 10', () => {
    const at = [...times(3, -30), ...times(7, 0)];
    const below = [...times(2, -30), ...times(8, 0)];
    expect(stat(at, 'flat').flagged).toBe(true);
    expect(stat(below, 'flat').flagged).toBe(false);
  });
  it('a note at exactly -25 cents counts, -24 does not', () => {
    expect(stat([...times(3, -25), ...times(7, 0)], 'flat').flagged).toBe(true);
    expect(stat([...times(3, -24), ...times(7, 0)], 'flat').flagged).toBe(false);
  });
  it('needs flat to be at least twice sharp', () => {
    const mixed = [...times(4, -30), ...times(3, 30), ...times(3, 0)]; // 4 flat, 3 sharp
    expect(stat(mixed, 'flat').flagged).toBe(false);
    expect(stat(mixed, 'sharp').flagged).toBe(false);
    const flatHeavy = [...times(4, -30), ...times(2, 30), ...times(4, 0)];
    expect(stat(flatHeavy, 'flat').flagged).toBe(true);
  });
  it('flags sharp', () => {
    const s = stat([...times(4, 40), ...times(6, 0)], 'sharp');
    expect(s.flagged).toBe(true);
    expect(s.cents).toBe(40);
  });
  it('respects the minimum of 8 voiced notes', () => {
    const s = stat(times(7, -40), 'flat');
    expect(s.enough).toBe(false);
    expect(s.flagged).toBe(false);
    expect(stat(times(8, -40), 'flat').flagged).toBe(true);
  });
  it('leaves silent and wrong-octave notes out of the rate', () => {
    const ns = [
      ...times(3, -30),
      ...times(5, 0),
      ...times(20, null, { r: 'silent', h: 0 }),
      ...times(20, -1180, { r: 'wrong-octave', oct: true }),
    ];
    const s = stat(ns, 'flat');
    expect(s.total).toBe(8);
    expect(s.count).toBe(3);
    expect(s.flagged).toBe(true);
  });
});

describe('unsteady', () => {
  it('counts held below 0.6, a wavered miss, or spread over 40', () => {
    const ns = [note(0, { h: 0.5 }), note(0, { r: 'wavered', h: 0.7 }), note(0, { s: 41 }), ...times(5, 0)];
    const s = stat(ns, 'unsteady');
    expect(s.count).toBe(3);
    expect(s.total).toBe(8);
    expect(s.flagged).toBe(true);
  });
  it('does not flag at held 0.6 or spread 40', () => {
    const ns = [...times(4, 0, { h: 0.6, s: 40 }), ...times(4, 0)];
    expect(stat(ns, 'unsteady').count).toBe(0);
  });
  it('flags at 30% and not just under', () => {
    expect(stat([...times(3, 0, { h: 0.2 }), ...times(7, 0)], 'unsteady').flagged).toBe(true);
    expect(stat([...times(2, 0, { h: 0.2 }), ...times(8, 0)], 'unsteady').flagged).toBe(false);
  });
});

describe('sliding', () => {
  it('flags at 25% of voiced notes', () => {
    expect(stat([...times(2, 0, { sc: true }), ...times(6, 0)], 'sliding').flagged).toBe(true);
    expect(stat([...times(2, 0, { sc: true }), ...times(7, 0)], 'sliding').flagged).toBe(false);
  });
});

describe('high notes', () => {
  // range 48..72: the top quarter is 66 and up
  const high = (c: number) => note(c, { t: 70 });
  const low = (c: number) => note(c, { t: 55 });
  it('flags when high notes are 20 points worse than the others', () => {
    const ns = [high(-40), high(-40), high(0), high(0), high(0), low(0), low(0), low(0), low(0), low(-40)]; // 40% vs 20%
    const s = stat(ns, 'high');
    expect(s.rate).toBeCloseTo(0.4);
    expect(s.otherRate).toBeCloseTo(0.2);
    expect(s.flagged).toBe(true);
  });
  it('does not flag at 19 points', () => {
    const ns = [...times(5, 0, { t: 70 }), high(-40), ...times(4, 0, { t: 70 }), ...times(10, 0, { t: 55 })]; // 1 of 10 vs 0
    expect(stat(ns, 'high').flagged).toBe(false);
  });
  it('needs 5 high notes', () => {
    const ns = [high(-40), high(-40), high(-40), high(-40), ...times(10, 0, { t: 55 })];
    expect(stat(ns, 'high').enough).toBe(false);
  });
  it('uses the range stored on the run', () => {
    const ns = [...times(5, -40, { t: 70 }), ...times(5, 0, { t: 55 })];
    expect(stat(ns, 'high', { range: { lowMidi: 48, highMidi: 72 } }).flagged).toBe(true);
    // with a wider range, 70 is no longer in the top quarter (top starts at 90 - 10.5 = 79.5)
    const wide = analyse([run({ date: D, notes: ns, range: { lowMidi: 40, highMidi: 90 } })]).stats.find((s) => s.id === 'high')!;
    expect(wide.total).toBe(0);
    expect(wide.flagged).toBe(false);
  });
});

describe('big leaps', () => {
  const leaps = (sungStep: number, n: number): NoteRecord[] => {
    // pairs of notes 4 semitones apart; the second sung `sungStep` semitones above the first
    const out: NoteRecord[] = [];
    for (let i = 0; i < n; i++) {
      out.push(note(0, { t: 60 }), note((sungStep - 4) * 100, { t: 64 }));
    }
    return out;
  };
  it('flags when 35% of leaps are sung 30 cents or more short', () => {
    // six notes alternate 60/64, each 64 sung 50 cents flat: five leaps, all short
    const s = stat(leaps(3.5, 3), 'leaps');
    expect(s.enough).toBe(true);
    expect(s.total).toBe(5);
    expect(s.flagged).toBe(true);
  });
  it('a leap sung 29 cents short is not short, 30 is', () => {
    const run5 = (c: number) => {
      const ns: NoteRecord[] = [];
      for (let i = 0; i < 5; i++) ns.push(note(0, { t: 60 }), note(c, { t: 64 }), note(0, { t: 64 + 0 }));
      return ns;
    };
    // c = -29: step = 4 - 0.29 = 3.71 > 3.70 -> not short
    expect(stat(run5(-29), 'leaps').count).toBe(0);
    expect(stat(run5(-30), 'leaps').count).toBe(5);
    expect(stat(run5(-30), 'leaps').flagged).toBe(true);
  });
  it('needs 5 leaps', () => {
    expect(stat(leaps(3, 4).slice(0, 5), 'leaps').enough).toBe(false); // 4 leaps
  });
  it('pairs neighbouring voiced notes only', () => {
    // a silent note in between: the two voiced notes either side are not neighbours
    const ns = [note(0, { t: 60 }), note(null, { t: 62, r: 'silent', h: 0 }), note(-100, { t: 64 })];
    expect(stat(ns, 'leaps').total).toBe(0);
  });
  it('steps under 3 semitones are not leaps', () => {
    expect(stat([note(0, { t: 60 }), note(-100, { t: 62 })], 'leaps').total).toBe(0);
  });
  it('downward leaps count too', () => {
    const ns: NoteRecord[] = [];
    for (let i = 0; i < 5; i++) ns.push(note(0, { t: 64 }), note(40, { t: 60 })); // sung step -3.6, target -4
    const s = stat(ns, 'leaps');
    expect(s.count).toBeGreaterThanOrEqual(5);
  });
});

describe('drift', () => {
  const phrase = (first: number, last: number): NoteRecord[] => [
    ...times(2, first),
    ...times(2, (first + last) / 2),
    ...times(2, last),
  ];
  const runWith = (first: number, last: number) => run({ date: D, notes: phrase(first, last) });
  it('flags a run whose last third is 20 cents lower than its first third', () => {
    expect(statOf(runWith(0, -20), 'drift', RUN_MINIMUMS).count).toBe(1);
    expect(statOf(runWith(0, -19), 'drift', RUN_MINIMUMS).count).toBe(0);
  });
  it('keeps its direction', () => {
    const down = statOf(runWith(0, -30), 'drift', RUN_MINIMUMS);
    const up = statOf(runWith(0, 30), 'drift', RUN_MINIMUMS);
    expect(down.direction).toBe('flat');
    expect(up.direction).toBe('sharp');
  });
  it('counts runs drifting opposite ways separately, not together', () => {
    const rs = [runWith(0, -30), runWith(0, -30), runWith(0, 30), runWith(0, 0)];
    const s = analyse(rs).stats.find((x) => x.id === 'drift')!;
    expect(s.total).toBe(4);
    expect(s.count).toBe(2);
    expect(s.direction).toBe('flat');
  });
  it('needs 3 runs in a window, and 6 voiced notes in a run', () => {
    const rs = [runWith(0, -30), runWith(0, -30)];
    expect(analyse(rs).stats.find((x) => x.id === 'drift')!.enough).toBe(false);
    const short = run({ date: D, notes: times(5, -30) });
    expect(analyse([short]).stats.find((x) => x.id === 'drift')!.total).toBe(0);
  });
  it('only melody runs count', () => {
    const m = run({ date: D, kind: 'match', notes: phrase(0, -40) });
    expect(analyse([m]).stats.find((x) => x.id === 'drift')!.total).toBe(0);
  });
});

describe('timing', () => {
  it('counts early/late reasons and onsets over the lesson tolerance', () => {
    const ns = [note(0, { r: 'late', o: 500 }), note(0, { o: 450 }), ...times(6, 0, { o: 10 })];
    const s = analyse([run({ date: D, notes: ns })], { timingMsOf: () => 400 }).stats.find((x) => x.id === 'timing')!;
    expect(s.count).toBe(2);
    expect(s.total).toBe(8);
    expect(s.flagged).toBe(true);
  });
  it('flags at 25%, not under', () => {
    expect(stat([...times(2, 0, { r: 'early', o: -500 }), ...times(6, 0, { o: 0 })], 'timing').flagged).toBe(true);
    expect(stat([...times(2, 0, { r: 'early', o: -500 }), ...times(7, 0, { o: 0 })], 'timing').flagged).toBe(false);
  });
  it('ignores notes with no onset', () => {
    expect(stat(times(10, 0, { o: null }), 'timing').total).toBe(0);
  });
});

describe('finding the note', () => {
  const target = (f: number | null, over: Partial<NoteRecord> = {}) => note(0, { f, o: undefined, ...over });
  it('counts targets not found, found after 3 s, or in the wrong octave', () => {
    const ns = [target(null), target(3.5), target(1, { oct: true, c: 0 }), target(2)];
    const s = analyse([run({ date: D, kind: 'match', notes: ns })]).stats.find((x) => x.id === 'finding')!;
    expect(s.count).toBe(3);
    expect(s.total).toBe(4);
    expect(s.flagged).toBe(true);
  });
  it('found at exactly 3 s is fine', () => {
    const ns = [target(3), target(3), target(3), target(3)];
    expect(analyse([run({ date: D, kind: 'match', notes: ns })]).stats.find((x) => x.id === 'finding')!.count).toBe(0);
  });
  it('needs 4 targets', () => {
    const ns = [target(null), target(null), target(null)];
    expect(analyse([run({ date: D, kind: 'match', notes: ns })]).stats.find((x) => x.id === 'finding')!.enough).toBe(false);
  });
  it('a target never found does not make the notes unsteady', () => {
    const ns = [...Array.from({ length: 8 }, () => target(null, { h: 0 }))];
    const s = analyse([run({ date: D, kind: 'match', notes: ns })]).stats.find((x) => x.id === 'unsteady')!;
    expect(s.count).toBe(0);
  });
});

describe('quiet', () => {
  it('flags 30% silent notes out of at least 8, as a notice and never a category', () => {
    const ns = [...times(3, null, { r: 'silent', h: 0 }), ...times(7, 0)];
    const a = analyse([run({ date: D, notes: ns })]);
    expect(a.quiet.flagged).toBe(true);
    expect(a.stats.some((s) => (s.id as string) === 'quiet')).toBe(false);
  });
  it('does not flag under 30% or under 8 notes', () => {
    expect(analyse([run({ date: D, notes: [...times(2, null, { r: 'silent' }), ...times(8, 0)] })]).quiet.flagged).toBe(false);
    expect(analyse([run({ date: D, notes: [...times(4, null, { r: 'silent' }), ...times(3, 0)] })]).quiet.flagged).toBe(false);
  });
});

describe('minimums for one run', () => {
  it('judge 4 voiced notes in a run', () => {
    const r = run({ date: D, notes: notes([-40, -40, -40, -40]) });
    expect(statOf(r, 'flat', RUN_MINIMUMS).flagged).toBe(true);
    expect(statOf(r, 'flat', FULL_MINIMUMS).flagged).toBe(false);
  });
});
