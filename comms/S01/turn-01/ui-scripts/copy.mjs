import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/S01/turn-01/screenshots/';
const SEED = `if(!localStorage.getItem('tmts.v1'))localStorage.setItem('tmts.v1',JSON.stringify({version:1,range:{lowMidi:45,highMidi:64,assessedAt:new Date().toISOString()},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]}))`;
const b = await chromium.launch();
const base = appUrl();
for (const [n, vp, dark] of [['laptop',{width:1280,height:800},false],['phone',{width:393,height:852},false],['phone-dark',{width:393,height:852},true]]) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, colorScheme: dark?'dark':'light', isMobile: n.startsWith('phone'), hasTouch: n.startsWith('phone') });
  await ctx.addInitScript(SEED);
  const p = await ctx.newPage();
  await p.goto(base + '/#/settings'); await p.waitForTimeout(800);
  await p.getByTestId('profile-name').fill('Copy ' + n);
  await p.getByText('Copy current range and progress').click();
  await p.getByTestId('profile-create').click(); await p.waitForTimeout(1000);
  console.log(n, p.url());
  await p.screenshot({ path: out + `copy-home-${n}.png`, fullPage: true });
  const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, [...document.querySelectorAll('a,button')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim().slice(0,25),Math.round(r.width),Math.round(r.height)]})]);
  console.log(JSON.stringify(o));
  await ctx.close();
}
await b.close();
