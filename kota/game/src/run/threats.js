// Threats (DESIGN-m1.md section 6): the five behaviours (chaser, cluster, ranged, burrower) as data-driven code.
// Stats come from data/threats.json and grow each wave. Weapons (plan task C3) call damage(); bosses come in C5.

const HERO_R = 20;
const MARK_TIME = 0.8;          // spawn marks show this long before a threat appears
const CONTACT_GAP = 0.8;        // one threat can hurt the hero at most this often

export class Threats {
  constructor(scene, defs) {
    this.scene = scene;
    this.defs = defs;
    this.list = [];
    this.marks = [];
    this.shards = [];
    this.gfx = scene.add.graphics().setDepth(8);     // spawn marks, aim lines, rings (redrawn every step)
    this.clock = 0;
  }

  /** Threats on screen plus those about to appear (for the cap). */
  get count() { return this.list.length + this.marks.length; }

  /** Queue a spawn: a mark shows where, and the threat (or cluster) appears after MARK_TIME. */
  queue(id, x, y, wave) { this.marks.push({ id, x, y, wave, t: MARK_TIME }); }

  spawnNow(id, x, y, wave) {
    const def = this.defs[id];
    const n = def.cluster ?? 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = n > 1 ? Math.random() * 40 : 0;
      this.create(id, def, x + Math.cos(a) * r, y + Math.sin(a) * r, wave);
    }
  }

  create(id, def, x, y, wave) {
    const sprite = this.scene.add.image(x, y, `threat_${id}`);
    const hp = def.hp[0] + def.hp[1] * (wave - 1);
    const t = {
      id, def, sprite, x, y, hp, maxHp: hp, r: def.size,
      damage: Math.max(1, Math.round(def.damage[0] + def.damage[1] * (wave - 1))),
      hitCd: 0, phase: Math.random() * 6, state: 'move', t: 0, cd: 1 + Math.random(),
      swallowed: { embers: 0, foods: 0 }, aim: null, hittable: true,
    };
    if (def.behaviour === 'burrower') { t.state = 'under'; t.t = def.under; t.hittable = false; sprite.setVisible(false); }
    this.list.push(t);
    return t;
  }

  update(dt) {
    const s = this.scene, hero = s.hero;
    this.clock += dt;
    const g = this.gfx;
    g.clear();

    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      m.t -= dt;
      const k = 1 - Math.max(0, m.t) / MARK_TIME;
      g.lineStyle(3, 0xd9d2c0, 0.25 + 0.5 * k); g.strokeCircle(m.x, m.y, 26 - 8 * k);
      if (m.t <= 0) { this.marks.splice(i, 1); this.spawnNow(m.id, m.x, m.y, m.wave); }
    }

    for (const t of this.list.slice()) {
      if (t.burn) {
        t.burn.time -= dt; t.burn.tick -= dt;
        if (t.burn.tick <= 0) { t.burn.tick += 0.5; this.damage(t, t.burn.dps * 0.5, { burn: true }); }
        if (t.burn.time <= 0) t.burn = null;
        if (!this.list.includes(t)) continue;                     // the burn finished it
      }
      t.hitCd = Math.max(0, t.hitCd - dt);
      const b = t.def.behaviour;
      if (b === 'chaser') this.chase(t, dt);
      else if (b === 'ranged') this.ranged(t, dt);
      else if (b === 'burrower') this.burrow(t, dt);
      t.x = Math.min(Math.max(t.x, 20), s.arena[0] - 20);
      t.y = Math.min(Math.max(t.y, 20), s.arena[1] - 20);
    }

    // Soft separation so groups do not stack on one spot.
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      if (a.state === 'under' || a.state === 'ring') continue;
      for (let j = i + 1; j < L.length; j++) {
        const c = L[j];
        if (c.state === 'under' || c.state === 'ring') continue;
        const dx = c.x - a.x, dy = c.y - a.y, min = (a.r + c.r) * 0.9, d2 = dx * dx + dy * dy;
        if (d2 > 0.01 && d2 < min * min) {
          const d = Math.sqrt(d2), push = (min - d) / 2 / d;
          a.x -= dx * push; a.y -= dy * push; c.x += dx * push; c.y += dy * push;
        }
      }
    }

    for (const t of L) {
      const wob = 1 + 0.06 * Math.sin(this.clock * 6 + t.phase);
      t.sprite.setPosition(t.x, t.y).setScale(wob, 2 - wob).setDepth(10 + t.y / s.arena[1]);
      if (t.flash > 0) { t.flash -= dt; t.sprite.setTintFill(0xffffff); } else if (t.burn) t.sprite.setTint(0xffb070); else t.sprite.clearTint();
    }

    this.updateShards(dt);
  }

  toward(t, dt, speedMul = 1, away = false) {
    const hero = this.scene.hero;
    const dx = hero.x - t.x, dy = hero.y - t.y, d = Math.hypot(dx, dy) || 1;
    const sgn = away ? -1 : 1, sp = t.def.speed * speedMul * dt;
    t.x += (dx / d) * sp * sgn; t.y += (dy / d) * sp * sgn;
    return d;
  }

  contact(t) {
    if (t.def.contact === false || t.hitCd > 0) return;
    const hero = this.scene.hero;
    if (Math.hypot(hero.x - t.x, hero.y - t.y) < t.r + HERO_R) {
      if (this.scene.damageHero(t.damage, t.def.onHit)) t.hitCd = CONTACT_GAP;
    }
  }

  chase(t, dt) { this.toward(t, dt); this.contact(t); }

  ranged(t, dt) {
    const s = this.scene, hero = s.hero, def = t.def;
    const dist = Math.hypot(hero.x - t.x, hero.y - t.y);
    if (t.state === 'move') {
      if (dist > def.keep[1]) this.toward(t, dt);
      else if (dist < def.keep[0]) this.toward(t, dt, 1, true);
      t.cd -= dt;
      if (t.cd <= 0 && dist < def.keep[1] + 60) { t.state = 'wind'; t.t = def.windup; t.aim = Math.atan2(hero.y - t.y, hero.x - t.x); }
    } else {
      t.t -= dt;
      if (t.t > 0.2) t.aim = Math.atan2(hero.y - t.y, hero.x - t.x);     // the aim locks for the last moment
      this.gfx.lineStyle(2, 0x9fd3e6, 0.7);
      this.gfx.lineBetween(t.x, t.y, t.x + Math.cos(t.aim) * 200, t.y + Math.sin(t.aim) * 200);
      if (t.t <= 0) {
        if (this.shards.length < s.rules.caps.projectiles) {
          const sh = def.shard;
          const sprite = s.add.image(t.x, t.y, 'shard').setRotation(t.aim).setDepth(9);
          this.shards.push({ sprite, x: t.x, y: t.y, vx: Math.cos(t.aim) * sh.speed, vy: Math.sin(t.aim) * sh.speed, life: sh.life, r: sh.radius, damage: t.damage });
        }
        t.state = 'move'; t.cd = def.interval;
      }
    }
  }

  burrow(t, dt) {
    const s = this.scene, hero = s.hero, def = t.def;
    t.t -= dt;
    if (t.state === 'under') {
      this.toward(t, dt);
      const took = s.pickups.swallowNear(t.x, t.y, def.swallowRadius);
      t.swallowed.embers += took.embers; t.swallowed.foods += took.foods;
      this.gfx.lineStyle(2, 0x6e5a82, 0.6); this.gfx.strokeCircle(t.x, t.y, 12 + 3 * Math.sin(this.clock * 10));
      if (t.t <= 0) { t.state = 'ring'; t.t = def.ring; t.x = hero.x; t.y = hero.y; }       // surfaces where the hero stands now
    } else if (t.state === 'ring') {
      const k = 1 - Math.max(0, t.t) / def.ring;
      this.gfx.lineStyle(3, 0x8a6aa8, 0.4 + 0.5 * k); this.gfx.strokeCircle(t.x, t.y, def.ringRadius * (0.5 + 0.5 * k));
      if (t.t <= 0) {
        if (Math.hypot(hero.x - t.x, hero.y - t.y) < def.ringRadius + HERO_R) s.damageHero(t.damage, def.onHit);
        t.state = 'up'; t.t = def.up; t.hittable = true; t.sprite.setVisible(true);
      }
    } else if (t.t <= 0) {          // 'up': sinks again
      t.state = 'under'; t.t = def.under; t.hittable = false; t.sprite.setVisible(false);
    }
  }

  updateShards(dt) {
    const s = this.scene, hero = s.hero;
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      sh.life -= dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      sh.sprite.setPosition(sh.x, sh.y);
      const hit = Math.hypot(hero.x - sh.x, hero.y - sh.y) < sh.r + HERO_R - 4 && s.damageHero(sh.damage, null);
      const out = sh.x < 0 || sh.y < 0 || sh.x > s.arena[0] || sh.y > s.arena[1];
      if (hit || out || sh.life <= 0) { sh.sprite.destroy(); this.shards.splice(i, 1); }
    }
  }

  /**
   * A weapon, ability or burn hit. A burrowed threat cannot be hit. `opts`: crit (bigger gold number),
   * knock { x, y, px } (pushed px away from the point), burn (a tick: no knock, quieter number).
   */
  damage(t, amount, opts = {}) {
    if (!t.hittable) return false;
    t.hp -= amount;
    t.flash = 0.08;
    const color = opts.crit ? '#ffd34a' : opts.burn ? '#f2a64a' : '#fff4e1';
    this.scene.floatText(t.x, t.y - t.r, String(Math.round(amount)), color);
    if (opts.knock && !t.def.boss) {
      const dx = t.x - opts.knock.x, dy = t.y - opts.knock.y, d = Math.hypot(dx, dy) || 1;
      t.x += (dx / d) * opts.knock.px; t.y += (dy / d) * opts.knock.px;
    }
    if (t.hp <= 0) this.kill(t);
    return true;
  }

  /** Set a threat burning: `dps` damage per second for `time` seconds (ticks every 0.5 s); a new burn refreshes it. */
  applyBurn(t, dps, time) {
    if (t.burn) { t.burn.dps = Math.max(t.burn.dps, dps); t.burn.time = Math.max(t.burn.time, time); }
    else t.burn = { dps, time, tick: 0.5 };
  }

  kill(t) {
    const s = this.scene, i = this.list.indexOf(t);
    if (i < 0) return;
    this.list.splice(i, 1);
    t.sprite.destroy();
    const def = t.def;
    const embers = (def.valueChance == null || Math.random() < def.valueChance) ? def.value : 0;
    s.pickups.dropEmbers(t.x, t.y, embers + t.swallowed.embers);            // a gnawing hollow releases what it swallowed
    const foodChance = s.rules.food.chance + s.stats.luck / 1000;
    for (let k = 0; k < t.swallowed.foods; k++) s.pickups.dropFood(t.x + (k + 1) * 14, t.y);
    if (Math.random() < foodChance) s.pickups.dropFood(t.x, t.y);
    s.onThreatKilled?.(t);
  }

  killAll() { for (const t of this.list.slice()) this.kill(t); this.marks.length = 0; }

  /** Remove every threat, mark and shard without drops (wave end, leaving the run). */
  clear() {
    for (const t of this.list) t.sprite.destroy();
    for (const sh of this.shards) sh.sprite.destroy();
    this.list.length = 0; this.shards.length = 0; this.marks.length = 0;
    this.gfx.clear();
  }
}
