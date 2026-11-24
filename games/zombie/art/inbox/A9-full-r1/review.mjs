import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5267';
const out = process.argv[3] ? pathToFileURL(process.argv[3] + sep) : new URL('./', import.meta.url);
const browser = await chromium.launch();
const checks = [];
const errors = [];
const seen = new Set();

async function reviewPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return page;
}

async function gallery() {
  const page = await reviewPage();
  await page.goto(`${url}/a9-review.html`);
  const images = await page.locator('li img').evaluateAll(async (nodes) => {
    await Promise.all(nodes.map((image) => image.decode()));
    return nodes.map((image) => [image.naturalWidth, image.naturalHeight]);
  });
  assert.deepEqual(images, [
    ...Array.from({ length: 16 }, () => [96, 96]),
    ...Array.from({ length: 8 }, () => [48, 48]),
    ...Array.from({ length: 5 }, () => [32, 32]),
  ]);
  const cursors = await page.locator('.cursor li').evaluateAll((nodes) =>
    nodes.map((tile) => getComputedStyle(tile).cursor));
  for (const [index, name] of ['select', 'attack', 'use', 'move', 'run'].entries()) {
    assert.match(cursors[index], new RegExp(`cursor_${name}\\.png(?:\\?[^"]*)?"\\) ${index === 0 ? '6 3' : '16 16'}, auto`));
  }
  const screenshot = 'gallery.png';
  await writeFile(new URL(screenshot, out), await page.screenshot({ fullPage: true }));
  checks.push({ screenshot, images: images.length, cursors });
  await page.close();
}

async function scene(page, stage, sceneName, textSize = 100) {
  await page.addInitScript((size) => {
    localStorage.setItem('deadwoods.options', JSON.stringify({ textSize: size }));
  }, textSize);
  await page.goto(`${url}/?a9=${stage}&debug`);
  await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
  await page.keyboard.press('Enter');
  await page.waitForFunction((name) => window.dwGame.scene.isActive(name), sceneName);
  await page.waitForFunction(() => window.dwGame.scene.isActive('ActionBar'));
}

async function capture(page, screenshot, requirements) {
  const handle = await page.waitForFunction((names) => {
    function frames(objects) {
      return objects.flatMap((object) => [
        object.visible && /^icon_(bar|hud)_/.test(object.frame?.name) ? object.frame.name : null,
        ...(Array.isArray(object.list) ? frames(object.list) : []),
      ]).filter(Boolean);
    }
    const game = window.dwGame;
    const icons = [
      ...new Set(game.scene.getScenes(true).flatMap((s) => frames(s.children.list))),
    ];
    return names.every((name) => icons.includes(name)) && icons;
  }, requirements, { timeout: 10000 });
  const icons = await handle.jsonValue();
  icons.forEach((name) => seen.add(name));
  await writeFile(new URL(screenshot, out), await page.screenshot());
  checks.push({ screenshot, icons });
}

try {
  await gallery();

  const base = await reviewPage();
  await scene(base, 'base1', 'Base');
  await base.keyboard.press('F1');
  await capture(base, 'game-base-fighter.png', ['icon_bar_knife', 'icon_bar_gun', 'icon_bar_fix', 'icon_hud_hunger']);
  const cursors = await base.evaluate(async () => {
    const { canvas, scene } = window.dwGame;
    const view = scene.getScene('Base').view;
    const values = {};
    for (const mode of ['pointer', 'crosshair', 'grab', 'move']) {
      view.setCursor(mode);
      values[mode] = canvas.style.cursor;
    }
    for (const value of Object.values(values)) {
      const source = value.match(/url\("([^"]+)"\)/)?.[1];
      if (!source) throw new Error(`Missing custom cursor in ${value}`);
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Could not load ${source}`);
    }
    return values;
  });
  for (const [mode, name] of Object.entries({ pointer: 'select', crosshair: 'attack', grab: 'use', move: 'move' })) {
    assert.match(cursors[mode], new RegExp(`cursor_${name}\\.png(?:\\?[^"]*)?"\\) ${mode === 'pointer' ? '6 3' : '16 16'}, ${mode}`));
  }
  checks.push({ runtimeCursors: cursors, method: 'Base view controller' });

  await base.mouse.move(640, 360);
  await base.keyboard.press('v');
  await base.waitForFunction(() => window.dwGame.canvas.style.cursor.includes('cursor_attack.png'));
  await base.mouse.click(640, 360, { button: 'right' });
  checks.push({ input: 'V targeting order', cursor: 'cursor_attack' });

  await base.evaluate(() => { window.dw.state.herd.warned = true; });
  await capture(base, 'game-base-herd.png', ['icon_hud_herd']);
  await base.close();

  const large = await reviewPage();
  await scene(large, 'base1', 'Base', 150);
  await large.keyboard.press('F1');
  await capture(large, 'game-base-large-text.png', ['icon_bar_barricade', 'icon_bar_cook']);
  await large.close();

  const mission = await reviewPage();
  await scene(mission, 'mission1', 'Mission');
  await mission.keyboard.press('F1');
  await capture(mission, 'game-mission-fighter.png', ['icon_bar_takedown', 'icon_bar_carry', 'icon_hud_zombie', 'icon_hud_crate']);
  await mission.keyboard.press('F2');
  await capture(mission, 'game-mission-scout.png', ['icon_bar_club', 'icon_bar_lure', 'icon_hud_zombie', 'icon_hud_crate']);
  await mission.close();

  assert.equal(seen.size, 24, `Only found ${seen.size} icon frames in the game: ${[...seen].sort().join(', ')}`);
  assert.deepEqual(errors, []);
  await writeFile(new URL('browser-checks.json', out), `${JSON.stringify({ url, checks, errors }, null, 2)}\n`);
} finally {
  await browser.close();
}
