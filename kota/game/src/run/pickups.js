// Pickups (DESIGN-m1.md sections 6 and 7): embers (one ember = 1 experience + 1 money) and food (heals).
// Embers are drawn to the hero inside the Reach radius; when a wave ends every ember flies to the hero.
// Food is only picked up by walking over it.

const FLY_SPEED = 380;
const COLLECT = 24;

export class Pickups {
  constructor(scene) {
    this.scene = scene;
    this.embers = [];
    this.foods = [];
  }

  dropEmbers(x, y, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 22;
      const ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      const sprite = this.scene.add.image(ex, ey, 'ember').setDepth(4);
      this.embers.push({ sprite, x: ex, y: ey, fly: false, speed: 0 });
    }
    if (count > 0) this.scene.app.hints.trigger('embers');
  }

  dropFood(x, y) {
    const sprite = this.scene.add.image(x, y, 'food').setDepth(4);
    this.foods.push({ sprite, x, y });
    this.scene.app.hints.trigger('food');
  }

  /** Every ember still on the ground flies to the hero (end of a wave). */
  flyAll() { for (const e of this.embers) e.fly = true; }

  /** A burrowing threat eats what lies within `radius` of (x, y); returns how many of each it took. */
  swallowNear(x, y, radius) {
    let embers = 0, foods = 0;
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      if (Math.hypot(e.x - x, e.y - y) < radius) { e.sprite.destroy(); this.embers.splice(i, 1); embers++; }
    }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (Math.hypot(f.x - x, f.y - y) < radius) { f.sprite.destroy(); this.foods.splice(i, 1); foods++; }
    }
    return { embers, foods };
  }

  update(dt) {
    const s = this.scene, hero = s.hero;
    const reach = s.rules.pickup.baseReach + s.stats.pickupRange;
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      const dx = hero.x - e.x, dy = hero.y - e.y, d = Math.hypot(dx, dy);
      if (d < COLLECT) { e.sprite.destroy(); this.embers.splice(i, 1); s.gainEmbers(1); continue; }
      if (d < reach) e.fly = true;
      if (e.fly) {
        e.speed = Math.min(FLY_SPEED, e.speed + 900 * dt);
        e.x += (dx / d) * e.speed * dt; e.y += (dy / d) * e.speed * dt;
        e.sprite.setPosition(e.x, e.y);
      }
    }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (Math.hypot(hero.x - f.x, hero.y - f.y) < COLLECT + 6) {
        f.sprite.destroy(); this.foods.splice(i, 1); s.eatFood();
      }
    }
  }

  clear() {
    for (const e of this.embers) e.sprite.destroy();
    for (const f of this.foods) f.sprite.destroy();
    this.embers.length = 0; this.foods.length = 0;
  }
}
