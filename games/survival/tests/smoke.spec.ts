import { expect, test, type Page } from '@playwright/test';

interface Camp {
  state: { people: unknown[]; tick: number; result: string | null; gift: number; upgrades: string[] };
  orders: (list: unknown[]) => void;
  upgradesOpen: () => boolean;
  upgradeCard: (id: string) => string | null;
  step: (n: number) => void;
  banner: () => string | null;
  hudText: () => string;
}
interface MenuHook {
  buttons: () => Record<string, [number, number]>;
  cards: () => string[];
}
declare global {
  interface Window {
    camp: Camp;
    menu: MenuHook;
  }
}

/** Clicks a menu button by name; the canvas is drawn at 1280 x 720 and scaled to fit. */
async function clickMenu(page: Page, name: string): Promise<void> {
  const box = (await page.locator('#game canvas').boundingBox())!;
  const [x, y] = await page.evaluate((n) => window.menu.buttons()[n], name);
  await page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height);
}

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  return errors;
}

test('menu to a run: 20 people, then the wave 1 warning, with no console errors', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');

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

test('a camp saved at day 2 comes back paused from its slot card', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  expect(await page.evaluate(() => window.menu.cards()[0])).toContain('Empty');
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);

  // One day of ticks; the Game scene saves on the next frame (day start).
  await page.evaluate(() => window.camp.step(1200));
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('campfire.slot.1') !== null))
    .toBe(true);

  await page.reload();
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.continue']);
  expect(await page.evaluate(() => window.menu.cards()[0])).toContain('Day 2');
  await clickMenu(page, 'slot1.continue');

  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  expect(await page.evaluate(() => (window.camp.state as unknown as { paused: boolean }).paused)).toBe(true);

  expect(errors).toEqual([]);
});

test('the HUD names the season: spring at the start, winter on day 10', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.hudText);
  await expect.poll(() => page.evaluate(() => window.camp.hudText())).toContain('Spring, day 1');
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Pemmican 0 / 100');

  // The first winter starts at tick 10800 (stepping that far would starve the camp, so jump the clock).
  await page.evaluate(() => { window.camp.state.tick = 10800; });
  await expect.poll(() => page.evaluate(() => window.camp.hudText())).toContain('Winter, day 1');

  expect(errors).toEqual([]);
});

test('the Upgrades panel opens with U, buys dogs with gift value, and shows the Gift', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.upgradesOpen);
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Gift 0');

  await page.keyboard.press('u');
  await expect.poll(() => page.evaluate(() => window.camp.upgradesOpen())).toBe(true);
  await expect.poll(() => page.evaluate(() => window.camp.upgradeCard('dogs'))).toContain('Missing: gift 4');

  // Give the camp gift value through the debug state, then buy through the panel's order.
  await page.evaluate(() => {
    window.camp.state.gift = 5;
    window.camp.orders([{ type: 'buy', upgrade: 'dogs' }]);
  });
  await page.evaluate(() => window.camp.step(2));
  await expect.poll(() => page.evaluate(() => window.camp.upgradeCard('dogs'))).toBe('Bought');
  expect(await page.evaluate(() => window.camp.state.upgrades)).toEqual(['dogs']);
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Gift 1');

  expect(errors).toEqual([]);
});
