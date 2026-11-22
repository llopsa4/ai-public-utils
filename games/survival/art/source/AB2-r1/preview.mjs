// Review the candidate interface in a disposable game snapshot using the normal atlas loader.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { packGroup } from '../../../scripts/art/pack-lib.mjs';

const game = fileURLToPath(new URL('../../../', import.meta.url));
const art = path.join(game, 'art');
const inbox = path.join(art, 'inbox', 'AB2');
const scratch = path.join(game, 'test-results');
fs.mkdirSync(scratch, { recursive: true });
const temp = fs.mkdtempSync(path.join(scratch, 'ab2-preview-'));
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = read(path.join(art, 'manifest.json'));
const { keys } = read(path.join(inbox, 'delivery.json'));
const tempArt = path.join(temp, 'art');
const atlasDir = path.join(tempArt, 'atlas');
fs.mkdirSync(tempArt);
for (const entry of ['src', 'vite.config.ts', 'package.json']) {
  fs.cpSync(path.join(game, entry), path.join(temp, entry), { recursive: true });
}
fs.cpSync(path.join(art, 'atlas'), atlasDir, { recursive: true });
const ui = Object.keys(manifest).filter((k) => manifest[k].atlas === 'ui' &&
  (keys.includes(k) || manifest[k].status === 'final'));
const dirFor = (k) => keys.includes(k) ? path.join(inbox, k)
  : path.join(art, 'inbox', 'done', `${manifest[k].batch}-r${manifest[k].revision}`, k);
packGroup(manifest, 'ui', ui, dirFor, atlasDir);
for (const key of keys) manifest[key].status = 'final';
fs.writeFileSync(path.join(tempArt, 'manifest.json'), JSON.stringify(manifest));

const server = await createServer({
  configFile: path.join(temp, 'vite.config.ts'),
  cacheDir: path.join(temp, '.vite'),
  server: { host: '127.0.0.1', port: 5199, fs: { allow: [game] } },
});
let browser;
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/?debug`;
  browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [width, height] of [[1280, 720], [2560, 1440]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url);
    const canvas = page.locator('#game canvas');
    await page.waitForFunction(() => window.menu?.buttons()['slot1.new']);
    const box = await canvas.boundingBox();
    assert.equal(box.width, width);
    assert.equal(box.height, height);
    await canvas.screenshot({ path: path.join(inbox, `menu-${width}.png`) });
    const [x, y] = await page.evaluate(() => window.menu.buttons()['slot1.new']);
    await page.mouse.click(box.x + x * box.width / 1280, box.y + y * box.height / 720);
    await page.waitForFunction(() => window.camp?.state.people.length === 20 && window.camp?.buildMenu);
    const live = await page.evaluate((keys) => {
      const camp = window.camp;
      camp.state.paused = true;
      camp.state.tick = 3600;
      camp.selectPeople(camp.state.people.filter((person) => person.age === 'adult').slice(0, 2).map((person) => person.id));
      return keys.filter(key => !camp.scene.textures.get('ui').has(key));
    }, keys);
    assert.deepEqual(live, []);
    await page.waitForFunction(() => window.camp.buildMenu().shown.length > 0 && !!window.camp.minimap());
    await page.waitForTimeout(700);
    await canvas.screenshot({ path: path.join(inbox, `camp-${width}.png`) });
    const cursorChecks = await page.evaluate(async () => {
      const cursors = await import('/render/cursors.ts');
      return cursors.installedCursors().map(kind => {
        cursors.showCursor(window.camp.scene, kind);
        const css = window.camp.scene.game.canvas.style.cursor;
        return { kind, retina: css.includes('image-set'), hotspot: css.match(/\) (\d+ \d+), default$/)?.[1] };
      });
    });
    assert.deepEqual(cursorChecks, [
      { kind: 'pointer', retina: true, hotspot: '2 2' },
      { kind: 'move', retina: true, hotspot: '16 28' },
      { kind: 'attack', retina: true, hotspot: '16 16' },
      { kind: 'build', retina: true, hotspot: '6 28' },
      { kind: 'invalid', retina: true, hotspot: '16 16' },
    ]);
    fs.writeFileSync(path.join(inbox, `cursor-checks-${width}.json`), JSON.stringify(cursorChecks, null, 2));
    await page.evaluate(() => {
      const camp = window.camp;
      camp.selectPeople([]);
      camp.selectBuilding(camp.state.buildings.find(building => building.type === 'fire').id);
    });
    await page.waitForFunction(() => Object.keys(window.camp.upgradeRows()).length > 0);
    await page.waitForTimeout(300);
    await canvas.screenshot({ path: path.join(inbox, `upgrades-${width}.png`) });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`AB2 icons, cursors, menu and selection: ${width}×${height}, no browser errors.`);
  }
} finally {
  await browser?.close();
  await server.close();
}
