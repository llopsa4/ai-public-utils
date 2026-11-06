import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureReady, idle, open, startNewGame } from './helpers';

async function battle(page: Page, errors: string[], handSize = 5, guided = false): Promise<void> {
  await open(page, errors);
  await startNewGame(page);
  await fixtureReady(page);
  await page.evaluate(({ handSize, guided }) => {
    const { session, chapters } = (window as any).adventure;
    const state = structuredClone(session.state);
    state.flags.fought = !guided;
    state.kit.owned.push('layered-armor');
    state.kit.equipment.armor = { id: 'layered-armor' };
    const encounter = chapters.ch1.encounters.hatchScavenger;
    if (!guided) {
      encounter.enemy.maxHp = 100;
      encounter.handSize = handSize;
      encounter.energyPerTurn = 20;
    }
    session.replaceState(state);
  }, { handSize, guided });
  await idle(page);
  await page.evaluate(() => { void (window as any).adventure.session.scene.runScript([{ type: 'fight', id: 'hatchScavenger' }]); });
  await expect(page.locator('#kc-root .combat-screen')).toBeVisible();
  await expect(page.locator('#kc-root button.card')).toHaveCount(handSize);
}

async function fits(page: Page, locator: Locator): Promise<void> {
  const box = (await locator.boundingBox())!, viewport = page.viewportSize()!;
  expect(box, await locator.getAttribute('class') ?? 'combat element').not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function compact(page: Page): Promise<void> {
  for (const selector of ['.hero-status', '.enemy-status', '#hand', '#end-turn']) await fits(page, page.locator(`#kc-root ${selector}`));
  const end = (await page.locator('#end-turn').boundingBox())!;
  expect(end.width).toBeGreaterThanOrEqual(44);
  expect(end.height).toBeGreaterThanOrEqual(44);
  const dimensions = await page.locator('#kc-root').evaluate(root => ({
    extraHeight: root.scrollHeight - root.clientHeight,
    extraWidth: root.scrollWidth - root.clientWidth,
    pageWidth: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(dimensions).toEqual({ extraHeight: 0, extraWidth: 0, pageWidth: 0 });
  const cards = await page.locator('#hand button.card').evaluateAll(cards => cards.map(card => {
    const box = card.getBoundingClientRect();
    return { width: box.width, height: box.height, clipped: card.scrollHeight > card.clientHeight + 1 };
  }));
  for (const card of cards) {
    expect(card.width).toBeGreaterThanOrEqual(44);
    expect(card.height).toBeGreaterThanOrEqual(44);
    expect(card.clipped, 'card text must fit vertically').toBe(false);
  }
}

test('combat scales health panels and cards on landscape screens without resetting the battle', { tag: ['@focused', '@art', '@runtime'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await battle(page, errors);
  const desktopPanel = (await page.locator('#kc-root .hero-status').boundingBox())!;
  const desktopCard = (await page.locator('#hand button.card').first().boundingBox())!;
  const before = await page.locator('#hand button.card').evaluateAll(cards => cards.map(card => card.getAttribute('data-card-id')));
  const hp = await page.locator('#enemy-hp').textContent();
  for (const viewport of [{ width: 844, height: 390 }, { width: 915, height: 412 }, { width: 667, height: 375 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await compact(page);
    expect((await page.locator('#kc-root .hero-status').boundingBox())!.width).toBeLessThan(desktopPanel.width);
    expect((await page.locator('#hand button.card').first().boundingBox())!.height).toBeLessThan(desktopCard.height);
    expect(await page.locator('#hand button.card').evaluateAll(cards => cards.map(card => card.getAttribute('data-card-id')))).toEqual(before);
    await expect(page.locator('#enemy-hp')).toHaveText(hp!);
    await page.screenshot({ path: info.outputPath(`combat-${viewport.width}x${viewport.height}.png`) });
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('a large phone hand stays in one horizontal strip and touch attacks remain usable after resize', { tag: ['@focused', '@phone', '@input', '@art', '@runtime'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 844, height: 390 });
  await battle(page, errors, 12);
  await compact(page);
  const strip = await page.locator('#hand').evaluate(hand => ({
    scrollable: hand.scrollWidth > hand.clientWidth,
    rows: new Set([...hand.querySelectorAll('button.card')].map(card => Math.round(card.getBoundingClientRect().top))).size,
  }));
  expect(strip).toEqual({ scrollable: true, rows: 1 });
  const attack = page.locator('#hand button.card.attack:not(:disabled)').first();
  await attack.scrollIntoViewIfNeeded();
  await attack.tap();
  await expect.poll(() => page.locator('#enemy-health-fill').evaluate(fill => Number(fill.parentElement!.getAttribute('aria-valuenow')))).toBeLessThan(100);
  await expect(page.locator('#kc-root .battlefield')).toHaveAttribute('data-phase', 'idle');
  await expect(page.locator('#hand button.card')).toHaveCount(11);
  await page.setViewportSize({ width: 915, height: 412 });
  await compact(page);
  const last = page.locator('#hand button.card').last();
  await last.scrollIntoViewIfNeeded();
  await fits(page, last);
  expect(await page.locator('#hand').evaluate(hand => hand.scrollLeft)).toBeGreaterThan(0);
  const hittable = await last.evaluate(card => {
    const box = card.getBoundingClientRect();
    return card.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  });
  expect(hittable, 'the last card is reachable without an overlay').toBe(true);
  await page.screenshot({ path: info.outputPath('phone-horizontal-hand.png') });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the compact guided fight keeps its prompt, intent and dialog controls tappable', { tag: ['@focused', '@phone', '@input', '@art', '@runtime'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 667, height: 375 });
  await battle(page, errors, 5, true);
  await compact(page);
  await fits(page, page.locator('#kc-root .lesson-banner'));
  const intent = page.locator('#intent');
  await fits(page, intent);
  await expect(intent).toHaveClass(/lesson-target/);
  await intent.tap();
  const dialog = page.locator('#kc-root dialog[open]');
  await expect(dialog).toBeVisible();
  // Measure the final tap target after the dialog's short entrance scale completes.
  await dialog.evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
  await fits(page, dialog);
  const close = dialog.locator('#close-modal');
  await fits(page, close);
  const closeBox = (await close.boundingBox())!;
  expect(closeBox.width).toBeGreaterThanOrEqual(44);
  expect(closeBox.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath('phone-guided-intent.png') });
  await close.tap();
  await expect(dialog).toHaveCount(0);
  const target = page.locator('#hand button.card.lesson-target');
  await fits(page, target);
  await target.tap();
  await expect.poll(() => page.locator('#enemy-health-fill').evaluate(fill => Number(fill.parentElement!.getAttribute('aria-valuenow')))).toBeLessThan(30);
  expect(errors, errors.join('\n')).toEqual([]);
});
