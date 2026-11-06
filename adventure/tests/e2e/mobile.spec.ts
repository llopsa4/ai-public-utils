import { expect, test } from '@playwright/test';
import { fixtureReady, holdCrowd, idle, open, startNewGame } from './helpers';

test('a phone held upright is asked to turn sideways', { tag: ["@focused","@phone","@art","@runtime"] }, async ({ page }) => {
  await page.goto('?debug');
  await expect(page.locator('#rotate')).toBeVisible();
});

test('touch inventory tap, double-tap and drag use the same item behavior after resizing', { tag: ["@focused","@phone","@input"] }, async ({ page }) => {
  const errors:string[]=[];
  await page.setViewportSize({width:915,height:412});await open(page,errors);await startNewGame(page,true);
  await fixtureReady(page);
  await page.evaluate(()=>{
    const s=(window as any).adventure.session,st=structuredClone(s.state);
    st.room='firingHouse';st.hero={x:330,y:320,face:'right',pose:'stand'};
    st.flags={hasGauntlet:true,dressed:true,breadAsked:true,hoistHelped:true};
    st.inventory=['loaf','notebook'];s.replaceState(st);
  });await idle(page);await holdCrowd(page,2);
  const loaf=page.locator('#inventory [data-item="loaf"]');
  await loaf.tap();await expect.poll(()=>page.evaluate(()=>(window as any).adventure.session.selectedItem)).toBe('loaf');
  await loaf.tap();await expect.poll(()=>page.evaluate(()=>(window as any).adventure.session.selectedItem)).toBeNull();
  const tapBox=(await loaf.boundingBox())!,cdp=await page.context().newCDPSession(page);
  for(let i=0;i<2;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tapBox.x+tapBox.width/2,y:tapBox.y+tapBox.height/2,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(60);
  }
  await expect(page.locator('#radial')).toBeVisible();
  const backdrop=(await page.locator('#stage').boundingBox())!;
  await page.touchscreen.tap(backdrop.x+backdrop.width/2,backdrop.y+10);
  await expect(page.locator('#radial')).toBeHidden();
  await page.setViewportSize({width:844,height:390});
  const source=(await loaf.boundingBox())!,stage=(await page.locator('#stage').boundingBox())!;
  const start={x:source.x+source.width/2,y:source.y+source.height/2};
  const end={x:stage.x+104*stage.width/640,y:stage.y+186*stage.height/360};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
  for(let i=1;i<=12;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/12,y:start.y+(end.y-start.y)*i/12,id:1}]});
    await page.waitForTimeout(16);
  }
  await expect(page.locator('#carried-item')).toBeVisible();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#carried-item')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>{
    const a=(window as any).adventure;a.session.ui.skip();return!!a.session.state.flags.nellFed&&!a.session.scene.isBusy();
  }),{timeout:30000,intervals:[80]}).toBe(true);
  await expect(loaf).toHaveCount(0);expect(errors).toEqual([]);
});

test('on a phone held sideways the game fits, tap targets are large enough and taps work', { tag: ["@focused","@phone","@input","@art"] }, async ({ page }) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 915, height: 412 });
  await open(page, errors);
  await expect(page.locator('#rotate')).toBeHidden();
  await startNewGame(page, true);
  await idle(page);
  for (const id of ['#mute-btn', '#reveal-btn', '#notebook-btn', '#menu-btn']) {
    const box = (await page.locator(id).boundingBox())!;
    expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
  }
  // The stage fits the screen above the bar.
  const stage = (await page.locator('#stage').boundingBox())!;
  expect(stage.width).toBeLessThanOrEqual(915);
  expect(stage.y + stage.height).toBeLessThanOrEqual(412);

  // Tapping a person opens the action ring with large buttons.
  const hero = await page.evaluate(() => {
    const { session } = (window as any).adventure;
    return { x: session.state.hero.x, y: session.state.hero.y - 40 };
  });
  const zoom = stage.width / 640;
  await page.touchscreen.tap(stage.x + hero.x * zoom, stage.y + hero.y * zoom);
  await expect(page.locator('#radial button.verb').first()).toBeVisible();
  // Visibility begins during the 140 ms pop animation; measure the final tap target.
  await page.locator('#radial button.verb').first().evaluate(async button => {
    await Promise.all(button.getAnimations().map(animation => animation.finished));
  });
  const verb = (await page.locator('#radial button.verb').first().boundingBox())!;
  expect(verb.width).toBeGreaterThanOrEqual(44);
  expect(errors, errors.join('\n')).toEqual([]);
});
