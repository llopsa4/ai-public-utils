// The intro's placeholder rooms, until Codex's paintings are imported (see art/briefs): the guardroom
// at the top of the stairs and the snowy yard at the outer door. Painted as SVG scenes like
// art/ch2.mjs. Coordinates are art pixels (2x the 640x360 world); the layouts match
// src/chapters/intro/rooms.ts. The cell, its plates and the satchel items are Codex's final art.
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
  // Benn's stool, right of the stove.
  s += rect(740, 572, 52, 9, 'url(#wood)') + rect(744, 581, 7, 32, '#3a2414') + rect(781, 581, 7, 32, '#3a2414');
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

// A wall torch for the guardroom's iron brackets (a placeholder by Claude): a pitch-wrapped head on a
// wooden haft, 14x90 art px. The game adds the flame and light (rooms.ts).
{
  const W2 = 14, H2 = 90, file = 'intro/objects/guardroom-torch.png';
  const objects = join(here, 'src', 'intro', 'objects');
  if (isFinal(file)) console.log(`  ${file}: final art, kept.`);
  else {
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}">
      <rect x="4" y="16" width="6" height="74" fill="#5a3a20"/><rect x="4" y="16" width="2" height="74" fill="#7a5230"/>
      <rect x="4" y="40" width="6" height="2" fill="#3a2414"/><rect x="4" y="66" width="6" height="2" fill="#3a2414"/>
      <rect x="1" y="2" width="12" height="16" rx="3" fill="#2a1a12"/><rect x="2" y="5" width="10" height="2" fill="#4a3020"/>
      <rect x="2" y="10" width="10" height="2" fill="#4a3020"/><rect x="2" y="2" width="10" height="2" fill="#c06a2a"/>
    </svg>`;
    writeFileSync(join(objects, 'guardroom-torch.png'), await sharp(Buffer.from(body)).png().toBuffer());
    const frame = { x: 0, y: 0, w: W2, h: H2 };
    writeFileSync(join(objects, 'guardroom-torch.json'), JSON.stringify({
      frames: [{ filename: '0', frame, rotated: false, trimmed: false, spriteSourceSize: frame, sourceSize: { w: W2, h: H2 }, duration: 1000 }],
      meta: { app: 'adventure art/intro.mjs', version: '1', image: 'guardroom-torch.png', format: 'RGBA8888', size: { w: W2, h: H2 }, scale: '1',
        frameTags: [{ name: 'idle', from: 0, to: 0, direction: 'forward' }] },
    }, null, 1) + String.fromCharCode(10));
  }
}

console.log('Intro placeholder rooms written to art/src/intro/rooms (the guardroom and the outer door).');
