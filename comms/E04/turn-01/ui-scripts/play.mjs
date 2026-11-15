import { chromium } from '@playwright/test';
const out = 'comms/E04/turn-01/screenshots/';
const seed = (lo, hi) => JSON.stringify({ version: 1, range: { lowMidi: lo, highMidi: hi, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch();
const cases = [
  ['laptop', { width: 1280, height: 800 }, false, [45, 64]],
  ['phone', { width: 393, height: 852 }, false, [45, 64]],
  ['phone-dark', { width: 393, height: 852 }, true, [45, 64]],
  ['phone-narrow', { width: 393, height: 852 }, false, [50, 58]],
];
for (const [n, vp, dark, rng] of cases) {
  const c = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light' });
  await c.addInitScript((s) => localStorage.setItem('tmts.v1', s), seed(...rng));
  const p = await c.newPage();
  await p.goto('https://localhost:5173/#/dev/exercise');
  await p.waitForTimeout(600);
  if (n === 'phone-narrow') {
    await p.screenshot({ path: out + 'narrow-range-0.png', fullPage: true });
    const sel = p.locator('select');
    console.log(await sel.locator('option').allTextContents());
    await sel.selectOption({ index: 1 });
    await p.waitForTimeout(300);
    await p.screenshot({ path: out + 'narrow-range-1.png', fullPage: true });
    await sel.selectOption({ index: 2 });
    await p.waitForTimeout(300);
    await p.screenshot({ path: out + 'narrow-range-2.png', fullPage: true });
  } else {
    if (n === 'phone') {
      await p.locator('select').selectOption({ index: 2 });
      await p.waitForTimeout(300);
    }
    await p.getByRole('button', { name: 'Play', exact: true }).click();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}${n}-countin.png`, fullPage: true });
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `${out}${n}-playing.png`, fullPage: true });
    await p.waitForTimeout(12000);
    await p.screenshot({ path: `${out}${n}-end.png`, fullPage: true });
  }
  console.log(n, 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth));
  await c.close();
}
await b.close();
