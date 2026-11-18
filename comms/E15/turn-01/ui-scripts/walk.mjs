import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E15/turn-01/screenshots';
const seed = JSON.stringify({version:1,range:{lowMidi:45,highMidi:69,assessedAt:new Date().toISOString()},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]});
const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
for (const [name, vp] of [['laptop',{width:1280,height:800}],['phone',{width:393,height:852}]]) {
  const ctx = await b.newContext({viewport:vp, ignoreHTTPSErrors:true, hasTouch:name==='phone'});
  await ctx.addInitScript(s=>{ if(!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', s)}, seed);
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(appUrl()+'/#/?sim=perfect&today=2026-11-20'); await p.waitForTimeout(800);
  await p.screenshot({path:`${out}/${name}-home.png`, fullPage:true});
  await p.goto(appUrl()+'/#/practice?sim=perfect&today=2026-11-20'); await p.waitForTimeout(1000);
  await p.screenshot({path:`${out}/${name}-practice-0.png`, fullPage:true});
  const btns = await p.getByRole('button').allInnerTexts(); console.log(name, btns);
  for (let i=1;i<=12;i++){
    const start = p.getByRole('button',{name:/^(start|begin|ready|go|next|continue|listen|play)/i}).first();
    if (await start.count()) { try{ await start.click({timeout:1000}); }catch{} }
    await p.waitForTimeout(2500);
    await p.screenshot({path:`${out}/${name}-practice-${i}.png`});
    const ov = await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    console.log(name,i,'hscroll',ov,(await p.getByRole('button').allInnerTexts()).join('|'));
  }
  console.log(errs);
  await ctx.close();
}
await b.close();
