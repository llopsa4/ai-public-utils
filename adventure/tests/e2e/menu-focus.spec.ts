import { expect, test } from '@playwright/test';
import { open, startNewGame } from './helpers';

test('refresh with a save leaves Continue unhighlighted until keyboard or pointer selection', { tag: ['@focused', '@input', '@art', '@saves'] }, async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  await startNewGame(page);
  await expect(page.locator('#intro')).toBeHidden();
  await page.evaluate(() => (window as any).adventure.session.saveNow());
  await page.mouse.move(0, 0);
  await page.reload();
  const cont = page.locator('#title-continue');
  await expect(cont).toBeVisible();
  const opacity = () => cont.evaluate(button => getComputedStyle(button, '::before').opacity);
  await expect.poll(opacity).toBe('0');
  await expect(cont).not.toBeFocused();
  expect(await page.locator('#title-name').evaluate(heading => getComputedStyle(heading).outlineStyle)).toBe('none');
  await page.keyboard.press('Tab');
  await expect(cont).toBeFocused();
  await expect.poll(opacity).toBe('1');
  await page.keyboard.press('Tab');
  await expect(page.locator('#title-new')).toBeFocused();
  await expect.poll(opacity).toBe('0');
  await cont.hover();
  await expect.poll(opacity).toBe('1');
  await cont.click();
  await expect(page.locator('#title')).toBeHidden();
  expect(errors).toEqual([]);
});
