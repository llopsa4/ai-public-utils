// Art for Kiln Courier's battle and workshop screens (src/kc), re-encoded from FFCardGame's
// painted originals (../FFCardGame/assets) to small WebPs: Mara's portrait, the scavenger, the
// card atlas, the regulator gallery backdrop and the equipment pictures. Placeholders for the
// adventure until replaced (see art/REPLACING.md).
//
//   node art/kc.mjs   (part of npm run art)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const kc = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src', 'kc');
mkdirSync(join(out, 'equipment'), { recursive: true });
const webp = (src, file, width, quality = 80) =>
  sharp(join(kc, src)).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90, effort: 6 }).toFile(join(out, file));
await webp('hero.png', 'hero.webp', 512);
await webp('opening/pressure-scavenger.png', 'pressure-scavenger.webp', 768);
await webp('card-atlas.png', 'card-atlas.webp', 768, 74);
await webp('opening/regulator-gallery.png', 'regulator-gallery.webp', 1280, 72);
for (const id of ['courier-gauntlet', 'patched-coat', 'plain-carrier', 'light-armor', 'quick-harness']) {
  await sharp(join(kc, 'equipment', 'runtime', `${id}.webp`)).resize({ width: 320 }).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(join(out, 'equipment', `${id}.webp`));
}
console.log('Kiln Courier battle art written to art/src/kc.');
