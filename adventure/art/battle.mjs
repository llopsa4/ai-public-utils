// Battle art: the Hatch Scavenger, from Kiln Courier's Pressure Scavenger illustration
// (../FFCardGame/assets/opening/pressure-scavenger.png), area-downscaled and palette-reduced to
// sit with the pixel rooms. Placeholder until replaced (see art/REPLACING.md).
//
//   node art/battle.mjs   (part of npm run art)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', '..', 'FFCardGame', 'assets', 'opening', 'pressure-scavenger.png');
mkdirSync(join(here, 'src', 'battle'), { recursive: true });
// Battle sprites are drawn at 2x the world like everything else: 300 px wide is 150 world units.
await sharp(source).trim().resize({ width: 300, kernel: 'lanczos3' })
  .png({ palette: true, colours: 64, dither: 0.4, effort: 10 })
  .toFile(join(here, 'src', 'battle', 'scavenger.png'));
console.log('Battle art written to art/src/battle (scavenger).');
