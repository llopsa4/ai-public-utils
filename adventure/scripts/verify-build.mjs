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
  assert.match(name, /\.(js|css|png|webp|gif|woff2?)$/, `unexpected asset type ${name}`);
}
// Vite names assets <name>-<8-character hash>.<ext>.
const has = (name, ext) => built.some(n => new RegExp(`^${name}-[\\w-]{8}\\.${ext}$`).test(n));
for (const art of ['mara', 'mara-gauntlet', 'oren', 'nell', 'tobi', 'sweeper', 'valve', 'socket', 'rack', 'pantry-door', 'notebook', 'tent', 'gauntlet', 'regulator', 'bread', 'scarf']) {
  assert.ok(has(art, 'png'), `missing art: ${art}`);
}
// Rooms and foreground cut-outs ship as WebP only (the tent object sprite shares the room's name and stays PNG).
for (const room of ['tent', 'mara-room', 'firing-house', 'gallery', 'ashways', 'tent-stool', 'hall-left', 'hall-right']) {
  assert.ok(has(room, 'webp'), `missing WebP: ${room}`);
  if (room !== 'tent') assert.ok(!has(room, 'png'), `PNG copy of ${room} shipped`);
}
// Background people (placeholders) ship as WebP only.
for (const extra of ['extra-stoker', 'extra-tally', 'extra-hauler', 'extra-runner', 'extra-hoist', 'extra-kid', 'extra-merchant']) {
  assert.ok(has(extra, 'webp'), `missing WebP: ${extra}`);
  assert.ok(!has(extra, 'png'), `PNG copy of ${extra} shipped`);
}
for (const verb of ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand']) {
  assert.ok(built.some(n => n.startsWith(`${verb}-`) && n.endsWith('.png')), `missing icon: ${verb}`);
}
const js = built.filter(n => n.endsWith('.js'));
for (const name of js) assert.doesNotMatch(await readFile(resolve(project, 'build', name), 'utf8'), /sourceMappingURL=/);
// Size budget: everything, and what is downloaded before the title screen is usable (code, sheets,
// portraits, icons, Mara's unlit sheet, plus the Ironhaven title layers and the start room). Oren, Nell and the lit gauntlet load with the rooms that need them; the kiln
// hall's background people load in the background once play starts; Kiln Courier's battle screen
// (React, its art and fonts: the `mount` chunk) loads with the first fight.
const { statSync } = await import('node:fs');
const size = name => statSync(resolve(project, 'build', name)).size;
// Per-chapter art (by the art manifest's `chapter`; `game` is shared by every chapter). Chapters
// after the first load on demand (their code chunk `<id>-<hash>.js` and their art): they get their
// own budget and count neither in the game's total nor before the title screen.
const { MANIFEST } = await import('../art/manifest.mjs');
const artChapter = new Map(MANIFEST.map(e => [e.file.split('/').pop().replace(/\.\w+$/, ''), e.chapter ?? 'game']));
// A chapter's code chunk is named after its folder in src/chapters (ch2-<hash>.js, intro-<hash>.js).
const chapterFolders = (await readdir(resolve(project, 'src', 'chapters'), { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
const chunkChapter = new RegExp(`^(${chapterFolders.join('|')})-[\\w-]{8}\\.js$`);
const chapterOf = n => artChapter.get(n.replace(/-[\w-]{8}\.\w+$/, '')) ?? n.match(chunkChapter)?.[1];
const laterChapter = n => { const c = chapterOf(n); return c && c !== 'game' && c !== 'ch1' ? c : null; };
const perChapter = {};
for (const n of built) {
  const chapter = chapterOf(n);
  if (chapter) perChapter[chapter] = (perChapter[chapter] ?? 0) + size(n);
}
const total = built.filter(n => !laterChapter(n)).reduce((sum, n) => sum + size(n), 0);
// Room foregrounds and inventory pictures also wait until their room or inventory entry is shown.
const later = /^(mara-room|firing-house|gallery|ashways|hall-left|hall-right|hall-crate|tent-stool|mara-casual|mara-gauntlet|mara-medium(?:-gauntlet)?|oren|nell|tobi|scavenger|extra-[a-z]+|mount|card-atlas|hero|pressure-scavenger|regulator-gallery|courier-gauntlet|patched-coat|plain-carrier|light-armor|quick-harness|work-trousers|courier-boots|tonic|gauntlet|regulator|bread|scarf|cinzel-[\w-]+|cormorant-garamond-[\w-]+)-[\w-]{8}\./;
// Action-ring images are inserted when a player opens the ring, never at the title screen.
const actionIcons = new Set(MANIFEST.filter(e => e.kind === 'icon').map(e => e.file.split('/').pop().replace(/\.\w+$/, '')));
const actionIcon = n => actionIcons.has(n.replace(/-[\w-]{8}\.\w+$/, ''));
// Portraits, equipment and fight pictures are DOM images fetched when shown. Match bytes as well as names:
// e.g. the notebook sprite and inventory icon share a stem but only the sprite loads at boot.
const deferredImages = new Set();
// The world map too: drawn only when the notebook's Map tab or the chapter map opens.
for (const entry of MANIFEST.filter(e => ['portrait', 'item', 'equipment', 'battle-portrait', 'map'].includes(e.kind))) {
  // The game loads the WebP copy of a picture served as WebP.
  const served = entry.webp ? entry.file.replace(/\.png$/, '.webp') : entry.file;
  const source = await readFile(resolve(project, 'art/src', served)).catch(() => null);
  if (!source) continue;
  const stem = entry.file.split('/').pop().replace(/\.\w+$/, '');
  for (const name of built.filter(n => n.startsWith(stem + '-') && /\.(png|webp)$/.test(n))) {
    if (source.equals(await readFile(resolve(project, 'build', name)))) deferredImages.add(name);
  }
}
// .woff fonts are fallbacks for browsers without WOFF2; current browsers never fetch them.
const firstLoad = built.filter(n => !later.test(n) && !actionIcon(n) && !deferredImages.has(n) && !laterChapter(n) && !n.endsWith('.woff')).reduce((sum, n) => sum + size(n), 0);
const MB = 1024 * 1024;
// Static count remains conservative about other UI assets; npm run e2e measures real requests.
// 4.8 MB since chapter 2 (the game had reached 4.6 MB with chapter 1; later chapters are budgeted on their own below).
const TOTAL_BUDGET = 4.8, FIRST_BUDGET = 1.75;
assert.ok(total < TOTAL_BUDGET * MB, `build is ${(total / MB).toFixed(2)} MB (budget ${TOTAL_BUDGET} MB)`);
assert.ok(firstLoad < FIRST_BUDGET * MB, `first load is ${(firstLoad / MB).toFixed(2)} MB (budget ${FIRST_BUDGET} MB)`);
// The fight screens' code (the `mount` chunk: React and Kiln Courier's battle and workshop screens).
const fightCode = built.filter(n => /^mount-[\w-]{8}\.(js|css)$/.test(n)).reduce((sum, n) => sum + size(n), 0);
const CHAPTER_ART_BUDGET = 2.5, LATER_CHAPTER_BUDGET = 1.5, FIGHT_CODE_BUDGET = 0.4;
for (const [chapter, bytes] of Object.entries(perChapter)) {
  const budget = chapter === 'game' || chapter === 'ch1' ? CHAPTER_ART_BUDGET : LATER_CHAPTER_BUDGET;
  assert.ok(bytes < budget * MB, `${chapter} is ${(bytes / MB).toFixed(2)} MB (budget ${budget} MB)`);
}
assert.ok(fightCode < FIGHT_CODE_BUDGET * MB, `fight code is ${(fightCode / MB).toFixed(2)} MB (budget ${FIGHT_CODE_BUDGET} MB)`);
const chapters = Object.entries(perChapter).map(([c, b]) => `${c} ${(b / MB).toFixed(2)}`).join(', ');
console.log(`Build verified: ${built.length} assets, relative URLs only, ${(total / MB).toFixed(2)} MB total (without later chapters), ${(firstLoad / MB).toFixed(2)} MB before the title screen; MB by chapter: ${chapters}; fight code ${(fightCode / MB).toFixed(2)} MB.`);
