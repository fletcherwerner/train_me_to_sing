import { chromium } from '@playwright/test';
const out='comms/E01/turn-01/screenshots/';
const b=await chromium.launch();
for (const [n,vp,dark] of [['laptop',{width:1280,height:800},false],['phone',{width:393,height:852},false],['phone360',{width:360,height:740},false],['phone-dark',{width:393,height:852},true]]){
 const c=await b.newContext({viewport:vp,ignoreHTTPSErrors:true,colorScheme:dark?'dark':'light',hasTouch:n.startsWith('phone')});
 const p=await c.newPage(); await p.goto('https://localhost:5173/#/dev/piano'); await p.waitForTimeout(500);
 await p.getByRole('button',{name:'Start'}).click();
 const svg=p.locator('svg').first(); const bb=await svg.boundingBox();
 await p.mouse.click(bb.x+bb.width*0.3,bb.y+bb.height*0.8); await p.waitForTimeout(100);
 await p.screenshot({path:out+`key-pressed-${n}.png`});
 await p.waitForTimeout(700);
 await p.locator('input[type=number]').nth(0).fill('40'); await p.locator('input[type=number]').nth(1).fill('64');
 await p.waitForTimeout(200); await p.screenshot({path:out+`range40-64-${n}.png`});
 await p.locator('input[type=number]').nth(0).fill('49'); await p.locator('input[type=number]').nth(1).fill('70');
 await p.waitForTimeout(200); await p.screenshot({path:out+`range-black-ends-${n}.png`});
 console.log(n, await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth, document.documentElement.scrollHeight]));
 console.log(await p.getByRole('button').evaluateAll(e=>e.map(x=>{const r=x.getBoundingClientRect();return [x.textContent,r.width,r.height]})));
}
await b.close();
