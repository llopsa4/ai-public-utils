// Generates the pilot's placeholder pixel art.
//
// Output (all committed, so ordinary builds never need to run this):
//   art/src/characters/<id>.png + <id>.json   Aseprite-style JSON-array sprite sheets with frameTags
//   art/src/objects/<id>.png + <id>.json      object sheets (state frames)
//   art/src/rooms/<id>.png                    640x360 backgrounds
//   art/src/icons/<verb>.png                  24x24 radial-menu icons
//   art/src/items/<id>.png                    32x32 inventory icons
//
// Real art replaces these files one-for-one: keep the frame tag names and the
// bottom-centre foot anchor and nothing in the game code has to change.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const root = join(dirname(fileURLToPath(import.meta.url)), 'src');

// ---------------------------------------------------------------- raster ---
function rgba(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 6 ? h + 'ff' : h, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

class Img {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = typeof c === 'string' ? rgba(c) : c;
    const i = (y * this.w + x) * 4;
    if (a === 255) { this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255; return; }
    const t = a / 255;
    this.data[i] = Math.round(this.data[i] * (1 - t) + r * t);
    this.data[i + 1] = Math.round(this.data[i + 1] * (1 - t) + g * t);
    this.data[i + 2] = Math.round(this.data[i + 2] * (1 - t) + b * t);
    this.data[i + 3] = Math.max(this.data[i + 3], a);
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  rect(x, y, w, h, c) {
    for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.px(i, j, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
      for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
        const dx = (i - cx) / rx, dy = (j - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(i, j, c);
      }
    }
  }
  poly(points, c) {
    const ys = points.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const sy = y + 0.5;
      const xs = [];
      for (let k = 0; k < points.length; k++) {
        const [x0, y0] = points[k], [x1, y1] = points[(k + 1) % points.length];
        if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, width = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const r = (width - 1) / 2;
    for (let s = 0; s <= steps; s++) {
      const x = x0 + ((x1 - x0) * s) / steps, y = y0 + ((y1 - y0) * s) / steps;
      if (r <= 0) this.px(x, y, c);
      else this.ellipse(x, y, r + 0.3, r + 0.3, c);
    }
  }
  /** Adds a 1px outline around opaque pixels inside a rectangle. */
  outline(x0, y0, w, h, c) {
    const marks = [];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (this.alpha(x, y) !== 0) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= x0 && ny >= y0 && nx < x0 + w && ny < y0 + h && this.alpha(nx, ny) > 128;
      });
      if (near) marks.push([x, y]);
    }
    for (const [x, y] of marks) this.px(x, y, c);
  }
  save(path) {
    mkdirSync(dirname(path), { recursive: true });
    const png = new PNG({ width: this.w, height: this.h });
    this.data.copy(png.data);
    writeFileSync(path, PNG.sync.write(png));
  }
}

function shade(hex, f) {
  const [r, g, b] = rgba(hex);
  const k = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + [k(r), k(g), k(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Writes an Aseprite-compatible JSON-array sheet description (frames in one row). */
function sheetJson(image, frameW, frameH, count, tags, durations = {}) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({
      filename: String(i),
      frame: { x: i * frameW, y: 0, w: frameW, h: frameH },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
      sourceSize: { w: frameW, h: frameH },
      duration: durations[i] ?? 100,
    });
  }
  return {
    frames,
    meta: {
      app: 'adventure placeholder generator (Aseprite JSON-array compatible)',
      version: '1',
      image,
      format: 'RGBA8888',
      size: { w: frameW * count, h: frameH },
      scale: '1',
      frameTags: tags.map(([name, from, to]) => ({ name, from, to, direction: 'forward' })),
    },
  };
}

// ------------------------------------------------------------ characters ---
const FW = 128, FH = 128;
const OUTLINE = '#1b1420';

const SPECS = {
  hero: {
    skin: '#e8b48a', hair: '#5a3a22', coat: '#3d5a8c', pants: '#2b2b38', shoes: '#1d1a1f', accent: '#c8423a',
    half: 15, hem: 46, hat: false, beard: false, height: 112,
  },
  keeper: {
    skin: '#d79a72', hair: '#d9d4c8', coat: '#4f7a3a', pants: '#3a2c22', shoes: '#2a1c14', accent: '#d9a441',
    half: 20, hem: 22, hat: true, hatColor: '#7a4a2a', beard: true, height: 108,
  },
};

/** Draws a head. view: front | side | back. eyes: open | closed | dead */
function head(img, cx, cy, s, view, eyes) {
  const eye = '#20161a';
  if (view === 'back') {
    img.ellipse(cx, cy, 12, 14, s.hair);
    img.ellipse(cx, cy + 4, 10, 10, shade(s.hair, 0.85));
  } else if (view === 'front') {
    img.ellipse(cx, cy, 12, 14, s.skin);
    if (!s.hat) {
      img.ellipse(cx, cy - 9, 13, 7, s.hair);
      img.rect(cx - 13, cy - 8, 4, 11, s.hair);
      img.rect(cx + 9, cy - 8, 4, 11, s.hair);
    }
    if (eyes === 'open') {
      img.rect(cx - 6, cy - 1, 2, 3, eye); img.rect(cx + 4, cy - 1, 2, 3, eye);
      img.px(cx - 6, cy - 1, '#ffffff'); img.px(cx + 4, cy - 1, '#ffffff');
    } else {
      img.rect(cx - 7, cy + 1, 4, 1, eye); img.rect(cx + 3, cy + 1, 4, 1, eye);
    }
    img.rect(cx - 1, cy + 3, 2, 2, shade(s.skin, 0.85));
    if (s.beard) img.poly([[cx - 11, cy + 3], [cx + 11, cy + 3], [cx + 6, cy + 18], [cx - 6, cy + 18]], s.hair);
    img.rect(cx - 2, cy + 7, 4, 1, s.beard ? shade(s.hair, 0.7) : '#8a4b3a');
  } else {
    // side, facing right
    img.ellipse(cx, cy, 11, 14, s.skin);
    img.rect(cx + 10, cy - 1, 3, 4, s.skin);
    if (!s.hat) {
      img.ellipse(cx - 2, cy - 8, 11, 7, s.hair);
      img.rect(cx - 11, cy - 8, 9, 18, s.hair);
    } else {
      img.rect(cx - 11, cy - 4, 6, 10, s.hair);
    }
    if (eyes === 'open') { img.rect(cx + 5, cy - 1, 2, 3, eye); img.px(cx + 6, cy - 1, '#ffffff'); }
    else if (eyes === 'dead') {
      img.line(cx + 3, cy - 2, cx + 7, cy + 2, eye); img.line(cx + 7, cy - 2, cx + 3, cy + 2, eye);
    } else img.rect(cx + 4, cy + 1, 4, 1, eye);
    if (s.beard) img.poly([[cx - 2, cy + 3], [cx + 12, cy + 3], [cx + 8, cy + 17], [cx, cy + 15]], s.hair);
    img.rect(cx + 6, cy + 7, 4, 1, s.beard ? shade(s.hair, 0.7) : '#8a4b3a');
  }
  if (s.hat) {
    if (view === 'side') {
      img.ellipse(cx + 1, cy - 9, 20, 3, s.hatColor);
      img.poly([[cx - 9, cy - 9], [cx + 10, cy - 9], [cx + 8, cy - 21], [cx - 7, cy - 21]], shade(s.hatColor, 1.1));
      img.rect(cx - 9, cy - 12, 19, 2, s.accent);
    } else {
      img.ellipse(cx, cy - 9, 21, 4, s.hatColor);
      img.poly([[cx - 10, cy - 9], [cx + 10, cy - 9], [cx + 8, cy - 22], [cx - 8, cy - 22]], shade(s.hatColor, 1.1));
      img.rect(cx - 10, cy - 13, 20, 2, s.accent);
    }
  }
}

/** Standing/walking figure seen from the front or back. phase: -1 for standing, 0..3 walking. */
function figureFrontBack(img, ox, s, view, eyes, phase) {
  const cx = ox + 64, base = FH - 1;
  const bob = phase === 1 || phase === 3 ? -1 : 0;
  const lift = [[0, 4], [0, 0], [4, 0], [0, 0]][phase] ?? [0, 0];
  const top = base - s.height;
  const hip = base - 46;
  // legs
  const legC = view === 'back' ? shade(s.pants, 0.9) : s.pants;
  img.rect(cx - 11, hip + bob, 8, 42 - lift[0] - bob, legC);
  img.rect(cx + 3, hip + bob, 8, 42 - lift[1] - bob, legC);
  img.rect(cx - 12, base - 5 - lift[0], 10, 5, s.shoes);
  img.rect(cx + 2, base - 5 - lift[1], 10, 5, s.shoes);
  // coat
  const sh = top + 26 + bob;
  const hemY = base - s.hem + bob;
  img.poly([[cx - s.half, sh], [cx + s.half, sh], [cx + s.half + 3, hemY], [cx - s.half - 3, hemY]], s.coat);
  img.poly([[cx - s.half + 3, sh + 2], [cx - 2, sh + 2], [cx - 3, hemY], [cx - s.half, hemY]], shade(s.coat, 1.12));
  if (view === 'front') img.rect(cx - 1, sh + 6, 2, hemY - sh - 6, shade(s.coat, 0.7));
  img.rect(cx - s.half, hemY - 7, 2 * s.half, 2, shade(s.coat, 0.8));
  // arms (swing by lengthening / shortening)
  const swing = [3, 0, -3, 0][phase] ?? 0;
  img.rect(cx - s.half - 6, sh + 1, 6, 32 + swing, shade(s.coat, 0.88));
  img.rect(cx + s.half, sh + 1, 6, 32 - swing, shade(s.coat, 0.88));
  img.rect(cx - s.half - 6, sh + 33 + swing, 6, 5, s.skin);
  img.rect(cx + s.half, sh + 33 - swing, 6, 5, s.skin);
  // neck, scarf, head
  img.rect(cx - 4, sh - 4, 8, 5, s.skin);
  img.rect(cx - 9, sh - 1, 18, 4, s.accent);
  head(img, cx, top + 12 + bob, s, view, eyes);
}

/** Standing/walking figure in profile, facing right. phase: -1 standing, 0..3 walking. */
function figureSide(img, ox, s, eyes, phase) {
  const cx = ox + 64, base = FH - 1;
  const bob = phase === 1 || phase === 3 ? -1 : 0;
  const top = base - s.height;
  const hip = base - 46 + bob;
  const stride = [[-13, 13], [-3, 4], [13, -13], [4, -3]][phase] ?? [-3, 3];
  const liftF = phase === 1 ? 4 : 0, liftB = phase === 3 ? 4 : 0;
  // far leg (darker), then near leg
  const legs = [[stride[1], liftB, shade(s.pants, 0.75)], [stride[0], liftF, s.pants]];
  for (const [dx, lift, c] of legs) {
    img.line(cx, hip, cx + dx, base - 5 - lift, c, 8);
    img.rect(cx + dx - 4, base - 5 - lift, 12, 5, s.shoes);
  }
  const sh = top + 26 + bob;
  const hemY = base - s.hem + bob;
  const half = Math.round(s.half * 0.65);
  img.poly([[cx - half, sh], [cx + half, sh], [cx + half + 3, hemY], [cx - half - 3, hemY]], s.coat);
  img.poly([[cx + 1, sh + 2], [cx + half - 1, sh + 2], [cx + half + 1, hemY], [cx + 2, hemY]], shade(s.coat, 1.12));
  img.rect(cx - half - 2, hemY - 7, 2 * half + 4, 2, shade(s.coat, 0.8));
  // arm swings opposite to the near leg
  const ax = Math.round(-stride[0] * 0.7);
  img.line(cx, sh + 3, cx + ax, sh + 32, shade(s.coat, 0.85), 6);
  img.rect(cx + ax - 3, sh + 31, 6, 6, s.skin);
  img.rect(cx - 3, sh - 4, 8, 5, s.skin);
  img.rect(cx - 7, sh - 1, 15, 4, s.accent);
  head(img, cx + 1, top + 12 + bob, s, 'side', eyes);
}

function figureCrouch(img, ox, s) {
  const cx = ox + 64, base = FH - 1;
  // back leg kneeling, front leg bent
  img.line(cx - 6, base - 30, cx + 4, base - 9, shade(s.pants, 0.75), 8);
  img.line(cx + 4, base - 9, cx - 16, base - 5, shade(s.pants, 0.75), 8);
  img.rect(cx - 24, base - 6, 10, 6, s.shoes);
  img.line(cx - 4, base - 30, cx + 14, base - 30, s.pants, 8);
  img.line(cx + 14, base - 30, cx + 12, base - 5, s.pants, 8);
  img.rect(cx + 8, base - 5, 13, 5, s.shoes);
  // torso leaning forward
  const coatLen = Math.max(0, 24 - s.hem) * 0.5;
  img.poly([[cx - 12, base - 26 + coatLen], [cx + 6, base - 24 + coatLen], [cx + 16, base - 66], [cx - 2, base - 70]], s.coat);
  img.poly([[cx + 2, base - 28], [cx + 6, base - 26], [cx + 15, base - 64], [cx + 8, base - 66]], shade(s.coat, 1.12));
  // reaching arm
  img.line(cx + 10, base - 62, cx + 28, base - 24, shade(s.coat, 0.85), 6);
  img.rect(cx + 25, base - 25, 6, 6, s.skin);
  img.rect(cx + 2, base - 74, 15, 4, s.accent);
  head(img, cx + 12, base - 84, s, 'side', 'open');
}

function figureDead(img, ox, s) {
  const cx = ox + 56, base = FH - 1;
  // legs stretched to the left, shoes pointing up
  img.line(cx - 10, base - 8, cx - 48, base - 7, shade(s.pants, 0.75), 8);
  img.line(cx - 10, base - 12, cx - 46, base - 13, s.pants, 8);
  img.rect(cx - 56, base - 22, 6, 12, s.shoes);
  img.rect(cx - 54, base - 16, 6, 12, s.shoes);
  // torso lying flat
  img.poly([[cx - 14, base - 20], [cx + 26, base - 22], [cx + 26, base - 1], [cx - 14, base - 1]], s.coat);
  img.rect(cx - 12, base - 20, 38, 4, shade(s.coat, 1.12));
  if (s.hem < 30) img.poly([[cx - 14, base - 18], [cx - 34, base - 15], [cx - 34, base - 2], [cx - 14, base - 1]], shade(s.coat, 0.92));
  // arm along the body
  img.line(cx + 20, base - 6, cx - 6, base - 4, shade(s.coat, 0.85), 6);
  img.rect(cx - 10, base - 7, 6, 6, s.skin);
  img.rect(cx + 24, base - 18, 4, 14, s.accent);
  // head turned up, eyes crossed out
  img.ellipse(cx + 40, base - 12, 13, 11, s.skin);
  if (!s.hat) img.ellipse(cx + 44, base - 6, 12, 7, s.hair);
  const eye = '#20161a';
  img.line(cx + 36, base - 19, cx + 40, base - 15, eye); img.line(cx + 40, base - 19, cx + 36, base - 15, eye);
  img.rect(cx + 45, base - 15, 4, 1, '#8a4b3a');
  if (s.beard) img.poly([[cx + 46, base - 20], [cx + 60, base - 18], [cx + 58, base - 6], [cx + 46, base - 8]], s.hair);
  if (s.hat) {
    // the hat has rolled off beside the head
    img.ellipse(cx + 56, base - 4, 7, 3, s.hatColor);
    img.poly([[cx + 50, base - 4], [cx + 62, base - 4], [cx + 60, base - 13], [cx + 52, base - 13]], shade(s.hatColor, 1.1));
  }
}

const CHAR_TAGS = [
  ['stand_down', 0, 0], ['blink_down', 1, 1], ['stand_side', 2, 2], ['blink_side', 3, 3], ['stand_up', 4, 4],
  ['walk_down', 5, 8], ['walk_side', 9, 12], ['walk_up', 13, 16], ['crouch', 17, 17], ['dead', 18, 18],
];

function character(id) {
  const s = SPECS[id];
  const count = 19;
  const img = new Img(FW * count, FH);
  const at = i => i * FW;
  figureFrontBack(img, at(0), s, 'front', 'open', -1);
  figureFrontBack(img, at(1), s, 'front', 'closed', -1);
  figureSide(img, at(2), s, 'open', -1);
  figureSide(img, at(3), s, 'closed', -1);
  figureFrontBack(img, at(4), s, 'back', 'open', -1);
  for (let p = 0; p < 4; p++) figureFrontBack(img, at(5 + p), s, 'front', 'open', p);
  for (let p = 0; p < 4; p++) figureSide(img, at(9 + p), s, 'open', p);
  for (let p = 0; p < 4; p++) figureFrontBack(img, at(13 + p), s, 'back', 'open', p);
  figureCrouch(img, at(17), s);
  figureDead(img, at(18), s);
  for (let i = 0; i < count; i++) img.outline(at(i), 0, FW, FH, OUTLINE);
  const durations = {};
  for (let i = 5; i <= 16; i++) durations[i] = 130;
  img.save(join(root, 'characters', `${id}.png`));
  writeFileSync(join(root, 'characters', `${id}.json`), JSON.stringify(sheetJson(`${id}.png`, FW, FH, count, CHAR_TAGS, durations), null, 1) + '\n');
}

// --------------------------------------------------------------- objects ---
function suitcase() {
  const W = 72, H = 64, img = new Img(W * 2, H);
  const leather = '#8a5a34', dark = '#5e3a20', brass = '#d9a441';
  for (const [i, open] of [[0, false], [1, true]]) {
    const ox = i * W, b = H - 1;
    if (open) {
      // lid standing up behind the case
      img.poly([[ox + 10, b - 22], [ox + 62, b - 22], [ox + 58, b - 58], [ox + 14, b - 58]], dark);
      img.poly([[ox + 14, b - 24], [ox + 58, b - 24], [ox + 55, b - 54], [ox + 17, b - 54]], '#a33a3a');
      img.rect(ox + 8, b - 22, 56, 22, leather);
      img.rect(ox + 11, b - 22, 50, 6, '#7a2a2a');
      img.rect(ox + 8, b - 3, 56, 3, dark);
    } else {
      img.rect(ox + 8, b - 30, 56, 30, leather);
      img.rect(ox + 8, b - 30, 56, 3, shade(leather, 1.2));
      img.rect(ox + 8, b - 3, 56, 3, dark);
      img.rect(ox + 20, b - 30, 4, 30, dark); img.rect(ox + 48, b - 30, 4, 30, dark);
      img.rect(ox + 27, b - 36, 18, 3, dark); img.rect(ox + 27, b - 36, 3, 7, dark); img.rect(ox + 42, b - 36, 3, 7, dark);
      img.rect(ox + 33, b - 24, 6, 5, brass);
    }
  }
  img.outline(0, 0, W, H, OUTLINE); img.outline(W, 0, W, H, OUTLINE);
  img.save(join(root, 'objects', 'suitcase.png'));
  writeFileSync(join(root, 'objects', 'suitcase.json'), JSON.stringify(sheetJson('suitcase.png', W, H, 2, [['closed', 0, 0], ['open', 1, 1]]), null, 1) + '\n');
}

function keyShape(img, ox, oy, scale) {
  const gold = '#e7c046', dark = '#9a7420';
  img.ellipse(ox + 4 * scale, oy + 4 * scale, 4 * scale, 4 * scale, gold);
  img.ellipse(ox + 4 * scale, oy + 4 * scale, 1.6 * scale, 1.6 * scale, dark);
  img.rect(ox + 7 * scale, oy + 3 * scale, 9 * scale, 2 * scale, gold);
  img.rect(ox + 13 * scale, oy + 5 * scale, 2 * scale, 2.5 * scale, gold);
  img.rect(ox + 10 * scale, oy + 5 * scale, 1.5 * scale, 2 * scale, gold);
}

function key() {
  const img = new Img(20, 12);
  keyShape(img, 1, 1, 1);
  img.outline(0, 0, 20, 12, OUTLINE);
  img.save(join(root, 'objects', 'key.png'));
  writeFileSync(join(root, 'objects', 'key.json'), JSON.stringify(sheetJson('key.png', 20, 12, 1, [['idle', 0, 0]]), null, 1) + '\n');
  const icon = new Img(32, 32);
  keyShape(icon, 0, 9, 1.9);
  icon.outline(0, 0, 32, 32, OUTLINE);
  icon.save(join(root, 'items', 'key.png'));
}

function door() {
  const W = 88, H = 150, img = new Img(W * 2, H);
  const wood = '#6b4226', dark = '#4a2c18', knob = '#d9a441';
  for (const [i, open] of [[0, false], [1, true]]) {
    const ox = i * W, b = H - 1;
    img.rect(ox, b - 148, W, 148, '#3a2618'); // frame
    if (!open) {
      img.rect(ox + 6, b - 142, W - 12, 142, wood);
      img.rect(ox + 14, b - 132, W - 28, 52, shade(wood, 1.15));
      img.rect(ox + 14, b - 70, W - 28, 60, shade(wood, 1.15));
      img.rect(ox + 18, b - 128, W - 36, 44, wood);
      img.rect(ox + 18, b - 66, W - 36, 52, wood);
      img.ellipse(ox + W - 18, b - 74, 3, 3, knob);
      img.rect(ox + W - 20, b - 66, 4, 7, dark);
    } else {
      // daylight from the street beyond
      img.rect(ox + 6, b - 142, W - 12, 142, '#9fd0f0');
      img.rect(ox + 6, b - 60, W - 12, 60, '#b3a38c');
      img.rect(ox + 6, b - 100, 26, 40, '#8b6f5a');
      img.rect(ox + 50, b - 120, 32, 60, '#a87b5f');
      img.rect(ox + 6, b - 4, W - 12, 4, '#857660');
      // the door leaf swung inward, seen edge-on
      img.poly([[ox + 2, b - 146], [ox + 18, b - 140], [ox + 18, b - 2], [ox + 2, b]], dark);
      img.rect(ox + 14, b - 74, 3, 4, knob);
    }
  }
  img.save(join(root, 'objects', 'door.png'));
  writeFileSync(join(root, 'objects', 'door.json'), JSON.stringify(sheetJson('door.png', W, H, 2, [['closed', 0, 0], ['open', 1, 1]]), null, 1) + '\n');
}

// ----------------------------------------------------------------- rooms ---
function hall() {
  const img = new Img(640, 360);
  // wallpaper
  img.rect(0, 0, 640, 228, '#8a6f5a');
  for (let x = 0; x < 640; x += 24) img.rect(x, 0, 4, 228, '#7f6553');
  for (let x = 12; x < 640; x += 24) for (let y = 12; y < 220; y += 24) img.rect(x - 1, y - 1, 3, 3, '#9c806a');
  img.rect(0, 0, 640, 10, '#5e4636');
  img.rect(0, 214, 640, 14, '#4a3324');
  img.rect(0, 214, 640, 2, '#6b4c36');
  // floor planks in perspective
  img.rect(0, 228, 640, 132, '#7a5534');
  let y = 228, gap = 7;
  while (y < 360) { img.rect(0, y, 640, 1, '#5c3e25'); y += gap; gap += 2; }
  for (let k = -12; k <= 12; k++) {
    const xTop = 320 + k * 36, xBottom = 320 + k * 70;
    img.line(xTop, 228, xBottom, 360, '#634329');
  }
  // rug
  img.poly([[230, 300], [430, 300], [470, 350], [190, 350]], '#7a2f3a');
  img.poly([[240, 305], [420, 305], [455, 345], [205, 345]], '#94414c');
  img.poly([[260, 312], [400, 312], [425, 338], [235, 338]], '#7a2f3a');
  // window
  img.rect(66, 46, 112, 112, '#4a3324');
  img.rect(72, 52, 100, 100, '#9fd0f0');
  img.rect(72, 110, 100, 42, '#b9e0f6');
  img.ellipse(100, 78, 14, 6, '#e8f4fb'); img.ellipse(140, 92, 18, 5, '#e8f4fb');
  img.rect(119, 52, 6, 100, '#4a3324'); img.rect(72, 99, 100, 6, '#4a3324');
  img.rect(60, 156, 124, 8, '#5e4636');
  // painting
  img.rect(262, 56, 104, 76, '#c79a3a');
  img.rect(268, 62, 92, 64, '#3d6b7a');
  img.poly([[268, 126], [300, 88], [330, 112], [360, 80], [360, 126]], '#2d4f3a');
  img.ellipse(336, 76, 6, 6, '#f0d27a');
  // door recess (the door sprite sits on top)
  img.rect(458, 74, 96, 154, '#2c1e14');
  // small table and lamp on the left
  img.rect(40, 236, 70, 8, '#5e3a20'); img.rect(46, 244, 6, 40, '#4a2c18'); img.rect(98, 244, 6, 40, '#4a2c18');
  img.poly([[58, 212], [92, 212], [84, 196], [66, 196]], '#e0c27a'); img.rect(73, 212, 4, 24, '#3a2618');
  img.save(join(root, 'rooms', 'hall.png'));
}

function street() {
  const img = new Img(640, 360);
  for (let y = 0; y < 170; y++) img.rect(0, y, 640, 1, y < 80 ? '#7fb8e6' : '#9fcbee');
  img.ellipse(520, 50, 26, 8, '#e8f4fb'); img.ellipse(380, 30, 34, 7, '#e8f4fb');
  // hotel facade on the left with the doorway back inside
  img.rect(0, 30, 220, 228, '#a87b5f');
  for (let x = 0; x < 220; x += 16) for (let yy = 30 + (x % 32 ? 8 : 0); yy < 250; yy += 16) img.rect(x, yy, 15, 1, '#93694f');
  img.rect(0, 30, 220, 10, '#7a5642');
  img.rect(140, 60, 50, 60, '#4a3324'); img.rect(145, 65, 40, 50, '#9fd0f0'); img.rect(163, 65, 4, 50, '#4a3324');
  img.rect(20, 60, 50, 60, '#4a3324'); img.rect(25, 65, 40, 50, '#9fd0f0'); img.rect(43, 65, 4, 50, '#4a3324');
  img.rect(76, 120, 72, 18, '#2d4f3a'); img.rect(80, 124, 64, 10, '#d9a441'); // sign board
  img.rect(80, 146, 64, 112, '#3a2618');
  img.rect(86, 152, 52, 106, '#2c1e14');
  img.rect(86, 210, 52, 48, '#5c3e25'); // warm light on the hall floor
  // right buildings
  img.rect(300, 70, 160, 188, '#8b6f5a');
  img.rect(460, 100, 180, 158, '#7a8a9a');
  for (let x = 320; x < 450; x += 44) for (let yy = 90; yy < 230; yy += 52) { img.rect(x, yy, 26, 34, '#3a3040'); img.rect(x + 3, yy + 3, 20, 28, '#c9d8e6'); }
  for (let x = 480; x < 640; x += 46) for (let yy = 120; yy < 230; yy += 50) { img.rect(x, yy, 28, 32, '#3a3040'); img.rect(x + 3, yy + 3, 22, 26, '#e6d8a6'); }
  img.rect(220, 150, 80, 108, '#6b5a4c'); img.rect(232, 170, 56, 40, '#4a3c34'); // alley wall
  // pavement
  img.rect(0, 258, 640, 102, '#9a9184');
  for (let yy = 258, g = 10; yy < 360; yy += g, g += 3) img.rect(0, yy, 640, 1, '#7f776c');
  for (let k = -10; k <= 10; k++) img.line(320 + k * 40, 258, 320 + k * 80, 360, '#857c70');
  img.rect(0, 256, 640, 4, '#6e665c');
  // lamp post
  img.rect(566, 120, 6, 170, '#2c2c34'); img.rect(556, 112, 26, 10, '#2c2c34');
  img.poly([[558, 122], [580, 122], [576, 138], [562, 138]], '#f0d27a');
  img.rect(560, 286, 18, 6, '#2c2c34');
  img.save(join(root, 'rooms', 'street.png'));
}

// ----------------------------------------------------------------- icons ---
function icons() {
  const ink = '#1b1420', light = '#f4ead8', gold = '#e7c046', red = '#c8423a';
  const make = (name, draw) => { const img = new Img(24, 24); draw(img); img.outline(0, 0, 24, 24, ink); img.save(join(root, 'icons', `${name}.png`)); };
  make('look', i => { i.ellipse(12, 12, 10, 6, light); i.ellipse(12, 12, 4, 4, '#3d5a8c'); i.ellipse(12, 12, 2, 2, ink); });
  make('open', i => { i.rect(4, 3, 14, 19, '#6b4226'); i.rect(7, 6, 8, 16, '#9fd0f0'); i.poly([[4, 3], [11, 6], [11, 23], [4, 21]], '#8a5a34'); });
  make('close', i => { i.rect(5, 3, 14, 19, '#8a5a34'); i.rect(8, 6, 8, 6, '#6b4226'); i.rect(8, 14, 8, 6, '#6b4226'); i.rect(16, 12, 2, 2, gold); });
  make('take', i => { i.rect(6, 10, 12, 10, light); i.rect(6, 4, 3, 8, light); i.rect(10, 3, 3, 8, light); i.rect(14, 4, 3, 8, light); i.rect(18, 9, 3, 6, light); });
  make('use', i => { i.ellipse(12, 12, 9, 9, '#a0a0b0'); i.ellipse(12, 12, 4, 4, ink); for (const [x, y] of [[12, 1], [12, 21], [1, 12], [21, 12]]) i.rect(x - 2, y - 1, 4, 3, '#a0a0b0'); });
  make('talk', i => { i.ellipse(12, 10, 10, 7, light); i.poly([[6, 14], [11, 15], [4, 21]], light); i.rect(7, 9, 2, 2, ink); i.rect(11, 9, 2, 2, ink); i.rect(15, 9, 2, 2, ink); });
  make('go', i => { i.rect(3, 9, 12, 6, gold); i.poly([[14, 4], [22, 12], [14, 20]], gold); });
  make('crouch', i => { i.ellipse(13, 7, 3, 3, light); i.line(12, 10, 9, 16, light, 3); i.line(9, 16, 15, 17, light, 3); i.line(15, 17, 13, 21, light, 3); i.rect(4, 21, 16, 2, red); });
  make('lie', i => { i.ellipse(19, 15, 3, 3, light); i.line(4, 16, 16, 16, light, 3); i.rect(3, 19, 19, 2, red); });
  make('stand', i => { i.ellipse(12, 4, 3, 3, light); i.line(12, 7, 12, 15, light, 3); i.line(12, 15, 9, 21, light, 3); i.line(12, 15, 15, 21, light, 3); i.line(8, 10, 16, 10, light, 2); });
}

character('hero');
character('keeper');
suitcase();
key();
door();
hall();
street();
icons();
console.log(`Placeholder art written to ${root}`);
