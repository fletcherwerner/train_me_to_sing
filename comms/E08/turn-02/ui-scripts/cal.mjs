import { chromium } from '@playwright/test';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const o='comms/E08/turn-02/screenshots/';
const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
for (const [n,w,h] of [['phone',393,852],['laptop',1280,800]]) {
const c = await b.newContext({viewport:{width:w,height:h},ignoreHTTPSErrors:true,deviceScaleFactor:2});
const p = await c.newPage();
await p.goto(appUrl()+'/?sim=calibrate:200#/settings/calibrate');
await p.getByRole('button',{name:'Start'}).click();
await p.waitForTimeout(1500);
await p.screenshot({path:o+`cal-count-${n}.png`});
await p.waitForTimeout(5000);
await p.screenshot({path:o+`cal-click-${n}.png`});
await p.waitForTimeout(12000);
await p.screenshot({path:o+`cal-result-${n}.png`});
await p.goto(appUrl()+'/?sim=calibrate:200#/settings');
await p.waitForTimeout(500);
await p.screenshot({path:o+`settings-${n}.png`,fullPage:true});
await p.goto(appUrl()+'/?sim=calibrate:200#/settings/calibrate');
await p.getByRole('button',{name:'Start'}).click();
await p.waitForTimeout(1000);
await p.getByRole('button',{name:/stop/i}).click();
await p.waitForTimeout(500);
await p.screenshot({path:o+`cal-stopped-${n}.png`});
}
await b.close();
