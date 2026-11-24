import { chromium } from '@playwright/test';
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const dir='art/inbox/A7-full-r1';
const installed = process.argv.includes('--installed');
const url = installed ? 'http://127.0.0.1:5210' : 'http://127.0.0.1:5209';
const prefix = installed ? 'installed-' : '';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
if (!installed) {
await page.goto(url + '/cass-review.html');
await page.waitForFunction(()=>document.querySelector('canvas').getContext('2d').getImageData(0,0,192,192).data.some((channel,i)=>i%4===3&&channel>0));
for(const anim of Object.keys(JSON.parse(readFileSync('art/manifest.json')).figures.keys.fighter.anims)){
 await page.selectOption('#anim',anim);
 await page.waitForFunction(()=>[...document.querySelectorAll('canvas')].every(canvas=>
  canvas.getContext('2d').getImageData(0,0,192,192).data.some((channel,i)=>i%4===3&&channel>0)));
}
await page.selectOption('#anim','walk');await page.screenshot({path:`${dir}/animation-review.png`});
}
await page.goto(url + '/?debug');
await page.waitForFunction(()=>!!window.dwGame?.scene.isActive('Menu'));
const counts=JSON.parse(readFileSync('art/manifest.json')).figures.keys.fighter.anims;
const anims=JSON.parse(readFileSync('src/data/anims.json')).anims;
const results=[];
for(const sceneName of ['Intro','Mission','Base']){
 await page.evaluate(name=>{const g=window.dwGame;for(const s of g.scene.getScenes(true))g.scene.stop(s.scene.key);g.registry.remove('campaign');g.scene.start(name);},sceneName);
 await page.waitForFunction(name=>!!window.dwGame.scene.getScene(name)?.state,sceneName);
 for(let i=0;i<30;i++){if(!(await page.evaluate(()=>window.dwGame.scene.isActive('Dialogue'))))break;await page.keyboard.press('Escape');await page.waitForTimeout(60);}
 const checked=await page.evaluate(({sceneName,counts,anims})=>{
  const g=window.dwGame,s=g.scene.getScene(sceneName);s.scene.pause();
  const u=s.state.survivors.find(u=>u.kind==='fighter'),sprite=(s.units??s.sprites).get(u.id);
  if(!sprite)throw Error('Missing fighter UnitSprite in '+sceneName);
  const rows=[];
  for(const [facing,v,flip,drawn] of [['se',[1,0],false,'se'],['sw',[0,1],true,'se'],['ne',[0,-1],false,'ne'],['nw',[-1,0],true,'ne']])for(const [anim,count] of Object.entries(counts))for(let n=0;n<count;n++){
   const standing = ['idle', 'hold', 'work'].includes(anim);
   const order = anim === 'hold' ? {type:'hold'} : anim === 'work' ? {type:'work',left:1} : null;
   const act = ['takedown', 'stab', 'pistol_shot'].includes(anim)
     ? {kind:anim === 'pistol_shot' ? 'shot' : anim,tick:100} : null;
   const subject = {...u,hp:anim === 'death' ? 0 : 100,facing:v,
     path:anims[anim].loop && !standing ? [[0,0]] : [],
     stance:['crouch','crawl'].includes(anim) ? anim : 'walk',
     running:anim === 'run',carrying:anim === 'carry' ? 'body' : null,order,act};
   const fraction = n / anims[anim].fps * 10 + .01;
   if (anims[anim].loop) sprite.update(subject,0,fraction - sprite.phase * 10);
   else sprite.update(subject,100,fraction);
   const b=sprite.body,expected=`fighter_${anim}_${drawn}_${n}`;
   if(b.frame.name!==expected||b.flipX!==flip||b.width!==128||b.displayWidth!==64||b.scaleX!==.5||b.originX!==.5||b.originY!==.875)throw Error('Wrong rendered frame '+expected+': '+b.frame.name);
   rows.push({facing,frame:b.frame.name,flipX:b.flipX,sourceWidth:b.width,displayWidth:b.displayWidth});
  }
  sprite.update({...u,hp:100,path:[],act:null,order:null,stance:'walk',facing:[1,0]},100,0);
  s.cameras.main.setZoom(3);s.cameras.main.centerOn(sprite.body.x,sprite.body.y-20);
  return rows;
 },{sceneName,counts,anims});
 await page.waitForTimeout(180);await page.screenshot({path:`${dir}/${prefix}game-${sceneName.toLowerCase()}.png`});results.push({scene:sceneName,rendered:checked.length,checks:checked});
}
await browser.close();
writeFileSync(`${dir}/${prefix}browser-checks.json`,JSON.stringify({url,results,errors,note:'All 76 source frames with two drawn and two mirrored facings passed through actual UnitSprite in Intro, Mission and Base. Renderer exercised with synthetic states; movement feel and combat timing still require user playtest.'},null,2));
assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({results:results.map(r=>({scene:r.scene,rendered:r.rendered})),errors}));
