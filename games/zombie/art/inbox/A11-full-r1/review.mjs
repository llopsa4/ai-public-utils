import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5284/?debug';
const output = new URL('./', import.meta.url);
const browser = await chromium.launch();
const errors = [];
const results = [];

async function openMenu(stage) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  if (stage) {
    await page.addInitScript(stage => {
      const save = { version: 2, stage, food: 0, scrap: 0, ammo: 0, cassGun: false, checkpoint: null };
      localStorage.setItem('deadwoods.save', JSON.stringify(save));
    }, stage);
  }
  await page.goto(url);
  await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
  return page;
}

async function capture(page, name, scene, veil, labels) {
  const draw = await page.evaluate(({ scene, labels }) => {
    const children = window.dwGame.scene.getScene(scene).children.list;
    function image(key) {
      const sprite = children.find(child => child.texture?.key === key);
      return sprite && {
        source: [sprite.width, sprite.height],
        display: [sprite.displayWidth, sprite.displayHeight],
        nearest: sprite.texture.source[0].scaleMode === Phaser.Textures.FilterMode.NEAREST,
      };
    }
    return {
      background: image('title_bg'),
      logo: image('title_logo') ?? null,
      veil: children.find(child => child.type === 'Rectangle' && child.width === 1280 && child.height === 720)?.fillAlpha,
      labels: labels.every(label => children.some(child => child.text === label)),
      standInNote: children.some(child => child.text?.includes('grey placeholders')),
    };
  }, { scene, labels });
  assert.deepEqual(draw, {
    background: { source: [640, 360], display: [1280, 720], nearest: true },
    logo: scene === 'Menu' ? { source: [400, 120], display: [800, 240], nearest: true } : null,
    veil,
    labels: true,
    standInNote: false,
  });
  const file = name + '.png';
  await writeFile(new URL(file, output), await page.screenshot());
  results.push({ file, scene, ...draw });
}

const click = (page, y) => page.mouse.click(640, y);

try {
  const fresh = await openMenu();
  await capture(fresh, 'title-menu', 'Menu', 0.1, ['New Game', 'Options']);
  await click(fresh, 456);
  await capture(fresh, 'title-options', 'Menu', 0.55, ['Back']);
  await fresh.close();

  const saved = await openMenu('intro');
  await capture(saved, 'title-continue', 'Menu', 0.1, ['Continue', 'New Game']);
  await click(saved, 484);
  await capture(saved, 'title-confirm', 'Menu', 0.55, ['Yes, new game', 'Cancel']);
  await saved.keyboard.press('Escape');
  await click(saved, 380);
  await saved.waitForFunction(() => !!window.dw?.state.say);
  await saved.keyboard.press('Escape');
  await saved.waitForFunction(() => window.dw.state.say === null);
  await saved.keyboard.press('Escape');
  await saved.waitForFunction(() => window.dwGame.scene.isActive('Pause'));
  await capture(saved, 'title-pause', 'Pause', 0.8, ['PAUSED', 'Resume']);
  await saved.close();

  const complete = await openMenu('done');
  await click(complete, 380);
  await capture(complete, 'title-done', 'Menu', 0.55, ['Replay Base 1', 'Menu']);
  await complete.close();

  assert.deepEqual(errors, []);
  await writeFile(new URL('browser-checks.json', output), JSON.stringify({ url, results, errors }, null, 2) + '\n');
  console.log('Verified ' + results.length + ' title and pause screens with no browser errors.');
} finally {
  await browser.close();
}
