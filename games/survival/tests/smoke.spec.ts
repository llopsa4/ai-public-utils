import { expect, test, type Page } from '@playwright/test';

interface Camp {
  state: {
    people: { id: number; age: string; drafted: boolean }[]; tick: number; result: string | null; gift: number; upgrades: string[];
    store: Record<string, number>;
    buildings: { id: number; type: string; x: number; y: number; done: boolean }[];
  };
  orders: (list: unknown[]) => void;
  selectBuilding: (id: number | null) => void;
  upgradeRows: () => Record<string, string>;
  upgradeBuy: (id: string) => [number, number] | null;
  buildMenu: () => { open: boolean; page: string; shown: string[] };
  wotakuyeTip: () => string | null;
  step: (n: number) => void;
  banner: () => string | null;
  hudText: () => string;
  hudBar: () => { icon: string | null; text: string; right: number }[];
  storeOpen: () => { id: number; items: Record<string, number> } | null;
  powers: () => string[];
  powerButton: (id: string) => [number, number] | null;
  hoverTip: () => string | null;
  selectPeople: (ids: number[]) => void;
  panelText: () => { title: string; detail: string };
  lastPing: () => { kind: string; target: string; count: number } | null;
  scene: { aiming: string | null; cameras: { main: { worldView: { x: number; y: number }; zoom: number } } };
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

/** Adds a finished hunting lodge through the debug state (the start camp has none) and returns its id. */
async function addHuntingLodge(page: Page): Promise<number> {
  return page.evaluate(() => {
    const s = window.camp.state as unknown as { nextBuildingId: number; buildings: unknown[] };
    const id = s.nextBuildingId++;
    s.buildings.push({ id, type: 'hunting_lodge', x: 36, y: 36, done: true, built: 0, delivered: {}, workers: [], residents: [], tended: 0, hp: null });
    return id;
  });
}

/** Clicks a point given in the 1280 x 720 canvas space. */
async function clickCanvas(page: Page, [x, y]: [number, number]): Promise<void> {
  const box = (await page.locator('#game canvas').boundingBox())!;
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
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Pemmican 0 / 400');

  // The first winter starts at tick 10800 (stepping that far would starve the camp, so jump the clock).
  await page.evaluate(() => { window.camp.state.tick = 10800; });
  await expect.poll(() => page.evaluate(() => window.camp.hudText())).toContain('Winter, day 1');

  expect(errors).toEqual([]);
});

test("a finished building's panel lists its upgrades and buys dogs with gift value from the hunting lodge", async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.selectBuilding);
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Gift 0');

  // The council fire (building 1) sells the society upgrades; the hunting lodge sells dogs, bows and scouts.
  await page.evaluate(() => window.camp.selectBuilding(1));
  await expect.poll(() => page.evaluate(() => Object.keys(window.camp.upgradeRows()))).toEqual(['healers', 'warriors', 'builders', 'barricades', 'tools', 'spirits']);
  const lodge = await addHuntingLodge(page);
  await page.evaluate((id) => window.camp.selectBuilding(id), lodge);
  await expect.poll(() => page.evaluate(() => Object.keys(window.camp.upgradeRows()))).toEqual(['dogs', 'bows', 'scouts']);
  await expect.poll(() => page.evaluate(() => window.camp.upgradeRows().dogs)).toContain('Missing: gift 4');
  expect(await page.evaluate(() => window.camp.upgradeRows().scouts)).toBe('Needs Hunting dogs');

  // Give the camp gift value through the debug state, then click the real Buy button.
  await page.evaluate(() => { window.camp.state.gift = 5; });
  await expect.poll(() => page.evaluate(() => window.camp.upgradeRows().dogs)).not.toContain('Missing');
  await page.screenshot({ path: 'test-results/w3-lodge-upgrades.png' });
  const buy = (await page.evaluate(() => window.camp.upgradeBuy('dogs')))!;
  await clickCanvas(page, buy);
  await expect.poll(() => page.evaluate(() => window.camp.state.upgrades)).toEqual(['dogs']);
  await expect.poll(() => page.evaluate(() => window.camp.upgradeRows().dogs)).toBe('Owned');
  expect(await page.evaluate(() => window.camp.hudText())).toContain('Gift 1');

  expect(errors).toEqual([]);
});

test('tier 2: a society upgrade needs its tier 1 upgrade, and Tab pages the Build menu', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.selectBuilding && !!window.camp?.buildMenu); // the Build scene starts after the HUD

  // Rich camp: the gift and goods are not the limit, the requirement is.
  const lodge = await addHuntingLodge(page);
  await page.evaluate(() => {
    window.camp.state.gift = 60;
    window.camp.state.store.wood = 200;
    window.camp.state.store.hides = 50;
    window.camp.orders([{ type: 'buy', upgrade: 'scouts' }]);
  });
  await page.evaluate(() => window.camp.step(2));
  expect(await page.evaluate(() => window.camp.state.upgrades)).toEqual([]);
  await page.evaluate((id) => window.camp.selectBuilding(id), lodge);
  await expect.poll(() => page.evaluate(() => window.camp.upgradeRows().scouts)).toBe('Needs Hunting dogs');
  await page.screenshot({ path: 'test-results/tier2-upgrades-panel.png' });
  await page.evaluate(() => window.camp.selectBuilding(null));
  await expect.poll(() => page.evaluate(() => Object.keys(window.camp.upgradeRows()))).toEqual([]);

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

test('the power bar casts F1 at once, aims the storm at a map click, and Esc cancels aiming', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.powers);
  expect(await page.evaluate(() => window.camp.powers())).toEqual([]);

  await page.evaluate(() => {
    window.camp.state.upgrades.push('spirit_warriors', 'bison_charge', 'storm_caller');
    (window.camp.state as unknown as { wotakuye: number }).wotakuye = 100;
  });
  await expect.poll(() => page.evaluate(() => window.camp.powers())).toEqual(['spirit_warriors', 'bison_charge', 'storm_caller']);
  await page.screenshot({ path: 'test-results/w10-power-bar.png' });

  // F1 casts at once (the key is retried, as in the other tests); the button then says it is spent.
  const used = () => page.evaluate(() => (window.camp.state as unknown as { powersUsed: string[] }).powersUsed);
  await pressUntil(page, 'F1', async () => (await used()).includes('spirit_warriors'));
  const box = (await page.locator('#game canvas').boundingBox())!;
  const [fx, fy] = (await page.evaluate(() => window.camp.powerButton('spirit_warriors')))!;
  await page.mouse.move(box.x + (fx / 1280) * box.width, box.y + (fy / 720) * box.height);
  await expect.poll(() => page.evaluate(() => window.camp.hoverTip())).toContain('Spent');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  // The bison waits for a click; Esc cancels it and nothing is spent.
  const aiming = () => page.evaluate(() => window.camp.scene.aiming);
  const [bx, by] = (await page.evaluate(() => window.camp.powerButton('bison_charge')))!;
  await clickCanvas(page, [bx, by]);
  await expect.poll(aiming).toBe('bison_charge');
  await pressUntil(page, 'Escape', async () => (await aiming()) === null);
  expect(await used()).toEqual(['spirit_warriors']);

  // The storm: click its button, then the map.
  const [sx, sy] = (await page.evaluate(() => window.camp.powerButton('storm_caller')))!;
  await clickCanvas(page, [sx, sy]);
  await expect.poll(aiming).toBe('storm_caller');
  // Several steps: the first move after leaving a HUD button only ends its hover, and the map sees the next one.
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 5 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/w10-aiming-storm.png' });
  await clickCanvas(page, [640, 288]);
  await expect.poll(used).toContain('storm_caller');
  expect(await aiming()).toBeNull();
  expect(await page.evaluate(() => (window.camp.state as unknown as { effects: unknown[] }).effects.length)).toBe(1);

  expect(errors).toEqual([]);
});

test('the resource bar has an icon before each resource, and hovering a store opens it with items', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.hudBar && !!window.camp?.storeOpen);

  // R1: food, wood, hides, pemmican and gift each lead with their icon; the people count has the people icon, the season has none, and
  // the bar stops before the Wotakuye bar (x 750).
  await expect.poll(() => page.evaluate(() => window.camp.hudBar().length)).toBeGreaterThanOrEqual(7);
  const bar = await page.evaluate(() => window.camp.hudBar());
  expect(bar.slice(0, 5).map((b) => b.icon)).toEqual(['icon_food', 'icon_wood', 'icon_hides', 'icon_pemmican', 'icon_gift']);
  expect(bar[5]).toMatchObject({ icon: 'icon_people', text: '20' });
  expect(bar.slice(6).every((b) => b.icon === null)).toBe(true);
  expect(Math.max(...bar.map((b) => b.right))).toBeLessThan(745);
  await page.screenshot({ path: 'test-results/r1-resource-bar.png', clip: { x: 0, y: 0, width: 1280, height: 40 } });

  // R2: the start store. Put the pointer on its floor; its inside shows small items, one per fortieth of what the camp's store can hold.
  const at = await page.evaluate(() => {
    const s = window.camp.state;
    const b = s.buildings.find((x) => x.type === 'store' && x.done)!;
    const size = 48;
    const tx = b.x + 1.5; // the centre of the 4x4 footprint
    const ty = b.y + 1.5;
    const wx = (tx - ty) * 32 + size * 32;
    const wy = (tx + ty) * 16 + 32;
    const cam = window.camp.scene.cameras.main;
    return { id: b.id, x: (wx - cam.worldView.x) * cam.zoom, y: (wy - cam.worldView.y) * cam.zoom };
  });
  const box = (await page.locator('#game canvas').boundingBox())!;
  const toPage = (x: number, y: number): [number, number] => [box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height];
  const shot = async (name: string) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: `test-results/r2-store-${name}.png`, clip: { x: Math.max(0, box.x + at.x - 160), y: Math.max(0, box.y + at.y - 170), width: 320, height: 260 } });
  };
  expect(await page.evaluate(() => window.camp.storeOpen())).toBeNull();
  await shot('closed');
  await page.mouse.move(...toPage(at.x, at.y + 100));
  await page.mouse.move(...toPage(at.x, at.y), { steps: 6 });
  await expect.poll(() => page.evaluate(() => window.camp.storeOpen()?.id)).toBe(at.id);

  for (const [name, fill] of [['empty', 0], ['half', 0.5], ['full', 1]] as const) {
    await page.evaluate((f) => {
      const st = window.camp.state.store;
      // One store holds 800 food, 600 wood, 160 hides, 400 pemmican.
      for (const [r, cap] of [['food', 800], ['wood', 600], ['hides', 160], ['pemmican', 400]] as const) st[r] = f * cap;
    }, fill);
    await shot(name);
    const items = (await page.evaluate(() => window.camp.storeOpen()))!.items;
    const counts = Object.values(items);
    expect(counts).toEqual(fill === 0 ? [0, 0, 0, 0] : fill === 0.5 ? [20, 20, 20, 20] : [40, 40, 40, 40]);
  }

  // Leaving the store brings the roof back.
  await page.mouse.move(...toPage(at.x + 400, at.y + 150), { steps: 6 });
  await expect.poll(() => page.evaluate(() => window.camp.storeOpen())).toBeNull();

  expect(errors).toEqual([]);
});

test('right-clicks ping: green ground, gold tree, red wolf, and a grey refusal with a toast', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.lastPing);
  expect(await page.evaluate(() => window.camp.lastPing())).toBeNull();
  // Pings run on the scene clock, so pausing the sim changes nothing about them (and keeps the wolf still).
  await page.evaluate(() => window.camp.orders([{ type: 'pause', on: true }]));

  /** Centres the camera on a tile, then right-clicks it; returns the last ping. */
  const rightClickTile = async (tx: number, ty: number, dy = 0) => {
    // worldView is refreshed when the camera renders, so wait a frame after centring before reading it.
    await page.evaluate(([x, y]) => {
      const cam = window.camp.scene.cameras.main as unknown as { centerOn: (a: number, b: number) => void };
      cam.centerOn((x - y) * 32 + 48 * 32, (x + y) * 16 + 32);
    }, [tx, ty]);
    await page.waitForTimeout(150);
    const at = await page.evaluate(([x, y]) => {
      const cam = window.camp.scene.cameras.main;
      const wx = (x - y) * 32 + 48 * 32;
      const wy = (x + y) * 16 + 32;
      return { x: (wx - cam.worldView.x) * cam.zoom, y: (wy - cam.worldView.y) * cam.zoom };
    }, [tx, ty]);
    const box = (await page.locator('#game canvas').boundingBox())!;
    await page.mouse.click(box.x + ((at.x) / 1280) * box.width, box.y + ((at.y + dy) / 720) * box.height, { button: 'right' });
    await page.waitForTimeout(120);
    return page.evaluate(() => window.camp.lastPing());
  };

  const ids = await page.evaluate(() => {
    const p = window.camp.state.people;
    return { adult: p.find((q) => q.age === 'adult')!.id, child: p.find((q) => q.age === 'child')!.id };
  });
  const tiles = await page.evaluate(() => {
    const s = window.camp.state as unknown as { map: { size: number; tiles: string[] } };
    const n = s.map.size;
    const at = (x: number, y: number) => s.map.tiles[y * n + x];
    const find = (type: string, ok: (x: number, y: number) => boolean): [number, number] => {
      for (let r = 6; r < 24; r++) {
        for (let y = 24 - r; y <= 24 + r; y++) {
          for (let x = 24 - r; x <= 24 + r; x++) if (at(x, y) === type && ok(x, y)) return [x, y];
        }
      }
      throw new Error(`no ${type} tile`);
    };
    const open = (x: number, y: number) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => at(x + dx, y + dy) === 'grass'));
    return { ground: find('grass', open), tree: find('forest', () => true) };
  });

  // Nobody selected: no order, no ping.
  expect(await rightClickTile(...tiles.ground)).toBeNull();

  // An adult: ground is a green move, a tree is a gold chop.
  await page.evaluate((i) => window.camp.selectPeople([i]), ids.adult);
  expect(await rightClickTile(...tiles.ground)).toMatchObject({ kind: 'move', target: 'ground', count: 1 });
  await page.screenshot({ path: 'test-results/g5-ping-move.png' });
  expect(await rightClickTile(...tiles.tree)).toMatchObject({ kind: 'work', target: 'tree', count: 2 });
  await page.screenshot({ path: 'test-results/g5-ping-tree.png' });

  // A child cannot chop: grey, a toast, and no order sent.
  await page.evaluate((i) => window.camp.selectPeople([i]), ids.child);
  expect(await rightClickTile(...tiles.tree)).toMatchObject({ kind: 'refuse', target: 'tree', count: 3 });
  expect(await page.evaluate(() => (window.camp.state as unknown as { messages: { text: string }[] }).messages.at(-1)!.text)).toBe('Nobody can chop there.');

  // A wolf (the sim is paused): an undrafted person is refused, a drafted one attacks.
  await page.evaluate(([x, y]) => {
    const s = window.camp.state as unknown as { enemies: unknown[] };
    s.enemies.push({ id: 9001, kind: 'wolf', x: x + 2, y: y + 2, hp: 40, cooldown: 0, fleeing: false, wave: 0 });
  }, tiles.ground);
  await page.evaluate((i) => window.camp.selectPeople([i]), ids.adult);
  expect(await rightClickTile(tiles.ground[0] + 2, tiles.ground[1] + 2)).toMatchObject({ kind: 'refuse', target: 'enemy', count: 4 });
  expect(await page.evaluate(() => (window.camp.state as unknown as { messages: { text: string }[] }).messages.at(-1)!.text)).toBe('Nobody is drafted.');
  await page.evaluate((i) => window.camp.orders([{ type: 'draft', ids: [i], on: true }]), ids.adult);
  expect(await rightClickTile(tiles.ground[0] + 2, tiles.ground[1] + 2)).toMatchObject({ kind: 'attack', target: 'enemy', count: 5 });
  await page.screenshot({ path: 'test-results/g5-ping-wolf.png' });

  expect(errors).toEqual([]);
});

test('clicking a berry bush tells how much fruit is left on it; Esc closes it', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.panelText);
  await page.evaluate(() => window.camp.orders([{ type: 'pause', on: true }]));
  const bush = await page.evaluate(() => {
    const s = window.camp.state as unknown as { map: { size: number; tiles: string[]; amount: number[] } };
    const i = s.map.tiles.indexOf('berry');
    s.map.amount[i] = 17.6; // part eaten
    return [i % s.map.size, Math.floor(i / s.map.size)] as [number, number];
  });
  await page.evaluate(([x, y]) => {
    const cam = window.camp.scene.cameras.main as unknown as { centerOn: (a: number, b: number) => void };
    cam.centerOn((x - y) * 32 + 48 * 32, (x + y) * 16 + 32);
  }, bush);
  await page.waitForTimeout(150);
  const at = await page.evaluate(([x, y]) => {
    const cam = window.camp.scene.cameras.main;
    return { x: ((x - y) * 32 + 48 * 32 - cam.worldView.x) * cam.zoom, y: ((x + y) * 16 + 32 - cam.worldView.y) * cam.zoom };
  }, bush);
  await clickCanvas(page, [at.x, at.y]);
  await expect.poll(() => page.evaluate(() => window.camp.panelText())).toEqual({ title: 'Berry patch', detail: '17 of 40 fruit left' });
  await page.screenshot({ path: 'test-results/g18-berry-panel.png' });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.camp.panelText().title)).toBe('');
  expect(errors).toEqual([]);
});
