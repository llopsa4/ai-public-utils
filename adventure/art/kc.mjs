// Art for Kiln Courier's battle and workshop screens (src/kc), re-encoded from FFCardGame's
// painted originals (../FFCardGame/assets) to small WebPs: Mara's portrait, the scavenger, the
// card atlas, the regulator gallery backdrop and the equipment pictures. Placeholders for the
// adventure until replaced (see art/REPLACING.md).
//
//   node art/kc.mjs   (part of npm run art)
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const kc = join(here, '..', '..', 'FFCardGame', 'assets');
const out = join(here, 'src', 'kc');
mkdirSync(join(out, 'equipment'), { recursive: true });
const webp = async (src, file, width, quality = 80) => isFinal(`kc/${file}`) ? null :
  sharp(join(kc, src)).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90, effort: 6 }).toFile(join(out, file));
await webp('hero.png', 'hero.webp', 512);
await webp('opening/pressure-scavenger.png', 'pressure-scavenger.webp', 768);
await webp('card-atlas.png', 'card-atlas.webp', 768, 74);
await webp('opening/regulator-gallery.png', 'regulator-gallery.webp', 1280, 72);
// Chapter 2: Bryn's workshop for the sparring, and the training rig (Kiln Courier draws its
// training rig with the sweeper picture).
await webp('opening/tempering-house.png', 'tempering-house.webp', 1280, 72);
await webp('opening/ash-sweeper.png', 'ash-sweeper.webp', 768);
// Include every base item exposed by the gear screen (including debug/later-game gear).
// Reinforced variants keep their existing base-art fallback until separately delivered.
for (const name of readdirSync(join(kc, 'equipment', 'runtime')).filter(n => n.endsWith('.webp') && !n.endsWith('-upgraded.webp')).sort()) {
  await webp(`equipment/runtime/${name}`, `equipment/${name}`, 320);
}
console.log('Kiln Courier battle art written to art/src/kc.');
