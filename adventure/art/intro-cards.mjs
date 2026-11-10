// Backdrops for the chapters' opening cards (src/ui/introCards.ts): a crop of each chapter's first
// room, blurred and darkened by the page, behind the opening lines. Made from the room paintings, so
// no new art: Silas's cell window and moonbeam, the kiln hall's glowing mouths, the tunnel mouth.
//
//   node art/intro-cards.mjs   (part of npm run art)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src', 'intro-cards');
mkdirSync(out, { recursive: true });
// [card, room painting, crop (art px: left, top, width, height)], each crop 16:9.
// The cell's moonbeam is drawn live in the game: here it is painted onto the crop (crop pixels).
const MOONBEAM = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4ecff" stop-opacity="0.95"/><stop offset="1" stop-color="#9fb4e8" stop-opacity="0"/></linearGradient>
  <filter id="s"><feGaussianBlur stdDeviation="10"/></filter></defs>
  <polygon points="200,130 320,140 560,360 300,360" fill="url(#b)" filter="url(#s)"/>
  <ellipse cx="225" cy="120" rx="90" ry="70" fill="#c8d6ff" opacity="0.5" filter="url(#s)"/></svg>`);
const CARDS = [
  ['intro', 'intro/rooms/cell.png', [120, 40, 640, 360], MOONBEAM],
  ['ch1', 'rooms/mara-room.png', [520, 120, 640, 360]],
  ['ch2', 'ch2/rooms/tunnel-mouth.png', [620, 160, 640, 360]],
];
for (const [card, file, [left, top, width, height], overlay] of CARDS) {
  // Small and soft on purpose: the page blurs and dims it further.
  let crop = await sharp(join(here, 'src', file)).extract({ left, top, width, height }).png().toBuffer();
  if (overlay) crop = await sharp(crop).composite([{ input: overlay, blend: 'screen' }]).png().toBuffer();
  const buf = await sharp(crop).resize(480, 270).blur(1.2).webp({ quality: 70 }).toBuffer();
  writeFileSync(join(out, `${card}.webp`), buf);
  console.log(`  ${card}: ${(buf.length / 1024).toFixed(0)} KB`);
}
