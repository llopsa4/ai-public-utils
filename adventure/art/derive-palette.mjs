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
writeFileSync(join(style, 'palette.json'), JSON.stringify({
  note: 'Cinderfold master palette: every image is snapped to these colours on import (art/import.mjs). Derived from the tent reference (tent-reference.png, the style master) by art/derive-palette.mjs.',
  colours: palette.map(([r, g, b]) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`),
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

// Scale reference: Mara, an adult, a child, a doorway and a workbench, on one floor line, at the
// heights a brief asks for (art pixels at the front of a room).
const W = 900, H = 420, floor = 380;
// Sheet frames are 256x256 at true art size, feet on the bottom row: placed unscaled, they show
// the real heights (232 for Mara, 226 for Oren, 146 for a child).
const people = [['mara-gauntlet', 30], ['oren', 230], ['extra-kid', 400]];
const comps = [];
for (const [sheet, x] of people) {
  comps.push({ input: await sharp(join(src, 'characters', `${sheet}.png`)).extract({ left: 0, top: 0, width: 256, height: 256 }).png().toBuffer(), left: x, top: floor - 255 });
}
const labels = `
  <rect x="600" y="${floor - 325}" width="120" height="325" fill="none" stroke="#c89a5a" stroke-width="4"/>
  <rect x="760" y="${floor - 104}" width="110" height="104" fill="#6a4a2e" stroke="#2a1a10" stroke-width="3"/>
  <line x1="20" y1="${floor}" x2="${W - 20}" y2="${floor}" stroke="#8a7a6a" stroke-width="2"/>
  ${[['Mara 232', 100], ['Adult 226', 280], ['Child 146', 440], ['Doorway 325', 610], ['Bench 104', 765]].map(([t, x]) => `<text x="${x}" y="${floor + 30}" font-family="Arial" font-size="18" fill="#e8d8c0">${t}</text>`).join('')}
`;
const scale = await sharp({ create: { width: W, height: H, channels: 4, background: '#1a120c' } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${labels}</svg>`), left: 0, top: 0 }, ...comps])
  .png().toBuffer();
writeFileSync(join(style, 'scale.png'), scale);
console.log(`Master palette: ${palette.length} colours (art/style/palette.json, palette.png); scale reference art/style/scale.png.`);
