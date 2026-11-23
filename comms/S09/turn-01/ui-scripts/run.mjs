import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = new URL('../screenshots/', import.meta.url).pathname;
const sizes = [['laptop',1280,800],['phone',393,852]];
const sims = process.argv[2] ? [process.argv[2]] : ['perfect','flat40'];
const browser = await chromium.launch({args:['--use-fake-ui-for-media-stream']});
for (const sim of sims) for (const [n,w,h] of sizes) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, ignoreHTTPSErrors:true});
  const page = await ctx.newPage();
  await page.addInitScript(()=>{ if(localStorage.getItem('tmts.v1'))return; localStorage.setItem('tmts.v1',JSON.stringify({version:1,range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]}));});
  await page.goto(`${appUrl()}/#/lesson/s1a-02?sim=${sim}`);
  await page.waitForTimeout(800);
  await page.screenshot({path:`${out}${sim}-${n}-intro.png`,fullPage:true});
  await page.getByTestId('run-button').click();
  await page.getByTestId('match-countdown').waitFor({timeout:15000});
  await page.waitForTimeout(3000);
  await page.screenshot({path:`${out}${sim}-${n}-singing.png`,fullPage:true});
  console.log(sim,n,'scrollH',await page.evaluate(()=>[document.documentElement.scrollHeight,innerHeight,document.documentElement.scrollWidth,innerWidth]));
  await page.waitForTimeout(6500);
  await page.screenshot({path:`${out}${sim}-${n}-afternote.png`,fullPage:true});
  await page.getByTestId('results-score').waitFor({timeout:120000});
  await page.screenshot({path:`${out}${sim}-${n}-results.png`,fullPage:true});
  console.log(sim,n,'results scroll',await page.evaluate(()=>[document.documentElement.scrollHeight,innerHeight]));
  await ctx.close();
}
await browser.close();
