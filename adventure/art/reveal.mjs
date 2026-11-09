// The Ashlands reveal's stand-in panorama (after Silas's intro, src/game/reveal.ts): four layers seen
// from high and far off, drawn as SVG until Codex paints them (art/CODEX-NEXT.md, manifest
// `reveal-*`). 1280x720 art px each; every layer but the sky is transparent above its land.
//   sky:        night over the Ashlands, an ember glow low on the horizon, stars, the moon
//   mountains:  the far ranges
//   plains:     the ash plains and the Rift's dark crack, the kilns glowing far off
//   ridge:      the near ridge, Ironhaven on its cliff in the snow (where the camera starts)
//
//   node art/reveal.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { isFinal } from './guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'src', 'intro', 'reveal');
mkdirSync(out, { recursive: true });
const W = 1280, H = 720;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/** A jagged skyline from x 0 to W around `base`, `amp` high, as polygon points closed at the bottom. */
function skyline(base, amp, step, rough = 0.5) {
  const pts = [];
  let y = base;
  for (let x = 0; x <= W + step; x += step) {
    y = Math.max(base - amp, Math.min(base + amp * 0.3, y + (rnd() - 0.5) * amp * rough));
    pts.push([Math.min(x, W), Math.round(y)]);
  }
  return [...pts, [W, H], [0, H]];
}
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`);

async function save(name, body) {
  const file = `intro/reveal/${name}.webp`;
  if (isFinal(file)) { console.log(`  ${file}: final art, kept.`); return; }
  writeFileSync(join(out, `${name}.webp`), await sharp(svg(body)).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toBuffer());
}

// The sky: deep night above, an ember haze on the horizon (the kilns), stars and the moon.
{
  let s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f1e"/><stop offset="0.55" stop-color="#1c2236"/><stop offset="0.8" stop-color="#4a3036"/><stop offset="1" stop-color="#a0502a"/></linearGradient>
    <radialGradient id="m"><stop offset="0" stop-color="#f4f2e6"/><stop offset="0.3" stop-color="#d8dcef" stop-opacity="0.6"/><stop offset="1" stop-color="#8090c0" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>`;
  for (let n = 0; n < 160; n++) s += `<rect x="${Math.round(rnd() * W)}" y="${Math.round(rnd() * 380)}" width="2" height="2" fill="#e8eef8" opacity="${(0.3 + rnd() * 0.6).toFixed(2)}"/>`;
  s += `<circle cx="1010" cy="120" r="90" fill="url(#m)"/><circle cx="1010" cy="120" r="22" fill="#f1efe2"/>`;
  await save('reveal-sky', s);
}
// The far mountains: cold blue ranges, the nearest a shade darker.
{
  let s = poly(skyline(400, 120, 40, 0.9), '#2a3046');
  s += poly(skyline(430, 90, 32, 0.8), '#232839');
  await save('reveal-mountains', s);
}
// The ash plains: grey-brown flats rolling away, the Rift's crack through the middle, and the
// kilns' glow far off on the right.
{
  let s = `<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4038"/><stop offset="1" stop-color="#241e1a"/></linearGradient>
    <radialGradient id="k"><stop offset="0" stop-color="#ffb060" stop-opacity="0.9"/><stop offset="1" stop-color="#ff6020" stop-opacity="0"/></radialGradient></defs>`;
  s += poly(skyline(470, 20, 60, 0.6), 'url(#p)');
  s += poly([[640, 470], [652, 520], [628, 580], [660, 640], [618, 720], [596, 720], [636, 640], [606, 580], [630, 520]], '#120c0a');
  for (const [x, y, r] of [[930, 478, 40], [1010, 486, 28], [870, 490, 22]]) s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.5}" fill="url(#k)"/><rect x="${x - 3}" y="${y - 14}" width="6" height="14" fill="#2a1a12"/>`;
  await save('reveal-plains', s);
}
// The near ridge, with Ironhaven on its cliff at the left: walls, towers and a few lit windows, snow.
{
  let s = poly([[0, 300], [120, 290], [260, 310], [380, 330], [470, 380], [560, 470], [700, 560], [900, 600], [1280, 620], [1280, 720], [0, 720]], '#16161e');
  s += poly([[0, 300], [120, 290], [260, 310], [380, 330], [440, 352], [300, 334], [140, 312]], '#cfd6e6', 'opacity="0.8"');
  // Ironhaven: a wall along the clifftop and three towers.
  s += `<rect x="190" y="230" width="230" height="78" fill="#20222c"/>`;
  for (let x = 190; x < 420; x += 18) s += `<rect x="${x}" y="222" width="10" height="10" fill="#20222c"/>`;
  for (const [x, h] of [[210, 120], [300, 150], [390, 110]]) {
    s += `<rect x="${x - 16}" y="${308 - h}" width="32" height="${h}" fill="#1a1c25"/>${poly([[x - 20, 308 - h], [x + 20, 308 - h], [x, 278 - h]], '#1a1c25')}`;
    s += poly([[x - 20, 308 - h], [x + 20, 308 - h], [x, 278 - h]], '#cfd6e6', 'opacity="0.45"');
  }
  for (let n = 0; n < 9; n++) s += `<rect x="${Math.round(196 + rnd() * 215)}" y="${Math.round(196 + rnd() * 90)}" width="4" height="6" fill="#ffc870"/>`;
  await save('reveal-ridge', s);
}
console.log('Reveal stand-in layers written to art/src/intro/reveal.');
