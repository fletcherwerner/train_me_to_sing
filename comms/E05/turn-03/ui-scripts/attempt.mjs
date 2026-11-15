import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E05/turn-03/screenshots';
const V = { laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } };
const seed = JSON.stringify({ version: 1, range: { lowMidi: 45, highMidi: 64, assessedAt: new Date().toISOString() }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] });
const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
for (const [l, v] of Object.entries(V)) {
  for (const sim of ['perfect', 'octaveDown', 'flat70']) {
    const c = await b.newContext({ viewport: v, ignoreHTTPSErrors: true, isMobile: l === 'phone', hasTouch: l === 'phone', deviceScaleFactor: l === 'phone' ? 2 : 1 });
    await c.addInitScript((s) => { if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', s); }, seed);
    const p = await c.newPage();
    const url = `${appUrl()}?sim=${sim}#/dev/attempt`;
    await p.goto(url, { waitUntil: 'networkidle' });
    if (sim === 'perfect') await p.screenshot({ path: `${out}/attempt-idle-${l}.png`, fullPage: true });
    await p.getByText('Start attempt').click();
    if (sim !== 'flat70') {
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${out}/attempt-${sim}-countin-${l}.png`, fullPage: true });
      await p.waitForTimeout(4500);
      await p.screenshot({ path: `${out}/attempt-${sim}-run-${l}.png`, fullPage: true });
    }
    await p.waitForSelector('[data-testid=attempt-result]', { timeout: 40000 });
    await p.screenshot({ path: `${out}/attempt-${sim}-result-${l}.png`, fullPage: true });
    console.log(l, sim, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
    await c.close();
  }
}
await b.close();
