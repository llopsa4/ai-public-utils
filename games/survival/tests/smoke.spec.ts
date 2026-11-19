import { expect, test } from '@playwright/test';

interface Camp {
  state: { people: unknown[]; tick: number; result: string | null };
  step: (n: number) => void;
  banner: () => string | null;
}
declare global {
  interface Window {
    camp: Camp;
  }
}

test('menu to a run: 20 people, then the wave 1 warning, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

  await page.goto('/?debug');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();

  // The game is drawn at 1280 x 720 and scaled to fit; click Start at (640, 300) in game coordinates.
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + (640 / 1280) * box.width, box.y + (300 / 720) * box.height);

  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  expect(await page.evaluate(() => window.camp.state.people.length)).toBe(20);

  // Run the simulation to the 30 s warning before wave 1 (tick 3300), then let a frame draw it.
  await page.evaluate(() => window.camp.step(3300));
  await page.waitForTimeout(500);
  const shot = await canvas.screenshot();
  expect(shot.length).toBeGreaterThan(5000); // the canvas rendered something

  // The HUD draws the scouts' warning with a countdown.
  await expect.poll(() => page.evaluate(() => window.camp.banner())).toMatch(/Scouts: wolves coming/);

  expect(errors).toEqual([]);
});
