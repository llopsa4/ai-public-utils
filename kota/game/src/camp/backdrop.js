// The camp backdrop, drawn in code behind the camp menus: a night sky over the river valley, hills, a ring of
// teepees around a fire (teepee dwellings: CULTURE.md, Zitkala-Sa's stories). Nothing sacred is shown: no pipe,
// no regalia, no ceremony. It redraws when the window size changes. "light" quality drops the twinkle and the sparks.

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => {
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t)), g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  return (r << 16) | (g << 8) | Math.round(lerp(c1 & 255, c2 & 255, t));
};

/** Makes the soft round glow texture used for firelight (once). */
export function ensureGlow(scene) {
  if (scene.textures.exists('glow')) return;
  const tex = scene.textures.createCanvas('glow', 128, 128), c = tex.getContext();
  const grad = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,210,140,1)'); grad.addColorStop(0.35, 'rgba(255,150,70,0.45)'); grad.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = grad; c.fillRect(0, 0, 128, 128);
  tex.refresh();
}

export class CampBackdrop {
  constructor(scene, quality) {
    this.scene = scene; this.low = quality === 'low';
    ensureGlow(scene);
    this.back = scene.add.graphics().setDepth(0);
    this.fireGfx = scene.add.graphics().setDepth(3);
    this.glow = scene.add.image(0, 0, 'glow').setDepth(2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
    this.sparks = []; this.smoke = []; this.stars = []; this.t = 0; this.fireStep = 0;
    this.layout();
    this.onResize = () => this.layout();
    scene.scale.on('resize', this.onResize);
    scene.events.once('shutdown', () => this.destroy());
  }

  destroy() {
    this.scene.scale.off('resize', this.onResize);
    for (const s of [...this.sparks, ...this.smoke]) s.obj.destroy();
    this.sparks = []; this.smoke = [];
  }

  layout() {
    const sc = this.scene, W = sc.scale.width, H = sc.scale.height, g = this.back;
    this.W = W; this.H = H;
    g.clear();
    const horizon = H * 0.6;
    // Sky: deep night blue to a faint ember-coloured horizon.
    const strips = 40;
    for (let i = 0; i < strips; i++) {
      const t = i / (strips - 1);
      g.fillStyle(t < 0.7 ? mix(0x0b1022, 0x2a2748, t / 0.7) : mix(0x2a2748, 0x8a4a36, (t - 0.7) / 0.3), 1);
      g.fillRect(0, (horizon * i) / strips, W, horizon / strips + 1);
    }
    // Stars (fixed seed so the sky is always the same).
    const rand = new Phaser.Math.RandomDataGenerator(['kota-camp-sky']);
    this.starPos = [];
    for (let i = 0; i < 90; i++) {
      const x = rand.between(0, W), y = rand.between(0, Math.floor(horizon * 0.8)), r = rand.pick([1, 1, 1, 1.6]);
      this.starPos.push({ x, y, r, a: rand.realInRange(0.3, 0.9) });
      g.fillStyle(0xf4efe0, this.starPos[i].a); g.fillCircle(x, y, r);
    }
    // A thin crescent moon.
    g.fillStyle(0xf1ead2, 0.9); g.fillCircle(W * 0.82, H * 0.14, Math.max(8, H * 0.03));
    g.fillStyle(0x1a1c36, 1); g.fillCircle(W * 0.82 + Math.max(3, H * 0.012), H * 0.14 - 2, Math.max(7, H * 0.027));
    // Hills: three layers, far to near.
    const ridge = (base, amp, f1, f2, ph, color) => {
      g.fillStyle(color, 1);
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, base + Math.sin(x * f1 + ph) * amp + Math.sin(x * f2 + ph * 2) * amp * 0.5);
      g.lineTo(W, H); g.closePath(); g.fillPath();
    };
    ridge(horizon - 4, H * 0.035, 0.006, 0.017, 0.5, 0x241f38);
    ridge(horizon + H * 0.04, H * 0.03, 0.009, 0.021, 2.1, 0x1b1729);
    // Ground: warm near the fire, dark at the edges.
    ridge(horizon + H * 0.1, H * 0.012, 0.012, 0.03, 4, 0x15110d);
    g.fillStyle(0x15110d, 1); g.fillRect(0, horizon + H * 0.12, W, H);
    // A few grass tufts on the ground.
    for (let i = 0; i < 70; i++) {
      const x = rand.between(0, W), y = rand.between(Math.floor(horizon + H * 0.14), H);
      g.lineStyle(1, 0x3a3524, 0.8);
      for (const d of [-3, 0, 3]) g.lineBetween(x, y, x + d, y - rand.between(4, 9));
    }
    // The teepee ring around the fire, back to front.
    this.fx = W * 0.5; this.fy = H * 0.8;
    const rx = W * 0.3, ry = H * 0.075, count = 7, size = Math.max(40, H * 0.2);
    const tents = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.4;
      tents.push({ x: this.fx + Math.cos(a) * rx, y: this.fy + Math.sin(a) * ry, k: 0.75 + 0.25 * ((Math.sin(a) + 1) / 2), a });
    }
    tents.sort((p, q) => p.y - q.y);
    for (const t of tents) this.teepee(g, t.x, t.y, size * t.k);
    this.glow.setPosition(this.fx, this.fy - 10).setScale((W * 0.55) / 128);
    // Stars that twinkle are separate small images; recreate them.
    for (const s of this.stars) s.destroy();
    this.stars = [];
    if (!this.low) {
      for (let i = 0; i < 14; i++) {
        const p = this.starPos[i * 6];
        this.stars.push(sc.add.circle(p.x, p.y, p.r + 0.6, 0xfff6dc, 1).setDepth(1));
      }
    }
  }

  /** One teepee: a cone of hide with poles at the top, a dark door, a plain rust and blue band at the foot. */
  teepee(g, x, y, h) {
    const w = h * 0.44;
    const toFire = x < this.fx ? 1 : -1;                         // which half faces the fire
    const warm = 0xc9945c, cool = 0x5a4638;
    const left = toFire > 0 ? warm : cool, right = toFire > 0 ? cool : warm;
    const ax = x + w * 0.04, ay = y - h;
    g.fillStyle(0x15110d, 0.55); g.fillEllipse(x, y + 2, w * 2.2, h * 0.12);            // shadow
    g.fillStyle(mix(left, 0x2a2018, 0.15), 1); g.fillTriangle(ax, ay, x - w, y, ax, y);
    g.fillStyle(mix(right, 0x2a2018, 0.15), 1); g.fillTriangle(ax, ay, ax, y, x + w, y);
    g.lineStyle(2, 0x2a1d14, 1); g.lineBetween(ax, ay, x - w, y); g.lineBetween(ax, ay, x + w, y);
    g.lineStyle(2, 0x3a281a, 1);                                                          // poles crossing above the top
    for (const d of [-0.16, -0.05, 0.07, 0.17]) g.lineBetween(ax + d * w * 0.4, ay + h * 0.05, ax + d * w * 1.1, ay - h * 0.2);
    // Foot band: plain rust, bone and blue stripes.
    const bandY = y - h * 0.1;
    g.fillStyle(0xb5532f, 0.95); g.fillRect(x - w * 0.8, bandY, w * 1.6, 3);
    g.fillStyle(0xefe4cc, 0.9); g.fillRect(x - w * 0.8, bandY + 3, w * 1.6, 2);
    g.fillStyle(0x3f6f93, 0.95); g.fillRect(x - w * 0.8, bandY + 5, w * 1.6, 3);
    // Door, with a warm glow inside.
    g.fillStyle(0x2a1a10, 1); g.fillTriangle(ax, y - h * 0.42, x - w * 0.22, y, x + w * 0.22, y);
    g.fillStyle(0xe8a050, 0.55); g.fillTriangle(ax, y - h * 0.32, x - w * 0.12, y, x + w * 0.12, y);
  }

  /** Called each frame from CampScene.update (dt in seconds). */
  update(dt) {
    this.t += dt;
    const s = this.scene, fx = this.fx, fy = this.fy, H = this.H, fg = this.fireGfx;
    const flick = 0.85 + 0.15 * Math.sin(this.t * 13) * Math.sin(this.t * 7.3);
    this.glow.setAlpha(0.65 * flick + 0.15);
    // Fire redraw (every other frame in light quality).
    this.fireStep++;
    if (!this.low || this.fireStep % 3 === 0) {
      fg.clear();
      const u = Math.max(8, H * 0.035);
      fg.fillStyle(0x3a2616, 1);                                                              // two crossed logs
      fg.fillTriangle(fx - u * 1.6, fy + 4, fx + u * 1.4, fy - 4, fx + u * 1.6, fy + 2);
      fg.fillTriangle(fx + u * 1.6, fy + 4, fx - u * 1.4, fy - 4, fx - u * 1.6, fy + 2);
      for (const [c, k, o] of [[0xc4421c, 1.15, 0], [0xf08a2a, 0.85, 1.3], [0xffd36a, 0.5, 2.6]]) {
        const hh = u * 2.4 * k * (0.8 + 0.2 * Math.sin(this.t * 11 + o) + 0.1 * Math.sin(this.t * 23 + o * 2));
        const sway = Math.sin(this.t * 6 + o) * u * 0.25;
        fg.fillStyle(c, 0.95);
        fg.fillTriangle(fx - u * 0.8 * k, fy, fx + sway, fy - hh, fx + u * 0.8 * k, fy);
      }
    }
    // Smoke and sparks.
    if (this.smoke.length < 5 && Math.random() < dt * 1.2) this.smoke.push({ obj: s.add.circle(fx, fy - 20, 6, 0x8a8478, 0.18).setDepth(3.5), vy: -22 - Math.random() * 10, life: 0 });
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i]; p.life += dt;
      p.obj.y += p.vy * dt; p.obj.x += Math.sin(p.life * 1.6) * 6 * dt; p.obj.setRadius(6 + p.life * 9); p.obj.setAlpha(Math.max(0, 0.18 - p.life * 0.04));
      if (p.life > 4) { p.obj.destroy(); this.smoke.splice(i, 1); }
    }
    if (!this.low) {
      if (this.sparks.length < 10 && Math.random() < dt * 6) this.sparks.push({ obj: s.add.circle(fx + (Math.random() - 0.5) * 16, fy - 16, 1.6, 0xffc060, 1).setDepth(3.6), vx: (Math.random() - 0.5) * 24, vy: -40 - Math.random() * 40, life: 0 });
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const p = this.sparks[i]; p.life += dt;
        p.obj.x += p.vx * dt; p.obj.y += p.vy * dt; p.obj.setAlpha(Math.max(0, 1 - p.life / 1.6));
        if (p.life > 1.6) { p.obj.destroy(); this.sparks.splice(i, 1); }
      }
      this.stars.forEach((st, i) => st.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(this.t * 0.9 + i * 1.7))));
    }
  }
}
