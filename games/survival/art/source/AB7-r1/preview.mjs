// Render the title and reused AB1 emblem in an isolated game snapshot; install nothing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { packGroup } from '../../../scripts/art/pack-lib.mjs';

const game = fileURLToPath(new URL('../../../', import.meta.url));
const art = path.join(game, 'art');
const inbox = path.join(art, 'inbox', 'AB7');
const scratch = path.join(game, 'test-results');
fs.mkdirSync(scratch, { recursive: true });
const temp = fs.mkdtempSync(path.join(scratch, 'ab7-preview-'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = read(path.join(art, 'manifest.json'));
const { keys } = read(path.join(inbox, 'delivery.json'));
const tempArt = path.join(temp, 'art');
const atlasDir = path.join(tempArt, 'atlas');
fs.mkdirSync(tempArt);
for (const entry of ['src', 'vite.config.ts', 'package.json']) {
  fs.cpSync(path.join(game, entry), path.join(temp, entry), { recursive: true });
}
fs.cpSync(path.join(art, 'atlas'), atlasDir, { recursive: true });
fs.copyFileSync(path.join(inbox, 'title.jpg'), path.join(tempArt, 'title.jpg'));
const ui = Object.keys(manifest).filter(key => manifest[key].atlas === 'ui' &&
  (keys.includes(key) || manifest[key].status === 'final'));
const dirFor = key => keys.includes(key) ? path.join(inbox, key)
  : path.join(art, 'inbox', 'done', `${manifest[key].batch}-r${manifest[key].revision}`, key);
packGroup(manifest, 'ui', ui, dirFor, atlasDir);
for (const key of keys) manifest[key].status = 'final';
fs.writeFileSync(path.join(tempArt, 'manifest.json'), JSON.stringify(manifest));
const server = await createServer({
  configFile: path.join(temp, 'vite.config.ts'), cacheDir: path.join(temp, '.vite'),
  server: { host: '127.0.0.1', port: 5207, fs: { allow: [game] } },
});
let browser;
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/?debug`;
  browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [width,height] of [[1280,720],[2560,1440]]) {
    const page = await browser.newPage({viewport:{width,height}});
    const errors=[];
    const titleResponses=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
    page.on('response',response=>{
      if(response.url().includes('title.jpg') && response.headers()['content-type']?.includes('image/jpeg')) {
        titleResponses.push({status:response.status(),type:response.headers()['content-type']});
      }
    });
    await page.goto(url);
    await page.waitForFunction(()=>window.menu?.buttons()['slot1.new']);
    const state=await page.evaluate(()=>{
      return {ready:!!window.menu,canvas:!!document.querySelector('#game canvas')};
    });
    assert.deepEqual(state,{ready:true,canvas:true});
    assert.equal(titleResponses.length,1,'Boot requested the title JPEG exactly once');
    assert.equal(titleResponses[0].status,200);
    assert.match(titleResponses[0].type,/image\/jpeg/);
    await page.waitForTimeout(300);
    await page.locator('#game canvas').screenshot({path:path.join(inbox,`menu-${width}.png`)});
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`AB7 title menu ${width}x${height}: no browser errors.`);
  }
} finally {
  await browser?.close();
  await server.close();
}
