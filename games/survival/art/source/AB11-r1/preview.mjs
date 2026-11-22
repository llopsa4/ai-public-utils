// Candidate-only snapshot. No installed atlas, source, or manifest writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {packGroup} from '../../../scripts/art/pack-lib.mjs';
const game=fileURLToPath(new URL('../../../',import.meta.url));
const art=path.join(game,'art'),out=path.join(art,'inbox/AB11');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read(path.join(art,'manifest.json'));
const types=read(path.join(game,'src/data/buildings.json')).types;
fs.mkdirSync(path.join(game,'test-results'),{recursive:true});
const temp=fs.mkdtempSync(path.join(game,'test-results/ab11-preview-'));
for(const entry of ['src','vite.config.ts','package.json'])fs.cpSync(path.join(game,entry),path.join(temp,entry),{recursive:true});
const tempArt=path.join(temp,'art'),atlas=path.join(tempArt,'atlas');
fs.mkdirSync(tempArt);fs.cpSync(path.join(art,'atlas'),atlas,{recursive:true});
for(const [batches,group] of [[['AB9','AB11'],'buildings'],[['AB3'],'ground'],[['AB5'],'plants'],[['AB6'],'fx']]){
  const candidates=new Map();
  for(const batch of batches){
    const inbox=path.join(art,'inbox',batch);
    for(const k of read(path.join(inbox,'delivery.json')).keys)candidates.set(k,path.join(inbox,k));
  }
  const keys=[...candidates.keys()];
  const all=Object.keys(manifest).filter(k=>manifest[k].atlas===group&&(keys.includes(k)||manifest[k].status==='final'));
  packGroup(manifest,group,all,k=>candidates.get(k)??path.join(art,'inbox/done',`${manifest[k].batch}-r${manifest[k].revision}`,k),atlas);
  for(const k of keys)manifest[k].status='final';
}
fs.writeFileSync(path.join(tempArt,'manifest.json'),JSON.stringify(manifest));
const server=await createServer({configFile:path.join(temp,'vite.config.ts'),cacheDir:path.join(temp,'.vite'),server:{host:'127.0.0.1',port:5211,fs:{allow:[game]}}});
let browser;const checks=[];
try{
  await server.listen();browser=await chromium.launch({args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  for(const width of [1280,2560]){
    const page=await browser.newPage({viewport:{width,height:width*9/16}}),errors=[];
    page.setDefaultTimeout(30000);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?debug`);
    await page.waitForFunction(()=>window.menu?.buttons()['slot1.new']);
    const canvas=page.locator('#game canvas'),box=await canvas.boundingBox();
    const [mx,my]=await page.evaluate(()=>window.menu.buttons()['slot1.new']);
    await page.mouse.click(box.x+mx*width/1280,box.y+my*width/1280);
    await page.waitForFunction(()=>window.camp?.state.people.length===20);
    const buildings=await page.evaluate(types=>{
      const c=window.camp,s=c.state,[fx,fy]=s.map.fire;s.paused=true;s.tick=3600;
      const result=[];
      // Isolated clearing has a stage row and finished store beside the actual fire plaza.
      for(let y=fy-15;y<fy+10;y++)for(let x=fx-12;x<fx+18;x++){
        const i=y*s.map.size+x;s.map.tiles[i]='grass';s.map.amount[i]=0;s.blocked[i]=false;
      }
      s.buildings=s.buildings.filter(b=>b.type==='fire');
      for(let col=0;col<4;col++){
        const id=s.nextBuildingId++,x=fx-8+col*6,y=fy-10,type='store';
        s.buildings.push({id,type,x,y,done:col===3,built:types[type].buildPoints*[.15,.5,.85,1][col],delivered:{},workers:[],residents:[],tended:0,hp:null});
        result.push({id,type,x,y,state:['stage1','stage2','stage3','finished'][col]});
      }
      s.mapVersion++;c.selectPeople([]);return result;
    },types);
    await page.mouse.move(box.x+width*.5,box.y+heightSafe(width)*.72);
    await page.waitForTimeout(1000);
    // Editing the debug map fells trees. Remove those review-only stumps and the old
    // bushes/props inside the clearing, so they cannot obscure the candidate floor.
    await page.evaluate(()=>{
      const c=window.camp,[fx,fy]=c.state.map.fire,t=c.scene.terrain;
      for(const group of [t.stumps,t.bushes,t.props])for(const [i,s] of group){
        const x=i%c.state.map.size,y=Math.floor(i/c.state.map.size);
        if(x>=fx-12&&x<fx+18&&y>=fy-15&&y<fy+10){s.img.destroy();group.delete(i)}
      }
    });
    for(const b of buildings)assert.ok((await page.evaluate(()=>window.camp.buildings())).frames[b.id].startsWith(`building_store/${b.state}/`));
    for(const season of ['summer','winter']){
      await page.evaluate(season=>{window.camp.state.tick=season==='summer'?3600:10800},season);
      for(const zoom of [.5,1,2]){
        await page.evaluate(zoom=>{
          const c=window.camp,[fx,fy]=c.state.map.fire,cam=c.scene.cameras.main;
          cam.setZoom(zoom);cam.centerOn((fx+2-(fy-4))*32+c.state.map.size*32,(fx+2+fy-4)*16+32);
        },zoom);await page.waitForTimeout(700);
        await canvas.screenshot({path:path.join(out,`camp-${season}-${zoom}x-${width}.png`)});
      }
      // Every stage gets a full unobscured capture at zoom 1; fire additionally checks the flame.
      const fire=await page.evaluate(()=>window.camp.state.buildings.find(b=>b.type==='fire'));
      for(const b of [...buildings,{...fire,state:'fire'}]){
        await page.evaluate(b=>{
          const c=window.camp,cam=c.scene.cameras.main;cam.setZoom(1);
          cam.centerOn((b.x-b.y)*32+c.state.map.size*32,(b.x+b.y+3)*16+32-45);
        },b);await page.waitForTimeout(350);
        await canvas.screenshot({path:path.join(out,`${b.state}-${season}-${width}.png`)});
      }
      const seen=await page.evaluate(()=>window.camp.buildings());
      for(const b of buildings)assert.ok(seen.frames[b.id].startsWith(`building_store/${b.state==='finished'&&season==='winter'?'winter':b.state}/`));
      assert.ok(seen.flames.includes(fire.id));
      const flame=await page.evaluate(id=>{
        const c=window.camp,f=c.scene.flames.get(id),base=c.scene.buildingViews.get(id);
        return {x:f.x,y:f.y,baseX:base.x,baseY:base.y,frame:f.frame.name};
      },fire.id);
      assert.equal(flame.x,flame.baseX);assert.equal(flame.y,flame.baseY);
      assert.ok(flame.frame.startsWith('fx_flame/loop/'));
      checks.push({width,season,stageFrames:seen.frames,hearthFlame:flame});
    }
    const b=buildings.at(-1);
    await page.evaluate(b=>{
      const c=window.camp,cam=c.scene.cameras.main;c.state.tick=3600;
      cam.setZoom(2);cam.centerOn((b.x-b.y)*32+c.state.map.size*32,(b.x+b.y+3)*16+32);
    },b);
    const toPage=(x,y)=>[box.x+x*box.width/1280,box.y+y*box.height/720];
    await page.mouse.move(...toPage(640,430));await page.mouse.move(...toPage(640,360),{steps:6});
    await page.waitForFunction(id=>window.camp.storeOpen()?.id===id,b.id);
    for(const [label,fill] of [['empty',0],['half',.5],['full',1]]){
      await page.evaluate(fill=>{
        const s=window.camp.state.store;
        for(const [res,cap] of [['food',800],['wood',600],['hides',160],['pemmican',400]])s[res]=fill*cap;
      },fill);
      await page.waitForFunction(n=>Object.values(window.camp.storeOpen()?.items??{}).length===4&&Object.values(window.camp.storeOpen().items).every(v=>v===n),40*fill);
      const opened=await page.evaluate(id=>{
        const c=window.camp,im=c.scene.buildingViews.get(id);
        return {frame:im.frame.name,items:c.storeOpen().items,x:im.x,y:im.y};
      },b.id);
      assert.equal(opened.frame,'building_store_open/finished/00');
      await page.waitForTimeout(300);await canvas.screenshot({path:path.join(out,`store-${label}-${width}.png`)});
      checks.push({width,storeFill:label,...opened});
    }
    await page.mouse.move(...toPage(900,530),{steps:6});
    await page.waitForFunction(()=>window.camp.storeOpen()===null);
    assert.ok((await page.evaluate(()=>window.camp.buildings())).frames[b.id].startsWith('building_store/finished/'));
    assert.deepEqual(errors,[]);await page.close();console.log(`AB11 ${width}: stages, seasons, hearth flame and empty/half/full hover passed`);
  }
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');
}catch(error){console.error(error);process.exitCode=1}
finally{await browser?.close();await server.close()}
function heightSafe(width){return width*9/16}
