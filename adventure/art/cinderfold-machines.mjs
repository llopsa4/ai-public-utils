// Normalize ImageGen machine art without using the human rig. Only these two sheets are written.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}art/sources/cinderfold-machines`;
const delivery = `${root}art/inbox/done/cinderfold-machines`;
await fs.mkdir(delivery, { recursive: true });
const palette = JSON.parse(await fs.readFile(`${root}art/style/palette.json`, 'utf8')).colours.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
const cache = new Map();
export async function clean(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 128) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x0 > x1) throw new Error('Empty machine frame');
  return sharp(data, { raw: info }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
}
async function frame(input, scale, flip = false) {
  const meta = await sharp(input).metadata();
  const w = Math.max(1, Math.round(meta.width * scale / 2)), h = Math.max(1, Math.round(meta.height * scale / 2));
  if (w > 80 || h > 64) throw new Error(`Machine exceeds 160×128 frame: ${w * 2}×${h * 2}`);
  const { data } = await sharp(input).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 128) { data.fill(0, p, p + 4); continue; }
    const key = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2];
    let rgb = cache.get(key);
    if (!rgb) {
      rgb = palette.reduce((best, color) => {
        const dist = c => (c[0] - data[p]) ** 2 + (c[1] - data[p + 1]) ** 2 + (c[2] - data[p + 2]) ** 2;
        return dist(color) < dist(best) ? color : best;
      }); cache.set(key, rgb);
    }
    data[p] = rgb[0]; data[p + 1] = rgb[1]; data[p + 2] = rgb[2]; data[p + 3] = 255;
  }
  let img = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  if (flip) img = img.flop();
  const small = await img.png().toBuffer();
  const canvas = await sharp({ create: { width: 80, height: 64, channels: 4, background: '#0000' } })
    .composite([{ input: small, left: Math.floor((80 - w) / 2), top: 64 - h }])
    .png().toBuffer();
  return sharp(canvas).resize(160, 128, { kernel: 'nearest' }).png().toBuffer();
}
const configs = [
  { id: 'ash-collector', raw: 'ash', width: 128, at: [420, 306] },
  { id: 'shard-sorter', raw: 'sorter', width: 112, at: [556, 338] },
];
const anchors = [];
for (const cfg of configs) {
  const anchor = await clean(`${source}/${cfg.raw}-anchor-raw.png`);
  const meta = await sharp(anchor).metadata();
  const seed = await frame(anchor, cfg.width / meta.width);
  await fs.writeFile(`${delivery}/${cfg.id}-anchor.png`, seed);
  anchors.push({ input: seed, left: cfg.at[0] * 2 - 80, top: cfg.at[1] * 2 - 128 });
}
// Proportion check: the shipped 218px Hollis is beside the new knee-high machinery.
anchors.push({ input: await sharp(`${root}art/src/characters/extra-stoker.png`).extract({ left: 0, top: 0, width: 256, height: 256 }).png().toBuffer(), left: 360 * 2 - 128, top: 300 * 2 - 256 });
await sharp(`${root}art/src/rooms/mara-room.png`).composite(anchors).png().toFile(`${delivery}/proportions.png`);

if (process.argv.includes('--anchors')) process.exit(0);
for (const cfg of configs) {
  const raw = `${source}/${cfg.raw}-actions-raw.png`;
  const meta = await sharp(raw).metadata();
  const crops = [];
  // Eight equal cells, four across and two down. All frames use one shared scale.
  for (let i = 0; i < 8; i++) {
    const x = Math.round(i % 4 * meta.width / 4), y = Math.round(Math.floor(i / 4) * meta.height / 2);
    const endX = Math.round((i % 4 + 1) * meta.width / 4), endY = Math.round((Math.floor(i / 4) + 1) * meta.height / 2);
    crops.push(await clean(await sharp(raw).extract({ left: x, top: y, width: endX - x, height: endY - y }).png().toBuffer()));
  }
  const sizes = await Promise.all(crops.map(c => sharp(c).metadata()));
  const scale = cfg.width / sizes[0].width;
  const frames = await Promise.all(crops.map(c => frame(c, scale)));
  // Anchor is the approved parked silhouette; strip frame 0 is ready to work.
  const parked = await fs.readFile(`${delivery}/${cfg.id}-anchor.png`);
  frames.push(parked);
  const directions = `${source}/${cfg.raw}-directions-raw.png`;
  const dm = await sharp(directions).metadata();
  const directional = [];
  for (let i = 0; i < 6; i++) {
    const x = Math.round(i % 3 * dm.width / 3), y = Math.round(Math.floor(i / 3) * dm.height / 2);
    const ex = Math.round((i % 3 + 1) * dm.width / 3), ey = Math.round((Math.floor(i / 3) + 1) * dm.height / 2);
    directional.push(await clean(await sharp(directions).extract({ left: x, top: y, width: ex - x, height: ey - y }).png().toBuffer()));
  }
  const dirSizes = await Promise.all(directional.map(c => sharp(c).metadata()));
  const ds = Math.min(92 / dirSizes[0].width, (cfg.raw === 'ash' ? 64 : 52) / dirSizes[0].height);
  frames.push(...await Promise.all(directional.map(c => frame(c, ds))));
  const tags = [
    ['stand_side', 0, 0], ['walk_side', 1, 2], ['work', 3, 4], ['reach', 5, 6], ['park', 7, 7],
    ['stand_up', 9, 9], ['walk_up', 10, 11], ['stand_down', 12, 12], ['walk_down', 13, 14],
    ['blink_side', 0, 0], ['blink_down', 12, 12], ['crouch', 7, 7], ['carry', 0, 0], ['sit', 7, 7],
  ];
  // Crowd sheets use 256px cells; padding preserves each machine's own small silhouette.
  const png = await sharp({ create: { width: 256 * frames.length, height: 256, channels: 4, background: '#0000' } })
    .composite(frames.map((input, i) => ({ input, left: i * 256 + 48, top: 128 }))).png().toBuffer();
  const out = `${root}art/src/characters/extra-${cfg.id}`;
  await fs.writeFile(`${out}.png`, png);
  await sharp(png).webp({ lossless: true }).toFile(`${out}.webp`);
  const json = {
    frames: frames.map((_, i) => ({ filename: String(i), frame: { x: i * 256, y: 0, w: 256, h: 256 }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 256, h: 256 }, sourceSize: { w: 256, h: 256 }, duration: i >= 3 && i <= 6 ? 360 : 180 })),
    meta: { image: `extra-${cfg.id}.png`, size: { w: frames.length * 256, h: 256 }, scale: '1',
      frameTags: tags.map(([name, from, to]) => ({ name, from, to, direction: 'forward' })), walk: { distancePerFrame: cfg.raw === 'ash' ? 5 : 4, plantFrames: [0, 1] } },
  };
  await fs.writeFile(`${out}.json`, JSON.stringify(json, null, 2) + '\n');
  await sharp(png).png().toFile(`${delivery}/${cfg.id}-sheet-preview.png`);
  console.log(`Built extra-${cfg.id}: ${frames.length} frames, shared side scale ${scale.toFixed(4)}`);
}
