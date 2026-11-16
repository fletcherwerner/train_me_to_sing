import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out='comms/E11/turn-01/screenshots/';
const seed={version:1,range:{lowMidi:60,highMidi:67,assessedAt:'2025-01-01T00:00:00.000Z'},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]};
const b=await chromium.launch();
for (const [name,vp,dark] of [['laptop',{width:1280,height:800}],['phone',{width:393,height:852}],['phone-dark',{width:393,height:852},true]]) {
  const c=await b.newContext({viewport:vp,ignoreHTTPSErrors:true,colorScheme:dark?'dark':'light'});
  const p=await c.newPage();
  await p.addInitScript(d=>{if(!localStorage.getItem('tmts.v1'))localStorage.setItem('tmts.v1',JSON.stringify(d))},seed);
  await p.goto(appUrl()+'/#/import?sim=perfect'); await p.waitForTimeout(800);
  await p.getByTestId('midi-file').setInputFiles('tests/fixtures/two-tracks.mid'); await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Use this track'}).nth(1).click(); await p.waitForTimeout(300);
  await p.screenshot({path:out+`${name}-7-chords-selected.png`,fullPage:true});
  await p.getByRole('button',{name:'Use this track'}).first().click(); await p.waitForTimeout(300);
  await p.screenshot({path:out+`${name}-8-melody-narrow-range.png`,fullPage:true});
  console.log(name,await p.evaluate(()=>document.documentElement.scrollWidth));
  await c.close();
}
await b.close();
