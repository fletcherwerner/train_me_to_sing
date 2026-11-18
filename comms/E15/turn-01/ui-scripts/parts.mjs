import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/E15/turn-01/screenshots';
const seed = JSON.stringify({version:1,range:{lowMidi:45,highMidi:69,assessedAt:new Date().toISOString()},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]});
const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
for (const [name, vp] of [['laptop',{width:1280,height:800}],['phone',{width:393,height:852}]]) {
  const ctx = await b.newContext({viewport:vp, ignoreHTTPSErrors:true});
  await ctx.addInitScript(s=>{ if(!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', s)}, seed);
  const p = await ctx.newPage();
  await p.goto(appUrl()+'/#/practice?sim=perfect&today=2026-11-20&minutes=21'); await p.waitForTimeout(800);
  await p.screenshot({path:`${out}/${name}-p-20min.png`});
  await p.getByRole('button',{name:'Skip this part'}).click(); await p.waitForTimeout(800);
  await p.screenshot({path:`${out}/${name}-p-pitch-idle.png`});
  const st = p.getByRole('button',{name:/start|begin|ready/i}).first();
  if (await st.count()) await st.click();
  for (const t of [400,1500,3000]) { await p.waitForTimeout(t); await p.screenshot({path:`${out}/${name}-p-pitch-run${t}.png`}); }
  await p.waitForTimeout(6000); await p.screenshot({path:`${out}/${name}-p-pitch-after.png`, fullPage:true});
  console.log(name,(await p.getByRole('button').allInnerTexts()).join('|'));
  for (let i=0;i<3;i++){ const s=p.getByRole('button',{name:'Skip this part'}); if(await s.count()) {await s.click(); await p.waitForTimeout(700); await p.screenshot({path:`${out}/${name}-p-next${i}.png`, fullPage:true}); console.log(name,i,(await p.getByRole('button').allInnerTexts()).join('|'));} }
  await ctx.close();
}
await b.close();
