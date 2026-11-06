// Rebuild runtime combat poses from the preserved, approved reference drawings.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = new URL('./sources/combat/', import.meta.url);
const output = new URL('./src/kc/', import.meta.url);
for (const [input, name] of [['fighting-stance-v2.png', 'hero-low.webp'], ['punch-near-impact-v2.png', 'hero-punch.webp']]) {
  // Trim transparent margins, then give each full figure the same height and floor anchor.
  await sharp(fileURLToPath(new URL(input, source))).trim({ threshold: 10 })
    .resize({ height: 640 }).webp({ quality: 85, alphaQuality: 100, effort: 6 })
    .toFile(fileURLToPath(new URL(name, output)));
}
