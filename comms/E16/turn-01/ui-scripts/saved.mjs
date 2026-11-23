import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const base = await appUrl();
const out = 'comms/E16/turn-01/screenshots';
const b = await chromium.launch();
for (const [n, vp] of [['laptop',{width:1280,height:800}],['phone',{width:393,height:852}]]) {
  const c = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true });
  const p = await c.newPage();
  await p.goto(base + '/#/settings?filestore=memory');
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: '+10' }).click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/saved-${n}.png`, fullPage: true });
  // unreadable file
  await p.evaluate(() => { sessionStorage.setItem('tmts.memfs', JSON.stringify({'progress.json':'{broken'})); });
  await p.goto(base + '/#/?filestore=memory'); await p.reload();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/unreadable-${n}.png` });
  console.log(n, await p.evaluate(() => sessionStorage.getItem('tmts.memfs')?.slice(0,200)));
  await c.close();
}
await b.close();
