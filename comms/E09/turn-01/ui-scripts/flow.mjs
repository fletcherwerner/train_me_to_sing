import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const base = await appUrl();
const out = 'comms/E09/turn-01/screenshots';
const sizes = { laptop: { width: 1280, height: 800 }, phone: { width: 393, height: 852 } };
const b = await chromium.launch();
for (const [n, vp] of Object.entries(sizes)) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true });
  await ctx.addInitScript(() => localStorage.setItem('tmts.v1', JSON.stringify({version:1,range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]})));
  const p = await ctx.newPage();
  const shot = async (s) => { await p.screenshot({ path: `${out}/${n}-${s}.png`, fullPage: true });
    const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight, innerHeight]);
    console.log(n, s, o.join(',')); };
  await p.goto(base + '#/?sim=perfect'); await p.waitForTimeout(800); await shot('home');
  for (const id of ['s3-01','s3-04','s3-05']) {
    await p.goto(base + `#/lesson/${id}?sim=perfect`); await p.waitForTimeout(600); await shot(id+'-intro');
  }
  await p.goto(base + '#/lesson/s3-04?sim=perfect'); await p.waitForTimeout(500);
  await p.getByRole('button',{name:'Start',exact:true}).click(); await p.waitForTimeout(800); await shot('s3-04-ido-ready');
  await p.getByRole('button',{name:'Play',exact:true}).click(); await p.waitForTimeout(7000); await shot('s3-04-ido-playing');
  await p.waitForTimeout(40000); await shot('s3-04-ido-done');
  await p.getByRole('button',{name:'Next'}).click(); await p.waitForTimeout(500);
  await p.getByTestId('phrase-select').selectOption({label:'Line 2'}); await shot('s3-04-wedo-line2');
  await p.getByRole('button',{name:'Sing along'}).click(); await p.waitForTimeout(8000); await shot('s3-04-wedo-running');
  await p.waitForTimeout(25000); await shot('s3-04-wedo-done');
  await p.getByRole('button',{name:'Next'}).click(); await p.waitForTimeout(500); await shot('s3-04-youdo-ready');
  await p.getByRole('button',{name:'Start',exact:true}).click(); await p.waitForTimeout(12000); await shot('s3-04-youdo-running');
  await p.waitForTimeout(30000); await shot('s3-04-youdo-late');
  await ctx.close();
}
await b.close();
