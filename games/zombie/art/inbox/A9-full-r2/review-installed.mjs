import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5272';
const out = new URL('./', import.meta.url);
const hashes = JSON.parse(await readFile(new URL('installation-checks.json', out), 'utf8')).textures;
const browser = await chromium.launch();
const errors = [];
const checks = [];

async function visit(stage, sceneName, requiredIcons) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript((stage) => {
    localStorage.setItem('deadwoods.save', JSON.stringify({
      version: 2, stage, food: 5, scrap: 4, ammo: 5, cassGun: true,
    }));
  }, stage);
  await page.goto(`${url}/?debug`);
  await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
  await page.keyboard.press('Enter');
  await page.waitForFunction((name) => window.dwGame.scene.isActive(name), sceneName);
  await page.keyboard.press('F1');
  const frames = await page.waitForFunction((required) => {
    function findFrames(objects) {
      return objects.flatMap((object) => [
        object.visible && /^icon_(bar|hud)_/.test(object.frame?.name) ? object.frame.name : null,
        ...(Array.isArray(object.list) ? findFrames(object.list) : []),
      ]).filter(Boolean);
    }
    const game = window.dwGame;
    const visible = game.scene.getScenes(true).flatMap((s) => findFrames(s.children.list));
    return required.every((name) => visible.includes(name)) && game.textures.get('ui').getFrameNames();
  }, requiredIcons);
  const atlasFrames = await frames.jsonValue();
  const icons = Object.keys(hashes).filter((name) => name.startsWith('icon_'));
  assert.equal(icons.length, 24);
  assert.ok(icons.every((name) => atlasFrames.includes(name)));

  if (sceneName === 'Base') {
    await page.mouse.move(640, 360);
    await page.keyboard.press('v');
    const cursor = await page.waitForFunction(() => {
      const cursor = window.dwGame.canvas.style.cursor;
      return cursor.includes('cursor_attack.png') && cursor;
    });
    const style = await cursor.jsonValue();
    assert.match(style, /\) 16 16, crosshair$/);
    const imageUrl = style.match(/url\("([^"]+)"\)/)[1];
    const response = await page.request.get(new URL(imageUrl, page.url()).href);
    assert.ok(response.ok());
    assert.deepEqual(await response.body(), await readFile(new URL('../../frames/ui/cursor_attack.png', out)));
    checks.push({ cursor: style, action: 'V targeting order' });
    await page.mouse.click(640, 360, { button: 'right' });
  }
  const screenshot = `installed-game-${stage}.png`;
  await writeFile(new URL(screenshot, out), await page.screenshot());
  checks.push({ scene: sceneName, atlasIconCount: icons.length, requiredIcons, screenshot });
  await page.close();
}

try {
  await visit('base1', 'Base', ['icon_bar_fix', 'icon_hud_hunger', 'icon_hud_hp']);
  await visit('mission1', 'Mission', ['icon_bar_takedown', 'icon_hud_crate', 'icon_hud_zombie']);
  assert.deepEqual(errors, []);
  await writeFile(new URL('installed-browser-checks.json', out), `${JSON.stringify({ url, checks, errors }, null, 2)}\n`);
} finally {
  await browser.close();
}
