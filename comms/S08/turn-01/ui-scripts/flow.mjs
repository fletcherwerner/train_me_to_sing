import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const base = appUrl();
const sizes = [['laptop',1280,800],['phone',393,852]];
async function through(page){
  await page.getByRole('button',{name:'Start',exact:true}).click();
  const play=page.getByRole('button',{name:'Play',exact:true});
  await page.getByTestId('instruction').waitFor();
  if(!(await play.isVisible())){ await page.getByRole('button',{name:'Start',exact:true}).click(); await page.getByTestId('results-verdict').waitFor({timeout:40000}); return;}
  await play.click();
  await page.getByRole('button',{name:/^(Play|Sing along) again$/}).waitFor({timeout:25000});
  await page.getByRole('button',{name:'Next'}).click();
  await page.getByRole('button',{name:'Sing along'}).click();
  await page.getByTestId('practice-line').filter({hasText:'Practice run:'}).waitFor({timeout:25000});
  await page.getByRole('button',{name:'Next'}).click();
  await page.getByRole('button',{name:'Start',exact:true}).click();
  await page.getByTestId('results-verdict').waitFor({timeout:40000});
}
for(const [n,w,h] of sizes){
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream']});
  const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:w,height:h}});
  const page=await ctx.newPage();
  await page.addInitScript(()=>{ if(localStorage.getItem('tmts.v1'))return; localStorage.setItem('tmts.v1',JSON.stringify({version:2,range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]}));});
  const s=(f)=>page.screenshot({path:`${out}${n}-${f}.png`});
  await page.goto(`${base}/#/lesson/s1b-04?sim=perfect`);
  await page.getByTestId('best-accuracy').waitFor(); await s('intro-nobest');
  await through(page); await s('results-perfect');
  await page.goto(`${base}/#/`); await page.waitForTimeout(500); await s('home');
  await page.goto(`${base}/#/lesson/s1b-04?sim=flat40`); await page.reload();
  await page.getByTestId('best-accuracy').waitFor(); await s('intro-best');
  await through(page); await s('results-flat40');
  await page.goto(`${base}/#/lesson/s1a-02?sim=perfect`); await page.reload(); await page.waitForTimeout(500); await s('match-intro');
  try{ await page.getByRole('button',{name:'Start',exact:true}).click(); await page.getByTestId('results-accuracy').waitFor({timeout:60000}); await s('match-results'); }catch(e){ await s('match-fail'); console.log('match',n,e.message.slice(0,200)); }
  await b.close();
}
