import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const seed = JSON.stringify({version:1,range:{lowMidi:45,highMidi:69,assessedAt:new Date().toISOString()},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]});
const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
for (const [n,vp] of [['laptop',{width:1280,height:800}],['phone',{width:393,height:852}]]) {
 const c = await b.newContext({viewport:vp,ignoreHTTPSErrors:true});
 await c.addInitScript(s=>{if(!localStorage.getItem('tmts.v1'))localStorage.setItem('tmts.v1',s)},seed);
 const p = await c.newPage();
 await p.goto(appUrl()+'/#/practice?sim=perfect&today=2026-11-20'); await p.waitForTimeout(800);
 await p.getByRole('button',{name:'Start glide'}).click(); await p.waitForTimeout(1500);
 console.log(n, await p.evaluate(()=>[document.documentElement.scrollHeight, innerHeight, scrollY]));
 await p.screenshot({path:`comms/E15/turn-02/screenshots/${n}-glide-run.png`});
 await c.close();
}
await b.close();
