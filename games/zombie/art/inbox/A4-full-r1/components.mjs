import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';

export function silhouetteComponents(source) {
  const { width, height, data } = source;
  const seen = new Uint8Array(width * height);
  const components = [];
  for (let offset = 0; offset < seen.length; offset++) {
    if (seen[offset] || data[offset * 4 + 3] < 160) continue;
    const pixels = [offset];
    const box = { left: width, top: height, right: -1, bottom: -1 };
    seen[offset] = 1;
    for (const current of pixels) {
      const x = current % width, y = Math.floor(current / width);
      box.left = Math.min(box.left, x); box.right = Math.max(box.right, x);
      box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const sx = x + dx, sy = y + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        const next = sy * width + sx;
        if (seen[next] || data[next * 4 + 3] < 160) continue;
        seen[next] = 1;
        pixels.push(next);
      }
    }
    if (pixels.length >= 300) components.push({ ...box, pixels });
  }
  return components;
}

export function readSheet(path) {
  return PNG.sync.read(readFileSync(path));
}

if (process.argv[2]) {
  for (const path of process.argv.slice(2)) {
    const png = readSheet(path);
    const components = silhouetteComponents(png).sort((a, b) =>
      (a.top + a.bottom) - (b.top + b.bottom));
    console.log(path, png.width, png.height, JSON.stringify(components.map(({left, top, right, bottom, pixels}) =>
      [left, top, right, bottom, pixels.length])));
  }
}
