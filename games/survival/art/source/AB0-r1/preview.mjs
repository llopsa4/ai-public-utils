// Produce a local screenshot using an isolated copy of the game and candidate atlases.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { packGroup } from '../../../scripts/art/pack-lib.mjs';

const game = fileURLToPath(new URL('../../../', import.meta.url));
const art = path.join(game, 'art');
const inbox = path.join(art, 'inbox', 'AB0');
const previews = path.join(game, 'test-results');
fs.mkdirSync(previews, { recursive: true });
const temp = fs.mkdtempSync(path.join(previews, 'ab0-preview-'));
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = json(path.join(art, 'manifest.json'));
const { keys } = json(path.join(inbox, 'delivery.json'));
const tempArt = path.join(temp, 'art');
fs.mkdirSync(tempArt);
for (const dir of ['src', 'vite.config.ts', 'package.json']) {
  fs.cpSync(path.join(game, dir), path.join(temp, dir), { recursive: true });
}
for (const group of new Set(keys.map((key) => manifest[key].atlas))) {
  packGroup(manifest, group, keys.filter((key) => manifest[key].atlas === group),
    (key) => path.join(inbox, key), path.join(tempArt, 'atlas'), undefined, () => 'AB0');
}
for (const key of keys) manifest[key].status = 'final';
fs.writeFileSync(path.join(tempArt, 'manifest.json'), JSON.stringify(manifest));

const server = await createServer({
  configFile: path.join(temp, 'vite.config.ts'),
  cacheDir: path.join(temp, '.vite'),
  server: { host: '127.0.0.1', port: 5196, fs: { allow: [game] } },
});
let browser;
try {
  await server.listen();
  const port = server.httpServer.address().port;
  browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/?debug`);
  const canvas = page.locator('#game canvas');
  await page.waitForFunction(() => window.menu?.buttons()['slot1.new']);
  const button = await page.evaluate(() => window.menu.buttons()['slot1.new']);
  const box = await canvas.boundingBox();
  const [x, y] = Array.isArray(button) ? button : [button.x, button.y];
  await page.mouse.click(box.x + x * box.width / 1280, box.y + y * box.height / 720);
  await page.waitForFunction(() => window.camp?.state.people.length === 20 && window.camp?.selectBuilding);
  await page.evaluate(() => {
    const camp = window.camp;
    camp.state.paused = true;
    camp.state.tick = 3600;
    camp.selectBuilding(camp.state.buildings.find((b) => b.type === 'tipi').id);
  });
  await page.waitForFunction(() => /Summer/.test(window.camp.hudText()));
  await page.waitForTimeout(1200); // Terrain redraws six chunks per animation frame.
  await canvas.screenshot({ path: path.join(inbox, 'preview.png') });
  assert.deepEqual(errors, []);
  console.log('AB0 preview captured at 1280×720 in summer. No browser errors.');
} finally {
  await browser?.close();
  await server.close();
}
