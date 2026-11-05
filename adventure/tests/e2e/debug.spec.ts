import { expect, test } from '@playwright/test';
import { idle, startNewGame } from './helpers';

test('the debug panel jumps to a room and sets flags and items', async ({ page }) => {
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

test('debug medium armour is visible before dressing and survives reload without powering the gauntlet', async ({ page }) => {
  await page.goto('./?debug');
  await startNewGame(page);
  await page.keyboard.press(',');
  await page.locator('#debug-panel').getByRole('button', { name: 'Gear screen', exact: true }).click();
  await page.locator('#gear').getByRole('button', { name: /^armor:/ }).click();
  await page.locator('#gear .doll-stash').getByRole('button', { name: 'Layered Armor', exact: true }).click();
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

test('the Medium armour debug checkbox dresses Mara and toggles both power variants', async ({ page }) => {
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
