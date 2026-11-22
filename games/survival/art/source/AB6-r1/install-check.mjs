// Verify installed AB6 art through normal renderers; write only ignored test-results.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createServer} from 'vite';


const game=fileURLToPath(new URL('../../../',import.meta.url));
const out=path.join(game,'test-results/ab6-installed');
fs.mkdirSync(out,{recursive:true});
const server=await createServer({configFile:path.join(game,'vite.config.ts'),server:{host:'127.0.0.1',port:5206,strictPort:true}});
let browser;const checks=[];
try{
  await server.listen();browser=await chromium.launch({args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  for(const width of [1280,2560]){
    const page=await browser.newPage({viewport:{width,height:width*9/16}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    console.log(`AB6 checking ${width}`);
    const cdp=await page.context().newCDPSession(page);
    const capture=async name=>{
      if(process.env.AB6_RESUME==='1' && fs.existsSync(path.join(out,name)))return;
      const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
      fs.writeFileSync(path.join(out,name),Buffer.from(data,'base64'));
    };
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?debug`);
    await page.waitForFunction(()=>window.menu?.buttons()['slot1.new']);
    const canvas=page.locator('#game canvas'),box=await canvas.boundingBox();
    const [x,y]=await page.evaluate(()=>window.menu.buttons()['slot1.new']);
    await page.mouse.click(box.x+x*width/1280,box.y+y*width/1280);
    await page.waitForFunction(()=>window.camp?.state.people.length===20);
    const ids=await page.evaluate(()=>{
      const c=window.camp,s=c.state,[fx,fy]=s.map.fire;
      s.paused=true;s.tick=3600;
      // Freeze render time only in this disposable browser session for reproducible captures.
      window.reviewTime=c.scene.time.now;
      const update=c.scene.update.bind(c.scene);c.scene.sys.sceneUpdate=(_,delta)=>update(window.reviewTime,delta);
      s.effects??=[];s.effects.push({id:s.nextEnemyId++,kind:'storm',x:fx+1,y:fy-6,dx:0,dy:0,expires:s.tick+2000,hit:[]});
      s.allies??=[];s.allies.push({id:s.nextEnemyId++,kind:'spirit',x:fx+3,y:fy+1,hp:80,cooldown:0,expires:s.tick+2000});
      const a=s.animals.find(a=>a.kind==='deer'&&!a.dead);
      Object.assign(a,{x:fx+5,y:fy+2,path:[],hp:40,fleeing:0});
      const p=s.people.find(p=>p.age==='adult');
      Object.assign(p,{x:fx+2,y:fy+3,path:[],drafted:false,mounted:false,society:'hunters',job:{kind:'hunt',animal:a.id},cooldown:0});
      const id=s.nextBuildingId++;
      s.buildings.push({id,type:'trap',x:fx+4,y:fy+4,done:false,built:0,delivered:{},workers:[],residents:[],tended:0,hp:null});
      const cam=c.scene.cameras.main;cam.setZoom(1);cam.centerOn((fx-fy)*32+s.map.size*32+130,(fx+fy)*16+32+30);
      return {hunter:p.id,deer:a.id,build:id};
    });
    const advance=async ms=>{await page.evaluate(ms=>{window.reviewTime+=ms},ms);await page.waitForTimeout(90)};
    await page.waitForTimeout(700);
    let cr=await page.evaluate(()=>window.camp.creatures());
    assert.equal(cr.art.ally_spirit,true);assert.equal(cr.art.fx_storm,true);
    assert.match(cr.storms[0],/^fx_storm\/loop\/0\d$/);
    assert.ok(Object.values(cr.allies).some(f=>f.startsWith('ally_spirit/float/')));
    assert.ok((await page.evaluate(()=>window.camp.buildings().flames)).length>0);
    for(const zoom of [.5,1,2]){
      console.log(`AB6 ${width}: capture zoom ${zoom}`);
      await page.evaluate(z=>window.camp.scene.cameras.main.setZoom(z),zoom);await advance(100);
      await capture(`camp-${zoom}x-${width}.png`);
    }
    await page.evaluate(()=>window.camp.scene.cameras.main.setZoom(2));
    await page.evaluate(id=>{window.camp.state.people.find(p=>p.id===id).cooldown=12},ids.hunter);
    await page.waitForTimeout(100);await advance(70);
    cr=await page.evaluate(()=>window.camp.creatures());assert.ok(cr.arrows.includes('fx_arrow'),JSON.stringify(cr.arrows));
    await capture(`hunt-arrow-${width}.png`);
    await advance(250);cr=await page.evaluate(()=>window.camp.creatures());assert.ok(cr.arrows.includes('fx_arrow_stuck'),JSON.stringify(cr.arrows));
    await capture(`hunt-stuck-${width}.png`);
    await page.evaluate(({deer,build})=>{
      const s=window.camp.state,a=s.animals.find(a=>a.id===deer);a.hp-=10;a.fleeing=20;a.x+=.4;s.tick++;
      s.buildings.find(b=>b.id===build).done=true;
    },ids);
    await page.waitForTimeout(100);await advance(100);
    cr=await page.evaluate(()=>window.camp.creatures());
    for(const key of ['hit','dust','sparkle'])assert.ok(cr.fx[key]>0,JSON.stringify(cr.fx));
    await capture(`completion-hit-dust-${width}.png`);
    // Check small effects at all three supported zoom levels, including the install review's 0.5x case.
    for(const zoom of [.5,1,2]){
      console.log(`AB6 ${width}: capture zoom ${zoom}`);
      await page.evaluate(z=>window.camp.scene.cameras.main.setZoom(z),zoom);await page.waitForTimeout(80);
      await capture(`completion-hit-dust-${zoom}x-${width}.png`);
    }
    // The placeholder hearths must not retain their old static flame triangles.
    const pixels=await page.evaluate(()=>{
      const tm=window.camp.scene.textures;
      return ['fire_central','building_fire_pit'].map(key=>{
        const image=tm.get(key).getSourceImage();
        const p=tm.getPixel(image.width/2,image.height*.75-(key==='fire_central'?40:15),key);
        return {key,alpha:p.alpha,r:p.red,g:p.green,b:p.blue};
      });
    });
    assert.equal(pixels[1].alpha,0,JSON.stringify(pixels));
    assert.deepEqual([pixels[0].r,pixels[0].g,pixels[0].b],[154,128,88],JSON.stringify(pixels));
    // Sample actual loop frames across two flame/storm cycles (no extra screenshot wait).
    const loops=new Set();
    for(let i=0;i<16;i++){await advance(100);const f=await page.evaluate(()=>window.camp.creatures().storms[0]);loops.add(f);}
    assert.ok(loops.size>=6,JSON.stringify([...loops]));
    assert.deepEqual(errors,[]);checks.push({width,height:width*9/16,creatures:cr,staticFlamePixels:pixels,browserErrors:errors});
    await page.close();console.log(`AB6 ${width}: fire, spirit, storm, flying/stuck arrows and three one-shots checked.`);
  }
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');
}finally{await browser?.close();await server.close()}
