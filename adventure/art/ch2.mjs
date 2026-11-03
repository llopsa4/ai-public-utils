// Chapter 2's rooms (placeholders until Codex art is imported; see art/briefs):
// - the workshop, from Kiln Courier's tempering-house painting (../FFCardGame/assets), fitted to
//   1280x720 and palette-reduced like chapter 1's rooms;
// - the road, the back room and the three tunnels, painted from scratch as SVG scenes (like
//   art/tent.mjs), with the tunnels' changing parts as object sheets and the four tunnel creatures.
// Coordinates are art pixels (2x the 640x360 world); the layouts match src/chapters/ch2/rooms.ts.
//
//   node art/ch2.mjs   (part of npm run art; then npm run webp)
import { mkdirSync, writeFileSync } from 'node:fs';
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
// ------------------------------------------------------------- the tunnels (chapter 2's crossing) ---
// Three dark service tunnels under the ashways, lit by failing lamps (and, in the game, Mara's
// gauntlet). Their changing parts (grate, steam jet, drawbridge, nest basket) are object sheets.
const tunnelBase = (glowX) => {
  let s = rect(0, 0, W, H, '#0e0b0a');
  // Brick vault receding to a dark far wall.
  s += poly([[0, 0], [W, 0], [W, 120], [880, 240], [400, 240], [0, 120]], '#1e1714');
  s += poly([[0, 120], [400, 240], [400, 500], [0, 560]], '#241c17') + poly([[W, 120], [880, 240], [880, 500], [W, 560]], '#211a15');
  s += rect(400, 240, 480, 260, '#15110e');
  s += stones(0, 120, 400, 540, '#0a0706') + stones(880, 120, W, 540, '#0a0706') + stones(400, 240, 880, 500, '#0a0706');
  // Floor: wet stone with puddles.
  s += poly([[0, 560], [400, 500], [880, 500], [W, 560], [W, H], [0, H]], '#2a221c');
  for (let n = 0; n < 30; n++) s += ellipse(rnd() * W, 540 + rnd() * 170, 30 + rnd() * 70, 4 + rnd() * 6, '#5a6a70', `opacity="${0.12 + rnd() * 0.18}"`);
  // Pipes along the ceiling.
  s += rect(0, 18, W, 30, '#3a2e26') + rect(0, 58, W, 18, '#2e241e');
  for (let x = 60; x < W; x += 210) s += rect(x, 12, 16, 70, '#4a3a2e');
  // A failing lamp.
  s += rect(glowX - 12, 84, 24, 30, '#3a2a1e') + rect(glowX - 8, 92, 16, 18, '#ffc870') + ellipse(glowX, 110, 160, 110, 'url(#warm)', 'opacity="0.45"');
  return s;
};
const darken = '<rect width="1280" height="720" fill="#000" opacity="0.18"/>';
{
  // 1. The collapsed tunnel: rubble down on the way back (left), the grate at the far end (the way on).
  let s = tunnelBase(640);
  s += poly([[0, 300], [80, 260], [190, 330], [240, 470], [260, 600], [0, 640]], '#3a302a');
  for (let n = 0; n < 24; n++) s += poly([[rnd() * 230, 300 + rnd() * 320], [rnd() * 230 + 30, 310 + rnd() * 320], [rnd() * 230 + 10, 340 + rnd() * 320]], '#4e4238', `opacity="${0.6 + rnd() * 0.4}"`);
  s += rect(860, 330, 140, 170, '#0a0706');
  await save('tunnel-collapse', render(s + darken));
}
{
  // 2. The steam junction: two valve wheels (copper, iron) under a gauge; the leaking pipe with a
  //    copper band leading back to the copper valve; the passage on (right), the way back (left).
  let s = tunnelBase(300);
  s += rect(760, 220, 400, 70, '#4a3a2e') + rect(760, 230, 400, 12, '#b87333') + line(780, 236, 540, 236, '#b87333', 10) + line(540, 236, 540, 300, '#b87333', 10);
  s += rect(500, 300, 80, 60, '#3a2e26') + circle(530, 330, 26, 'none', 'stroke="#b87333" stroke-width="8"') + line(504, 330, 556, 330, '#b87333', 6) + line(530, 304, 530, 356, '#b87333', 6);
  s += rect(640, 300, 80, 60, '#3a2e26') + circle(670, 330, 26, 'none', 'stroke="#6a7a88" stroke-width="8"') + line(644, 330, 696, 330, '#6a7a88', 6) + line(670, 304, 670, 356, '#6a7a88', 6);
  s += circle(600, 230, 24, '#d8c8a0') + line(600, 230, 614, 218, '#7a2e1e', 4);
  s += rect(1200, 340, 80, 220, '#0a0706') + rect(0, 360, 60, 200, '#0a0706');
  await save('tunnel-steam', render(s + darken));
}
{
  // 3. The ash cistern: a pit across the floor (centre), the far ledge and the road beyond (right),
  //    a pulley over the pit with the counterweight chain hooked over a cleat (left of the pit), lying
  //    against a hot steam pipe.
  let s = tunnelBase(160);
  s += poly([[660, 500], [960, 500], [980, H], [640, H]], '#050404') + poly([[660, 500], [960, 500], [952, 520], [668, 520]], '#3a302a');
  s += rect(960, 360, 320, 360, '#2a221c') + ellipse(1180, 330, 140, 90, '#8a7a6a', 'opacity="0.25" filter="url(#softer)"');
  s += rect(590, 140, 22, 380, '#4a3a2e') + rect(590, 140, 22, 380, 'url(#warm)', 'opacity="0.35"');
  s += circle(800, 120, 20, '#4a3a2e') + line(800, 120, 570, 120, '#7a6a58', 4);
  for (let y = 124; y < 500; y += 14) s += ellipse(570, y + 7, 5, 8, 'none', `stroke="${y > 300 ? '#c07040' : '#8a7a68'}" stroke-width="3"`);
  s += rect(552, 500, 36, 14, '#4a3a2e');
  await save('tunnel-cistern', render(s + darken));
}

// Object sheets: frames side by side, Aseprite JSON with one tag per state (src/game/assets.ts).
const outObj = join(here, 'src', 'ch2', 'objects');
mkdirSync(outObj, { recursive: true });
async function objectSheet(name, w, h, frames) {
  if (isFinal(`ch2/objects/${name}.png`)) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * frames.length}" height="${h}">${defs}${frames.map(([, body], i) => `<g transform="translate(${i * w} 0)">${body}</g>`).join('')}</svg>`;
  await sharp(Buffer.from(svg)).png({ palette: true, colours: 64 }).toFile(join(outObj, `${name}.png`));
  const json = {
    frames: frames.map((_, i) => ({ filename: String(i), frame: { x: i * w, y: 0, w, h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h }, duration: 100 })),
    meta: { app: 'adventure art/ch2.mjs', version: '1', image: `${name}.png`, format: 'RGBA8888', size: { w: w * frames.length, h }, scale: '1',
      frameTags: frames.map(([tag], i) => ({ name: tag, from: i, to: i, direction: 'forward' })) },
  };
  writeFileSync(join(outObj, `${name}.json`), JSON.stringify(json, null, 1) + '\n');
}
const bars = (open) => {
  let s = rect(0, 0, 120, 150, '#2a221c') + rect(6, 6, 108, 144, '#0a0706');
  if (open) return s + poly([[6, 6], [40, 20], [40, 150], [6, 150]], '#5a4a3a');
  for (let x = 14; x < 112; x += 16) s += rect(x, 6, 6, 144, '#6a5a48');
  s += rect(6, 40, 108, 6, '#6a5a48') + rect(6, 100, 108, 6, '#6a5a48');
  for (let n = 0; n < 10; n++) s += ellipse(10 + rnd() * 100, 110 + rnd() * 40, 10 + rnd() * 14, 8 + rnd() * 8, '#4e4238');
  return s;
};
await objectSheet('grate', 120, 150, [['closed', bars(false)], ['open', bars(true)]]);
let jet = '';
for (let n = 0; n < 9; n++) jet += ellipse(70 + (rnd() - 0.5) * 40, 260 - n * 28, 26 + n * 4, 22, '#e8e4e0', `opacity="${0.55 - n * 0.04}" filter="url(#soft)"`);
await objectSheet('steam', 140, 260, [['on', jet], ['off', '']]);
const bridgeUp = rect(250, 0, 30, 220, '#5a4030') + rect(256, 0, 18, 220, '#7a5a3a') + line(265, 10, 100, 0, '#8a7a50', 4);
const bridgeDown = rect(10, 196, 300, 24, '#7a5a3a') + rect(10, 192, 300, 6, '#5a4030') + [40, 110, 180, 250].map(x => rect(x, 192, 8, 28, '#3a2a1e')).join('');
await objectSheet('bridge', 320, 220, [['up', bridgeUp], ['down', bridgeDown]]);
const basket = rect(36, 0, 6, 30, '#8a7a50') + poly([[6, 30], [74, 30], [64, 88], [16, 88]], '#6a4a2a') + [40, 52, 66].map(y => line(10, y, 70, y, '#4a3020', 3)).join('') + ellipse(40, 32, 30, 8, '#3a2a1e');
await objectSheet('basket', 80, 90, [['hanging', basket], ['gone', '']]);
// The oily rag caught in the rubble (only there for a Mara without Tobi's scarf), and its icon.
const ragShape = poly([[4, 40], [20, 18], [40, 26], [58, 10], [56, 36], [36, 44]], '#5a4a32') + line(14, 32, 48, 22, '#3a2e1e', 3) + line(22, 40, 52, 32, '#3a2e1e', 2);
await objectSheet('rag', 60, 46, [['idle', ragShape]]);
if (!isFinal('ch2/items/rag.png')) {
  mkdirSync(join(here, 'src', 'ch2', 'items'), { recursive: true });
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g transform="translate(2 8)">${ragShape}</g></svg>`)).png({ palette: true, colours: 32 }).toFile(join(here, 'src', 'ch2', 'items', 'rag.png'));
}

// The four tunnel creatures (placeholders): a fight picture 768 tall, the creature trimmed to exactly
// 60% of the height and standing 4% above the bottom (the fight screen's `ink`, src/kc/presentation.ts),
// as wide as it needs; and a small sprite for their entrance in the room.
const outCr = join(here, 'src', 'ch2', 'creatures');
mkdirSync(outCr, { recursive: true });
const eye = (x, y, r = 7) => circle(x, y, r + 5, '#ff7a20', 'opacity="0.5" filter="url(#soft)"') + circle(x, y, r, '#ffb040');
const rat = (x, y, k = 1, flip = 1) => `<g transform="translate(${x} ${y}) scale(${k * flip} ${k})">
  <path d="M-140 -10 C-260 -30 -300 -120 -230 -150" fill="none" stroke="#6a4a3a" stroke-width="12" stroke-linecap="round"/>
  ${ellipse(0, -70, 150, 80, '#4a3e38')}${ellipse(30, -95, 110, 50, '#5a4e46')}
  ${poly([[110, -110], [230, -60], [120, -30]], '#5a4e46')}${circle(228, -60, 9, '#2a1a14')}
  ${ellipse(110, -130, 26, 34, '#6a5a52')}${ellipse(110, -128, 14, 20, '#a87a6a')}
  ${eye(160, -85)}
  ${[-90, -30, 40, 90].map(dx => rect(dx, -20, 16, 26, '#3a2e28')).join('')}
  ${[...Array(9)].map((_, i) => line(-120 + i * 26, -140, -110 + i * 26, -152, '#7a6a5a', 4)).join('')}
</g>`;
const mite = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">
  ${ellipse(0, -30, 46, 30, '#5a5650')}${[...Array(6)].map((_, i) => line(-40 + i * 16, -10, -54 + i * 22, 14, '#3a3632', 5)).join('')}
  ${[...Array(5)].map((_, i) => poly([[-36 + i * 18, -52], [-28 + i * 18, -76], [-20 + i * 18, -52]], '#7a746a')).join('')}
  ${eye(30, -36, 5)}${circle(-10, -30, 4, '#ff8a30')}
</g>`;
const beetle = `<g transform="translate(384 736)">
  ${[...Array(6)].map((_, i) => line(-160 + i * 64, -40, -200 + i * 80, 0, '#2a2018', 12)).join('')}
  ${ellipse(0, -150, 230, 140, '#3a2a1e')}
  <path d="M-220 -150 Q0 -330 220 -150 Q0 -190 -220 -150 Z" fill="#b87333"/><path d="M0 -290 L0 -150" stroke="#6a4020" stroke-width="10"/>
  ${[...Array(5)].map((_, i) => circle(-140 + i * 70, -200 + (i % 2) * 20, 10, '#d8a060')).join('')}
  ${ellipse(240, -120, 60, 46, '#2a2018')}${eye(262, -128, 9)}${poly([[290, -110], [370, -90], [296, -80]], '#5a4030')}
</g>`;
const CREATURES = {
  'cinder-rat': rat(384, 736, 1.25),
  'rat-pack': rat(220, 736, 0.8) + rat(520, 716, 0.75, -1) + rat(380, 640, 0.6),
  'ash-mites': [[200, 736, 1.6], [400, 716, 1.9], [580, 736, 1.5], [300, 620, 1.2], [500, 600, 1.1], [390, 520, 1]].map(([x, y, k]) => mite(x, y, k)).join(''),
  'pipe-beetle': beetle,
};
for (const [id, body] of Object.entries(CREATURES)) {
  if (isFinal(`ch2/creatures/${id}.png`)) continue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768">${defs}${body}</svg>`;
  // Drawn facing right; mirrored so every enemy faces left (they always stand on the right of the fight).
  const trimmed = await sharp(Buffer.from(svg)).flop().trim({ threshold: 1 }).png().toBuffer();
  const inked = Math.round(768 * 0.6), floor = Math.round(768 * 0.04);
  const fitted = await sharp(trimmed).resize({ height: inked }).png().toBuffer();
  const { width } = await sharp(fitted).metadata();
  const w = width + 40;
  await sharp({ create: { width: w, height: 768, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted, left: 20, top: 768 - floor - inked }]).webp({ quality: 82, alphaQuality: 90 }).toFile(join(outCr, `${id}.webp`));
  // The room sprite: the creature alone, 120 tall (shown at up to 0.4, about 48 world units).
  await sharp(trimmed).resize({ height: 120 }).png({ palette: true, colours: 64 }).toFile(join(outCr, `${id}.png`));
}

console.log('Chapter 2 rooms, objects and creatures written to art/src/ch2.');
