import { expect, test, type Page } from '@playwright/test';
import { fightStep, idle, open, startNewGame } from './helpers';

/** A game in the regulator gallery, ready for the release (everything before it done). */
async function readyToRelease(page: Page, errors: string[]): Promise<void> {
  await open(page, errors);
  await startNewGame(page);
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    st.room = 'gallery';
    st.hero = { x: 404, y: 290, face: 'left', pose: 'stand' };
    st.flags = { hasGauntlet: true, hasNotebook: true, latchFixed: true, alarm: true, metOren: true, patchFailed: true, decided: true, procedureKnown: true };
    st.inventory = ['gauntlet', 'notebook'];
    s.replaceState(st);
  });
  await idle(page);
}

/** Runs the release and skips lines until the fight is on screen. */
async function releaseIntoFight(page: Page): Promise<void> {
  await page.evaluate(() => { const { session, interact } = (window as any).adventure; void session.scene.runScript(interact(session.state, 'use', 'regulator', 'gauntlet')); });
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#battle').isVisible();
  }, { timeout: 120_000, intervals: [300] }).toBe(true);
}

const battleState = (page: Page) => page.evaluate(() => {
  const b = (window as any).adventure.game.scene.getScene('battle').battle;
  return { hero: b.hero.hp, enemy: b.enemy.hp, turn: b.turn, outcome: b.outcome };
});

test('a reload in the middle of the fight starts the fight again; winning it pays out once', async ({ page }) => {
  const errors: string[] = [];
  await readyToRelease(page, errors);
  await releaseIntoFight(page);
  await expect(page.locator('.battle-guide')).toBeVisible();
  await page.locator('.battle-card.asked').click();
  await expect.poll(async () => (await battleState(page)).enemy).toBeLessThan(26);

  // Reload: Continue brings back the gallery after the release, and the fight starts over.
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#battle').isVisible();
  }, { timeout: 120_000, intervals: [300] }).toBe(true);
  expect((await battleState(page)).enemy).toBe(26);

  // Win it (the guide, then any playable card) and Continue.
  for (let i = 0; i < 300 && await page.locator('#battle').isVisible(); i++) await fightStep(page);
  await expect(page.locator('#battle')).toBeHidden();

  // Oren's advice opens the gear menu: put on his light coat.
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#gear[open]').count();
  }, { timeout: 60_000, intervals: [300] }).toBe(1);
  await page.locator('#gear label', { hasText: 'Light Armor' }).click();
  await expect(page.locator('#gear-stats')).toContainText('Defense');
  await page.locator('#gear .dialog-close').click();
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.evaluate(() => !(window as any).adventure.session.scene.isBusy());
  }, { timeout: 60_000, intervals: [300] }).toBe(true);
  await expect(page.locator('#gear-btn')).toBeVisible();
  const state = await page.evaluate(() => (window as any).adventure.session.state);
  expect(state.kit.equipment.armor.id).toBe('light-armor');
  expect(state.flags.gearChecked).toBe(true);
  expect(state.flags.fought).toBe(true);
  expect(state.bag.salvage).toBe(12);
  expect(state.bag.materials).toEqual({ 'pressure-coil': 1 });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('falling in the fight is not a game over: it starts again with a hint', async ({ page }) => {
  const errors: string[] = [];
  await readyToRelease(page, errors);
  await releaseIntoFight(page);
  await page.locator('.battle-guide .ink-btn').click(); // skip the guide
  await page.evaluate(() => { (window as any).adventure.game.scene.getScene('battle').battle.hero.hp = 1; });
  await page.locator('#battle-end').click();
  await expect(page.locator('.battle-banner', { hasText: 'Again' })).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await battleState(page)).enemy, { timeout: 30_000 }).toBe(26);
  const after = await battleState(page);
  expect(after.outcome).toBeNull();
  expect(after.hero).toBeGreaterThanOrEqual(36);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the peddler in the ashways sells tonics for salvage, and a tonic heals in a fight', async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  await startNewGame(page);
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    st.room = 'ashways';
    st.hero = { x: 300, y: 300, face: 'left', pose: 'stand' };
    st.flags = { hasGauntlet: true, hasNotebook: true, latchFixed: true, alarm: true, kilnCold: true, fought: true, gearChecked: true };
    st.inventory = ['gauntlet', 'notebook', 'regulator'];
    st.bag = { salvage: 12, materials: { 'pressure-coil': 1 }, tonics: 0 };
    s.replaceState(st);
  });
  await idle(page);
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.scene.crowd?.visible().length ?? 0), { timeout: 15_000 }).toBe(1);
  // Click the peddler, then Talk: his line, then his stall.
  const at = await page.evaluate(() => {
    const crowd = (window as any).adventure.session.scene.crowd;
    const m = crowd.visible()[0];
    crowd.hold(m);
    const b = m.actor.hitBox();
    return { x: b.centerX, y: b.centerY };
  });
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: (at.x / 640) * box.width, y: (at.y / 360) * box.height } });
  await page.locator('.verb[data-verb="talk"]').click();
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#shop[open]').count();
  }, { timeout: 60_000, intervals: [300] }).toBe(1);
  await page.locator('#shop-buy').click();
  await page.locator('#shop-buy').click();
  await expect(page.locator('#shop-buy')).toBeDisabled(); // 2 salvage left
  await expect(page.locator('.shop-note')).toContainText('Not enough salvage');
  await page.locator('#shop .dialog-close').click();
  const bag = await page.evaluate(() => (window as any).adventure.session.state.bag);
  expect(bag).toEqual({ salvage: 2, materials: { 'pressure-coil': 1 }, tonics: 2 });
  expect(errors, errors.join('\n')).toEqual([]);
});
