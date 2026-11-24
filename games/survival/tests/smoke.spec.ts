import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

interface Camp {
  state: {
    people: { id: number; age: string; drafted: boolean; job: { kind: string; building: number } | null }[]; tick: number; speed: number; messages: { text: string }[]; result: string | null; gift: number; upgrades: string[];
    store: Record<string, number>;
    buildings: { id: number; type: string; x: number; y: number; done: boolean }[];
    map: { size: number; tiles: string[]; fire: number[] };
  };
  orders: (list: unknown[]) => void;
  selectBuilding: (id: number | null) => void;
  upgradeRows: () => Record<string, string>;
  upgradeBuy: (id: string) => [number, number] | null;
  buildMenu: () => { visible: boolean; armed: boolean; page: string; shown: string[]; placing: string | null };
  buildCard: (type: string) => [number, number] | null;
  wotakuyeTip: () => string | null;
  step: (n: number) => void;
  banner: () => string | null;
  hudText: () => string;
  hudBar: () => { icon: string | null; text: string; right: number }[];
  storeOpen: () => { id: number; items: Record<string, number> } | null;
  terrain: () => { ground: number; spills: number; trees: number; stumps: number; bushes: number; props: number; chunks: number; chunksShown: number; frame: (x: number, y: number) => string | null };
  powers: () => string[];
  powerButton: (id: string) => [number, number] | null;
  hoverTip: () => string | null;
  selectPeople: (ids: number[]) => void;
  selectAnimal: (id: number | null) => void;
  panelText: () => { title: string; detail: string };
  speedFrames: () => (string | null)[];
  cursor: () => { installed: string[]; shown: string | null; css: string };
  lastPing: () => { kind: string; target: string; count: number } | null;
  music: () => { mode: string; on: boolean; volume: number; started: boolean };
  buildings: () => { frames: Record<string, string>; flames: number[] };
  creatures: () => {
    wolves: Record<string, string>; animals: Record<string, string>; allies: Record<string, string>;
    horses: string[]; herds: string[]; storms: string[]; falls: string[]; art: Record<string, boolean>;
    arrows: string[]; fx: Record<string, number>; playing: Record<string, number>;
    person: (id: number) => { key: string; anim: string; frame: string; art: boolean } | undefined;
  };
  hud: { openMenu: () => void };
  minimap: () => { rect: number[]; view: number[]; counts: { people: number; wolves: number } };
  scene: { aiming: string | null; setPlacing: (t: string | null, b?: number[]) => void; placing: string | null; cameras: { main: { worldView: { x: number; y: number }; zoom: number } } };
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

  // The building cards show only for a selected adult. They have a Camp page; Tab switches to Societies,
  // which shows only the unlocked entry.
  const menu = () => page.evaluate(() => window.camp.buildMenu());
  expect((await menu()).visible).toBe(false);
  await page.evaluate(() => window.camp.selectPeople(window.camp.state.people.filter((p) => p.age === 'adult').slice(0, 2).map((p) => p.id)));
  await expect.poll(async () => (await menu()).visible).toBe(true);
  await pressUntil(page, 'b', async () => (await menu()).armed);
  expect((await menu()).page).toBe('camp');
  await pressUntil(page, 'Tab', async () => (await menu()).page === 'societies');
  expect((await menu()).shown).toEqual(['scouts_lodge']);
  await page.screenshot({ path: 'test-results/tier2-build-societies.png' });
  await pressUntil(page, 'Tab', async () => (await menu()).page === 'camp');

  expect(errors).toEqual([]);
});

test('building cards: hidden for children, B then a number picks, and placing sends the selection as builders', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.selectBuilding && !!window.camp?.buildMenu);
  const menu = () => page.evaluate(() => window.camp.buildMenu());

  // Nothing selected, or only children: no cards. A drafted adult cannot build either.
  expect((await menu()).visible).toBe(false);
  await page.evaluate(() => window.camp.selectPeople(window.camp.state.people.filter((p) => p.age === 'child').map((p) => p.id)));
  await page.waitForTimeout(300);
  expect((await menu()).visible).toBe(false);
  await pressUntil(page, 'b', async () => (await page.evaluate(() => window.camp.state.messages.map((m) => m.text))).some((m) => m.includes('Select an adult')));
  expect((await menu()).armed).toBe(false);

  // Five adults: the cards show, B arms them, the next 1 picks the first card; 1-3 would otherwise set the speed.
  const adults = await page.evaluate(() => window.camp.state.people.filter((p) => p.age === 'adult').slice(0, 5).map((p) => p.id));
  expect(adults).toHaveLength(5);
  await page.evaluate((ids) => window.camp.selectPeople(ids), adults);
  await expect.poll(async () => (await menu()).visible).toBe(true);
  await page.screenshot({ path: 'test-results/g23-cards.png' });
  await page.evaluate(() => { window.camp.state.store.wood = 100; window.camp.state.store.hides = 40; }); // the card is dim and refuses when short
  const first = (await menu()).shown[0];
  await pressUntil(page, 'b', async () => (await menu()).armed);
  await pressUntil(page, '1', async () => (await menu()).placing === first);
  expect((await menu()).armed).toBe(false);
  expect(await page.evaluate(() => window.camp.state.speed)).toBe(1);

  // Left-click the map: a site appears and exactly three of the five become its builders.
  const before = await page.evaluate(() => window.camp.state.buildings.length);
  for (const at of [[640, 250], [760, 300], [520, 300], [640, 400]] as [number, number][]) {
    if ((await page.evaluate(() => window.camp.state.buildings.length)) > before) break;
    await clickCanvas(page, at);
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => window.camp.step(1));
  const site = await page.evaluate((b) => window.camp.state.buildings[b], before);
  expect(site?.type).toBe(first);
  const builders = await page.evaluate((id) => window.camp.state.people.filter((p) => p.job?.kind === 'build' && p.job.building === id).length, site.id);
  expect(builders).toBe(3);
  // The other two were not made builders (idle people may still fetch wood for the site on their own).
  const others = await page.evaluate((ids) => window.camp.state.people.filter((p) => ids.includes(p.id) && p.job?.kind !== 'build').length, adults);
  expect(others).toBe(2);
  expect((await menu()).placing).toBeNull();

  // Clearing the selection hides the cards and cancels placing.
  await pressUntil(page, 'b', async () => (await menu()).armed);
  await pressUntil(page, '1', async () => (await menu()).placing === first);
  await page.evaluate(() => window.camp.selectPeople([]));
  await expect.poll(async () => (await menu()).visible).toBe(false);
  expect((await menu()).placing).toBeNull();

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
    const size = window.camp.state.map.size;
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
      cam.centerOn((x - y) * 32 + window.camp.state.map.size * 32, (x + y) * 16 + 32);
    }, [tx, ty]);
    await page.waitForTimeout(150);
    const at = await page.evaluate(([x, y]) => {
      const cam = window.camp.scene.cameras.main;
      const wx = (x - y) * 32 + window.camp.state.map.size * 32;
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
    const s = window.camp.state as unknown as { map: { size: number; tiles: string[]; fire: number[] } };
    const n = s.map.size;
    const at = (x: number, y: number) => s.map.tiles[y * n + x];
    const find = (type: string, ok: (x: number, y: number) => boolean): [number, number] => {
      const [mx, my] = [s.map.fire[0] + 2, s.map.fire[1] + 2];
      for (let r = 6; r < 24; r++) {
        for (let y = my - r; y <= my + r; y++) {
          for (let x = mx - r; x <= mx + r; x++) if (at(x, y) === type && ok(x, y)) return [x, y];
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

test('right-clicking a deer sends the hunt order, a carcass is fetched, and a click on game fills the panel', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.lastPing);
  await page.evaluate(() => window.camp.orders([{ type: 'pause', on: true }]));

  type Beast = { id: number; kind: string; herd: number; x: number; y: number; hp: number; dead: boolean; meat: number; hides: number; fleeing: number; path: unknown[] };
  const spot = await page.evaluate(() => {
    const s = window.camp.state as unknown as { map: { size: number; tiles: string[]; fire: number[] }; animals?: Beast[] };
    const n = s.map.size;
    const at = (x: number, y: number) => s.map.tiles[y * n + x];
    const [mx, my] = [s.map.fire[0] + 2, s.map.fire[1] + 2];
    for (let r = 8; r < 20; r++) {
      for (let x = mx - r; x <= mx + r; x++) {
        const y = my + r;
        if ([-1, 0, 1].every((dy) => [-1, 0, 1, 2, 3].every((dx) => at(x + dx, y + dy) === 'grass'))) return [x, y] as [number, number];
      }
    }
    throw new Error('no open grass');
  });
  await page.evaluate(([x, y]) => {
    const s = window.camp.state as unknown as { animals?: Beast[] };
    s.animals = [
      { id: 9100, kind: 'deer', herd: 90, x, y, hp: 24, dead: false, meat: 10, hides: 1, fleeing: 0, path: [] },
      { id: 9101, kind: 'bison', herd: 91, x: x + 3, y, hp: 20, dead: true, meat: 30, hides: 3, fleeing: 0, path: [] },
    ];
  }, spot);
  await page.evaluate(([x, y]) => {
    const cam = window.camp.scene.cameras.main as unknown as { centerOn: (a: number, b: number) => void };
    cam.centerOn((x + 1 - y) * 32 + window.camp.state.map.size * 32, (x + 1 + y) * 16 + 32);
  }, spot);
  await page.waitForTimeout(150);
  const screenOf = (dx: number) => page.evaluate(([x, y, d]) => {
    const cam = window.camp.scene.cameras.main;
    return { x: (((x + d) - y) * 32 + window.camp.state.map.size * 32 - cam.worldView.x) * cam.zoom, y: (((x + d) + y) * 16 + 32 - cam.worldView.y) * cam.zoom };
  }, [spot[0], spot[1], dx]);
  const ids = await page.evaluate(() => window.camp.state.people.filter((q) => q.age === 'adult').slice(0, 2).map((q) => q.id));
  const rightClick = async (p: { x: number; y: number }, dy: number) => {
    const box = (await page.locator('#game canvas').boundingBox())!;
    await page.mouse.click(box.x + (p.x / 1280) * box.width, box.y + ((p.y + dy) / 720) * box.height, { button: 'right' });
    await page.waitForTimeout(120);
  };

  // Click the deer: the panel names it.
  const deer = await screenOf(0);
  await clickCanvas(page, [deer.x, deer.y - 8]);
  await expect.poll(() => page.evaluate(() => window.camp.panelText().title)).toBe('Deer');
  await page.screenshot({ path: 'test-results/g12-deer.png' });

  // Hunters selected: right-click the deer = a gold animal ping and the hunt job on that animal.
  await page.evaluate((i) => window.camp.selectPeople(i), ids);
  await rightClick(deer, -8);
  expect(await page.evaluate(() => window.camp.lastPing())).toMatchObject({ kind: 'work', target: 'animal' });
  await page.evaluate(() => window.camp.step(2));
  const jobs = await page.evaluate((i) => window.camp.state.people.filter((q) => i.includes(q.id)).map((q) => (q as unknown as { job: { kind: string; animal: number } | null }).job), ids);
  expect(jobs).toEqual(ids.map(() => expect.objectContaining({ kind: 'hunt', animal: 9100 })));

  // The carcass: a gold carcass ping and the panel with its meat.
  await rightClick(await screenOf(3), -4);
  expect(await page.evaluate(() => window.camp.lastPing())).toMatchObject({ kind: 'work', target: 'carcass' });
  await page.evaluate(() => window.camp.selectAnimal(9101));
  await expect.poll(() => page.evaluate(() => window.camp.panelText().title)).toBe('Bison carcass');
  expect((await page.evaluate(() => window.camp.panelText().detail))).toContain('30 meat and 3 hides left');
  await page.screenshot({ path: 'test-results/g12-carcass.png' });

  expect(errors).toEqual([]);
});

test('music: starts on the first click, goes to war while wolves are out, and the HUD menu toggles and remembers it', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new'); // the first click starts the sound
  await page.waitForFunction(() => !!window.camp?.music);
  expect(await page.evaluate(() => window.camp.music())).toMatchObject({ mode: 'ambient', on: true, started: true });

  await page.evaluate(() => window.camp.orders([{ type: 'pause', on: true }])); // ticks only move with step()
  // A wolf on the map: war music. Gone: war music holds for 50 ticks (5 s), then ambient again.
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { enemies: unknown[] };
    s.enemies.push({ id: 9001, kind: 'wolf', x: 5, y: 5, hp: 40, cooldown: 0, fleeing: false, wave: 0 });
  });
  await expect.poll(() => page.evaluate(() => window.camp.music().mode)).toBe('war');
  await page.evaluate(() => ((window.camp.state as unknown as { enemies: unknown[] }).enemies.length = 0));
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.camp.music().mode)).toBe('war');
  // The hold starts at the tick of the first frame that sees no wolf (tick 0 or 1 here), so keep clear of the 50 edge.
  await page.evaluate(() => window.camp.step(40));
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.camp.music().mode)).toBe('war');
  await page.evaluate(() => window.camp.step(12));
  await expect.poll(() => page.evaluate(() => window.camp.music().mode)).toBe('ambient');

  // The HUD menu: Music on/off and the volume, kept in the browser.
  await page.evaluate(() => window.camp.hud.openMenu());
  await page.waitForTimeout(150);
  await clickCanvas(page, [540, 434]);
  expect(await page.evaluate(() => window.camp.music().on)).toBe(false);
  await page.screenshot({ path: 'test-results/g13-menu.png' });
  await clickCanvas(page, [540, 434]);
  expect(await page.evaluate(() => window.camp.music().on)).toBe(true);
  await clickCanvas(page, [670, 434]);
  await clickCanvas(page, [670, 434]);
  expect(await page.evaluate(() => window.camp.music().volume)).toBeCloseTo(0.4, 5);
  await clickCanvas(page, [774, 434]);
  expect(await page.evaluate(() => window.camp.music().volume)).toBeCloseTo(0.5, 5);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('survival.music')))!)).toEqual({ on: true, volume: 0.5 });

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
    cam.centerOn((x - y) * 32 + window.camp.state.map.size * 32, (x + y) * 16 + 32);
  }, bush);
  await page.waitForTimeout(150);
  const at = await page.evaluate(([x, y]) => {
    const cam = window.camp.scene.cameras.main;
    return { x: ((x - y) * 32 + window.camp.state.map.size * 32 - cam.worldView.x) * cam.zoom, y: ((x + y) * 16 + 32 - cam.worldView.y) * cam.zoom };
  }, bush);
  await clickCanvas(page, [at.x, at.y]);
  await expect.poll(() => page.evaluate(() => window.camp.panelText())).toEqual({ title: 'Berry patch', detail: '17 of 40 fruit left' });
  await page.screenshot({ path: 'test-results/g18-berry-panel.png' });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.camp.panelText().title)).toBe('');
  expect(errors).toEqual([]);
});

test('idle people sit on the council plaza ring, one to a tile', async ({ page }, info) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  await page.evaluate(() => {
    window.camp.orders([{ type: 'pause', on: true }]);
    window.camp.step(700);
  });
  await page.waitForTimeout(600);
  const seated = await page.evaluate(() => {
    const s = window.camp.state as unknown as { people: { x: number; y: number; job: unknown; drafted: boolean; task: { step: string } }[]; buildings: { type: string; x: number; y: number }[] };
    const fire = s.buildings.find((b) => b.type === 'fire')!;
    const tiles = s.people
      .filter((p) => !p.job && !p.drafted && p.task.step === 'idle')
      .map((p) => [Math.round(p.x), Math.round(p.y)])
      .filter(([x, y]) => x >= fire.x - 1 && x <= fire.x + 4 && y >= fire.y - 1 && y <= fire.y + 4);
    return { n: tiles.length, distinct: new Set(tiles.map((t) => t.join(','))).size };
  });
  expect(seated.n).toBeGreaterThanOrEqual(15);
  expect(seated.distinct).toBe(seated.n);
  await page.locator('#game canvas').screenshot({ path: info.outputPath('plaza.png') });
  expect(errors).toEqual([]);
});

test('the minimap: left-click and drag pan the camera, right-click moves the selection, and no click reaches the world', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => !!window.camp?.minimap);
  await page.evaluate(() => window.camp.orders([{ type: 'pause', on: true }]));
  const mini = await page.evaluate(() => window.camp.minimap());
  const [rx, ry, rw, rh] = mini.rect;
  expect(rw).toBe(192);
  expect(rh).toBe(96);
  expect(mini.counts.people).toBe(20);
  const view = () => page.evaluate(() => window.camp.minimap().view);
  const at = (fx: number, fy: number): [number, number] => [rx + rw * fx, ry + rh * fy];
  const start = await view();

  // Two people selected: a left-click on the minimap moves the camera and keeps the selection.
  const ids = await page.evaluate(() => window.camp.state.people.slice(0, 2).map((p) => p.id));
  await page.evaluate((i) => window.camp.selectPeople(i), ids);
  await clickCanvas(page, at(0.5, 0.2));
  await expect.poll(view).not.toEqual(start);
  const north = await view();
  expect(north[1]).toBeLessThan(start[1]);
  expect((await page.evaluate(() => window.camp.panelText())).title).toBe('2 people selected');

  // A drag follows the pointer: the outline ends where the drag ends.
  const box = (await page.locator('#game canvas').boundingBox())!;
  const px = (c: [number, number]): [number, number] => [box.x + (c[0] / 1280) * box.width, box.y + (c[1] / 720) * box.height];
  const [a, b] = [px(at(0.3, 0.5)), px(at(0.7, 0.6))];
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  await page.mouse.move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { steps: 4 });
  await page.mouse.move(b[0], b[1], { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => (await view())[0]).toBeGreaterThan(north[0] + 30);
  expect((await page.evaluate(() => window.camp.panelText())).title).toBe('2 people selected');

  // Right-click sends the selected people a move order to that tile.
  const pings = await page.evaluate(() => window.camp.lastPing()?.count ?? 0);
  await page.mouse.click(...px(at(0.5, 0.5)), { button: 'right' });
  await expect.poll(() => page.evaluate(() => window.camp.lastPing()?.kind)).toBe('move');
  expect(await page.evaluate(() => window.camp.lastPing()!.count)).toBe(pings + 1);
  expect(
    await page.evaluate((i) => window.camp.state.people.filter((p) => i.includes(p.id)).every((p) => (p as unknown as { task: { step: string } }).task.step === 'walk'), ids),
  ).toBe(true);

  // While placing, a click only moves the camera: no building, still placing, no order from the right-click.
  const buildings = await page.evaluate(() => window.camp.state.buildings.length);
  await page.evaluate(() => window.camp.scene.setPlacing('tipi', []));
  const before = await view();
  await clickCanvas(page, at(0.2, 0.5));
  await expect.poll(view).not.toEqual(before);
  const count = await page.evaluate(() => window.camp.lastPing()!.count);
  await page.mouse.click(...px(at(0.5, 0.5)), { button: 'right' });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.camp.lastPing()!.count)).toBe(count);
  expect(await page.evaluate(() => window.camp.scene.placing)).toBe('tipi');
  expect(await page.evaluate(() => window.camp.state.buildings.length)).toBe(buildings);

  await page.screenshot({ path: 'test-results/m5-minimap.png' });
  expect(errors).toEqual([]);
});

// AC3: `?standins` loads the grey stand-in atlases (git-ignored; made by `npm run art:standins`) and starts a run.
test('?standins starts the game from the grey stand-in atlases, with no console errors', async ({ page }) => {
  test.skip(!fs.existsSync('art/standins/atlas/ground.json'), 'run `npm run art:standins` first');
  const errors = watchErrors(page);
  await page.goto('/?debug&standins');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const loaded = await page.evaluate(() => {
    const t = (window.camp.scene as unknown as { textures: { exists: (k: string) => boolean; get: (k: string) => { has: (f: string) => boolean } } }).textures;
    return t.exists('ground') && t.exists('buildings') && t.get('ground').has('tile_grass/summer/0');
  });
  expect(loaded).toBe(true);
  await page.evaluate(() => window.camp.step(20));
  expect(errors).toEqual([]);
});

// AC5: installed AB3/AB4/AB5 terrain shows ground, banks, spills, trees, bushes and props.
// With `?standins`, a season change swaps every frame too.
test('terrain: installed art shows trees, bushes and props with camera chunk culling', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const plain = await page.evaluate(() => window.camp.terrain());
  expect(plain.trees).toBeGreaterThan(100);
  expect(plain.spills).toBeGreaterThan(100);
  expect(plain.stumps).toBe(0); // No tree has been felled.
  expect(plain.bushes).toBeGreaterThan(20);
  expect(plain.props).toBeGreaterThan(200);
  // AC9: the 96 x 96 ground is baked into 6 x 6 chunk textures, and only the chunks near the camera are drawn.
  expect(plain.chunks).toBe(36);
  await page.evaluate(() => {
    const c = window.camp.scene as unknown as { cameras: { main: { setZoom: (z: number) => void; centerOn: (x: number, y: number) => void } } };
    c.cameras.main.setZoom(2);
    c.cameras.main.centerOn(window.camp.state.map.size * 32, window.camp.state.map.size * 16 + 32);
  });
  await expect.poll(() => page.evaluate(() => window.camp.terrain().chunksShown)).toBeLessThan(20);
  const near = await page.evaluate(() => window.camp.terrain().chunksShown);
  expect(near).toBeGreaterThan(0);
  await page.evaluate(() => { (window.camp.scene as unknown as { cameras: { main: { setZoom: (z: number) => void } } }).cameras.main.setZoom(0.5); }); // no return: a Camera cannot be serialised
  await page.waitForFunction((n) => window.camp.terrain().chunksShown > n, near);
  expect(errors).toEqual([]);
});

test('terrain: stand-ins show banks, spills, props and the season swap', async ({ page }) => {
  test.skip(!fs.existsSync('art/standins/atlas/ground.json'), 'run `npm run art:standins` first');
  const errors = watchErrors(page);
  await page.goto('/?debug&standins');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const t = await page.evaluate(() => window.camp.terrain());
  expect(t.spills).toBeGreaterThan(100);
  expect(t.bushes).toBeGreaterThan(20);
  expect(t.props).toBeGreaterThan(200);
  // A grass tile beside the river draws its bank, labelled with the mask; the start season is spring.
  const bank = await page.evaluate(() => {
    const { size, tiles } = window.camp.state.map;
    const water = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && ['river', 'ford'].includes(tiles[y * size + x]);
    for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
      if (tiles[y * size + x] === 'grass' && (water(x + 1, y) || water(x - 1, y))) return { x, y, frame: window.camp.terrain().frame(x, y) };
    }
    return null;
  });
  expect(bank?.frame).toMatch(/^bank_river\/spring\/(2|8|10)$/);
  // A felled tree leaves a stump (and the tile is redrawn as grass).
  const trees = t.trees;
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { map: { size: number; tiles: string[] }; mapVersion: number };
    s.map.tiles[s.map.tiles.indexOf('forest')] = 'grass';
    s.mapVersion++;
  });
  await expect.poll(() => page.evaluate(() => window.camp.terrain().stumps)).toBe(1);
  expect((await page.evaluate(() => window.camp.terrain())).trees).toBe(trees - 1);
  // A season on: summer frames everywhere.
  await page.evaluate(() => window.camp.step(3600));
  await expect.poll(() => page.evaluate((b) => window.camp.terrain().frame(b!.x, b!.y), bank)).toMatch(/^bank_river\/summer\//);
  // Look at the river bank (isometric 64 x 32 tiles: world x = (x - y) * 32 + size * 32, y = (x + y) * 16 + 32).
  await page.evaluate((b) => {
    const size = window.camp.state.map.size;
    const c = window.camp.scene as unknown as { cameras: { main: { centerOn: (x: number, y: number) => void; setZoom: (z: number) => void } } };
    c.cameras.main.setZoom(1.5);
    c.cameras.main.centerOn((b!.x - b!.y) * 32 + size * 32, (b!.x + b!.y) * 16 + 32);
  }, bank);
  await page.screenshot({ path: 'test-results/ac5-standins.png' });
  expect(errors).toEqual([]);
});

// AC6: buildings show the frame of their stage, a barricade its mask, the fire its winter frame; no flame without art.
test('buildings: stand-ins show stage, barricade mask and winter frames, and the flames', async ({ page }) => {
  test.skip(!fs.existsSync('art/standins/atlas/ground.json'), 'run `npm run art:standins` first');
  const errors = watchErrors(page);
  await page.goto('/?debug&standins');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const ids = await page.evaluate(() => {
    const s = window.camp.state as unknown as { nextBuildingId: number; buildings: Record<string, unknown>[]; map: { fire: number[] } };
    const [fx, fy] = s.map.fire;
    const add = (type: string, dx: number, dy: number, done: boolean, built: number): number => {
      const id = s.nextBuildingId++;
      s.buildings.push({ id, type, x: fx + dx, y: fy + dy, done, built, delivered: {}, workers: [], residents: [], tended: 0, hp: null });
      return id;
    };
    return {
      early: add('hunting_lodge', 10, -6, false, 5),
      mid: add('healers_lodge', 10, -3, false, 110),
      late: add('scouts_lodge', 10, -9, false, 190),
      rack: add('drying_rack', 10, 0, true, 0),
      pit: add('fire_pit', 10, 3, true, 0),
      wall: [add('barricade', 14, 0, true, 0), add('barricade', 14, 1, true, 0), add('barricade', 14, 2, true, 0)],
    };
  });
  const frames = async () => (await page.evaluate(() => window.camp.buildings())).frames;
  await expect.poll(async () => Object.keys(await frames()).length).toBeGreaterThan(8);
  let f = await frames();
  expect(f[ids.early]).toBe('building_hunting_lodge/stage1/00');
  expect(f[ids.mid]).toBe('building_healers_lodge/stage2/00');
  expect(f[ids.late]).toBe('building_scouts_lodge/stage3/00');
  expect(f[ids.rack]).toMatch(/^building_drying_rack\/finished\/0[0-3]$/);
  expect(f[ids.pit]).toBe('building_fire_pit/finished/00');
  expect(ids.wall.map((id) => f[id].split('/').pop())).toEqual(['4', '5', '1']);
  const fire = await page.evaluate(() => window.camp.state.buildings.find((b) => b.type === 'fire')!.id);
  expect(f[fire]).toBe('fire_central/finished/00');
  // Stand-ins include fx_flame, so the fire and the pit carry a flame.
  expect((await page.evaluate(() => window.camp.buildings())).flames.sort()).toEqual([fire, ids.pit].sort());
  // Winter: the first winter day is tick 10800.
  await page.evaluate(() => { (window.camp.state as unknown as { tick: number }).tick = 10800; });
  await expect.poll(async () => (await frames())[fire]).toBe('fire_central/winter/00');
  f = await frames();
  expect(f[ids.early]).toBe('building_hunting_lodge/stage1/00');
  expect(f[ids.pit]).toBe('building_fire_pit/winter/00');
  expect(f[ids.wall[1]]).toBe('building_barricade/winter/5');
  expect(f[ids.rack]).toMatch(/^building_drying_rack\/winter\/0[0-3]$/);
  await page.screenshot({ path: 'test-results/ac6-standins.png' });
  expect(errors).toEqual([]);
});

test('buildings: normal mode draws the installed flame on the council fire', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  await expect.poll(async () => Object.keys((await page.evaluate(() => window.camp.buildings())).frames).length).toBeGreaterThan(2);
  const fire = await page.evaluate(() => window.camp.state.buildings.find(b => b.type === 'fire')!.id);
  await expect.poll(async () => (await page.evaluate(() => window.camp.buildings())).flames).toContain(fire);
  expect(errors).toEqual([]);
});

// AC8: final button art and stand-ins use nine-slices, with the active speed using the pressed frame.
test('interface: normal mode uses installed button art and cursors that follow the selection', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const manifest = JSON.parse(fs.readFileSync(new URL('../art/manifest.json', import.meta.url), 'utf8'));
  const speedFrames = manifest.ui_button.status === 'final'
    ? ['ui_button/normal', 'ui_button/pressed', 'ui_button/normal', 'ui_button/normal']
    : [null, null, null, null];
  await expect.poll(() => page.evaluate(() => window.camp.speedFrames())).toEqual(speedFrames);
  const c = await page.evaluate(() => window.camp.cursor());
  expect(c.installed.sort()).toEqual(['attack', 'build', 'invalid', 'move', 'pointer']);
  expect(c.css).toContain('image-set');
  await page.evaluate(() => window.camp.selectPeople([window.camp.state.people[0].id]));
  await page.mouse.move(640, 360);
  await page.mouse.move(650, 370);
  await expect.poll(() => page.evaluate(() => window.camp.cursor().shown)).toBe('move');
  expect(errors).toEqual([]);
});

test('interface: stand-ins draw nine-slice surfaces and install the cursors, which follow the selection', async ({ page }) => {
  test.skip(!fs.existsSync('art/standins/atlas/ui.json'), 'run `npm run art:standins` first');
  const errors = watchErrors(page);
  await page.goto('/?debug&standins');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  await page.waitForTimeout(300);
  // 1x is the active speed: pressed; the others normal.
  expect(await page.evaluate(() => window.camp.speedFrames())).toEqual(['ui_button/normal', 'ui_button/pressed', 'ui_button/normal', 'ui_button/normal']);
  const before = await page.evaluate(() => window.camp.cursor());
  expect(before.installed.sort()).toEqual(['attack', 'build', 'invalid', 'move', 'pointer']);
  expect(before.shown).toBe('pointer');
  await page.evaluate(() => window.camp.selectPeople([window.camp.state.people[0].id]));
  await page.mouse.move(640, 360);
  await page.mouse.move(650, 370);
  await expect.poll(() => page.evaluate(() => window.camp.cursor().shown)).toBe('move');
  expect(await page.evaluate(() => window.camp.cursor().css)).toContain('image-set');
  expect(errors).toEqual([]);
});

// AC7: creatures and effects. Without art the wolves, game and allies keep their code drawings and no horse, rider or
// effect sprite appears; with `?standins` each is a sprite showing the frame its state asks for.
test('creatures: normal mode uses installed effects and keeps unfinished animal art as code', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?debug');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { nextEnemyId: number; enemies: Record<string, unknown>[]; map: { fire: number[] } };
    s.enemies.push({ id: s.nextEnemyId++, kind: 'wolf', x: s.map.fire[0] + 12, y: s.map.fire[1], hp: 40, cooldown: 0, fleeing: false, wave: 0 });
  });
  await page.waitForTimeout(300);
  const c = await page.evaluate(() => window.camp.creatures());
  expect(Object.entries(c.art).filter(([key]) => key !== 'ally_spirit' && key !== 'fx_storm').every(([, a]) => !a)).toBe(true);
  expect(c.art.ally_spirit).toBe(true);
  expect(c.art.fx_storm).toBe(true);
  expect([Object.keys(c.wolves).length, Object.keys(c.animals).length, c.horses.length, c.arrows.length]).toEqual([0, 0, 0, 0]);
  expect(c.fx.fish).toBe(0); // Fish art is still unfinished; installed dust may be raised by runners.
  expect(errors).toEqual([]);
});

test('creatures: stand-ins show a wave, a hunt, a storm, a stampede, a rider, horses, allies and effects', async ({ page }) => {
  test.skip(!fs.existsSync('art/standins/atlas/animals.json'), 'run `npm run art:standins` first');
  const errors = watchErrors(page);
  await page.goto('/?debug&standins');
  await page.waitForFunction(() => !!window.menu?.buttons()['slot1.new']);
  await clickMenu(page, 'slot1.new');
  await page.waitForFunction(() => window.camp?.state.people.length === 20);
  const cr = () => page.evaluate(() => window.camp.creatures());
  expect(Object.values((await cr()).art).every((a) => a)).toBe(true);
  // The wild game: every live animal is a sprite grazing, standing or walking.
  await expect.poll(async () => Object.keys((await cr()).animals).length).toBeGreaterThan(20);
  for (const f of Object.values((await cr()).animals)) expect(f).toMatch(/^animal_(deer|bison)\/base\/(idle|graze|walk|run)\/(s|sw|w|nw|n|ne|e|se)\/\d\d$/);

  // A wave: a wolf and the pack leader run in; a hit raises dust; a killed wolf plays `die`.
  const wolves = await page.evaluate(() => {
    const s = window.camp.state as unknown as { nextEnemyId: number; enemies: Record<string, unknown>[]; map: { fire: number[] } };
    const [fx, fy] = s.map.fire;
    const add = (kind: string, dx: number, hp: number) => {
      const id = s.nextEnemyId++;
      s.enemies.push({ id, kind, x: fx + dx, y: fy - 14, hp, cooldown: 0, fleeing: false, wave: 0 });
      return id;
    };
    return { wolf: add('wolf', 0, 40), leader: add('pack_leader', 3, 90) };
  });
  await expect.poll(async () => (await cr()).wolves[wolves.leader] ?? '').toMatch(/^animal_wolf\/base\/run\//);
  expect((await cr()).wolves[wolves.wolf]).toMatch(/^animal_wolf\/base\/(run|walk)\//);
  await page.evaluate((id) => { (window.camp.state as unknown as { enemies: { id: number; hp: number }[] }).enemies.find((e) => e.id === id)!.hp = 25; }, wolves.wolf);
  await expect.poll(async () => (await cr()).fx.hit).toBeGreaterThan(0);
  await page.evaluate((id) => { (window.camp.state as unknown as { enemies: { id: number; hp: number }[] }).enemies.find((e) => e.id === id)!.hp = 0; }, wolves.wolf);
  await expect.poll(async () => (await cr()).falls.some((f) => /^animal_wolf\/base\/die\//.test(f))).toBe(true);
  expect((await cr()).fx.dust).toBeGreaterThan(0); // the running wolves kick up dust

  // A hunt: a deer dies, plays `die`, then lies as a whole carcass; once emptied its bones stay a while.
  const deer = await page.evaluate(() => {
    const a = (window.camp.state as unknown as { animals: { id: number; kind: string; dead: boolean; hp: number; fleeing: number; path: unknown[] }[] }).animals.find((x) => x.kind === 'deer' && !x.dead)!;
    Object.assign(a, { dead: true, hp: 0, fleeing: 0, path: [] });
    return a.id;
  });
  await expect.poll(async () => (await cr()).animals[deer] ?? '').toMatch(/^animal_deer\/base\/die\//);
  await expect.poll(async () => (await cr()).animals[deer]).toBe('carcass_deer/stage1/00');
  await page.evaluate((id) => {
    const a = (window.camp.state as unknown as { animals: { id: number; meat: number; hides: number }[] }).animals.find((x) => x.id === id)!;
    a.meat = 0;
    a.hides = 0;
  }, deer);
  await expect.poll(async () => (await cr()).falls).toContain('carcass_deer/stage3/00');

  // A storm and a stampede (as a cast starts them), and the two allies.
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { tick: number; nextEnemyId: number; effects?: unknown[]; allies?: unknown[]; map: { fire: number[] } };
    const [fx, fy] = s.map.fire;
    s.effects ??= [];
    s.effects.push({ id: s.nextEnemyId++, kind: 'storm', x: fx + 2, y: fy - 10, dx: 0, dy: 0, expires: s.tick + 2000, hit: [] });
    s.effects.push({ id: s.nextEnemyId++, kind: 'bison', x: 5, y: fy + 8, dx: 1, dy: 0, expires: s.tick + 2000, hit: [] });
    s.allies ??= [];
    s.allies.push({ id: s.nextEnemyId++, kind: 'spirit', x: fx + 3, y: fy + 1, hp: 80, cooldown: 0, expires: s.tick + 2000 });
    s.allies.push({ id: s.nextEnemyId++, kind: 'guardian', x: fx + 4, y: fy + 1, hp: 40, cooldown: 0, expires: s.tick + 2000 });
  });
  await expect.poll(async () => (await cr()).herds.length).toBe(7);
  let c = await cr();
  expect(c.storms[0]).toMatch(/^fx_storm\/loop\/0\d$/);
  for (const f of c.herds) expect(f).toMatch(/^animal_bison\/base\/run\/se\/\d\d$/);
  expect(Object.values(c.allies).sort()[0]).toMatch(/^ally_spirit\/float\/0\d$/);
  expect(Object.values(c.allies).some((f) => /^animal_wolf\/base\//.test(f))).toBe(true);

  // A rider: a drafted, mounted lancer is drawn as the rider and gallops to a move order.
  const rider = await page.evaluate(() => {
    const s = window.camp.state as unknown as { people: { id: number; age: string; society: string | null; drafted: boolean; mounted?: boolean }[]; map: { fire: number[] } };
    const p = s.people.find((x) => x.age === 'adult')!;
    Object.assign(p, { society: 'lancers', drafted: true, mounted: true });
    window.camp.orders([{ type: 'move', ids: [p.id], to: [s.map.fire[0] - 12, s.map.fire[1] + 2] } as never]);
    return p.id;
  });
  const shown = (id: number) => page.evaluate((i) => window.camp.creatures().person(i), id);
  await expect.poll(async () => (await shown(rider))?.key).toBe('person_rider');
  await expect.poll(async () => (await shown(rider))?.anim).toBe('gallop');
  expect((await shown(rider))?.frame).toMatch(/^person_rider\/base\/gallop\//);

  // Horses: two free horses stand in a finished corral (the rider's is out).
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { horses: number; nextBuildingId: number; buildings: Record<string, unknown>[]; map: { fire: number[] } };
    s.horses = 3;
    s.buildings.push({ id: s.nextBuildingId++, type: 'horse_corral', x: s.map.fire[0] - 8, y: s.map.fire[1] - 6, done: true, built: 220, delivered: {}, workers: [], residents: [], tended: 0, hp: null });
  });
  await expect.poll(async () => (await cr()).horses.length).toBe(2);
  for (const f of (await cr()).horses) expect(f).toMatch(/^animal_horse\/base\/(idle|graze)\//);

  // A building finished: a sparkle.
  await page.evaluate(() => {
    const s = window.camp.state as unknown as { nextBuildingId: number; buildings: Record<string, unknown>[]; map: { fire: number[] } };
    s.buildings.push({ id: s.nextBuildingId++, type: 'trap', x: s.map.fire[0] + 8, y: s.map.fire[1] + 8, done: false, built: 0, delivered: {}, workers: [], residents: [], tended: 0, hp: null });
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => { (window.camp.state as unknown as { buildings: { type: string; done: boolean }[] }).buildings.find((b) => b.type === 'trap')!.done = true; });
  await expect.poll(async () => (await cr()).fx.sparkle).toBeGreaterThan(0);

  // Look at the storm and the allies.
  await page.evaluate(() => {
    const s = window.camp.state;
    const [fx, fy] = (s as unknown as { map: { fire: number[] } }).map.fire;
    const size = (s as unknown as { map: { size: number } }).map.size;
    const c = window.camp.scene as unknown as { cameras: { main: { centerOn: (x: number, y: number) => void; setZoom: (z: number) => void } } };
    c.cameras.main.setZoom(1);
    c.cameras.main.centerOn((fx - fy) * 32 + size * 32, (fx + fy) * 16 + 32 - 80);
  });
  c = await cr();
  await page.screenshot({ path: 'test-results/ac7-standins.png' });
  expect(errors).toEqual([]);
});
