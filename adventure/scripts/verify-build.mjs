// Checks that the published page only uses relative URLs into build/ and matches the fresh build.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('..', import.meta.url));
const html = await readFile(resolve(project, 'index.html'), 'utf8');
assert.equal(html, await readFile(resolve(project, 'dist/index.html'), 'utf8'), 'index.html is stale');
const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
for (const link of links) assert.match(link, /^\.\/build\/[\w.-]+$/, `non-relative or unexpected URL: ${link}`);
assert.ok(links.some(l => l.endsWith('.js')) && links.some(l => l.endsWith('.css')));

const built = await readdir(resolve(project, 'dist/build'));
const published = await readdir(resolve(project, 'build'));
assert.deepEqual(published.sort(), built.sort(), 'build/ differs from dist/build/');
for (const name of built) {
  const a = await readFile(resolve(project, 'dist/build', name));
  assert.ok(a.equals(await readFile(resolve(project, 'build', name))), `stale asset ${name}`);
  assert.match(name, /\.(js|css|png|webp|woff2?)$/, `unexpected asset type ${name}`);
}
// Vite names assets <name>-<8-character hash>.<ext>.
const has = (name, ext) => built.some(n => new RegExp(`^${name}-[\\w-]{8}\\.${ext}$`).test(n));
for (const art of ['mara', 'mara-gauntlet', 'oren', 'nell', 'sweeper', 'valve', 'socket', 'rack', 'pantry-door', 'notebook', 'tent', 'gauntlet', 'regulator', 'bread', 'scarf']) {
  assert.ok(has(art, 'png'), `missing art: ${art}`);
}
// Rooms and foreground cut-outs ship as WebP only (the tent object sprite shares the room's name and stays PNG).
for (const room of ['tent', 'mara-room', 'firing-house', 'gallery', 'ashways', 'tent-stool', 'hall-left', 'hall-right', 'gallery-railing']) {
  assert.ok(has(room, 'webp'), `missing WebP: ${room}`);
  if (room !== 'tent') assert.ok(!has(room, 'png'), `PNG copy of ${room} shipped`);
}
// Background people (placeholders) ship as WebP only.
for (const extra of ['extra-stoker', 'extra-tally', 'extra-hauler', 'extra-runner', 'extra-hoist', 'extra-kid']) {
  assert.ok(has(extra, 'webp'), `missing WebP: ${extra}`);
  assert.ok(!has(extra, 'png'), `PNG copy of ${extra} shipped`);
}
for (const verb of ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand']) {
  assert.ok(built.some(n => n.startsWith(`${verb}-`) && n.endsWith('.png')), `missing icon: ${verb}`);
}
const js = built.filter(n => n.endsWith('.js'));
for (const name of js) assert.doesNotMatch(await readFile(resolve(project, 'build', name), 'utf8'), /sourceMappingURL=/);
// Size budget: everything, and what is downloaded before the title screen is usable (code, sheets,
// portraits, icons, Mara's unlit sheet, plus the two rooms the title loads: the kiln-hall backdrop
// and the start room). Oren, Nell and the lit gauntlet load with the rooms that need them; the kiln
// hall's background people load in the background once play starts.
const { statSync } = await import('node:fs');
const size = name => statSync(resolve(project, 'build', name)).size;
const total = built.reduce((sum, n) => sum + size(n), 0);
const later = /^(firing-house|gallery|ashways|hall-left|hall-right|gallery-railing|mara-gauntlet|oren|nell|scavenger|extra-[a-z]+)-[\w-]{8}\./;
// .woff fonts are fallbacks for browsers without WOFF2; current browsers never fetch them.
const firstLoad = built.filter(n => !later.test(n) && !n.endsWith('.woff')).reduce((sum, n) => sum + size(n), 0);
const MB = 1024 * 1024;
// Static count: it also includes portraits and icons that are only fetched when first shown, so the
// real first load (measured by npm run e2e) is lower.
const TOTAL_BUDGET = 3.6, FIRST_BUDGET = 1.75;
assert.ok(total < TOTAL_BUDGET * MB, `build is ${(total / MB).toFixed(2)} MB (budget ${TOTAL_BUDGET} MB)`);
assert.ok(firstLoad < FIRST_BUDGET * MB, `first load is ${(firstLoad / MB).toFixed(2)} MB (budget ${FIRST_BUDGET} MB)`);
console.log(`Build verified: ${built.length} assets, relative URLs only, ${(total / MB).toFixed(2)} MB total, ${(firstLoad / MB).toFixed(2)} MB before the title screen.`);
