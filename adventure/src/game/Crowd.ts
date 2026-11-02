import Phaser from 'phaser';
import { sound } from '../audio/sound';
import { CROWDS, lineKind, lookKey, routineFor, type Carry, type CrowdDef, type ExtraDef, type Mood } from '../content/crowd';
import { Schedule, type Station, type Step, type Task } from '../engine/crowd';
import { t } from '../engine/i18n';
import type { WalkArea } from '../engine/pathfinding';
import { settings } from '../engine/settings';
import type { Point, RoomDef } from '../engine/types';
import { Actor } from './Actor';
import type { Props } from './props';

/** How the scene lends the crowd what it needs (kept narrow so the crowd can't change game state). */
export interface CrowdHost {
  scene: Phaser.Scene;
  room: RoomDef;
  area: WalkArea;
  props: Props;
  hero: () => Actor;
  /** Where the story characters stand (people walk round them too). */
  others: () => Point[];
  /** True while a line, a conversation or a cutscene is on screen (no chatter then). */
  busy: () => boolean;
  /** Loads a lazy sheet (with its animations) and calls back when it is ready. */
  loadSheet: (key: string, then: () => void) => void;
  /** Shows (or with '' hides) a chatter bubble above a world point. */
  bubble: (text: string, at?: Point) => void;
}

/** One background person on screen. */
export interface Member {
  def: ExtraDef;
  actor: Actor;
  schedule: Schedule;
  /** Station being walked to or worked at (others avoid it). */
  target: string | null;
  task: Task | null;
  carrying: boolean;
  /** Paused to talk to Mara. */
  held: boolean;
  /** Asked to make room for Mara. */
  vacate: boolean;
  /** The story moved on (alarm, cold kiln): react, then change routine. */
  react: Mood | null;
  /** Out of the room for a while (or for good). */
  away: boolean;
  gone: boolean;
  prop: Phaser.GameObjects.Image | null;
  effect: Phaser.Time.TimerEvent | null;
  talks: number;
  /** Position last frame (to tell whether a walker is heading into someone). */
  last: Point;
  /** Where the person or Mara who just blocked this walker stood (to step around them). */
  blocker: Point | null;
  /** A kid tagging along: a spot near where Mara is going. */
  follow: Point | null;
}

const TASK_TAG: Record<Task, string | null> = { stand: null, work: 'work', carry: 'carry', reach: 'reach', sit: 'sit', sweep: 'carry', tap: 'carry' };
/** Where a held thing sits, in world units at full size from the feet, for the art facing right. */
const HOLD: Record<Carry, { x: number; y: number; angle: number; origin: [number, number] }> = {
  shovel: { x: 10, y: 52, angle: 32, origin: [0.5, 0.2] },
  broom: { x: 12, y: 54, angle: 18, origin: [0.5, 0.15] },
  slate: { x: 9, y: 60, angle: -6, origin: [0.5, 0.5] },
  sack: { x: -6, y: 100, angle: -8, origin: [0.5, 0.6] },
};
const BUBBLE_MS = 2600;
const CHATTER_MIN = 8000;
const CHATTER_MAX = 20000;
/** How close Mara may stand before someone walking into her waits. */
const BLOCK_DISTANCE = 16;
/** How far someone steps to the side to get round a person in the way. */
const SIDESTEP = 24;
/** Mara walking this close to someone standing still makes them step aside. */
const MAKE_WAY = 20;
/** Mara heading this close to a busy station makes its worker step aside. */
const VACATE_DISTANCE = 40;

/** Placeholder held things, drawn in code (no download): replace with art later. */
export function createCrowdTextures(scene: Phaser.Scene): void {
  const draw = (key: string, w: number, h: number, paint: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({}, false);
    paint(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  draw('crowd-shovel', 10, 44, g => {
    g.fillStyle(0x6b4a2e).fillRect(4, 0, 2, 32);
    g.fillStyle(0x3a3634).fillRoundedRect(1, 30, 8, 13, 2);
    g.fillStyle(0x8a8580).fillRect(2, 31, 2, 10);
  });
  draw('crowd-broom', 12, 50, g => {
    g.fillStyle(0x7a5a38).fillRect(5, 0, 2, 38);
    g.fillStyle(0xb89a5a).fillTriangle(0, 49, 12, 49, 6, 36);
    g.fillStyle(0x8a7040).fillRect(3, 36, 6, 3);
  });
  draw('crowd-slate', 12, 10, g => {
    g.fillStyle(0x6b4a2e).fillRect(0, 0, 12, 10);
    g.fillStyle(0x2c3034).fillRect(1, 1, 10, 8);
    g.lineStyle(1, 0xd8d4c8, 0.9).lineBetween(3, 3, 3, 7).lineBetween(5, 3, 5, 7).lineBetween(7, 3, 7, 7).lineBetween(2, 6, 9, 4);
  });
  draw('crowd-sack', 20, 14, g => {
    g.fillStyle(0x9a7a50).fillEllipse(10, 8, 20, 12);
    g.fillStyle(0x7a5a38).fillEllipse(10, 10, 16, 6);
    g.fillStyle(0x5a4028).fillRect(16, 3, 3, 4);
  });
}

/**
 * The kiln hall's background people: each walks a routine of stations, works there with a pose,
 * a held thing and a small effect, sometimes leaves and comes back, chats in bubbles, and reacts
 * when the kiln goes cold. Presentation only: nothing here is saved or changes the story.
 */
export class Crowd {
  readonly members: Member[] = [];
  private alive = true;
  private chatter: Phaser.Time.TimerEvent | null = null;
  private bubble: { owner: Member; text: string; until: number } | null = null;
  private readonly calm = settings().reducedMotion;

  private readonly def: CrowdDef;
  private mood: Mood;

  constructor(private readonly host: CrowdHost, mood: Mood) {
    this.def = CROWDS[host.room.id];
    this.mood = mood;
    createCrowdTextures(host.scene);
    for (const def of this.def.extras) {
      if (mood === 'cold' && def.leavesWhenCold) continue;
      host.loadSheet(def.sheet, () => { if (this.alive) this.spawn(def); });
    }
    this.scheduleChatter();
  }

  destroy(): void {
    this.alive = false;
    this.chatter?.remove();
    this.host.bubble('');
    for (const m of this.members) { m.effect?.remove(); m.prop?.destroy(); }
  }

  /** The people currently on screen. */
  visible(): Member[] {
    return this.members.filter(m => !m.away && !m.gone && m.actor.sprite.active);
  }

  /** Background person under a world point (front-most first). */
  hit(p: Point): Member | null {
    const list = this.visible().sort((a, b) => b.actor.sprite.depth - a.actor.sprite.depth);
    return list.find(m => m.actor.hitBox().contains(p.x, p.y)) ?? null;
  }

  private get cold(): boolean {
    return this.mood === 'cold';
  }

  private spawn(def: ExtraDef): void {
    const scene = this.host.scene;
    const rng = () => Math.random();
    const { stations, exits, wander } = this.def;
    const schedule = new Schedule(routineFor(def, this.mood), stations, exits, wander, rng);
    // Start at work at a station of the routine, or somewhere on the floor if it's taken.
    const station = this.free(schedule.current) ? schedule.current : null;
    const at = station ?? this.host.area.clamp({ x: wander.x + Math.random() * wander.w, y: wander.y + Math.random() * wander.h });
    const actor = new Actor(scene, def.id, def.sheet, at.x, at.y, 'down', 'stand', this.host.room.scale, def.body);
    actor.speed = def.speed;
    actor.hitWidth = 0.75;
    actor.sprite.setAlpha(0);
    scene.tweens.add({ targets: actor.sprite, alpha: 1, duration: 500 });
    const member: Member = {
      def, actor, schedule, target: null, task: null, carrying: false, held: false, vacate: false, react: null,
      away: false, gone: false, prop: null, effect: null, talks: 0, last: { x: at.x, y: at.y }, blocker: null, follow: null,
    };
    if (def.carry && def.carry !== 'sack') member.prop = scene.add.image(at.x, at.y, `crowd-${def.carry}`);
    actor.onStep = () => {
      const d = Math.hypot(actor.sprite.x - this.host.hero().sprite.x, actor.sprite.y - this.host.hero().sprite.y);
      const level = 0.45 - d / 900;
      if (level > 0.02) sound.step(this.host.room.surface ?? 'stone', level);
    };
    this.members.push(member);
    if (station) this.arrive(member, station);
    void this.live(member, station ? station.wait[0] * Math.random() + 600 : 800);
  }

  /** True when no one else is at or heading to the station. */
  private free(station: Station, self?: Member): boolean {
    return !this.members.some(m => m !== self && !m.gone && !m.away && m.target === station.id);
  }

  // --------------------------------------------------------------- routine ---
  private async live(m: Member, firstWait: number): Promise<void> {
    await this.pause(m, firstWait);
    while (this.alive && !m.gone && m.actor.sprite.active) {
      if (m.held) { await this.sleep(150); continue; }
      if (m.react) { await this.reacting(m); continue; }
      let step: Step = m.schedule.next();
      if (m.follow) {
        step = { kind: 'detour', to: m.follow, wait: 1800 + Math.random() * 1500 };
        m.follow = null;
      } else if (m.vacate) {
        m.vacate = false;
        step = { kind: 'detour', to: this.aside(m), wait: 1500 };
      }
      // Two people never share a station: try the next one instead.
      for (let tries = 0; step.kind === 'go' && !this.free(step.station, m) && tries < 3; tries++) step = m.schedule.next();
      await this.take(m, step);
    }
  }

  private async take(m: Member, step: Step): Promise<void> {
    switch (step.kind) {
      case 'go': {
        m.target = step.station.id;
        if (!(await this.walk(m, step.station))) return;
        this.arrive(m, step.station);
        await this.pause(m, step.wait);
        this.leaveStation(m);
        return;
      }
      case 'detour': {
        m.target = null;
        if (!(await this.walk(m, this.host.area.clamp(step.to)))) return;
        await this.pause(m, step.wait);
        return;
      }
      case 'leave': {
        m.target = null;
        if (!step.forever && m.def.leaving && Math.random() < 0.6 && !this.bubble && !this.host.busy()) {
          this.say(m, t(`line.${m.def.id}.leaving.${1 + Math.floor(Math.random() * m.def.leaving)}`));
        }
        if (!(await this.walk(m, step.exit))) return;
        if (!(await m.actor.walk([step.exit.out]))) return;
        await this.fade(m, 0);
        m.away = true;
        m.prop?.setVisible(false);
        if (step.forever) { m.gone = true; m.actor.sprite.setVisible(false); return; }
        await this.sleep(step.away);
        // Out of the room when the kiln died: some don't come back.
        if (m.def.leavesWhenCold && this.cold) { m.gone = true; return; }
        m.away = false;
        m.react = null;
        m.schedule.change(routineFor(m.def, this.mood));
        m.actor.sprite.setPosition(step.exit.out.x, step.exit.out.y);
        await this.fade(m, 1);
        await m.actor.walk([{ x: step.exit.x, y: step.exit.y }]);
        return;
      }
    }
  }

  /**
   * The story moved on. With `react` (it happened in front of them) everyone responds first: the
   * cold kiln is stared at, the alarm sends the kids running to Nell. Otherwise routines just switch.
   */
  setMood(mood: Mood, react: boolean): void {
    if (mood === this.mood) return;
    this.mood = mood;
    for (const m of this.members) {
      if (m.gone) continue;
      if (react) m.react = mood;
      else m.schedule.change(routineFor(m.def, mood), mood === 'cold' && !!m.def.leavesWhenCold);
    }
  }

  private async reacting(m: Member): Promise<void> {
    const mood = m.react!;
    m.react = null;
    if (m.away) return;
    m.actor.stop();
    this.leaveStation(m);
    if (mood === 'cold') {
      m.actor.setFacing('up');
      await this.sleep(1800 + Math.random() * 1400);
    } else if (mood === 'alarm') {
      // A startled look up, then a dash.
      m.actor.setFacing('up');
      await this.sleep(500 + Math.random() * 400);
      m.actor.speed = m.def.speed * 1.3;
    }
    m.schedule.change(routineFor(m.def, mood), mood === 'cold' && !!m.def.leavesWhenCold);
  }

  /** Walks to a point, waiting for Mara if she stands in the way. False if interrupted. */
  /**
   * Walks to a point. Someone in the way (Mara standing still, or another person) stops the walk;
   * the walker waits a moment, steps to the side away from them, and carries on. False if
   * interrupted for another reason, or still blocked after a few tries.
   */
  private async walk(m: Member, to: Point): Promise<boolean> {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!this.alive || m.held || m.react) return false;
      const blocker = m.blocker;
      m.blocker = null;
      if (blocker) {
        const side = this.sidestep(m, to, blocker);
        if (side && !(await m.actor.walk([side])) && !m.blocker) return false;
      }
      const path = this.host.area.findPath(m.actor.position, to);
      if (await m.actor.walk(path)) return true;
      if (!this.alive || m.held || m.react || m.vacate) return false;
      if (!m.blocker) return false;
      await this.sleep(300 + Math.random() * 500);
    }
    return false;
  }

  /** A point a step to the side of the way to `to`, on the side away from whoever is in the way. */
  private sidestep(m: Member, to: Point, blocker: Point): Point | null {
    const p = m.actor.position;
    const dx = to.x - p.x, dy = to.y - p.y, len = Math.hypot(dx, dy);
    if (len < 4) return null;
    const ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux;
    if ((blocker.x - p.x) * nx + (blocker.y - p.y) * ny > 0) { nx = -nx; ny = -ny; }
    return this.host.area.clamp({ x: p.x + nx * SIDESTEP + ux * 6, y: p.y + ny * SIDESTEP * 0.6 + uy * 6 });
  }

  /** Waits, but gives up early when the person is needed elsewhere. */
  private async pause(m: Member, ms: number): Promise<void> {
    const end = this.host.scene.time.now + ms;
    while (this.alive && this.host.scene.time.now < end) {
      if (m.held || m.react || m.vacate || m.follow) return;
      await this.sleep(Math.min(150, end - this.host.scene.time.now));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (!this.alive) { resolve(); return; }
      this.host.scene.time.delayedCall(Math.max(0, ms), resolve);
    });
  }

  private fade(m: Member, alpha: number): Promise<void> {
    return new Promise(resolve => this.host.scene.tweens.add({ targets: [m.actor.sprite, m.prop].filter(Boolean), alpha, duration: 350, onComplete: () => resolve() }));
  }

  /** A spot a little away from where the person stands (making room for Mara). */
  private aside(m: Member): Point {
    const p = m.actor.position, hero = this.host.hero().position;
    const away = Math.sign(p.x - hero.x) || 1;
    return this.host.area.clamp({ x: p.x + away * 46, y: p.y + 18 });
  }

  // ----------------------------------------------------------------- tasks ---
  private arrive(m: Member, station: Station): void {
    m.target = station.id;
    m.task = station.task;
    m.actor.setFacing(station.face);
    m.actor.perform(TASK_TAG[station.task]);
    this.startEffect(m, station);
  }

  private leaveStation(m: Member): void {
    m.effect?.remove();
    m.effect = null;
    const station = m.target ? this.def.stations[m.target] : null;
    const { carryBetween } = m.def;
    // The hauler picks a sack up at the pile and puts it down at a kiln mouth.
    if (station && carryBetween) {
      if (station.id === carryBetween.pick) m.carrying = true;
      else if (carryBetween.drop.includes(station.id)) m.carrying = false;
      this.updateSack(m);
    }
    m.task = null;
    m.actor.perform(null);
  }

  private updateSack(m: Member): void {
    if (m.def.carry !== 'sack') return;
    if (m.carrying && !m.prop) m.prop = this.host.scene.add.image(m.actor.sprite.x, m.actor.sprite.y, 'crowd-sack');
    else if (!m.carrying && m.prop) { m.prop.destroy(); m.prop = null; }
  }

  /** Repeating sounds and puffs while working; quieter the further from Mara. */
  private startEffect(m: Member, station: Station): void {
    const scene = this.host.scene, props = this.host.props;
    const level = () => {
      const h = this.host.hero().sprite;
      return Math.max(0, 1 - Math.hypot(m.actor.sprite.x - h.x, m.actor.sprite.y - h.y) / 420);
    };
    const every = (ms: number, fn: () => void) => { m.effect = scene.time.addEvent({ delay: ms, loop: true, callback: () => { if (!m.away) fn(); } }); };
    switch (station.task) {
      case 'work':
        if (m.def.carry === 'shovel') {
          every(1700 + Math.random() * 400, () => {
            sound.scrape(level());
            const glow = this.nearestWarmGlow(m.actor.position);
            if (glow && !this.cold && !this.calm && Math.random() < 0.6) props.burst([glow]);
          });
        }
        break;
      case 'sweep':
        every(620, () => {
          sound.sweep(level());
          if (!this.calm) props.step(m.actor.sprite.x + (m.actor.sprite.flipX ? -14 : 14) * m.actor.perspective, m.actor.sprite.y);
        });
        break;
      case 'tap':
        every(1300 + Math.random() * 600, () => sound.clink(level()));
        break;
      case 'reach':
        props.swing('pulleys');
        every(3200, () => props.swing('pulleys'));
        break;
      default:
        break;
    }
  }

  private nearestWarmGlow(p: Point): Point | null {
    const glows = (this.host.room.ambient?.glows ?? []).filter(g => g.warm);
    let best: Point | null = null, bd = Infinity;
    for (const g of glows) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; best = g; } }
    return best && bd < 90 ? best : null;
  }

  // ------------------------------------------------------------ with Mara ---
  /** Stops someone so Mara can talk to them; they turn to face her. */
  hold(m: Member): void {
    m.held = true;
    m.actor.stop();
    if (m.task) this.leaveStation(m);
    m.target = null;
    m.actor.lookAt(this.host.hero().sprite.x);
  }

  release(m: Member): void {
    m.held = false;
  }

  /** Where Mara stands to talk to someone: beside them, on her side. */
  talkSpot(m: Member): { at: Point; face: 'left' | 'right' } {
    const p = m.actor.position, hero = this.host.hero().position;
    const side = hero.x < p.x ? -1 : 1;
    const at = this.host.area.clamp({ x: p.x + side * 48, y: p.y + 2 });
    return { at, face: at.x < p.x ? 'right' : 'left' };
  }

  /** The next thing this person says to Mara (cycles through their lines). */
  nextLine(m: Member): string {
    const { key, count } = lineKind(m.def, 'talk', this.mood);
    return `${key}.${(m.talks++ % count) + 1}`;
  }

  lookLine(m: Member): string {
    return lookKey(m.def, this.mood);
  }

  /** Mara is heading somewhere: anyone working right there steps aside. */
  heroHeading(to: Point): void {
    for (const m of this.visible()) {
      if (m.held) continue;
      // Kids sometimes tag along for a few steps (only on an ordinary day).
      if (m.def.curious && this.mood === 'warm' && !m.react && Math.random() < 0.3) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const spot = this.host.area.clamp({ x: to.x + side * (34 + Math.random() * 16), y: to.y + 6 + Math.random() * 12 });
        const crowded = [...this.members.filter(o => o !== m && !o.gone && !o.away).map(o => o.actor.position), ...this.host.others()]
          .some(o => Math.hypot(o.x - spot.x, o.y - spot.y) < 22);
        if (crowded) continue;
        m.follow = spot;
        if (!this.bubble && Math.random() < 0.5) this.say(m, t(`line.${m.def.id}.follow`));
        continue;
      }
      if (!m.target) continue;
      const s = this.def.stations[m.target];
      if (s && Math.hypot(s.x - to.x, s.y - to.y) < VACATE_DISTANCE) m.vacate = true;
    }
  }


  // ------------------------------------------------------------ per frame ---
  update(): void {
    const hero = this.host.hero();
    for (const m of this.members) {
      if (m.gone) continue;
      const a = m.actor;
      // Walking into someone (Mara standing still, or another person) stops the walk; walk() then
      // steps round them. Walking away from someone, or alongside, is fine.
      if (a.isWalking && !m.held) {
        const vx = a.sprite.x - m.last.x, vy = a.sprite.y - m.last.y;
        const obstacles: Point[] = [...(hero.isWalking ? [] : [hero.position]), ...this.host.others()];
        for (const o of this.members) if (o !== m && !o.gone && !o.away) obstacles.push(o.actor.position);
        const reach = BLOCK_DISTANCE * a.perspective;
        const hit = obstacles.find(o => {
          const dx = o.x - a.sprite.x, dy = o.y - a.sprite.y;
          return dx * vx + dy * vy > 0 && Math.hypot(dx, dy * 1.6) < reach;
        });
        if (hit) { m.blocker = hit; a.stop(); }
      }
      // Mara walking through where someone stands: they make way.
      if (hero.isWalking && !a.isWalking && !m.held && !m.react && !m.away && !m.vacate
        && Math.hypot(hero.sprite.x - a.sprite.x, (hero.sprite.y - a.sprite.y) * 1.6) < MAKE_WAY) m.vacate = true;
      m.last = { x: a.sprite.x, y: a.sprite.y };
      if (m.held) a.lookAt(hero.sprite.x);
      // People standing about glance at Mara as she walks by.
      else if (hero.isWalking && !a.isWalking && !m.task && Math.hypot(hero.sprite.x - a.sprite.x, hero.sprite.y - a.sprite.y) < 80) a.lookAt(hero.sprite.x);
      this.placeProp(m);
    }
    if (this.bubble) {
      const { owner, text, until } = this.bubble;
      if (this.host.busy() || owner.away || owner.gone || !owner.actor.sprite.active || this.host.scene.time.now > until) this.clearBubble();
      else this.host.bubble(text, owner.actor.headPoint());
    }
  }

  /** Keeps a held thing in the hand (or on the shoulder), lit like its holder. */
  private placeProp(m: Member): void {
    const prop = m.prop;
    if (!prop) return;
    const kind: Carry = m.def.carry === 'sack' ? 'sack' : m.def.carry!;
    const s = m.actor.sprite;
    const d = m.actor.perspective * m.def.body;
    const side = s.flipX ? -1 : 1;
    const hold = HOLD[kind];
    const crouched = m.task === 'work' || m.task === 'sit';
    const sway = m.task === 'sweep' && !this.calm ? Math.sin(this.host.scene.time.now / 160) * 16 : m.task === 'work' && kind === 'shovel' && !this.calm ? Math.sin(this.host.scene.time.now / 260) * 10 : 0;
    prop.setVisible(!m.away && s.visible)
      .setOrigin(hold.origin[0], hold.origin[1])
      .setPosition(s.x + side * hold.x * d, s.y - hold.y * d * (crouched ? 0.72 : 1))
      .setAngle(side * (hold.angle + sway))
      .setFlipX(side < 0)
      .setScale(d)
      .setAlpha(s.alpha)
      .setTint(s.tintTopLeft)
      .setDepth(s.depth + (kind === 'sack' ? 0.2 : 0.1));
  }

  // --------------------------------------------------------------- chatter ---
  private scheduleChatter(): void {
    this.chatter = this.host.scene.time.delayedCall(Phaser.Math.Between(CHATTER_MIN, CHATTER_MAX), () => {
      if (!this.alive) return;
      this.chat();
      this.scheduleChatter();
    });
  }

  /** Someone says something to no one in particular (a bubble; not in the history). */
  chat(): void {
    if (this.host.busy() || this.bubble) return;
    const list = this.visible().filter(m => !m.held);
    if (!list.length) return;
    const m = list[Math.floor(Math.random() * list.length)];
    const { key: prefix, count } = lineKind(m.def, 'chat', this.mood);
    const key = `${prefix}.${1 + Math.floor(Math.random() * count)}`;
    this.say(m, t(key));
  }

  private say(m: Member, text: string): void {
    this.bubble = { owner: m, text, until: this.host.scene.time.now + BUBBLE_MS };
    this.host.bubble(text, m.actor.headPoint());
  }

  private clearBubble(): void {
    this.bubble = null;
    this.host.bubble('');
  }

  /** For tests and the debug overlay. */
  snapshot(): { id: string; x: number; y: number; task: Task | null; away: boolean; gone: boolean; walking: boolean }[] {
    return this.members.map(m => ({
      id: m.def.id, x: Math.round(m.actor.sprite.x), y: Math.round(m.actor.sprite.y), task: m.task, away: m.away, gone: m.gone, walking: m.actor.isWalking,
    }));
  }

  /** Name for hover, reveal and Tab. */
  name(m: Member): string {
    return t(`name.${m.def.id}`);
  }
}
