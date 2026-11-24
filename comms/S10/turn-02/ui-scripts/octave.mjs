import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const AT='2026-11-01T00:00:00.000Z';
const seed=JSON.stringify({version:2,range:{lowMidi:45,highMidi:64,assessedAt:AT},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]});
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
for (const sim of ['octaveDown','sharp300']) {
const c=await b.newContext({viewport:{width:393,height:750},ignoreHTTPSErrors:true,isMobile:true,hasTouch:true,deviceScaleFactor:2});
await c.addInitScript(v=>{if(!localStorage.getItem('tmts.v1'))localStorage.setItem('tmts.v1',v)},seed);
const p=await c.newPage(); await p.goto(appUrl()+'/?sim='+sim+'#/lesson/s1b-01');
await p.getByRole('button',{name:'Start',exact:true}).click();
await p.getByRole('button',{name:'Play',exact:true}).click();
await p.getByRole('button',{name:/^(Play|Sing along) again$/}).waitFor({timeout:25000});
await p.getByRole('button',{name:'Next'}).click();await p.getByRole('button',{name:'Sing along'}).click();
const want = sim==='octaveDown'?'octave':'far';
await p.locator(`[data-testid="note-guide"][data-state="${want}"]`).waitFor({timeout:30000});
await p.waitForTimeout(300);
await p.screenshot({path:`${out}state-${sim}-phone.png`});
await c.close();}
await b.close();
