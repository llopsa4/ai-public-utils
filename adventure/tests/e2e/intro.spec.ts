import { expect, test, type Page } from '@playwright/test';
import { act, idle, open, state } from './helpers';

const shot = (page: Page, name: string) => process.env.INTRO_SHOTS ? page.screenshot({ path: `${process.env.INTRO_SHOTS}/${name}.png` }) : Promise.resolve();
const hero = (page: Page) => page.evaluate(() => {
  const { session } = (window as any).adventure;
  return { sheet: session.scene.hero.sheet ?? session.scene.hero.sprite.texture.key };
});

test("New game: Silas's intro, from the dark cell through two disguises to Sigrid and the chapter map", { tag: ['@focused', '@story'] }, async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  await open(page, errors);
  // New game opens with the intro's title over black, then Silas's cell.
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.locator('#intro-text .intro-title')).toHaveText('The Man With Many Faces', { timeout: 30_000 });
  await page.evaluate(() => document.getElementById('intro-skip')!.click());
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.state.chapter), { timeout: 30_000 }).toBe('intro');
  await idle(page);
  // The debug menu still offers it first.
  await page.keyboard.press(',');
  await expect(page.locator('#debug-panel select').first().locator('option').first()).toHaveText('Intro: Silas');
  await page.keyboard.press(',');
  const fresh = await state(page);
  expect(fresh.room).toBe('cell');
  expect(fresh.inventory).toEqual([]);
  await page.waitForTimeout(800);
  await shot(page, '1-dark');

  // Light: the tin plate throws the moonlight across the cell.
  await act(page, 'take', 'plate');
  await act(page, 'use', 'window', 'plate');
  await page.waitForTimeout(2200);
  await shot(page, '2-lit');
  // The frame, fished off the guard's table; Harrow's face from the roster.
  await act(page, 'take', 'cot');
  await act(page, 'take', 'cot');
  await act(page, 'use', 'item:nail', 'strip');
  await act(page, 'use', 'table', 'hookLine');
  await act(page, 'look', 'roster');
  await act(page, 'take', 'wall');
  await act(page, 'use', 'bucket', 'plaster');
  await act(page, 'use', 'item:wetPlaster', 'crust');
  await act(page, 'use', 'item:frame', 'putty');
  await act(page, 'use', 'hero', 'maskHarrow');
  expect((await state(page)).flags.wearingHarrow).toBe(true);
  await expect.poll(() => hero(page).then(h => h.sheet)).toBe('silas-harrow');
  // The ring offers Read on the guard.
  await act(page, 'read', 'guard');
  // The marked (read-based) choices, as Sergeant Harrow; the eye watches.
  await idle(page);
  await page.evaluate(() => { const { session, interact } = (window as any).adventure; void session.scene.runScript(interact(session.state, 'talk', 'guard')); });
  const choices = page.locator('#choices');
  for (let i = 0; i < 100 && !(await choices.isVisible()); i++) { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(80); }
  await expect(choices.locator('.choice-read')).toHaveCount(1);
  await expect(page.locator('#suspicion')).toBeVisible();
  await shot(page, '3-harrow-choices');
  for (const text of [/locked it behind me/, /up to the captain/, /warm yourself/, /lift the key ring/]) {
    for (let i = 0; i < 100 && !(await choices.isVisible()); i++) { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(80); }
    await choices.getByRole('button', { name: text }).click();
  }
  await idle(page).catch(() => {});
  for (let i = 0; i < 100 && await page.evaluate(() => (window as any).adventure.session.scene.isBusy()); i++) { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(80); }
  const freed = await state(page);
  expect(freed.flags.guardGone).toBe(true);
  expect(freed.inventory).toContain('keys');
  await act(page, 'use', 'cellDoor', 'keys');
  await act(page, 'go', 'cellDoor');
  expect((await state(page)).room).toBe('guardroom');

  // The guardroom: Kell knows Harrow, so Silas becomes the tally clerk.
  await act(page, 'read', 'warden');
  await act(page, 'take', 'hood');
  await act(page, 'take', 'ledger');
  await act(page, 'use', 'item:hood', 'ledger');
  await act(page, 'use', 'hero', 'maskClerk');
  await shot(page, '4-clerk');
  await act(page, 'talk', 'warden', undefined, [
    "Read in them: Tally clerk. Quartermaster wants the night count. Your name's in his book, Kell.",
    "Read in them: I'll count slowly. Long enough for a man to fetch his supper, say.",
  ]);
  expect((await state(page)).flags.wardenBusy).toBe(true);
  await act(page, 'use', 'grate', 'nail');

  // Out: Sigrid, then black, then the chapter map with Mara's chapter 1 as the only pin.
  await idle(page);
  await page.evaluate(() => { const { session, interact } = (window as any).adventure; void session.scene.runScript(interact(session.state, 'go', 'grate')); });
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    if (await choices.isVisible()) await choices.getByRole('button').first().click();
    return page.locator('#chapter-map').isVisible();
  }, { timeout: 60_000, intervals: [150] }).toBe(true);
  await shot(page, '5-chapter-map');
  await expect(page.locator('#chapter-map .chapter-pin')).toHaveCount(1);
  await expect(page.locator('#chapter-map-list button')).toHaveCount(1);
  await page.locator('#chapter-map-list button').click();
  await page.evaluate(() => document.getElementById('intro-skip')?.click());
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.state.chapter), { timeout: 30_000 }).toBe('ch1');
  const mara = await page.evaluate(() => structuredClone((window as any).adventure.session.state));
  expect(mara.earlier.intro.metSigrid).toBe(true);
  expect(mara.inventory).not.toContain('keys');
  await idle(page);
  expect(errors, errors.join('\n')).toEqual([]);
});
