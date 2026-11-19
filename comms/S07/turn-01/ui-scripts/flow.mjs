import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const out = 'comms/S07/turn-01/screenshots/';
const seed = { version:1, range:{lowMidi:45,highMidi:64,assessedAt:'2025-01-01T00:00:00.000Z'}, settings:{latencyOffsetMs:0}, progress:{}, importedLessons:[] };
const b = await chromium.launch({ args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'] });
for (const [name,w,h] of [['laptop',1280,800],['phone',393,852]]) for (const scheme of ['light','dark']) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, colorScheme:scheme, ignoreHTTPSErrors:true, deviceScaleFactor:2 });
  await ctx.addInitScript(s=>{ if(!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1',JSON.stringify(s)); }, seed);
  const p = await ctx.newPage(); const t=`${name}-${scheme}`;
  const shot = async n => { await p.screenshot({path:`${out}flow-${n}-${t}.png`}); };
  const info = async n => console.log(t,n,'scrollW',await p.evaluate(()=>document.documentElement.scrollWidth+'/'+document.documentElement.clientWidth));
  try {
  for (const sim of ['perfect','silent']) {
    await p.goto(`${appUrl()}/#/lesson/s2-03?sim=${sim}`);
    await p.getByRole('button',{name:'Start',exact:true}).click();
    if (sim==='perfect') {
      await shot('1-ido'); await info('ido');
      await p.getByRole('button',{name:'Play',exact:true}).click();
      await p.getByRole('button',{name:'Play again'}).waitFor({timeout:40000});
      await shot('2-ido-played'); await info('ido-played');
      await p.getByRole('button',{name:'Next: We do'}).click();
      await p.getByRole('button',{name:'Sing along',exact:true}).click();
      await p.getByRole('button',{name:'Next: You do'}).waitFor({timeout:40000});
      await shot('3-wedo-done');
      await p.getByRole('button',{name:'Next: You do'}).click();
      await shot('4-youdo');
      await p.getByRole('button',{name:'Start',exact:true}).click();
      await p.waitForTimeout(3000); await shot('5-running'); await info('running');
    } else {
      await p.getByRole('button',{name:'Next: We do'}).isDisabled().catch(()=>{});
      await p.getByRole('button',{name:'Play',exact:true}).click();
      await p.getByRole('button',{name:'Next: We do'}).click({timeout:40000});
      await p.getByRole('button',{name:'Next: You do'}).click();
      await p.getByRole('button',{name:'Start',exact:true}).click();
    }
    await p.getByTestId('results-verdict').waitFor({timeout:60000});
    await shot('6-results-'+sim); await info('results-'+sim);
    await p.screenshot({path:`${out}flow-6-results-${sim}-${t}-full.png`,fullPage:true});
  }
  } catch(e){ console.log(t,'ERR',e.message.split('\n')[0]); await shot('err'); }
  await ctx.close();
}
await b.close();
