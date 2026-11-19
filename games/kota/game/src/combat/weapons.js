// Weapons (DESIGN-m1.md sections 2 and 4): up to six weapons hover around the hero in a ring, each aiming
// at the nearest threat in its range and firing on its own. Behaviours: swing, thrust, shoot, lob.
// Merging two identical weapons raises the tier (I-IV); the shop (plan task C4) drives add, merge and sell.

const RING_R = 44;           // distance of the hovering weapons from the hero
const FX_LIFE = 0.14;        // seconds a swing, thrust or burst picture stays on screen
const TIER_TINT = [null, 0xcfe8c8, 0xa9c9f0, 0xf0d27a];   // placeholder tier marks: II, III, IV

export class Weapons {
  constructor(scene, defs) {
    this.scene = scene;
    this.defs = Object.fromEntries(defs.map((d) => [d.id, d]));
    this.list = [];          // { id, tier, cd, sprite, aimAng, aimT, recoil }
    this.shots = [];         // arrows and lobbed embers in flight
    this.fx = [];            // short pictures of swings, thrusts and bursts
    this.gfx = scene.add.graphics().setDepth(12);
  }

  get slots() { return this.scene.rules.weaponSlots; }
  tierOf(w) { return this.defs[w.id].tiers[w.tier - 1]; }

  /* ---------- carrying, merging, selling ---------- */

  /** Add a weapon. Returns 'added', 'merged' (all slots full but an identical one rose a tier) or 'full'. */
  add(id, tier = 1) {
    if (this.list.length < this.slots) {
      this.list.push(this.makeWeapon(id, tier));
      this.afterChange();
      return 'added';
    }
    const twin = this.list.find((w) => w.id === id && w.tier === tier && tier < 4);
    if (twin) { this.setTier(twin, tier + 1); this.afterChange(); return 'merged'; }
    return 'full';
  }

  makeWeapon(id, tier) {
    const sprite = this.scene.add.image(0, 0, `weapon_${id}`).setOrigin(0.25, 0.5).setDepth(11);
    const w = { id, tier, cd: 0.3 + Math.random() * 0.4, sprite, aimAng: 0, aimT: 0, recoil: 0 };
    this.setTier(w, tier);
    return w;
  }

  setTier(w, tier) {
    w.tier = tier;
    const tint = TIER_TINT[tier - 1];
    if (tint) w.sprite.setTint(tint); else w.sprite.clearTint();
  }

  /** Index pairs of identical weapons of the same tier (below IV) that can merge. */
  pairs() {
    const out = [];
    for (let i = 0; i < this.list.length; i++) {
      for (let j = i + 1; j < this.list.length; j++) {
        const a = this.list[i], b = this.list[j];
        if (a.id === b.id && a.tier === b.tier && a.tier < 4) out.push([i, j]);
      }
    }
    return out;
  }

  /** Merge weapon j into weapon i (same id and tier): i rises a tier, j is removed. */
  merge(i, j) {
    const a = this.list[i], b = this.list[j];
    if (!a || !b || i === j || a.id !== b.id || a.tier !== b.tier || a.tier >= 4) return false;
    this.setTier(a, a.tier + 1);
    b.sprite.destroy();
    this.list.splice(j, 1);
    this.afterChange();
    return true;
  }

  /** Remove weapon i (selling it); the shop pays for it. */
  remove(i) {
    const w = this.list[i];
    if (!w) return null;
    w.sprite.destroy();
    this.list.splice(i, 1);
    this.afterChange();
    return w;
  }

  afterChange() { if (this.pairs().length) this.scene.app.hints.trigger('merge'); }

  /* ---------- numbers ---------- */

  /** Final damage of one hit (section 2): base + scaling, then Damage %, the hero's twist, then a crit roll. */
  rollDamage(w) {
    const s = this.scene.stats, def = this.defs[w.id], t = this.tierOf(w);
    let dmg = t.damage;
    for (const [stat, k] of Object.entries(def.scaling)) dmg += k * s[stat];
    dmg *= 1 + s.dmgPct / 100;
    if (def.tags.includes('ranged')) dmg *= this.scene.heroDef.rangedFinalMul ?? 1;
    const crit = Math.random() < t.crit + s.critPct / 100;
    if (crit) dmg *= t.critMul;
    return { amount: Math.max(1, Math.round(dmg)), crit };
  }

  /** Reach in px: tier range plus the Range stat (swings get half of it). */
  reach(w) {
    const def = this.defs[w.id];
    return this.tierOf(w).range + this.scene.stats.range * (def.kind === 'swing' ? 0.5 : 1);
  }

  cooldownFor(w) {
    return this.tierOf(w).cooldown / Math.max(0.5, 1 + this.scene.stats.atkSpdPct / 100);
  }

  /* ---------- each step ---------- */

  update(dt, active) {
    const hero = this.scene.hero, n = this.list.length;
    this.gfx.clear();
    this.drawFx(dt);
    for (let i = 0; i < n; i++) {
      const w = this.list[i];
      const slotAng = -Math.PI / 2 + (i * Math.PI * 2) / n;
      w.cd -= dt; w.aimT -= dt; w.recoil = Math.max(0, w.recoil - dt);
      if (active && w.cd <= 0) {
        const target = this.target(w);
        if (target) this.fire(w, target);
      }
      const ang = w.aimT > 0 ? w.aimAng : slotAng;
      const push = w.recoil > 0 ? 14 * (w.recoil / 0.12) : 0;
      w.sprite.setPosition(
        hero.x + Math.cos(slotAng) * RING_R + Math.cos(ang) * push,
        hero.y + Math.sin(slotAng) * RING_R * 0.8 + Math.sin(ang) * push);
      w.sprite.setRotation(ang).setDepth(11 + hero.y / this.scene.arena[1]);
    }
    this.updateShots(dt);
  }

  /** Nearest hittable threat inside the weapon's reach, or null. */
  target(w) {
    const hero = this.scene.hero, reach = this.reach(w);
    let best = null, bestD = Infinity;
    for (const t of this.scene.threats.list) {
      if (!t.hittable) continue;
      const d = Math.hypot(t.x - hero.x, t.y - hero.y);
      if (d - t.r <= reach && d < bestD) { best = t; bestD = d; }
    }
    return best;
  }

  fire(w, target) {
    const hero = this.scene.hero, def = this.defs[w.id], tier = this.tierOf(w);
    const ang = Math.atan2(target.y - hero.y, target.x - hero.x);
    w.cd = this.cooldownFor(w); w.aimAng = ang; w.aimT = 0.35; w.recoil = 0.12;
    const reach = this.reach(w);
    if (def.kind === 'swing') this.swing(w, def, tier, ang, reach);
    else if (def.kind === 'thrust') this.thrust(w, tier, ang, reach);
    else if (def.kind === 'shoot') this.shoot(w, tier, ang, reach);
    else if (def.kind === 'lob') this.lob(w, tier, target);
    this.scene.app.audio.swing();
  }

  hit(t, w, tier, origin) {
    const { amount, crit } = this.rollDamage(w);
    const knock = tier.knock ? { x: origin.x, y: origin.y, px: tier.knock } : null;
    this.scene.threats.damage(t, amount, { crit, knock, tags: this.defs[w.id].tags });
    const sp = this.scene.special;       // the ember stone: a hit may set the threat burning
    if (sp.burnChance && Math.random() < sp.burnChance && this.scene.threats.list.includes(t)) this.scene.threats.applyBurn(t, sp.burnDps, sp.burnTime);
  }

  swing(w, def, tier, ang, reach) {
    const hero = this.scene.hero, half = (def.arc * Math.PI) / 360;
    for (const t of this.scene.threats.list.slice()) {
      if (!t.hittable) continue;
      const d = Math.hypot(t.x - hero.x, t.y - hero.y);
      if (d - t.r > reach) continue;
      const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(t.y - hero.y, t.x - hero.x) - ang));
      if (diff <= half + Math.atan2(t.r, Math.max(d, 1))) this.hit(t, w, tier, hero);
    }
    this.fx.push({ kind: 'arc', x: hero.x, y: hero.y, ang, arc: half, r: reach, life: FX_LIFE });
  }

  thrust(w, tier, ang, reach) {
    const hero = this.scene.hero, dx = Math.cos(ang), dy = Math.sin(ang);
    for (const t of this.scene.threats.list.slice()) {
      if (!t.hittable) continue;
      const px = t.x - hero.x, py = t.y - hero.y;
      const along = px * dx + py * dy, across = Math.abs(px * dy - py * dx);
      if (along > -t.r && along <= reach + t.r && across <= t.r + 12) this.hit(t, w, tier, hero);
    }
    this.fx.push({ kind: 'line', x: hero.x, y: hero.y, ang, r: reach, life: FX_LIFE });
  }

  shoot(w, tier, ang, reach) {
    if (this.shotCount() >= this.scene.rules.caps.projectiles) return;
    const hero = this.scene.hero, sp = tier.speed;
    const sprite = this.scene.add.image(hero.x, hero.y, 'arrow').setRotation(ang).setDepth(13);
    this.shots.push({ kind: 'arrow', sprite, w, tier, x: hero.x, y: hero.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      life: (reach + 40) / sp, pierce: tier.pierce ?? 0, hitSet: new Set() });
  }

  lob(w, tier, target) {
    if (this.shotCount() >= this.scene.rules.caps.projectiles) return;
    const hero = this.scene.hero;
    const dist = Math.hypot(target.x - hero.x, target.y - hero.y);
    const sprite = this.scene.add.image(hero.x, hero.y, 'lob').setDepth(13);
    this.shots.push({ kind: 'lob', sprite, w, tier, sx: hero.x, sy: hero.y, tx: target.x, ty: target.y, t: 0, dur: Math.max(0.25, dist / 500) });
  }

  shotCount() { return this.shots.length + this.scene.threats.shards.length; }

  updateShots(dt) {
    const threats = this.scene.threats, [AW, AH] = this.scene.arena;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      let done = false;
      if (s.kind === 'arrow') {
        s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
        s.sprite.setPosition(s.x, s.y);
        for (const t of threats.list.slice()) {
          if (!t.hittable || s.hitSet.has(t) || Math.hypot(t.x - s.x, t.y - s.y) > t.r + 6) continue;
          s.hitSet.add(t);
          this.hit(t, s.w, s.tier, { x: s.x - s.vx * 0.01, y: s.y - s.vy * 0.01 });
          if (s.pierce-- <= 0) { done = true; break; }
        }
        if (s.life <= 0 || s.x < 0 || s.y < 0 || s.x > AW || s.y > AH) done = true;
      } else {                                              // lob: an arc to a spot, then a burst
        s.t += dt;
        const p = Math.min(1, s.t / s.dur);
        s.sprite.setPosition(s.sx + (s.tx - s.sx) * p, s.sy + (s.ty - s.sy) * p - Math.sin(Math.PI * p) * 70);
        if (p >= 1) { this.burst(s); done = true; }
      }
      if (done) { s.sprite.destroy(); this.shots.splice(i, 1); }
    }
  }

  burst(s) {
    const r = s.tier.radius;
    for (const t of this.scene.threats.list.slice()) {
      if (!t.hittable || Math.hypot(t.x - s.tx, t.y - s.ty) > r + t.r) continue;
      this.hit(t, s.w, s.tier, { x: s.tx, y: s.ty });
      if (s.tier.burn && this.scene.threats.list.includes(t)) this.scene.threats.applyBurn(t, s.tier.burn, s.tier.burnTime);
    }
    this.fx.push({ kind: 'burst', x: s.tx, y: s.ty, r, life: FX_LIFE * 2 });
    this.scene.app.audio.hit(false);
  }

  drawFx(dt) {
    const g = this.gfx;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      if (f.life <= 0) { this.fx.splice(i, 1); continue; }
      const k = Math.min(1, f.life / FX_LIFE);
      if (f.kind === 'arc') {
        g.fillStyle(0xfff4e1, 0.35 * k);
        g.beginPath(); g.moveTo(f.x, f.y); g.arc(f.x, f.y, f.r, f.ang - f.arc, f.ang + f.arc, false); g.closePath(); g.fillPath();
      } else if (f.kind === 'line') {
        g.lineStyle(4 + 8 * k, 0xfff4e1, 0.7 * k);
        g.lineBetween(f.x, f.y, f.x + Math.cos(f.ang) * f.r, f.y + Math.sin(f.ang) * f.r);
      } else {
        g.fillStyle(0xf2b84a, 0.25 * k); g.fillCircle(f.x, f.y, f.r);
        g.lineStyle(3, 0xf2b84a, 0.8 * k); g.strokeCircle(f.x, f.y, f.r);
      }
    }
  }

  /** Hide or show the hovering weapons (while the hero is swallowed). */
  setVisible(on) { for (const w of this.list) w.sprite.setVisible(on); }

  clear() {
    for (const w of this.list) w.sprite.destroy();
    for (const s of this.shots) s.sprite.destroy();
    this.list.length = 0; this.shots.length = 0; this.fx.length = 0;
    this.gfx.clear();
  }
}
