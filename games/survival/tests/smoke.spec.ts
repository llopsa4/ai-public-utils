import { expect, test, type Page } from '@playwright/test';

interface Camp {
  state: {
    people: unknown[]; tick: number; result: string | null; gift: number; upgrades: string[];
    store: Record<string, number>;
  };
  orders: (list: unknown[]) => void;
  upgradesOpen: () => boolean;
  upgradeCard: (id: string) => string | null;
  buildMenu: () => { open: boolean; page: string; shown: string[] };
  wotakuyeTip: () => string | null;
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

/**
 * Presses a key until `done()` holds. Phaser reads keys from a per-frame queue and an event that lands
 * between two frames can be missed, so one press is not always enough; `done` must be a state check,
 * so pressing again after a hit is harmless.
 */
async function pressUntil(page: Page, key: string, done: () => Promise<boolean>): Promise<void> {
  await expect(async () => {
    if (!(await done())) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
    expect(await done()).toBe(true);
  }).toPass({ timeout: 8000 });
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

test('tier 2: a society upgrade needs its tier 1 upgrade, and Tab pages the Build menu', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.upgradesOpen && !!window.camp?.buildMenu); // the Build scene starts after the HUD

  // Rich camp: the gift and goods are not the limit, the requirement is.
  await page.evaluate(() => {
    window.camp.state.gift = 60;
    window.camp.state.store.wood = 200;
    window.camp.state.store.hides = 50;
    window.camp.orders([{ type: 'buy', upgrade: 'scouts' }]);
  });
  await page.evaluate(() => window.camp.step(2));
  expect(await page.evaluate(() => window.camp.state.upgrades)).toEqual([]);
  await pressUntil(page, 'u', () => page.evaluate(() => window.camp.upgradesOpen()));
  await expect.poll(() => page.evaluate(() => window.camp.upgradeCard('scouts'))).toContain('Needs Hunting dogs');
  await page.screenshot({ path: 'test-results/tier2-upgrades-panel.png' });
  await pressUntil(page, 'u', async () => !(await page.evaluate(() => window.camp.upgradesOpen())));

  // With dogs, scouts can be bought.
  await page.evaluate(() => window.camp.orders([{ type: 'buy', upgrade: 'dogs' }, { type: 'buy', upgrade: 'scouts' }]));
  await page.evaluate(() => window.camp.step(2));
  expect(await page.evaluate(() => window.camp.state.upgrades)).toEqual(['dogs', 'scouts']);

  // The Build menu has a Camp page; Tab switches to Societies, which shows only the unlocked entry.
  const menu = () => page.evaluate(() => window.camp.buildMenu());
  await pressUntil(page, 'b', async () => (await menu()).open);
  expect((await menu()).page).toBe('camp');
  await pressUntil(page, 'Tab', async () => (await menu()).page === 'societies');
  expect((await menu()).shown).toEqual(['scouts_lodge']);
  await page.screenshot({ path: 'test-results/tier2-build-societies.png' });
  await pressUntil(page, 'Tab', async () => (await menu()).page === 'camp');

  expect(errors).toEqual([]);
});

test('hovering the Wotakuye bar shows the rules tooltip, even while paused', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.wotakuyeTip);
  expect(await page.evaluate(() => window.camp.wotakuyeTip())).toBeNull();

  const box = (await page.locator('#game canvas').boundingBox())!;
  const at = (x: number, y: number) => page.mouse.move(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height);
  await page.keyboard.press('Space'); // paused: the tooltip still works
  await at(830, 16);
  await expect.poll(() => page.evaluate(() => window.camp.wotakuyeTip())).toContain('no bed');
  const tip = (await page.evaluate(() => window.camp.wotakuyeTip()))!;
  expect(tip).toContain('Gift tomorrow');
  expect(tip).toContain('Full meal');

  await at(400, 400);
  await expect.poll(() => page.evaluate(() => window.camp.wotakuyeTip())).toBeNull();

  expect(errors).toEqual([]);
});
