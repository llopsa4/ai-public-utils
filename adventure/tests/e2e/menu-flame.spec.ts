import { expect, test } from '@playwright/test';
import { open } from './helpers';

test('title selection uses a small animated flame for hover and focus, with a reduced-motion still', { tag: ['@focused', '@art', '@input'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await open(page, errors);
  const entry = page.locator('#title-new');
  const marker = () => entry.evaluate(button => {
    const style = getComputedStyle(button, '::before');
    return { image: style.backgroundImage, opacity: style.opacity, width: parseFloat(style.width), height: parseFloat(style.height), font: parseFloat(getComputedStyle(button).fontSize), shadow: style.boxShadow };
  });
  await page.mouse.move(0, 0);
  await entry.evaluate(button => (button as HTMLButtonElement).blur());
  await expect.poll(async () => (await marker()).opacity).toBe('0');
  await entry.hover();
  await expect.poll(async () => (await marker()).opacity).toBe('1');
  const hover = await marker();
  expect(hover.image).toMatch(/menu-flame.*\.gif/);
  expect(hover.shadow).toBe('none');
  expect(hover.width / hover.font).toBeCloseTo(0.45 * Math.SQRT2, 2);
  expect(hover.height).toBeCloseTo(hover.width, 2);
  const asset = await page.request.get(hover.image.slice(5, -2));
  expect(asset.ok()).toBe(true);
  expect((await asset.body()).subarray(0, 6).toString()).toBe('GIF89a');
  await page.screenshot({ path: info.outputPath('title-flame.png'), animations: 'allow' });
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await entry.focus();
  await expect.poll(async () => (await marker()).opacity).toBe('1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await marker()).image).toMatch(/menu-flame-still.*\.png/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => document.documentElement.classList.add('reduce-motion'));
  expect((await marker()).image).toMatch(/menu-flame-still.*\.png/);
  await entry.click();
  await expect(page.locator('#intro-skip')).toBeVisible();
  expect(errors).toEqual([]);
});
