import { chromium } from '@playwright/test';
const out='comms/E01/turn-01/screenshots/';
const b=await chromium.launch();
for (const [n,vp,dark] of [['laptop',{width:1280,height:800},false],['phone',{width:393,height:852},false],['phone-dark',{width:393,height:852},true]]){
 const c=await b.newContext({viewport:vp,ignoreHTTPSErrors:true,colorScheme:dark?'dark':'light'});
 const p=await c.newPage(); await p.goto('https://localhost:5173/#/dev/piano'); await p.waitForTimeout(500);
 await p.getByRole('button',{name:'Start'}).click();
 const k=p.locator('g[data-midi="64"] rect').first(); await k.dispatchEvent('pointerdown'); await p.waitForTimeout(100);
 await p.screenshot({path:out+`target-lit-${n}.png`});
 const bb=await k.boundingBox(); console.log(n,'white key box',bb.width,bb.height);
}
await b.close();
