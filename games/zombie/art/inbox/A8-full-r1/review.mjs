import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5248';
const prefix = process.argv[3] ?? '';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const checks = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const hasScene = (name) => page.waitForFunction((key) => window.dwGame?.scene.isActive(key), name, { timeout: 10000 });
const waitOptions = (expected) => page.waitForFunction((values) => {
  const current = JSON.parse(localStorage.getItem('deadwoods.options') ?? '{}');
  return Object.entries(values).every(([key, value]) => current[key] === value);
}, expected, { timeout: 5000 });

async function visibleFrame(scene, frame) {
  await page.waitForFunction(([key, name]) => {
    const find = (objects) => objects.some((object) => object.visible && (object.frame?.name === name
      || (Array.isArray(object.list) && find(object.list))));
    return find(window.dwGame.scene.getScene(key).children.list);
  }, [scene, frame], { timeout: 8000 });
}

async function capture(name, surfaces) {
  for (const [scene, frame] of surfaces) await visibleFrame(scene, frame);
  const file = `${prefix}${name}.png`;
  await writeFile(new URL(file, out), await page.screenshot());
  checks.push({ file, surfaces });
}

try {
  await page.goto(`${url}/?debug`);
  await hasScene('Menu');
  await page.evaluate(() => localStorage.setItem('deadwoods.save', JSON.stringify({
    version: 2, stage: 'base1', food: 5, scrap: 4, ammo: 0, cassGun: true,
  })));
  await page.reload();
  await hasScene('Menu');
  await page.keyboard.press('Enter');
  await hasScene('Base');
  await hasScene('ActionBar');
  await page.keyboard.press('F1');
  await visibleFrame('ActionBar', 'kit_button_disabled');
  const crouch = await page.evaluate(() => {
    const { slice } = window.dwGame.scene.getScene('ActionBar').slots.find(({ id }) => id === 'crouch').btn;
    return { x: slice.x + slice.displayWidth / 2, y: slice.y + slice.displayHeight / 2 };
  });
  await page.mouse.move(crouch.x, crouch.y);
  await capture('game-base-kit', [
    ['ActionBar', 'kit_button_active'], ['ActionBar', 'kit_button_disabled'],
    ['ActionBar', 'kit_tooltip'], ['Squad', 'kit_card'],
  ]);

  await page.keyboard.press('Escape');
  await hasScene('Pause');
  await page.mouse.click(640, 380);
  await capture('game-options-kit', [
    ['Pause', 'kit_panel'], ['Pause', 'kit_slider_track'], ['Pause', 'kit_slider_knob'],
    ['Pause', 'kit_check_off'], ['Pause', 'kit_check_on'],
  ]);
  await page.mouse.click(770, 190);
  await waitOptions({ master: 0.5 });
  await page.mouse.click(660, 322);
  await waitOptions({ mute: true });
  await page.mouse.click(700, 498);
  await waitOptions({ textSize: 125 });
  await page.mouse.click(700, 498);
  await waitOptions({ textSize: 150 });
  await capture('game-options-adjusted', [['Pause', 'kit_check_on'], ['Pause', 'kit_slider_knob']]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.dwGame.scene.isActive('Pause'), null, { timeout: 5000 });
  await capture('game-base-large-text', [['ActionBar', 'kit_panel'], ['Squad', 'kit_card']]);
  assert.deepEqual(errors, []);
  const interactions = ['Hover tooltip', 'Volume slider', 'Mute checkbox', 'Text size to 150%'];
  await writeFile(new URL(`${prefix}browser-checks.json`, out), `${JSON.stringify({ url, checks, interactions, errors }, null, 2)}\n`);
  console.log(`Passed ${checks.length} screenshot checks and ${interactions.length} interaction checks with no browser errors.`);
} finally {
  await browser.close();
}
