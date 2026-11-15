import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const base = await appUrl();
const store = JSON.stringify({ version: 1, range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch();
for (const [n, vp] of Object.entries({ laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } })) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true });
  await ctx.addInitScript((s) => localStorage.setItem('tmts.v1', s), store);
  const p = await ctx.newPage();
  await p.goto(base + '/#/lesson/s3-04?sim=flat40');
  await p.getByRole('button', { name: 'Start', exact: true }).click();
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.getByRole('button', { name: 'Repeat' }).waitFor({ timeout: 60000 });
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByRole('button', { name: 'Start', exact: true }).click();
  await p.getByTestId('results-verdict').waitFor({ timeout: 90000 });
  await p.screenshot({ path: `comms/E09/turn-02/screenshots/${n}-results-flat40.png`, fullPage: true });
  console.log(n, await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== 'visible').map((e) => e.className + ':' + e.scrollHeight + '/' + e.clientHeight).join(' | ')));
  await ctx.close();
}
await b.close();
