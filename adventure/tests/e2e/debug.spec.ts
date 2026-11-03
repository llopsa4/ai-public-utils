import { expect, test } from '@playwright/test';
import { idle, startNewGame } from './helpers';

test('the debug panel jumps to a room and sets flags and items', async ({ page }) => {
  await page.goto('./?debug');
  await startNewGame(page);
  const panel = page.locator('#debug-panel');
  await expect(panel).toBeHidden();
  await page.keyboard.press('`');
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
