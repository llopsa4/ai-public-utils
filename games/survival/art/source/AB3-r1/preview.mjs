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
const inbox = path.join(art, 'inbox', 'AB3');
const scratch = path.join(game, 'test-results');
fs.mkdirSync(scratch, { recursive: true });
const temp = fs.mkdtempSync(path.join(scratch, 'ab3-preview-'));
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
const ui = Object.keys(manifest).filter((k) => manifest[k].atlas === 'ground' &&
  (keys.includes(k) || manifest[k].status === 'final'));
const dirFor = (k) => keys.includes(k) ? path.join(inbox, k)
  : path.join(art, 'inbox', 'done', `${manifest[k].batch}-r${manifest[k].revision}`, k);
packGroup(manifest, 'ground', ui, dirFor, atlasDir);
for (const key of keys) manifest[key].status = 'final';
fs.writeFileSync(path.join(tempArt, 'manifest.json'), JSON.stringify(manifest));

const server = await createServer({
  configFile: path.join(temp, 'vite.config.ts'),
  cacheDir: path.join(temp, '.vite'),
  server: { host: '127.0.0.1', port: 5201, fs: { allow: [game] } },
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
    await page.evaluate(() => { window.camp.state.paused = true; });
    for (const [season,tick] of [['spring',0],['summer',3600],['autumn',7200],['winter',10800]]) {
      for (const zoom of [0.5,1,2]) {
        await page.evaluate(({tick,zoom}) => {
          const camp=window.camp;
          camp.state.tick=tick;
          const camera=camp.scene.cameras.main;
          const cx=camera.midPoint.x, cy=camera.midPoint.y;
          camera.setZoom(zoom);
          camera.centerOn(cx,cy);
        }, {tick,zoom});
        await page.waitForTimeout(600);
        await canvas.screenshot({path:path.join(inbox, `camp-${season}-${zoom}x-${width}.png`)});
      }
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`AB3 four seasons and three zoom levels: ${width}×${height}, no browser errors.`);
  }
} finally {
  await browser?.close();
  await server.close();
}
