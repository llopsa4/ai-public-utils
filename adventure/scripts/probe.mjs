// Screenshots of any room at any point of the story, from the built game (run `npm run build` first).
// Handy for checking new art in place, in both visual qualities.
//
//   node scripts/probe.mjs --room gallery --flags kilnCold,fought --items regulator
//   node scripts/probe.mjs --room maraRoom --quality low --out shots/hall-low.png
//   node scripts/probe.mjs --all            (every room, start of the story and cold, both qualities)
//
// Options: --chapter <id> (default ch1), --room, --entry, --flags a,b, --items a,b, --quality high|low,
// --out <png> (default shots/<room>.png), --all. Screenshots go to shots/ (not committed).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const list = v => (v ? v.split(',').filter(Boolean) : []);
const PORT = 4199;

const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const gpu = process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args: gpu });

async function shot({ chapter = 'ch1', room, entry, flags = [], items = [], quality = 'high', out }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(q => {
    localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: q, reducedMotion: true, muted: true }));
  }, quality);
  for (let tries = 0; ; tries++) {
    try { await page.goto(`http://127.0.0.1:${PORT}/adventure/?debug`); break; }
    catch (e) { if (tries > 20) throw e; await new Promise(r => setTimeout(r, 250)); }
  }
  await page.waitForFunction(() => window.adventure?.session?.title?.sys?.isActive());
  await page.evaluate(({ chapter, room, entry, flags, items }) => {
    const { session, newGame, chapters } = window.adventure;
    session.showWalkAreas = false;
    const s = newGame(chapter);
    for (const f of flags) s.flags[f] = true;
    s.inventory = items;
    if (room) {
      const entries = chapters[chapter].rooms[room].entries;
      const e = entries[entry ?? Object.keys(entries)[0]];
      Object.assign(s, { room, hero: { ...s.hero, x: e.x, y: e.y, face: e.face } });
    }
    session.replaceState(s);
  }, { chapter, room, entry, flags, items });
  await page.waitForFunction(() => {
    const a = window.adventure;
    return !a.session.onTitle && a.game.scene.isActive('room') && a.session.scene.room?.id === a.session.state.room && !a.session.scene.isBusy();
  }, null, { timeout: 30000 });
  await page.waitForTimeout(1500); // fades, glows and the crowd settle
  const file = out ?? `shots/${room ?? 'start'}${flags.length ? '-' + flags.join('-') : ''}-${quality}.png`;
  mkdirSync(dirname(file), { recursive: true });
  await page.locator('#stage').screenshot({ path: file });
  console.log(`Wrote ${file}`);
  await page.close();
}

try {
  if (args.includes('--all')) {
    const rooms = ['tent', 'maraRoom', 'firingHouse', 'gallery', 'ashways'];
    for (const quality of ['high', 'low']) for (const room of rooms) for (const flags of [[], ['kilnCold']]) await shot({ room, flags, quality });
  } else {
    await shot({ chapter: opt('chapter'), room: opt('room'), entry: opt('entry'), flags: list(opt('flags')), items: list(opt('items')), quality: opt('quality'), out: opt('out') });
  }
} finally {
  await browser.close();
  server.kill();
}
