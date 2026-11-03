// Chapter 2's rooms (placeholders until Codex art is imported; see art/briefs):
// - the workshop, from Kiln Courier's tempering-house painting (../FFCardGame/assets), fitted to
//   1280x720 and palette-reduced like chapter 1's rooms;
// - the road and the back room, painted from scratch as SVG scenes (like art/tent.mjs).
// Coordinates are art pixels (2x the 640x360 world); the layouts match src/chapters/ch2/rooms.ts.
//
//   node art/ch2.mjs   (part of npm run art; then npm run webp)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const kc = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src', 'ch2', 'rooms');
mkdirSync(out, { recursive: true });
const W = 1280, H = 720;

/** Writes a room as a palette-indexed PNG (96 colours), unless it is final art. */
async function save(name, image) {
  const file = `ch2/rooms/${name}.png`;
  if (isFinal(file)) { console.log(`  ${file}: final art, kept.`); return; }
  await image.png({ palette: true, colours: 96, dither: 0.6, effort: 8 }).toFile(join(out, `${name}.png`));
}

// ------------------------------------------------------------------- the workshop ---
await save('workshop', sharp(join(kc, 'opening', 'tempering-house.png'))
  .resize(W, H, { fit: 'cover', position: 'top' })
  .modulate({ brightness: 0.96, saturation: 1.03 }));

// ----------------------------------------------------------------- painted scenes ---
let seed = 23;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const defs = `<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5"/>
    <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.2"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="softer"><feGaussianBlur stdDeviation="26"/></filter>
  <radialGradient id="warm" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcc7a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff8a30" stop-opacity="0"/></radialGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a4e"/><stop offset="0.6" stop-color="#6a5a5a"/><stop offset="1" stop-color="#8a6a56"/></linearGradient>
  <linearGradient id="ash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e6058"/><stop offset="1" stop-color="#2e2620"/></linearGradient>
  <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a6a5c"/><stop offset="1" stop-color="#4a3e34"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4e2c"/><stop offset="1" stop-color="#4a2e18"/></linearGradient>
  <linearGradient id="wallIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2618"/><stop offset="0.7" stop-color="#6a4428"/><stop offset="1" stop-color="#4a2e1a"/></linearGradient>
  <linearGradient id="floorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#22160c"/></linearGradient>
</defs>`;
const stones = (x0, y0, x1, y1, color) => {
  let s = '';
  for (let y = y0; y < y1; y += 34) for (let x = x0 - (((y - y0) / 34) % 2) * 30; x < x1; x += 60) {
    s += rect(Math.max(x0, x + 2), y + 2, Math.min(56, x1 - Math.max(x0, x + 2)), 30, color, `opacity="${0.18 + rnd() * 0.22}"`);
  }
  return s;
};
const render = (body) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${body}<rect width="${W}" height="${H}" fill="#000" filter="url(#grain)"/></svg>`));

// The road: dusk at the edge of the ashways; Bryn's stone house on the right.
{
  let s = rect(0, 0, W, H, 'url(#dusk)');
  // Pipes in the haze behind.
  s += rect(0, 150, W, 70, '#4e4a52', 'opacity="0.55"') + rect(0, 228, 760, 46, '#5a5258', 'opacity="0.5"');
  for (let x = 40; x < W; x += 170) s += rect(x, 140, 18, 90, '#3e3a42', 'opacity="0.6"');
  s += ellipse(980, 120, 220, 60, '#cfc6c0', 'opacity="0.18" filter="url(#softer)"');
  // Ash ground.
  s += poly([[0, 470], [W, 450], [W, H], [0, H]], 'url(#ash)');
  for (let n = 0; n < 60; n++) s += ellipse(rnd() * W, 480 + rnd() * 230, 20 + rnd() * 60, 3 + rnd() * 5, '#8a7c70', `opacity="${0.15 + rnd() * 0.2}"`);
  // The house.
  s += rect(700, 180, 560, 320, 'url(#stone)') + stones(700, 180, 1260, 500, '#2e241c');
  s += poly([[680, 186], [980, 70], [1280, 170], [1280, 192], [680, 200]], '#3a2a20');
  s += rect(1150, 60, 50, 120, '#4a3a30') + ellipse(1176, 40, 40, 26, '#d8d0c8', 'opacity="0.35" filter="url(#soft)"');
  // Door, frame with couriers' marks, bell, window, lantern.
  s += rect(740, 290, 150, 220, '#2a1a10') + rect(752, 302, 126, 208, 'url(#wood)');
  for (let y = 320; y < 500; y += 46) s += line(756, y, 874, y, '#3a2412', 3);
  s += circle(860, 410, 6, '#c9a15a') + rect(736, 286, 12, 226, '#5a4030') + rect(882, 286, 12, 226, '#5a4030');
  for (let y = 310; y < 500; y += 14) s += line(738, y, 746, y + 4, '#d8c8a8', 2, `opacity="${0.4 + rnd() * 0.4}"`);
  s += rect(896, 270, 34, 6, '#3a2a20') + `<path d="M904 276 q9 34 18 0 z" fill="#b08a4a"/>` + line(913, 300, 913, 330, '#6a5a4a', 2);
  s += rect(950, 320, 140, 90, '#2a1a10') + rect(958, 328, 124, 74, '#ffb860') + ellipse(1020, 365, 120, 70, 'url(#warm)', 'opacity="0.55"');
  s += line(1020, 328, 1020, 402, '#2a1a10', 6) + line(958, 365, 1082, 365, '#2a1a10', 6);
  s += rect(700, 300, 24, 34, '#3a2a20') + ellipse(712, 318, 60, 60, 'url(#warm)', 'opacity="0.6"') + rect(704, 306, 16, 22, '#ffd27a');
  // Signpost back to Cinderfold (left) and the road.
  s += rect(290, 360, 12, 160, '#4a3424') + poly([[200, 372], [330, 372], [348, 388], [330, 404], [200, 404]], '#6a4a30');
  s += line(214, 388, 316, 388, '#2a1a10', 3, 'opacity="0.6"');
  s += poly([[0, 480], [200, 470], [240, 720], [0, 720]], '#3a322c', 'opacity="0.35"');
  await save('road', render(s));
}

// The back room: hearth, shelf, table with the map above it, cot, the courier's pouch, the far door.
{
  let s = rect(0, 0, W, H, 'url(#wallIn)') + stones(0, 0, W, 520, '#1e140c');
  s += poly([[0, 520], [W, 520], [W, H], [0, H]], 'url(#floorIn)');
  for (let x = 0; x < W; x += 90) s += line(x, 520, x - 60 + rnd() * 30, H, '#1a100a', 2, 'opacity="0.5"');
  // Curtain back to the workshop (left edge).
  s += rect(0, 220, 70, 330, '#7a2e1e') + line(20, 220, 24, 550, '#4a1a10', 4) + line(46, 220, 50, 550, '#4a1a10', 4);
  // Hearth with fire and pot.
  s += rect(90, 250, 250, 300, '#5a4a40') + stones(90, 250, 340, 550, '#2a2018') + rect(130, 390, 170, 160, '#140c08');
  s += ellipse(215, 520, 80, 30, '#ff8a30', 'opacity="0.85" filter="url(#soft)"') + ellipse(215, 500, 46, 40, '#ffd27a', 'filter="url(#soft)"');
  s += ellipse(215, 470, 54, 34, '#2a2420') + rect(161, 440, 108, 30, '#2a2420') + line(150, 400, 280, 400, '#3a302a', 5);
  s += ellipse(215, 470, 300, 220, 'url(#warm)', 'opacity="0.35"');
  // Supply shelf.
  s += rect(370, 210, 130, 230, '#4a3020') + [250, 330, 410].map(y => rect(370, y, 130, 8, '#2a1a10')).join('');
  s += rect(384, 216, 40, 34, '#8a6a40') + rect(434, 220, 52, 30, '#6a5034') + ellipse(400, 316, 16, 20, '#b08a5a') + rect(436, 290, 50, 40, '#7a5a38') + rect(386, 360, 96, 46, '#6a4a2a');
  // Map on the wall, table with bowl and bread.
  s += rect(560, 170, 230, 160, '#d8c8a0') + rect(560, 170, 230, 160, 'none', 'stroke="#5a4030" stroke-width="6"');
  s += `<path d="M590 300 q40 -60 80 -40 t90 -60" fill="none" stroke="#6a4a2a" stroke-width="3" stroke-dasharray="8 6"/>`;
  s += ellipse(740, 210, 26, 16, '#8a9a7a', 'opacity="0.8"') + line(726, 200, 754, 220, '#7a2e1e', 3) + line(754, 200, 726, 220, '#7a2e1e', 3);
  s += rect(520, 440, 320, 24, 'url(#wood)') + rect(540, 464, 16, 90, '#3a2414') + rect(806, 464, 16, 90, '#3a2414');
  s += ellipse(630, 438, 44, 12, '#6a4a30') + ellipse(630, 434, 34, 8, '#c08a4a') + ellipse(740, 434, 40, 14, '#c89a5a');
  s += ellipse(680, 420, 200, 90, 'url(#warm)', 'opacity="0.25"');
  // Cot under a blanket.
  s += rect(900, 500, 300, 70, '#4a3020') + rect(906, 470, 290, 40, '#8a3a2a') + rect(1120, 452, 76, 30, '#c8b89a');
  // The courier's pouch on its peg, and the far door.
  s += rect(1068, 300, 8, 12, '#2a1a10') + `<path d="M1048 312 h48 l-6 54 h-36 z" fill="#7a5030"/>` + rect(1052, 322, 40, 6, '#c9a15a');
  s += rect(1150, 230, 120, 300, '#2a1a10') + rect(1160, 240, 104, 290, 'url(#wood)') + circle(1176, 390, 7, '#c9a15a');
  await save('backroom', render(s));
}
console.log('Chapter 2 rooms written to art/src/ch2/rooms.');
