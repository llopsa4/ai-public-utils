// Candidate atlas and walk-only manifest in a scratch game; installed files stay untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';import {createServer} from 'vite';
import {packGroup} from '../../../scripts/art/pack-lib.mjs';
const game=fileURLToPath(new URL('../../../',import.meta.url)),art=path.join(game,'art'),out=path.join(art,'inbox/AB12');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),manifest=read(path.join(art,'manifest.json'));
fs.mkdirSync(path.join(game,'test-results'),{recursive:true});
const temp=fs.mkdtempSync(path.join(game,'test-results/ab12-preview-'));
for(const p of ['src','vite.config.ts','package.json'])fs.cpSync(path.join(game,p),path.join(temp,p),{recursive:true});
const tempArt=path.join(temp,'art'),atlas=path.join(tempArt,'atlas');fs.mkdirSync(tempArt);fs.cpSync(path.join(art,'atlas'),atlas,{recursive:true});
packGroup(manifest,'man',['person_man'],()=>path.join(out,'person_man'),atlas,undefined,()=> 'AB12');
// The people view initializes at idle/s/00. Scratch-only aliases let the unmodified
// renderer start; these are the first walk poses, not delivered/claimed idle art.
const manAtlasFile=path.join(atlas,'man.json'),manAtlas=read(manAtlasFile);
for(const texture of manAtlas.textures)for(const frame of [...texture.frames])if(frame.filename.endsWith('/00')){
 const alias=structuredClone(frame);alias.filename=alias.filename.replace('/walk/','/idle/');texture.frames.push(alias);
}
fs.writeFileSync(manAtlasFile,JSON.stringify(manAtlas));
manifest.person_man.status='final';manifest.person_man.anims={walk:manifest.person_man.anims.walk,idle:{frames:1,fps:1,loop:true}};
// Reuse AB3 ground as review context, without altering its approval status in the workspace.
const groundKeys=read(path.join(art,'inbox/AB3/delivery.json')).keys;
packGroup(manifest,'ground',groundKeys,k=>path.join(art,'inbox/AB3',k),atlas);
for(const k of groundKeys)manifest[k].status='final';
fs.writeFileSync(path.join(tempArt,'manifest.json'),JSON.stringify(manifest));
const server=await createServer({configFile:path.join(temp,'vite.config.ts'),cacheDir:path.join(temp,'.vite'),server:{host:'127.0.0.1',port:5212,fs:{allow:[game]}}});
let browser;const checks=[];
try{
 await server.listen();browser=await chromium.launch({args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 for(const width of [1280,2560]){
  const page=await browser.newPage({viewport:{width,height:width*9/16}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?debug`);
  await page.waitForFunction(()=>window.menu?.buttons()['slot1.new']);
  const canvas=page.locator('#game canvas'),box=await canvas.boundingBox();
  const [mx,my]=await page.evaluate(()=>window.menu.buttons()['slot1.new']);await page.mouse.click(box.x+mx*width/1280,box.y+my*width/1280);
  await page.waitForFunction(()=>window.camp?.state.people.length===20);
  const ids=await page.evaluate(()=>{
   const c=window.camp,s=c.state,[fx,fy]=s.map.fire;s.paused=true;s.tick=3600;
   for(let y=fy+2;y<fy+13;y++)for(let x=fx-12;x<fx+11;x++){
    const i=y*s.map.size+x;s.map.tiles[i]='grass';s.map.amount[i]=0;s.blocked[i]=false;
   }
   s.mapVersion++;
   const template=structuredClone(s.people.find(p=>p.age==='adult'));
   s.people=[];
   for(let row=0;row<2;row++)for(let col=0;col<8;col++){
    const p=structuredClone(template);p.id=101+row*8+col;p.age='adult';p.sex='male';p.family=row;
    p.x=fx-6+col*.9+row*1.8;p.y=fy+10-col*.9+row*1.8;p.task={...p.task,step:'walk'};p.carry={res:null,amount:0};p.job=null;p.mounted=false;
    s.people.push(p);
   }
   c.selectPeople([]);return s.people.map(p=>p.id);
  });
  await page.waitForTimeout(400);
  await page.evaluate(()=>{
   const c=window.camp,[fx,fy]=c.state.map.fire,t=c.scene.terrain;
   for(const group of [t.stumps,t.bushes,t.props])for(const [i,s] of group){
    const x=i%c.state.map.size,y=Math.floor(i/c.state.map.size);
    if(x>=fx-12&&x<fx+11&&y>=fy+2&&y<fy+13){s.img.destroy();group.delete(i)}
   }
  });
  // Feed screen-space movement into the normal facing selector, with the simulation paused.
  const facings=['s','sw','w','nw','n','ne','e','se'];
  for(let f=0;f<3;f++){
   await page.evaluate(({f,ids})=>{
    const c=window.camp,views=c.scene.people.views;
    for(let j=0;j<ids.length;j++){
     const p=c.state.people[j],v=views.get(p.id);if(!v)continue;
     const a=(j%8)*Math.PI/4;
     // Inverse isometric projection: dx=(x-y)*32, dy=(x+y)*16.
     const dx=-Math.sin(a)*6,dy=Math.cos(a)*6;
     p.x+=dx/64+dy/32;p.y+=dy/32-dx/64;
     v.animStart=c.scene.time.now-f/12*1000;
    }
   },{f,ids});await page.waitForTimeout(100);
  }
  for(const zoom of [.5,1,2]){
   await page.evaluate(zoom=>{const c=window.camp,[fx,fy]=c.state.map.fire;const cam=c.scene.cameras.main;cam.setZoom(zoom);cam.centerOn((fx-2-(fy+8))*32+c.state.map.size*32,(fx-2+fy+8)*16-12)},zoom);
   await page.waitForTimeout(350);await canvas.screenshot({path:path.join(out,`camp-${zoom}x-${width}.png`)});
  }
  // Exercise all 64 frame names, aligned layers and both runtime tint values.
  const shown=await page.evaluate(ids=>ids.map(id=>window.camp.creatures().person(id)),ids);
  assert.ok(shown.every(v=>v?.art&&v.key==='person_man'),JSON.stringify(shown));
  assert.deepEqual(shown.map(v=>v.facing),ids.map((_,i)=>facings[i%8]));
  for(const facing of facings)for(let frame=0;frame<8;frame++){
   const result=await page.evaluate(({facing,frame,ids})=>{
    const c=window.camp,vs=c.scene.people.views;
    for(const id of ids){const v=vs.get(id);v.facing=facing;c.scene.people.showFrame(v,'walk',frame)}
    return ids.map(id=>{const v=vs.get(id);return {base:v.img.frame.name,cloth:v.cloth.frame.name,tint:v.cloth.tintTopLeft,x:v.img.x,cx:v.cloth.x,y:v.img.y,cy:v.cloth.y}});
   },{facing,frame,ids});
   for(const v of result){assert.equal(v.base,`person_man/base/walk/${facing}/${String(frame).padStart(2,'0')}`);assert.equal(v.cloth,v.base.replace('/base/','/cloth/'));assert.equal(v.x,v.cx);assert.equal(v.y,v.cy)}
   assert.deepEqual([...new Set(result.map(v=>v.tint))].sort(),[0x7fa8d8,0xe0905a].sort());
   checks.push({width,facing,frame,tints:[...new Set(result.map(v=>v.tint))]});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`AB12 ${width}: three zoom captures, 64 frame pairs, two family tints; no browser errors.`);
 }
 fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');
}catch(e){console.error(e);process.exitCode=1}finally{await browser?.close();await server.close()}
