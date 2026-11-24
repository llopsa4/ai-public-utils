import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const dir='art/inbox/A3-review/trial-2x';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5192/?debug');
await page.locator('canvas').first().waitFor();
for(let i=0;i<30;i++){if(await page.evaluate(()=>!!window.dw))break;await page.mouse.click(640,360);await page.waitForTimeout(500);}
await page.waitForFunction(()=>!!window.dw);
for(let i=0;i<40;i++){if(await page.evaluate(()=>window.dw.state.say===null))break;await page.keyboard.press('Enter');await page.waitForTimeout(150);}
await page.evaluate(()=>window.dw.step(50));
const results=[];
for(const [facing,dirVector] of [['se',[1,0]],['sw',[0,1]],['ne',[0,-1]],['nw',[-1,0]]]){
  await page.evaluate(v=>{const u=window.dw.state.survivors.find(u=>u.kind==='scout');u.facing=v;},dirVector);
  await page.waitForTimeout(150);
  const measured=await page.evaluate(()=>{
    const scene=window.__resolutionTrial.scene.getScene('Intro');
    const body=scene.children.list.find(c=>c.texture?.key==='scout');
    scene.cameras.main.setZoom(2);scene.cameras.main.centerOn(body.x,body.y);
    return {frame:body.frame.name,sourceWidth:body.width,displayWidth:body.displayWidth,scale:body.scaleX,flipX:body.flipX,origin:[body.originX,body.originY]};
  });
  if(measured.sourceWidth!==128||measured.displayWidth!==64||measured.scale!==.5)throw Error('Trial size changed: '+JSON.stringify(measured));
  if(!measured.frame.includes(facing[0]==='s'?'idle_se':'idle_ne'))throw Error('Wrong facing');
  results.push({facing,...measured});
  await page.waitForTimeout(150);
  await page.screenshot({path:`${dir}/game-${facing}.png`});
}
await browser.close();
const contact=new PNG({width:1024,height:256});
for(let n=0;n<4;n++){
  const f=n<2?'se':'ne',hi=n%2===1;
  const src=PNG.sync.read(readFileSync(hi?`${dir}/idle_${f}_0.png`:`art/inbox/A3/scout/idle_${f}_0.png`));
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const i=(Math.floor(y*src.height/256)*src.width+Math.floor(x*src.width/256))*4;
    contact.data.set(src.data[i+3]?[...src.data.subarray(i,i+3),255]:[75,79,73,255],(y*1024+n*256+x)*4);
  }
}
writeFileSync(`${dir}/comparison.png`,PNG.sync.write(contact));
writeFileSync(`${dir}/browser-check.json`,JSON.stringify({results,errors},null,2)+'\n');
if(errors.length)throw Error(errors.join('\n'));
console.log(JSON.stringify({results,errors}));
