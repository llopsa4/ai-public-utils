// The place a run happens in (DESIGN-m1.md section 12): ground, decoration and the place's twist.
//   wind  (prairie):   every `every` s a gust of `time` s pushes the hero and the threats `push` px/s one way; an
//                      arrow shows the direction `warn` s before.
//   water (lakeshore): inside `rect` walkers move x `mul`; fliers (wisps, sleet spirits) and long snowshoes ignore it.
// Bosses are not slowed by water. The arena is bounded by rules.arena; `scene.arena` holds its size.

export class Place {
  constructor(scene, def) {
    this.scene = scene; this.def = def; this.twist = def.twist;
    const [AW, AH] = scene.arena;
    scene.add.tileSprite(0, 0, AW, AH, def.ground).setOrigin(0).setDepth(0);
    if (this.twist.kind === 'water') {
      const [x, y, w, h] = this.twist.rect;
      scene.add.rectangle(x, y, w, h, 0x3d6f86, 0.45).setOrigin(0).setDepth(0.5);
      scene.add.rectangle(x, y + h, w, 4, 0xa9cfdc, 0.5).setOrigin(0, 0.5).setDepth(0.5);   // the shoreline
    }
    this.scatter(def);
    scene.add.rectangle(AW / 2, AH / 2, AW - 6, AH - 6).setStrokeStyle(6, 0x3a3528, 0.9).setDepth(1);
    this.gfx = scene.add.graphics().setDepth(29);
    this.clock = 0; this.gust = null; this.warned = false;
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
        s.add.image(x, y, p.tex).setDepth(2 + y / AH);
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
