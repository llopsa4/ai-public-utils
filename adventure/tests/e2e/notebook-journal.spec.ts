import { expect, test } from '@playwright/test';
import { idle, open } from './helpers';

test('the title card shows the day, and the notebook has Notes, a Diary and a Map', { tag: ['@focused', '@story'] }, async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.locator('#intro-text p.intro-day')).toHaveText('Day 1 · Morning · Cinderfold', { timeout: 10_000 });
  await page.evaluate(() => document.getElementById('intro-skip')!.click());
  await expect(page.locator('#intro')).toBeHidden({ timeout: 10_000 });
  await idle(page);

  await page.keyboard.press('n');
  await expect(page.locator('#notebook')).toBeVisible();
  await expect(page.locator('#notebook-day')).toHaveText('Day 1 · Morning · Cinderfold');
  await expect(page.locator('#tab-notes')).toHaveAttribute('aria-selected', 'true');

  // The diary: one entry on a new game; it grows with the story.
  await page.locator('#tab-diary').click();
  await expect(page.locator('#diary-panel')).toBeVisible();
  await expect(page.locator('#notes-panel')).toBeHidden();
  await expect(page.locator('.diary-day')).toHaveText(['Day 1']);
  await expect(page.locator('.diary-entry')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    Object.assign(st.flags, { wrenAsked: true, hoistHelped: true, breadAsked: true, nellFed: true });
    s.replaceState(st);
  });
  await idle(page);
  await page.keyboard.press('n');
  await expect(page.locator('.diary-entry')).toHaveCount(3);

  // The map: arrow keys move between tabs; Cinderfold and the Ashways are named, Mara's pin is there.
  await page.locator('#tab-diary').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-map')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.map-name')).toHaveText(['Cinderfold', 'The Ashways']);
  await expect(page.locator('.map-here-label')).toHaveText('Mara is here');
  await expect(page.locator('.world-map')).toHaveAttribute('aria-label', /Mara is at Cinderfold/);
  expect(errors, errors.join('\n')).toEqual([]);
});
