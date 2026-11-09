// Derives the master palette (art/style/palette.json + palette.png) from the tent reference (the
// style master for the Codex art), and draws the scale reference (art/style/scale.png). Every imported image is
// snapped to this palette (art/import.mjs), which is what keeps Codex's images in one tone.
//
//   node art/derive-palette.mjs   (run once; re-run only to deliberately re-base the palette)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'src');
const style = join(here, 'style');
mkdirSync(style, { recursive: true });
const COLOURS = 160;

// The source: the user's tent reference (adventure/tent-reference.png), the style master for all
// the Codex art, at the game's pixel grid size so the palette matches what the importer snaps.
const montage = await sharp(join(here, '..', 'tent-reference.png')).resize(640, 360, { kernel: 'lanczos3' }).ensureAlpha()
  .raw().toBuffer({ resolveWithObject: true });
// k-means over every 7th opaque pixel (as art/rig.mjs builds its sheet palettes).
const samples = [];
for (let i = 0; i < montage.data.length; i += 4 * 3) if (montage.data[i + 3] >= 128) samples.push([montage.data[i], montage.data[i + 1], montage.data[i + 2]]);
const sorted = [...samples].sort((a, b) => (a[0] * 3 + a[1] * 6 + a[2]) - (b[0] * 3 + b[1] * 6 + b[2]));
let centres = Array.from({ length: COLOURS }, (_, j) => [...sorted[Math.floor(((j + 0.5) / COLOURS) * sorted.length)]]);
for (let it = 0; it < 12; it++) {
  const sums = centres.map(() => [0, 0, 0, 0]);
  for (const p of samples) {
    let best = 0, bd = Infinity;
    for (let j = 0; j < COLOURS; j++) { const c = centres[j]; const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }
    const s = sums[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
  }
  centres = centres.map((c, j) => (sums[j][3] ? sums[j].slice(0, 3).map(v => v / sums[j][3]) : c));
}
const seen = new Map(centres.map(c => { const [r, g, b] = c.map(Math.round); return [(r << 16) | (g << 8) | b, 1]; }));
// Darkest to lightest, so the swatch reads as ramps.
const palette = [...seen.keys()].map(k => [k >> 16, (k >> 8) & 255, k & 255])
  .sort((a, b) => (a[0] * 0.3 + a[1] * 0.59 + a[2] * 0.11) - (b[0] * 0.3 + b[1] * 0.59 + b[2] * 0.11));
// Ironhaven's set (added by hand, not derived from the tent) is kept when the palette is re-based.
const kept = (() => {
  try { const old = JSON.parse(readFileSync(join(style, 'palette.json'), 'utf8')); return { ironhaven: old.ironhaven, ironhavenNote: old.ironhavenNote }; } catch { return {}; }
})();
writeFileSync(join(style, 'palette.json'), JSON.stringify({
  note: 'Cinderfold master palette: every image is snapped to these colours on import (art/import.mjs). Derived from the tent reference (tent-reference.png, the style master) by art/derive-palette.mjs.',
  colours: palette.map(([r, g, b]) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`),
  ...kept,
}, null, 1) + '\n');

// Swatch: 16 per row, 32 px squares.
const cols = 16, cell = 32, rows = Math.ceil(palette.length / cols);
const swatch = new PNG({ width: cols * cell, height: rows * cell });
palette.forEach(([r, g, b], n) => {
  const x0 = (n % cols) * cell, y0 = Math.floor(n / cols) * cell;
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
    const o = ((y0 + y) * swatch.width + x0 + x) * 4;
    swatch.data[o] = r; swatch.data[o + 1] = g; swatch.data[o + 2] = b; swatch.data[o + 3] = 255;
  }
});
writeFileSync(join(style, 'palette.png'), PNG.sync.write(swatch));

// Scale reference: the cast and the furniture side by side on one floor line, at the heights the
// briefs ask for, in art pixels (grid pixels x 4): what every Codex picture must respect.
const SCALE_ITEMS = [
  // [label, width, height, colour]
  ['Mara 232', 64, 232, '#d08a3a'], ['Bryn 224 (broad)', 84, 224, '#b0503a'], ['Oren 226', 56, 226, '#8a8a70'],
  ['Nell 220', 60, 220, '#a07850'], ['Adult 206-224', 58, 216, '#7a6a58'], ['Child 146-150', 44, 148, '#c8a060'],
  ['Doorway 328', 130, 328, null], ['Bench / table top 104', 140, 104, '#6a4a2e'], ['Chair seat 48', 44, 48, '#6a4a2e'],
  ['Stool 52', 44, 52, '#6a4a2e'], ['Cot top 44', 150, 44, '#5a6a4a'], ['Crate 48', 52, 48, '#6a4a2e'],
  ['Jar 56', 36, 56, '#a86a40'], ['Lantern 32', 20, 32, '#c8a040'],
];
const W = 1680, H = 470, floor = 400;
let x = 24, shapes = '';
for (const [label, w, h, colour] of SCALE_ITEMS) {
  shapes += colour
    ? `<rect x="${x}" y="${floor - h}" width="${w}" height="${h}" rx="${h > 140 ? 18 : 4}" fill="${colour}" stroke="#1e1412" stroke-width="3"/>`
    : `<rect x="${x}" y="${floor - h}" width="${w}" height="${h}" fill="none" stroke="#c89a5a" stroke-width="4"/>`;
  shapes += `<text x="${x + w / 2}" y="${floor + 26}" font-family="Arial" font-size="15" fill="#e8d8c0" text-anchor="middle">${label.split(' ').slice(0, 2).join(' ')}</text>`;
  shapes += `<text x="${x + w / 2}" y="${floor + 46}" font-family="Arial" font-size="15" fill="#e8d8c0" text-anchor="middle">${label.split(' ').slice(2).join(' ')}</text>`;
  x += w + 26;
}
const chart = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#2a2420"/>
  ${[...Array(Math.floor(floor / 16))].map((_, i) => `<line x1="0" y1="${floor - i * 16}" x2="${W}" y2="${floor - i * 16}" stroke="#ffffff" stroke-opacity="${i % 5 ? 0.04 : 0.1}"/>`).join('')}
  <line x1="0" y1="${floor}" x2="${W}" y2="${floor}" stroke="#8a7a6a" stroke-width="2"/>
  <text x="24" y="34" font-family="Arial" font-size="20" fill="#f0e0c8">Heights in art pixels (2x world; a room is 1280x720, its pixel grid 4 art pixels): every figure and object is drawn in these proportions.</text>
  ${shapes}</svg>`;
await sharp(Buffer.from(chart)).png().toFile(join(style, 'scale.png'));
console.log(`Master palette: ${palette.length} colours (art/style/palette.json, palette.png); scale reference art/style/scale.png.`);
