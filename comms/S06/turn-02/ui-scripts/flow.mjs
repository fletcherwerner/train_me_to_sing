import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const base = appUrl();
const seed = JSON.stringify({ version: 1, range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch();
for (const [vn, vp] of [['laptop', { width: 1280, height: 800 }], ['iphone', { width: 393, height: 852 }]]) {
  for (const sim of ['bleed', 'bleedSing', 'perfect']) {
    const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.addInitScript((s) => localStorage.setItem('tmts.v1', s), seed);
    await page.goto(`${base}/#/lesson/s1-05?sim=${sim}`);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Repeat' }).waitFor({ timeout: 25000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}${vn}-${sim}-wedo-ready.png` });
    await page.getByRole('button', { name: 'Sing along' }).click();
    await page.waitForTimeout(7000);
    await page.screenshot({ path: `${out}${vn}-${sim}-wedo-running.png` });
    await page.getByTestId('practice-line').waitFor({ timeout: 25000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}${vn}-${sim}-wedo-done.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
