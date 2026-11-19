import { chromium } from 'playwright';
import { appUrl } from '../../../../harness/lib/app-url.mjs';
const b=await chromium.launch();
for (const [w,h] of [[393,852],[360,800],[1280,800]]){
 const c=await b.newContext({viewport:{width:w,height:h}});
 await c.addInitScript(()=>{localStorage.setItem('tmts.range',JSON.stringify({low:45,high:64}));});
 const p=await c.newPage();
 await p.goto(appUrl()+'/#/lesson/s2-03?sim=perfect');
 await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{const h=document.querySelector('.lesson-header');if(!h)return null;const a=h.children[0].getBoundingClientRect(),t=[...h.children].find(e=>/h1|h2/i.test(e.tagName))?.getBoundingClientRect();return {cols:getComputedStyle(h).gridTemplateColumns,a:[a.left,a.right],t:t&&[t.left,t.right],sw:document.documentElement.scrollWidth}});
 console.log(w,JSON.stringify(r));
 await p.screenshot({path:`comms/S07/turn-03/screenshots/lesson-${w}.png`});
 await c.close();
}
await b.close();
