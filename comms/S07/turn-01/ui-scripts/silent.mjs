import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const seed = { version:1, range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'}, settings:{latencyOffsetMs:0}, progress:{}, importedLessons:[] };
const b = await chromium.launch({ args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'] });
for (const [name,w,h] of [['laptop',1280,800],['phone',393,852]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, ignoreHTTPSErrors:true, deviceScaleFactor:2 });
  await ctx.addInitScript(s=>{ if(!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1',JSON.stringify(s)); }, seed);
  const p = await ctx.newPage();
  try {
    await p.goto(`${appUrl()}/#/lesson/s2-03?sim=silent`);
    await p.getByRole('button',{name:'Start',exact:true}).click();
    await p.getByRole('button',{name:'Play',exact:true}).click();
    await p.getByRole('button',{name:'Play again'}).waitFor({timeout:40000});
    await p.getByRole('button',{name:'Next: We do'}).click();
    await p.getByRole('button',{name:'Next: You do'}).click();
    await p.getByRole('button',{name:'Start',exact:true}).click();
    await p.getByTestId('results-verdict').waitFor({timeout:60000});
    await p.screenshot({path:`comms/S07/turn-01/screenshots/silent-results-${name}.png`});
    console.log(name, await p.locator('.lesson-actions .btn--primary').allInnerTexts());
  } catch(e){ console.log(name,'ERR',e.message.split('\n')[0]); await p.screenshot({path:`comms/S07/turn-01/screenshots/silent-err-${name}.png`}); }
  await ctx.close();
}
await b.close();
