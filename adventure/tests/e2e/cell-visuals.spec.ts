import {expect,test} from '@playwright/test';
import {act,idle} from './helpers';

for(const phone of [false,true])for(const quality of ['high','low'] as const){
  test(`cell lighting, wax reach and the perspective cage's door on ${phone?'phone':'desktop'} (${quality})`,{
    tag:['@focused','@art','@story',...(phone?['@phone']:[])],
  },async({page},info)=>{
    const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    if(phone)await page.setViewportSize({width:915,height:412});
    await page.addInitScript(q=>{
      if(!sessionStorage.getItem('cell-visual-fixture')){localStorage.clear();sessionStorage.setItem('cell-visual-fixture','1');}
      localStorage.setItem('cinderfold.settings',JSON.stringify({visualQuality:q,muted:true,textSpeed:'fast',reducedMotion:q==='low'}));
    },quality);
    await page.goto('?debug');
    // "Click anywhere to begin", then the options.
    await page.locator('#title-begin').click();
    await page.getByRole('button',{name:'New game',exact:true}).click();
    await expect(page.locator('#intro-skip')).toBeVisible();
    await page.evaluate(()=>document.getElementById('intro-skip')!.click());
    await page.waitForFunction(()=>(window as any).adventure?.session.scene?.room?.id==='cell');
    await page.evaluate(()=>{
      const s=(window as any).adventure.session,st=structuredClone(s.state);s.showWalkAreas=false;
      st.looks['intro:wake']=1;st.inventory=['hookLine'];st.flags.tookPlate=false;
      s.replaceState(st);
    });await idle(page);
    const visible=(id:string)=>page.evaluate(id=>(window as any).adventure.session.scene.objects.get(id).visible,id);
    await expect.poll(()=>visible('frame')).toBe(false);
    await expect.poll(()=>visible('windowPlate')).toBe(false);
    await expect.poll(()=>visible('floorWax')).toBe(false);
    await page.screenshot({path:info.outputPath(`cell-${quality}-dark.png`)});
    // The real light puzzle reveals the tabletop things, rather than a test-only flag.
    await act(page,'take','plate');
    await act(page,'use','window','plate');
    await expect.poll(()=>visible('frame')).toBe(true);
    await expect.poll(()=>visible('windowPlate')).toBe(true);
    await expect.poll(()=>visible('tableStub')).toBe(true);
    await expect.poll(()=>visible('floorWax')).toBe(true);
    const placement=await page.evaluate(()=>{
      const scene=(window as any).adventure.session.scene,f=scene.objects.get('frame'),w=scene.objects.get('floorWax'),t=scene.objects.get('tableStub');
      return {frame:{x:f.x,y:f.y,w:f.displayWidth,h:f.displayHeight},wax:{x:w.x,y:w.y},stub:{x:t.x,y:t.y},hero:scene.hero.sprite.depth,bars:scene.foreground[0].depth};
    });
    expect(placement).toMatchObject({frame:{x:495,y:278,w:22,h:12},wax:{x:432,y:322},stub:{x:444,y:281}});
    expect(placement.bars).toBeGreaterThan(placement.hero);
    await page.screenshot({path:info.outputPath(`cell-${quality}-lit.png`)});
    // The wax through the cage's right side: Silas comes back after the reach, the drop is gone.
    await act(page,'take','floorWax');
    await expect.poll(()=>visible('floorWax')).toBe(false);
    expect(await page.evaluate(()=>(window as any).adventure.session.scene.hero.sprite.visible)).toBe(true);
    expect(await page.evaluate(()=>(window as any).adventure.session.state.inventory)).toContain('wax');
    await act(page,'use','table','hookLine');
    await expect.poll(()=>visible('frame')).toBe(false);
    expect(await page.evaluate(()=>(window as any).adventure.session.state.inventory)).toContain('frame');
    // Both unlocking routes swap the closed door for the open one in the middle of the front, the
    // cage staying, including after loading a save.
    const tool=quality==='high'?'keys':'nail';
    await page.evaluate(tool=>{
      const s=(window as any).adventure.session,st=structuredClone(s.state);
      st.flags.guardGone=true;st.inventory=[tool];st.hero={x:200,y:320,pose:'stand',face:'down'};
      s.replaceState(st);
    },tool);await idle(page);
    const door=()=>page.evaluate(()=>{
      const scene=(window as any).adventure.session.scene,s=scene.objects.get('cellDoor');
      const target=scene.room.hotspots.find((h:any)=>h.id==='cellDoor');
      return {frame:s.frame.name,visible:s.visible,fixed:scene.foreground[0].visible,left:Math.min(...target.polygon.map((p:any)=>p.x))};
    });
    await expect.poll(door).toMatchObject({frame:'closed',visible:true,fixed:true,left:175});
    await page.screenshot({path:info.outputPath(`cell-door-${tool}-closed.png`)});
    await act(page,'use','cellDoor',tool);
    await expect.poll(door).toMatchObject({frame:'open',visible:true,fixed:true});
    await page.screenshot({path:info.outputPath(`cell-door-${tool}-open.png`)});
    await page.evaluate(()=>(window as any).adventure.session.saveNow());
    await page.reload();
    await expect(page.locator('#title')).toBeVisible();
    await page.locator('#title-begin').click();
    await page.screenshot({path:info.outputPath('door-save-title.png')});
    await page.getByRole('button',{name:'Continue',exact:true}).click({timeout:15000});await idle(page);
    await expect.poll(door).toMatchObject({frame:'open',visible:true,fixed:true});
    // Out through the front door: the cloak, then up the stairs.
    await act(page,'take','cloak');
    await act(page,'go','cellStairs');
    expect(await page.evaluate(()=>(window as any).adventure.session.state.room)).toBe('guardroom');
    expect(errors).toEqual([]);
  });
}
