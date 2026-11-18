import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const base = await appUrl();
const out = 'comms/S04/turn-01/screenshots';
const b = await chromium.launch({ args: ['--ignore-certificate-errors'] });
for (const [name, w, h] of [['laptop',1280,800],['phone',393,852]]) {
  for (const sim of ['perfect','octaveDown','flat40']) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, ignoreHTTPSErrors:true });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem('tmts.v1', JSON.stringify({version:1,range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'},settings:{latencyOffsetMs:0},progress:{},importedLessons:[]})));
    await page.goto(`${base}/#/lesson/s1-05?sim=${sim}`);
    await page.getByRole('button',{name:'Start',exact:true}).click();
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:'Repeat'}).waitFor({timeout:30000});
    await page.getByRole('button',{name:'Next'}).click();
    await page.getByRole('button',{name:'Sing along'}).click();
    await page.getByTestId('practice-line').waitFor({timeout:30000});
    await page.getByRole('button',{name:'Next'}).click();
    await page.getByRole('button',{name:'Start',exact:true}).click();
    await page.getByTestId('graph-sung').waitFor({state:'attached'});
    await page.waitForTimeout(6000);
    await page.screenshot({path:`${out}/${name}-${sim}-live.png`});
    await page.getByTestId('results-verdict').waitFor({timeout:40000});
    await page.waitForTimeout(500);
    await page.screenshot({path:`${out}/${name}-${sim}-results.png`});
    await ctx.close();
  }
}
await b.close();
