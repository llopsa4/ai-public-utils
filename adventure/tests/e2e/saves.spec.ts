import { expect, test } from '@playwright/test';
import { act, idle, open, state, startNewGame } from './helpers';

test('progress is autosaved: reload, Continue, and the game resumes where it was', async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  await expect(page.getByRole('button', { name: 'Continue' })).toBeHidden();
  await startNewGame(page);
  await act(page, 'take', 'rack');
  await act(page, 'go', 'tentFlap');
  await idle(page);
  await page.waitForTimeout(800); // autosave runs shortly after the game settles

  await page.reload();
  await expect(page.locator('#title')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await idle(page);
  const s = await state(page);
  expect(s.room).toBe('maraRoom');
  expect(s.flags.hasGauntlet).toBe(true);
  expect(s.inventory).toEqual(['gauntlet']);

  // A damaged slot is ignored with a notice, never loaded.
  // Flush the pending autosave first (it is written 400 ms after a change), so it cannot replace
  // the damaged slot before the reload.
  await page.evaluate(() => { (window as any).adventure.session.saveNow(); localStorage.setItem('cinderfold.autosave', '{broken'); });
  await page.reload();
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeHidden();
  await expect(page.locator('#toast')).toContainText('could not be read');
  expect(errors, errors.join('\n')).toEqual([]);
});
