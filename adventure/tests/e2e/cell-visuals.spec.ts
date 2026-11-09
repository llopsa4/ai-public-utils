import {expect,test} from '@playwright/test';
import {act,idle} from './helpers';

for(const phone of [false,true])for(const quality of ['high','low'] as const){
  test(`cell lighting, puzzle props and smaller opening door on ${phone?'phone':'desktop'} (${quality})`,{
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
    await page.screenshot({path:info.outputPath(`cell-${quality}-dark.png`)});
    // The real light puzzle reveals the new tabletop object, rather than a test-only flag.
    await act(page,'take','plate');
    await act(page,'use','window','plate');
    await expect.poll(()=>visible('frame')).toBe(true);
    await expect.poll(()=>visible('windowPlate')).toBe(true);
    const placement=await page.evaluate(()=>{
      const scene=(window as any).adventure.session.scene,f=scene.objects.get('frame');
      return {x:f.x,y:f.y,w:f.displayWidth,h:f.displayHeight,hero:scene.hero.sprite.depth,bars:scene.foreground[0].depth};
    });
    expect(placement).toMatchObject({x:495,y:278,w:22,h:12});
    expect(placement.bars).toBeGreaterThan(placement.hero);
    await page.screenshot({path:info.outputPath(`cell-${quality}-lit.png`)});
    await act(page,'use','table','hookLine');
    await expect.poll(()=>visible('frame')).toBe(false);
    expect(await page.evaluate(()=>(window as any).adventure.session.state.inventory)).toContain('frame');
    // Both unlocking routes must replace the closed gate with visible open artwork,
    // while the upper bars and jambs remain, including after loading a save.
    const tool=quality==='high'?'keys':'nail';
    await page.evaluate(tool=>{
      const s=(window as any).adventure.session,st=structuredClone(s.state);
      st.flags.guardGone=true;st.inventory=[tool];st.hero={x:340,y:300,pose:'stand',face:'right'};
      s.replaceState(st);
    },tool);await idle(page);
    const door=()=>page.evaluate(()=>{
      const scene=(window as any).adventure.session.scene,s=scene.objects.get('cellDoor');
      const target=scene.room.hotspots.find((h:any)=>h.id==='cellDoor');
      return {frame:s.frame.name,visible:s.visible,fixed:scene.foreground[1].visible,top:Math.min(...target.polygon.map((p:any)=>p.y))};
    });
    await expect.poll(door).toMatchObject({frame:'closed',visible:true,fixed:true,top:162});
    await page.screenshot({path:info.outputPath(`cell-door-${tool}-closed.png`)});
    await act(page,'use','cellDoor',tool);
    await expect.poll(door).toMatchObject({frame:'open',visible:true,fixed:true});
    await page.screenshot({path:info.outputPath(`cell-door-${tool}-open.png`)});
    await page.evaluate(()=>(window as any).adventure.session.saveNow());
    await page.reload();
    await expect(page.locator('#title')).toBeVisible();
    await page.screenshot({path:info.outputPath('door-save-title.png')});
    await page.getByRole('button',{name:'Continue',exact:true}).click({timeout:15000});await idle(page);
    await expect.poll(door).toMatchObject({frame:'open',visible:true,fixed:true});
    await act(page,'go','cellDoor');
    expect(await page.evaluate(()=>(window as any).adventure.session.state.room)).toBe('guardroom');
    expect(errors).toEqual([]);
  });
}
