// Mara's tent, painted from scratch: an SVG scene (canvas walls and ceiling, ridge pole and
// lantern, workbench, water jar, the old brush drum, a cot, a rug and the door flap) rendered by
// sharp, given grain, and palette-reduced like the other rooms. Also writes the stool as a
// walk-behind cut-out.
//
//   node art/tent.mjs   (part of npm run art; then npm run webp)
//
// The layout matches the tent's hotspots, walk area and objects in src/content/rooms.ts.
// Coordinates here are art pixels (2x the 640x360 world).
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src');
const W = 1280, H = 720;

const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;

// A seeded random source, so the painting is the same on every run.
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const defs = `
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="weave" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.18" numOctaves="3" seed="11"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.03  0 0 0 0.9 -0.25"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="softer"><feGaussianBlur stdDeviation="18"/></filter>
  <linearGradient id="backWall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7a4e2a"/><stop offset="0.55" stop-color="#9a6634"/><stop offset="1" stop-color="#5a381e"/>
  </linearGradient>
  <linearGradient id="ceilL" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4a2c18"/><stop offset="1" stop-color="#8a5a30"/>
  </linearGradient>
  <linearGradient id="ceilR" x1="1" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3e2614"/><stop offset="1" stop-color="#94623a"/>
  </linearGradient>
  <linearGradient id="sideWall" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7a4c28"/><stop offset="1" stop-color="#3a2414"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6a4426"/><stop offset="0.5" stop-color="#4e301a"/><stop offset="1" stop-color="#2a1a0e"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a5e38"/><stop offset="1" stop-color="#5a3a22"/>
  </linearGradient>
  <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#2e1c10"/>
  </linearGradient>
  <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffd890"/><stop offset="0.6" stop-color="#ffa850"/><stop offset="1" stop-color="#c8642a"/>
  </linearGradient>
  <linearGradient id="drum" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a3632"/><stop offset="0.35" stop-color="#6a625a"/><stop offset="1" stop-color="#24201c"/>
  </linearGradient>
  <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffd890" stop-opacity="0.75"/><stop offset="0.4" stop-color="#ffa040" stop-opacity="0.28"/><stop offset="1" stop-color="#ff8020" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="doorGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffb860" stop-opacity="0.55"/><stop offset="1" stop-color="#ff8030" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.52" cy="0.46" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/>
  </radialGradient>
  <radialGradient id="jar" cx="0.38" cy="0.4" r="0.7">
    <stop offset="0" stop-color="#c8946a"/><stop offset="0.6" stop-color="#8a5a3a"/><stop offset="1" stop-color="#4a2e1e"/>
  </radialGradient>
</defs>`;

// ------------------------------------------------------------- the canvas tent ---
function tentShell() {
  let s = '';
  // Ceiling: two slopes from the ridge (y 34) down to the wall tops, the right one darker.
  s += poly([[0, 34], [1280, 34], [1280, 150], [0, 150]], '#2a1a10');
  s += poly([[0, 34], [640, 34], [440, 190], [0, 250]], 'url(#ceilL)');
  s += poly([[640, 34], [1280, 34], [1280, 300], [1080, 180], [440, 190]], 'url(#ceilR)');
  // Back wall canvas, sagging a little between the poles.
  s += path('M440 190 Q760 206 1080 180 L1080 412 L440 456 Z', 'url(#backWall)');
  // Left wall behind the bench, and the right wall with the door in it.
  s += path('M0 250 L440 190 L440 456 L400 524 L0 584 Z', 'url(#sideWall)', 'opacity="0.95"');
  s += poly([[1080, 180], [1280, 300], [1280, 720], [1096, 624], [1080, 412]], 'url(#sideWall)');
  // Seams and folds: darker lines running down the canvas, curving with the sag.
  for (let i = 0; i < 9; i++) {
    const x = 470 + i * 72 + rnd() * 20;
    s += path(`M${x} ${196 + Math.sin(i) * 6} Q${x + 8} 320 ${x - 4} ${440 - (x - 440) * 0.07}`, 'none', `stroke="#4a2c16" stroke-width="${2 + rnd() * 2}" opacity="0.55"`);
  }
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    s += line(640 - t * 640, 34, 440 - t * 440, 190 + t * 60, '#3a2212', 3, 'opacity="0.45"');
    s += line(640 + t * 640, 34, 440 + t * 640, 190 - t * 10 + t * t * 110, '#2e1a0e', 3, 'opacity="0.4"');
  }
  // Light catching the folds of the ceiling near the lantern.
  s += `<ellipse cx="820" cy="120" rx="320" ry="110" fill="url(#lampGlow)" opacity="0.55"/>`;
  // Patches: a flour sack and a square of darker cloth.
  s += poly([[900, 230], [990, 226], [994, 300], [904, 306]], '#b08a5a', 'opacity="0.85"');
  s += `<text x="947" y="272" font-family="Georgia, serif" font-size="18" fill="#6a4a2a" text-anchor="middle" opacity="0.7" transform="rotate(-2 947 272)">FINEST</text>`;
  s += poly([[520, 250], [580, 246], [582, 300], [522, 304]], '#6a3e22', 'opacity="0.8"');
  for (const [x, y] of [[904, 232], [988, 228], [990, 298], [906, 302], [522, 252], [578, 248]]) s += `<circle cx="${x}" cy="${y}" r="2.5" fill="#2a1a10"/>`;
  // The weave texture over all the canvas.
  s += rect(0, 34, 1280, 600, '#000', 'filter="url(#weave)" opacity="0.6"');
  return s;
}

// The ridge pole and the poles holding the tent up.
function poles() {
  let s = '';
  s += rect(0, 22, 1280, 18, 'url(#woodDark)');
  s += line(0, 24, 1280, 24, '#8a6040', 2, 'opacity="0.6"');
  s += rect(432, 186, 16, 280, 'url(#woodDark)');
  s += rect(1072, 176, 16, 246, 'url(#woodDark)');
  // Rope ties along the ridge.
  for (const x of [120, 300, 480, 980, 1160]) s += rect(x, 18, 8, 26, '#6a5032');
  return s;
}

// A lantern on a hook from the ridge, and drying herbs.
function lantern() {
  let s = '';
  s += line(820, 40, 820, 70, '#2a2018', 3);
  s += `<circle cx="820" cy="120" r="150" fill="url(#lampGlow)"/>`;
  s += path('M800 70 L840 70 L846 80 L794 80 Z', '#3a2a1c');
  s += rect(798, 80, 44, 56, '#ffcc70', 'rx="4"');
  s += rect(806, 86, 28, 44, '#fff0c0', 'rx="4"');
  for (const x of [798, 818, 838]) s += rect(x, 80, 4, 56, '#3a2a1c');
  s += path('M794 136 L846 136 L840 146 L800 146 Z', '#3a2a1c');
  for (const [x, len] of [[560, 70], [600, 54], [640, 80], [1000, 60], [1030, 74]]) {
    s += line(x, 40, x, 40 + len * 0.4, '#5a4a2a', 2);
    s += path(`M${x - 10} ${40 + len * 0.4} Q${x} ${40 + len} ${x + 10} ${40 + len * 0.4} Z`, '#5a6a32', 'opacity="0.9"');
    s += path(`M${x - 5} ${40 + len * 0.45} Q${x} ${40 + len * 0.85} ${x + 5} ${40 + len * 0.45} Z`, '#7a8a42', 'opacity="0.8"');
  }
  return s;
}

// The floor: packed earth, a woven rug, scattered straw and ash.
function floor() {
  let s = '';
  s += path('M0 584 L400 524 L440 456 L1080 412 L1096 624 L1280 720 L0 720 Z', 'url(#floor)');
  // Rug in perspective, with stripes and a border.
  const rug = [[520, 520], [1010, 500], [1060, 650], [470, 690]];
  s += poly(rug, '#7a2e1e');
  s += poly([[540, 530], [995, 512], [1040, 640], [492, 676]], '#9a4a2a');
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    const a = [540 + (492 - 540) * t, 530 + (676 - 530) * t], b = [995 + (1040 - 995) * t, 512 + (640 - 512) * t];
    s += line(a[0], a[1], b[0], b[1], i % 2 ? '#c8803a' : '#5a2216', 5, 'opacity="0.75"');
  }
  s += poly(rug, 'none', 'stroke="#3a160e" stroke-width="5"');
  // Straw and ash flecks.
  for (let i = 0; i < 120; i++) {
    const x = rnd() * 1280, y = 470 + rnd() * 250;
    if (y < 470 + (x < 440 ? 120 - x * 0.1 : 0)) continue;
    s += line(x, y, x + 6 + rnd() * 10, y + (rnd() - 0.5) * 6, rnd() < 0.5 ? '#a8864a' : '#5a5048', 1.5, 'opacity="0.6"');
  }
  // The lantern's pool of light, and soft shadows under the furniture.
  s += `<ellipse cx="760" cy="560" rx="360" ry="110" fill="url(#lampGlow)" opacity="0.6"/>`;
  for (const [cx, cy, rx, ry] of [[200, 540, 220, 30], [600, 440, 200, 18], [930, 446, 140, 14], [244, 604, 100, 14]]) {
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#100804" opacity="0.55" filter="url(#soft)"/>`;
  }
  // Light from the door flap across the floor.
  s += `<ellipse cx="1110" cy="640" rx="240" ry="80" fill="url(#doorGlow)"/>`;
  s += rect(0, 470, 1280, 250, '#000', 'filter="url(#grain)" opacity="0.5"');
  return s;
}

// The door: the right wall's flap pulled aside on the kiln hall's warm light.
function door() {
  let s = '';
  s += path('M1140 330 Q1190 318 1246 334 L1252 676 L1132 652 Z', 'url(#doorLight)');
  // Hints of the hall beyond: a pillar and a far glow.
  s += rect(1196, 360, 22, 300, '#7a3a1a', 'opacity="0.5"');
  s += `<ellipse cx="1190" cy="420" rx="60" ry="40" fill="#fff0c0" opacity="0.5" filter="url(#soft)"/>`;
  // The flap, gathered to the left and tied back with a cord.
  s += path('M1140 330 Q1124 470 1132 652 L1100 636 Q1088 470 1110 326 Z', '#6a4024');
  s += path('M1110 326 Q1096 470 1104 638', 'none', 'stroke="#4a2a14" stroke-width="4"');
  s += line(1100, 470, 1136, 476, '#c8a060', 5);
  // The hem around the opening.
  s += path('M1140 330 Q1190 318 1246 334', 'none', 'stroke="#4a2a14" stroke-width="8"');
  s += path('M1246 334 L1252 676', 'none', 'stroke="#4a2a14" stroke-width="8"');
  s += `<ellipse cx="1190" cy="500" rx="120" ry="200" fill="url(#doorGlow)" opacity="0.7"/>`;
  return s;
}

// The workbench on the left: top, front, legs, tools hung above on a plank, gloves, apricots.
function workbench() {
  let s = '';
  // Tool plank on the wall, with tools.
  s += poly([[20, 210], [400, 176], [400, 200], [20, 236]], 'url(#wood)');
  const tools = [[60, 'wrench'], [110, 'saw'], [170, 'pliers'], [230, 'hammer'], [290, 'file'], [345, 'wrench']];
  for (const [x, kind] of tools) {
    const y = 236 - (x - 20) * 0.09;
    if (kind === 'saw') s += poly([[x - 10, y], [x + 10, y], [x + 6, y + 70], [x - 6, y + 70]], '#8a8680', 'opacity="0.9"');
    else if (kind === 'hammer') { s += rect(x - 3, y, 6, 64, '#7a5232'); s += rect(x - 14, y + 58, 28, 12, '#4a4642'); }
    else if (kind === 'pliers') { s += path(`M${x - 6} ${y} L${x - 2} ${y + 60} L${x + 2} ${y + 60} L${x + 6} ${y} Z`, '#5a5652'); }
    else if (kind === 'file') s += rect(x - 3, y, 6, 70, '#6a6662');
    else { s += rect(x - 4, y, 8, 56, '#6a6662'); s += `<circle cx="${x}" cy="${y + 60}" r="10" fill="none" stroke="#6a6662" stroke-width="6"/>`; }
    s += `<circle cx="${x}" cy="${y - 2}" r="3" fill="#2a1a10"/>`;
  }
  // Bench top (seen from slightly above), front edge, legs, a shelf below.
  s += poly([[0, 318], [384, 300], [392, 330], [0, 352]], 'url(#wood)');
  s += poly([[0, 352], [392, 330], [392, 352], [0, 376]], '#4a2e1a');
  for (let i = 0; i < 4; i++) s += line(0, 326 + i * 7, 386, 306 + i * 7, '#5a3a22', 1.5, 'opacity="0.6"');
  s += rect(22, 372, 22, 176, 'url(#woodDark)');
  s += rect(352, 350, 22, 176, 'url(#woodDark)');
  s += poly([[30, 470], [370, 452], [370, 466], [30, 486]], '#4a2e1a');
  // Crates and a coil of rope on the shelf.
  s += rect(70, 418, 90, 56, '#6a4428', 'stroke="#3a2214" stroke-width="3"');
  s += line(70, 446, 160, 446, '#3a2214', 3);
  s += `<ellipse cx="250" cy="446" rx="44" ry="18" fill="none" stroke="#a8864a" stroke-width="8"/>`;
  s += `<ellipse cx="250" cy="446" rx="28" ry="10" fill="none" stroke="#8a6a3a" stroke-width="6"/>`;
  // Gloves and the bowl of dried apricots on the bench.
  s += path('M60 318 Q70 296 96 300 L120 306 Q126 318 110 324 L72 330 Z', '#c8b08a');
  s += path('M74 304 L78 292 M86 300 L92 288 M98 302 L104 292', 'none', 'stroke="#a89068" stroke-width="5" stroke-linecap="round"');
  s += path('M196 302 Q230 330 264 300 Z', '#8a8680');
  for (let i = 0; i < 9; i++) s += `<circle cx="${206 + (i % 5) * 12}" cy="${300 - Math.floor(i / 5) * 6}" r="7" fill="${i % 2 ? '#e8902a' : '#d07a20'}"/>`;
  // A candle stub.
  s += rect(336, 280, 12, 24, '#e8dcc0');
  s += `<ellipse cx="342" cy="276" rx="4" ry="8" fill="#ffd070"/>`;
  return s;
}

// The water jar, standing on the back of the bench.
function jar() {
  let s = '';
  s += path('M150 318 Q132 270 150 236 Q160 222 170 216 L170 204 L210 204 L210 216 Q222 222 230 236 Q248 270 230 318 Z', 'url(#jar)');
  s += `<ellipse cx="190" cy="204" rx="22" ry="7" fill="#3a2214"/>`;
  s += path('M170 236 Q190 244 210 236', 'none', 'stroke="#5a3a24" stroke-width="3"');
  s += path('M226 238 Q252 252 236 280', 'none', 'stroke="#7a4a2e" stroke-width="7"');
  return s;
}

// The old brush drum from a sweeper, on a trestle, kept "for parts".
function drum() {
  let s = '';
  // Trestle legs.
  s += poly([[430, 446], [452, 446], [500, 300], [486, 300]], 'url(#woodDark)');
  s += poly([[750, 432], [772, 432], [710, 296], [696, 296]], 'url(#woodDark)');
  s += rect(440, 420, 340, 14, '#4a2e1a');
  // The drum: a cylinder lying on its side, bristles all round.
  s += rect(470, 254, 260, 132, 'url(#drum)', 'rx="10"');
  for (let i = 0; i < 70; i++) {
    const x = 478 + (i * 3.7) % 250;
    const top = 250 + rnd() * 8, bottom = 390 - rnd() * 8;
    s += line(x, top, x + (rnd() - 0.5) * 6, top - 26 - rnd() * 14, '#2a2420', 3, 'opacity="0.9"');
    s += line(x, bottom, x + (rnd() - 0.5) * 6, bottom + 22 + rnd() * 12, '#2a2420', 3, 'opacity="0.9"');
  }
  for (let i = 0; i < 40; i++) {
    const x = 480 + rnd() * 240, y = 222 + rnd() * 30;
    s += line(x, y, x + 2, y + 6, '#6a645c', 2, 'opacity="0.5"');
  }
  // End caps and the axle.
  for (const x of [470, 730]) {
    s += `<ellipse cx="${x}" cy="320" rx="26" ry="74" fill="#4a4440" stroke="#22201c" stroke-width="4"/>`;
    s += `<circle cx="${x}" cy="320" r="10" fill="#8a8278"/>`;
  }
  s += rect(400, 314, 60, 12, '#5a524a');
  s += `<circle cx="398" cy="320" r="14" fill="none" stroke="#6a625a" stroke-width="6"/>`;
  return s;
}

// A low cot with a bedroll, between the drum and the door.
function cot() {
  let s = '';
  s += poly([[800, 404], [1060, 392], [1062, 418], [800, 432]], '#5a3a22');
  s += rect(806, 428, 10, 30, '#3a2414');
  s += rect(1050, 414, 10, 30, '#3a2414');
  s += path('M806 404 Q900 372 1056 386 L1058 400 Q930 392 806 414 Z', '#6a7a5a');
  s += `<ellipse cx="1030" cy="388" rx="34" ry="18" fill="#c8b48a"/>`;
  s += path('M830 400 Q920 384 1000 392', 'none', 'stroke="#4a5a3e" stroke-width="4"');
  // A pinned drawing above the cot (one of Tobi's).
  s += poly([[1006, 230], [1060, 226], [1062, 290], [1008, 294]], '#e8dcc0');
  s += path('M1018 280 L1034 244 L1050 280 Z', 'none', 'stroke="#c86a2a" stroke-width="3"');
  s += `<circle cx="1034" cy="262" r="5" fill="#ffb040"/>`;
  return s;
}

// The stool, in front: a separate group so it can also be cut out as a walk-behind piece.
function stool() {
  let s = '';
  s += path('M166 438 Q240 416 322 438 L320 458 Q240 476 168 458 Z', 'url(#wood)');
  s += `<ellipse cx="244" cy="438" rx="78" ry="18" fill="#9a6a40"/>`;
  s += `<ellipse cx="244" cy="436" rx="60" ry="12" fill="#aa7a4a" opacity="0.7"/>`;
  s += path('M226 432 Q240 440 262 430', 'none', 'stroke="#6a4428" stroke-width="2"');
  s += poly([[180, 456], [194, 456], [168, 600], [154, 600]], 'url(#woodDark)');
  s += poly([[296, 456], [310, 456], [334, 598], [320, 598]], 'url(#woodDark)');
  s += poly([[226, 464], [240, 464], [236, 604], [222, 604]], 'url(#woodDark)');
  // The fourth leg: a pipe offcut.
  s += rect(262, 462, 12, 136, '#7a7470', 'rx="3"');
  s += rect(260, 590, 16, 8, '#5a5450');
  s += line(170, 530, 320, 528, '#4a2e1a', 6);
  return s;
}

const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
  ${rect(0, 0, W, H, '#1a1008')}
  ${tentShell()}
  ${floor()}
  ${poles()}
  ${door()}
  ${cot()}
  ${drum()}
  ${workbench()}
  ${jar()}
  ${lantern()}
  ${stool()}
  ${rect(0, 0, W, H, 'url(#vignette)')}
  ${rect(0, 0, W, H, '#000', 'filter="url(#grain)" opacity="0.35"')}
</svg>`;

const stoolOnly = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${stool()}</svg>`;

mkdirSync(join(out, 'rooms'), { recursive: true });
mkdirSync(join(out, 'foreground'), { recursive: true });
// Palette-reduced like the painted rooms (pixel-art grain, no banding thanks to dithering).
await sharp(Buffer.from(scene)).png({ palette: true, colours: 128, dither: 0.7, effort: 10 }).toFile(join(out, 'rooms', 'tent.png'));
// The stool, cropped to the same box the room def places it at (world 73,204 → art 146,408).
await sharp(Buffer.from(stoolOnly)).extract({ left: 146, top: 408, width: 194, height: 198 })
  .png({ palette: true, colours: 48, dither: 0.5, effort: 10 }).toFile(join(out, 'foreground', 'tent-stool.png'));
console.log('Painted the tent: art/src/rooms/tent.png and foreground/tent-stool.png.');
