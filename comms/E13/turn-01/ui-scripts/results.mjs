import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const seed = JSON.stringify({ version: 1, range: { lowMidi: 45, highMidi: 64, assessedAt: new Date().toISOString() }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
await ctx.addInitScript((v) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', v); }, seed);
const page = await ctx.newPage();
const sizes = { laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } };
const shot = async (n) => { for (const [k, v] of Object.entries(sizes)) { await page.setViewportSize(v); await page.waitForTimeout(250); await page.screenshot({ path: `${out}${n}-${k}.png` }); } };
const btn = (n) => page.getByRole('button', { name: n, exact: true });
const base = appUrl();
for (const sim of ['perfect', 'flat40']) {
  await page.goto(base + `/#/lesson/s3-01?sim=${sim}`);
  await page.reload();
  await page.waitForTimeout(600);
  await btn('Start').click(); await btn('Play').click();
  await btn('Repeat').waitFor({ timeout: 150000 }); await btn('Next').click();
  await btn('Next').click();
  await btn('Start').click(); await page.waitForTimeout(sim === 'flat40' ? 6000 : 3000);
  if (sim === 'flat40') await shot('l-flat-youdo');
  await page.locator('[data-testid=results]').waitFor({ timeout: 120000 });
  await shot('results-' + sim);
}
for (const [n, r] of [['home', '/'], ['settings', '/settings'], ['range', '/range?sim=range:45,64'], ['calibrate', '/settings/calibrate?sim=perfect'], ['import', '/import']]) {
  await page.goto(base + '/#' + r); await page.reload(); await page.waitForTimeout(600); await shot(n);
}
await page.goto(base + '/#/range?sim=range:45,64'); await page.reload(); await page.waitForTimeout(500);
await btn('Start').click().catch(() => {}); await page.waitForTimeout(500); await shot('range-find');
await b.close();
