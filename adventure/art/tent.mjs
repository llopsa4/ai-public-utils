// Mara's tent, painted from scratch as an SVG scene and rendered by sharp as pixel art (reduced to
// a 320x180 grid, 4 screen pixels each, with a 48-colour palette, then scaled up with hard edges): a side-on view with
// little perspective and things in believable proportions. The canvas back wall sags between
// its poles; the workbench runs along the left (tools on a board above it, the charging cradle,
// the notebook and the water jar on it); the old brush drum stands smaller on its trestle by the
// back wall; the cot is on the right with the door flap at the right edge, open on the kiln
// hall's warm light. A hanging lantern is the main light, with soft falloff and a cast shadow
// under everything; the canvas, wood and metal carry texture. Lived-in clutter: a coat on a
// hook, boots, rags, a tool roll, a crate, a scuffed floor and a rug. Also writes the stool as a
// walk-behind cut-out.
//
//   node art/tent.mjs   (part of npm run art; then npm run webp)
//
// The layout matches the tent's hotspots, walk area and objects in src/chapters/ch1/rooms.ts.
// Coordinates here are art pixels (2x the 640x360 world).
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src');
const W = 1280, H = 720;
/** The floor line: the back wall meets the floor here (art y). */
const FLOOR = 480;

const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, width, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
/** A soft contact shadow on the floor (blurred, darker at the centre). */
const shadow = (cx, cy, rx, ry, a = 0.6) => ellipse(cx, cy, rx, ry, '#0a0503', `opacity="${a}" filter="url(#soft)"`);

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
  <!-- Canvas: a fine cross weave plus slow blotches of wear. -->
  <filter id="weave" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="2" seed="11" result="w"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="5" result="b"/>
    <feBlend in="w" in2="b" mode="multiply"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 1.1 -0.38"/>
  </filter>
  <!-- Wood grain: long stretched noise along the boards. -->
  <filter id="grain-h" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="3" seed="21"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0 0.02  0 0 0 1.4 -0.55"/>
  </filter>
  <filter id="grain-v" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.12 0.004" numOctaves="3" seed="23"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0 0.02  0 0 0 1.4 -0.55"/>
  </filter>
  <!-- Packed earth: clumpy noise. -->
  <filter id="earth" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="4" seed="31"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 1.2 -0.4"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="softer"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
  <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2e1c10"/><stop offset="1" stop-color="#6a4426"/>
  </linearGradient>
  <linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a5c32"/><stop offset="0.6" stop-color="#9a6a3a"/><stop offset="1" stop-color="#5e3c20"/>
  </linearGradient>
  <!-- Folds: soft vertical light and dark bands across one canvas panel. -->
  <linearGradient id="folds" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.12" stop-color="#fff" stop-opacity="0.05"/>
    <stop offset="0.3" stop-color="#000" stop-opacity="0.12"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.08"/>
    <stop offset="0.68" stop-color="#000" stop-opacity="0.14"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.04"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.38"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3e2816"/><stop offset="0.25" stop-color="#5a3c22"/><stop offset="1" stop-color="#2a1a0e"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a0703e"/><stop offset="1" stop-color="#6a4426"/>
  </linearGradient>
  <linearGradient id="woodSide" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5a3a20"/><stop offset="1" stop-color="#3a2412"/>
  </linearGradient>
  <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2412"/><stop offset="0.4" stop-color="#7a5230"/><stop offset="1" stop-color="#2a180c"/>
  </linearGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a2622"/><stop offset="0.28" stop-color="#7a7068"/><stop offset="0.42" stop-color="#9a9088"/>
    <stop offset="0.6" stop-color="#4a4440"/><stop offset="1" stop-color="#1a1714"/>
  </linearGradient>
  <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe2a8"/><stop offset="0.6" stop-color="#ffb060"/><stop offset="1" stop-color="#d06a2a"/>
  </linearGradient>
  <linearGradient id="shaft" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0" stop-color="#ffc070" stop-opacity="0.42"/><stop offset="1" stop-color="#ffa050" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffe0a0" stop-opacity="0.85"/><stop offset="0.35" stop-color="#ffaa50" stop-opacity="0.3"/><stop offset="1" stop-color="#ff8020" stop-opacity="0"/>
  </radialGradient>
  <!-- The lantern's falloff: everything darkens with distance from it. -->
  <radialGradient id="falloff" cx="${640 / W}" cy="${150 / H}" r="0.78" gradientTransform="translate(0 0) scale(1 1)">
    <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.35" stop-color="#000" stop-opacity="0.08"/>
    <stop offset="0.75" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/>
  </radialGradient>
  <radialGradient id="warmBounce" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ff9a40" stop-opacity="0.35"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="jar" cx="0.35" cy="0.38" r="0.7">
    <stop offset="0" stop-color="#d8a478"/><stop offset="0.55" stop-color="#8e5c3a"/><stop offset="1" stop-color="#3e2618"/>
  </radialGradient>
  <linearGradient id="blanket" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7a8a62"/><stop offset="1" stop-color="#3e4a30"/>
  </linearGradient>
  <linearGradient id="aoUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
  <linearGradient id="aoDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="aoLeft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="aoRight" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.4"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="coat" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2a22"/><stop offset="0.5" stop-color="#6a4a36"/><stop offset="1" stop-color="#2e2018"/>
  </linearGradient>
</defs>`;

// ------------------------------------------------------------------ the shell ---
/** Canvas roof (underside), back wall panels sagging between the poles, seams and folds. */
function shell() {
  let s = '';
  // The roof's underside, sloping down from the ridge to the eave line.
  s += path('M0 30 L1280 30 L1280 150 Q960 168 640 154 Q320 168 0 150 Z', 'url(#roof)');
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 80 + rnd() * 20;
    s += path(`M${x} 34 Q${x + 6} 90 ${x - 4} ${152 + Math.sin(i) * 4}`, 'none', `stroke="#20130a" stroke-width="2.5" opacity="0.4"`);
  }
  // Back wall: three panels between the poles (x 0, 428, 858, 1280), each sagging a little.
  for (const [x0, x1] of [[0, 428], [428, 858], [858, 1280]]) {
    const mid = (x0 + x1) / 2;
    s += path(`M${x0} 150 Q${mid} 172 ${x1} 150 L${x1} ${FLOOR} L${x0} ${FLOOR} Z`, 'url(#canvas)');
    s += path(`M${x0} 150 Q${mid} 172 ${x1} 150 L${x1} ${FLOOR} L${x0} ${FLOOR} Z`, 'url(#folds)');
    // Seams: stitched lines running down, bowing with the sag.
    for (let k = 1; k < 3; k++) {
      const x = x0 + (x1 - x0) * k / 3 + (rnd() - 0.5) * 16;
      s += path(`M${x} ${160 + 8 * Math.sin(k)} Q${x + 5} 320 ${x - 3} ${FLOOR}`, 'none', 'stroke="#4a2c16" stroke-width="3" opacity="0.6"');
      s += path(`M${x + 4} ${162} Q${x + 9} 320 ${x + 1} ${FLOOR}`, 'none', 'stroke="#c08a52" stroke-width="1" stroke-dasharray="4 6" opacity="0.45"');
    }
    // The sag's shadow under the eave, and a darker hem at the floor.
    s += path(`M${x0} 150 Q${mid} 172 ${x1} 150 L${x1} 176 Q${mid} 198 ${x0} 176 Z`, '#1a0e06', 'opacity="0.35" filter="url(#blur2)"');
    s += rect(x0, FLOOR - 16, x1 - x0, 16, '#2a180c', 'opacity="0.55"');
  }
  // Patches: a flour sack sewn over a tear, and a square of darker cloth.
  s += poly([[650, 210], [742, 206], [746, 282], [652, 288]], '#b8925e', 'opacity="0.9"');
  s += `<text x="698" y="254" font-family="Georgia, serif" font-size="17" fill="#6a4a2a" text-anchor="middle" opacity="0.7" transform="rotate(-2 698 254)">FINEST</text>`;
  s += poly([[480, 230], [534, 226], [536, 276], [482, 280]], '#5e3a20', 'opacity="0.85"');
  for (const [x, y] of [[652, 212], [740, 208], [744, 280], [654, 286], [482, 232], [532, 228]]) s += circle(x, y, 2.5, '#2a1a10');
  // The weave texture over all the canvas.
  s += rect(0, 30, 1280, FLOOR - 30, '#000', 'filter="url(#weave)" opacity="0.75"');
  return s;
}

/** The ridge pole and the two wall poles, with grain and rope lashings. */
function poles() {
  let s = '';
  s += rect(0, 18, 1280, 18, 'url(#woodSide)') + rect(0, 18, 1280, 18, '#000', 'filter="url(#grain-h)" opacity="0.6"');
  s += line(0, 21, 1280, 21, '#9a7048', 2, 'opacity="0.5"');
  for (const x of [428, 858]) {
    s += rect(x - 9, 28, 18, FLOOR - 24, 'url(#pole)') + rect(x - 9, 28, 18, FLOOR - 24, '#000', 'filter="url(#grain-v)" opacity="0.7"');
    for (let k = 0; k < 4; k++) s += line(x - 11, 34 + k * 5, x + 11, 38 + k * 5, '#8a6a40', 3);
    s += shadow(x, FLOOR + 6, 26, 6, 0.7);
  }
  for (const x of [120, 300, 980, 1160]) s += rect(x, 14, 8, 26, '#6a5032');
  return s;
}

/** The lantern on a chain from the ridge, its glow, and herbs drying by the ridge. */
function lantern() {
  let s = '';
  for (let y = 36; y < 72; y += 7) s += ellipse(640, y + 3, 3, 4, 'none', 'stroke="#2a2018" stroke-width="2"');
  s += circle(640, 110, 230, 'url(#lampGlow)');
  s += circle(640, 66, 6, 'none', 'stroke="#8a6a30" stroke-width="3"');
  s += path('M626 70 L654 70 L666 84 L614 84 Z', '#7a5a28') + path('M630 72 L650 72 L658 82 L622 82 Z', '#b08a40', 'opacity="0.6"');
  s += rect(618, 84, 44, 50, '#ffd890', 'opacity="0.55"');
  s += path('M640 96 Q648 110 640 124 Q632 110 640 96 Z', '#ffb040') + path('M640 104 Q644 112 640 120 Q636 112 640 104 Z', '#fff4c0');
  for (const x of [617, 638, 659]) s += rect(x, 84, 4, 50, '#7a5a28') + rect(x, 84, 1, 50, '#d8b060', 'opacity="0.7"');
  s += rect(620, 86, 6, 44, '#fff', 'opacity="0.18"');
  s += path('M612 134 L668 134 L660 146 L620 146 Z', '#6a4a20') + rect(620, 146, 40, 4, '#4a3418');
  for (const [x, len] of [[200, 70], [236, 54], [270, 80], [1020, 60], [1052, 74]]) {
    s += line(x, 36, x, 36 + len * 0.4, '#5a4a2a', 2);
    s += path(`M${x - 10} ${36 + len * 0.4} Q${x} ${36 + len} ${x + 10} ${36 + len * 0.4} Z`, '#56663a', 'opacity="0.9"');
    s += path(`M${x - 5} ${36 + len * 0.45} Q${x} ${36 + len * 0.85} ${x + 5} ${36 + len * 0.45} Z`, '#7a8a46', 'opacity="0.8"');
  }
  return s;
}

/** The floor: packed earth, scuffs, straw, the rug, the lantern's pool and the door's light. */
function floor() {
  let s = '';
  s += rect(0, FLOOR, W, H - FLOOR, 'url(#floor)') + rect(0, FLOOR, W, H - FLOOR, '#000', 'filter="url(#earth)" opacity="0.8"');
  // Scuffed paths: lighter worn earth between the bench, the drum and the door.
  s += ellipse(640, 560, 420, 40, '#7a5434', 'opacity="0.35" filter="url(#softer)"');
  s += ellipse(1080, 520, 160, 26, '#7a5434', 'opacity="0.4" filter="url(#softer)"');
  // The rug: nearly flat (little perspective), woven stripes and a fringe.
  const rug = [[470, 572], [1000, 566], [1012, 650], [458, 658]];
  s += shadow(735, 616, 280, 46, 0.5);
  s += poly(rug, '#7a2e1e') + poly([[488, 580], [984, 574], [994, 642], [476, 650]], '#9a4a2a');
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8, y0 = 582 + t * 66;
    s += line(488 - t * 12, y0, 984 + t * 10, y0 - 6, i % 2 ? '#d08a40' : '#5a2216', 5, 'opacity="0.75"');
  }
  for (let i = 0; i < 60; i++) s += line(474 + i * 9, 572 - 1, 472 + i * 9, 564, '#c89a60', 2, 'opacity="0.6"');
  s += rect(458, 566, 556, 92, '#000', 'filter="url(#weave)" opacity="0.5"');
  // Straw and ash flecks.
  for (let i = 0; i < 160; i++) {
    const x = rnd() * W, y = FLOOR + 6 + rnd() * (H - FLOOR - 6);
    s += line(x, y, x + 6 + rnd() * 10, y + (rnd() - 0.5) * 4, rnd() < 0.55 ? '#b08c50' : '#5a5048', 1.5, 'opacity="0.55"');
  }
  // The lantern's pool of light.
  s += ellipse(640, 560, 420, 110, 'url(#lampGlow)', 'opacity="0.55"');
  // Light from the door flap, falling across the floor towards the room.
  s += poly([[1112, FLOOR], [1250, FLOOR], [1180, H], [860, H]], 'url(#shaft)', 'filter="url(#soft)"');
  s += rect(0, FLOOR, W, H - FLOOR, '#000', 'filter="url(#grain)" opacity="0.5"');
  return s;
}

/** The door: a slit in the back wall at the right, the flap tied back on the kiln hall's light. */
function door() {
  let s = '';
  s += path(`M1118 ${FLOOR} L1124 214 Q1182 196 1242 214 L1248 ${FLOOR} Z`, 'url(#doorLight)');
  // The kiln hall beyond: a far pillar and a bright haze.
  s += rect(1196, 250, 18, 230, '#8a4a22', 'opacity="0.45"');
  s += ellipse(1176, 300, 60, 40, '#fff4d0', 'opacity="0.6" filter="url(#soft)"');
  // The flap, gathered to the left and tied back with a cord; the hem around the opening.
  s += path(`M1124 214 Q1100 340 1110 ${FLOOR} L1080 ${FLOOR} Q1066 340 1094 210 Z`, '#6a4024');
  s += path(`M1094 210 Q1078 340 1088 ${FLOOR}`, 'none', 'stroke="#3e2410" stroke-width="4"');
  s += line(1078, 340, 1116, 346, '#c8a060', 5);
  s += path('M1124 214 Q1182 196 1242 214', 'none', 'stroke="#4a2a14" stroke-width="8"');
  s += path(`M1242 214 L1248 ${FLOOR}`, 'none', 'stroke="#4a2a14" stroke-width="8"');
  // Warm bounce of that light on the canvas around it.
  s += ellipse(1150, 340, 190, 220, 'url(#warmBounce)');
  return s;
}

/** The workbench on the left, its tool board, and what sits on and under it. */
function workbench() {
  let s = '';
  // Tool board on the canvas, and tools hung from nails, each with a soft shadow on the cloth.
  s += rect(20, 196, 210, 22, 'url(#wood)') + rect(20, 196, 210, 22, '#000', 'filter="url(#grain-h)" opacity="0.6"');
  const tools = [[44, 'wrench'], [86, 'saw'], [132, 'pliers'], [170, 'hammer'], [208, 'file']];
  for (const [x, kind] of tools) {
    const y = 218;
    let t = '';
    if (kind === 'saw') {
      // A handsaw hung by its wooden handle: tapered blade, teeth down the edge.
      t = path(`M${x - 4} ${y + 14} L${x + 8} ${y + 14} L${x + 5} ${y + 74} L${x - 3} ${y + 74} Z`, 'url(#metal)');
      for (let k = 0; k < 10; k++) t += poly([[x - 4 + k * 0.1, y + 18 + k * 6], [x - 8 + k * 0.1, y + 21 + k * 6], [x - 4 + k * 0.1, y + 24 + k * 6]], '#5a5450');
      t += path(`M${x - 8} ${y - 2} Q${x + 2} ${y - 6} ${x + 12} ${y - 2} L${x + 10} ${y + 16} L${x - 6} ${y + 16} Z`, '#7a4a26') + ellipse(x + 2, y + 6, 4, 3, '#2a1a10');
    } else if (kind === 'hammer') {
      // A claw hammer: wooden shaft, steel head with a split claw.
      t = rect(x - 3, y, 6, 60, '#8a5a32') + rect(x - 3, y, 2, 60, '#b07a48', 'opacity="0.6"');
      t += path(`M${x - 13} ${y + 56} L${x + 6} ${y + 56} L${x + 6} ${y + 70} L${x - 13} ${y + 70} Z`, 'url(#metal)');
      t += path(`M${x + 6} ${y + 58} Q${x + 16} ${y + 58} ${x + 20} ${y + 50} L${x + 18} ${y + 62} Q${x + 14} ${y + 68} ${x + 6} ${y + 68} Z`, '#4a4642');
    } else if (kind === 'pliers') {
      // Pliers: two handles crossing at a rivet, short jaws at the bottom.
      t = path(`M${x - 7} ${y} Q${x - 6} ${y + 30} ${x - 1} ${y + 44}`, 'none', 'stroke="#a02a1a" stroke-width="5" stroke-linecap="round"');
      t += path(`M${x + 7} ${y} Q${x + 6} ${y + 30} ${x + 1} ${y + 44}`, 'none', 'stroke="#a02a1a" stroke-width="5" stroke-linecap="round"');
      t += path(`M${x - 3} ${y + 42} L${x + 3} ${y + 42} L${x + 2} ${y + 62} L${x - 2} ${y + 62} Z`, 'url(#metal)') + circle(x, y + 44, 3, '#c8beb0');
    } else if (kind === 'file') {
      t = rect(x - 3, y + 16, 6, 52, 'url(#metal)') + rect(x - 4, y, 8, 18, '#6a4426');
      for (let k = 0; k < 9; k++) t += line(x - 3, y + 20 + k * 5, x + 3, y + 22 + k * 5, '#2a2622', 1);
    } else {
      // An open-ended wrench: shaft and a jawed head.
      t = rect(x - 4, y + 10, 8, 50, 'url(#metal)');
      t += path(`M${x - 12} ${y + 58} Q${x} ${y + 76} ${x + 12} ${y + 58} L${x + 6} ${y + 58} L${x + 4} ${y + 66} L${x - 4} ${y + 66} L${x - 6} ${y + 58} Z`, 'url(#metal)');
      t += circle(x, y + 6, 7, 'none', 'stroke="#7a7068" stroke-width="5"');
    }
    s += `<g transform="translate(6 5)" opacity="0.35" filter="url(#blur2)">${t.replace(/url\(#metal\)|#[0-9a-f]{6}/g, '#0a0503')}</g>` + t;
    s += circle(x, y - 2, 3, '#2a1a10');
  }
  // The bench: a thick top seen almost edge-on, an apron, legs, a low shelf.
  s += shadow(214, 512, 230, 16, 0.65);
  s += rect(36, 372, 20, 140, 'url(#woodSide)') + rect(380, 372, 20, 140, 'url(#woodSide)');
  s += rect(46, 450, 344, 12, '#4a2e1a');
  s += rect(14, 356, 412, 18, 'url(#wood)') + rect(14, 356, 412, 18, '#000', 'filter="url(#grain-h)" opacity="0.7"');
  s += rect(14, 352, 412, 5, '#c08a56', 'opacity="0.8"');
  s += rect(22, 374, 396, 16, '#3e2614');
  // Under the bench: a crate with a stencil, a coil of rope, rags.
  s += rect(70, 406, 96, 44, '#6a4428', 'stroke="#3a2214" stroke-width="3"') + rect(70, 406, 96, 44, '#000', 'filter="url(#grain-h)" opacity="0.5"');
  s += line(70, 428, 166, 428, '#3a2214', 3);
  s += `<text x="118" y="424" font-family="Georgia, serif" font-size="11" fill="#2a1a10" text-anchor="middle" opacity="0.6">K-7</text>`;
  s += ellipse(250, 440, 40, 10, 'none', 'stroke="#a8864a" stroke-width="8"') + ellipse(250, 440, 24, 6, 'none', 'stroke="#8a6a3a" stroke-width="6"');
  s += path('M310 450 Q330 426 352 440 Q366 432 372 450 Z', '#8a7a68');
  // On the bench: a tool roll, gloves, a rag, the bowl of dried apricots and a candle stub.
  s += rect(30, 336, 70, 18, '#5a4030', 'rx="6"') + line(42, 338, 42, 352, '#2a1a10', 2) + line(66, 338, 66, 352, '#2a1a10', 2);
  s += path('M190 354 Q202 334 226 338 L248 344 Q254 354 238 358 L200 360 Z', '#c8b08a');
  s += path('M204 340 L208 328 M216 336 L222 324 M228 338 L234 328', 'none', 'stroke="#a89068" stroke-width="5" stroke-linecap="round"');
  s += path('M262 352 Q290 372 318 352 Z', '#8a8680');
  for (let i = 0; i < 8; i++) s += circle(272 + (i % 4) * 12, 350 - Math.floor(i / 4) * 6, 6.5, i % 2 ? '#e8902a' : '#d07a20');
  s += ellipse(113, 352, 9, 3, '#d8ccb0') + rect(108, 332, 10, 20, '#ece2c8') + rect(108, 332, 3, 20, '#fff6e0', 'opacity="0.6"');
  s += path('M118 334 Q121 340 119 346 Q117 340 116 334 Z', '#ece2c8') + line(113, 332, 113, 327, '#2a1a10', 1.5);
  s += ellipse(113, 322, 4, 7, '#ffd070') + ellipse(113, 324, 2, 4, '#fff4c0') + circle(113, 322, 18, 'url(#lampGlow)', 'opacity="0.6"');
  return s;
}

/** The water jar on the bench (left of the cradle). */
function jar() {
  let s = '';
  s += ellipse(262, 354, 34, 6, '#0a0503', 'opacity="0.5" filter="url(#blur2)"');
  s += path('M300 268 Q330 276 322 304 Q316 318 302 316', 'none', 'stroke="#6a3e26" stroke-width="7" stroke-linecap="round"');
  s += path('M238 354 Q222 308 238 274 Q248 262 256 258 L256 248 L286 248 L286 258 Q296 262 304 274 Q320 308 304 354 Z', 'url(#jar)');
  s += path('M240 292 Q271 300 302 292 L302 296 Q271 304 240 296 Z', '#5a7a6a', 'opacity="0.7"');
  for (const [x, len] of [[252, 14], [266, 22], [284, 10], [296, 18]]) s += path(`M${x - 3} 296 Q${x} ${296 + len} ${x + 3} 296 Z`, '#5a7a6a', 'opacity="0.7"');
  s += ellipse(271, 248, 18, 5, '#2a160c') + ellipse(271, 246, 18, 4, 'none', 'stroke="#b07a52" stroke-width="2"');
  s += path('M256 274 Q271 282 286 274', 'none', 'stroke="#5a3a24" stroke-width="3"');
  s += ellipse(250, 300, 5, 18, '#ffe0c0', 'opacity="0.5"') + ellipse(248, 286, 2, 5, '#fff', 'opacity="0.6"');
  return s;
}

/** The old brush drum from a sweeper, smaller now, on its trestle against the back wall. */
function drum() {
  let s = '';
  s += shadow(640, FLOOR + 10, 140, 12, 0.7);
  s += poly([[548, FLOOR + 8], [566, FLOOR + 8], [604, 420], [590, 420]], 'url(#woodSide)');
  s += poly([[714, FLOOR + 8], [732, FLOOR + 8], [690, 420], [676, 420]], 'url(#woodSide)');
  s += rect(560, 452, 160, 10, '#4a2e1a');
  // The drum on its side: a metal core with bristles above and below.
  for (let i = 0; i < 60; i++) {
    const x = 560 + (i * 2.7) % 160, top = 352 + rnd() * 4, bottom = 428 - rnd() * 4;
    s += line(x, top, x + (rnd() - 0.5) * 5, top - 16 - rnd() * 8, '#2a2420', 2.5, 'opacity="0.9"');
    s += line(x, bottom, x + (rnd() - 0.5) * 5, bottom + 14 + rnd() * 6, '#2a2420', 2.5, 'opacity="0.9"');
  }
  s += rect(556, 350, 168, 80, 'url(#metal)', 'rx="8"');
  s += rect(560, 362, 160, 4, '#c8beb0', 'opacity="0.35"');
  for (const x of [556, 724]) s += ellipse(x, 390, 14, 42, '#4a4440', 'stroke="#1e1c18" stroke-width="3"') + circle(x, 390, 6, '#8a8278');
  s += rect(504, 386, 40, 8, 'url(#metal)') + circle(502, 390, 9, 'none', 'stroke="#6a625a" stroke-width="5"');
  // Rust and a chalked "PARTS".
  s += ellipse(640, 410, 40, 8, '#7a3a1a', 'opacity="0.4" filter="url(#blur2)"');
  s += `<text x="640" y="396" font-family="Georgia, serif" font-size="14" fill="#e8e0d0" text-anchor="middle" opacity="0.45">PARTS</text>`;
  return s;
}

/** The cot along the right, its blanket and pillow, boots in front, Tobi's drawing above. */
function cot() {
  let s = '';
  s += shadow(990, FLOOR + 14, 130, 12, 0.7);
  s += rect(878, 440, 224, 16, '#5a3a22') + rect(878, 440, 224, 16, '#000', 'filter="url(#grain-h)" opacity="0.5"');
  for (const x of [884, 1090]) s += rect(x, 454, 10, 40, '#3a2414');
  s += path('M882 440 Q960 418 1096 428 L1098 444 Q990 436 882 448 Z', 'url(#blanket)');
  s += path('M900 438 Q980 424 1060 430', 'none', 'stroke="#2e3a24" stroke-width="3" opacity="0.8"');
  s += ellipse(1068, 426, 30, 13, '#cdb88e') + ellipse(1062, 422, 18, 6, '#e8d8b0', 'opacity="0.6"');
  // Boots, one fallen over.
  s += shadow(930, FLOOR + 30, 44, 6, 0.6);
  const F = FLOOR;
  s += path(`M906 ${F + 30} L908 ${F - 10} Q918 ${F - 14} 928 ${F - 10} L930 ${F + 14} Q944 ${F + 16} 950 ${F + 24} L950 ${F + 30} Z`, '#4a2e1c');
  s += rect(906, F + 26, 44, 5, '#1e140c') + rect(906, F + 24, 10, 7, '#2a1a10');
  for (let k = 0; k < 4; k++) s += line(912, F - 4 + k * 6, 926, F - 2 + k * 6, '#c8a878', 1.5);
  s += path(`M932 ${F + 36} L962 ${F + 24} Q972 ${F + 22} 976 ${F + 30} L978 ${F + 36} L940 ${F + 44} Q932 ${F + 44} 932 ${F + 36} Z`, '#5a3822');
  s += line(944, F + 30, 962, F + 26, '#c8a878', 1.5) + line(946, F + 34, 964, F + 30, '#c8a878', 1.5);
  // Tobi's drawing pinned to the canvas above the cot.
  s += poly([[1000, 296], [1054, 292], [1056, 354], [1002, 358]], '#e8dcc0');
  s += path('M1012 344 L1028 308 L1044 344 Z', 'none', 'stroke="#c86a2a" stroke-width="3"') + circle(1028, 326, 5, '#ffb040');
  return s;
}

/** Mara's coat on a hook on the right pole. */
function coat() {
  let s = '';
  s += circle(866, 214, 4, '#2a1a10');
  s += `<g transform="translate(8 6)" opacity="0.35" filter="url(#blur2)">${path('M852 214 Q866 206 880 214 L896 330 Q866 342 836 330 Z', '#0a0503')}</g>`;
  s += path('M852 214 Q866 206 880 214 L896 330 Q866 342 836 330 Z', 'url(#coat)');
  s += path('M852 214 L866 236 L880 214 L876 210 L866 226 L856 210 Z', '#2a1c14');
  s += path('M846 226 Q836 270 840 318 L850 318 Q848 272 856 232 Z', '#4a3428');
  s += path('M886 226 Q896 270 892 318 L882 318 Q884 272 876 232 Z', '#3e2a20');
  s += path('M866 236 L864 332', 'none', 'stroke="#1e140e" stroke-width="2"');
  for (const y of [250, 272, 294]) s += circle(870, y, 2.5, '#b08a50');
  s += ellipse(845, 300, 6, 9, '#6a5040', 'opacity="0.9"') + ellipse(845, 300, 6, 9, 'none', 'stroke="#c8a878" stroke-width="1" stroke-dasharray="2 2"');
  return s;
}

/** The stool in front: a separate group so it can also be cut out as a walk-behind piece. */
function stool() {
  let s = '';
  s += shadow(244, 600, 90, 10, 0.55);
  s += poly([[180, 456], [194, 456], [168, 600], [154, 600]], 'url(#woodSide)');
  s += poly([[296, 456], [310, 456], [334, 598], [320, 598]], 'url(#woodSide)');
  s += poly([[226, 464], [240, 464], [236, 604], [222, 604]], 'url(#woodSide)');
  // The fourth leg: a pipe offcut.
  s += rect(262, 462, 12, 136, 'url(#metal)', 'rx="3"') + rect(260, 590, 16, 8, '#5a5450');
  s += line(170, 530, 320, 528, '#4a2e1a', 6);
  s += path('M166 438 Q240 420 322 438 L320 456 Q240 472 168 456 Z', 'url(#wood)');
  s += ellipse(244, 438, 78, 16, '#a2703e') + ellipse(244, 438, 78, 16, '#000', 'filter="url(#grain-h)" opacity="0.6"');
  s += ellipse(236, 434, 50, 8, '#c08a56', 'opacity="0.45"');
  return s;
}

/** Contact darkness where surfaces meet: the floor line, under the bench top, the eaves, the corners. */
function occlusion() {
  let s = '';
  s += rect(0, FLOOR - 26, W, 26, 'url(#aoUp)') + rect(0, FLOOR, W, 30, 'url(#aoDown)');
  s += rect(14, 374, 412, 26, 'url(#aoDown)');
  s += rect(0, 150, W, 40, 'url(#aoDown)', 'opacity="0.7"');
  s += rect(0, 0, 140, H, 'url(#aoLeft)') + rect(W - 60, 0, 60, H, 'url(#aoRight)');
  return s;
}

const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
  ${rect(0, 0, W, H, '#1a1008')}
  ${shell()}
  ${door()}
  ${floor()}
  ${poles()}
  ${coat()}
  ${cot()}
  ${drum()}
  ${workbench()}
  ${jar()}
  ${lantern()}
  ${stool()}
  ${occlusion()}
  ${rect(0, 0, W, H, 'url(#falloff)')}
  ${rect(0, 0, W, H, '#000', 'filter="url(#grain)" opacity="0.3"')}
</svg>`;

const stoolOnly = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${stool()}</svg>`;

mkdirSync(join(out, 'rooms'), { recursive: true });
mkdirSync(join(out, 'foreground'), { recursive: true });
/**
 * Pixel art: the painting is reduced to the world's own grid (640x360, the size of a sprite pixel),
 * snapped to a small palette with light dithering, then scaled back up with hard edges.
 */
/** Screen pixels per art pixel: the painting is drawn on a 320x180 grid. */
const PIXEL = 4;
async function pixelate(svg, colours) {
  // Brighter and crisper before the palette, then flat colour areas (no dither noise).
  const small = await sharp(Buffer.from(svg)).resize(W / PIXEL, H / PIXEL, { kernel: 'lanczos3' })
    .modulate({ brightness: 1.18, saturation: 1.12 }).linear(1.12, -10).sharpen({ sigma: 0.6 })
    .png({ palette: true, colours, dither: 0, effort: 10 }).toBuffer();
  return sharp(small).resize(W, H, { kernel: 'nearest' });
}
const roomPx = await (await pixelate(scene, 48)).png({ palette: true, colours: 48, dither: 0, effort: 10 }).toBuffer();
if (!isFinal('rooms/tent.png')) await sharp(roomPx).toFile(join(out, 'rooms', 'tent.png'));
// The stool: the room's own finished pixels where the stool is (so its light and colours match),
// cropped to the box the room def places it at (world 72,204 → art 144,408), on the pixel grid.
if (!isFinal('foreground/tent-stool.png')) {
  const mask = await (await pixelate(stoolOnly, 20)).png().toBuffer();
  const cut = await sharp(roomPx).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(cut).extract({ left: 144, top: 408, width: 196, height: 200 })
    .png({ palette: true, colours: 32, dither: 0, effort: 10 }).toFile(join(out, 'foreground', 'tent-stool.png'));
}
console.log('Painted the tent: art/src/rooms/tent.png and foreground/tent-stool.png.');
