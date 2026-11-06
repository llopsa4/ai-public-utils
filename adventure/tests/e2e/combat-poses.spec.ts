import { expect, test, type Page } from '@playwright/test';
import { fixtureReady, idle, open, startNewGame } from './helpers';

/** Enter the real battle bridge with a full hand, isolating presentation from the story lesson. */
async function battle(page: Page, errors: string[], hp = 100): Promise<void> {
  await open(page, errors);
  await startNewGame(page);
  await fixtureReady(page);
  await page.evaluate(hp => {
    const { session, chapters } = (window as any).adventure;
    const state = structuredClone(session.state);
    state.flags.fought = true;
    state.kit.owned.push('layered-armor');
    state.kit.equipment.armor = { id: 'layered-armor' };
    const encounter = chapters.ch1.encounters.hatchScavenger;
    encounter.enemy.maxHp = hp;
    encounter.handSize = 12;
    encounter.energyPerTurn = 20;
    session.replaceState(state);
  }, hp);
  await idle(page);
  await page.evaluate(() => { void (window as any).adventure.session.scene.runScript([{ type: 'fight', id: 'hatchScavenger' }]); });
  await expect(page.locator('#kc-root .combat-screen')).toBeVisible();
  await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'lower');
  await expect(page.locator('#kc-root button.card:not(:disabled)')).toHaveCount(12);
  // Freeze JavaScript time after React and the lazy battle bundle have mounted.
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
}

const field = (page: Page) => page.locator('#kc-root .battlefield');
const hp = (page: Page) => page.locator('#enemy-health-fill').evaluate(el => Number(el.parentElement!.getAttribute('aria-valuenow')));
const card = (page: Page, name: string) => page.locator('#kc-root button.card', { has: page.locator('.card-name', { hasText: name }) }).first();

async function play(page: Page, name: string): Promise<void> {
  await card(page, name).evaluate((button: HTMLButtonElement) => button.click());
  await expect(field(page)).toHaveAttribute('data-phase', 'approach');
  await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'upper');
}

/** Browser CSS timelines are separate from page.clock's JavaScript timers. */
async function contactMotion(page: Page, elapsed: number): Promise<void> {
  await page.locator('#kc-root .fighter-motion').evaluateAll((elements, elapsed) => {
    for (const element of elements) for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = elapsed;
    }
  }, elapsed);
}

test('offensive cards approach in upper guard, hold the punch for 500ms, and return low before unlocking', { tag: ['@focused', '@art', '@input', '@runtime'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await battle(page, errors);
  for (const name of ['Knuckle Drive', 'Piston Strike', 'Kiln Pulse']) {
    const before = await hp(page);
    await play(page, name);
    await expect(page.locator('#end-turn')).toBeDisabled();
    await page.clock.runFor(199);
    expect(await hp(page)).toBe(before);
    await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'upper');
    await expect(page.locator('#kc-root .enemy > .contact-burst')).toHaveCount(0);
    await expect(page.locator('#action-flash')).toHaveText('');
    await page.clock.runFor(1);
    await expect(field(page)).toHaveAttribute('data-phase', 'contact');
    await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'punch');
    await expect(page.locator('#kc-root .enemy > .contact-burst')).toHaveCount(1);
    await expect(page.locator('#action-flash')).not.toHaveText('');
    await expect(page.locator('#kc-root .intent')).toBeHidden();
    expect(await page.locator('#kc-root .hero-motion').evaluate(el => getComputedStyle(el).animationName)).toBe('adventure-attack-travel');
    expect(await page.locator('#kc-root .enemy-motion').evaluate(el => getComputedStyle(el).animationName)).toBe('adventure-contact-recoil');
    expect(await hp(page)).toBeLessThan(before);
    await expect(page.locator('#hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('#hero-art').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await contactMotion(page, 200);
    await page.screenshot({ path: info.outputPath(`contact-${name.replaceAll(' ', '-').toLowerCase()}.png`), animations: 'allow' });
    // Synthetic duplicate input must remain rejected during the contact hold.
    await page.locator('#end-turn').evaluate((button: HTMLButtonElement) => button.click());
    await page.clock.runFor(499);
    await expect(field(page)).toHaveAttribute('data-phase', 'contact');
    await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'punch');
    await page.clock.runFor(1);
    await expect(field(page)).toHaveAttribute('data-phase', 'return');
    await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'lower');
    await page.clock.runFor(199);
    await expect(page.locator('#end-turn')).toBeDisabled();
    await page.clock.runFor(1);
    await expect(field(page)).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('#end-turn')).toBeEnabled();
    await expect(page.locator('#kc-root .intent')).toBeVisible();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('a lethal punch finishes its contact hold and return before the victory screen appears', { tag: ['@focused', '@story', '@runtime', '@art'] }, async ({ page }) => {
  const errors: string[] = [];
  await battle(page, errors, 1);
  await play(page, 'Knuckle Drive');
  expect(await hp(page)).toBe(1);
  await page.clock.runFor(200);
  expect(await hp(page)).toBe(0);
  await expect(page.locator('#kc-root .kc-victory')).toHaveCount(0);
  await page.clock.runFor(699);
  await expect(page.locator('#kc-root .kc-victory')).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(page.locator('#kc-root .kc-victory')).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
});

test('phone combat keeps the punch inside the viewport and reduced motion retains the pose sequence', { tag: ['@focused', '@phone', '@art', '@runtime'] }, async ({ page }, info) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  await battle(page, errors);
  await play(page, 'Knuckle Drive');
  await page.clock.runFor(250);
  await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'punch');
  await contactMotion(page, 250);
  // Phone combat is intentionally scrollable; inspect the whole sprite on its battlefield.
  await page.locator('#hero-art').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('phone-punch.png'), animations: 'allow' });
  const box = (await page.locator('#hero-art').boundingBox())!;
  const arena = (await field(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(845);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(391);
  expect(box.x).toBeGreaterThanOrEqual(arena.x);
  expect(box.x + box.width).toBeLessThanOrEqual(arena.x + arena.width);
  expect(box.y).toBeGreaterThanOrEqual(arena.y);
  expect(box.y + box.height).toBeLessThanOrEqual(arena.y + arena.height);
  await page.clock.runFor(650);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.documentElement.classList.add('reduce-motion'));
  await play(page, 'Piston Strike');
  await page.clock.runFor(250);
  await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'punch');
  expect(await page.locator('#kc-root .hero-motion').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('#hero-art').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('phone-reduced-motion-punch.png'), animations: 'allow' });
  await page.clock.runFor(650);
  await expect(page.locator('#hero-art')).toHaveAttribute('data-pose', 'lower');
  await expect(page.locator('#end-turn')).toBeEnabled();
  expect(errors, errors.join('\n')).toEqual([]);
});
