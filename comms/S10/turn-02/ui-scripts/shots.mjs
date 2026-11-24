import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const AT='2026-11-01T00:00:00.000Z';
const seedFor=(lvl)=>JSON.stringify({version:2,range:{lowMidi:45,highMidi:64,assessedAt:AT},settings:{latencyOffsetMs:0},progress:lvl?{'s1b-01':{passed:false,bestScore:1,attempts:1,lastAttemptAt:AT,level:lvl}}:{},importedLessons:[]});
const sizes={laptop:{width:1280,height:800},phone:{width:393,height:750}};
const browser=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const start=(p)=>p.getByRole('button',{name:'Start',exact:true});
async function open(label,vp,lvl,url,dark){
  const ctx=await browser.newContext({viewport:vp,ignoreHTTPSErrors:true,colorScheme:dark?'dark':'light',isMobile:label==='phone',hasTouch:label==='phone',deviceScaleFactor:2});
  await ctx.addInitScript((v)=>{if(!localStorage.getItem('tmts.v1'))localStorage.setItem('tmts.v1',v)},seedFor(lvl));
  const p=await ctx.newPage(); await p.goto(appUrl()+'/?sim='+url.sim+'#'+url.path); return [ctx,p];
}
async function intoWeDo(p){await start(p).click();await p.getByRole('button',{name:'Play',exact:true}).click();
 await p.getByRole('button',{name:/^(Play|Sing along) again$/}).waitFor({timeout:25000});await p.getByRole('button',{name:'Next'}).click();await p.getByRole('button',{name:'Sing along'}).click();}
for(const [label,vp] of Object.entries(sizes)){
 for(const sim of ['perfect','flat70','sharp300','octaveDown']){
  for (const dark of [false, ...(sim==='sharp300'?[true]:[])]){
  try{const [c,p]=await open(label,vp,null,{sim,path:'/lesson/s1b-01'},dark);
  if(sim==='perfect'){await start(p).click();await p.waitForTimeout(600);await p.screenshot({path:`${out}learn-ido-${label}.png`});await p.goto(appUrl()+'/?sim=perfect#/lesson/s1b-01');await p.reload();}
  await intoWeDo(p);
  await p.getByTestId('note-guide').waitFor({timeout:20000});
  await p.waitForTimeout(2500);
  await p.screenshot({path:`${out}learn-${sim}-${label}${dark?'-dark':''}.png`});
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);console.log(label,sim,'hscroll',ov);
  await c.close();}catch(e){console.log('fail',label,sim,e.message.split('\n')[0])}}}
 // practise rescue
 try{const [c,p]=await open(label,vp,'practise',{sim:'flat70',path:'/lesson/s1b-01'});await start(p).click();await start(p).click();
  await p.getByTestId('note-guide').waitFor({timeout:20000});await p.waitForTimeout(600);await p.screenshot({path:`${out}practise-rescue-${label}.png`});
  await p.getByTestId('results-verdict').waitFor({timeout:40000});await p.screenshot({path:`${out}practise-results-${label}.png`});await c.close();}catch(e){console.log('fail prac',label,e.message.split('\n')[0])}
 // prove
 try{const [c,p]=await open(label,vp,'prove',{sim:'sharp300',path:'/lesson/s1b-01'});await start(p).click();await start(p).click();await p.waitForTimeout(6000);await p.screenshot({path:`${out}prove-${label}.png`});await c.close();}catch(e){console.log('fail prove',label,e.message.split('\n')[0])}
 // find one note
 for(const sim of ['sharp300','perfect']){try{const [c,p]=await open(label,vp,null,{sim,path:'/lesson/s1a-01'});await p.getByTestId('run-button').click();await p.waitForTimeout(sim==='perfect'?9000:6000);await p.screenshot({path:`${out}match-${sim}-${label}.png`});await c.close();}catch(e){console.log('fail match',label,e.message.split('\n')[0])}}
}
await browser.close();
