// The place a run happens in (DESIGN-m1.md section 12): ground, decoration and the place's twist.
//   wind  (prairie):   every `every` s a gust of `time` s pushes the hero and the threats `push` px/s one way; an
//                      arrow shows the direction `warn` s before.
//   water (lakeshore): inside `rect` walkers move x `mul`; fliers (wisps, sleet spirits) and long snowshoes ignore it.
// Bosses are not slowed by water. The arena is bounded by rules.arena; `scene.arena` holds its size.

const SWAY = new Set(['prop_grass', 'prop_flowers', 'prop_reeds', 'prop_cattail']);   // drawn with their foot on the spot

export class Place {
  constructor(scene, def) {
    this.scene = scene; this.def = def; this.twist = def.twist;
    const [AW, AH] = scene.arena;
    scene.add.tileSprite(0, 0, AW, AH, def.ground).setOrigin(0).setDepth(0);
    if (this.twist.kind === 'water') this.drawWater(this.twist.rect);
    this.swayers = [];                                                    // props that bend in the wind (atmosphere.js animates them)
    this.scatter(def);
    this.drawEdge();
    this.gfx = scene.add.graphics().setDepth(29);
    this.clock = 0; this.gust = null; this.warned = false;
  }

  /** Shallow water along the top: deeper colour away from the shore, ripples and a foamy, wavy shoreline. */
  drawWater([x, y, w, h]) {
    const s = this.scene, g = s.add.graphics().setDepth(0.5);
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);                                           // 0 = far from shore, 1 = at the shore
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(new Phaser.Display.Color(0x24, 0x4c, 0x66), new Phaser.Display.Color(0x5a, 0x96, 0xaa), 1, t);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 0.5);
      g.fillRect(x, y + (h * i) / bands, w, h / bands + 1);
    }
    const rand = new Phaser.Math.RandomDataGenerator(['kota-ripples']);
    for (let i = 0; i < 46; i++) {
      const rx = rand.between(x + 20, x + w - 20), ry = rand.between(y + 20, y + h - 30), rw = rand.between(18, 44);
      g.lineStyle(2, 0xcfe6ee, 0.22); g.beginPath(); g.moveTo(rx - rw / 2, ry);
      g.lineTo(rx - rw / 4, ry - 3); g.lineTo(rx, ry); g.lineTo(rx + rw / 4, ry - 3); g.lineTo(rx + rw / 2, ry); g.strokePath();
    }
    g.lineStyle(4, 0xe4f1f4, 0.5); g.beginPath(); g.moveTo(x, y + h);                         // the shoreline
    for (let px = x; px <= x + w; px += 12) g.lineTo(px, y + h + Math.sin(px * 0.03) * 5 + Math.sin(px * 0.11) * 2);
    g.strokePath();
    g.lineStyle(2, 0x2c566e, 0.3); g.beginPath(); g.moveTo(x, y + h + 10);
    for (let px = x; px <= x + w; px += 12) g.lineTo(px, y + h + 10 + Math.sin(px * 0.04 + 1) * 4);
    g.strokePath();
    this.water = g;
  }

  /** The arena edge: a trodden earth line and a soft dark shade inside, instead of a hard stroke. */
  drawEdge() {
    const [AW, AH] = this.scene.arena, g = this.scene.add.graphics().setDepth(1);
    for (let i = 0; i < 10; i++) {
      g.lineStyle(8, 0x0d0a07, 0.5 * (1 - i / 10) ** 2);
      g.strokeRect(4 + i * 7, 4 + i * 7, AW - 8 - i * 14, AH - 8 - i * 14);
    }
    g.lineStyle(5, 0x4a3a28, 0.95); g.strokeRect(2, 2, AW - 4, AH - 4);
  }

  /** Decoration only: no collision. Seeded by the place id so a place always looks the same. */
  scatter(def) {
    const s = this.scene, [AW, AH] = s.arena;
    const rand = new Phaser.Math.RandomDataGenerator([`kota-${def.id}`]);
    for (const p of def.props) {
      for (let i = 0; i < p.count; i++) {
        const [y0, y1] = p.y ?? [80, AH - 60];
        let x = rand.between(60, AW - 60), y = rand.between(y0, y1);
        if (Math.hypot(x - AW / 2, y - AH / 2) < 140) x += 260;         // keep the hero's start clear
        const img = s.add.image(x, y, p.tex).setDepth(2 + y / AH);
        if (SWAY.has(p.tex)) { img.setOrigin(0.5, 1); this.swayers.push(img); }
      }
    }
  }

  /** Speed factor for something standing at (x, y): water slows walkers. */
  speedMul(x, y, flier) {
    const t = this.twist;
    if (t.kind !== 'water' || flier) return 1;
    const [rx, ry, rw, rh] = t.rect;
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh ? t.mul : 1;
  }

  heroSpeedMul() {
    const s = this.scene;
    return s.special.water ? 1 : this.speedMul(s.hero.x, s.hero.y, false);
  }

  /** Advance the twist (fight phase only). */
  update(dt) {
    const t = this.twist, s = this.scene;
    this.gfx.clear();
    if (t.kind !== 'wind') return;
    this.clock += dt;
    const phase = this.clock % t.every, start = t.every - t.time;           // a gust fills the end of each cycle
    if (phase < start - t.warn) { this.gust = null; return; }
    if (!this.gust) {
      const a = Math.random() * Math.PI * 2;
      this.gust = { dx: Math.cos(a), dy: Math.sin(a) };
      s.app.hints.trigger('wind');
    }
    const blowing = phase >= start;
    const { dx, dy } = this.gust, hero = s.hero, [AW, AH] = s.arena;
    // The arrow floats above the hero: faint as a warning, bold while it blows.
    const ox = hero.x, oy = hero.y - 70, len = 60, a = Math.atan2(dy, dx);
    this.gfx.lineStyle(5, 0xe8e0cc, blowing ? 0.85 : 0.4);
    this.gfx.lineBetween(ox - dx * len / 2, oy - dy * len / 2, ox + dx * len / 2, oy + dy * len / 2);
    this.gfx.fillStyle(0xe8e0cc, blowing ? 0.85 : 0.4);
    this.gfx.fillTriangle(ox + dx * len / 2 + Math.cos(a) * 12, oy + dy * len / 2 + Math.sin(a) * 12,
      ox + dx * len / 2 + Math.cos(a + 2.4) * 10, oy + dy * len / 2 + Math.sin(a + 2.4) * 10,
      ox + dx * len / 2 + Math.cos(a - 2.4) * 10, oy + dy * len / 2 + Math.sin(a - 2.4) * 10);
    if (!blowing) return;
    const px = dx * t.push * dt, py = dy * t.push * dt;
    if (s.swallowT <= 0) { hero.x = Phaser.Math.Clamp(hero.x + px, 28, AW - 28); hero.y = Phaser.Math.Clamp(hero.y + py, 28, AH - 28); }
    for (const th of s.threats.list) {
      if (th.state === 'under') continue;                                   // burrowed threats are below the wind
      th.x += px; th.y += py;
    }
  }
}
