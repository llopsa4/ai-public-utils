// AB8 candidate-only packing, real pointer drags, stage/winter frame checks and captures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {packGroup} from '../../../scripts/art/pack-lib.mjs';
const game=fileURLToPath(new URL('../../../',import.meta.url));
const art=path.join(game,'art'),out=path.join(art,'inbox/AB8');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read(path.join(art,'manifest.json'));
fs.mkdirSync(path.join(game,'test-results'),{recursive:true});
const temp=fs.mkdtempSync(path.join(game,'test-results/ab8-preview-'));
for(const entry of ['src','vite.config.ts','package.json'])fs.cpSync(path.join(game,entry),path.join(temp,entry),{recursive:true});
const tempArt=path.join(temp,'art'),atlas=path.join(tempArt,'atlas');
fs.mkdirSync(tempArt);fs.cpSync(path.join(art,'atlas'),atlas,{recursive:true});
for(const [batch,group] of [['AB8','buildings'],['AB3','ground'],['AB5','plants'],['AB6','fx']]){
  const inbox=path.join(art,'inbox',batch),keys=read(path.join(inbox,'delivery.json')).keys;
  const all=Object.keys(manifest).filter(k=>manifest[k].atlas===group&&(keys.includes(k)||manifest[k].status==='final'));
  packGroup(manifest,group,all,k=>keys.includes(k)?path.join(inbox,k):path.join(art,'inbox/done',`${manifest[k].batch}-r${manifest[k].revision}`,k),atlas);
  for(const k of keys)manifest[k].status='final';
}
fs.writeFileSync(path.join(tempArt,'manifest.json'),JSON.stringify(manifest));
const server=await createServer({configFile:path.join(temp,'vite.config.ts'),cacheDir:path.join(temp,'.vite'),server:{host:'127.0.0.1',port:5208,fs:{allow:[game]}}});
let browser;const checks=[];
try{
  await server.listen();browser=await chromium.launch({args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  for(const width of [1280,2560]){
    const page=await browser.newPage({viewport:{width,height:width*9/16}}),errors=[];
    page.setDefaultTimeout(25000);
    page.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error('Console error:',m.text())}});
    console.log(`AB8 ${width}: opening candidate game`);
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?debug`);
    await page.waitForFunction(()=>window.menu?.buttons()['slot1.new']);
    console.log(`AB8 ${width}: menu ready`);
    const canvas=page.locator('#game canvas'),box=await canvas.boundingBox();
    const [x,y]=await page.evaluate(()=>window.menu.buttons()['slot1.new']);
    await page.mouse.click(box.x+x*width/1280,box.y+y*width/1280);
    await page.waitForFunction(()=>window.camp?.state.people.length===20);
    console.log(`AB8 ${width}: camp ready`);
    await page.evaluate(()=>{
      const c=window.camp,s=c.state,[fx,fy]=s.map.fire;
      s.paused=true;s.tick=3600;s.upgrades.push('builders','barricades');s.store.wood=1000;s.store.hides=100;
      // Clear only the isolated review area's terrain so every pointer drag has valid sites.
      for(let y=fy-8;y<=fy+10;y++)for(let x=fx-10;x<=fx+14;x++){
        if(x<fx+4&&x>=fx&&y>=fy&&y<fy+4)continue;
        const i=y*s.map.size+x;s.map.tiles[i]='grass';s.map.amount[i]=0;s.blocked[i]=false;
      }
      s.mapVersion++;
      const ids=s.people.filter(p=>p.age==='adult').slice(0,3).map(p=>p.id);
      c.selectPeople(ids);c.scene.setPlacing('barricade',ids);
      const cam=c.scene.cameras.main;cam.setZoom(1);
      cam.centerOn(s.map.size*32+70,(fx+fy)*16+32+12);
    });
    await page.waitForTimeout(500);
    console.log(`AB8 ${width}: review area ready`);
    const screen=async(dx,dy)=>page.evaluate(([dx,dy])=>{
      const c=window.camp,[fx,fy]=c.state.map.fire,cam=c.scene.cameras.main;
      const wx=(fx+dx-fy-dy)*32+c.state.map.size*32,wy=(fx+dx+fy+dy)*16+32;
      return {x:(wx-cam.worldView.x)*cam.zoom,y:(wy-cam.worldView.y)*cam.zoom};
    },[dx,dy]);
    const drag=async(a,b)=>{
      const start=await screen(...a),end=await screen(...b);
      assert.ok(start.y>40&&start.y<580&&end.y>40&&end.y<580);
      await page.mouse.move(box.x+start.x*width/1280,box.y+start.y*width/1280);
      await page.mouse.down();
      await page.mouse.move(box.x+end.x*width/1280,box.y+end.y*width/1280,{steps:12});
      await page.waitForTimeout(100);await page.mouse.up();
      await page.evaluate(()=>window.camp.step(1));await page.waitForTimeout(100);
    };
    // L at the north of camp, T at the east. Overlap the elbow tile on the second drag.
    for(const [a,b] of [[[-7,-5],[-3,-5]],[[-3,-5],[-3,-1]],[[7,-5],[11,-5]],[[9,-5],[9,-1]]])await drag(a,b);
    console.log(`AB8 ${width}: four pointer drags completed`);
    await page.evaluate(()=>window.camp.scene.setPlacing(null));
    const wall=await page.evaluate(()=>window.camp.state.buildings.filter(b=>b.type==='barricade'));
    console.log('AB8 wall positions:',JSON.stringify(wall.map(b=>[b.x,b.y,b.lineId])));
    assert.equal(wall.length,18,'L and T each have nine unique segments');
    assert.equal(new Set(wall.map(b=>b.lineId)).size,4,'four real mouse drags created four lines');
    const stages=await page.evaluate(()=>{
      const c=window.camp,s=c.state,[fx,fy]=s.map.fire,ids=[];
      for(const b of s.buildings.filter(b=>b.type==='barricade')){b.done=true;b.built=50;}
      for(const [row,type] of ['trap','fire_pit','barricade'].entries()){
        for(let col=0;col<4;col++){
          const id=s.nextBuildingId++,points=type==='trap'?40:type==='fire_pit'?60:50;
          s.buildings.push({id,type,x:fx-4+col*2,y:fy+6+row*2,done:col===3,built:points*[.15,.5,.85,1][col],delivered:{},workers:[],residents:[],tended:0,hp:type==='barricade'?60:null});
          ids.push({id,type,state:['stage1','stage2','stage3','finished'][col]});
        }
      }
      s.mapVersion++;
      c.selectPeople([]);return ids;
    });
    await page.waitForTimeout(600);
    let frames=(await page.evaluate(()=>window.camp.buildings())).frames;
    for(const b of stages)assert.ok(frames[b.id].startsWith(`building_${b.type}/${b.state}/`),JSON.stringify(b));
    const masks=wall.map(b=>frames[b.id].split('/').at(-1));
    assert.ok(masks.includes('12'),'L elbow NW+SW');assert.ok(masks.includes('14'),'T stem SE+SW+NW');
    for(const season of ['summer','winter']){
      await page.evaluate(season=>{window.camp.state.tick=season==='summer'?3600:10800},season);
      for(const zoom of [.5,1,2]){
        await page.evaluate(z=>window.camp.scene.cameras.main.setZoom(z),zoom);await page.waitForTimeout(700);
        await canvas.screenshot({path:path.join(out,`camp-${season}-${zoom}x-${width}.png`)});
      }
      frames=(await page.evaluate(()=>window.camp.buildings())).frames;
      for(const b of wall)assert.ok(frames[b.id].startsWith(`building_barricade/${season==='winter'?'winter':'finished'}/`));
    }
    const flames=(await page.evaluate(()=>window.camp.buildings())).flames;
    assert.ok(stages.filter(b=>b.type==='fire_pit'&&b.state==='finished').every(b=>flames.includes(b.id)));
    assert.deepEqual(errors,[]);checks.push({width,wallSegments:wall.length,masks,stages,flames,browserErrors:errors});
    await page.close();console.log(`AB8 ${width}: dragged L/T, three stages, winter, flames, three zooms passed.`);
  }
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');
}catch(error){console.error(error);process.exitCode=1}
finally{
  await browser?.close();
  await server.close();
}
