import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const AT = '2026-11-01T00:00:00.000Z';
const seed = JSON.stringify({ version: 2, range: { lowMidi: 45, highMidi: 64, assessedAt: AT }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const sizes = { phone: { width: 393, height: 750 }, laptop: { width: 1280, height: 800 } };
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const start = (p) => p.getByRole('button', { name: 'Start', exact: true });
for (const [label, vp] of Object.entries(sizes)) {
  for (const sim of ['perfect', 'flat70', 'sharp300', 'octaveDown']) {
    for (const dark of sim === 'sharp300' ? [false, true] : [false]) {
      try {
        const ctx = await browser.newContext({ viewport: vp, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light', isMobile: label === 'phone', hasTouch: label === 'phone', deviceScaleFactor: 2 });
        await ctx.addInitScript((v) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', v); }, seed);
        const p = await ctx.newPage();
        await p.goto(appUrl() + '/?sim=' + sim + '#/lesson/s1b-01');
        await start(p).click();
        await p.getByRole('button', { name: 'Play', exact: true }).click();
        await p.getByRole('button', { name: /^(Play|Sing along) again$/ }).waitFor({ timeout: 25000 });
        await p.getByRole('button', { name: 'Next' }).click();
        await p.getByRole('button', { name: 'Sing along' }).click();
        await p.waitForFunction(() => { const g = document.querySelector('[data-testid=note-guide]'); return g && !['idle', 'silent'].includes(g.dataset.state); }, null, { timeout: 30000 });
        await p.waitForTimeout(500);
        await p.screenshot({ path: `${out}live-${sim}-${label}${dark ? '-dark' : ''}.png` });
        console.log(label, sim, 'hscroll', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
        await ctx.close();
      } catch (e) { console.log('fail', label, sim, e.message.split('\n')[0]); }
    }
  }
}
await browser.close();
