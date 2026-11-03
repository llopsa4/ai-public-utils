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
    return page.locator('#kc-root .combat-screen').isVisible();
  }, { timeout: 120_000, intervals: [300] }).toBe(true);
}

/** The enemy's health as Kiln Courier's battle screen shows it. */
const enemyHp = async (page: Page) => Number((await page.locator('#kc-root .enemy-status').textContent())?.match(/(\d+)\s*\/\s*30/)?.[1]);

test('the first fight is Kiln Courier\'s lesson: only the outlined control works; a reload starts it again; winning pays out once', async ({ page }) => {
  const errors: string[] = [];
  await readyToRelease(page, errors);
  await releaseIntoFight(page);
  await expect(page.locator('#kc-root .lesson-banner')).toContainText('1/19');
  // Only the lesson's control works: the cards wait.
  await expect(page.locator('#kc-root button.card').first()).toBeDisabled();
  for (let i = 0; i < 4; i++) await fightStep(page); // intent, close, Knuckle Drive, Ceramic Guard
  await expect.poll(() => enemyHp(page)).toBeLessThan(30);

  // Reload: Continue brings back the gallery after the release, and the lesson starts over.
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#kc-root .combat-screen').isVisible();
  }, { timeout: 120_000, intervals: [300] }).toBe(true);
  await expect(page.locator('#kc-root .lesson-banner')).toContainText('1/19');
  expect(await enemyHp(page)).toBe(30);

  // Follow the lesson to the end. The win shows Cinderfold's victory screen with what the fight
  // paid, its Continue focused.
  let sawRewards = false;
  for (let i = 0; i < 200 && !(await page.locator('#force-veil').count()); i++) {
    if (!sawRewards && await page.locator('#kc-root .kc-victory').isVisible().catch(() => false)) {
      await expect(page.locator('#kc-root .kc-victory-title')).toHaveText('Victory');
      await expect(page.locator('#kc-root .kc-loot')).toContainText('+12');
      await expect(page.locator('#kc-root .kc-loot')).toContainText(/pressure coil/i);
      await expect(page.locator('#kc-victory-continue')).toBeFocused();
      await expect(page.locator('#kc-root dialog[open]')).toHaveCount(0);
      sawRewards = true;
    }
    if (await page.locator('#kc-root .combat-screen').isVisible().catch(() => false)) await fightStep(page);
    else { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(250); }
  }

  // Oren's advice: everything is dimmed but the Gear button, which has to be pressed.
  await expect(page.locator('#force-veil')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#force-veil')).toBeVisible();
  await page.locator('#gear-btn').click();
  await expect(page.locator('#gear .kc-armory')).toBeVisible({ timeout: 30_000 });
  // The equipment is shown with its pictures (not the fallback icons).
  await expect(page.locator('#gear .kc-armory .equipment-art img').first()).toBeVisible();
  expect(await page.locator('#gear .kc-armory .equipment-art img').evaluateAll(imgs => imgs.every(i => (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.locator('#gear .gear-tile', { hasText: 'Light Armor' }).click();
  await page.locator('#armory-equip').click();
  await page.locator('#armory-done').click();
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.evaluate(() => !(window as any).adventure.session.scene.isBusy());
  }, { timeout: 60_000, intervals: [300] }).toBe(true);
  const state = await page.evaluate(() => (window as any).adventure.session.state);
  expect(state.flags.fought && state.flags.gearChecked).toBe(true);
  expect(state.kit.equipment.armor.id).toBe('light-armor');
  expect(state.bag.salvage).toBe(12);
  expect(state.bag.materials).toEqual({ 'pressure-coil': 1 });
  expect(sawRewards).toBe(true);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('Skip tutorial turns the lesson into a free fight on the same screen', async ({ page }) => {
  const errors: string[] = [];
  await readyToRelease(page, errors);
  await releaseIntoFight(page);
  await page.locator('#kc-root .lesson-banner button', { hasText: 'Skip tutorial' }).click();
  await expect(page.locator('#kc-root .lesson-banner')).toHaveCount(0);
  await expect(page.locator('#kc-root button.card:not(:disabled)').first()).toBeVisible();
  for (let i = 0; i < 300 && await page.locator('#kc-root .combat-screen').isVisible().catch(() => false); i++) await fightStep(page);
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.state.flags.fought), { timeout: 60_000 }).toBe(true);
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
