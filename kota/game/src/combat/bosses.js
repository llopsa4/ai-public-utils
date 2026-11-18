// Bosses (DESIGN-m1.md sections 9 and 10): Double-Face (wave 10 elite, with a false double below half health)
// and Iya the Camp-Eater (wave 20). Stats and timings live in data/threats.json; this file holds the behaviour.
// Threats.update calls update(t, dt) for every threat whose behaviour is "boss", and Threats.kill calls onKilled(t).

const HERO_R = 20;
const PI = Math.PI;
const wrap = (a) => Phaser.Math.Angle.Wrap(a);
const turnToward = (cur, target, step) => cur + Phaser.Math.Clamp(wrap(target - cur), -step, step);
const rad = (deg) => (deg * PI) / 180;

export class Bosses {
  constructor(scene) {
    this.scene = scene;
    this.main = null;          // the real Double-Face while he is in the arena
    this.dawn = null;          // the night overlay that lifts as Iya weakens
  }

  /** Forget the current fight (wave end, leaving the run). */
  reset() {
    this.main = null;
    if (this.dawn) { this.dawn.destroy(); this.dawn = null; }
  }

  /** A boss has just been created: set up its state and announce it. */
  init(t) {
    const s = this.scene, def = t.def;
    const toHero = Math.atan2(s.hero.y - t.y, s.hero.x - t.x);
    t.b = { state: 'move', t: 0, face: toHero };
    if (t.id === 'double_face') {
      Object.assign(t.b, { swipeCd: def.swipe.every, lureCd: def.lure.every, fake: null, falseT: 0, swapT: def.swapEvery });
      this.main = t;
      s.setBoss(t);
      s.met.add('double_face');
      s.app.hints.banner(def.name, 'a face in front, a face behind', 2.5);
      s.app.hints.trigger('double_face');
    } else if (t.id === 'double_face_false') {
      Object.assign(t.b, { swipeCd: 1.5 });
    } else if (t.id === 'iya') {
      Object.assign(t.b, { lungeCd: 3, swallowCd: 6, run: 0, hit: false, weak: false });
      const [AW, AH] = s.arena;
      this.dawn = s.add.rectangle(AW / 2, AH / 2, AW, AH, 0x0a1030, 0.42).setDepth(28);
      s.setBoss(t);
      s.met.add('iya');
      s.app.hints.banner(def.name, 'the night is not over', 2.5);
      s.app.hints.trigger('iya');
    }
  }

  update(t, dt) {
    if (t.id === 'iya') this.iya(t, dt); else this.doubleFace(t, dt);
    this.scene.threats.contact(t);
  }

  /* ---------- shared pieces ---------- */

  /** Pull the hero toward (x, y) unless the hero is dashing or swallowed. */
  pullHero(x, y, speed, dt, stop) {
    const s = this.scene, hero = s.hero;
    if (s.dash.t > 0 || s.swallowT > 0) return;
    const dx = x - hero.x, dy = y - hero.y, d = Math.hypot(dx, dy);
    if (d <= stop) return;
    const step = Math.min(speed * dt, d - stop);
    hero.x += (dx / d) * step; hero.y += (dy / d) * step;
  }

  /** Whether the hero stands inside a wedge (centre angle, full arc in degrees, reach) in front of `t`. */
  heroInWedge(t, ang, arc, reach) {
    const hero = this.scene.hero, d = Math.hypot(hero.x - t.x, hero.y - t.y);
    if (d > reach + HERO_R) return false;
    const diff = Math.abs(wrap(Math.atan2(hero.y - t.y, hero.x - t.x) - ang));
    return diff <= rad(arc) / 2 + Math.atan2(HERO_R, Math.max(d, 1));
  }

  wedge(t, ang, arc, reach, alpha, color) {
    const g = this.scene.threats.gfx, half = rad(arc) / 2;
    g.fillStyle(color, alpha);
    g.beginPath(); g.moveTo(t.x, t.y); g.arc(t.x, t.y, reach, ang - half, ang + half, false); g.closePath(); g.fillPath();
  }

  /* ---------- Double-Face ---------- */

  doubleFace(t, dt) {
    const s = this.scene, hero = s.hero, def = t.def, b = t.b, sw = def.swipe;
    const toHero = Math.atan2(hero.y - t.y, hero.x - t.x), d = Math.hypot(hero.x - t.x, hero.y - t.y);
    const turn = rad(sw.turn) * dt;

    if (b.state === 'move') {
      b.face = turnToward(b.face, toHero, turn);
      if (d > t.r + HERO_R - 6) { t.x += Math.cos(toHero) * def.speed * dt; t.y += Math.sin(toHero) * def.speed * dt; }
      b.swipeCd -= dt;
      if (def.lure) b.lureCd -= dt;
      if (def.lure && b.lureCd <= 0) { b.state = 'lure'; b.t = def.lure.time; b.lureCd = def.lure.every; }
      else if (b.swipeCd <= 0) { b.state = 'wind'; b.t = sw.wind; }
    } else if (b.state === 'wind') {
      b.t -= dt;
      if (b.t > 0.2) b.face = turnToward(b.face, toHero, turn);          // the aim locks for the last moment
      const k = 1 - Math.max(0, b.t) / sw.wind;
      for (const a of [b.face, b.face + PI]) this.wedge(t, a, sw.arc, sw.reach, 0.12 + 0.35 * k, 0xd05a3a);
      if (b.t <= 0) {
        if (this.heroInWedge(t, b.face, sw.arc, sw.reach) || this.heroInWedge(t, b.face + PI, sw.arc, sw.reach)) s.damageHero(sw.damage, null);
        s.app.audio.hit(true);
        b.state = 'move'; b.swipeCd = sw.every;
      }
    } else {                                                            // 'lure': he beckons and pulls the hero in
      b.t -= dt;
      b.face = turnToward(b.face, toHero, turn);
      const g = s.threats.gfx;
      g.lineStyle(3, 0xe0b070, 0.35 + 0.35 * Math.sin(s.threats.clock * 14));
      g.strokeCircle(t.x, t.y, 90 + 40 * (1 - b.t / def.lure.time));
      this.pullHero(t.x, t.y, def.lure.pull, dt, t.r + HERO_R);
      if (b.t <= 0) { b.state = 'move'; b.swipeCd = Math.max(b.swipeCd, 1); }
    }

    if (t.id === 'double_face') this.falseDouble(t, dt);
  }

  /** Below half health the real Double-Face keeps one false double near him; the two swap places now and then. */
  falseDouble(t, dt) {
    const s = this.scene, b = t.b, def = t.def;
    if (t.hp > t.maxHp * def.falseBelow) return;
    if (b.fake && !s.threats.list.includes(b.fake)) b.fake = null;
    if (!b.fake) {
      b.falseT -= dt;
      if (b.falseT <= 0) {
        const a = Math.random() * PI * 2;
        b.fake = s.threats.create('double_face_false', s.threats.defs.double_face_false, t.x + Math.cos(a) * 160, t.y + Math.sin(a) * 160, s.wave);
        b.swapT = def.swapEvery;
        s.app.hints.banner('A false double', 'any hit undoes it', 1.6);
      }
    } else {
      b.swapT -= dt;
      if (b.swapT <= 0) {
        b.swapT = def.swapEvery;
        const f = b.fake, x = t.x, y = t.y;
        t.x = f.x; t.y = f.y; f.x = x; f.y = y;
      }
    }
  }

  /* ---------- Iya ---------- */

  iya(t, dt) {
    const s = this.scene, hero = s.hero, def = t.def, b = t.b, L = def.lunge, S = def.swallow, W = def.weak;
    const frac = t.hp / t.maxHp, weak = frac < W.below;
    b.weak = weak;
    t.dmgMul = weak ? W.takes : 1;
    if (this.dawn) this.dawn.setAlpha(0.42 * Math.max(0, frac));          // the sky brightens as his health falls
    const toHero = Math.atan2(hero.y - t.y, hero.x - t.x), d = Math.hypot(hero.x - t.x, hero.y - t.y);
    const speed = def.speed * (weak ? W.speed : 1);
    const recover = () => { b.state = 'recover'; b.t = L.recover * (weak ? W.recover : 1); };

    if (b.state === 'move') {
      b.face = toHero;
      if (d > t.r + HERO_R - 8) { t.x += Math.cos(toHero) * speed * dt; t.y += Math.sin(toHero) * speed * dt; }
      b.lungeCd -= dt; b.swallowCd -= dt;
      if (b.swallowCd <= 0 && s.swallowT <= 0) { b.state = 'swallowWind'; b.t = S.wind; }
      else if (b.lungeCd <= 0) { b.state = 'lungeWind'; b.t = L.wind; }
    } else if (b.state === 'lungeWind') {
      b.t -= dt;
      if (b.t > 0.2) b.face = toHero;                                      // the path locks for the last moment
      const k = 1 - Math.max(0, b.t) / L.wind, g = s.threats.gfx;
      g.lineStyle(60, 0xd05a3a, 0.12 + 0.3 * k);
      g.lineBetween(t.x, t.y, t.x + Math.cos(b.face) * L.distance, t.y + Math.sin(b.face) * L.distance);
      if (b.t <= 0) { b.state = 'lunge'; b.run = 0; b.hit = false; }
    } else if (b.state === 'lunge') {
      const step = L.speed * dt;
      t.x += Math.cos(b.face) * step; t.y += Math.sin(b.face) * step; b.run += step;
      if (!b.hit && Math.hypot(hero.x - t.x, hero.y - t.y) < t.r + HERO_R && s.damageHero(L.damage, null)) b.hit = true;
      if (b.run >= L.distance) { b.lungeCd = L.every; recover(); }
    } else if (b.state === 'swallowWind') {
      b.t -= dt;
      if (b.t > 0.2) b.face = toHero;
      const k = 1 - Math.max(0, b.t) / S.wind;
      this.wedge(t, b.face, S.arc, S.reach, 0.1 + 0.3 * k, 0x6e2a5a);
      if (b.t <= 0) { b.state = 'pull'; b.t = S.pullTime; }
    } else if (b.state === 'pull') {
      b.t -= dt;
      this.wedge(t, b.face, S.arc, S.reach, 0.3, 0x6e2a5a);
      if (this.heroInWedge(t, b.face, S.arc, S.reach)) this.pullHero(t.x, t.y, S.pull, dt, 40);
      if (b.t <= 0) {
        if (Math.hypot(hero.x - t.x, hero.y - t.y) <= S.catch) s.swallowHero(t, S);
        b.swallowCd = S.every;
        recover();
      }
    } else {                                                               // 'recover': helpless for a moment
      b.t -= dt;
      if (b.t <= 0) b.state = 'move';
    }
  }

  /** Per-frame look of a boss sprite (Threats.update calls it for every boss). */
  draw(t) {
    const b = t.b, clock = this.scene.threats.clock;
    if (t.id === 'iya') {
      t.sprite.setFlipX(Math.cos(b.face) < 0);
      const helpless = b.state === 'recover';
      const sway = b.weak ? Math.sin(clock * 3) * 5 : 0;                   // his thin legs falter
      t.sprite.setAngle(helpless ? (Math.cos(b.face) < 0 ? -12 : 12) : sway);
      t.sprite.setScale(1, helpless ? 0.9 : 1);
      if (b.state === 'lungeWind' || b.state === 'swallowWind') t.sprite.setScale(1.08, 0.94);
    } else {
      t.sprite.setRotation(b.face);                                        // front face leads, back face trails
      if (b.state === 'wind') t.sprite.setScale(1.1);
      else t.sprite.setScale(1);
    }
  }

  /* ---------- defeat ---------- */

  onKilled(t) {
    const s = this.scene;
    if (t.id === 'double_face_false') {
      if (this.main) { this.main.b.fake = null; this.main.b.falseT = this.main.def.falseDelay; }
      return;
    }
    if (t.id === 'double_face') {
      for (const f of s.threats.list.filter((x) => x.id === 'double_face_false')) { f.sprite.destroy(); s.threats.list.splice(s.threats.list.indexOf(f), 1); }
      this.main = null;
      s.defeated.add('double_face');
      s.freeItem = true;
      s.app.hints.banner('The child is free.', 'He will grow up among the people.', 3.5);
      s.app.audio.win();
      s.setBoss(null);
    } else if (t.id === 'iya') {
      s.defeated.add('iya');
      s.setBoss(null);
      s.winRun('Iya falls at dawn, and the swallowed people step out into the light.');
    }
  }
}
