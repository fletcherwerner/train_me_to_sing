// Regenerates tests/fixtures/c-major-scale.mid (one track, C4..C5 major scale, quarter notes, 100 bpm).
import pkg from '@tonejs/midi';
import { mkdirSync, writeFileSync } from 'node:fs';

const { Midi } = pkg;
mkdirSync('tests/fixtures', { recursive: true });

const m = new Midi();
m.header.setTempo(100);
const tr = m.addTrack();
tr.name = 'Melody';
[60, 62, 64, 65, 67, 69, 71, 72].forEach((p, i) =>
  tr.addNote({ midi: p, ticks: i * m.header.ppq, durationTicks: m.header.ppq }),
);
writeFileSync('tests/fixtures/c-major-scale.mid', m.toArray());

// tests/fixtures/two-tracks.mid: a melody track and a chord track (for the "looks like chords" warning).
const c = new Midi();
c.header.setTempo(90);
const mel = c.addTrack();
mel.name = 'Melody';
[60, 62, 64, 65, 67].forEach((p, i) => mel.addNote({ midi: p, ticks: i * c.header.ppq, durationTicks: c.header.ppq }));
const ch = c.addTrack();
ch.name = 'Chords';
[0, 2, 4].forEach((b) => {
  for (const p of [48, 52, 55]) ch.addNote({ midi: p, ticks: b * c.header.ppq, durationTicks: 2 * c.header.ppq });
});
writeFileSync('tests/fixtures/two-tracks.mid', c.toArray());
