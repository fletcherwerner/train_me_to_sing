import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const b = await chromium.launch();
const seed = JSON.stringify({version:1,range:{lowMidi:45,highMidi:64,assessedAt:new Date().toISOString()},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]});
const base = await appUrl();
for (const w of [393, 360, 1280]) {
  const c = await b.newContext({ viewport: { width: w, height: 852 }, ignoreHTTPSErrors: true });
  await c.addInitScript((v) => localStorage.setItem('tmts.v1', v), seed);
  const p = await c.newPage();
  await p.goto(base + '/#/lesson/s2-03?sim=perfect');
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const h = document.querySelector('.lesson-header');
    const a = h.firstElementChild.getBoundingClientRect(), t = h.querySelector('.lesson-title').getBoundingClientRect();
    return { grid: getComputedStyle(h).gridTemplateColumns, a: [a.left, a.right, a.top, a.bottom], t: [t.left, t.right, t.top, t.bottom], sw: document.documentElement.scrollWidth };
  });
  console.log(w, JSON.stringify(r));
  await p.screenshot({ path: `comms/S07/turn-03/screenshots/measure-${w}.png` });
  await c.close();
}
await b.close();
