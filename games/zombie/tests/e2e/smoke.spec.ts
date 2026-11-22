import { expect, test } from '@playwright/test';

// Smoke: menu loads, New Game reaches Camp, dw.step(50) advances with no console errors.
test('menu, New Game, camp steps without errors', async ({ page }) => {
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
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // The Camp scene installs window.dw once it starts.
  await page.waitForFunction(() => typeof window.dw !== 'undefined', null, { timeout: 15_000 });

  const before = await page.evaluate(() => window.dw!.state.tick);
  await page.evaluate(() => window.dw!.step(50));
  const after = await page.evaluate(() => window.dw!.state.tick);
  expect(after).toBeGreaterThan(before);

  expect(errors).toEqual([]);
});
