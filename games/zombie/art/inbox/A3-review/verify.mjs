import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5191/?debug');
await page.locator('canvas').first().waitFor();
for(let i=0;i<30;i++) {
  if(await page.evaluate(()=>!!window.dw))break;
  await page.mouse.click(640,360); await page.waitForTimeout(500);
}
await page.waitForFunction(()=>!!window.dw);
for(let i=0;i<40;i++) {
  if(await page.evaluate(()=>window.dw.state.say===null))break;
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
}
await page.evaluate(()=>window.dw.step(50));
await page.screenshot({path:'art/inbox/A3-review/intro-preview.png'});
const tick=await page.evaluate(()=>window.dw.state.tick);
await browser.close();
writeFileSync('art/inbox/A3-review/browser-check.json',JSON.stringify({url:'http://127.0.0.1:5191/?debug',tick,errors},null,2)+'\n');
if(errors.length)throw Error(errors.join('\n'));
if(tick<50)throw Error('Intro did not advance');
console.log(JSON.stringify({tick,errors}));
