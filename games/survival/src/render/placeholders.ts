// Placeholder art drawn in code. Boot calls ensureTextures(): every manifest key that has no loaded
// PNG gets a texture here, so Codex replaces art one asset at a time (art/PIPELINE.md).
import Phaser from 'phaser';
import { manifest } from './manifest';

type G = Phaser.GameObjects.Graphics;

/** A person 32 x 40, feet at the bottom centre; `k` scales a child, `variant` picks the family's shirt. */
function person(g: G, shirt: number, hair: number, k: number, stoop: number): void {
  const X = (x: number) => 16 + (x - 16) * k;
  const Y = (y: number) => 38 + (y + stoop - 38) * k;
  shadow(g, 17, 38, 20 * k + 2, 6);
  g.fillStyle(0x5a4632, 1).fillRect(X(12), Y(28), 3 * k + 0.5, 10 * k).fillRect(X(17), Y(28), 3 * k + 0.5, 10 * k);
  g.fillStyle(0xd9a066, 1).fillRect(X(8), Y(16), 3 * k + 0.5, 11 * k).fillRect(X(21), Y(16), 3 * k + 0.5, 11 * k);
  g.fillStyle(shirt, 1).fillRect(X(10), Y(15), 12 * k, 15 * k);
  g.fillStyle(hair, 1).fillCircle(X(16), Y(8.5), 5.4 * k);
  g.fillStyle(0xd9a066, 1).fillCircle(X(16), Y(10.5), 4.4 * k);
}

const DRAW: Record<string, (g: G, w: number, h: number, variant: number) => void> = {
  person_adult: (g, _w, _h, v) => person(g, v ? 0x4f7fb5 : 0xc4703c, 0x2e2118, 1, 0),
  person_elder: (g, _w, _h, v) => person(g, v ? 0x6a8fb8 : 0xa8683c, 0xd2d2cc, 0.94, 1.5),
  person_child: (g, _w, _h, v) => person(g, v ? 0x8cb2dc : 0xe0a064, 0x2e2118, 0.7, 0),
  tile_grass: (g, w, h) => ground(g, w, h, 0x8fae5a, [0x9cba66, 0x82a14f], 0x6f8f45),
  tile_river: (g, w, h) => ground(g, w, h, 0x4f8f9a, [0x6aa8b2, 0x437f8a], 0x3d727c),
  tile_ford: (g, w, h) => ground(g, w, h, 0x8fb0a0, [0xb9c6a0, 0x7aa294], 0x6f9488),
  tile_forest: (g, w, h) => ground(g, w, h, 0x6a8a48, [0x5c7a3d, 0x779553], 0x56723a),
  tile_berry: (g, w, h) => {
    ground(g, w, h, 0x86a853, [0x94b45e, 0x7a9b4b], 0x6f8f45);
    g.fillStyle(0xb8323c, 1);
    for (const [x, y] of [[24, 14], [34, 11], [40, 18], [28, 21], [18, 17], [36, 22]]) g.fillCircle(x, y, 2);
    g.fillStyle(0x3f6b2f, 1);
    for (const [x, y] of [[22, 12], [38, 14], [30, 19]]) g.fillCircle(x, y, 3);
  },
  object_tree: (g, w, h) => {
    shadow(g, w / 2 + 4, h - 4, 30, 10);
    g.fillStyle(0x6b4a2e, 1).fillRect(w / 2 - 3, h - 22, 6, 20);
    g.fillStyle(0x3f6b34, 1).fillTriangle(w / 2, 4, w / 2 - 18, h - 20, w / 2 + 18, h - 20);
    g.fillStyle(0x4f8040, 1).fillTriangle(w / 2, 14, w / 2 - 21, h - 8, w / 2 + 21, h - 8);
    g.fillStyle(0x62954d, 1).fillTriangle(w / 2 - 2, 16, w / 2 - 20, h - 9, w / 2 - 4, h - 9);
  },
  building_tipi: (g, w, h) => {
    const cx = w / 2;
    const base = h * 0.75;
    shadow(g, cx + 6, base + 2, 70, 26);
    g.fillStyle(0xe6d3a3, 1).fillTriangle(cx, 8, cx - 34, base, cx + 34, base);
    g.fillStyle(0xc9b585, 1).fillTriangle(cx, 8, cx + 34, base, cx + 4, base + 4);
    g.fillStyle(0x4a3624, 1).fillTriangle(cx - 2, base - 26, cx - 11, base + 1, cx + 7, base + 1);
    g.lineStyle(2, 0x6b4a2e, 1);
    for (const dx of [-5, -1, 3, 7]) g.lineBetween(cx + dx * 0.4, 8, cx + dx * 2.2, -2 + 2);
    g.lineStyle(1, 0x9c8a62, 1).lineBetween(cx, 8, cx - 18, base + 2).lineBetween(cx, 8, cx + 18, base + 2);
  },
  building_store: (g, w, h) => {
    // A low hide-covered store: an iso box standing on the 2x2 footprint diamond.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 8, cy + 4, 110, 44);
    const hw = 40;
    const hh = 20;
    const rise = 30;
    g.fillStyle(0x8a6a44, 1).fillPoints([p(cx - hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx - hw, cy - rise)], true);
    g.fillStyle(0x6f5234, 1).fillPoints([p(cx + hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx + hw, cy - rise)], true);
    g.fillStyle(0xb99a6a, 1).fillPoints([p(cx, cy - hh - rise), p(cx + hw, cy - rise), p(cx, cy + hh - rise), p(cx - hw, cy - rise)], true);
    g.lineStyle(1, 0x4a3624, 1).strokePoints([p(cx - hw, cy - rise), p(cx, cy + hh - rise), p(cx + hw, cy - rise)], false);
    g.fillStyle(0x4a3624, 1).fillRect(cx - 24, cy - 14, 10, 12).fillRect(cx + 16, cy - 14, 10, 12);
  },
  building_gathering_spot: (g, w, h) => {
    // A woven mat with baskets of berries and a log seat on the 2x2 footprint.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 4, cy + 2, 96, 36);
    g.fillStyle(0xb89a6a, 1).fillPoints([p(cx, cy - 26), p(cx + 50, cy), p(cx, cy + 26), p(cx - 50, cy)], true);
    g.lineStyle(1, 0x8a6f48, 1).strokePoints([p(cx, cy - 26), p(cx + 50, cy), p(cx, cy + 26), p(cx - 50, cy)], true);
    for (const [bx, by] of [[-22, -2], [10, 8], [24, -8]]) {
      g.fillStyle(0x6b4a2e, 1).fillEllipse(cx + bx, cy + by, 22, 11);
      g.fillStyle(0xb8323c, 1).fillCircle(cx + bx - 4, cy + by - 2, 2.5).fillCircle(cx + bx + 3, cy + by - 3, 2.5).fillCircle(cx + bx, cy + by, 2.5);
    }
    g.fillStyle(0x7a5a3a, 1).fillRect(cx - 34, cy + 6, 22, 6);
  },
  building_hunting_lodge: (g, w, h) => {
    // A low log lodge with a hide roof and a drying rack at its side.
    const cx = w / 2 - 6;
    const cy = h * 0.75;
    shadow(g, cx + 10, cy + 4, 112, 44);
    const hw = 38;
    const hh = 19;
    const rise = 26;
    g.fillStyle(0x7a5a3a, 1).fillPoints([p(cx - hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx - hw, cy - rise)], true);
    g.fillStyle(0x62482e, 1).fillPoints([p(cx + hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx + hw, cy - rise)], true);
    g.fillStyle(0xc9a56e, 1).fillPoints([p(cx, cy - hh - rise - 8), p(cx + hw + 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx - hw - 4, cy - rise)], true);
    g.lineStyle(1, 0x6f5234, 1).strokePoints([p(cx - hw - 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx + hw + 4, cy - rise)], false);
    g.fillStyle(0x4a3624, 1).fillRect(cx + 8, cy - 4, 10, 12);
    // The drying rack.
    g.fillStyle(0x5a3b22, 1).fillRect(cx + 46, cy - 30, 3, 34).fillRect(cx + 76, cy - 30, 3, 34).fillRect(cx + 46, cy - 30, 33, 3);
    g.fillStyle(0xb9473c, 1).fillRect(cx + 52, cy - 27, 4, 14).fillRect(cx + 60, cy - 27, 4, 16).fillRect(cx + 68, cy - 27, 4, 12);
  },
  building_drying_rack: (g, w, h) => {
    // Two A-frames of poles with a crossbar of red meat strips, on the 2x2 footprint.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 4, cy + 2, 96, 34);
    g.fillStyle(0xa98f62, 1).fillPoints([p(cx, cy - 22), p(cx + 46, cy), p(cx, cy + 22), p(cx - 46, cy)], true);
    g.lineStyle(1, 0x8a6f48, 1).strokePoints([p(cx, cy - 22), p(cx + 46, cy), p(cx, cy + 22), p(cx - 46, cy)], true);
    g.lineStyle(3, 0x5a3b22, 1);
    for (const x of [-30, 30]) {
      g.lineBetween(cx + x - 8, cy + 6, cx + x, cy - 38).lineBetween(cx + x + 8, cy + 6, cx + x, cy - 38);
    }
    g.lineBetween(cx - 30, cy - 36, cx + 30, cy - 36);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0xb9473c : 0x9c3a31, 1).fillRect(cx - 26 + i * 10, cy - 35, 5, 12 + (i % 3) * 3);
    }
  },
  building_healers_lodge: (g, w, h) => {
    // A low round-roofed lodge with a green herb bundle hanging by the door.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 6, cy + 4, 104, 40);
    const hw = 34;
    const hh = 17;
    const rise = 24;
    g.fillStyle(0x8a6a44, 1).fillPoints([p(cx - hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx - hw, cy - rise)], true);
    g.fillStyle(0x6f5234, 1).fillPoints([p(cx + hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx + hw, cy - rise)], true);
    g.fillStyle(0x7fa05a, 1).fillPoints([p(cx, cy - hh - rise - 8), p(cx + hw + 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx - hw - 4, cy - rise)], true);
    g.lineStyle(1, 0x4f6e38, 1).strokePoints([p(cx - hw - 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx + hw + 4, cy - rise)], false);
    g.fillStyle(0x4a3624, 1).fillRect(cx + 6, cy - 4, 10, 12);
    g.lineStyle(2, 0x5a3b22, 1).lineBetween(cx + 22, cy - 22, cx + 22, cy - 12);
    g.fillStyle(0x4f8a3a, 1).fillEllipse(cx + 22, cy - 8, 8, 12);
    g.fillStyle(0xe7e1c8, 1).fillCircle(cx + 22, cy - 22, 2);
  },
  building_horse_corral: (g, w, h) => {
    // A trampled-earth diamond fenced with posts and two rails, and two brown horses standing inside.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 4, cy + 2, 100, 36);
    const ring = [p(cx, cy - 24), p(cx + 48, cy), p(cx, cy + 24), p(cx - 48, cy)];
    g.fillStyle(0xb39a6a, 1).fillPoints(ring, true);
    g.lineStyle(3, 0x5a3b22, 1).strokePoints([p(cx - 48, cy - 8), p(cx, cy - 32), p(cx + 48, cy - 8)], false);
    g.lineStyle(3, 0x5a3b22, 1).strokePoints([p(cx - 48, cy - 16), p(cx, cy - 40), p(cx + 48, cy - 16)], false);
    for (const [px, py] of [[-48, 0], [-24, -12], [0, -24], [24, -12], [48, 0], [-24, 12], [0, 24], [24, 12]]) {
      g.fillStyle(0x5a3b22, 1).fillRect(cx + px - 1.5, cy + py - 18, 3, 20);
    }
    for (const [hx, hy, coat] of [[-14, 2, 0x8a5a36], [14, -4, 0xa8794a]]) {
      g.fillStyle(coat, 1).fillEllipse(cx + hx, cy + hy - 8, 20, 11);
      g.fillRect(cx + hx + 7, cy + hy - 18, 5, 11);
      g.fillEllipse(cx + hx + 12, cy + hy - 18, 8, 5);
      g.fillStyle(0x3a2616, 1).fillRect(cx + hx - 7, cy + hy - 4, 2, 7).fillRect(cx + hx + 4, cy + hy - 4, 2, 7);
    }
  },
  building_scouts_lodge: (g, w, h) => {
    // A small lodge with a tall lookout pole and a red pennant.
    lodgeBody(g, w, h, 0x8a6a44, 0x6f5234, 0x9c7f55);
    const cx = w / 2;
    const cy = h * 0.75;
    g.lineStyle(3, 0x5a3b22, 1).lineBetween(cx + 30, cy + 4, cx + 30, cy - 70);
    g.fillStyle(0xb9473c, 1).fillTriangle(cx + 30, cy - 70, cx + 52, cy - 62, cx + 30, cy - 54);
    g.fillStyle(0xe7e1c8, 1).fillCircle(cx + 30, cy - 72, 2.5);
  },
  building_lancers_lodge: (g, w, h) => {
    // A lodge with three lances standing in front, points up, with red bands.
    lodgeBody(g, w, h, 0x7a5a3a, 0x62482e, 0xb08a58);
    const cx = w / 2;
    const cy = h * 0.75;
    for (const dx of [-8, 0, 8]) {
      g.lineStyle(2, 0x5a3b22, 1).lineBetween(cx + 24 + dx, cy + 14, cx + 22 + dx * 0.6, cy - 34);
      g.fillStyle(0xcfd3d6, 1).fillTriangle(cx + 22 + dx * 0.6, cy - 44, cx + 19 + dx * 0.6, cy - 33, cx + 25 + dx * 0.6, cy - 33);
      g.fillStyle(0xb9473c, 1).fillRect(cx + 20 + dx * 0.6, cy - 30, 4, 3);
    }
  },
  building_archers_lodge: (g, w, h) => {
    // A lodge with a round target on a stand and a bow leaning on the wall.
    lodgeBody(g, w, h, 0x7e6240, 0x654a30, 0xa8905f);
    const cx = w / 2;
    const cy = h * 0.75;
    g.lineStyle(2, 0x5a3b22, 1).lineBetween(cx + 30, cy + 14, cx + 30, cy - 8).lineBetween(cx + 22, cy + 16, cx + 38, cy + 16);
    g.fillStyle(0xe6d3a3, 1).fillCircle(cx + 30, cy - 18, 13);
    g.fillStyle(0xb9473c, 1).fillCircle(cx + 30, cy - 18, 9);
    g.fillStyle(0xe6d3a3, 1).fillCircle(cx + 30, cy - 18, 5);
    g.fillStyle(0xb9473c, 1).fillCircle(cx + 30, cy - 18, 2);
    g.lineStyle(2, 0x4a3624, 1).beginPath().arc(cx - 26, cy - 2, 14, -1.2, 1.2).strokePath();
    g.lineStyle(1, 0xe7e1c8, 1).lineBetween(cx - 26 + 14 * Math.cos(-1.2), cy - 2 + 14 * Math.sin(-1.2), cx - 26 + 14 * Math.cos(1.2), cy - 2 + 14 * Math.sin(1.2));
  },
  building_spirit_lodge: (g, w, h) => {
    // A pale lodge with a ring of blue-white sky marks above the door and a drifting smoke curl.
    lodgeBody(g, w, h, 0x8a8f9c, 0x6c7284, 0xb7bcc9);
    const cx = w / 2;
    const cy = h * 0.75;
    g.lineStyle(2, 0xcfe2f3, 1).strokeCircle(cx, cy - 34, 10).strokeCircle(cx, cy - 34, 5);
    g.fillStyle(0xf2f6fb, 1).fillCircle(cx, cy - 34, 2);
    g.lineStyle(2, 0xe7e1c8, 0.8).beginPath().arc(cx + 22, cy - 52, 9, 0.5, 3.6).strokePath();
  },
  building_trap: (g, w, h) => {
    // A snare: a bent sapling holding a rope loop over a pit of sticks, on one tile.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 1, cy + 1, 34, 14);
    g.fillStyle(0x6a5a3a, 1).fillPoints([p(cx, cy - 9), p(cx + 18, cy), p(cx, cy + 9), p(cx - 18, cy)], true);
    g.lineStyle(2, 0x5a3b22, 1);
    for (const dx of [-9, -3, 3, 9]) g.lineBetween(cx + dx, cy - 2, cx + dx * 0.6, cy + 3);
    g.lineStyle(2, 0x4a3624, 1).beginPath().arc(cx - 12, cy - 4, 14, -1.3, 0.2).strokePath();
    g.lineStyle(2, 0xc9a56e, 1).strokeEllipse(cx + 2, cy - 1, 18, 8);
  },
  building_fire_pit: (g, w, h) => {
    // A ring of stones round glowing embers and a few logs, on one tile.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 1, cy + 2, 36, 14);
    g.fillStyle(0x3a2a20, 1).fillEllipse(cx, cy, 28, 13);
    g.fillStyle(0xe8601c, 1).fillEllipse(cx, cy, 18, 8);
    g.fillStyle(0xf6a53a, 1).fillEllipse(cx, cy - 1, 10, 4);
    g.fillStyle(0x8c8c84, 1);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(a) * 15, cy + Math.sin(a) * 7, 3);
    }
    g.fillStyle(0xe8601c, 1).fillTriangle(cx, cy - 20, cx - 6, cy - 2, cx + 6, cy - 2);
    g.fillStyle(0xfbe08a, 1).fillTriangle(cx, cy - 12, cx - 3, cy - 2, cx + 3, cy - 2);
  },
  building_barricade: (g, w, h) => {
    // Sharpened stakes leaning out of a low earth bank, on one tile.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 1, cy + 2, 38, 14);
    g.fillStyle(0x6a5232, 1).fillPoints([p(cx, cy - 8), p(cx + 18, cy + 1), p(cx, cy + 10), p(cx - 18, cy + 1)], true);
    for (const dx of [-12, -6, 0, 6, 12]) {
      const base = cy + 2 - Math.abs(dx) * 0.2;
      g.fillStyle(0x8a6a3e, 1).fillTriangle(cx + dx - 3, base, cx + dx + 3, base, cx + dx + 5, base - 22);
      g.fillStyle(0xe7d3a8, 1).fillTriangle(cx + dx + 3, base - 16, cx + dx + 5, base - 22, cx + dx + 2, base - 15);
    }
    g.lineStyle(2, 0x4a3624, 1).lineBetween(cx - 16, cy - 6, cx + 16, cy - 6);
  },
  building_store_open: (g, w, h) => {
    // The store's cutaway: bare earth floor, the two back walls seen from inside, only low rims in front.
    const cx = w / 2;
    const cy = h * 0.75;
    shadow(g, cx + 8, cy + 4, 110, 44);
    const hw = 40;
    const hh = 20;
    const rise = 30;
    g.fillStyle(0x5a4630, 1).fillPoints([p(cx, cy - hh), p(cx + hw, cy), p(cx, cy + hh), p(cx - hw, cy)], true);
    g.fillStyle(0x6f5234, 1).fillPoints([p(cx - hw, cy), p(cx, cy - hh), p(cx, cy - hh - rise), p(cx - hw, cy - rise)], true);
    g.fillStyle(0x8a6a44, 1).fillPoints([p(cx + hw, cy), p(cx, cy - hh), p(cx, cy - hh - rise), p(cx + hw, cy - rise)], true);
    g.lineStyle(1, 0x4a3624, 1).strokePoints([p(cx - hw, cy - rise), p(cx, cy - hh - rise), p(cx + hw, cy - rise)], false);
    g.fillStyle(0x8a6a44, 1).fillPoints([p(cx - hw, cy), p(cx, cy + hh), p(cx, cy + hh - 6), p(cx - hw, cy - 6)], true);
    g.fillStyle(0x6f5234, 1).fillPoints([p(cx + hw, cy), p(cx, cy + hh), p(cx, cy + hh - 6), p(cx + hw, cy - 6)], true);
  },
  icon_food: (g) => {
    // A haunch: a red-brown joint with a pale bone sticking out.
    g.fillStyle(0xe7e1c8, 1).fillRect(20, 6, 4, 12).fillCircle(20, 6, 3.5).fillCircle(24, 6, 3.5);
    g.fillStyle(0xa8392f, 1).fillEllipse(14, 20, 22, 18);
    g.fillStyle(0xc9594a, 1).fillEllipse(11, 17, 10, 7);
  },
  icon_wood: (g) => {
    // Two logs side by side and one on top, with pale cut ends.
    for (const [x, y] of [[9, 22], [23, 22], [16, 10]]) {
      g.fillStyle(0x7a5a3a, 1).fillRect(x - 8, y - 5, 16, 10);
      g.fillStyle(0xd9b98a, 1).fillCircle(x + 8, y, 5);
      g.lineStyle(1, 0x7a5a3a, 1).strokeCircle(x + 8, y, 2.5);
    }
  },
  icon_hides: (g) => {
    // A folded hide: a tan sheet with a darker fold and curled corners.
    g.fillStyle(0xc9a56e, 1).fillPoints([p(5, 9), p(27, 6), p(28, 25), p(4, 26)], true);
    g.fillStyle(0xa8854f, 1).fillPoints([p(5, 17), p(28, 15), p(28, 25), p(4, 26)], true);
    g.lineStyle(1, 0x6f5234, 1).strokePoints([p(5, 9), p(27, 6), p(28, 25), p(4, 26)], true);
    g.fillStyle(0xe6d3a3, 1).fillCircle(8, 12, 2.5).fillCircle(24, 10, 2.5);
  },
  icon_pemmican: (g) => {
    // A dark red-brown cake with pale berry flecks.
    g.fillStyle(0x5e3326, 1).fillRoundedRect(3, 9, 26, 16, 4);
    g.fillStyle(0x7e4632, 1).fillRoundedRect(3, 9, 26, 7, 4);
    g.fillStyle(0xe0c28a, 1);
    for (const [x, y] of [[9, 14], [16, 19], [22, 13], [24, 21], [11, 22]]) g.fillCircle(x, y, 1.8);
  },
  icon_gift: (g) => {
    // A hide bundle tied with a red band.
    g.fillStyle(0xc9a56e, 1).fillEllipse(16, 19, 24, 20);
    g.fillStyle(0xe6d3a3, 1).fillEllipse(12, 15, 10, 6);
    g.fillStyle(0xb9473c, 1).fillRect(13, 9, 6, 20);
    g.fillStyle(0xb9473c, 1).fillCircle(16, 9, 4);
    g.fillStyle(0x8a2f26, 1).fillCircle(16, 9, 1.8);
  },
  icon_horses: (g) => {
    // A horse's head in profile: brown neck and muzzle, a dark mane and a pale eye.
    g.fillStyle(0x8a5a36, 1).fillPoints([p(8, 28), p(11, 10), p(19, 4), p(26, 10), p(29, 21), p(24, 24), p(22, 17), p(18, 28)], true);
    g.fillStyle(0xa8794a, 1).fillPoints([p(19, 4), p(26, 10), p(29, 21), p(24, 24), p(22, 17)], true);
    g.fillStyle(0x3a2616, 1).fillPoints([p(11, 10), p(19, 4), p(17, 9), p(13, 18), p(8, 28)], true);
    g.fillStyle(0xe7e1c8, 1).fillCircle(22, 11, 1.6);
  },
  fire_central: (g, w, h) => {
    const cx = w / 2;
    shadow(g, cx + 2, h - 6, 40, 14);
    g.fillStyle(0xf6a53a, 0.25).fillCircle(cx, h - 18, 18);
    g.fillStyle(0x8c8c84, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(a) * 14, h - 8 + Math.sin(a) * 6, 4);
    }
    g.fillStyle(0x5a3b22, 1).fillRect(cx - 9, h - 12, 18, 5);
    g.fillStyle(0xe8601c, 1).fillTriangle(cx, h - 34, cx - 10, h - 9, cx + 10, h - 9);
    g.fillStyle(0xf6a53a, 1).fillTriangle(cx + 1, h - 28, cx - 6, h - 9, cx + 7, h - 9);
    g.fillStyle(0xfbe08a, 1).fillTriangle(cx, h - 20, cx - 3, h - 9, cx + 4, h - 9);
  },
};

/** The common lodge body for the societies: two walls, a roof and a door, on the 2x2 footprint. */
function lodgeBody(g: G, w: number, h: number, left: number, right: number, roof: number): void {
  const cx = w / 2 - 6;
  const cy = h * 0.75;
  shadow(g, cx + 10, cy + 4, 104, 40);
  const hw = 34;
  const hh = 17;
  const rise = 24;
  g.fillStyle(left, 1).fillPoints([p(cx - hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx - hw, cy - rise)], true);
  g.fillStyle(right, 1).fillPoints([p(cx + hw, cy), p(cx, cy + hh), p(cx, cy + hh - rise), p(cx + hw, cy - rise)], true);
  g.fillStyle(roof, 1).fillPoints([p(cx, cy - hh - rise - 8), p(cx + hw + 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx - hw - 4, cy - rise)], true);
  g.lineStyle(1, 0x4a3624, 1).strokePoints([p(cx - hw - 4, cy - rise), p(cx, cy + hh - rise + 4), p(cx + hw + 4, cy - rise)], false);
  g.fillStyle(0x4a3624, 1).fillRect(cx + 6, cy - 4, 10, 12);
}

function p(x: number, y: number): Phaser.Types.Math.Vector2Like {
  return { x, y };
}

function shadow(g: G, x: number, y: number, w: number, h: number): void {
  g.fillStyle(0x2b3a4a, 0.28).fillEllipse(x, y, w, h);
}

/** A 64x32 diamond, drawn slightly oversize so neighbouring tiles leave no seams. */
function ground(g: G, w: number, h: number, base: number, speckles: number[], edge: number): void {
  const diamond = [p(w / 2, -0.5), p(w + 0.5, h / 2), p(w / 2, h + 0.5), p(-0.5, h / 2)];
  g.fillStyle(base, 1).fillPoints(diamond, true);
  g.lineStyle(1, edge, 0.35).strokePoints([p(2, h / 2), p(w / 2, h - 1), p(w - 2, h / 2)], false);
  const spots = [[20, 15], [30, 8], [42, 13], [26, 23], [38, 22], [14, 17], [48, 17], [32, 16]];
  spots.forEach(([x, y], i) => {
    g.fillStyle(speckles[i % speckles.length], 0.9).fillRect(x, y, 2, 1);
  });
}

/** Where the n items of a pile sit on its 32 x 24 canvas (a small heap: a row on the ground and one on top). */
const HEAP: [number, number][][] = [
  [],
  [[16, 19]],
  [[11, 19], [21, 19]],
  [[10, 19], [22, 19], [16, 11]],
  [[7, 19], [16, 19], [25, 19], [16, 11]],
];

/** One pile per stored resource, 1-4 items: the open store (R2) shows these inside. */
for (const res of ['food', 'wood', 'hides', 'pemmican'] as const) {
  for (let n = 1; n <= 4; n++) {
    DRAW[`pile_${res}_${n}`] = (g) => {
      if (res === 'hides') {
        // Hides lie flat, one on another.
        for (let i = 0; i < n; i++) {
          g.fillStyle(i % 2 ? 0xc9a56e : 0xb8935a, 1).fillRect(7, 20 - i * 5, 18, 5);
          g.fillStyle(0xe6d3a3, 1).fillRect(7, 20 - i * 5, 18, 1);
        }
        return;
      }
      for (const [x, y] of HEAP[n]) {
        if (res === 'food') {
          g.fillStyle(0xa8392f, 1).fillCircle(x, y, 5).fillStyle(0xc9594a, 1).fillCircle(x - 1.5, y - 1.5, 2);
        } else if (res === 'wood') {
          g.fillStyle(0x7a5a3a, 1).fillRect(x - 7, y - 3, 14, 6).fillStyle(0xd9b98a, 1).fillCircle(x + 7, y, 3);
        } else {
          g.fillStyle(0x5e3326, 1).fillRoundedRect(x - 5, y - 3, 10, 6, 2).fillStyle(0xe0c28a, 1).fillCircle(x - 1, y, 1);
        }
      }
    };
  }
}

/** Draws a texture for every manifest key that has none yet. */
export function ensureTextures(scene: Phaser.Scene): void {
  for (const [key, e] of Object.entries(manifest)) {
    if (scene.textures.exists(key)) continue;
    const draw = DRAW[key];
    if (!draw) throw new Error(`No placeholder drawn for art key ${key}`);
    // People also get a second-family texture, `<key>__b` (blue shirt); the family index picks it.
    const variants = key.startsWith('person_') ? [0, 1] : [0];
    for (const v of variants) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      draw(g, e.size[0], e.size[1], v);
      g.generateTexture(v ? `${key}__b` : key, e.size[0], e.size[1]);
      g.destroy();
    }
  }
}
