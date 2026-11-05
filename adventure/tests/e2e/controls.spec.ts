import { expect, test, type Page } from '@playwright/test';
import { idle, open, startNewGame } from './helpers';
import { conditionsHold, pointInPolygon } from '../../src/engine/geometry';

async function setup(page: Page): Promise<string[]> {
  const errors:string[]=[];await open(page,errors);await startNewGame(page);
  await page.evaluate(()=>{
    const s=(window as any).adventure.session,st=structuredClone(s.state);
    st.room='firingHouse';st.hero={x:330,y:320,face:'right',pose:'stand'};
    st.flags={hasGauntlet:true,dressed:true,breadAsked:true,metNell:true,hoistHelped:true};
    st.inventory=['gauntlet','notebook','loaf','scarf'];s.replaceState(st);
  });await idle(page);return errors;
}
async function point(page:Page,x:number,y:number){
  const box=(await page.locator('#stage').boundingBox())!;
  return{x:box.x+x*box.width/640,y:box.y+y*box.height/360};
}
async function settle(page:Page){
  await expect.poll(()=>page.evaluate(()=>{
    const a=(window as any).adventure;a.session.ui.skip();return!a.session.scene.isBusy();
  }),{timeout:30000,intervals:[80]}).toBe(true);
}
const selected=(page:Page)=>page.evaluate(()=>(window as any).adventure.session.selectedItem);
const position=(page:Page)=>page.evaluate(()=>({...((window as any).adventure.session.scene.hero.position)}));

test('inventory keys, use responses, slot updates and the normal cursor share one use path',async({page})=>{
  const errors=await setup(page);
  await expect(page.locator('#inventory [data-item="loaf"] .item-key')).toHaveText('3');
  await page.mouse.move(500,350);await page.keyboard.press('3');
  expect(await selected(page)).toBe('loaf');await expect(page.locator('#carried-item')).toBeVisible();
  const soup=await point(page,104,186);await page.mouse.click(soup.x,soup.y);
  expect(await selected(page)).toBeNull();await expect(page.locator('#carried-item')).toBeHidden();
  await settle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.flags.nellFed)).toBe(true);
  await expect(page.locator('#inventory [data-item="scarf"] .item-key')).toHaveText('3');
  await page.keyboard.press('1');await page.keyboard.press('3');expect(await selected(page)).toBe('scarf');
  await page.keyboard.press('3');expect(await selected(page)).toBeNull();
  await page.keyboard.press('1');
  const shoes=await point(page,60,60);await page.mouse.click(shoes.x,shoes.y);await settle(page);
  expect(await selected(page)).toBeNull();
  await page.keyboard.press('1');await page.keyboard.press('Escape');expect(await selected(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('single click selects, double click inspects without using a carried item, and Enter retains menus',async({page})=>{
  const errors=await setup(page),notebook=page.locator('#inventory [data-item="notebook"]');
  await notebook.click();await expect.poll(()=>selected(page)).toBe('notebook');
  await notebook.click();await expect.poll(()=>selected(page)).toBeNull();
  await page.keyboard.press('1');await notebook.dblclick({delay:80});
  await expect(page.locator('#radial')).toBeVisible();expect(await selected(page)).toBeNull();
  expect(await page.evaluate(()=>(window as any).adventure.session.scene.isBusy())).toBe(false);
  const first=await page.locator('#radial button.verb:focus').getAttribute('data-verb');
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#radial button.verb:focus').getAttribute('data-verb')).not.toBe(first);
  await page.keyboard.press('Escape');await notebook.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#radial')).toBeVisible();await page.keyboard.press('Escape');
  await page.keyboard.press('1');await notebook.click();await settle(page);
  await expect.poll(()=>selected(page)).toBeNull();
  await page.keyboard.press(',');await page.locator('#debug-panel input').first().focus();
  await page.keyboard.press('1');expect(await selected(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('dragging uses targets once, cancels outside or on its source, and drops on floor walk',async({page})=>{
  const errors=await setup(page);
  async function drag(item:string,to:{x:number;y:number}){
    const box=(await page.locator(`#inventory [data-item="${item}"]`).boundingBox())!;
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
  }
  await drag('loaf',await point(page,104,186));await settle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.flags.nellFed)).toBe(true);
  await expect(page.locator('#inventory [data-item="loaf"]')).toHaveCount(0);
  expect(await selected(page)).toBeNull();
  const notebook=(await page.locator('#inventory [data-item="notebook"]').boundingBox())!;
  await drag('gauntlet',{x:notebook.x+notebook.width/2,y:notebook.y+notebook.height/2});await settle(page);
  expect(await selected(page)).toBeNull();
  const before=await position(page);await drag('gauntlet',{x:1270,y:790});
  expect(await selected(page)).toBeNull();expect(await position(page)).toEqual(before);
  const source=(await page.locator('#inventory [data-item="gauntlet"]').boundingBox())!;
  await page.mouse.move(source.x+20,source.y+20);await page.mouse.down();await page.mouse.move(source.x+40,source.y-30);
  await page.mouse.move(source.x+20,source.y+20);await page.mouse.up();expect(await selected(page)).toBeNull();
  // Keep the children from crossing the drop point halfway through the gesture.
  const floor=await page.evaluate(()=>{
    const s=(window as any).adventure.session.scene;
    for(const m of s.crowd?.members??[])s.crowd.hold(m);
    return {
      candidates:[400,460,520].map(x=>({x,y:340})).filter(p=>s.area.contains(p)
        &&![...s.actors.values()].some((a:any)=>a.hitBox().contains(p.x,p.y))&&!s.crowd?.hit(p)),
      hotspots:s.room.hotspots,state:s.session.state,
    };
  });
  try {
    const drop=floor.candidates.find(p=>floor.hotspots.every((h:any)=>
      !conditionsHold(floor.state,h.visibleIf)||!pointInPolygon(p,h.polygon)));
    expect(drop,'an unoccupied floor point is available').toBeDefined();
    await drag('gauntlet',await point(page,drop!.x,drop!.y));
    await expect.poll(async()=>Math.hypot((await position(page)).x-drop!.x,(await position(page)).y-drop!.y),{timeout:10000}).toBeLessThan(2);
  } finally {
    await page.evaluate(()=>{
      const crowd=(window as any).adventure.session.scene.crowd;
      for(const m of crowd?.members??[])crowd.release(m);
    });
  }
  expect(await selected(page)).toBeNull();expect(errors).toEqual([]);
});

test('arrow walking stops on release, respects bounds, modal/script priority and save reload',async({page})=>{
  const errors=await setup(page);const from=await position(page);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
  const after=await position(page);expect(after.x).toBeGreaterThan(from.x+15);
  await page.waitForTimeout(200);expect(await position(page)).toEqual(after);
  await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);
  await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(()=>{const s=(window as any).adventure.session.scene;return s.area.contains(s.hero.position);})).toBe(true);
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(120);await page.getByRole('button',{name:'Menu',exact:true}).click();
  const paused=await position(page);await page.waitForTimeout(200);expect(await position(page)).toEqual(paused);
  await page.keyboard.up('ArrowLeft');await page.locator('#menu-close').click();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  const blurred=await position(page);await page.waitForTimeout(150);expect(await position(page)).toEqual(blurred);await page.keyboard.up('ArrowRight');
  await page.evaluate(()=>{const s=(window as any).adventure.session;void s.scene.runScript([{type:'wait',ms:500}]);});
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(650);expect(await position(page)).toEqual(blurred);await page.keyboard.up('ArrowLeft');await settle(page);
  await page.waitForTimeout(700);const saved=await page.evaluate(()=>(window as any).adventure.session.state.hero);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await idle(page);
  expect(await position(page)).toEqual({x:saved.x,y:saved.y});expect(errors).toEqual([]);
});

test('mouse and arrows replace free movement, while room edges never trigger exits',async({page})=>{
  const errors=await setup(page);
  const to=await point(page,530,325);await page.mouse.click(to.x,to.y);await page.waitForTimeout(120);
  const before=await position(page);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');
  expect((await position(page)).x).toBeLessThan(before.x-10);
  expect(await page.evaluate(()=>(window as any).adventure.session.scene.hero.face)).toBe('left');
  await page.keyboard.down('ArrowRight');
  const floor=await point(page,420,325);await page.mouse.click(floor.x,floor.y);
  await expect.poll(async()=>Math.abs((await position(page)).x-420),{timeout:10000}).toBeLessThan(1);
  await page.waitForTimeout(250);expect(Math.abs((await position(page)).x-420)).toBeLessThan(1);await page.keyboard.up('ArrowRight');
  await page.evaluate(()=>{const s=(window as any).adventure.session,st=structuredClone(s.state);st.hero={x:625,y:325,face:'right',pose:'stand'};s.replaceState(st);});await idle(page);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');
  expect((await position(page)).x).toBeLessThanOrEqual(640.75);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.room)).toBe('firingHouse');
  expect(errors).toEqual([]);
});

test('Mara blends walk starts and stops and clears the blend for a pose change',async({page})=>{
  const errors=await setup(page);
  const start=await page.evaluate(()=>{
    const h=(window as any).adventure.session.scene.hero,p=h.position;
    h.manualStep({x:p.x+1,y:p.y});
    return {blend:!!h.walkBlend?.active,alpha:h.sprite.alpha};
  });
  expect(start.blend).toBe(true);expect(start.alpha).toBe(0);
  await expect.poll(()=>page.evaluate(()=>{const h=(window as any).adventure.session.scene.hero;return !h.walkBlend&&h.sprite.alpha===1;})).toBe(true);
  const stop=await page.evaluate(()=>{
    const h=(window as any).adventure.session.scene.hero,p=h.position;h.stopManual();
    return {blend:!!h.walkBlend?.active,still:JSON.stringify(p)===JSON.stringify(h.position)};
  });
  expect(stop.blend).toBe(true);expect(stop.still).toBe(true);
  await expect.poll(()=>page.evaluate(()=>{const h=(window as any).adventure.session.scene.hero;return !h.walkBlend&&h.sprite.alpha===1;})).toBe(true);
  expect(await page.evaluate(()=>{
    const h=(window as any).adventure.session.scene.hero,s=(window as any).adventure.session.scene;
    return h.sprite.frame.name===s.anims.get(`${h.sheet}:stand_side`).frames[0].frame.name;
  })).toBe(true);
  expect(await page.evaluate(()=>{
    const h=(window as any).adventure.session.scene.hero,p=h.position;h.manualStep({x:p.x+1,y:p.y});h.stopManual();h.setPose('crouch');
    return !h.walkBlend&&h.sprite.alpha===1;
  })).toBe(true);
  expect(errors).toEqual([]);
});
