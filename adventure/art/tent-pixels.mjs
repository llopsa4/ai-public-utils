// The tent's pixel art (drawn on a 320x180 grid, shown at 4x): the shared palette, and the
// pieces of the room, each drawn pixel by pixel. Light comes from the hanging lantern above and
// to the left of most things: lit tops and left faces, shaded fronts and right faces.
import { Layer, dithered, ramp } from './pixel.mjs';

// ------------------------------------------------------------------- palette ---
// Ramps from darkest to lightest, each hue-shifted (cooler, bluer darks; warmer, yellower lights).
export const P = {
  wood: ramp(['#22140f', '#3a2216', '#54331f', '#704629', '#8d5c34', '#a97643', '#c69457']),
  linen: ramp(['#3c3430', '#5c4f45', '#7f6d5c', '#a28b72', '#c1a988', '#dcc8a2', '#efe2c0']),
  wool: ramp(['#1b2220', '#26332c', '#344538', '#475a45', '#5f7254', '#7c8c66']),
  red: ramp(['#3a1614', '#5c221a', '#802f20', '#a3432a', '#c05a36']),
  canvas: ramp(['#2a1b13', '#3b281a', '#4f3622', '#66472b', '#7e5a35', '#986e41', '#b2844f']),
  earth: ramp(['#16100c', '#22180f', '#302214', '#40301c', '#524026', '#66502f']),
  metal: ramp(['#16151a', '#26252b', '#3a383c', '#55514f', '#77706a', '#9c948a', '#c8beb0']),
  clay: ramp(['#2e1810', '#4a2818', '#6c3e24', '#8e5634', '#b07248', '#cc9264', '#e6b48a']),
  glaze: ramp(['#1e2a28', '#2e423c', '#456052', '#5e7e6a']),
  leather: ramp(['#1c120e', '#2e1e16', '#44301f', '#5e4229', '#7a5634']),
  brass: ramp(['#2e2010', '#4e3818', '#7a5a24', '#a87e34', '#d0a84c', '#f0d48a']),
  straw: ramp(['#5a4420', '#7e6230', '#a68a46', '#c8a85a', '#e2c87a']),
  herb: ramp(['#1e2a16', '#2e4020', '#44582c', '#5e7438']),
  paper: ramp(['#8a7a62', '#b8a888', '#ddd0b0', '#f2e8cc']),
  /** Emissive light (the lantern, the door, the candle): never darkened by the room's lighting. */
  light: ramp(['#6a3a1a', '#a85a24', '#e08a3a', '#f6b860', '#ffdc96', '#fff4d0']),
  /** The darkest outline colour (a deep warm brown, never black). */
  out: '#140c0a',
};

/** Colour → [ramp name, shade index], for the lighting pass. */
export const SHADE = new Map();
for (const [name, r] of Object.entries(P)) if (typeof r === 'function') r.colours.forEach((c, i) => SHADE.set(c, [name, i]));

/** A cast shadow: dithered darkening of whatever is below (drawn as its own dark layer). */
export function contactShadow(layer, cx, cy, rx, ry, strength = 0.7) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1 && dithered(x, y, (1 - d) * strength)) layer.set(x, y, P.earth.dark);
  }
}

/**
 * The cot: a camp bed on crossed wooden legs, a ticking-striped straw pad, a pillow, and a green
 * wool blanket with red stripes at the hem, turned back at the head and hanging in heavy folds
 * over the front rail. 72x32 pixels; (0, 0) is the top left of that box.
 */
export function cot() {
  const L = new Layer(72, 32);
  const W = P.wood.colours, LI = P.linen.colours, WO = P.wool.colours;
  // Legs: an X at each end, two pixels thick; the far leg darker, a peg where they cross.
  for (const x0 of [6, 57]) {
    L.line(x0, 21, x0 + 8, 29, W[1]); L.line(x0 + 1, 21, x0 + 9, 29, W[2]);
    L.line(x0 + 8, 21, x0, 29, W[3]); L.line(x0 + 9, 21, x0 + 1, 29, W[4]);
    L.set(x0 + 4, 25, W[6]); L.set(x0 + 5, 25, W[2]);
    L.hline(x0 - 1, x0 + 2, 29, W[2]); L.hline(x0 + 7, x0 + 10, 29, W[2]);
  }
  // The front rail: a lit top edge, the face with a little grain, a dark underside; end posts.
  for (let x = 3; x <= 68; x++) {
    L.set(x, 18, x < 40 ? W[6] : W[5]);
    L.set(x, 19, (x * 7) % 13 === 0 ? W[3] : W[4]);
    L.set(x, 20, W[2]);
  }
  L.rect(2, 16, 2, 5, W[3]); L.set(2, 16, W[5]); L.set(3, 16, W[4]);
  L.rect(68, 16, 2, 5, W[2]); L.set(68, 16, W[4]);
  // The pad at the head end (the rest is under the blanket): linen ticking with thin stripes.
  for (let x = 5; x <= 23; x++) for (let y = 14; y <= 17; y++) {
    const t = y === 14 ? 0.86 : 0.6 - (y - 15) * 0.12;
    L.set(x, y, x % 4 === 1 && y > 14 ? P.red(0.35, x, y) : P.linen(t, x, y));
  }
  // The pillow: a soft rectangle with rounded corners, lit from the upper left, a dent where a
  // head was, a seam along its front and a soft shadow on the pad below it.
  const pillow = [[6, 9], [8, 7], [19, 7], [21, 9], [21, 13], [19, 14], [8, 14], [6, 13]];
  L.poly(pillow, (x, y) => P.linen(0.98 - (x - 6) * 0.018 - (y - 7) * 0.075, x, y));
  L.hline(8, 19, 7, LI[6]); L.set(7, 8, LI[6]);
  L.hline(11, 15, 9, LI[4]); L.set(10, 10, LI[4]); L.set(16, 10, LI[4]);
  L.hline(8, 19, 13, LI[3]); L.hline(9, 18, 14, LI[2]);
  // The blanket: from x 22 to 67, its top surface lit, then the front drape in folds. Each fold is
  // a lit ridge and a shaded valley running down the drape, and the hem waves with them.
  const ridges = [26, 33, 41, 47, 55, 62];
  const foldAt = x => {
    let best = 9;
    for (const r of ridges) best = Math.min(best, Math.abs(x - r));
    return best; // 0 at a ridge (lit), larger in a valley (shaded)
  };
  for (let x = 22; x <= 67; x++) {
    const top = 12 + Math.round(1.2 * Math.sin(((x - 5) / 62) * Math.PI)) - (x > 24 && x < 30 ? 1 : 0);
    const d = foldAt(x);
    const valley = Math.min(1, d / 3.5);
    const hem = 21 + (d < 1.5 ? 1 : 0) + (x > 64 ? 1 : 0);
    for (let y = top; y <= hem; y++) {
      let t;
      if (y <= top + 1) t = 0.95 - x * 0.004 - (y - top) * 0.1;           // the top surface
      else t = 0.7 - valley * 0.32 - (y - top - 2) * 0.03 - x * 0.002;   // the drape: ridge to valley
      const k = hem - y;
      const stripe = k === 2 || k === 3 || k === 5;
      L.set(x, y, stripe ? P.red(t + 0.15, x, y) : P.wool(t, x, y));
    }
    // The fringe: short tassels under the hem, in the valleys' shade.
    if (x % 2 === 0) L.set(x, hem + 1, d < 1.5 ? WO[3] : WO[1]);
  }
  // The turned-back edge at the head: the blanket folded over itself, a lighter lip catching the light.
  for (let y = 11; y <= 21; y++) { L.set(22, y, WO[y < 14 ? 5 : 4]); L.set(23, y, WO[y < 14 ? 4 : 2]); }
  L.set(22, 10, WO[5]);
  // ---- detail: wear, texture and small things that make it real.
  // Rope lashings where the legs cross, and nail heads on the rail at each leg.
  for (const x0 of [6, 57]) {
    L.set(x0 + 3, 24, LI[3]); L.set(x0 + 4, 24, LI[4]); L.set(x0 + 5, 26, LI[2]); L.set(x0 + 6, 26, LI[3]);
    L.set(x0 + 1, 19, W[1]); L.set(x0 + 8, 19, W[1]);
  }
  // Grain and a knot on the rail; wear on its lit edge where hands grab it.
  for (const x of [11, 12, 29, 30, 31, 52, 53]) L.set(x, 19, W[3]);
  L.set(44, 19, W[1]); L.set(45, 19, W[2]); L.set(43, 19, W[5]);
  for (const x of [15, 16, 17, 49, 50]) L.set(x, 18, W[6]);
  // Straw poking out of the pad's seam at the head.
  for (const [x, y] of [[4, 16], [3, 17], [5, 13], [24, 17]]) L.set(x, y, '#c8a85a');
  L.set(4, 15, '#a08848');
  // Pillow: a second crease, the corner flattened, a faint stain.
  L.set(13, 11, LI[4]); L.set(14, 12, LI[4]); L.set(18, 11, LI[3]); L.set(20, 9, LI[4]);
  L.set(9, 12, LI[4]); L.set(10, 12, LI[4]);
  // Blanket: small creases between the big folds, wool texture, a darned patch, a frayed corner.
  for (let x = 25; x <= 66; x++) {
    if ((x * 11) % 7 === 0) L.set(x, 15 + (x % 3), WO[1]);
    if ((x * 17) % 13 === 0) L.set(x, 17 + (x % 2), WO[4]);
  }
  for (let x = 23; x <= 66; x += 3) if ((x * 5) % 4 === 0) L.set(x, 12 + Math.round(1.2 * Math.sin(((x - 5) / 62) * Math.PI)), WO[5]);
  // The darned patch: a slightly different wool, stitched round.
  L.rect(49, 14, 5, 3, P.wool.colours[2]);
  for (const [x, y] of [[48, 14], [48, 16], [54, 15], [50, 13], [52, 17]]) L.set(x, y, LI[3]);
  L.set(50, 15, P.wool.colours[3]); L.set(52, 15, P.wool.colours[3]);
  // Uneven stripes: one stripe pixel shifted here and there, a faded stretch.
  for (const x of [31, 38, 59]) L.set(x, 19, P.red.colours[1]);
  L.set(66, 22, WO[0]); L.set(67, 23, WO[1]);
  // Selective outline: dark on the shadow side, none where the lantern light falls.
  L.outline(P.out, null);
  return L;
}

// ------------------------------------------------------------------- the room ---
// Coordinates below are pixels on the 320x180 grid (world units / 2, art pixels / 4).
export const GRID = { w: 320, h: 180, floor: 120 };

/** The canvas shell: the roof's underside, three wall panels sagging between the poles, seams,
 * stitching, folds, patches and a darker hem at the floor. */
export function shell(L) {
  const C = P.canvas.colours, F = GRID.floor;
  // The roof's underside: darker, sloping away to the ridge, with the rafters' shadows.
  for (let y = 9; y < 40; y++) for (let x = 0; x < 320; x++) {
    const sag = Math.sin(((x % 107) / 107) * Math.PI) * 2;
    if (y > 38 + sag) continue;
    let t = 0.22 + (y - 9) * 0.012 + Math.sin(x / 9) * 0.04;
    if (x % 40 === 12 || x % 40 === 13) t -= 0.08;
    L.set(x, y, P.canvas(t, x, y));
  }
  // The three wall panels, each sagging a little from its poles.
  for (const [x0, x1] of [[0, 107], [107, 214], [214, 320]]) {
    for (let x = x0; x < x1; x++) {
      const u = (x - x0) / (x1 - x0), top = 38 + Math.round(Math.sin(u * Math.PI) * 3);
      // Folds: a big slow wave and a smaller one, deeper near the top where the cloth hangs.
      const fold = Math.sin(u * Math.PI * 5) * 0.08 + Math.sin(u * Math.PI * 13 + 1) * 0.04;
      for (let y = top; y < F; y++) {
        const hang = 1 - (y - top) / (F - top);
        let t = 0.62 + fold * (0.6 + hang) - (y - top) * 0.0025;
        if (y < top + 3) t -= 0.18 - (y - top) * 0.05;   // the shade under the eave
        if (y > F - 5) t -= 0.12;                        // the dirty hem
        L.set(x, y, P.canvas(t, x, y));
      }
    }
    // Seams: a darker welt with a line of stitches beside it.
    for (const k of [1, 2]) {
      const sx = Math.round(x0 + (x1 - x0) * k / 3) + (k === 1 ? -2 : 3);
      for (let y = 41; y < F - 1; y++) {
        L.set(sx, y, C[2]);
        if (y % 3 === 0) L.set(sx + 1, y, C[5]);
      }
    }
  }
  // Patches: a flour sack sewn over a tear (lettering suggested in darker marks), a darker square.
  L.poly([[162, 52], [185, 51], [186, 71], [163, 72]], (x, y) => P.linen(0.62 - (y - 51) * 0.006 + (x % 5 === 0 ? -0.05 : 0), x, y));
  for (const x of [167, 168, 170, 172, 173, 175, 177, 178, 180]) L.set(x, 60, P.linen.colours[1]);
  for (const [x, y] of [[163, 52], [185, 51], [186, 70], [163, 71]]) L.set(x, y, P.out);
  for (let x = 163; x < 186; x += 2) { L.set(x, 52, P.linen.colours[1]); L.set(x, 71, P.linen.colours[1]); }
  L.rect(120, 57, 14, 13, C[2]);
  for (let x = 120; x < 134; x += 2) { L.set(x, 57, C[4]); L.set(x, 69, C[1]); }
}

/** The ridge pole across the top and the two wall poles, with grain and rope lashings. */
export function poles(L) {
  const W = P.wood.colours;
  for (let x = 0; x < 320; x++) {
    L.set(x, 4, W[5]); L.set(x, 5, (x * 7) % 17 === 0 ? W[3] : W[4]); L.set(x, 6, W[3]); L.set(x, 7, W[2]); L.set(x, 8, W[1]);
  }
  for (const x of [30, 75, 245, 290]) { L.rect(x, 3, 2, 7, P.straw.colours[1]); L.set(x, 3, P.straw.colours[3]); }
  for (const x of [106, 213]) {
    for (let y = 8; y < GRID.floor; y++) {
      L.set(x, y, W[5]); L.set(x + 1, y, (y * 5) % 19 === 0 ? W[2] : W[4]); L.set(x + 2, y, W[2]);
    }
    for (let k = 0; k < 4; k++) { L.hline(x - 1, x + 3, 9 + k * 2, P.straw.colours[2 + (k % 2)]); }
    L.set(x - 1, 9, P.straw.colours[4]);
  }
}

/** The lantern: brass cap and base, glass panes with a flame, on a chain from the ridge. */
export function lantern(L) {
  const B = P.brass.colours, X = 160;
  for (let y = 9; y < 15; y++) L.set(X, y, y % 2 ? B[2] : B[4]);
  L.set(X - 1, 15, B[3]); L.set(X + 1, 15, B[3]); L.set(X, 14, B[5]);
  L.poly([[X - 4, 16], [X + 4, 16], [X + 7, 19], [X - 7, 19]], (x, y) => (y === 16 ? B[5] : x < X ? B[4] : B[2]));
  // Glass: the flame's light filling it, brightest at the centre.
  for (let y = 20; y < 32; y++) for (let x = X - 5; x <= X + 5; x++) {
    const d = Math.hypot(x - X, (y - 26) * 0.8);
    L.set(x, y, P.light(1 - d / 7, x, y));
  }
  // The flame.
  for (const [x, y, i] of [[X, 23, 5], [X, 24, 5], [X - 1, 25, 4], [X, 25, 5], [X + 1, 25, 4], [X, 26, 4], [X - 1, 27, 3], [X, 27, 4], [X + 1, 27, 3]]) L.set(x, y, P.light.colours[i]);
  // The frame: four brass uprights, the left ones lit.
  for (const x of [X - 6, X - 2, X + 2, X + 6]) for (let y = 19; y < 33; y++) L.set(x, y, x < X ? B[4] : B[2]);
  L.poly([[X - 7, 32], [X + 7, 32], [X + 5, 35], [X - 5, 35]], (x, y) => (y === 32 ? B[4] : B[1]));
  L.hline(X - 3, X + 3, 36, B[1]);
}

/** Herbs drying from the ridge pole. */
export function herbs(L) {
  const H = P.herb.colours;
  for (const [x, len] of [[50, 9], [57, 7], [64, 11], [254, 8], [262, 10]]) {
    L.vline(x, 9, 10, P.straw.colours[1]);
    for (let k = 0; k < len; k++) {
      const w = Math.round(Math.sin((k / len) * Math.PI) * 2.4);
      for (let i = -w; i <= w; i++) L.set(x + i, 11 + k, k % 3 === 0 ? H[1] : i < 0 ? H[3] : H[2]);
    }
    L.set(x, 11 + len, H[0]);
  }
}

/** The floor: packed earth with clumps and straw, darker towards the front. */
export function floor(L) {
  const F = GRID.floor;
  for (let y = F; y < 180; y++) for (let x = 0; x < 320; x++) {
    let t = 0.58 - (y - F) * 0.0065;
    // Clumps: a slow noise-like pattern of lighter and darker earth.
    const n = Math.sin(x * 0.37 + y * 0.9) * Math.sin(x * 0.11 - y * 0.23);
    t += n * 0.1;
    if (y === F) t -= 0.25;
    L.set(x, y, P.earth(t, x, y));
  }
  // Straw and grit scattered over it.
  let seed = 3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(rnd() * 318), y = F + 2 + Math.floor(rnd() * 56);
    if (rnd() < 0.6) { const c = P.straw(0.3 + rnd() * 0.5); L.set(x, y, c); if (rnd() < 0.6) L.set(x + 1, y + (rnd() < 0.5 ? 0 : 1), c); }
    else L.set(x, y, P.earth.colours[rnd() < 0.5 ? 0 : 5]);
  }
}

/** The rug: woven stripes, a border and a fringe, nearly flat on the floor. */
export function rug(L) {
  for (let y = 141; y <= 163; y++) {
    const inset = Math.round((163 - y) * 0.12);
    for (let x = 114 + inset; x <= 253 - inset; x++) {
      const edge = y === 141 || y === 163 || x === 114 + inset || x === 253 - inset;
      const band = Math.floor((y - 141) / 3) % 4;
      let c;
      if (edge) c = P.red.colours[0];
      else if (y === 142 || y === 162) c = P.straw.colours[1];
      else c = band === 0 ? P.red(0.45, x, y) : band === 1 ? P.straw(0.35, x, y) : band === 2 ? P.red(0.7, x, y) : P.earth(0.7, x, y);
      // The weave: every other pixel a shade darker along the stripe.
      if (!edge && (x + y) % 2 === 0 && band !== 1) c = P.red.colours[Math.max(0, (band === 2 ? 2 : 1))];
      L.set(x, y, c);
    }
  }
  for (let x = 116; x <= 251; x += 2) { L.set(x, 140, P.straw.colours[2]); L.set(x, 164, P.straw.colours[1]); }
}

/** The tool board on the canvas above the bench, with tools hung from nails. */
export function toolBoard(L) {
  const W = P.wood.colours, M = P.metal.colours;
  for (let x = 5; x <= 57; x++) { L.set(x, 49, W[5]); L.set(x, 50, W[4]); L.set(x, 51, (x * 3) % 11 === 0 ? W[2] : W[4]); L.set(x, 52, W[3]); L.set(x, 53, W[1]); }
  // Each tool casts a small shadow on the canvas (one pixel down and right).
  const tools = new Layer(64, 80);
  // Wrench: shaft and an open jaw.
  tools.vline(10, 56, 68, M[4]); tools.vline(11, 56, 68, M[2]);
  tools.rect(8, 69, 5, 3, M[3]); tools.clear(10, 70); tools.clear(10, 71); tools.set(8, 69, M[5]);
  tools.set(10, 54, M[5]); tools.set(9, 55, M[4]); tools.set(11, 55, M[2]);
  // Handsaw: wooden handle with a grip hole, a tapering blade with teeth.
  tools.rect(18, 54, 5, 5, W[4]); tools.set(20, 56, W[1]); tools.set(18, 54, W[6]);
  for (let y = 59; y <= 74; y++) { const w = 3 - Math.floor((y - 59) / 6); tools.hline(19, 19 + w, y, M[y < 62 ? 5 : 4]); if (y % 2) tools.set(18, y, M[2]); }
  // Pliers: red handles meeting at a rivet, steel jaws.
  tools.line(28, 54, 30, 64, P.red.colours[3]); tools.line(33, 54, 31, 64, P.red.colours[2]);
  tools.set(30, 65, M[6]); tools.set(31, 65, M[3]); tools.vline(30, 66, 70, M[4]); tools.vline(31, 66, 70, M[2]);
  // Claw hammer: shaft, steel head, the split claw.
  tools.vline(41, 54, 67, W[5]); tools.vline(42, 54, 67, W[3]);
  tools.rect(38, 67, 6, 3, M[4]); tools.hline(38, 43, 67, M[6]); tools.set(44, 68, M[2]); tools.set(45, 67, M[2]); tools.set(45, 66, M[3]);
  // File: wooden handle, a hatched steel blade.
  tools.rect(51, 54, 2, 5, W[4]);
  for (let y = 59; y <= 72; y++) { tools.set(51, y, y % 2 ? M[3] : M[5]); tools.set(52, y, M[2]); }
  const shade = new Layer(64, 80);
  for (let y = 0; y < 80; y++) for (let x = 0; x < 64; x++) if (tools.get(x, y)) shade.set(x + 1, y + 1, P.canvas.colours[1]);
  L.draw(shade); L.draw(tools);
  for (const x of [10, 20, 30, 41, 51]) L.set(x, 53, M[5]);
}

/** The workbench: a thick top, an apron, legs and a stretcher, the shelf and what's under it. */
export function workbench(L) {
  const W = P.wood.colours;
  const B = new Layer(110, 50);
  // Legs (front pair lit on the left), a stretcher between them.
  for (const x of [7, 97]) for (let y = 7; y < 40; y++) { B.set(x, y, W[4]); B.set(x + 1, y, W[3]); B.set(x + 2, y, W[2]); }
  for (let x = 10; x < 97; x++) { B.set(x, 24, W[3]); B.set(x, 25, W[1]); }
  // The top: two lit rows (the surface seen just from above), the front edge, the apron below it.
  for (let x = 2; x <= 106; x++) {
    B.set(x, 0, W[6]); B.set(x, 1, (x * 5) % 23 === 0 ? W[4] : W[5]);
    B.set(x, 2, W[4]); B.set(x, 3, (x * 7) % 13 === 0 ? W[2] : W[3]);
    B.set(x, 4, W[3]); B.set(x, 5, W[2]); B.set(x, 6, W[1]);
  }
  // Wear and knots on the top's edge, a cut mark.
  for (const x of [20, 21, 63, 64, 65]) B.set(x, 2, W[6]);
  B.set(41, 3, W[0]); B.set(42, 3, W[1]); B.set(80, 1, W[2]); B.set(81, 1, W[2]);
  B.outline(P.out);
  L.draw(B, 0, 88);
  // Under the bench: a crate with slats, a coil of rope, folded rags on the stretcher.
  const C = new Layer(30, 16);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 24; x++) C.set(x, y, y % 4 === 0 ? W[2] : P.wood(0.55 - x * 0.01, x, y));
  for (const x of [0, 23]) C.vline(x, 0, 11, W[1]);
  C.hline(0, 23, 0, W[5]);
  C.set(9, 6, P.out); C.set(10, 6, P.out); C.set(13, 6, P.out); C.set(14, 6, P.out);
  C.outline(P.out);
  L.draw(C, 15, 100);
  const R = new Layer(16, 8);
  R.ellipse(7, 4, 7, 3, P.straw.colours[2]); R.ellipse(7, 4, 4, 1.6, P.straw.colours[0]);
  for (let x = 1; x < 14; x += 2) R.set(x, 2, P.straw.colours[4]);
  R.outline(P.out);
  L.draw(R, 52, 104);
  L.poly([[70, 112], [86, 111], [88, 105], [74, 106]], (x, y) => P.linen(0.45 + (x - 70) * 0.01, x, y));
  L.set(78, 107, P.linen.colours[1]); L.set(82, 108, P.linen.colours[1]);
}

/** On the bench: a tool roll, a dripping candle, a glazed water jar with a handle. */
export function onTheBench(L) {
  const W = P.wood.colours;
  // Tool roll: rolled leather tied with two straps, handles poking out.
  L.rect(4, 84, 15, 4, P.leather.colours[3]); L.hline(4, 18, 84, P.leather.colours[4]); L.hline(4, 18, 87, P.leather.colours[1]);
  L.vline(8, 84, 87, P.leather.colours[0]); L.vline(14, 84, 87, P.leather.colours[0]);
  L.set(19, 85, P.metal.colours[4]); L.set(20, 85, P.metal.colours[5]); L.set(19, 86, W[4]);
  // The candle: wax with drips, a stub of wick, a small flame and its glow on the wall.
  L.rect(22, 82, 3, 6, P.paper.colours[2]); L.vline(22, 82, 87, P.paper.colours[3]); L.set(25, 84, P.paper.colours[1]); L.set(25, 85, P.paper.colours[2]);
  L.hline(21, 25, 88, P.paper.colours[1]);
  L.set(23, 81, P.out); L.set(23, 79, P.light.colours[4]); L.set(23, 80, P.light.colours[5]); L.set(22, 80, P.light.colours[3]);
  // The jar: stoneware, round-bellied, a lip and a strap handle, a green glaze band with drips,
  // lit from the upper right (the lantern) with a glint.
  const J = new Layer(26, 32);
  for (let y = 0; y < 30; y++) {
    const yy = y / 29;
    const r = y < 3 ? 5 : y < 6 ? 6 - (y - 3) * 0.3 : 4.5 + Math.sin(Math.min(1, (y - 6) / 20) * Math.PI) * 6.5 + (y > 26 ? -(y - 26) * 1.2 : 0);
    for (let x = Math.round(11 - r); x <= Math.round(11 + r); x++) {
      const u = (x - (11 - r)) / (2 * r);
      let t = 0.35 + u * 0.45 - yy * 0.15;
      if (y >= 12 && y <= 14) { J.set(x, y, P.glaze(t + 0.2, x, y)); continue; }
      J.set(x, y, P.clay(t, x, y));
    }
  }
  for (const [x, len] of [[6, 3], [9, 5], [13, 2], [15, 4]]) for (let k = 1; k <= len; k++) J.set(x, 14 + k, P.glaze.colours[1 + (k % 2)]);
  J.hline(7, 15, 0, P.clay.colours[5]); J.hline(8, 14, 1, P.out); J.set(16, 2, P.clay.colours[2]);
  // Handle: a loop on the right.
  for (const [x, y] of [[18, 6], [19, 6], [20, 7], [21, 8], [21, 9], [21, 10], [21, 11], [20, 12], [19, 13]]) J.set(x, y, P.clay.colours[3]);
  J.set(20, 8, P.clay.colours[5]); J.set(16, 9, P.clay.colours[6]); J.set(16, 10, P.clay.colours[5]);
  J.outline(P.out);
  L.draw(J, 47, 58);
}

/** The old brush drum from a sweeper on its trestle, chalked "parts", a bit of rust. */
export function drum(L) {
  const M = P.metal.colours, W = P.wood.colours;
  const D = new Layer(72, 46);
  // Trestle: two A-frames and a bar.
  for (const x0 of [12, 50]) { D.line(x0, 28, x0 - 5, 44, W[3]); D.line(x0 + 1, 28, x0 - 4, 44, W[2]); D.line(x0 + 6, 28, x0 + 11, 44, W[4]); D.line(x0 + 7, 28, x0 + 12, 44, W[3]); }
  D.hline(8, 62, 36, W[3]); D.hline(8, 62, 37, W[1]);
  // Bristles above and below the core, stiff and uneven.
  for (let x = 12; x <= 58; x++) {
    const up = 4 + ((x * 7) % 4), dn = 3 + ((x * 5) % 3);
    for (let k = 0; k < up; k++) D.set(x, 9 - k, k > up - 2 ? P.straw.colours[0] : '#2a2420');
    for (let k = 0; k < dn; k++) D.set(x, 27 + k, '#2a2420');
  }
  // The core: a metal cylinder, lit along its upper third, darker below; end caps with hubs.
  for (let y = 10; y <= 26; y++) for (let x = 11; x <= 59; x++) {
    const v = (y - 10) / 16;
    const t = v < 0.25 ? 0.65 + v : v < 0.4 ? 0.85 : 0.6 - (v - 0.4) * 0.8;
    D.set(x, y, P.metal(t, x, y));
  }
  for (const [cx, lit] of [[10, true], [60, false]]) {
    D.ellipse(cx, 18, 3.5, 8.5, (x, y) => P.metal(lit ? 0.55 - (y - 10) * 0.02 : 0.3, x, y));
    D.set(cx, 18, M[6]); D.set(cx, 17, M[5]);
  }
  // Axle and crank on the left.
  D.hline(0, 7, 18, M[4]); D.hline(0, 7, 19, M[2]);
  D.set(0, 15, M[4]); D.set(0, 16, M[4]); D.set(0, 17, M[4]); D.set(1, 15, M[3]);
  // Rust and the chalk mark.
  for (const [x, y] of [[30, 22], [31, 22], [32, 23], [44, 21], [45, 22]]) D.set(x, y, P.clay.colours[2]);
  for (const [x, y] of [[24, 15], [25, 14], [26, 15], [28, 14], [28, 15], [30, 14], [31, 15], [33, 14], [34, 14], [35, 15]]) D.set(x, y, P.paper.colours[1]);
  D.outline(P.out);
  L.draw(D, 116, 78);
}

/** Mara's coat on a hook on the right pole: collar, sleeves, buttons, a patched elbow. */
export function coat(L) {
  const C = new Layer(24, 36), LE = P.leather.colours;
  L.set(214, 52, P.metal.colours[5]);
  // Shoulders hung on the hook, the body falling straight with soft vertical folds.
  for (let y = 0; y < 33; y++) {
    const w = y < 4 ? 2 + y * 2 : 9 + Math.min(2, (y - 4) / 10);
    for (let x = Math.round(12 - w); x <= Math.round(12 + w); x++) {
      const u = (x - (12 - w)) / (2 * w);
      const fold = Math.sin((x - 3) * 0.9) * 0.08;
      C.set(x, y, P.leather(1.0 - u * 0.55 - y * 0.005 + fold + (y < 5 ? 0.08 : 0), x, y));
    }
  }
  // A lapel turned back on each side of the opening, lighter where it catches the light.
  for (let y = 3; y < 12; y++) { C.set(11 - Math.floor((y - 3) / 3), y, LE[4]); C.set(13 + Math.floor((y - 3) / 3), y, LE[2]); }
  // Collar, the opening, buttons, sleeves hanging at the sides, a patch.
  C.set(10, 1, LE[0]); C.set(11, 2, LE[0]); C.set(13, 2, LE[0]); C.set(14, 1, LE[0]);
  C.vline(12, 3, 32, LE[0]);
  for (const y of [8, 14, 20]) C.set(13, y, P.brass.colours[4]);
  C.vline(4, 6, 27, LE[4]); C.vline(20, 6, 27, LE[1]);
  C.rect(5, 20, 3, 4, P.leather.colours[2]); C.set(5, 20, P.linen.colours[3]); C.set(7, 23, P.linen.colours[3]);
  C.outline(P.out);
  L.draw(C, 202, 53);
}

/** Boots by the cot: one standing, one fallen over, laced. */
export function boots(L) {
  const B = new Layer(22, 14), LE = P.leather.colours;
  // Standing boot: shaft, heel, toe.
  for (let y = 0; y < 10; y++) { B.hline(2, 6, y, LE[y < 1 ? 4 : 3]); B.set(2, y, LE[4]); B.set(6, y, LE[1]); }
  B.hline(2, 10, 10, LE[2]); B.hline(2, 10, 11, LE[0]); B.set(10, 9, LE[2]); B.set(9, 9, LE[3]);
  for (let y = 1; y < 9; y += 2) { B.set(3, y, P.linen.colours[4]); B.set(5, y + 1, P.linen.colours[4]); }
  // Fallen boot: lying on its side, the sole towards us.
  B.hline(11, 20, 11, LE[3]); B.hline(11, 20, 12, LE[1]); B.hline(12, 19, 10, LE[4]); B.hline(19, 21, 13, LE[0]);
  B.set(14, 10, P.linen.colours[4]); B.set(16, 10, P.linen.colours[4]);
  B.outline(P.out);
  L.draw(B, 226, 118);
}

/** Tobi's drawing pinned to the canvas above the cot: a kiln with a little sun. */
export function drawing(L) {
  for (let y = 73; y <= 89; y++) for (let x = 250; x <= 264; x++) L.set(x, y, P.paper((y === 73 || x === 250) ? 0.9 : 0.62, x, y));
  for (const [x, y] of [[256, 86], [257, 84], [257, 82], [258, 80], [259, 82], [259, 84], [260, 86]]) L.set(x, y, P.red.colours[3]);
  L.hline(255, 261, 86, P.red.colours[2]);
  L.set(258, 77, P.light.colours[4]); L.set(257, 77, P.light.colours[3]); L.set(259, 77, P.light.colours[3]); L.set(258, 76, P.light.colours[3]);
  L.set(251, 74, P.metal.colours[5]); L.set(264, 88, P.paper.colours[0]);
}

/** The door: a slit in the back wall at the right, the flap tied back, the kiln hall's light. */
export function door(L) {
  const F = GRID.floor;
  // The opening: warm light, brightest high up, a far pillar of the hall in it.
  for (let y = 53; y < F; y++) {
    const inset = y < 56 ? 56 - y : 0;
    for (let x = 281 + inset; x <= 311 - inset; x++) L.set(x, y, P.light(0.95 - (y - 53) * 0.008 - Math.abs(x - 295) * 0.006, x, y));
  }
  for (let y = 62; y < F; y++) { L.set(300, y, P.light.colours[2]); L.set(301, y, P.light.colours[1]); }
  for (let x = 284; x <= 309; x++) L.set(x, F - 1, P.light.colours[1]);
  // The flap: canvas gathered to the left in folds, tied back with a cord; the hem round the opening.
  for (let y = 52; y < F; y++) {
    const w = 4 + Math.round(Math.sin(((y - 52) / 68) * Math.PI) * 4);
    for (let x = 280 - w; x <= 280; x++) L.set(x, y, P.canvas(0.5 + ((x + y) % 4 === 0 ? 0.1 : 0) - (280 - x) * 0.03, x, y));
    L.set(280 - w - 1, y, P.out);
  }
  L.hline(272, 282, 85, P.straw.colours[3]); L.hline(272, 282, 86, P.straw.colours[1]);
  for (let x = 280; x <= 312; x++) L.set(x, 52 + (x < 284 ? 284 - x : x > 308 ? x - 308 : 0), P.canvas.colours[1]);
  for (let y = 52; y < F; y++) { L.set(312, y, P.canvas.colours[1]); L.set(313, y, P.canvas.colours[2]); }
}

/** The stool in front of the bench: a round seat, three wooden legs and one pipe offcut. */
export function stool() {
  const S = new Layer(50, 50), W = P.wood.colours, M = P.metal.colours;
  // Legs splaying out, a rung between them.
  S.line(9, 12, 4, 47, W[3]); S.line(10, 12, 5, 47, W[2]);
  S.line(38, 12, 44, 47, W[4]); S.line(39, 12, 45, 47, W[2]);
  S.line(22, 13, 21, 48, W[4]); S.line(23, 13, 22, 48, W[2]);
  for (let y = 13; y <= 47; y++) { S.set(30, y, M[5]); S.set(31, y, M[3]); }
  S.hline(29, 32, 47, M[1]);
  S.hline(7, 42, 30, W[3]); S.hline(7, 42, 31, W[1]);
  // The seat: an oval top lit from above, its thick edge, rings of grain.
  S.ellipse(24, 6, 20, 4.5, (x, y) => P.wood(0.95 - Math.abs(x - 22) * 0.012 - (y - 2) * 0.04, x, y));
  for (let x = 5; x <= 43; x++) for (let y = 8; y <= 11; y++) if (S.get(x, y - 3) || y < 10) S.set(x, y, P.wood(0.45 - (y - 8) * 0.08 - x * 0.004, x, y));
  for (const [x, y] of [[15, 5], [16, 5], [17, 6], [28, 4], [29, 4], [30, 5], [20, 7], [21, 7]]) S.set(x, y, W[4]);
  S.outline(P.out);
  return S;
}
