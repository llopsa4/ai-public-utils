import {expect,test,type Page} from '@playwright/test';
import {fixtureReady,idle,open,startNewGame,fightStep} from './helpers';
test.use({video:'on'});

async function prepare(page:Page,room='gallery',hp=60):Promise<string[]>{
  const errors:string[]=[];
  page.on('console',m=>{if(/missing animation|animation.*not found/i.test(m.text()))errors.push(m.text());});
  await open(page,errors);await startNewGame(page);await fixtureReady(page);
  await page.evaluate(({room,hp})=>{
    const a=(window as any).adventure,s=structuredClone(a.session.state);
    s.room=room;s.hero={x:room==='gallery'?436:480,y:302,face:'left',pose:'stand'};
    s.flags={hasGauntlet:true,hasNotebook:true,dressed:true,hoistHelped:true,nellFed:true,latchFixed:true,alarm:true,
      patchFailed:true,decided:true,procedureKnown:true,gearUnlocked:true,protectionPrepared:true,
      ...(room==='ashways'?{kilnCold:true,fought:true,gearChecked:true,galleryQuiet:true,valveVented:true}:{})};
    s.inventory=room==='ashways'?['gauntlet','notebook','regulator']:['gauntlet','notebook'];
    s.kit.hp=hp;s.kit.mp=0;s.bag.tonics=0;
    s.kit.owned.push('layered-armor');s.kit.equipment.armor={id:'layered-armor'};
    a.session.replaceState(s);
  },{room,hp});await idle(page);return errors;
}
async function start(page:Page,target:string,item?:string){
  await page.evaluate(({target,item})=>{const a=(window as any).adventure;void a.session.scene.runScript(a.interact(a.session.state,item?'use':'go',target,item));},{target,item});
}
async function reachBattle(page:Page){
  await expect.poll(async()=>{await page.evaluate(()=>(window as any).adventure.session.ui.skip());return page.locator('#kc-root .combat-screen').isVisible();},{timeout:35000,intervals:[80]}).toBe(true);
}

test('regulator controls reject unsafe actions, preserve progress on Escape/reload and release only after completion',
  {tag:['@focused','@story','@input','@saves','@art']},async({page},info)=>{
  const errors=await prepare(page);await start(page,'regulator','gauntlet');
  const panel=page.locator('#regulator-puzzle');await expect(panel).toBeVisible();
  await panel.locator('[data-action="vent"]').click();await expect(panel.locator('[role="status"]')).toContainText('outer bolts');
  await panel.locator('[data-action="right"]').click();
  await page.keyboard.press('Escape');await idle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.flags.kilnCold)).toBeFalsy();
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await idle(page);
  await start(page,'regulator','gauntlet');await expect(panel).toBeVisible();
  await expect(panel.locator('[data-action="right"]')).toHaveAttribute('aria-pressed','true');
  await expect(panel.locator('[data-action="left"]')).toBeFocused();await page.keyboard.press('Enter');
  await panel.locator('[data-action="ring"]').click();await expect(panel.locator('[role="status"]')).toContainText('Bleed');
  await panel.getByRole('button',{name:'Mum’s procedure'}).click();await expect(panel.locator('#regulator-reference')).toContainText('Outer bolts');
  await panel.getByRole('button',{name:'Hint',exact:true}).click();await panel.getByRole('button',{name:'Hint',exact:true}).click();
  await expect(panel.locator('#regulator-reference')).toContainText('red bleed');
  await panel.locator('[data-action="vent"]').click();
  await expect(panel.locator('.pressure-dial')).toHaveAttribute('aria-label',/safe; needle inside/);
  const hero=await page.evaluate(()=>(window as any).adventure.session.state.hero.x);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('n');
  expect(await page.evaluate(()=>(window as any).adventure.session.state.hero.x)).toBe(hero);
  await expect(page.locator('#notebook')).not.toBeVisible();
  await page.screenshot({path:info.outputPath('regulator-closeup.png')});
  await panel.locator('[data-action="ring"]').click();await panel.getByRole('button',{name:'Lift out regulator'}).click();
  await reachBattle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.flags.kilnCold)).toBe(true);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.inventory.filter((i:string)=>i==='regulator').length)).toBe(1);
  expect(errors).toEqual([]);
});

test('Ashways departure ruptures the cell, uses the correct boss arena and restores only defeat retries across reload',
  {tag:['@focused','@story','@runtime','@saves','@art']},async({page},info)=>{
  const errors=await prepare(page,'ashways',1);
  await page.evaluate(()=>(window as any).adventure.session.state.bag.tonics=1);
  await start(page,'passage');await reachBattle(page);
  await expect(page.locator('.enemy-status h2')).toHaveText('Berserk Ash Sweeper');
  await expect(page.locator('.battlefield')).toHaveAttribute('data-machine','sweeper');
  await expect(page.locator('#enemy-art')).toHaveAttribute('src',/ash-sweeper/);
  expect(await page.locator('#hero-health-fill').evaluate(e=>Number(e.parentElement!.getAttribute('aria-valuenow')))).toBe(1);
  const flags=await page.evaluate(()=>(window as any).adventure.session.state.flags);
  expect(flags.ashwaysExploded&&flags.ashwaysConfronted).toBe(true);
  await page.screenshot({path:info.outputPath('ashways-boss.png')});
  await page.locator('#kc-tonic').click();
  expect(await page.evaluate(()=>(window as any).adventure.session.state.bag.tonics)).toBe(0);
  for(let turn=0;turn<6;turn++){
    if(await page.evaluate(()=>(window as any).adventure.session.state.flags.ashwaysRetry))break;
    await expect(page.locator('#end-turn')).toBeEnabled();await page.locator('#end-turn').click();
    await expect.poll(async()=>await page.locator('#end-turn').isEnabled()||await page.evaluate(()=>(window as any).adventure.session.state.flags.ashwaysRetry)).toBeTruthy();
  }
  await expect.poll(()=>page.evaluate(()=>(window as any).adventure.session.state.flags.ashwaysRetry)).toBe(true);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await reachBattle(page);
  const health=await page.locator('#hero-health-fill').evaluate(e=>({now:Number(e.parentElement!.getAttribute('aria-valuenow')),max:Number(e.parentElement!.getAttribute('aria-valuemax'))}));
  expect(health.now).toBe(health.max);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.bag.tonics)).toBe(0);
  expect(await page.evaluate(()=>(window as any).adventure.session.ui.history.some((h:any)=>h.text.includes('cannot get up')))).toBe(false);
  expect(errors).toEqual([]);
});

test('reloading immediately after the explosion retains a valid checkpoint and skips Corvin salvage',
  {tag:['@focused','@story','@saves','@runtime']},async({page})=>{
  const errors=await prepare(page,'ashways');await start(page,'passage');
  await expect.poll(async()=>{await page.evaluate(()=>(window as any).adventure.session.ui.skip());return page.evaluate(()=>(window as any).adventure.session.state.flags.ashwaysExploded);},{timeout:25000,intervals:[25]}).toBe(true);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cinderfold.autosave')!).state);
  expect(saved.hero.x).toBeLessThanOrEqual(640);expect(saved.hero.x).toBeGreaterThanOrEqual(0);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await reachBattle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.ui.history.some((h:any)=>h.text.includes('Good brass')))).toBe(false);
  expect(errors).toEqual([]);
});

test('boss victory pays once, leaves Corvin injured and continues into chapter two without replaying the explosion',
  {tag:['@focused','@story','@runtime','@saves']},async({page})=>{
  const errors=await prepare(page,'ashways');
  await page.evaluate(()=>{
    const a=(window as any).adventure,s=structuredClone(a.session.state);
    s.flags.ashwaysStarted=true;s.flags.ashwaysExploded=true;s.flags.ashwaysConfronted=true;
    a.session.replaceState(s);
  });
  await reachBattle(page);
  await expect.poll(async()=>{
    await page.evaluate(()=>{(window as any).adventure.session.ui.skip();document.querySelector<HTMLButtonElement>('#intro:not([hidden]) #intro-skip')?.click();});
    if(await page.locator('#kc-root .combat-screen').isVisible())await fightStep(page);
    return page.evaluate(()=>(window as any).adventure.session.state.chapter);
  },{timeout:90000,intervals:[100]}).toBe('ch2');
  await idle(page);
  const state=await page.evaluate(()=>(window as any).adventure.session.state);
  expect(state.chapter).toBe('ch2');expect(state.bag.salvage).toBe(8);
  expect(state.earlier.ch1.ashwaysWon&&state.earlier.ch1.ashwaysRewarded&&state.earlier.ch1.ashwaysAftermath).toBe(true);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await idle(page);
  expect(await page.evaluate(()=>(window as any).adventure.session.state.bag.salvage)).toBe(8);
  expect(errors).toEqual([]);
});

test('landscape phone regulator controls fit, remain touch sized and respect reduced motion',
  {tag:['@focused','@phone','@input','@art','@story']},async({page},info)=>{
  await page.setViewportSize({width:915,height:412});const errors=await prepare(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{localStorage.setItem('cinderfold.settings',JSON.stringify({...JSON.parse(localStorage.getItem('cinderfold.settings')??'{}'),reducedMotion:true}));(window as any).adventure.session.saveNow();});
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await idle(page);
  await start(page,'regulator','gauntlet');await expect(page.locator('#regulator-puzzle')).toBeVisible();
  await expect(page.locator('#regulator-puzzle')).toHaveClass(/calm/);
  for(const button of await page.locator('#regulator-puzzle [data-action]').all()){
    const box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(915);
  }
  await page.locator('#regulator-puzzle [data-action="left"]').tap();
  await page.locator('#regulator-puzzle [data-action="right"]').tap();
  await page.locator('#regulator-puzzle [data-action="vent"]').tap();
  await page.screenshot({path:info.outputPath('regulator-phone.png')});
  await page.locator('#regulator-close').tap();await idle(page);
  expect(errors).toEqual([]);
});
