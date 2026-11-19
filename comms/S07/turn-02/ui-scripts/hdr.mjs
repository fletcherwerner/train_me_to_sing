import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 393, height: 852 }, ignoreHTTPSErrors: true });
const p = await c.newPage();
const base = await appUrl();
for (const [n, q] of [['intro','s2-03'],['long','s2-03']]) {
await p.goto(base + '/#/lesson/' + q + '?sim=perfect');
await p.waitForTimeout(1500);
await p.screenshot({ path: `comms/S07/turn-02/screenshots/hdr-${n}-phone.png` });
}
console.log(await p.evaluate(() => document.documentElement.scrollWidth));
await b.close();
