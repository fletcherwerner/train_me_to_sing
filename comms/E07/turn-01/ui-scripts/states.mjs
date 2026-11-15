import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E07/turn-01/screenshots/';
const seed = (lo, hi, progress = {}) => ([lo, hi, progress]) => {
  localStorage.setItem('tmts.v1', JSON.stringify({ version: 1, range: { lowMidi: lo, highMidi: hi, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress, importedLessons: [] }));
};
const b = await chromium.launch();
for (const [name, vp] of [['laptop', { width: 1280, height: 800 }], ['phone', { width: 393, height: 852 }]]) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(seed(), [50, 53, {}]);
  await page.goto(appUrl() + '/#/'); await page.waitForTimeout(500);
  await page.screenshot({ path: out + `home-smallrange-${name}.png`, fullPage: true });
  await ctx.close();
  const c2 = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, deviceScaleFactor: 2 });
  const p2 = await c2.newPage();
  const prog = { 's1-01': { passed: true, bestScore: 1, attempts: 2, lastAttemptAt: 'x' }, 's1-02': { passed: false, bestScore: 0.6, attempts: 1, lastAttemptAt: 'x' } };
  await p2.addInitScript(seed(), [45, 64, prog]);
  await p2.goto(appUrl() + '/#/'); await p2.waitForTimeout(500);
  await p2.screenshot({ path: out + `home-progress-${name}.png`, fullPage: true });
  console.log(name, 'scrollW', await p2.evaluate(() => document.documentElement.scrollWidth));
  await p2.goto(appUrl() + '/#/settings'); await p2.waitForTimeout(300);
  await p2.getByRole('button', { name: 'Reset progress' }).click();
  await p2.screenshot({ path: out + `settings-confirm-${name}.png`, fullPage: true });
  await c2.close();
}
await b.close();
