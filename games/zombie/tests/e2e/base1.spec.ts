import { expect, type Page, test } from '@playwright/test';

// Z44: Continue -> Base 1 (arrival beat), stepped through the herd warning and the herd's arrival,
// pause and resume, and the save round trip (reload + Continue resumes at the herd warning).
// The sim is driven with dw.step: a headless tab throttles frames, so wall-clock time is not used for it.

const SAVE_KEY = 'deadwoods.save';
const WARN_TICK = 3000; // data/base1.json herd.warnAt 300 s at 10 ticks per second
const ARRIVE_TICK = 4200; // herd.arriveAt 420 s

type Game = { scene: { isActive(key: string): boolean } };

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** The title menu with a Base 1 save in the slot (Cass has not taken her gun yet), then Continue until Base starts. */
async function continueToBase(page: Page, seed: boolean): Promise<void> {
  if (seed) {
    await page.goto('/');
    await page.evaluate(
      ([key]) => localStorage.setItem(key!, JSON.stringify({ version: 2, stage: 'base1', food: 5, scrap: 4, ammo: 5, cassGun: false })),
      [SAVE_KEY],
    );
  }
  await page.goto('/?debug');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas has no box');
  // With a save the Continue button is the centre button (game y = 360 of 720). Boot loads the atlases first,
  // so an early click is lost: retry until Base installs window.dw.
  for (let i = 0; i < 30 && !(await page.evaluate(() => typeof window.dw !== 'undefined')); i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => typeof window.dw !== 'undefined', null, { timeout: 15_000 });
}

/** Closes every open dialogue with Enter. */
async function closeDialogues(page: Page): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (!(await page.evaluate(() => (window as unknown as { dwGame: Game }).dwGame.scene.isActive('Dialogue')))) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error('a dialogue would not close');
}

/** Steps the sim in chunks up to `tick`; before the herd the roamers are removed so the idle survivors live. */
async function stepTo(page: Page, tick: number): Promise<void> {
  for (let guard = 0; guard < 200; guard++) {
    const now = await page.evaluate(() => window.dw!.state.tick);
    if (now >= tick) return;
    await page.evaluate((k) => {
      const dw = window.dw!;
      const enemies = dw.state.enemies as { id: string }[];
      for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i]!.id.startsWith('r')) enemies.splice(i, 1);
      dw.step(k);
    }, Math.min(100, tick - now));
  }
  throw new Error(`could not reach tick ${tick}`);
}

const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as { cassGun: boolean; checkpoint: { tick: number; herd: { warned: boolean } } | null } | null, SAVE_KEY);

test('Base 1: arrival, herd warning, herd arrival, pause, save round trip', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);

  // Continue lands in Base 1 and plays the arrival beat once (it unlocks and saves Cass's gun).
  await continueToBase(page, true);
  await page.waitForFunction(() => (window as unknown as { dwGame: Game }).dwGame.scene.isActive('Dialogue'), null, { timeout: 15_000 });
  await closeDialogues(page);
  await expect.poll(async () => (await saved(page))?.cassGun).toBe(true);
  expect((await saved(page))?.checkpoint).toBeNull();

  // Prep minutes: no checkpoint yet, the herd is not warned.
  await stepTo(page, WARN_TICK - 50);
  expect(await page.evaluate(() => (window.dw!.state.herd as { warned: boolean }).warned)).toBe(false);
  expect((await saved(page))?.checkpoint).toBeNull();

  // The warning: the dialogue opens, the checkpoint is written into the save at that tick.
  await stepTo(page, WARN_TICK + 10);
  await page.waitForFunction(() => (window as unknown as { dwGame: Game }).dwGame.scene.isActive('Dialogue'), null, { timeout: 15_000 });
  await closeDialogues(page);
  const cp = (await saved(page))?.checkpoint;
  expect(cp?.herd.warned).toBe(true);
  expect(cp!.tick).toBeGreaterThanOrEqual(WARN_TICK);
  expect(cp!.tick).toBeLessThan(WARN_TICK + 100);

  // The herd arrives from its rolled edge (Z65).
  await stepTo(page, ARRIVE_TICK + 60);
  const herd = await page.evaluate(() => (window.dw!.state.enemies as { id: string }[]).filter((e) => e.id.startsWith('h')).length);
  expect(herd).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.dw!.state.status)).toBe('playing');

  // Esc opens the pause menu and the sim stops; Esc again resumes it.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => (window as unknown as { dwGame: Game }).dwGame.scene.isActive('Pause'), null, { timeout: 5_000 });
  const frozen = await page.evaluate(() => window.dw!.state.tick);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.dw!.state.tick)).toBe(frozen);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !(window as unknown as { dwGame: Game }).dwGame.scene.isActive('Pause'), null, { timeout: 5_000 });
  await expect.poll(() => page.evaluate(() => window.dw!.state.tick), { timeout: 15_000 }).toBeGreaterThan(frozen);

  // Save round trip: reload and Continue resume at the herd warning, with no dialogue and nothing lost.
  await continueToBase(page, false);
  const resumed = await page.evaluate(() => ({ tick: window.dw!.state.tick, warned: (window.dw!.state.herd as { warned: boolean }).warned, status: window.dw!.state.status }));
  expect(resumed.warned).toBe(true);
  expect(resumed.status).toBe('playing');
  expect(resumed.tick).toBeGreaterThanOrEqual(cp!.tick);
  expect(resumed.tick).toBeLessThan(cp!.tick + 100);
  expect(await page.evaluate(() => (window as unknown as { dwGame: Game }).dwGame.scene.isActive('Dialogue'))).toBe(false);

  expect(errors).toEqual([]);
});
