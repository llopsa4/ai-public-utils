// Writes WebP copies of the room backgrounds and foreground cut-outs, which the game loads instead
// of the PNGs (a painted 1280x720 room is about a third of the size as WebP).
//
//   npm run webp   (also part of npm run art, after pixelate)
//
// The PNGs stay the source of truth: they are what pixelate.mjs writes and what PROVENANCE lists.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
// Only pictures the art list serves as WebP (`webp: true`) get a copy: other props ship as PNG.
const { MANIFEST } = await import('./manifest.mjs');
const served = new Set(MANIFEST.filter(e => e.webp).map(e => e.file));
let total = 0;
for (const folder of ['rooms', 'foreground', 'props', 'ch2/rooms', 'intro/rooms']) {
  const dir = join(here, 'src', folder);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter(n => n.endsWith('.png') && served.has(`${folder}/${n}`))) {
    const out = join(dir, name.replace(/\.png$/, '.webp'));
    // Rooms are opaque paintings; foreground pieces need their alpha edges kept exact. Lossy suits
    // soft painted rooms; Codex's flat pixel art is smaller lossless (and exact): keep the smaller.
    const lossy = await sharp(join(dir, name)).webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
    const lossless = await sharp(join(dir, name)).webp({ lossless: true, effort: 6 }).toBuffer();
    const best = lossless.length <= lossy.length ? lossless : lossy;
    writeFileSync(out, best);
    total += best.length;
  }
}
// Background people's sheets (placeholders, many frames): lossy WebP is about a third smaller.
for (const name of readdirSync(join(here, 'src', 'characters')).filter(n => /^extra-.*\.png$/.test(n))) {
  const info = await sharp(join(here, 'src', 'characters', name)).webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(join(here, 'src', 'characters', name.replace(/\.png$/, '.webp')));
  total += info.size;
}
console.log(`WebP rooms and foregrounds written to art/src (${(total / 1024).toFixed(0)} KB).`);
