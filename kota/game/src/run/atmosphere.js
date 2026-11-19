// Light and life for an arena (not shown in "light" quality): a dawn or dusk wash with a vignette over the screen,
// grass and reeds swaying, dust and seeds drifting, fireflies on the lakeshore. Visual only: it never touches the game.

import { ensureGlow } from '../camp/backdrop.js';

const SWAY_LIMIT = 40;           // props that sway at once (each is a small tween)
const MOTES = 26;

export class Atmosphere {
  /** @param place the Place; `place.def.light` is 'dawn' or 'dusk', `place.swayers` the props that bend. */
  constructor(scene, place) {
    this.scene = scene; this.place = place; this.t = 0;
    this.light = document.getElementById('light');
    this.light.className = place.def.light ?? 'dawn';
    this.light.style.display = 'block';
    ensureGlow(scene);

    // Sway: a slow, small rocking of grass and reeds, each out of step with the others.
    this.tweens = [];
    for (const img of place.swayers.slice(0, SWAY_LIMIT)) {
      const lean = Phaser.Math.FloatBetween(2.5, 5);
      img.angle = -lean;
      this.tweens.push(scene.tweens.add({ targets: img, angle: lean, duration: Phaser.Math.Between(1500, 2600), delay: Phaser.Math.Between(0, 1500),
        ease: 'Sine.easeInOut', yoyo: true, repeat: -1 }));
    }

    // Dust and seeds: small pale specks that drift across the view, wrapped around the camera.
    this.motes = [];
    for (let i = 0; i < MOTES; i++) {
      const obj = scene.add.image(0, 0, 'glow').setDepth(28).setBlendMode(Phaser.BlendModes.ADD).setScale(Phaser.Math.FloatBetween(0.05, 0.1)).setTint(0xf4dcae);
      this.motes.push({ obj, ox: Phaser.Math.FloatBetween(-1, 1), oy: Phaser.Math.FloatBetween(-1, 1), vx: Phaser.Math.FloatBetween(0.01, 0.04), vy: Phaser.Math.FloatBetween(-0.01, 0.01), ph: Math.random() * 6.28 });
    }

    // Fireflies: only where there is water.
    this.flies = [];
    if (place.twist.kind === 'water') {
      const [AW] = scene.arena, rand = new Phaser.Math.RandomDataGenerator(['kota-fireflies']);
      for (let i = 0; i < 16; i++) {
        const obj = scene.add.image(0, 0, 'glow').setDepth(27).setBlendMode(Phaser.BlendModes.ADD).setScale(0.16).setTint(0xe6f08a);
        this.flies.push({ obj, bx: rand.between(80, AW - 80), by: rand.between(200, 760), a: rand.realInRange(0.3, 0.8), b: rand.realInRange(0.3, 0.7), ph: rand.realInRange(0, 6.28), c: rand.realInRange(0.6, 1.4) });
      }
    }
  }

  update(dt) {
    this.t += dt;
    const cam = this.scene.cameras.main, mid = cam.midPoint, w = cam.width / cam.zoom, h = cam.height / cam.zoom;
    for (const m of this.motes) {
      m.ox += m.vx * dt; m.oy += m.vy * dt;
      if (m.ox > 0.6) m.ox = -0.6; if (m.oy > 0.6) m.oy = -0.6; if (m.oy < -0.6) m.oy = 0.6;
      m.obj.setPosition(mid.x + m.ox * w, mid.y + m.oy * h).setAlpha(0.25 + 0.3 * Math.abs(Math.sin(this.t * 0.8 + m.ph)));
    }
    for (const f of this.flies) {
      f.obj.setPosition(f.bx + Math.sin(this.t * f.a + f.ph) * 46, f.by + Math.cos(this.t * f.b + f.ph) * 30)
        .setAlpha(0.1 + 0.9 * Math.max(0, Math.sin(this.t * f.c + f.ph)) ** 2);
    }
  }

  destroy() {
    this.light.style.display = 'none';
    for (const tw of this.tweens) tw.stop();
    for (const o of [...this.motes, ...this.flies]) o.obj.destroy();
    this.motes = []; this.flies = []; this.tweens = [];
  }
}
