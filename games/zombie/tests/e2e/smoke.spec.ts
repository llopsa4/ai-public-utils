import { expect, test } from '@playwright/test';

// Smoke: menu loads, New Game reaches the Intro, the opening dialogue is closed with Enter,
// then dw.step(50) advances with no console errors.
test('menu, New Game, intro steps without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });

  await page.goto('/?debug');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Menu with no save: New Game is the centre button (game y = 360 of 720).
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas has no box');
  // Boot loads the atlases and the font first, so a click before the menu exists is lost: retry until the Intro starts.
  // The Intro installs window.dw once it starts.
  for (let i = 0; i < 30 && !(await page.evaluate(() => typeof window.dw !== 'undefined')); i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => typeof window.dw !== 'undefined', null, { timeout: 15_000 });

  // The opening dialogue freezes the sim (state.say is set): close it with Enter, then check it is gone.
  for (let i = 0; i < 40; i++) {
    const saying = await page.evaluate(() => window.dw!.state.say !== null);
    if (!saying) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  expect(await page.evaluate(() => window.dw!.state.say)).toBeNull();

  const before = await page.evaluate(() => window.dw!.state.tick);
  await page.evaluate(() => window.dw!.step(50));
  const after = await page.evaluate(() => window.dw!.state.tick);
  expect(after).toBeGreaterThan(before);

  expect(errors).toEqual([]);
});
