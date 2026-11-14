import { chromium } from '@playwright/test';
const out='comms/E01/turn-02/screenshots/';
const b=await chromium.launch();
const q='?sung=62.4&target=64&markerLow=48&markerHigh=67';
const cases=[['laptop',{width:1280,height:800},false,q],['phone',{width:393,height:852},false,q],['phone-dark',{width:393,height:852},true,q],['phone-octave',{width:393,height:852},false,'?sung=52.2&target=64&markerLow=48&markerHigh=67'],['phone-match',{width:393,height:852},false,'?sung=64&target=64&markerLow=48&markerHigh=67'],['phone-above',{width:393,height:852},false,'?sung=80&target=64&markerLow=48&markerHigh=67']];
for (const [n,vp,dark,qq] of cases){
 const c=await b.newContext({viewport:vp,ignoreHTTPSErrors:true,colorScheme:dark?'dark':'light'});
 const p=await c.newPage(); await p.goto('https://localhost:5173/#/dev/piano'+qq); await p.waitForTimeout(600);
 await p.screenshot({path:out+`${n}.png`});
 console.log(n, await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]), await p.locator('a,button,input').evaluateAll(e=>e.map(x=>{const r=x.getBoundingClientRect();return [x.textContent||x.type,Math.round(r.width),Math.round(r.height)]})));
}
await b.close();
