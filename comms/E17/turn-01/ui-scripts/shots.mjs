import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E17/turn-01/screenshots/';
const base = appUrl();
const sizes = { laptop: [1280, 800], phone: [393, 852] };
function run(date, total, flat, wob = 0, acc = 0.7) {
  const notes = [];
  for (let i = 0; i < total; i++) { const s = (i * 7) % total; notes.push({ t: 60, c: s < flat ? -30 : 0, h: (i * 3) % total < wob ? 0.3 : 1, o: 0 }); }
  return { date, notes, acc };
}
const seedData = (rs) => ({ version: 2, range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [],
  history: { runs: rs.map((r, i) => ({ id: 's' + i, lessonId: 's1b-04', kind: 'melody', date: r.date, endedAt: r.date + 'T10:00:00.000Z', durationSec: 30, inPractice: false, range: { lowMidi: 45, highMidi: 64 }, score: 0.8, accuracy: r.acc, passed: true, notes: r.notes })), days: Object.fromEntries(rs.map((r) => [r.date, { seconds: 600 }])) } });
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
async function ctx(size, data, dark) {
  const c = await browser.newContext({ viewport: { width: size[0], height: size[1] }, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light' });
  const p = await c.newPage();
  await p.addInitScript((d) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(d)); }, data);
  return p;
}
const empty = seedData([]);
const four = seedData([...['2026-10-31','2026-11-03','2026-11-06','2026-11-09'].map(d=>run(d,20,8,8)), ...['2026-11-14','2026-11-17','2026-11-20','2026-11-24'].map(d=>run(d,20,4,8))]);
const goal = seedData(['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-23','2026-11-24','2026-11-25','2026-11-26'].map(d=>run(d,6,0)));
const five = seedData(['2026-11-21','2026-11-22','2026-11-24','2026-11-25','2026-11-26'].map(d=>run(d,8,4)));
for (const [n, s] of Object.entries(sizes)) {
  for (const [name, data, hash, dark] of [
    ['home-empty', empty, '/#/?today=2026-11-27'], ['progress-empty', empty, '/#/progress?today=2026-11-27'],
    ['progress-four', four, '/#/progress?today=2026-11-27'], ['progress-four-dark', four, '/#/progress?today=2026-11-27', true],
    ['progress-goal', goal, '/#/progress?today=2026-11-27'], ['home-goal', goal, '/#/?today=2026-11-27'],
    ['progress-five', five, '/#/progress?today=2026-11-27']]) {
    const p = await ctx(s, data, dark);
    await p.goto(base + hash); await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}${name}-${n}.png`, fullPage: true });
    console.log(name, n, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
    await p.context().close();
  }
  for (const sim of ['perfect', 'flat40']) {
    const p = await ctx(s, empty);
    await p.goto(base + `/#/lesson/${sim === 'perfect' ? 's1b-04' : 's1d-01'}?sim=${sim}`);
    try {
      await p.getByRole('button', { name: 'Start', exact: true }).click();
      const play = p.getByRole('button', { name: 'Play', exact: true });
      await p.getByTestId('instruction').waitFor();
      if (await play.isVisible()) {
        await play.click();
        await p.getByRole('button', { name: /^(Play|Sing along) again$/ }).waitFor({ timeout: 25000 });
        await p.getByRole('button', { name: 'Next' }).click();
        await p.getByRole('button', { name: 'Sing along' }).click();
        await p.getByTestId('practice-line').filter({ hasText: 'Practice run:' }).waitFor({ timeout: 25000 });
        await p.getByRole('button', { name: 'Next' }).click();
        await p.getByRole('button', { name: 'Start', exact: true }).click();
      } else await p.getByRole('button', { name: 'Start', exact: true }).click();
      await p.getByTestId('results-verdict').waitFor({ timeout: 40000 });
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}results-${sim}-${n}.png` });
      await p.screenshot({ path: `${out}results-${sim}-${n}-full.png`, fullPage: true });
      await p.goBack().catch(()=>{});
      await p.goto(base + '/#/'); await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}home-after-${sim}-${n}.png` });
      await p.goto(base + '/#/progress'); await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}progress-after-${sim}-${n}.png`, fullPage: true });
    } catch (e) { console.log('fail', sim, n, e.message.slice(0, 200)); await p.screenshot({ path: `${out}fail-${sim}-${n}.png` }); }
    await p.context().close();
  }
}
await browser.close();
