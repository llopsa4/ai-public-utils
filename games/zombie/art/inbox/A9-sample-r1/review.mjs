import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5263';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch();
const checks = [];
const errors = [];

async function review(textSize, expectedIconSize) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.addInitScript((size) => {
    localStorage.setItem('deadwoods.options', JSON.stringify({ textSize: size }));
  }, textSize);
  await page.goto(`${url}/?a9&debug`);
  await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.dwGame.scene.isActive('ActionBar'));
  await page.keyboard.press('F1');
  const keys = ['knife', 'gun', 'crouch', 'fix'];
  const icons = await page.waitForFunction((names) => {
    const slots = window.dwGame.scene.getScene('ActionBar').slots;
    const icons = names.map((name) => {
      const icon = slots.find((slot) => slot.icon?.frame.name === `icon_bar_${name}`)?.icon;
      return icon && { name, width: icon.displayWidth, height: icon.displayHeight, x: icon.x, y: icon.y };
    });
    return icons.every(Boolean) && icons;
  }, keys);
  const frames = await icons.jsonValue();
  for (const frame of frames) {
    assert.equal(frame.width, expectedIconSize);
    assert.equal(frame.height, frame.width);
  }
  const screenshot = `game-base-action-bar-${textSize}.png`;
  await page.screenshot({ path: new URL(screenshot, out).pathname.replace(/^\/(?=[A-Z]:)/i, '') });
  checks.push({ scene: 'Base', textSize, screenshot, frames });
  await page.close();
}

try {
  await review(100, 48);
  await review(150, 68);
  assert.deepEqual(errors, []);
  await writeFile(new URL('browser-checks.json', out), `${JSON.stringify({ url, checks, errors }, null, 2)}\n`);
} finally {
  await browser.close();
}
