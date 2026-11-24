import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const dir='art/inbox/A7-r2',browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5208/?debug');
await page.waitForFunction(()=>window.__artReviewGame?.scene.isActive('Menu'));
for(const name of ['Intro','Mission','Base']){
 await page.evaluate(name=>{const g=window.__artReviewGame;for(const s of g.scene.getScenes(true))g.scene.stop(s.scene.key);g.registry.remove('campaign');g.scene.start(name);},name);
 await page.waitForFunction(name=>!!window.__artReviewGame.scene.getScene(name)?.state,name);
 for(let i=0;i<10;i++){if(!(await page.evaluate(()=>window.__artReviewGame.scene.isActive('Dialogue'))))break;await page.keyboard.press('Escape');await page.waitForTimeout(80);}
 for(const [facing,v,flip,drawn] of [['se',[1,0],false,'se'],['sw',[0,1],true,'se'],['ne',[0,-1],false,'ne'],['nw',[-1,0],true,'ne']]){
  const checked=await page.evaluate(({name,v,flip,drawn})=>{
   const s=window.__artReviewGame.scene.getScene(name);s.scene.pause(); s.bars?.setVisible(false);
   const rows=[];let cass;
   for(const kind of ['fighter','scout']){
    const u=s.state.survivors.find(u=>u.kind===kind),sprite=(s.units??s.sprites).get(u.id);
    sprite.update({...u,hp:100,path:[],act:null,order:null,stance:'walk',facing:v},100,0);
    const b=sprite.body;
    if(b.frame.name!==`${kind}_idle_${drawn}_0`||b.flipX!==flip||b.width!==128||b.displayWidth!==64||b.scaleX!==.5||b.originX!==.5||b.originY!==.875)throw Error('Wrong render '+kind);
    rows.push({kind,frame:b.frame.name,flipX:b.flipX,sourceWidth:b.width,displayWidth:b.displayWidth,origin:[b.originX,b.originY]});
    if(kind==='fighter')cass=b;
    else {b.setPosition(cass.x+72,cass.y);b.setDepth(cass.depth+1);}
   }
   s.cameras.main.setZoom(3);s.cameras.main.centerOn(cass.x+36,cass.y-20);
   return rows;
  },{name,v,flip,drawn});
  await page.waitForTimeout(180);await page.screenshot({path:`${dir}/game-${name.toLowerCase()}-${facing}.png`});
  results.push({scene:name,facing,checked});
 }
}
await browser.close();
writeFileSync(`${dir}/browser-checks.json`,JSON.stringify({url:'http://127.0.0.1:5208/?debug',results,errors,note:'Synthetic idle states through actual UnitSprite in all 3 scenes, both characters adjacent. Other Cass animations are old frames enlarged only in isolated preview.'},null,2));
if(errors.length)throw Error(errors.join('\n'));
console.log(JSON.stringify({views:results.length,errors}));



