// Mara's tent as hand-made pixel art: drawn pixel by pixel on a 320x180 grid (art/tent-pixels.mjs,
// with art/pixel.mjs), in one hand-picked palette of hue-shifted ramps, then shown 4x with hard
// edges. Seen side-on with little perspective: the canvas back wall sagging between its poles;
// the workbench along the left with its tool board, a tool roll, a candle and a glazed jar (the
// charging cradle and the notebook are objects the game draws on it); the old brush drum on its
// trestle against the back wall; Mara's coat on the pole; the cot with boots and Tobi's drawing on
// the right; the door flap at the right edge open on the kiln hall's warm light; a rug on packed
// earth; the stool in front. One lighting pass lights it all: the hanging lantern brightest
// close by and falling off into dark corners, the door's light on the canvas and across the floor.
// Also writes the stool as a walk-behind cut-out of the room's own pixels.
//
//   node art/tent.mjs   (part of npm run art; then npm run webp)
//
// The layout matches the tent's hotspots, walk area and objects in src/chapters/ch1/rooms.ts
// (world units are 2 pixels of this grid).
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';
import { Layer, dithered } from './pixel.mjs';
import * as T from './tent-pixels.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src');
const { P, SHADE, GRID } = T;
const SCALE = 4;

const room = new Layer(GRID.w, GRID.h);
room.rect(0, 0, GRID.w, GRID.h, P.canvas.colours[1]);
T.shell(room);
T.floor(room);
T.rug(room);
T.door(room);
// Contact shadows on the floor under everything that stands on it.
const shadows = new Layer(GRID.w, GRID.h);
for (const [cx, cy, rx, ry, s] of [[54, 128, 56, 3.5, 0.9], [151, 124, 32, 3, 0.9], [242, 127, 38, 3, 0.9], [61, 151, 22, 3, 0.8],
  [107, 121, 5, 1.5, 0.8], [214, 121, 5, 1.5, 0.8], [236, 132, 12, 2, 0.8], [183, 165, 70, 2, 0.5]]) T.contactShadow(shadows, cx, cy, rx, ry, s);
room.draw(shadows);
T.poles(room);
T.herbs(room);
T.toolBoard(room);
T.drawing(room);
T.coat(room);
T.workbench(room);
T.onTheBench(room);
T.drum(room);
room.draw(T.cot(), 206, 96);
T.boots(room);
T.lantern(room);
const stool = T.stool();
room.draw(stool, 36, 102);

/**
 * The light: every pixel's shade moves up or down its ramp by how much light reaches it (the
 * lantern close by, the door's glow, the shaft across the floor), dithered between steps. The
 * lights themselves and the outlines are left as drawn.
 */
function lightAt(x, y) {
  const lamp = 1.1 - Math.hypot(x - 160, (y - 28) * 1.15) / 80;
  const doorGlow = 0.9 - Math.hypot(x - 296, (y - 92) * 0.7) / 40;
  // The shaft from the door across the floor, widening towards the front.
  let shaft = -9;
  if (y > GRID.floor) {
    const k = (y - GRID.floor) / 60, left = 282 - k * 90, right = 311 - k * 40;
    if (x > left && x < right) shaft = 0.7 - k * 0.6;
  }
  return Math.max(lamp, doorGlow, shaft, -2.6);
}
room.map((x, y, c) => {
  const s = SHADE.get(c);
  if (!s || s[0] === 'light') return c;
  const r = P[s[0]], v = lightAt(x, y);
  // Flat bands of light with a narrow dithered seam between them (no checkerboard over the walls).
  const f = v - Math.floor(v);
  const step = Math.floor(v) + (f > 0.6 ? 1 : f > 0.4 && dithered(x, y, (f - 0.4) / 0.2) ? 1 : 0);
  return r.colours[Math.max(0, Math.min(r.colours.length - 1, s[1] + step))];
});

mkdirSync(join(out, 'rooms'), { recursive: true });
mkdirSync(join(out, 'foreground'), { recursive: true });
const big = await room.image(SCALE).png().toBuffer();
if (!isFinal('rooms/tent.png')) await sharp(big).png({ palette: true, colours: 256, dither: 0, effort: 10 }).toFile(join(out, 'rooms', 'tent.png'));
// The stool: the room's own (lit) pixels where the stool is, in the box the room def places it at
// (world 72,204 → grid 36,102 → art 144,408).
if (!isFinal('foreground/tent-stool.png')) {
  const cut = new Layer(stool.w, stool.h);
  for (let y = 0; y < stool.h; y++) for (let x = 0; x < stool.w; x++) if (stool.get(x, y)) cut.set(x, y, room.get(x + 36, y + 102));
  await cut.image(SCALE).png({ palette: true, colours: 64, dither: 0, effort: 10 }).toFile(join(out, 'foreground', 'tent-stool.png'));
}
console.log('Painted the tent: art/src/rooms/tent.png and foreground/tent-stool.png.');
