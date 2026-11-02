import { expect, test } from '@playwright/test';
import { idle, open, startNewGame } from './helpers';

test('a phone held upright is asked to turn sideways', async ({ page }) => {
  await page.goto('?debug');
  await expect(page.locator('#rotate')).toBeVisible();
});

test('on a phone held sideways the game fits, tap targets are large enough and taps work', async ({ page }) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 915, height: 412 });
  await open(page, errors);
  await expect(page.locator('#rotate')).toBeHidden();
  await startNewGame(page, true);
  await idle(page);
  for (const id of ['#mute-btn', '#reveal-btn', '#notebook-btn', '#menu-btn']) {
    const box = (await page.locator(id).boundingBox())!;
    expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
  }
  // The stage fits the screen above the bar.
  const stage = (await page.locator('#stage').boundingBox())!;
  expect(stage.width).toBeLessThanOrEqual(915);
  expect(stage.y + stage.height).toBeLessThanOrEqual(412);

  // Tapping a person opens the action ring with large buttons.
  const hero = await page.evaluate(() => {
    const { session } = (window as any).adventure;
    return { x: session.state.hero.x, y: session.state.hero.y - 40 };
  });
  const zoom = stage.width / 640;
  await page.touchscreen.tap(stage.x + hero.x * zoom, stage.y + hero.y * zoom);
  await expect(page.locator('#radial button.verb').first()).toBeVisible();
  const verb = (await page.locator('#radial button.verb').first().boundingBox())!;
  expect(verb.width).toBeGreaterThanOrEqual(44);
  expect(errors, errors.join('\n')).toEqual([]);
});
