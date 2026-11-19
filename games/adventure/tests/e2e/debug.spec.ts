import { expect, test } from '@playwright/test';
import { idle, startNewGame } from './helpers';

test('medium armour and every additional base gear type show loaded illustrations when equipped', { tag: ['@focused','@art'] }, async ({ page }, info) => {
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./?debug');await startNewGame(page);
  await page.evaluate(()=>{
    const s=(window as any).adventure.session,st=structuredClone(s.state);
    st.flags={...st.flags,metOren:true,gearUnlocked:true,hasGauntlet:true,dressed:true};
    if(!st.kit.owned.includes('layered-armor'))st.kit.owned.push('layered-armor');
    st.kit.equipment.armor={id:'layered-armor'};s.replaceState(st);
  });await idle(page);
  await page.locator('#gear-btn').click();await expect(page.locator('#gear')).toBeVisible();
  const armor=page.getByRole('button',{name:'armor: Layered Armor',exact:true});
  await expect(armor.locator('.equipment-art img')).toHaveCount(1);
  await armor.click();await expect(page.locator('#gear .preview .equipment-art img')).toHaveCount(1);
  await page.screenshot({path:info.outputPath('medium-armour-gear.png')});
  for(const [slot,name] of [['gauntlet','Heavy Gauntlet'],['gauntlet','Balanced Gauntlet'],['utility','Insulated Kit']]){
    await page.getByRole('button',{name:new RegExp('^'+slot+':')}).click();
    const button=page.locator('#gear .stash-cell[title="'+name+'"]');
    await expect(button.locator('.equipment-art img')).toHaveCount(1);
    await button.click();await page.locator('#armory-equip').click();
    await expect(page.getByRole('button',{name:slot+': '+name,exact:true}).locator('.equipment-art img')).toHaveCount(1);
  }
  for(const img of await page.locator('#gear .equipment-art img').all())await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  expect(errors).toEqual([]);
});

test('every existing room sign uses illustrated art and keeps its name inside the original placement', { tag: ['@focused','@art'] }, async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
  await page.goto('./?debug');await startNewGame(page);
  for(const chapter of ['ch1','ch2']){
    if(chapter==='ch2'){
      await page.evaluate(()=>{const s=(window as any).adventure.session;if(!s.state.reached.includes('ch2'))s.state.reached.push('ch2');});
      await page.keyboard.press(',');await page.locator('#debug-panel select').first().selectOption('ch2');
      await expect.poll(()=>page.evaluate(()=>(window as any).adventure.session.state.chapter)).toBe('ch2');await idle(page);
      await page.evaluate(()=>(document.activeElement as HTMLElement)?.blur());await page.keyboard.press(',');
    }
    const rooms=await page.evaluate(id=>Object.entries((window as any).adventure.chapters[id].rooms).filter(([,room]:any)=>room.sign).map(([key])=>key),chapter);
    for(const room of rooms){
      await page.evaluate(id=>{
        const a=(window as any).adventure,s=a.session,st=structuredClone(s.state),c=a.chapters[st.chapter],r=c.rooms[id];
        st.room=id;st.flags=Object.fromEntries(c.flags.map((f:string)=>[f,true]));delete st.flags.kilnCold;
        st.hero={...Object.values(r.entries)[0] as object,pose:'stand'};s.replaceState(st);
      },room);await idle(page);
      const sign=await page.evaluate(()=>{
        const s=(window as any).adventure.session.scene,image=s.sign.image,def=s.room.sign,key=image.getData('material');
        const source=s.textures.get(key).getSourceImage(),bounds=image.getBounds();
        return {key,label:image.getData('label'),loaded:source.width>0,x:image.x,y:image.y,w:bounds.width,h:bounds.height,expected:def};
      });
      const expected=sign.expected.style==='wood'?'sign-art-wood':sign.expected.h>sign.expected.w*.4?'sign-art-shield':'sign-art-iron';
      expect(sign.key).toBe(expected);expect(sign.loaded).toBe(true);expect(sign.label.length).toBeGreaterThan(2);
      expect(sign.x).toBe(sign.expected.x);expect(sign.y).toBe(sign.expected.y);
      expect(sign.w).toBeGreaterThan(60);expect(sign.h).toBeLessThan(80);
      await page.screenshot({path:info.outputPath(room+'-sign.png')});
    }
  }
  expect(errors).toEqual([]);
});

test('the debug panel jumps to a room and sets flags and items', { tag: ["@focused","@runtime"] }, async ({ page }) => {
  await page.goto('./?debug');
  await startNewGame(page);
  const panel = page.locator('#debug-panel');
  await expect(panel).toBeHidden();
  await page.keyboard.press(',');
  await expect(panel).toBeVisible();
  await page.keyboard.press(',');
  await expect(panel).toBeHidden();
  await page.keyboard.press(',');
  await expect(panel).toBeVisible();

  await panel.locator('select').nth(1).selectOption('firingHouse');
  await idle(page);
  expect(await page.evaluate(() => (window as any).adventure.session.state.room)).toBe('firingHouse');

  // Only the firing house's flags are listed (Oren's are the gallery's), until All flags is ticked.
  await expect(panel.getByRole('heading', { name: /Flags: this room \(firingHouse\)/ })).toBeVisible();
  await expect(panel.getByLabel('nellFed', { exact: true })).toBeVisible();
  await expect(panel.getByLabel('metOren', { exact: true })).toHaveCount(0);
  await panel.getByLabel(/^All flags/).check();
  await expect(panel.getByLabel('metOren', { exact: true })).toBeVisible();
  await panel.getByLabel(/^All flags/).uncheck();
  await panel.getByLabel('alarm', { exact: true }).check();
  await panel.getByLabel('gauntlet', { exact: true }).check();
  await idle(page);
  const state = await page.evaluate(() => (window as any).adventure.session.state);
  expect(state.flags.alarm).toBe(true);
  expect(state.inventory).toContain('gauntlet');
  expect(state.room).toBe('firingHouse');

  await panel.getByRole('button', { name: '+10 salvage' }).click();
  expect(await page.evaluate(() => (window as any).adventure.session.state.bag.salvage)).toBe(10);
});

test('debug medium armour is visible before dressing and survives reload without powering the gauntlet', { tag: ["@focused","@runtime","@art","@saves"] }, async ({ page }) => {
  await page.goto('./?debug');
  await startNewGame(page);
  await page.keyboard.press(',');
  await page.locator('#debug-panel').getByRole('button', { name: 'Gear screen', exact: true }).click();
  await page.locator('#gear').getByRole('button', { name: /^armor:/ }).click();
  await page.locator('#gear .doll-stash button[title="Layered Armor"]').click();
  await page.locator('#armory-equip').click();
  await page.locator('#armory-done').click();
  const appearance = () => page.evaluate(() => (window as any).adventure.session.scene.hero.sprite.texture.key);
  await expect.poll(appearance).toBe('mara-medium');
  const flags = await page.evaluate(() => (window as any).adventure.session.state.flags);
  expect(flags.hasGauntlet).toBeFalsy();
  await page.evaluate(() => (window as any).adventure.session.saveNow());
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await idle(page);
  await expect.poll(appearance).toBe('mara-medium');
  await page.keyboard.press(',');
  await page.locator('#debug-panel').getByLabel('hasGauntlet', { exact: true }).check();
  await idle(page);
  await expect.poll(appearance).toBe('mara-medium-gauntlet');
});

test('the Medium armour debug checkbox dresses Mara and toggles both power variants', { tag: ["@focused","@runtime","@art"] }, async ({ page }) => {
  await page.goto('./?debug');
  await startNewGame(page);
  await page.keyboard.press(',');
  const medium = page.locator('#debug-panel').getByLabel('Medium armour', { exact: true });
  const appearance = () => page.evaluate(() => (window as any).adventure.session.scene.hero.sprite.texture.key);
  await expect(medium).not.toBeChecked();
  await medium.check();
  await idle(page);
  await expect.poll(appearance).toBe('mara-medium');
  expect(await page.evaluate(() => !!(window as any).adventure.session.state.flags.hasGauntlet)).toBe(false);
  await page.evaluate(() => (window as any).adventure.session.saveNow());
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await idle(page);
  await page.keyboard.press(',');
  await expect(medium).toBeChecked();
  await expect.poll(appearance).toBe('mara-medium');
  await page.locator('#debug-panel').getByLabel('hasGauntlet', { exact: true }).check();
  await idle(page);
  await expect.poll(appearance).toBe('mara-medium-gauntlet');
  await medium.uncheck();
  await idle(page);
  await expect.poll(appearance).toBe('mara-gauntlet');
  await medium.check();
  await idle(page);
  await expect.poll(appearance).toBe('mara-medium-gauntlet');
});
