import { chromium } from '@playwright/test';
const out = 'comms/E04/turn-02/screenshots/';
const seed = (lo, hi) => JSON.stringify({ version: 1, range: { lowMidi: lo, highMidi: hi, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch();
const cases = [
  ['laptop', { width: 1280, height: 800 }, false, [45, 64], 0],
  ['phone', { width: 393, height: 852 }, false, [45, 64], 2],
  ['phone-narrow', { width: 393, height: 852 }, false, [50, 58], 2],
  ['phone-dark', { width: 393, height: 852 }, true, [45, 64], 0],
];
for (const [n, vp, dark, rng, idx] of cases) {
  const c = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light' });
  await c.addInitScript((s) => localStorage.setItem('tmts.v1', s), seed(...rng));
  const p = await c.newPage();
  await p.goto('https://localhost:5173/#/dev/exercise');
  await p.waitForTimeout(600);
  await p.locator('select').selectOption({ index: idx });
  await p.waitForTimeout(300);
  console.log(n, await p.evaluate(() => [...document.querySelectorAll('button,select,a')].map((e) => { const r = e.getBoundingClientRect(); return e.textContent.trim().slice(0, 8) + ':' + Math.round(r.width) + 'x' + Math.round(r.height); }).join(' ')));
  await p.screenshot({ path: `${out}${n}-idle.png`, fullPage: true });
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}${n}-countin.png`, fullPage: true });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}${n}-playing.png`, fullPage: true });
  console.log(n, 'scrollH', await p.evaluate(() => document.documentElement.scrollHeight), 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth));
  await c.close();
}
await b.close();
