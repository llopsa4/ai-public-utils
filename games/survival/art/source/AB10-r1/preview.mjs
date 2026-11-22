// Pack into an isolated snapshot; installed atlases and runtime source stay untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {packGroup} from '../../../scripts/art/pack-lib.mjs';
const game=fileURLToPath(new URL('../../../',import.meta.url));
const art=path.join(game,'art'),out=path.join(art,'inbox/AB10');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read(path.join(art,'manifest.json'));
const types=read(path.join(game,'src/data/buildings.json')).types;
fs.mkdirSync(path.join(game,'test-results'),{recursive:true});
const temp=fs.mkdtempSync(path.join(game,'test-results/ab10-preview-'));
for(const entry of ['src','vite.config.ts','package.json'])fs.cpSync(path.join(game,entry),path.join(temp,entry),{recursive:true});
const tempArt=path.join(temp,'art'),atlas=path.join(tempArt,'atlas');
fs.mkdirSync(tempArt);fs.cpSync(path.join(art,'atlas'),atlas,{recursive:true});
for(const [batches,group] of [[['AB9','AB10'],'buildings'],[['AB3'],'ground'],[['AB5'],'plants']]){
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
const server=await createServer({configFile:path.join(temp,'vite.config.ts'),cacheDir:path.join(temp,'.vite'),server:{host:'127.0.0.1',port:5210,fs:{allow:[game]}}});
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
      // Show a compact stage row per structure in a clearing beside the existing camp.
      const rows=['healers_lodge','scouts_lodge','lancers_lodge','archers_lodge','spirit_lodge'],result=[];
      for(let y=fy-26;y<fy-4;y++)for(let x=fx-5;x<fx+15;x++){
        const i=y*s.map.size+x;s.map.tiles[i]='grass';s.map.amount[i]=0;s.blocked[i]=false;
      }
      for(const [row,type] of rows.entries())for(let col=0;col<4;col++){
        const id=s.nextBuildingId++,x=fx-3+col*4,y=fy-24+row*4;
        s.buildings.push({id,type,x,y,done:col===3,built:types[type].buildPoints*[.15,.5,.85,1][col],delivered:{},workers:[],residents:[],tended:0,hp:null});
        result.push({id,type,x,y,state:['stage1','stage2','stage3','finished'][col]});
      }
      s.mapVersion++;c.selectPeople([]);
      const cam=c.scene.cameras.main;cam.setZoom(.5);
      cam.centerOn((fx+3-fy+16)*32+s.map.size*32,(fx+3+fy-16)*16+32);
      return result;
    },types);
    await page.waitForTimeout(900);
    const frames=(await page.evaluate(()=>window.camp.buildings())).frames;
    for(const b of buildings)assert.ok(frames[b.id].startsWith(`building_${b.type}/${b.state}/`),`${b.type} ${b.state}: ${frames[b.id]}`);
    for(const season of ['summer','winter']){
      await page.evaluate(season=>{window.camp.state.tick=season==='summer'?3600:10800},season);
      for(const zoom of [.5,1,2]){
        await page.evaluate(z=>window.camp.scene.cameras.main.setZoom(z),zoom);await page.waitForTimeout(750);
        await canvas.screenshot({path:path.join(out,`camp-${season}-${zoom}x-${width}.png`)});
      }
      // Actual renderer close-ups centre the finished end of each stage row.
      for(const type of ['healers_lodge','scouts_lodge','lancers_lodge','archers_lodge','spirit_lodge']){
        const b=buildings.find(b=>b.type===type&&b.state==='finished');
        await page.evaluate(b=>{
          const c=window.camp,cam=c.scene.cameras.main;cam.setZoom(1);
          cam.centerOn((b.x-b.y)*32+c.state.map.size*32,(b.x+b.y)*16+32-35);
        },b);await page.waitForTimeout(350);
        await canvas.screenshot({path:path.join(out,`${type}-${season}-${width}.png`)});
      }
      const seen=(await page.evaluate(()=>window.camp.buildings())).frames;
      for(const b of buildings)assert.ok(seen[b.id].startsWith(`building_${b.type}/${b.state==='finished'&&season==='winter'?'winter':b.state}/`));
    }
    assert.deepEqual(errors,[]);checks.push({width,buildings,browserErrors:errors});
    await page.close();console.log(`AB10 ${width}: all stages, winter, three zooms passed`);
  }
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');
}catch(error){console.error(error);process.exitCode=1}
finally{await browser?.close();await server.close()}
