import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5238';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch();
const checks = [];
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const hasScene = (key) => page.waitForFunction((scene) => window.dwGame?.scene.isActive(scene), key);
const frameCount = (scene, frame) => page.evaluate(([key, name]) => {
  const gameScene = window.dwGame.scene.getScene(key);
  const count = (objects) => objects.reduce((total, object) => total
    + Number(object.frame?.name === name)
    + (Array.isArray(object.list) ? count(object.list) : 0), 0);
  return count(gameScene.children.list);
}, [scene, frame]);

async function capture(file, scene, frame) {
  await page.waitForFunction(([key, name]) => {
    const hasFrame = (objects) => objects.some((object) => object.frame?.name === name
      || (Array.isArray(object.list) && hasFrame(object.list)));
    return hasFrame(window.dwGame.scene.getScene(key).children.list);
  }, [scene, frame], { timeout: 5000 }).catch(async (error) => {
    const objects = await page.evaluate((key) => window.dwGame.scene.getScene(key).children.list
      .map((object) => ({ type: object.type, frame: object.frame?.name, texture: object.texture?.key })), scene);
    throw new Error(`${scene} did not draw ${frame}; objects: ${JSON.stringify(objects)}; browser errors: ${errors.join(' | ')}`, { cause: error });
  });
  const count = await frameCount(scene, frame);
  assert.ok(count, `${scene} should draw ${frame}`);
  const shot = await page.screenshot();
  await writeFile(new URL(`${file}.png`, out), shot);
  checks.push({ file: `${file}.png`, scene, frame, count });
}

try {
  await page.goto(`${url}/?debug`);
  await hasScene('Menu');
  await page.keyboard.press('Enter');
  await hasScene('Dialogue');
  await page.waitForFunction(() => window.dwGame.scene.getScene('Dialogue').body?.text.length > 0);
  await page.keyboard.press('Enter');
  await capture('game-intro-dialogue', 'Dialogue', 'kit_panel');

  await page.evaluate(() => localStorage.setItem('deadwoods.save', JSON.stringify({
    version: 2, stage: 'base1', food: 5, scrap: 4, ammo: 0, cassGun: true,
  })));
  await page.reload();
  await hasScene('Menu');
  await page.keyboard.press('Enter');
  await hasScene('Base');
  await hasScene('ActionBar');
  await page.keyboard.press('F1');
  await page.waitForFunction(() => window.dwGame.registry.get('m_bar')?.buttons.some((button) => !button.enabled));
  await capture('game-base-action-bar', 'ActionBar', 'kit_button_disabled');
  assert.ok(await frameCount('ActionBar', 'kit_panel'));

  await page.keyboard.press('Escape');
  await hasScene('Pause');
  await capture('game-pause-normal', 'Pause', 'kit_button_normal');
  await page.mouse.move(640, 230);
  await capture('game-pause-hover', 'Pause', 'kit_button_hover');
  await page.mouse.down();
  await capture('game-pause-pressed', 'Pause', 'kit_button_pressed');
  await page.mouse.up();
  await page.waitForFunction(() => !window.dwGame.scene.isActive('Pause'));
  assert.deepEqual(errors, []);
  await writeFile(new URL('browser-checks.json', out), `${JSON.stringify({ url, checks, errors }, null, 2)}\n`);
  console.log(`Passed ${checks.length} screenshot and frame checks with ${errors.length} browser errors.`);
} finally {
  await browser.close();
}
