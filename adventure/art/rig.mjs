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

const here = dirname(fileURLToPath(import.meta.url));
const kiln = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src');

const FW = 256, FH = 256, COLS = 5;

/**
 * Rig settings in source-image pixels.
 * hipY: rows below are legs. splitX: near leg (x < splitX) vs far leg. eyes: blink patches.
 * height: target standing height in output pixels (art is drawn at 2x the 640x360 world).
 */
const MARA = {
    source: 'hero.png', height: 232, walks: true,
    hipY: 860, splitX: 560, hips: { near: [400, 860], far: [650, 860] },
    arm: { minX: 790, minY: 300, maxY: 900, pivot: [800, 380] },
    eyes: [{ x: 673, y: 109, rx: 13, ry: 7, skinAt: [668, 124] }],
    portrait: [470, 0, 420, 420],
};

const CHARACTERS = {
  // Before the ember cell is fitted the gauntlet is cold: its glow is painted dark.
  mara: { ...MARA, unpowered: { minX: 700, minY: 430, maxX: 1024, maxY: 900 } },
  'mara-gauntlet': MARA,
  oren: {
    source: 'opening/oren.png', height: 226, walks: false,
    hipY: 1050, splitX: 515, hips: { near: [400, 1040], far: [630, 1040] },
    eyes: [{ x: 553, y: 116, rx: 9, ry: 5, skinAt: [553, 130] }, { x: 588, y: 112, rx: 8, ry: 5, skinAt: [590, 126] }],
    portrait: [390, 0, 330, 330],
  },
  nell: {
    source: 'opening/iven.png', height: 220, walks: false,
    hipY: 1000, splitX: 480, hips: { near: [420, 1000], far: [640, 1000] },
    // The big shield covers the near leg: it moves with the upper body, and crouching is a bow.
    nearIsUpper: true, crouchSquash: 1,
    eyes: [{ x: 452, y: 129, rx: 15, ry: 8, skinAt: [452, 148] }, { x: 507, y: 123, rx: 14, ry: 8, skinAt: [505, 142] }],
    portrait: [320, 0, 340, 340],
  },
};

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
    for (let x = Math.floor(e.x - e.rx); x <= e.x + e.rx; x++) {
      const yy = Math.round(e.y + e.ry * 0.35 + ((x - e.x) / e.rx) ** 2 * e.ry * -0.3);
      for (let t = 0; t < 3; t++) { const i = ((yy + t) * img.width + x) * 4; img.data[i] = 42; img.data[i + 1] = 26; img.data[i + 2] = 20; }
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

/** Parts a pixel belongs to. Bands near the cuts go to both sides so posed joints never open a gap. */
function partsOf(cfg, x, y) {
  const a = cfg.arm;
  const parts = [];
  if (a && x >= a.minX && y >= a.minY && y <= a.maxY) parts.push('arm');
  const inArmBand = a && x >= a.minX - OVERLAP && y >= a.minY && y <= a.maxY;
  if (cfg.nearIsUpper && x < cfg.splitX) return ['upper'];
  if (!parts.length || inArmBand) {
    if (y < cfg.hipY || (parts.length && inArmBand)) parts.push('upper');
    if (y >= cfg.hipY - OVERLAP && !(parts[0] === 'arm')) parts.push(x < cfg.splitX ? 'near' : 'far');
  }
  return parts;
}

/**
 * Renders one pose. pose: { near, far, upper, arm } transforms in source space, plus `whole`
 * applied last. Parts are splatted at output scale k and composited far -> upper -> near -> arm.
 */
function renderPose(img, cfg, pose, k) {
  const W = 400, H = 400, ox = 200, oy = 330; // working canvas; hips land near (ox, oy)
  const hipC = [(cfg.hips.near[0] + cfg.hips.far[0]) / 2, cfg.hipY];
  const layers = {};
  for (const name of ['far', 'upper', 'near', 'arm']) layers[name] = { rgb: new Float64Array(W * H * 3), a: new Float64Array(W * H) };
  const final = name => mul(pose.whole ?? identity(), pose[name] ?? identity());
  const mats = Object.fromEntries(['far', 'upper', 'near', 'arm'].map(n => [n, final(n)]));
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
  for (const name of ['far', 'upper', 'near', 'arm']) {
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
  ['walk_down', 5, 8], ['walk_side', 9, 12], ['walk_up', 13, 16], ['crouch', 17, 17], ['dead', 18, 18],
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

function buildCharacter(id) {
  const cfg = CHARACTERS[id];
  const raw = load(join(kiln, cfg.source));
  const open = cfg.unpowered ? dimGlow(raw, cfg.unpowered) : raw;
  const closed = withClosedEyes(open, cfg.eyes);
  let top = open.height, bottom = 0;
  for (let y = 0; y < open.height; y++) for (let x = 0; x < open.width; x += 2) if (open.data[(y * open.width + x) * 4 + 3] > 128) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  const k = cfg.height / (bottom - top);
  const hipC = [(cfg.hips.near[0] + cfg.hips.far[0]) / 2, cfg.hipY];

  const walkPose = phase => {
    const swing = [7, 0, -7, 0][phase];
    const knee = [0, 5, 0, 5][phase];
    return {
      near: mul(rotateAbout(swing, cfg.hips.near), scaleAbout(1, 1 - knee / 100, cfg.hips.near)),
      far: mul(rotateAbout(-swing, cfg.hips.far), scaleAbout(1, 1 - (5 - knee) / 100, cfg.hips.far)),
      upper: translate(0, phase % 2 ? -8 : 0),
      arm: translate(0, phase % 2 ? -8 : 0),
    };
  };
  const crouchPose = {
    near: scaleAbout(1, cfg.crouchSquash ?? 0.6, cfg.hips.near),
    far: scaleAbout(1, cfg.crouchSquash ?? 0.6, cfg.hips.far),
    upper: rotateAbout(9, hipC),
    arm: rotateAbout(9, hipC),
  };
  const deadPose = { whole: rotateAbout(90, hipC) };

  const frames = [];
  const add = (img, pose) => frames.push(placeInFrame(renderPose(img, cfg, pose, k), 200));
  add(open, {});                    // 0 stand_down
  add(closed, {});                  // 1 blink_down
  add(open, {});                    // 2 stand_side
  add(closed, {});                  // 3 blink_side
  add(open, {});                    // 4 stand_up (no back view exists: the three-quarter pose is reused)
  for (let rep = 0; rep < 3; rep++) for (let p = 0; p < 4; p++) add(open, cfg.walks ? walkPose(p) : {}); // 5..16 walks
  add(open, crouchPose);            // 17 crouch
  add(closed, deadPose);            // 18 dead (rotated, eyes closed)

  // Palette from all frames, then hard alpha and a 1px dark outline for readability on busy art.
  const samples = [];
  for (const f of frames) for (let p = 0; p < FW * FH; p += 3) if (f.alpha[p] >= 0.5) samples.push([f.rgb[p * 3], f.rgb[p * 3 + 1], f.rgb[p * 3 + 2]]);
  const pal = kmeans(samples, 112);
  const rows = Math.ceil(frames.length / COLS);
  const sheet = new PNG({ width: FW * COLS, height: FH * rows });
  frames.forEach((f, n) => {
    const fx = (n % COLS) * FW, fy = Math.floor(n / COLS) * FH;
    const solid = new Uint8Array(FW * FH);
    // Fill pinholes: transparent pixels mostly surrounded by solid ones take their neighbours' colour.
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
  mkdirSync(join(out, 'characters'), { recursive: true });
  writeFileSync(join(out, 'characters', `${id}.png`), PNG.sync.write(sheet));
  const json = {
    frames: frames.map((_, n) => ({
      filename: String(n),
      frame: { x: (n % COLS) * FW, y: Math.floor(n / COLS) * FH, w: FW, h: FH },
      rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FW, h: FH }, sourceSize: { w: FW, h: FH },
      duration: n >= 5 && n <= 16 ? 150 : 1000,
    })),
    meta: {
      app: 'adventure rig.mjs (Aseprite JSON-array compatible)', version: '1', image: `${id}.png`, format: 'RGBA8888',
      size: { w: sheet.width, h: sheet.height }, scale: '1',
      frameTags: TAGS.map(([name, from, to]) => ({ name, from, to, direction: 'forward' })),
    },
  };
  writeFileSync(join(out, 'characters', `${id}.json`), JSON.stringify(json, null, 1) + '\n');

  // Dialogue portrait: area-averaged head-and-shoulders crop, 256x256, full colour.
  // Mara has one portrait (gauntlet lit), written by the 'mara-gauntlet' variant as mara.png.
  if (cfg.unpowered) return;
  const portraitId = id.replace(/-gauntlet$/, '');
  const [px, py, pw, ph] = cfg.portrait;
  const P = 256, portrait = new PNG({ width: P, height: P });
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(py + (y * ph) / P); sy < py + ((y + 1) * ph) / P; sy++) {
      for (let sx = Math.floor(px + (x * pw) / P); sx < px + ((x + 1) * pw) / P; sx++) {
        const i = (sy * open.width + sx) * 4, al = open.data[i + 3] / 255;
        r += open.data[i] * al; g += open.data[i + 1] * al; b += open.data[i + 2] * al; a += al; n++;
      }
    }
    const o = (y * P + x) * 4;
    portrait.data[o] = a ? r / a : 0; portrait.data[o + 1] = a ? g / a : 0; portrait.data[o + 2] = a ? b / a : 0;
    portrait.data[o + 3] = a / n > 0.9 ? 255 : 0; // drop the illustration's soft glow halo
  }
  mkdirSync(join(out, 'portraits'), { recursive: true });
  writeFileSync(join(out, 'portraits', `${portraitId}.png`), PNG.sync.write(portrait));
}

for (const id of Object.keys(CHARACTERS)) buildCharacter(id);
console.log('Rigged character sheets and portraits written to art/src (mara, mara-gauntlet, oren, nell).');
