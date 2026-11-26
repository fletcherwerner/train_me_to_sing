import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const SIZES = { laptop: [1280, 800], phone: [393, 852] };
const seed = (p) => JSON.stringify({ version: 2, range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: p, importedLessons: [] });
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
for (const [name, [w, h]] of Object.entries(SIZES)) {
  for (const sim of ['weDoMiss', 'perfect']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.addInitScript((s) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', s); }, seed({}));
    const shot = (n) => page.screenshot({ path: `${out}${name}-${sim}-${n}.png` });
    try {
      await page.goto(`${appUrl()}/#/lesson/s1b-01?sim=${sim}`);
      await page.waitForTimeout(800);
      await shot('00-intro');
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.getByRole('button', { name: 'Play again' }).waitFor({ timeout: 25000 });
      await page.getByRole('button', { name: 'Next: We do' }).click();
      await page.getByTestId('run-button').click();
      await page.getByTestId('practice-line').waitFor({ timeout: 25000 });
      await page.waitForTimeout(500);
      await shot('01-wedo-result');
      if (sim === 'perfect') {
        await page.getByRole('button', { name: 'Next: You do' }).click();
        await page.waitForTimeout(500);
        await shot('02-youdo-idle');
        await page.getByTestId('run-button').click();
        await page.getByText('Listen…').waitFor({ timeout: 10000 });
        await page.waitForTimeout(500);
        await shot('03-call');
        await page.getByText('Your turn').waitFor({ timeout: 15000 });
        await shot('04-yourturn');
        await page.getByTestId('results-score').waitFor({ timeout: 40000 });
        await page.waitForTimeout(500);
        await shot('05-results');
        await page.screenshot({ path: `${out}${name}-05-results-full.png`, fullPage: true });
      }
    } catch (e) { console.log(name, sim, 'ERR', e.message.split('\n')[0]); await shot('err'); }
    await ctx.close();
  }
}
await browser.close();
