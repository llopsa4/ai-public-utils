// Run: one bounded top-down arena with the hero, the waves, the threats and the pickups
// (DESIGN-m1.md) and the two bosses. Between waves the Between helper runs the level-ups and shop.
// Game logic advances in fixed 1/60 s steps so it behaves the same at any frame rate.

import { makeStats, moveSpeed } from '../run/stats.js';
import { Threats } from '../run/threats.js';
import { Pickups } from '../run/pickups.js';
import { Spawner, waveLength } from '../run/waves.js';
import { Weapons } from '../combat/weapons.js';
import { Bosses } from '../combat/bosses.js';
import { campBonus, recordRun } from '../camp/save.js';
import { Place } from '../run/arena.js';
import { Between } from '../between/between.js';

const STEP = 1 / 60;
const xpNeeded = (level) => (level + 3) ** 2;           // experience to go from `level` to the next
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.ceil(s) % 60).padStart(2, '0')}`;

export class RunScene extends Phaser.Scene {
  constructor() { super('Run'); }

  init(data) { this.heroId = data?.hero ?? 'ash_wolf'; this.placeId = data?.arena ?? 'prairie'; }

  create() {
    const app = this.app = this.registry.get('app');
    const rules = this.rules = this.cache.json.get('rules');
    this.heroDef = this.cache.json.get('heroes').find((h) => h.id === this.heroId);
    const [AW, AH] = this.arena = rules.arena;
    app.mode = 'run';
    this.acc = 0;

    // Place: ground, decoration, border and the twist (wind or shallow water).
    const arenas = this.cache.json.get('arenas');
    this.placeDef = arenas.find((a) => a.id === this.placeId) ?? arenas[0];
    this.place = new Place(this, this.placeDef);

    this.stats = makeStats(this.heroDef);
    this.campData = this.cache.json.get('camp');
    this.campBonus = campBonus(app.camp, this.campData.upgrades);      // permanent upgrades from the camp
    for (const [k, v] of Object.entries(this.campBonus.stats)) this.stats[k] += v;
    this.hero = this.add.image(AW / 2, AH / 2, 'hero_placeholder').setDepth(10);
    this.facing = { x: 1, y: 0 };
    this.walkClock = 0;
    this.dash = { t: 0, dir: { x: 1, y: 0 }, cooldown: 0, iframes: 0, ghost: 0 };
    this.abilityCooldown = 0;
    this.hurtT = 0; this.slowT = 0; this.noHealT = 0; this.regenClock = 0;
    this.swallowT = 0;                          // seconds left inside Iya (the hero is hidden and still)

    // Run progress.
    this.embers = 0; this.level = 1; this.xp = 0; this.pendingLevels = 0;
    this.gatherValue = this.stats.gather;
    this.beaten = 0;
    this.bossT = null;                          // the boss shown in the boss bar
    this.met = new Set(); this.defeated = new Set();   // bosses met and beaten this run (the camp reads these in C6)
    this.freeItem = false;                      // Double-Face beaten: the next shop starts with a free item
    this.phase = 'fight';                       // fight | ending | between | over
    this.items = {};                            // shop items carried: id -> count
    this.special = { foodHeal: 0, burnChance: 0, burnDps: 0, burnTime: 0, water: false };

    const threatDefs = this.cache.json.get('threats');
    this.bosses = new Bosses(this);
    this.threats = new Threats(this, threatDefs);
    this.pickups = new Pickups(this);
    this.waves = this.cache.json.get('waves');
    this.spawner = new Spawner(this, this.waves, this.threats);
    this.weapons = new Weapons(this, this.cache.json.get('weapons'));
    this.weapons.add(this.heroDef.startWeapon);
    this.liveTexts = 0;
    this.between = new Between(this);

    // Camera: follows the hero inside the arena and shows `viewHeight` world pixels of height.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, AW, AH);
    cam.startFollow(this.hero, true, 0.2, 0.2);
    this.applyZoom = () => cam.setZoom(this.scale.height / rules.viewHeight);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.applyZoom);
      this.threats.clear(); this.pickups.clear(); this.weapons.clear();
      this.app.ui.setBoss(null);
    });

    app.input.setActive(true);
    app.ui.showHud(true);
    app.ui.setAbilityLabel(this.heroDef.ability.label);
    app.audio.setAmbience(this.placeDef.ambience ?? 'wind');
    app.hints.banner('Mni Sota Makoce', 'the land where the waters reflect the sky', 3);
    app.hints.banner(this.placeDef.name, '', 2);
    app.hints.trigger('move');
    app.hints.later('weapons', 2);
    this.startWave(1);
  }

  /* ---------- waves ---------- */

  startWave(n) {
    this.wave = n;
    this.waveLen = this.waves[n - 1].timer === false ? Infinity : waveLength(n);   // wave 20 ends when Iya falls
    this.waveT = 0;
    this.phase = 'fight';
    this.stats.hp = this.stats.maxHp;   // fully healed at the start of every wave
    this.spawner.start(n);
    if (n > 1) this.app.hints.banner(`Wave ${n}`, '', 1.2);
  }

  endWave(text) {
    this.phase = 'ending';
    if (this.bosses.main) this.app.hints.banner('Double-Face slips away', '', 1.6);   // the timer ran out first: no reward
    this.spawner.stop();
    this.threats.clear();
    this.setBoss(null);
    this.place.gfx.clear(); this.place.gust = null;
    this.pickups.flyAll();
    if (this.gatherValue > 0) {         // Gathering pays out embers at the end of each wave, then grows 5%
      this.gainEmbers(Math.round(this.gatherValue));
      this.gatherValue *= 1.05;
    }
    this.endClock = 1.2;
    this.app.hints.banner(text ?? `Wave ${this.wave} cleared`, '', 1.2);
    this.app.audio.win();
  }

  /** Iya has fallen: clear the arena, then show the win screen. */
  winRun(line) {
    this.winLine = line;
    this.endWave('Dawn');
    this.endClock = 2.4;
  }

  setBoss(t) { this.bossT = t; if (!t) this.app.ui.setBoss(null); }

  /** Iya swallows the hero: damage, hidden and still for a moment, then spat out far from him. */
  swallowHero(iya, S) {
    this.damageHero(S.damage, null, true);
    if (this.phase !== 'fight') return;
    this.swallowT = S.hidden;
    this.dash.t = 0;
    this.hero.setVisible(false);
    this.weapons.setVisible(false);
    this.app.hints.banner('Swallowed!', '', S.hidden);
  }

  spitOut() {
    const iya = this.bosses && this.threats.list.find((t) => t.id === 'iya'), [AW, AH] = this.arena;
    for (let i = 0; i < 30; i++) {
      const x = 80 + Math.random() * (AW - 160), y = 80 + Math.random() * (AH - 160);
      if (!iya || Math.hypot(x - iya.x, y - iya.y) >= 300) { this.hero.setPosition(x, y); break; }
    }
    this.hero.setVisible(true);
    this.weapons.setVisible(true);
    this.hurtT = 0.8;                                      // a moment of grace after being spat out
  }

  finish(won) {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.spawner.stop();
    this.threats.clear();
    this.setBoss(null);
    this.app.mode = 'end';
    this.app.input.setActive(false);
    const cleared = won ? this.wave : this.wave - 1;
    const goods = recordRun(this.app.camp, this.campData, { wavesCleared: cleared, won, met: this.met, defeated: this.defeated });
    const text = `Waves cleared: ${cleared}   Threats beaten: ${this.beaten}   Goods earned: ${goods}`;
    const back = [{ label: 'Return to camp', onClick: () => { if (this.app.mode === 'end') { this.app.ui.hide(); this.scene.start('Camp'); } } }];
    if (won) this.app.ui.show('The camp walks out freed', `${this.winLine ?? 'Iya falls at dawn, and the swallowed people step out into the light.'}\n${text}`, back);
    else { this.app.fell = true; this.app.ui.show('Carried home', `You are carried back to camp to rest.\n${text}`, back); }
  }

  /* ---------- the hero ---------- */

  /** Returns false when the hit is blocked by invulnerability (the attacker may try again), true otherwise. */
  damageHero(amount, effect, force) {
    if (this.phase !== 'fight' || this.swallowT > 0) return false;
    if (!force && (this.hurtT > 0 || this.dash.iframes > 0)) return false;
    const s = this.stats;
    this.hurtT = this.rules.hero.iframes;
    this.app.hints.trigger('dash');
    if (Math.random() * 100 < Math.min(60, s.dodgePct)) { this.floatText(this.hero.x, this.hero.y - 40, 'dodge', '#d9d2c0'); return true; }
    const armour = Math.max(-10, s.armour);
    const dmg = Math.max(1, Math.round(amount * 15 / (15 + armour)));
    s.hp -= dmg;
    this.floatText(this.hero.x, this.hero.y - 40, `-${dmg}`, '#ff6a4a');
    this.app.audio.hurt();
    if (effect?.slow) this.slowT = effect.time;
    if (effect?.noHeal) this.noHealT = effect.noHeal;
    if (s.hp <= 0) { s.hp = 0; this.app.audio.down(); this.finish(false); }
    return true;
  }

  healHero(amount) { this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount); }

  eatFood() {
    const heal = Math.max(1, Math.round((this.rules.food.heal + this.campBonus.foodHeal + this.special.foodHeal) * (this.noHealT > 0 ? 0.5 : 1)));
    this.healHero(heal);
    this.floatText(this.hero.x, this.hero.y - 40, `+${heal}`, '#9fe0a0');
    this.app.audio.pickup();
  }

  /** Add stat changes (from helpers or items). Health also heals what it adds; Gathering adds to the running payout. */
  addStats(delta) {
    const s = this.stats;
    for (const [key, v] of Object.entries(delta)) {
      s[key] += v;
      if (key === 'maxHp') { s.maxHp = Math.max(1, s.maxHp); s.hp = Math.min(s.maxHp, Math.max(1, s.hp + v)); }
      if (key === 'gather') this.gatherValue = Math.max(0, this.gatherValue + v);
    }
  }

  /** Recompute the item effects that are not plain stats (food, burning hits, water). */
  refreshSpecials() {
    const sp = this.special = { foodHeal: 0, burnChance: 0, burnDps: 0, burnTime: 0, water: false };
    for (const def of this.between.itemList) {
      const n = this.items[def.id] ?? 0;
      if (!n || !def.special) continue;
      sp.foodHeal += (def.special.foodHeal ?? 0) * n;
      if (def.special.burnChance) { sp.burnChance += def.special.burnChance * n; sp.burnDps = def.special.burnDps; sp.burnTime = def.special.burnTime; }
      if (def.special.water) sp.water = true;
    }
  }

  gainEmbers(n) {
    this.embers += n;
    this.xp += n;
    while (this.xp >= xpNeeded(this.level)) { this.xp -= xpNeeded(this.level); this.level++; this.pendingLevels++; }
    this.app.audio.pickup();
  }

  onThreatKilled() { this.beaten++; }

  floatText(x, y, str, color) {
    if (this.liveTexts >= 28) return;                       // keep a crowded fight cheap
    this.liveTexts++;
    const t = this.add.text(x, y, str, { fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 650, onComplete: () => { t.destroy(); this.liveTexts--; } });
  }

  /** The hero's ability (Ash circle): a ring of ash that damages and knocks back every threat in reach. */
  useAbility() {
    const a = this.heroDef.ability, hero = this.hero;
    this.abilityCooldown = a.cooldown;
    this.dash.iframes = Math.max(this.dash.iframes, a.iframes);
    this.app.audio.hit(true);
    const amount = Math.max(1, Math.round((a.damage + a.meleeScale * this.stats.melee) * (1 + this.stats.dmgPct / 100)));
    for (const t of this.threats.list.slice()) {
      if (!t.hittable || Math.hypot(t.x - hero.x, t.y - hero.y) > a.radius + t.r) continue;
      this.threats.damage(t, amount, { tags: ['melee'], knock: { x: hero.x, y: hero.y, px: a.knock } });
    }
    const ring = this.add.circle(hero.x, hero.y, 10).setStrokeStyle(4, 0xd9d2c0, 0.9).setDepth(9);
    this.tweens.add({ targets: ring, scale: a.radius / 10, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
  }

  /* ---------- frame and step ---------- */

  update(time, delta) {
    if (this.app.paused) return;
    this.acc += Math.min(delta, 100) / 1000;               // a long frame never runs the game in a burst
    while (this.acc >= STEP) { this.step(STEP); this.acc -= STEP; }
    this.updateHud();
  }

  updateHud() {
    const ui = this.app.ui, s = this.stats;
    ui.setHp(s.hp, s.maxHp);
    ui.setExp(this.xp / xpNeeded(this.level), this.level);
    ui.setEmbers(this.embers);
    const left = Math.max(0, this.waveLen - this.waveT);
    ui.setWave(`Wave ${this.wave} / ${this.rules.waveCount}${Number.isFinite(left) ? `   ${clock(left)}` : ''}`);
    if (this.bossT) ui.setBoss(this.bossT.def.name, this.bossT.hp / this.bossT.maxHp);
    ui.setCooldowns({
      dash: this.dash.cooldown / this.rules.hero.dash.cooldown,
      ability: this.abilityCooldown / this.heroDef.ability.cooldown,
    });
  }

  /** Advance the run by `seconds` of game time without waiting for frames (debug and tests). */
  advance(seconds) { for (let t = 0; t < seconds; t += STEP) this.step(STEP); this.updateHud(); }

  step(dt) {
    if (this.phase === 'over') return;
    const { input, hints } = this.app;
    const [AW, AH] = this.arena;
    const dashRules = this.rules.hero.dash;
    const hero = this.hero, dash = this.dash, stats = this.stats;

    hints.update(dt);
    dash.cooldown = Math.max(0, dash.cooldown - dt);
    dash.iframes = Math.max(0, dash.iframes - dt);
    this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.slowT = Math.max(0, this.slowT - dt);
    this.noHealT = Math.max(0, this.noHealT - dt);
    if (this.swallowT > 0) { this.swallowT -= dt; if (this.swallowT <= 0) this.spitOut(); }
    const held = this.swallowT > 0;                        // inside Iya: no moving, dashing or ability

    const stick = input.getMove();
    const moving = !held && Math.hypot(stick.x, stick.y) > 0.1;
    if (moving) {
      const len = Math.hypot(stick.x, stick.y);
      this.facing = { x: stick.x / len, y: stick.y / len };
      hints.done('move');
    }

    // Dash: a short burst in the stick direction (or the facing), untouchable for a moment.
    if (held) { input.consume('dash'); input.consume('ability'); }
    else if (input.consume('dash') && dash.cooldown === 0 && dash.t <= 0) {
      dash.t = dashRules.time; dash.dir = { ...this.facing };
      dash.cooldown = dashRules.cooldown; dash.iframes = dashRules.iframes;
      this.app.audio.dash();
    }
    if (!held && input.consume('ability') && this.abilityCooldown === 0 && this.phase === 'fight') this.useAbility();
    if (this.abilityCooldown === 0 && this.phase === 'fight' && this.threats.list.length) hints.trigger('ability');

    if (dash.t > 0) {
      const used = Math.min(dt, dash.t);
      const speed = dashRules.distance / dashRules.time;
      hero.x += dash.dir.x * speed * used; hero.y += dash.dir.y * speed * used;
      dash.t -= used;
      dash.ghost -= dt;
      if (dash.ghost <= 0) { dash.ghost = 0.04; this.afterimage(); }
    } else if (moving) {
      const wade = this.place.heroSpeedMul();
      if (wade < 1) hints.trigger('water');
      const speed = moveSpeed(stats, this.rules) * (this.slowT > 0 ? 0.7 : 1) * wade;
      hero.x += stick.x * speed * dt; hero.y += stick.y * speed * dt;
    }

    hero.x = Phaser.Math.Clamp(hero.x, 28, AW - 28);
    hero.y = Phaser.Math.Clamp(hero.y, 28, AH - 28);
    hero.setFlipX(this.facing.x < 0);
    hero.setDepth(10 + hero.y / AH);

    // Walk bob: a small squash while moving (the painted still is animated in code).
    this.walkClock += moving || dash.t > 0 ? dt * 12 : 0;
    const bob = moving || dash.t > 0 ? Math.sin(this.walkClock) * 0.05 : 0;
    hero.setScale(1 + bob, 1 - bob);
    hero.setAlpha(dash.iframes > 0 ? 0.7 : 1);
    if (this.hurtT > 0) hero.setTint(0xff9a80); else hero.clearTint();

    if (this.phase === 'fight') {
      // Mending: r > 0 heals 1 HP every 6 / r seconds (stopped by a hunger shade's hit).
      if (stats.regen > 0 && this.noHealT <= 0) {
        this.regenClock += dt;
        if (this.regenClock >= 6 / stats.regen) { this.regenClock = 0; this.healHero(1); }
      }
      this.spawner.update(dt);
      this.threats.update(dt);
      this.place.update(dt);
      this.weapons.update(dt, !held);
      this.pickups.update(dt);
      this.waveT += dt;
      if (this.phase === 'fight' && this.waveT >= this.waveLen) this.endWave();
    } else if (this.phase === 'ending') {
      this.weapons.update(dt, false);
      this.pickups.update(dt);
      this.endClock -= dt;
      if (this.endClock <= 0) {
        if (this.wave >= this.rules.waveCount) this.finish(true);
        else { this.phase = 'between'; this.between.start(() => this.startWave(this.wave + 1)); }
      }
    } else if (this.phase === 'between') {
      this.weapons.update(dt, false);
    }
  }

  afterimage() {
    const ghost = this.add.image(this.hero.x, this.hero.y, 'hero_placeholder')
      .setFlipX(this.hero.flipX).setAlpha(0.35).setDepth(9).setTint(0xd9d2c0);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
  }

  /** Back to camp without finishing the run (Settings > Leave run). */
  leave() {
    recordRun(this.app.camp, this.campData, { wavesCleared: 0, won: false, met: this.met, defeated: this.defeated, finished: false });   // bosses met still count
    this.app.paused = false;
    this.app.ui.hide();
    this.scene.start('Camp');
  }

  /* ---------- debug helpers (used through window.kota with ?debug) ---------- */

  debugKillAll() { this.threats.killAll(); }
  /** Add embers (and experience) at once, as if gathered. */
  debugEmbers(n) { this.gainEmbers(n); }
  /** Give a weapon (merging with an identical one if all slots are full). Returns 'added', 'merged' or 'full'. */
  debugGive(id, tier = 1) { return this.weapons.add(id, tier); }
  debugSetWave(n) { this.threats.clear(); this.pickups.clear(); this.startWave(n); }
  debugSpawn(id, count = 1) {
    for (let i = 0; i < count; i++) {
      const p = this.spawner.spot();
      this.threats.spawnNow(id, p.x, p.y, this.wave);
    }
  }
  debugCounts() {
    const c = {};
    for (const t of this.threats.list) c[t.id] = (c[t.id] ?? 0) + 1;
    return { threats: c, marks: this.threats.marks.length, embers: this.pickups.embers.length, foods: this.pickups.foods.length };
  }
}
