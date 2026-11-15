import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 393, height: 852 }, ignoreHTTPSErrors: true });
const p = await c.newPage();
await p.addInitScript(() => localStorage.setItem('tmts.v1', JSON.stringify({ version: 1, range: { lowMidi: 50, highMidi: 53, assessedAt: '2025-01-01T00:00:00.000Z' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] })));
for (const r of ['/', '/settings', '/lesson/zzz']) {
  await p.goto(appUrl() + '/#' + r); await p.waitForTimeout(300);
  const res = await p.$$eval('a,button', els => els.map(e => { const r = e.getBoundingClientRect(); return `${e.textContent.trim().slice(0,30)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  console.log(r, res);
}
await b.close();
