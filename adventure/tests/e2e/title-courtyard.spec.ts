import { expect, test } from '@playwright/test';
import { open, startNewGame } from './helpers';

for (const phone of [false, true]) test(`Ironhaven title has the empty courtyard, an animated flag and fire, and no characters${phone ? ' on phone' : ''}`, {
  tag: ['@focused', '@art', '@runtime', ...(phone ? ['@phone'] : [])],
}, async ({ page }, info) => {
  if (phone) await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  await open(page, errors).catch(error => { throw new Error(`${errors.join('\n')}\n${error}`); });
  const state = () => page.evaluate(() => {
    const scene = (window as any).adventure.game.scene.getScene('title');
    const children = scene.children.list;
    const flag = children.find((child: any) => child.texture?.key === 'title-flag');
    const fire = children.find((child: any) => child.texture?.key === 'fx-glow');
    return { textures: children.filter((child: any) => child.texture).map((child: any) => child.texture.key),
      flagFrame: flag.frame.name, playing: flag.anims.isPlaying, alpha: fire.alpha };
  });
  const initial = await state();
  expect(initial.textures).toContain('title-courtyard');
  // Mara's gauntlet is off the title for now (scenes.ts TITLE_ARTIFACTS, `shown`).
  expect(initial.textures.filter((key: string) => key === 'title-gauntlet')).toHaveLength(0);
  expect(initial.textures.some((key: string) => /^(mara|hero|extra-|oren|nell|tobi)/.test(key))).toBe(false);
  await expect.poll(async () => (await state()).playing).toBe(true);
  await expect.poll(async () => (await state()).flagFrame).not.toBe(initial.flagFrame);
  await expect.poll(async () => (await state()).alpha).not.toBe(initial.alpha);
  for (const selector of ['#title-name', '#title-new', '#title-settings']) {
    const box = (await page.locator(selector).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
  await page.screenshot({ path: info.outputPath('ironhaven-title.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await state()).playing).toBe(false);
  await expect.poll(async () => (await state()).alpha).toBe(0.2);
  expect(String((await state()).flagFrame)).toBe('0');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(async () => (await state()).playing).toBe(true);
  await startNewGame(page, phone);
  await expect(page.locator('#title')).toBeHidden();
  await expect(page.locator('#intro')).toBeHidden();
  await page.evaluate(() => (window as any).adventure.session.toTitle());
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#title-continue')).toBeVisible();
  for (const selector of ['#title-name', '#title-continue', '#title-settings', '#title-save']) {
    const box = (await page.locator(selector).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  }
  await page.locator('#title').evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished));
  });
  await page.screenshot({ path: info.outputPath('ironhaven-continue-title.png') });
  await page.locator('#title-continue').click();
  await expect(page.locator('#title')).toBeHidden();
  expect(errors).toEqual([]);
});

test('After every page load the title waits for "click anywhere to begin", then shows the options', {
  tag: ['@focused', '@runtime'],
}, async ({ page }) => {
  // Look like a player's browser: automated ones skip the prompt (src/ui/ui.ts showTitle).
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  const errors: string[] = [];
  await open(page, errors);
  await expect(page.locator('#title-begin')).toHaveText('Click anywhere to begin');
  await expect(page.locator('#title-new')).toBeHidden();
  await page.mouse.click(200, 200);
  await expect(page.locator('#title-begin')).toBeHidden();
  await expect(page.locator('#title-new')).toBeVisible();
  await expect(page.locator('#title')).toBeVisible();
  await page.reload();
  await expect(page.locator('#title-begin')).toBeVisible();
  expect(errors).toEqual([]);
});
