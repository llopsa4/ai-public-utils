import { chromium } from '@playwright/test';
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const dir='art/inbox/A3-full-r1';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
// Browser-only handle; shared source files remain unchanged.
await page.route('**/main.ts*',async route=>{const response=await route.fetch();const body=await response.text();if(!body.includes('new Phaser.Game({'))throw Error('Main entry changed');await route.fulfill({response,body:body.replace('new Phaser.Game({','window.__artReviewGame = new Phaser.Game({')});});
await page.goto('http://127.0.0.1:5194/?debug');
await page.waitForFunction(()=>!!window.__artReviewGame?.scene.isActive('Menu'));
const counts=JSON.parse(readFileSync('art/manifest.json')).figures.keys.scout.anims;
const anims=JSON.parse(readFileSync('src/data/anims.json')).anims;
const results=[];
for(const sceneName of ['Intro','Mission','Base']){
 await page.evaluate(name=>{const g=window.__artReviewGame;for(const s of g.scene.getScenes(true))g.scene.stop(s.scene.key);g.registry.remove('campaign');g.scene.start(name);},sceneName);
 await page.waitForFunction(name=>!!window.__artReviewGame.scene.getScene(name)?.state,sceneName);
 for(let i=0;i<30;i++){if(!(await page.evaluate(()=>window.__artReviewGame.scene.isActive('Dialogue'))))break;await page.keyboard.press('Escape');await page.waitForTimeout(60);}
 const checked=await page.evaluate(({sceneName,counts,anims})=>{
  const g=window.__artReviewGame,s=g.scene.getScene(sceneName);s.scene.pause();
  const u=s.state.survivors.find(u=>u.kind==='scout'),sprite=(s.units??s.sprites).get(u.id);
  if(!sprite)throw Error('Missing scout UnitSprite in '+sceneName);
  const rows=[];
  for(const [facing,v,flip,drawn] of [['se',[1,0],false,'se'],['sw',[0,1],true,'se'],['ne',[0,-1],false,'ne'],['nw',[-1,0],true,'ne']])for(const [anim,count] of Object.entries(counts))for(let n=0;n<count;n++){
   const subject={...u,hp:anim==='death'?0:100,facing:v,path:[],stance:'walk',order:null,act:{kind:anim,tick:100}};
   sprite.update(subject,100,n/anims[anim].fps*10+.01);
   const b=sprite.body,expected=`scout_${anim}_${drawn}_${n}`;
   if(b.frame.name!==expected||b.flipX!==flip||b.width!==128||b.displayWidth!==64||b.scaleX!==.5||b.originX!==.5||b.originY!==.875)throw Error('Wrong rendered frame '+expected+': '+b.frame.name);
   rows.push({facing,frame:b.frame.name,flipX:b.flipX,sourceWidth:b.width,displayWidth:b.displayWidth});
  }
  sprite.update({...u,hp:100,path:[],act:null,order:null,stance:'walk',facing:[1,0]},100,0);
  s.cameras.main.setZoom(3);s.cameras.main.centerOn(sprite.body.x,sprite.body.y-20);
  return rows;
 },{sceneName,counts,anims});
 await page.waitForTimeout(180);await page.screenshot({path:`${dir}/installed-game-${sceneName.toLowerCase()}.png`});results.push({scene:sceneName,rendered:checked.length,checks:checked});
}
await browser.close();
writeFileSync(`${dir}/installed-browser-checks.json`,JSON.stringify({url:'http://127.0.0.1:5194/',results,errors,note:'All 66 source frames in all 4 facings passed through actual UnitSprite in Intro, Mission and Base. Renderer exercised with synthetic states; movement feel and combat timing still require user playtest.'},null,2));
assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({results:results.map(r=>({scene:r.scene,rendered:r.rendered})),errors}));

