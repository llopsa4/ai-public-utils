// Builds animated character sheets and dialogue portraits from Kiln Courier's illustrations.
//
//   npm run rig
//
// Each illustration is a single three-quarter pose, so animation is a cutout rig: the figure is
// split into parts (upper body, near leg, far leg, and for Mara the gauntlet arm) that are posed per
// frame, splatted at the target resolution, palette-reduced and laid out as an Aseprite JSON-array
// sheet. Blinks paint the eyelids shut; lying down rotates the eyes-closed figure.
// Sources are read from ../FFCardGame/assets; only outputs are committed (see art/PROVENANCE.md).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { encodeIndexed } from './png.mjs';
import { RIGS } from './manifest.mjs';
import { isFinal } from './guard.mjs';
import { buildLayeredCharacter } from './layered-rig.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const kiln = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src');

const FW = 256, FH = 256, COLS = 5;

// Rig settings (joints, eyes, face, portrait crop) live in the art manifest (art/manifest.mjs),
// keyed by character. A source is `kiln:<path>` (Kiln Courier's illustrations, placeholders) or a
// path under art/ (art/sources/characters/<id>/body.png from Codex, with an optional arm.png layer).
const CHARACTERS = RIGS;

/** The source image, with the arm layer composited in (its pixels become the arm part). */
function loadSource(cfg) {
  const path = cfg.source.startsWith('kiln:') ? join(kiln, cfg.source.slice(5)) : join(here, cfg.source);
  const img = load(path);
  if (cfg.armLayer) {
    const arm = load(join(here, cfg.armLayer));
    if (arm.width !== img.width || arm.height !== img.height) throw new Error(`${cfg.armLayer} must match ${cfg.source} in size`);
    const mask = new Uint8Array(img.width * img.height);
    for (let i = 0; i < mask.length; i++) {
      const al = arm.data[i * 4 + 3];
      if (al < 16) continue;
      mask[i] = 1;
      const t = al / 255;
      for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.round(img.data[i * 4 + c] * (1 - t) + arm.data[i * 4 + c] * t);
      img.data[i * 4 + 3] = Math.max(img.data[i * 4 + 3], al);
    }
    cfg.armMask = mask;
    cfg.armWidth = img.width;
  }
  return img;
}

function load(path) {
  if (!existsSync(path)) throw new Error(`Missing source ${path}. The Kiln Courier folder must sit next to adventure/.`);
  return PNG.sync.read(readFileSync(path));
}

/** Copy of the image with the eyelids painted shut (skin colour + a dark lash line). */
function withClosedEyes(src, eyes) {
  const img = { width: src.width, height: src.height, data: Buffer.from(src.data) };
  for (const e of eyes) {
    const si = (e.skinAt[1] * img.width + e.skinAt[0]) * 4;
    const skin = [img.data[si], img.data[si + 1], img.data[si + 2]];
    for (let y = Math.floor(e.y - e.ry - 2); y <= e.y + e.ry + 2; y++) {
      for (let x = Math.floor(e.x - e.rx - 2); x <= e.x + e.rx + 2; x++) {
        const d = ((x - e.x) / (e.rx + 2)) ** 2 + ((y - e.y) / (e.ry + 2)) ** 2;
        if (d > 1) continue;
        const i = (y * img.width + x) * 4;
        const t = d < 0.7 ? 1 : (1 - d) / 0.3; // feathered edge
        for (let c = 0; c < 3; c++) img.data[i + c] = Math.round(img.data[i + c] * (1 - t) + skin[c] * 0.92 * t);
      }
      // lash line across the lower third of the eye
    }
    // The lash line is as thick as the eye's half-height, so it survives being reduced to the pixel
    // grid (a 3-pixel line in a 1024-wide source vanished): the closed eye reads as a dark lid.
    const thick = Math.max(3, Math.round(e.ry * 1.1));
    for (let x = Math.floor(e.x - e.rx); x <= e.x + e.rx; x++) {
      const yy = Math.round(e.y - e.ry * 0.2 + ((x - e.x) / e.rx) ** 2 * e.ry * -0.3);
      for (let t = 0; t < thick; t++) { const i = ((yy + t) * img.width + x) * 4; img.data[i] = 42; img.data[i + 1] = 26; img.data[i + 2] = 20; }
    }
  }
  return img;
}

/** Portrait moods and mouth states, in strip order (frame = mood * 2 + (open ? 1 : 0)). Keep in sync with PORTRAIT_MOODS in src/game/assets.ts. */
const MOODS = ['neutral', 'worried', 'angry'];

/**
 * Copy of the image with a mood and an open or closed mouth painted on. Worried lifts the inner
 * ends of the brows, angry pulls them down and in; the open mouth is a dark, feathered gap under
 * the lip line.
 */
function withFace(src, face, mood, open) {
  const img = { width: src.width, height: src.height, data: Buffer.from(src.data) };
  const px = (x, y) => (Math.round(y) * src.width + Math.round(x)) * 4;
  // Brows: vertical warp inside each brow box, strongest at the inner end, faded at the box edges.
  const lift = mood === 'worried' ? 6 : mood === 'angry' ? -5 : 0;
  if (lift) {
    for (const b of face.brows) {
      const h = b.y1 - b.y0;
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
        const along = (x - b.x0) / (b.x1 - b.x0);
        const inner = b.inner === 'right' ? along : 1 - along;
        const edge = Math.sin(((y - b.y0) / h) * Math.PI); // 0 at the box edges, 1 in the middle
        const shift = lift * inner ** 1.5 * edge + (mood === 'angry' ? -1.5 * edge : 0);
        const sy = Math.min(b.y1, Math.max(b.y0, y + shift));
        const y0 = Math.floor(sy), t = sy - y0;
        const a = px(x, y0), c = px(x, Math.min(b.y1, y0 + 1)), o = px(x, y);
        for (let k = 0; k < 3; k++) img.data[o + k] = Math.round(src.data[a + k] * (1 - t) + src.data[c + k] * t);
      }
    }
  }
  if (open) {
    const m = face.mouth;
    const cy = m.y + m.ry * 0.6;
    for (let y = Math.floor(cy - m.ry - 2); y <= cy + m.ry + 2; y++) {
      for (let x = Math.floor(m.x - m.rx - 2); x <= m.x + m.rx + 2; x++) {
        const d = ((x - m.x) / m.rx) ** 2 + ((y - cy) / m.ry) ** 2;
        if (d > 1.25) continue;
        const o = px(x, y);
        // Dark interior, a lighter lip rim at the edge.
        const inside = d < 0.75 ? 1 : Math.max(0, (1.25 - d) / 0.5);
        const target = d < 0.75 ? [46, 18, 16] : [img.data[o] * 0.8, img.data[o + 1] * 0.62, img.data[o + 2] * 0.6];
        for (let k = 0; k < 3; k++) img.data[o + k] = Math.round(img.data[o + k] * (1 - inside) + target[k] * inside);
      }
    }
  }
  return img;
}

/** 2D affine as [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
const identity = () => [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const rotateAbout = (deg, [px, py]) => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py];
};
const scaleAbout = (sx, sy, [px, py]) => [sx, 0, 0, sy, px - sx * px, py - sy * py];
const translate = (dx, dy) => [1, 0, 0, 1, dx, dy];

const OVERLAP = 26;

/**
 * Parts a pixel belongs to. Legs split at the hip and the knee; bands near each cut go to both
 * sides so posed joints never open a gap. The arm and fidget regions move with the upper body
 * unless a pose moves them.
 */
function partsOf(cfg, x, y) {
  if (cfg.nearIsUpper && x < cfg.splitX) return ['upper'];
  // Below the elbow (cfg.salute.elbow), the arm layer is the forearm, which can bend on its own.
  if (cfg.armMask) { if (cfg.armMask[y * cfg.armWidth + x]) return [cfg.salute && y > cfg.salute.elbow[1] ? 'forearm' : 'arm']; }
  else {
    const a = cfg.arm;
    if (a && x >= a.minX && y >= a.minY && y <= a.maxY) return a && x < a.minX + OVERLAP ? ['arm', 'upper'] : ['arm'];
  }
  const f = cfg.fidgetPart;
  if (f && x >= f.minX && y >= f.minY && y <= f.maxY) return ['fidget'];
  // Something carried below the hip (Hollis's shovel) stays with the body, not a leg.
  for (const h of [cfg.held ?? []].flat()) if (x >= h.minX && y >= h.minY && x <= (h.maxX ?? Infinity) && y <= (h.maxY ?? Infinity)) return ['upper'];
  const parts = [];
  if (y < cfg.hipY) parts.push('upper');
  if (y >= cfg.hipY - OVERLAP) {
    // Which leg a pixel belongs to: the one it is joined to (legMask, from the drawing), else the side of splitX.
    const m = cfg.legMask?.[y * cfg.legMaskWidth + x];
    const side = m === 1 ? 'near' : m === 2 ? 'far' : x < cfg.splitX ? 'near' : 'far';
    const kneeY = cfg.knees[side][1];
    if (y < kneeY + OVERLAP) parts.push(`${side}Thigh`);
    if (y >= kneeY - OVERLAP) parts.push(`${side}Shin`);
  }
  return parts;
}

/**
 * Renders one pose. pose: { near, far, upper, arm } transforms in source space, plus `whole`
 * applied last. Parts are splatted at output scale k and composited far -> upper -> near -> arm.
 */
function renderPose(img, cfg, pose, k) {
  // Working canvas; hips land near (ox, oy). Tall enough for long legs below the hips (Codex's Mara's
  // feet ran past a 400-pixel canvas and were cut off).
  const W = 400, H = 560, ox = 200, oy = 330;
  const hipC = [(cfg.hips.near[0] + cfg.hips.far[0]) / 2, cfg.hipY];
  const layers = {};
  const ORDER = ['farShin', 'farThigh', 'upper', 'fidget', 'nearShin', 'nearThigh', 'arm', 'forearm'];
  for (const name of ORDER) layers[name] = { rgb: new Float64Array(W * H * 3), a: new Float64Array(W * H) };
  // Parts without their own transform follow the upper body (arm, fidget) or stay put (legs).
  const follows = name => (name === 'forearm' ? pose.arm ?? pose.upper : (name === 'arm' || name === 'fidget') ? pose.upper : null);
  const final = name => mul(pose.whole ?? identity(), pose[name] ?? follows(name) ?? identity());
  const mats = Object.fromEntries(ORDER.map(n => [n, final(n)]));
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const al = img.data[i + 3] / 255;
      if (al < 0.04) continue;
      for (const part of partsOf(cfg, x, y)) {
        const m = mats[part];
        const sx = m[0] * x + m[2] * y + m[4], sy = m[1] * x + m[3] * y + m[5];
        const tx = Math.floor((sx - hipC[0]) * k + ox), ty = Math.floor((sy - hipC[1]) * k + oy);
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        const L = layers[part], o = ty * W + tx;
        L.rgb[o * 3] += img.data[i] * al; L.rgb[o * 3 + 1] += img.data[i + 1] * al; L.rgb[o * 3 + 2] += img.data[i + 2] * al;
        L.a[o] += al;
      }
    }
  }
  // Composite: colour = premultiplied sum / alpha sum; coverage = alpha sum * k^2.
  const rgb = new Float64Array(W * H * 3), alpha = new Float64Array(W * H);
  const area = k * k;
  for (const name of ORDER) {
    const L = layers[name];
    for (let o = 0; o < W * H; o++) {
      if (!L.a[o]) continue;
      const cov = Math.min(1, L.a[o] * area * 1.15);
      for (let c = 0; c < 3; c++) rgb[o * 3 + c] = rgb[o * 3 + c] * (1 - cov) + (L.rgb[o * 3 + c] / L.a[o]) * cov;
      alpha[o] = alpha[o] * (1 - cov) + cov;
    }
  }
  return { W, H, rgb, alpha };
}

/**
 * A drawn pose (Codex's kneel.png or lie.png) at the character's scale k: area-averaged down, its
 * drawn content centred on the frame's centre column (placeInFrame then stands it on the bottom row).
 */
function renderStill(img, k) {
  const W = Math.ceil(img.width * k) + 2, H = Math.ceil(img.height * k) + 2;
  const rgb = new Float64Array(W * H * 3), alpha = new Float64Array(W * H), cover = new Float64Array(W * H);
  let minX = W, maxX = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4, al = img.data[i + 3] / 255;
    const o = Math.floor(y * k) * W + Math.floor(x * k);
    cover[o] += 1;
    if (al < 0.04) continue;
    alpha[o] += al;
    for (let c = 0; c < 3; c++) rgb[o * 3 + c] += img.data[i + c] * al;
  }
  for (let o = 0; o < W * H; o++) {
    if (!alpha[o]) continue;
    for (let c = 0; c < 3; c++) rgb[o * 3 + c] /= alpha[o];
    alpha[o] = Math.min(1, alpha[o] / cover[o]);
    if (alpha[o] >= 0.5) { minX = Math.min(minX, o % W); maxX = Math.max(maxX, o % W); }
  }
  return { pose: { W, H, rgb, alpha }, centerX: Math.round((minX + maxX) / 2) };
}

/** Places a rendered pose in a frame: feet on the bottom row, hips (ox) on the centre column. */
function placeInFrame(pose, centerX) {
  const { W, H, rgb, alpha } = pose;
  let bottom = 0;
  for (let y = H - 1; y >= 0 && !bottom; y--) for (let x = 0; x < W; x++) if (alpha[y * W + x] >= 0.5) { bottom = y; break; }
  const frame = { rgb: new Float64Array(FW * FH * 3), alpha: new Float64Array(FW * FH) };
  const dx = FW / 2 - centerX, dy = FH - 1 - bottom;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = y * W + x;
    if (!alpha[o]) continue;
    const fx = x + dx, fy = y + dy;
    if (fx < 0 || fy < 0 || fx >= FW || fy >= FH) continue;
    const p = fy * FW + fx;
    frame.alpha[p] = alpha[o];
    for (let c = 0; c < 3; c++) frame.rgb[p * 3 + c] = rgb[o * 3 + c];
  }
  return frame;
}

function kmeans(samples, k) {
  const sorted = [...samples].sort((a, b) => (a[0] * 3 + a[1] * 6 + a[2]) - (b[0] * 3 + b[1] * 6 + b[2]));
  let centers = Array.from({ length: k }, (_, j) => [...sorted[Math.floor(((j + 0.5) / k) * sorted.length)]]);
  for (let it = 0; it < 10; it++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of samples) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) { const c = centers[j]; const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }
      const s = sums[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    centers = centers.map((c, j) => (sums[j][3] ? sums[j].slice(0, 3).map(v => v / sums[j][3]) : c));
  }
  return centers.map(c => c.map(Math.round));
}

function nearest(pal, r, g, b) {
  let best = pal[0], bd = Infinity;
  for (const c of pal) { const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (d < bd) { bd = d; best = c; } }
  return best;
}

const TAGS = [
  ['stand_down', 0, 0], ['blink_down', 1, 1], ['stand_side', 2, 2], ['blink_side', 3, 3], ['stand_up', 4, 4],
  ['walk_down', 5, 10], ['walk_side', 11, 16], ['walk_up', 17, 22], ['crouch', 23, 23], ['dead', 24, 24], ['fidget', 25, 25],
];

/** Dims the ember glow (bright orange pixels) inside a region: an unpowered gauntlet. */
function dimGlow(src, r) {
  const img = { width: src.width, height: src.height, data: Buffer.from(src.data) };
  for (let y = r.minY; y < r.maxY; y++) for (let x = r.minX; x < Math.min(r.maxX, img.width); x++) {
    const i = (y * img.width + x) * 4;
    const R = img.data[i], G = img.data[i + 1], B = img.data[i + 2];
    const glow = R > 170 && R - B > 90 && G > 50 && G < R * 0.85;
    if (!glow) continue;
    const l = (R * 0.3 + G * 0.59 + B * 0.11) * 0.42;
    img.data[i] = Math.round(l * 1.15); img.data[i + 1] = Math.round(l * 0.95); img.data[i + 2] = Math.round(l * 0.85);
  }
  return img;
}

/** The pose builders for one character config (source space). */
/**
 * Splits the legs along the drawing rather than a straight line: every opaque pixel below the hips
 * goes to the leg it is nearest to through the drawing (a breadth-first walk from points down each
 * leg), so where boots overlap across splitX, each keeps its own pixels and nothing trails behind a
 * stepping foot. Seeds: each knee and a point between knee and sole, snapped onto the drawing.
 */
function legMaskOf(cfg, open, bottom) {
  const W = open.width, H = open.height, top = Math.max(0, cfg.hipY - OVERLAP);
  // The working arm and anything held are not legs: the walk does not pass through them.
  const held = [cfg.held ?? []].flat();
  const opaque = (x, y) => x >= 0 && y >= top && x < W && y < H && open.data[(y * W + x) * 4 + 3] > 10
    && !cfg.armMask?.[y * W + x] && !held.some(h => x >= h.minX && y >= h.minY && x <= (h.maxX ?? Infinity) && y <= (h.maxY ?? Infinity));
  const mask = new Uint8Array(W * H), queue = [];
  const snap = ([x, y]) => {
    for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (opaque(x + dx, y + dy)) return [x + dx, y + dy];
    return null;
  };
  [['near', 1], ['far', 2]].forEach(([side, v]) => {
    const [kx, ky] = cfg.knees[side];
    for (const pt of [[kx, ky], [kx, Math.round(ky + (bottom - ky) * 0.6)]]) {
      const s = snap(pt);
      if (s && !mask[s[1] * W + s[0]]) { mask[s[1] * W + s[0]] = v; queue.push(s[1] * W + s[0]); }
    }
  });
  for (let qi = 0; qi < queue.length; qi++) {
    const o = queue[qi], x = o % W, y = (o / W) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (!opaque(nx, ny) || mask[ny * W + nx]) continue;
      mask[ny * W + nx] = mask[o]; queue.push(ny * W + nx);
    }
  }
  cfg.legMask = mask; cfg.legMaskWidth = W;
}

function rigOf(cfg, open) {
  let top = open.height, bottom = 0;
  for (let y = 0; y < open.height; y++) for (let x = 0; x < open.width; x += 2) if (open.data[(y * open.width + x) * 4 + 3] > 128) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (cfg.walks && !cfg.straightSplit) legMaskOf(cfg, open, bottom);
  const k = cfg.height / (bottom - top);
  const hipC = [(cfg.hips.near[0] + cfg.hips.far[0]) / 2, cfg.hipY];
  // Six-frame step (frames 0 and 3 are the foot plants). Positive angles swing a leg backward.
  const THIGH = [-14, -5, 8, 14, 2, -10];
  const SHIN = [0, 0, 6, 12, 28, 10];
  // The whole upper body moves with the step: it rises and falls (art pixels, so it shows whatever the
  // source's size), sways a little and leans into the walk; the working arm swings against the legs.
  const BOB = [1.5, -1.5, -0.5, 1.5, -1.5, -0.5].map(b => b / k);
  const SWAY = [-2, 0, 1.4, 2, 0, -1.4];
  const LEAN = cfg.walkLean ?? 2.5;
  const ARM = [-1, -0.4, 0.5, 1, 0.4, -0.5];
  const leg = (side, thigh, shin) => {
    const t = rotateAbout(thigh, cfg.hips[side]);
    return { [`${side}Thigh`]: t, [`${side}Shin`]: mul(t, rotateAbout(shin, cfg.knees[side])) };
  };
  const walkPose = phase => {
    const upper = mul(translate(0, BOB[phase]), rotateAbout(SWAY[phase] + LEAN, hipC));
    return {
      ...leg('near', THIGH[phase], SHIN[phase]),
      ...leg('far', THIGH[(phase + 3) % 6], SHIN[(phase + 3) % 6]),
      upper,
      ...(cfg.armPivot ? { arm: mul(upper, rotateAbout(ARM[phase] * (cfg.armSwing ?? 6), cfg.armPivot)) } : {}),
    };
  };
  const squashLegs = s => Object.fromEntries(['near', 'far'].flatMap(side => [[`${side}Thigh`, scaleAbout(1, s, cfg.hips[side])], [`${side}Shin`, scaleAbout(1, s, cfg.hips[side])]]));
  // Sitting on a chair: thighs swung forward to level, shins hanging straight down from the knees.
  const sitLegs = () => ({ ...leg('near', -82, 82), ...leg('far', -76, 76) });
  return { k, hipC, walkPose, squashLegs, sitLegs };
}

/**
 * Background people (the kiln-hall crowd, the firing-house kids): placeholder variants of the three bodies (recoloured
 * clothes and skin, another height, painted headgear), with a trimmed frame set and no portraits.
 * Frames: 0 stand, 1 blink, 2-7 walk, 8-9 work (crouched, bobbing), 10 carry, 11 reach, 12 sit.
 */
const src = id => ({ source: `sources/characters/${id}/body.png`, armLayer: `sources/characters/${id}/arm.png` });
const EXTRAS = {
  // Codex's drawings, measured on their 1024x1536 canvases. Long coats and robes (Ansel, Corvin) hinge
  // low, so only the hem and boots step.
  'extra-stoker': { ...src('extra-stoker'), height: 218, armPivot: [225, 330],
    hipY: 800, splitX: 430, hips: { near: [330, 800], far: [520, 800] }, knees: { near: [300, 1125], far: [555, 1125] },
    held: [{ minX: 640, minY: 760, maxY: 1400 }, { minX: 676, minY: 1400 }],
    eyes: [{ x: 495, y: 156, rx: 9, ry: 4, skinAt: [495, 170] }, { x: 553, y: 153, rx: 6, ry: 4, skinAt: [555, 165] }] },
  'extra-tally': { ...src('extra-tally'), height: 206, armPivot: [310, 340],
    hipY: 1200, splitX: 455, hips: { near: [350, 1200], far: [570, 1200] }, knees: { near: [345, 1330], far: [575, 1330] },
    eyes: [{ x: 573, y: 149, rx: 8, ry: 4, skinAt: [573, 161] }, { x: 626, y: 147, rx: 5, ry: 4, skinAt: [626, 160] }] },
  'extra-hauler': { ...src('extra-hauler'), height: 224, armPivot: [380, 320],
    hipY: 790, splitX: 484, hips: { near: [420, 790], far: [540, 790] }, knees: { near: [384, 1186], far: [573, 1186] },
    eyes: [{ x: 550, y: 114, rx: 10, ry: 4, skinAt: [550, 128] }, { x: 595, y: 114, rx: 5, ry: 4, skinAt: [594, 127] }] },
  'extra-runner': { ...src('extra-runner'), height: 150, armPivot: [410, 810],
    hipY: 1130, splitX: 502, hips: { near: [440, 1130], far: [560, 1130] }, knees: { near: [438, 1291], far: [560, 1291] },
    eyes: [{ x: 526, y: 690, rx: 14, ry: 9, skinAt: [526, 706] }, { x: 576, y: 691, rx: 8, ry: 9, skinAt: [576, 706] }] },
  'extra-hoist': { ...src('extra-hoist'), height: 222, armPivot: [375, 315],
    hipY: 770, splitX: 487, hips: { near: [420, 770], far: [550, 770] }, knees: { near: [387, 1124], far: [597, 1124] },
    eyes: [{ x: 543, y: 138, rx: 13, ry: 6, skinAt: [543, 155] }, { x: 587, y: 140, rx: 5, ry: 6, skinAt: [586, 157] }] },
  // The peddler in the ashways (sells Kiln Tonics). His far eye is in shadow: only the near one blinks.
  'extra-merchant': { ...src('extra-merchant'), height: 214, armPivot: [430, 330],
    hipY: 1130, splitX: 495, hips: { near: [400, 1130], far: [600, 1130] }, knees: { near: [395, 1310], far: [610, 1310] },
    eyes: [{ x: 609, y: 133, rx: 9, ry: 4, skinAt: [609, 147] }] },
  // A firing-house kid with a board as a toy shield (drawn).
  'extra-kid': { ...src('extra-kid'), height: 146, armPivot: [455, 830],
    hipY: 1180, splitX: 498, hips: { near: [440, 1180], far: [560, 1180] }, knees: { near: [432, 1321], far: [552, 1321] },
    eyes: [{ x: 518, y: 731, rx: 16, ry: 10, skinAt: [518, 748] }, { x: 569, y: 730, rx: 9, ry: 9, skinAt: [569, 745] }] },
};
const EXTRA_TAGS = [
  ['stand_down', 0, 0], ['stand_side', 0, 0], ['stand_up', 0, 0], ['blink_down', 1, 1], ['blink_side', 1, 1],
  ['walk_down', 2, 7], ['walk_side', 2, 7], ['walk_up', 2, 7], ['crouch', 8, 8], ['work', 8, 9], ['carry', 10, 10], ['reach', 11, 11], ['sit', 12, 12],
];

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const hslToRgb = (h, s, l) => {
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255));
};

/**
 * A recoloured copy of a base illustration. Skin (low red-blue spread, or inside the face) keeps
 * its hue and is scaled by `skin`; everything else is hue-rotated, desaturated and dimmed. Then
 * headgear is painted over the top of the head, and for Mara's body the gauntlet arm is removed.
 */
function variantImage(src, base, v) {
  const img = { width: src.width, height: src.height, data: Buffer.from(src.data) };
  const eyeX = base.eyes.reduce((s, e) => s + e.x, 0) / base.eyes.length, eyeY = base.eyes.reduce((s, e) => s + e.y, 0) / base.eyes.length;
  const faceR = 75;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] < 8) continue;
    if (v.noArm && base.arm && x >= base.arm.minX + 6 && y >= base.arm.minY && y <= base.arm.maxY + 40) { img.data[i + 3] = 0; continue; }
    const R = img.data[i], G = img.data[i + 1], B = img.data[i + 2];
    const [h, s, l] = rgbToHsl(R, G, B);
    const inFace = Math.hypot(x - eyeX, (y - eyeY - 30) * 0.9) < faceR;
    const skinLike = R > G && G > B && R - B > 35 && R - B < 120 && l > 0.35 && l < 0.68 && s > 0.22 && h > 8 && h < 38;
    if (inFace || skinLike) {
      if (inFace && !skinLike && l < 0.35) continue; // hair and brows stay as drawn
      for (let c = 0; c < 3; c++) img.data[i + c] = Math.min(255, Math.round(img.data[i + c] * v.skin));
      continue;
    }
    // Pale armour plates (Mara's, Nell's shield) become worn leather and wood: these are workers.
    const plate = l > 0.58 && s < 0.75;
    const [r, g, b] = plate ? hslToRgb(28, 0.32, l * 0.5) : hslToRgb((h + v.hue) % 360, s * v.sat, l * v.light);
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b;
  }
  paintHeadgear(img, eyeX, eyeY, v.headgear);
  return img;
}

/** Paints a cap, hood or kerchief over the head, following the drawn silhouette. */
function paintHeadgear(img, eyeX, eyeY, gear) {
  if (!gear) return;
  const [cr, cg, cb] = gear.color;
  const brimY = eyeY - (gear.kind === 'cap' ? 26 : 34);
  const bottomY = gear.kind === 'hood' ? eyeY + 95 : brimY;
  for (let y = 0; y <= bottomY + 8; y++) for (let x = Math.round(eyeX - 110); x <= eyeX + 110; x++) {
    if (x < 0 || x >= img.width) continue;
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] < 128) continue;
    const dx = x - eyeX;
    let inside = y <= brimY;
    // A hood frames the face: it covers the sides of the head but not the face oval.
    if (gear.kind === 'hood' && y > brimY) inside = Math.abs(dx) > 70 && Math.abs(dx) < 110;
    if (!inside) continue;
    // Shade: lighter toward the upper left, a darker band at the brim.
    const shade = 0.82 + 0.3 * Math.max(0, 1 - Math.hypot(dx + 30, y - (brimY - 60)) / 90) - (Math.abs(y - brimY) < 6 && gear.kind !== 'hood' ? 0.25 : 0);
    const grain = 0.94 + 0.06 * Math.sin(x * 0.7 + y * 0.3);
    img.data[i] = Math.min(255, Math.round(cr * shade * grain));
    img.data[i + 1] = Math.min(255, Math.round(cg * shade * grain));
    img.data[i + 2] = Math.min(255, Math.round(cb * shade * grain));
  }
  // The cap's bill sticks out toward the facing side (the figures face right).
  if (gear.kind === 'cap') {
    for (let y = brimY - 6; y <= brimY + 4; y++) for (let x = Math.round(eyeX); x <= eyeX + 70; x++) {
      const i = (y * img.width + x) * 4;
      const t = (x - eyeX) / 70;
      if (y < brimY - 6 + t * 4) continue;
      img.data[i] = Math.round(cr * 0.7); img.data[i + 1] = Math.round(cg * 0.7); img.data[i + 2] = Math.round(cb * 0.7); img.data[i + 3] = 255;
    }
  }
}

function buildExtra(id) {
  const base = { ...EXTRAS[id], walks: true };
  if (isFinal(`characters/${id}.png`)) { console.log(`  ${id}: final art, kept.`); return; }
  const open = loadSource(base);
  const closed = withClosedEyes(open, base.eyes);
  const { k, hipC, walkPose, squashLegs } = rigOf(base, open);
  const frames = [];
  const add = (img, pose) => frames.push(placeInFrame(renderPose(img, base, pose, k), 200));
  const dir = join(here, dirname(base.source));
  const drawn = name => existsSync(join(dir, name)) ? join(dir, name) : null;
  // A drawn pose, optionally nudged down (in frame pixels) for the working bob.
  const still = (path, drop = 0) => {
    const r = renderStill(load(path), k);
    const f = placeInFrame(r.pose, r.centerX);
    if (drop) {
      f.alpha.copyWithin(drop * FW, 0, FW * (FH - drop)); f.alpha.fill(0, 0, drop * FW);
      f.rgb.copyWithin(drop * FW * 3, 0, FW * (FH - drop) * 3);
    }
    frames.push(f);
  };
  const arm = deg => (base.armPivot ? { arm: rotateAbout(deg, base.armPivot) } : {});
  const kneel = drawn('kneel.png'), sit = drawn('sit.png');
  add(open, {});                                                                   // 0 stand
  add(closed, {});                                                                 // 1 blink
  for (let p = 0; p < 6; p++) add(open, walkPose(p));                              // 2-7 walk
  if (kneel) { still(kneel); still(kneel, 2); }                                    // 8-9 work: kneeling at a task, bobbing
  else { add(open, { ...squashLegs(0.6), upper: rotateAbout(9, hipC) }); add(open, { ...squashLegs(0.6), upper: mul(translate(0, 10), rotateAbout(14, hipC)) }); }
  add(open, { upper: rotateAbout(-4, hipC), ...arm(-22) });                        // 10 carry: leaning back, arm forward
  add(open, { upper: mul(translate(0, -8), rotateAbout(-6, hipC)), ...arm(-60) });  // 11 reach: up on the toes, arm raised
  if (sit) still(sit); else add(open, { ...squashLegs(0.42), upper: rotateAbout(-2, hipC) }); // 12 sit
  writeSheet(id, frames, EXTRA_TAGS, n => (n >= 2 && n <= 7 ? 110 : n === 8 || n === 9 ? 280 : 1000), 64);
}

/** Palette-reduces the frames, adds the outline and writes the PNG + Aseprite JSON pair. */
/**
 * The pixel grid for characters (art pixels per grid pixel), the same as the rooms' (art/import.mjs
 * GRID): every frame is averaged into GRID x GRID blocks (a block is solid when most of it is),
 * snapped to the sheet palette, and outlined one block thick. At 2, faces keep enough pixels for
 * blinking and talking to show.
 */
const GRID = 2;

function writeGridFrame(sheet, f, fx, fy, pal) {
  const BW = FW / GRID, BH = FH / GRID;
  const solid = new Uint8Array(BW * BH), rgb = new Float32Array(BW * BH * 3);
  for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
    let count = 0, r = 0, g = 0, b = 0;
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const p = (by * GRID + y) * FW + bx * GRID + x;
      if (f.alpha[p] < 0.5) continue;
      count++; r += f.rgb[p * 3]; g += f.rgb[p * 3 + 1]; b += f.rgb[p * 3 + 2];
    }
    if (count * 2 < GRID * GRID) continue;
    const q = by * BW + bx;
    solid[q] = 1; rgb[q * 3] = r / count; rgb[q * 3 + 1] = g / count; rgb[q * 3 + 2] = b / count;
  }
  const paint = (bx, by, c) => {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const o = ((fy + by * GRID + y) * sheet.width + fx + bx * GRID + x) * 4;
      sheet.data[o] = c[0]; sheet.data[o + 1] = c[1]; sheet.data[o + 2] = c[2]; sheet.data[o + 3] = 255;
    }
  };
  for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
    const q = by * BW + bx;
    if (solid[q]) { paint(bx, by, nearest(pal, rgb[q * 3], rgb[q * 3 + 1], rgb[q * 3 + 2])); continue; }
    const near = (bx > 0 && solid[q - 1]) || (bx < BW - 1 && solid[q + 1]) || (by > 0 && solid[q - BW]) || (by < BH - 1 && solid[q + BW]);
    if (near) paint(bx, by, [30, 20, 18]);
  }
}

function writeSheet(id, frames, tags, duration, colours, dir = '') {
  const samples = [];
  for (const f of frames) for (let p = 0; p < FW * FH; p += 3) if (f.alpha[p] >= 0.5) samples.push([f.rgb[p * 3], f.rgb[p * 3 + 1], f.rgb[p * 3 + 2]]);
  const pal = kmeans(samples, colours);
  const rows = Math.ceil(frames.length / COLS);
  const sheet = new PNG({ width: FW * COLS, height: FH * rows });
  frames.forEach((f, n) => {
    const fx = (n % COLS) * FW, fy = Math.floor(n / COLS) * FH;
    if (GRID > 1) { writeGridFrame(sheet, f, fx, fy, pal); return; }
    const solid = new Uint8Array(FW * FH);
    for (let p = FW; p < FW * (FH - 1); p++) {
      if (f.alpha[p] >= 0.5) continue;
      const nb = [p - 1, p + 1, p - FW, p + FW].filter(q => f.alpha[q] >= 0.5);
      if (nb.length < 3) continue;
      f.alpha[p] = 1;
      for (let c = 0; c < 3; c++) f.rgb[p * 3 + c] = nb.reduce((sum, q) => sum + f.rgb[q * 3 + c], 0) / nb.length;
    }
    for (let p = 0; p < FW * FH; p++) {
      if (f.alpha[p] < 0.5) continue;
      solid[p] = 1;
      const [r, g, b] = nearest(pal, f.rgb[p * 3], f.rgb[p * 3 + 1], f.rgb[p * 3 + 2]);
      const o = ((fy + Math.floor(p / FW)) * sheet.width + fx + (p % FW)) * 4;
      sheet.data[o] = r; sheet.data[o + 1] = g; sheet.data[o + 2] = b; sheet.data[o + 3] = 255;
    }
    for (let p = 0; p < FW * FH; p++) {
      if (solid[p]) continue;
      const x = p % FW, y = Math.floor(p / FW);
      const near = (x > 0 && solid[p - 1]) || (x < FW - 1 && solid[p + 1]) || (y > 0 && solid[p - FW]) || (y < FH - 1 && solid[p + FW]);
      if (!near) continue;
      const o = ((fy + y) * sheet.width + fx + x) * 4;
      sheet.data[o] = 30; sheet.data[o + 1] = 20; sheet.data[o + 2] = 18; sheet.data[o + 3] = 255;
    }
  });
  mkdirSync(join(out, `${dir}characters`), { recursive: true });
  writeFileSync(join(out, `${dir}characters`, `${id}.png`), encodeIndexed(sheet));
  const json = {
    frames: frames.map((_, n) => ({
      filename: String(n),
      frame: { x: (n % COLS) * FW, y: Math.floor(n / COLS) * FH, w: FW, h: FH },
      rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FW, h: FH }, sourceSize: { w: FW, h: FH },
      duration: duration(n),
    })),
    meta: {
      app: 'adventure rig.mjs (Aseprite JSON-array compatible)', version: '1', image: `${id}.png`, format: 'RGBA8888',
      size: { w: sheet.width, h: sheet.height }, scale: '1',
      frameTags: tags.map(([name, from, to]) => ({ name, from, to, direction: 'forward' })),
    },
  };
  writeFileSync(join(out, `${dir}characters`, `${id}.json`), JSON.stringify(json, null, 1) + '\n');
}

async function buildCharacter(id) {
  const cfg = { ...CHARACTERS[id] };
  // Later chapters' characters live in their chapter's folder (art/src/<chapter>/characters, portraits).
  const dir = cfg.dir ?? '';
  if (isFinal(`${dir}characters/${id}.png`)) { console.log(`  ${id}: final art, kept.`); return; }
  if (cfg.layeredPack) return buildLayeredCharacter(id, cfg);
  // A placeholder can be a recoloured, re-dressed copy of another body (like the background people).
  const raw = cfg.variant ? variantImage(loadSource(cfg), cfg, cfg.variant) : loadSource(cfg);
  const open = cfg.unpowered ? dimGlow(raw, cfg.unpowered) : raw;
  const closed = withClosedEyes(open, cfg.eyes);
  const { k, hipC, walkPose, squashLegs, sitLegs } = rigOf(cfg, open);
  const crouchPose = { ...squashLegs(cfg.crouchSquash ?? 0.6), upper: rotateAbout(9, hipC) };
  const fidgetPose = cfg.fidgetPart
    ? { fidget: rotateAbout(cfg.fidgetPart.angle, cfg.fidgetPart.pivot) }
    : { upper: rotateAbout(cfg.fidgetLean ?? 0, hipC) };
  const deadPose = { whole: rotateAbout(90, hipC) };

  const frames = [];
  const add = (img, pose) => frames.push(placeInFrame(renderPose(img, cfg, pose, k), 200));
  add(open, {});                    // 0 stand_down
  add(closed, {});                  // 1 blink_down
  add(open, {});                    // 2 stand_side
  add(closed, {});                  // 3 blink_side
  add(open, {});                    // 4 stand_up (no back view exists: the three-quarter pose is reused)
  for (let rep = 0; rep < 3; rep++) for (let p = 0; p < 6; p++) add(open, cfg.walks ? walkPose(p) : {}); // 5..22 walks
  // Kneeling and lying: Codex's drawn poses when the rig has them (kneel.png, lie.png: required of
  // every new character), else made from the standing drawing (legs squashed; the figure turned over).
  // Looked for beside the character's source drawing (art/sources/characters/<id>/), so they are used
  // as soon as they are imported.
  // A recoloured stand-in (cfg.variant) borrows only the base's standing drawing: its other poses are
  // made from that, or they would show the base character's own colours.
  const pose = name => { const p = cfg.source.startsWith('sources/') && !cfg.variant ? join(here, dirname(cfg.source), name) : null; return p && existsSync(p) ? p : null; };
  const still = path => { const r = renderStill(load(path), k); frames.push(placeInFrame(r.pose, r.centerX)); };
  const kneel = pose('kneel.png'), lie = pose('lie.png');
  if (kneel) still(kneel); else add(open, crouchPose); // 23 crouch
  if (lie) still(lie); else add(closed, deadPose);     // 24 dead / lying (eyes closed)
  add(open, fidgetPose);            // 25 fidget (idle gesture)
  // 26 sit, for a character who sits on a chair (cfg.sits): drawn sit.png, else the thighs level and
  // the shins down (the feet stay on the floor) and, asleep, slumped forward with the eyes shut.
  const sit = cfg.sits ? pose('sit.png') : null;
  if (sit) still(sit); else if (cfg.sits) add(closed, { ...sitLegs(), upper: rotateAbout(cfg.sits === 'asleep' ? 9 : -2, hipC) });
  const tags = cfg.sits ? [...TAGS, ['sit', 26, 26]] : [...TAGS];
  // A salute (cfg.salute): the upper arm raised forward about the shoulder, the forearm bent back at
  // the elbow so the hand meets the brow. Built from the standing drawing's arm layer.
  if (cfg.salute) {
    const { upperArm, forearm, elbow } = cfg.salute, shoulder = rotateAbout(upperArm, cfg.armPivot);
    tags.push(['salute', frames.length, frames.length]);
    add(open, { arm: shoulder, forearm: mul(shoulder, rotateAbout(forearm, elbow)) });
  }

  // Palette from all frames, then hard alpha and a 1px dark outline for readability on busy art.
  writeSheet(id, frames, tags, n => (n >= 5 && n <= 22 ? 110 : 1000), 112, dir);

  // Dialogue portraits: area-averaged head-and-shoulders crops, 256x256 each, in a strip of frames
  // per mood (neutral, worried, angry), each with the mouth closed then open.
  // Mara has one portrait set (gauntlet lit), written by the 'mara-gauntlet' variant as mara.png.
  if (cfg.unpowered || cfg.noPortrait) return;
  const portraitId = id.replace(/-gauntlet$/, '');
  const [px, py, pw, ph] = cfg.portrait;
  const moods = cfg.moods ?? MOODS;
  const P = 256, portrait = new PNG({ width: P * moods.length * 2, height: P });
  moods.forEach((mood, mi) => [false, true].forEach((talking, ti) => {
    const face = withFace(open, cfg.face, mood, talking);
    const ox = (mi * 2 + ti) * P;
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = Math.floor(py + (y * ph) / P); sy < py + ((y + 1) * ph) / P; sy++) {
        for (let sx = Math.floor(px + (x * pw) / P); sx < px + ((x + 1) * pw) / P; sx++) {
          const i = (sy * face.width + sx) * 4, al = face.data[i + 3] / 255;
          r += face.data[i] * al; g += face.data[i + 1] * al; b += face.data[i + 2] * al; a += al; n++;
        }
      }
      const o = (y * portrait.width + ox + x) * 4;
      portrait.data[o] = a ? r / a : 0; portrait.data[o + 1] = a ? g / a : 0; portrait.data[o + 2] = a ? b / a : 0;
      portrait.data[o + 3] = a / n > 0.9 ? 255 : 0; // drop the illustration's soft glow halo
    }
  }));
  mkdirSync(join(out, `${dir}portraits`), { recursive: true });
  writeFileSync(join(out, `${dir}portraits`, `${portraitId}.png`), encodeIndexed(portrait));
}

// `node art/rig.mjs extras` rebuilds only the background people.
const only = process.argv[2];
// `node art/rig.mjs <id>` rebuilds one sheet.
const one = only && only !== 'extras' ? only : null;
if (only !== 'extras') for (const id of Object.keys(CHARACTERS)) if (!one || one === id) await buildCharacter(id);
for (const id of Object.keys(EXTRAS)) if (!one || one === id) buildExtra(id);
console.log(`Rigged character sheets written to art/src (${one ?? (only === 'extras' ? '' : `${Object.keys(CHARACTERS).join(', ')}, `) + Object.keys(EXTRAS).join(', ')}).`);
