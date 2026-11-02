// Draws the 24x24 pixel icons for the action ring.
//
//   npm run art   (runs pixelate.mjs, rig.mjs and this script)
//
// Everything else in art/src comes from Kiln Courier's illustrations (see PROVENANCE.md).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'src', 'icons');

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

class Icon {
  constructor() { this.png = new PNG({ width: 24, height: 24 }); }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x > 23 || y > 23) return;
    const [r, g, b, a] = hex(c), i = (y * 24 + x) * 4;
    this.png.data[i] = r; this.png.data[i + 1] = g; this.png.data[i + 2] = b; this.png.data[i + 3] = a;
  }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, c); }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, c);
  }
  poly(points, c) {
    for (let y = 0; y < 24; y++) {
      const xs = [];
      for (let k = 0; k < points.length; k++) {
        const [x0, y0] = points[k], [x1, y1] = points[(k + 1) % points.length];
        if ((y0 <= y + 0.5 && y1 > y + 0.5) || (y1 <= y + 0.5 && y0 > y + 0.5)) xs.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, w = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) this.ellipse(x0 + ((x1 - x0) * s) / n, y0 + ((y1 - y0) * s) / n, (w - 1) / 2 + 0.3, (w - 1) / 2 + 0.3, c);
  }
  save(name) {
    const d = this.png.data, marks = [];
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      if (d[(y * 24 + x) * 4 + 3]) continue;
      const solid = (xx, yy) => xx >= 0 && yy >= 0 && xx < 24 && yy < 24 && d[(yy * 24 + xx) * 4 + 3];
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) marks.push([x, y]);
    }
    for (const [x, y] of marks) this.px(x, y, '#1b1420');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.png`), PNG.sync.write(this.png));
  }
}

const ink = '#1b1420', light = '#f4ead8', gold = '#e7c046', red = '#c8423a';
const make = (name, draw) => { const i = new Icon(); draw(i); i.save(name); };
make('look', i => { i.ellipse(12, 12, 10, 6, light); i.ellipse(12, 12, 4, 4, '#3d5a8c'); i.ellipse(12, 12, 2, 2, ink); });
make('open', i => { i.rect(4, 3, 14, 19, '#6b4226'); i.rect(7, 6, 8, 16, '#ef8a2c'); i.poly([[4, 3], [11, 6], [11, 23], [4, 21]], '#8a5a34'); });
make('close', i => { i.rect(5, 3, 14, 19, '#8a5a34'); i.rect(8, 6, 8, 6, '#6b4226'); i.rect(8, 14, 8, 6, '#6b4226'); i.rect(16, 12, 2, 2, gold); });
make('take', i => { i.rect(6, 10, 12, 10, light); i.rect(6, 4, 3, 8, light); i.rect(10, 3, 3, 8, light); i.rect(14, 4, 3, 8, light); i.rect(18, 9, 3, 6, light); });
make('use', i => { i.ellipse(12, 12, 9, 9, '#a0a0b0'); i.ellipse(12, 12, 4, 4, ink); for (const [x, y] of [[12, 1], [12, 21], [1, 12], [21, 12]]) i.rect(x - 2, y - 1, 4, 3, '#a0a0b0'); });
make('talk', i => { i.ellipse(12, 10, 10, 7, light); i.poly([[6, 14], [11, 15], [4, 21]], light); i.rect(7, 9, 2, 2, ink); i.rect(11, 9, 2, 2, ink); i.rect(15, 9, 2, 2, ink); });
make('go', i => { i.rect(3, 9, 12, 6, gold); i.poly([[14, 4], [22, 12], [14, 20]], gold); });
make('crouch', i => { i.ellipse(13, 7, 3, 3, light); i.line(12, 10, 9, 16, light, 3); i.line(9, 16, 15, 17, light, 3); i.line(15, 17, 13, 21, light, 3); i.rect(4, 21, 16, 2, red); });
make('lie', i => { i.ellipse(19, 15, 3, 3, light); i.line(4, 16, 16, 16, light, 3); i.rect(3, 19, 19, 2, red); });
make('stand', i => { i.ellipse(12, 4, 3, 3, light); i.line(12, 7, 12, 15, light, 3); i.line(12, 15, 9, 21, light, 3); i.line(12, 15, 15, 21, light, 3); i.line(8, 10, 16, 10, light, 2); });
console.log(`Action-ring icons written to ${dir}`);
