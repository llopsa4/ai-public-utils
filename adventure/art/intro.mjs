// The intro's rooms (placeholders until Codex art is imported; see art/briefs): Ironhaven's cell at
// night, the guardroom at the top of the stairs, and the snowy yard at the outer door. Painted as SVG
// scenes like art/ch2.mjs. Coordinates are art pixels (2x the 640x360 world); the layouts match
// src/chapters/intro/rooms.ts. The cell is painted lit (moonlight); the game darkens it until the
// tin plate throws the moonlight across it.
//
//   node art/intro.mjs   (part of npm run art; then npm run webp)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src', 'intro', 'rooms');
mkdirSync(out, { recursive: true });
const W = 1280, H = 720;

async function save(name, image) {
  const file = `intro/rooms/${name}.png`;
  if (isFinal(file)) { console.log(`  ${file}: final art, kept.`); return; }
  // Encoded in memory, then written: sharp can fail to reopen a PNG it wrote earlier in place on Windows.
  writeFileSync(join(out, `${name}.png`), await image.png({ palette: true, colours: 96, dither: 0.6, effort: 8 }).toBuffer());
}

let seed = 31;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const defs = `<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/>
    <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="softer"><feGaussianBlur stdDeviation="26"/></filter>
  <radialGradient id="warm" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcc7a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff8a30" stop-opacity="0"/></radialGradient>
  <radialGradient id="moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#cfd8ff" stop-opacity="0.55"/><stop offset="1" stop-color="#8090c0" stop-opacity="0"/></radialGradient>
  <linearGradient id="cellWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a34"/><stop offset="1" stop-color="#454250"/></linearGradient>
  <linearGradient id="cellFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3640"/><stop offset="1" stop-color="#1a1820"/></linearGradient>
  <linearGradient id="warmWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a22"/><stop offset="1" stop-color="#6a4a36"/></linearGradient>
  <linearGradient id="warmFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4434"/><stop offset="1" stop-color="#2a1e16"/></linearGradient>
  <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a2c"/><stop offset="1" stop-color="#3a4258"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4426"/><stop offset="1" stop-color="#3a2414"/></linearGradient>
</defs>`;
const stones = (x0, y0, x1, y1, color) => {
  let s = '';
  for (let y = y0; y < y1; y += 34) for (let x = x0 - (((y - y0) / 34) % 2) * 30; x < x1; x += 60) {
    s += rect(Math.max(x0, x + 2), y + 2, Math.min(56, x1 - Math.max(x0, x + 2)), 30, color, `opacity="${0.18 + rnd() * 0.22}"`);
  }
  return s;
};
const render = body => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${body}<rect width="${W}" height="${H}" fill="#000" filter="url(#grain)"/></svg>`));

// The cell: Silas's side (left of the bars at x 732-800), the corridor beyond with the guard's
// table and candle, the duty roster on the wall, and the stairs up at the far right.
{
  let s = rect(0, 0, W, 536, 'url(#cellWall)') + stones(0, 0, W, 536, '#14141c');
  s += rect(0, 524, W, H - 524, 'url(#cellFloor)');
  for (let n = 0; n < 14; n++) s += ellipse(80 + rnd() * 640, 580 + rnd() * 120, 30 + rnd() * 50, 4 + rnd() * 4, '#6a7090', `opacity="${0.25 + rnd() * 0.25}"`);
  // The barred window, a thread of moonlight down to the floor.
  s += rect(292, 124, 120, 100, '#0e1222') + rect(300, 132, 104, 84, '#3a4a78');
  for (let x = 318; x < 404; x += 22) s += line(x, 128, x, 220, '#1a1a22', 7);
  s += poly([[300, 216], [404, 216], [470, 600], [250, 600]], 'url(#moon)', 'opacity="0.45"');
  // The weeping wall: dark streaks and a flaking patch.
  s += rect(428, 236, 152, 232, '#4a4a52', 'opacity="0.55"');
  for (let x = 436; x < 576; x += 16) s += line(x, 240 + rnd() * 30, x + rnd() * 6, 460 - rnd() * 60, '#20222c', 4, 'opacity="0.55"');
  for (let n = 0; n < 14; n++) s += rect(440 + rnd() * 120, 260 + rnd() * 190, 10 + rnd() * 14, 6 + rnd() * 8, '#8a8a90', `opacity="${0.4 + rnd() * 0.3}"`);
  // The cot (straw and a ragged blanket), the tin plate with its crust, the bucket.
  s += rect(68, 500, 240, 40, '#5a4630') + rect(76, 474, 224, 32, '#8a7448') + poly([[90, 470], [290, 474], [280, 520], [96, 520]], '#4a4e5e');
  s += rect(80, 540, 14, 40, '#3a2a1a') + rect(282, 540, 14, 40, '#3a2a1a');
  s += poly([[600, 534], [656, 534], [650, 596], [606, 596]], '#4a3e36') + ellipse(628, 534, 28, 7, '#2a3040');
  // The bars and their door.
  s += rect(712, 160, 16, 520, '#2a2a30');
  for (let x = 732; x < 812; x += 18) s += rect(x, 220, 8, 470, '#3a3a42');
  s += rect(728, 218, 88, 12, '#3a3a42') + rect(728, 440, 88, 10, '#3a3a42') + rect(790, 420, 22, 30, '#5a5048');
  // The corridor beyond: the guard's table, cup, candle and its warm pool, the roster.
  s += ellipse(940, 440, 200, 160, 'url(#warm)', 'opacity="0.55"');
  s += rect(872, 460, 184, 18, 'url(#wood)') + rect(884, 478, 12, 70, '#3a2414') + rect(1032, 478, 12, 70, '#3a2414');
  s += rect(934, 432, 12, 28, '#e8dcc0') + ellipse(940, 424, 5, 10, '#ffd27a') + rect(1000, 444, 18, 18, '#6a5a4a');
  s += rect(1080, 272, 76, 96, '#d8cca8') + line(1092, 292, 1144, 292, '#5a4a3a', 3) + line(1092, 308, 1140, 308, '#5a4a3a', 3);
  s += ellipse(1118, 340, 14, 16, '#a89070') + line(1106, 350, 1130, 350, '#3a2a1a', 4);
  // The stairs up (far right), and the guard's chair (he sits facing the cell, its back to the right).
  for (let n = 0; n < 7; n++) s += rect(1180 + n * 4, 500 - n * 52, 100, 18, '#2a2630');
  s += rect(1084, 562, 96, 10, '#6a4428') + rect(1084, 572, 96, 4, '#3a2414');
  s += rect(1088, 576, 8, 26, '#3a2414') + rect(1168, 576, 8, 26, '#3a2414');
  s += rect(1170, 440, 10, 124, '#5a3a22') + rect(1166, 440, 18, 8, '#6a4428') + rect(1170, 486, 10, 6, '#3a2414');
  await save('cell', render(s));
}

// The guardroom: a peg with the clerk's hood, the ledger on a shelf, the stove, Kell's desk, and the
// grate out (right edge); stairs back down at the left edge.
{
  let s = rect(0, 0, W, 536, 'url(#warmWall)') + stones(0, 0, W, 536, '#24180f');
  s += rect(0, 524, W, H - 524, 'url(#warmFloor)');
  s += rect(0, 300, 80, 236, '#1a120c');
  s += rect(232, 236, 6, 16, '#3a2a1a') + poly([[222, 246], [286, 246], [296, 360], [212, 360]], '#5a5a62');
  s += rect(370, 410, 120, 12, 'url(#wood)') + rect(392, 392, 80, 20, '#7a3a2a') + line(400, 402, 464, 402, '#d8c8a0', 2);
  s += rect(600, 360, 120, 164, '#2a2422') + rect(620, 420, 80, 50, '#ff9a40', 'opacity="0.85"') + rect(648, 160, 24, 200, '#2a2422');
  s += ellipse(660, 440, 160, 120, 'url(#warm)', 'opacity="0.5"');
  s += rect(800, 470, 160, 16, 'url(#wood)') + rect(812, 486, 12, 60, '#3a2414') + rect(936, 486, 12, 60, '#3a2414');
  s += rect(1120, 220, 152, 304, '#0e121c') + rect(1124, 224, 144, 296, '#2a3450', 'opacity="0.6"');
  for (let x = 1132; x < 1272; x += 20) s += rect(x, 220, 8, 304, '#3a3a42');
  for (let y = 250; y < 520; y += 60) s += rect(1120, y, 152, 8, '#3a3a42');
  s += rect(1140, 380, 24, 30, '#5a5048');
  await save('guardroom', render(s));
}

// The outer door: night snow under Ironhaven's walls; the door Silas comes out of (left).
{
  let s = rect(0, 0, W, H, 'url(#night)');
  s += rect(0, 120, W, 300, '#1e2232') + stones(0, 120, W, 420, '#10121a');
  for (let x = 0; x < W; x += 80) s += rect(x, 96, 48, 30, '#1e2232');
  s += rect(60, 260, 140, 260, '#0e0e14') + rect(70, 270, 120, 250, 'url(#wood)', 'opacity="0.6"');
  s += rect(220, 300, 24, 34, '#3a2a1e') + rect(224, 306, 16, 22, '#ffd27a') + ellipse(232, 318, 80, 70, 'url(#warm)', 'opacity="0.5"');
  s += poly([[0, 520], [W, 500], [W, H], [0, H]], '#cfd6e6');
  for (let n = 0; n < 40; n++) s += ellipse(rnd() * W, 540 + rnd() * 170, 30 + rnd() * 60, 3 + rnd() * 4, '#a8b0c4', `opacity="${0.3 + rnd() * 0.3}"`);
  for (let n = 0; n < 120; n++) s += ellipse(rnd() * W, rnd() * 500, 2, 2, '#e8eef8', `opacity="${0.4 + rnd() * 0.5}"`);
  await save('prison-door', render(s));
}

// ------------------------------------------------------------------- items ---
// Satchel icons, 64x64, drawn as small SVGs.
const itemsDir = join(here, 'src', 'intro', 'items');
mkdirSync(itemsDir, { recursive: true });
const ITEMS = {
  plate: ellipse(32, 34, 26, 16, '#a8acb8') + ellipse(32, 34, 18, 10, '#c8ccd8') + ellipse(42, 30, 6, 3, '#f0f4ff'),
  crust: `<path d="M10 40 Q14 18 34 18 Q54 20 54 40 Z" fill="#a07840"/>` + rect(10, 38, 44, 8, '#7a5428'),
  nail: line(14, 50, 40, 20, '#8a8a92', 6) + line(40, 20, 50, 16, '#8a8a92', 6) + rect(10, 48, 10, 6, '#6a6a72'),
  strip: `<path d="M8 50 Q20 20 32 34 T56 14" stroke="#5a5e70" stroke-width="10" fill="none"/>`,
  hookLine: `<path d="M8 54 Q20 24 32 36 T48 18" stroke="#5a5e70" stroke-width="8" fill="none"/>` + line(48, 18, 56, 10, '#8a8a92', 5) + line(56, 10, 52, 22, '#8a8a92', 4),
  frame: ellipse(32, 32, 20, 26, 'none', 'stroke="#c9a15a" stroke-width="4"') + line(14, 32, 50, 32, '#c9a15a', 3) + line(32, 8, 32, 58, '#c9a15a', 3) + ellipse(20, 46, 3, 3, '#e7c046') + ellipse(44, 46, 3, 3, '#e7c046'),
  plaster: ellipse(22, 40, 10, 6, '#9a9aa2') + ellipse(38, 34, 12, 7, '#8a8a92') + ellipse(30, 48, 9, 5, '#aaaab2'),
  wetPlaster: ellipse(32, 40, 22, 12, '#6a6a76') + ellipse(26, 36, 8, 3, '#9aa0b8'),
  putty: `<path d="M12 44 Q14 20 32 18 Q52 20 52 44 Q32 52 12 44 Z" fill="#8a8070"/>` + ellipse(26, 30, 4, 3, '#a89a80'),
  maskHarrow: `<path d="M12 14 Q32 6 52 14 L50 46 Q32 60 14 46 Z" fill="#8a8680"/>` + ellipse(23, 26, 6, 4, '#2a2420') + ellipse(41, 26, 6, 4, '#2a2420') + `<path d="M18 40 Q32 34 46 40 Q32 46 18 40 Z" fill="#3a2e24"/>` + ellipse(12, 30, 3, 3, '#c9a15a') + ellipse(52, 30, 3, 3, '#c9a15a'),
  keys: ellipse(24, 22, 12, 12, 'none', 'stroke="#8a8a92" stroke-width="4"') + line(30, 30, 52, 52, '#c9a15a', 5) + rect(44, 46, 6, 10, '#c9a15a') + line(28, 30, 40, 54, '#a0a0aa', 5),
  hood: `<path d="M12 56 Q10 12 32 8 Q54 12 52 56 Z" fill="#5c5c60"/>` + `<path d="M20 56 Q22 24 32 22 Q42 24 44 56 Z" fill="#1a1a1e"/>`,
  ledger: rect(12, 12, 40, 44, '#7a3a2a') + rect(16, 14, 34, 40, '#e8dcc0') + line(20, 24, 44, 24, '#5a4a3a', 2) + line(20, 32, 44, 32, '#5a4a3a', 2) + line(20, 40, 40, 40, '#5a4a3a', 2),
  maskClerk: `<path d="M8 58 Q6 14 26 10 Q44 14 42 58 Z" fill="#5c5c60"/>` + rect(32, 30, 26, 28, '#7a3a2a') + rect(35, 32, 20, 24, '#e8dcc0'),
};
for (const [name, body] of Object.entries(ITEMS)) {
  const file = `intro/items/${name}.png`;
  if (isFinal(file)) continue;
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">${body}</svg>`)).png({ palette: true, colours: 32 }).toFile(join(itemsDir, `${name}.png`));
}

// ----------------------------------------------------------------- objects ---
// The tin plate wedged in the window bars, tilted to throw the moonlight (shown once the cell is lit).
const objDir = join(here, 'src', 'intro', 'objects');
mkdirSync(objDir, { recursive: true });
async function objectSheet(name, w, h, body) {
  if (isFinal(`intro/objects/${name}.png`)) return;
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)).png({ palette: true, colours: 32 }).toFile(join(objDir, `${name}.png`));
  const frame = { filename: '0', frame: { x: 0, y: 0, w, h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h }, duration: 100 };
  writeFileSync(join(objDir, `${name}.json`), JSON.stringify({ frames: [frame], meta: { app: 'adventure art/intro.mjs', version: '1', image: `${name}.png`, format: 'RGBA8888', size: { w, h }, scale: '1', frameTags: [{ name: 'idle', from: 0, to: 0, direction: 'forward' }] } }, null, 1) + '\n');
}
await objectSheet('window-plate', 44, 28, `<g transform="rotate(-24 22 16)">${ellipse(22, 16, 19, 8, '#8a8e9a')}${ellipse(22, 15, 13, 5, '#c8ccd8')}${ellipse(28, 13, 5, 2, '#f4f8ff')}</g>`);
// The plate on the floor by the cot, with its crust (until Silas takes it).
await objectSheet('floor-plate', 60, 24, ellipse(30, 13, 28, 10, '#a8acb8') + ellipse(26, 9, 12, 5, '#7a6040'));
console.log('Intro rooms, items and objects written to art/src/intro.');
