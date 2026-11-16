import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getAllLessons, getLesson } from './registry';
import { makeImportedLesson } from './importedSource';
import { parseMidiFile } from './midiFile';
import { toTemplate, summariseTrack } from '../core/exercise/fromMidi';
import { fit } from '../core/exercise/fit';
import { getTolerance } from '../core/scoring/tolerance';
import { useAppStore } from '../storage/store';
import { exportData, mergeData, parseImport, replaceData } from '../storage/exportImport';

const fixture = (name: string) => new Uint8Array(readFileSync(`tests/fixtures/${name}`));
const opts = { id: 'x', title: 'Scale', tempoBpm: 100, beatsPerBar: 4 };

function scaleLesson(ts = 1000) {
  const parsed = parseMidiFile(fixture('c-major-scale.mid'));
  return makeImportedLesson(toTemplate(parsed.tracks[0], opts), 'Scale', 1, ts);
}

beforeEach(() => {
  useAppStore.setState({ importedLessons: [], progress: {} });
});

describe('MIDI fixtures', () => {
  it('c-major-scale.mid parses to offsets 0 2 4 5 7 9 11 12', () => {
    const parsed = parseMidiFile(fixture('c-major-scale.mid'));
    expect(parsed.tempoBpm).toBe(100);
    expect(parsed.beatsPerBar).toBe(4);
    expect(parsed.tracks).toHaveLength(1);
    const t = toTemplate(parsed.tracks[0], opts);
    expect(t.notes.map((n) => n.offset)).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
    expect(t.notes.map((n) => n.startBeat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
  it('two-tracks.mid flags the chord track only', () => {
    const parsed = parseMidiFile(fixture('two-tracks.mid'));
    const ratios = parsed.tracks.map((t) => summariseTrack(t).overlapRatio);
    expect(ratios[0]).toBeLessThanOrEqual(0.3);
    expect(ratios[1]).toBeGreaterThan(0.3);
  });
  it('rejects bytes that are not MIDI', () => {
    expect(() => parseMidiFile(new Uint8Array([1, 2, 3, 4]))).toThrow();
  });
});

describe('imported lessons', () => {
  it('have the required shape, a known tolerance and fit a range', () => {
    const l = scaleLesson();
    expect(l).toMatchObject({ stage: 3, source: 'imported', toleranceId: 't3', passScore: 0.8, id: 'imp-1000' });
    expect(() => getTolerance(l.toleranceId)).not.toThrow();
    expect(fit(l.exercise, { lowMidi: 48, highMidi: 60 }).ok).toBe(true);
    expect(l.exercise.notes.length).toBeGreaterThan(0);
  });

  it('appear in the registry after being added, and vanish with their progress when removed', () => {
    const s = useAppStore.getState();
    const l = scaleLesson();
    s.addImportedLesson(l);
    expect(getLesson(l.id)?.title).toBe('Scale');
    expect(getAllLessons().some((x) => x.source === 'imported')).toBe(true);
    useAppStore.setState({ progress: { [l.id]: { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: 'x' }, 's1-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: 'x' } } });
    useAppStore.getState().removeImportedLesson(l.id);
    expect(getLesson(l.id)).toBeUndefined();
    expect(Object.keys(useAppStore.getState().progress)).toEqual(['s1-01']);
  });

  it('ignores malformed stored entries', () => {
    useAppStore.setState({ importedLessons: [{ nope: 1 }, null, scaleLesson(5)] });
    expect(getAllLessons().filter((x) => x.source === 'imported').map((x) => x.id)).toEqual(['imp-5']);
  });
});

describe('export/import carries imported lessons', () => {
  it('round-trips through export and parseImport, merge and replace', async () => {
    const l = scaleLesson();
    useAppStore.getState().addImportedLesson(l);
    const s = useAppStore.getState();
    const data = { version: s.version, range: s.range, settings: s.settings, progress: s.progress, importedLessons: s.importedLessons };
    const parsed = parseImport(await exportData(data).text());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.importedLessons).toEqual([l]);
    const empty = { ...data, importedLessons: [] };
    expect(mergeData(empty, parsed.data).importedLessons).toEqual([l]);
    expect(replaceData(empty, parsed.data).importedLessons).toEqual([l]);
  });
});
