import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const base = await appUrl();
const out = new URL('../screenshots/', import.meta.url).pathname;
const b = await chromium.launch();
const opt = (w,h,dark)=>({ignoreHTTPSErrors:true,viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});
for (const [n,w,h] of [['laptop',1280,800],['phone',393,852]]) for (const dark of [false,true]) {
  const c = await b.newContext(opt(w,h,dark));
  const p = await c.newPage();
  const sfx = n+(dark?'-dark':'');
  await p.goto(base+'/?sim=const:60#/mic-check'); await p.waitForTimeout(500);
  await p.screenshot({path:out+`idle-${sfx}.png`});
  await p.getByRole('button',{name:/start/i}).click(); await p.waitForTimeout(1500);
  await p.screenshot({path:out+`running-${sfx}.png`});
  await p.getByRole('button',{name:/stop/i}).click(); await p.waitForTimeout(500);
  await p.screenshot({path:out+`stopped-${sfx}.png`});
  console.log(sfx, await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await c.close();
}
const c = await b.newContext(opt(393,852,false));
const p = await c.newPage();
await p.goto(base+'/#/mic-check'); await p.getByRole('button',{name:/start/i}).click(); await p.waitForTimeout(1000);
await p.screenshot({path:out+'error-phone.png'});
await p.goto(base+'/#/'); await p.waitForTimeout(500); await p.screenshot({path:out+'home-phone.png'});
await b.close();
