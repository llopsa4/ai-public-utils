// The wooden crate Ansel sits on in the kiln hall: cut from Codex's ashways painting (the X-braced
// crate beside the urn), shrunk to his seat height, warmed a little to the hall's light, and put back
// on the 2-pixel grid and the master palette like every imported picture.
//   node art/hall-crate.mjs   (also part of npm run art)
// Output: art/src/foreground/hall-crate.png, placed by the kiln hall's `foreground` list.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { toGrid } from './import.mjs';
import { encodeIndexed } from './png.mjs';

const here = dirname(fileURLToPath(import.meta.url));
/** The crate in art/src/rooms/ashways.png (1280x720 art pixels). */
const CUT = { left: 494, top: 432, width: 104, height: 90 };
/** Ansel's drawn sitting pose rests on a seat 58 art pixels above the floor. */
export const CRATE = { width: 68, height: 58 };
/** The kiln hall's light is warmer than the ashways' daylight. */
const WARM = [1.08, 1.0, 0.88];

const { data, info } = await sharp(join(here, 'src', 'rooms', 'ashways.png')).extract(CUT)
  .resize(CRATE.width, CRATE.height, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round(data[i + c] * WARM[c]));
  data[i + 3] = 255;
}
const img = toGrid({ data: Buffer.from(data), width: info.width, height: info.height });
mkdirSync(join(here, 'src', 'foreground'), { recursive: true });
writeFileSync(join(here, 'src', 'foreground', 'hall-crate.png'), encodeIndexed(img));
console.log(`Wrote art/src/foreground/hall-crate.png (${CRATE.width}x${CRATE.height}).`);
