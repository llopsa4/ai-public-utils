import Phaser from 'phaser';
import { DIALOGUES } from '../content/dialogue';
import { ACTOR_VERBS, ITEM_VERBS, interact } from '../content/interactions';
import { LINE_MOODS } from '../content/moods';
import { ROOMS } from '../content/rooms';
import { resolveNode } from '../engine/dialogue';
import { conditionsHold, pointInPolygon } from '../engine/geometry';
import { t } from '../engine/i18n';
import { WalkArea } from '../engine/pathfinding';
import { settings } from '../engine/settings';
import { sound } from '../audio/sound';
import { SECRET_FLAGS, applyCommand } from '../engine/state';
import type { ActorId, Command, HotspotDef, ObjectDef, Point, RoomDef, Verb } from '../engine/types';
import { Actor, SHADOW_DEPTH } from './Actor';
import { Atmosphere, createAtmosphereTextures, highQuality } from './atmosphere';
import { addLight, localLight, mixColor } from '../engine/lighting';
import { FOREGROUND_IMAGES, LAZY_SHEETS, NPC_SHEETS, ROOM_IMAGES, SHEETS, tagFrame } from './assets';
import type { Session } from './session';
import { ART_SCALE, LOGICAL_H, LOGICAL_W } from '../ui/ui';
import { cursorFor, type CursorKind } from '../ui/cursors';

const FADE_MS = 280;
/** How far Mara walks past a doorway on leaving, and in from it on arriving (world units). */
const DOORWAY_STEP = 26;
const FACE_VECTOR: Record<string, Point> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
/** NPCs turn toward Mara within this distance. */
const NOTICE_DISTANCE = 90;
/** Cool, dimmed tint for Cinderfold once the kiln is shut down. */
const COLD_TINT = 0x8796b8;

/** Queues a sheet for loading unless it is already loaded or queued. */
function queueSheet(scene: Phaser.Scene, key: string): void {
  if (!scene.textures.exists(key)) scene.load.atlas(key, SHEETS[key].png, SHEETS[key].json);
}

/** One animation per frame tag of a loaded sheet, keyed `<sheet>:<tag>` (once per sheet). */
function createSheetAnims(scene: Phaser.Scene, key: string): void {
  const { json } = SHEETS[key];
  for (const tag of json.meta.frameTags) {
    if (scene.anims.exists(`${key}:${tag.name}`)) continue;
    const frames = json.frames.slice(tag.from, tag.to + 1);
    if (tag.direction === 'reverse') frames.reverse();
    const average = frames.reduce((sum, f) => sum + f.duration, 0) / frames.length;
    scene.anims.create({
      key: `${key}:${tag.name}`,
      frames: frames.map(f => ({ key, frame: f.filename })),
      frameRate: 1000 / average,
      repeat: frames.length > 1 ? -1 : 0,
      yoyo: tag.direction === 'pingpong',
    });
  }
}

/** Loads the shared sheets (props and Mara) and builds their animations. */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload(): void {
    for (const key of Object.keys(SHEETS)) if (!LAZY_SHEETS.has(key)) queueSheet(this, key);
    // Room backgrounds, foreground pieces and the other characters load per room, when first needed.
  }

  create(): void {
    // Shared effect textures: a soft dot for particles and a radial glow for light pools.
    const dot = this.make.graphics({ x: 0, y: 0 }, false);
    dot.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    dot.generateTexture('fx-dot', 16, 16);
    dot.destroy();
    const glow = this.textures.createCanvas('fx-glow', 128, 128);
    if (glow) {
      const ctx = glow.getContext();
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      glow.refresh();
    }
    createAtmosphereTextures(this);
    // Contact shadow: a soft dark ellipse, stretched per actor and prop.
    const shadow = this.textures.createCanvas('fx-shadow', 128, 32);
    if (shadow) {
      const ctx = shadow.getContext();
      ctx.setTransform(1, 0, 0, 0.25, 0, 0);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,0.85)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.45)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      shadow.refresh();
    }
    for (const key of Object.keys(SHEETS)) if (this.textures.exists(key)) createSheetAnims(this, key);
    document.getElementById('loading')?.remove();
    this.scene.start('title');
  }
}

/** The title screen: the kiln hall in low light, Mara, drifting embers and the DOM title menu. */
export class TitleScene extends Phaser.Scene {
  constructor(private readonly session: Session) { super('title'); }

  /** The kiln-hall backdrop, and the room the game will open in so it is ready behind the menu. */
  preload(): void {
    const start = ROOMS[this.session.state.room].background;
    for (const key of new Set(['room-mara', start])) if (!this.textures.exists(key)) this.load.image(key, ROOM_IMAGES[key]);
  }

  create(): void {
    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    this.add.image(0, 0, 'room-mara').setOrigin(0, 0).setScale(1 / ART_SCALE).setTint(0x6a5a58);
    const mara = new Actor(this, 'hero', 'mara', 470, 352, 'left', 'stand', { farY: 0, farScale: 1.45, nearY: 360, nearScale: 1.45 });
    mara.sprite.setTint(0xe8c8a8);
    if (!settings().reducedMotion) {
      this.add.particles(0, 120, 'fx-dot', particleConfig('embers', LOGICAL_W, 240)).setDepth(1000);
    }
    this.cameras.main.fadeIn(600, 0, 0, 0);
    sound.ambience('kiln');
    sound.music('warm');
    this.session.onTitleShown();
  }
}

type Target = { kind: 'hotspot'; hotspot: HotspotDef } | { kind: 'actor'; actor: Actor };

/** Multiplies a colour by a brightness factor and a second colour (both as 0xRRGGBB). */
function multiplyColor(color: number, factor: number, other: number): number {
  const ch = (c: number, shift: number) => ((c >> shift) & 255) / 255;
  const r = Math.round(ch(color, 16) * ch(other, 16) * factor * 255);
  const g = Math.round(ch(color, 8) * ch(other, 8) * factor * 255);
  const b = Math.round(ch(color, 0) * ch(other, 0) * factor * 255);
  return (r << 16) | (g << 8) | b;
}

export function particleConfig(kind: 'embers' | 'steam' | 'dust' | 'ash', w: number, h: number): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  const area = { x: { min: 0, max: w }, y: { min: 0, max: h } };
  switch (kind) {
    case 'embers':
      return { ...area, lifespan: { min: 2200, max: 4200 }, speedY: { min: -26, max: -8 }, speedX: { min: -6, max: 6 }, scale: { start: 0.22, end: 0 },
        alpha: { start: 1, end: 0 }, tint: [0xffc060, 0xff8a2a, 0xff6a1a], frequency: 240, blendMode: 'ADD' };
    case 'steam':
      return { ...area, lifespan: { min: 2600, max: 4000 }, speedY: { min: -10, max: -3 }, speedX: { min: -3, max: 3 }, scale: { start: 0.5, end: 1.8 },
        alpha: { start: 0.18, end: 0 }, tint: 0xf4efe6, frequency: 380 };
    case 'dust':
      return { ...area, lifespan: { min: 5000, max: 8000 }, speedY: { min: -2, max: 2 }, speedX: { min: -3, max: 3 }, scale: { min: 0.06, max: 0.12 },
        alpha: { start: 0.6, end: 0 }, tint: 0xffe2b0, frequency: 420, blendMode: 'ADD' };
    case 'ash':
      return { ...area, lifespan: { min: 6000, max: 9000 }, speedY: { min: 2, max: 7 }, speedX: { min: 4, max: 12 }, scale: { min: 0.08, max: 0.16 },
        alpha: { start: 0.55, end: 0 }, tint: [0xd8d0c8, 0xffb070], frequency: 260 };
  }
}

/** One room: background, objects, characters, input and the command/dialogue runner. */
export class RoomScene extends Phaser.Scene {
  private room!: RoomDef;
  private area!: WalkArea;
  private hero!: Actor;
  private background!: Phaser.GameObjects.Image;
  private actors = new Map<ActorId, Actor>();
  private objects = new Map<string, Phaser.GameObjects.Sprite>();
  private objectShadows = new Map<string, Phaser.GameObjects.Image>();
  private foreground: Phaser.GameObjects.Image[] = [];
  private ambient: Phaser.GameObjects.GameObject[] = [];
  private ambientCold: boolean | null = null;
  private atmosphere!: Atmosphere;
  /** Last cold state seen, to animate the shutdown when it happens in this room (null until created). */
  private knownCold: boolean | null = null;
  /** Cold factor last applied to the background tint (Low quality). */
  private tintedCold = -1;
  private lastExitClick = { id: '', time: 0 };
  /** Keyboard play: index into focusTargets(), -1 = nothing focused. */
  private focusIndex = -1;
  private focusRing: Phaser.GameObjects.Graphics | null = null;
  private busy = false;
  private leaving = false;

  constructor(private readonly session: Session) { super('room'); }

  isBusy(): boolean {
    return this.busy || this.leaving;
  }

  /** Loads this room's background and foreground pieces if they are not cached yet. */
  preload(): void {
    const room = ROOMS[this.session.state.room];
    const state = this.session.state;
    if (state.flags.hasGauntlet) queueSheet(this, 'mara-gauntlet');
    for (const a of room.actors) if (conditionsHold(state, a.visibleIf)) queueSheet(this, NPC_SHEETS[a.id]);
    if (!this.textures.exists(room.background)) this.load.image(room.background, ROOM_IMAGES[room.background]);
    for (const f of room.foreground ?? []) {
      if (!this.textures.exists(`fg-${f.image}`)) this.load.image(`fg-${f.image}`, FOREGROUND_IMAGES[f.image]);
    }
  }

  create(): void {
    const state = this.session.state;
    this.room = ROOMS[state.room];
    for (const key of Object.keys(SHEETS)) if (this.textures.exists(key)) createSheetAnims(this, key);
    this.area = new WalkArea(this.room.walkable.outer, this.room.walkable.holes);
    this.actors = new Map();
    this.objects = new Map();
    this.objectShadows = new Map();
    this.foreground = (this.room.foreground ?? []).map(f =>
      this.add.image(f.x, f.y, `fg-${f.image}`).setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(f.depth));
    this.ambient = [];
    this.ambientCold = null;
    this.knownCold = null;
    this.tintedCold = -1;
    this.focusIndex = -1;
    this.focusRing = this.add.graphics().setDepth(99999);
    this.busy = false;
    this.leaving = false;

    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    this.background = this.add.image(0, 0, this.room.background).setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(-10000);
    this.atmosphere = new Atmosphere(this, this.room, this.isCold());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.atmosphere.destroy());
    for (const def of this.room.objects) {
      const sprite = this.add.sprite(def.x, def.y, def.sheet, SHEETS[def.sheet].json.frames[0].filename).setOrigin(0.5, 1).setScale(1 / ART_SCALE).setDepth(def.depth ?? def.y);
      if (def.anim) sprite.play(`${def.sheet}:${def.anim}`);
      this.objects.set(def.id, sprite);
      if (def.shadow) {
        this.objectShadows.set(def.id, this.add.image(def.x, def.y, 'fx-shadow').setDisplaySize(def.shadow, def.shadow * 0.18)
          .setAlpha(0.5).setDepth(SHADOW_DEPTH));
      }
    }

    const start = this.area.clamp(state.hero);
    state.hero.x = start.x;
    state.hero.y = start.y;
    this.hero = new Actor(this, 'hero', this.heroSheet(), start.x, start.y, state.hero.face, state.hero.pose, this.room.scale);
    this.actors.set('hero', this.hero);
    for (const a of this.room.actors) {
      if (!conditionsHold(state, a.visibleIf)) continue;
      const s = state.npcs[a.id];
      this.actors.set(a.id, new Actor(this, a.id, NPC_SHEETS[a.id], a.x, a.y, s.face, s.pose, this.room.scale));
    }
    // After the actors exist: refreshObjects also updates the hero's sheet, the cold tint and ambience.
    this.refreshObjects();
    this.updateLighting();
    if (this.session.debug) this.drawDebug();

    this.input.mouse?.disableContextMenu();
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on(Phaser.Input.Events.GAME_OUT, () => this.session.ui.setHover(''));

    this.hero.onStep = () => sound.step(this.room.surface ?? 'stone');
    if (!state.flags.hasGauntlet) this.preloadGauntletSheet();
    for (const [id, actor] of this.actors) if (id !== 'hero') this.scheduleFidget(actor);

    this.session.ui.setHover('');
    this.session.ui.setBusy(false);
    this.session.ui.renderInventory();
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
    if (this.session.arrival) this.walkIn(this.session.arrival);
    else this.session.autosave();
    this.session.arrival = null;
  }

  /** On arrival Mara starts just beyond the doorway and walks in to the entry point. */
  private walkIn(entryId: string): void {
    const entry = this.room.entries[entryId];
    if (!entry) return;
    const v = FACE_VECTOR[entry.face];
    this.hero.sprite.setPosition(entry.x - v.x * DOORWAY_STEP, entry.y - v.y * DOORWAY_STEP);
    this.busy = true;
    this.session.ui.setBusy(true);
    void this.hero.walk([{ x: entry.x, y: entry.y }]).then(() => {
      this.hero.setFacing(entry.face);
      this.syncHero();
      if (this.leaving) return;
      this.busy = false;
      this.session.ui.setBusy(false);
      this.session.autosave();
    });
  }

  private scheduleFidget(actor: Actor): void {
    this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => {
      if (!actor.sprite.active) return;
      if (!this.busy) actor.fidget();
      this.scheduleFidget(actor);
    });
  }

  /** Walk area (green), holes (red), hotspots (yellow) and approach points, for fitting art. */
  private drawDebug(): void {
    const g = this.add.graphics().setDepth(100000);
    const poly = (points: Point[], color: number) => g.lineStyle(1, color, 0.9).strokePoints(points as Phaser.Types.Math.Vector2Like[], true);
    poly(this.room.walkable.outer, 0x40ff60);
    for (const h of this.room.walkable.holes) poly(h, 0xff4040);
    for (const h of this.room.hotspots) {
      poly(h.polygon, 0xffd040);
      if (h.walkTo) g.fillStyle(0x40c0ff, 1).fillCircle(h.walkTo.x, h.walkTo.y, 2);
    }
    for (const e of Object.values(this.room.entries)) g.fillStyle(0xff40ff, 1).fillCircle(e.x, e.y, 3);
  }

  /** Mara with the gauntlet lit once the cell is fitted (as soon as that sheet has loaded). */
  private heroSheet(): string {
    return this.session.state.flags.hasGauntlet && this.textures.exists('mara-gauntlet') ? 'mara-gauntlet' : 'mara';
  }

  /** In the tent, the lit-gauntlet sheet loads in the background while the player looks around. */
  private preloadGauntletSheet(): void {
    if (this.textures.exists('mara-gauntlet')) return;
    queueSheet(this, 'mara-gauntlet');
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (!this.sys.isActive()) return;
      createSheetAnims(this, 'mara-gauntlet');
      this.refreshObjects();
    });
    this.load.start();
  }

  // ------------------------------------------------------------------ input ---
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const ui = this.session.ui;
    this.clearFocus();
    if (this.isBusy()) { ui.skip(); return; }
    if (pointer.rightButtonDown()) {
      this.session.selectItem(null);
      return;
    }
    const at = { x: pointer.worldX, y: pointer.worldY };
    const target = this.hitTest(at);
    const item = this.session.selectedItem;

    if (item) {
      this.session.selectItem(null);
      if (target) void this.runScript(interact(this.session.state, 'use', this.targetId(target), item));
      else void this.walkTo(at);
      return;
    }
    if (target && target.kind === 'hotspot' && target.hotspot.verbs.includes('go')) {
      const now = this.time.now;
      if (this.lastExitClick.id === target.hotspot.id && now - this.lastExitClick.time < 400) {
        ui.closeRadial();
        this.lastExitClick = { id: '', time: 0 };
        void this.runScript(interact(this.session.state, 'go', target.hotspot.id).filter(c => c.type !== 'walk'));
        return;
      }
      this.lastExitClick = { id: target.hotspot.id, time: now };
    }
    if (target) {
      this.openTargetRing(target, at);
      return;
    }
    void this.walkTo(at);
  }

  private openTargetRing(target: Target, at: Point): void {
    const id = this.targetId(target);
    const verbs: Verb[] = target.kind === 'actor' ? ACTOR_VERBS[target.actor.id] : target.hotspot.verbs;
    sound.blip();
    this.session.ui.openRadial(at, this.targetName(target), verbs, verb => {
      void this.runScript(interact(this.session.state, verb, id));
    });
  }

  // ---------------------------------------------------------- keyboard play ---
  /** Everything Tab can reach, left to right (secrets stay hidden). */
  private focusTargets(): { target: Target; box: Phaser.Geom.Rectangle }[] {
    const state = this.session.state;
    const list: { target: Target; box: Phaser.Geom.Rectangle }[] = [];
    for (const hotspot of this.room.hotspots) {
      if (hotspot.secret || !conditionsHold(state, hotspot.visibleIf)) continue;
      const xs = hotspot.polygon.map(p => p.x), ys = hotspot.polygon.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      list.push({ target: { kind: 'hotspot', hotspot }, box: new Phaser.Geom.Rectangle(x, y, Math.max(...xs) - x, Math.max(...ys) - y) });
    }
    for (const actor of this.actors.values()) list.push({ target: { kind: 'actor', actor }, box: actor.hitBox() });
    return list.sort((a, b) => a.box.centerX - b.box.centerX);
  }

  /** Moves the focus ring. Returns false when it runs past either end (focus then goes to the bar). */
  cycleFocus(direction: 1 | -1): boolean {
    if (this.isBusy()) return false;
    const targets = this.focusTargets();
    const next = this.focusIndex === -1 ? (direction === 1 ? 0 : targets.length - 1) : this.focusIndex + direction;
    if (next < 0 || next >= targets.length) { this.clearFocus(); return false; }
    this.focusIndex = next;
    const { target, box } = targets[next];
    const pad = 3;
    this.focusRing?.clear().lineStyle(1.5, 0xe7c046, 1).strokeRoundedRect(box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2, 4);
    this.session.ui.setHover(this.targetName(target), { x: box.centerX, y: box.y });
    this.session.ui.announce(this.targetName(target));
    return true;
  }

  activateFocus(): boolean {
    if (this.focusIndex === -1 || this.isBusy()) return false;
    const entry = this.focusTargets()[this.focusIndex];
    if (!entry) return false;
    this.openTargetRing(entry.target, { x: entry.box.centerX, y: entry.box.centerY });
    return true;
  }

  private clearFocus(): void {
    this.focusIndex = -1;
    this.focusRing?.clear();
  }

  /** Name labels for every interactive thing in the room (hold Space / eye button). */
  hotspotLabels(): { text: string; x: number; y: number }[] {
    const state = this.session.state;
    const labels = this.room.hotspots
      .filter(h => !h.secret && conditionsHold(state, h.visibleIf))
      .map(h => {
        const xs = h.polygon.map(p => p.x), ys = h.polygon.map(p => p.y);
        return { text: t(h.name), x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      });
    for (const [id, actor] of this.actors) labels.push({ text: t(`name.${id}`), ...actor.headPoint() });
    return labels;
  }

  /** Action ring for an inventory item, shown just above the bar. */
  openItemRing(item: string, index: number): void {
    if (this.isBusy()) return;
    sound.blip();
    const at = { x: 70 + index * 46, y: 300 };
    this.session.ui.openRadial(at, t(`name.${item}`), ITEM_VERBS, verb => {
      if (verb === 'use') this.session.selectItem(item);
      else void this.runScript(interact(this.session.state, verb, `item:${item}`));
    });
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.wasTouch) return;
    const at = { x: pointer.worldX, y: pointer.worldY };
    const target = this.isBusy() ? null : this.hitTest(at);
    const item = this.session.selectedItem;
    const name = target ? this.targetName(target) : '';
    if (item) {
      const itemName = t(`name.${item}`);
      this.session.ui.setHover(name ? t('ui.useWith', { item: itemName, target: name }) : t('ui.useWithNothing', { item: itemName }), at);
    } else {
      this.session.ui.setHover(name, at);
    }
    // While an item is carried, the stage shows the item's icon as the cursor instead.
    this.input.setDefaultCursor(item ? '' : cursorFor(target ? this.cursorKind(target) : null));
  }

  /** What a click on the target will most likely do: talk, leave, handle or look. */
  private cursorKind(target: Target): CursorKind {
    if (target.kind === 'actor') return target.actor.id === 'hero' ? 'look' : 'talk';
    const verbs = target.hotspot.verbs;
    if (verbs.includes('go')) return 'exit';
    if (verbs.includes('talk')) return 'talk';
    if (verbs.some(v => v === 'take' || v === 'use' || v === 'open')) return 'hand';
    return 'look';
  }

  private hitTest(p: Point): Target | null {
    const actors = [...this.actors.values()].sort((a, b) => b.sprite.depth - a.sprite.depth);
    for (const actor of actors) if (actor.hitBox().contains(p.x, p.y)) return { kind: 'actor', actor };
    for (const hotspot of this.room.hotspots) {
      if (conditionsHold(this.session.state, hotspot.visibleIf) && pointInPolygon(p, hotspot.polygon)) return { kind: 'hotspot', hotspot };
    }
    return null;
  }

  private targetId(target: Target): string {
    return target.kind === 'actor' ? target.actor.id : target.hotspot.id;
  }

  private targetName(target: Target): string {
    return t(target.kind === 'actor' ? `name.${target.actor.id}` : target.hotspot.name);
  }

  // --------------------------------------------------------------- movement ---
  /** Free walking from a click; a new click interrupts it. */
  private async walkTo(target: Point): Promise<void> {
    const state = this.session.state;
    if (this.hero.pose !== 'stand') { this.hero.setPose('stand'); state.hero.pose = 'stand'; }
    if (await this.hero.walk(this.area.findPath(this.hero.position, target))) {
      this.syncHero();
      this.session.autosave();
    } else {
      this.syncHero();
    }
  }

  private syncHero(): void {
    const h = this.session.state.hero;
    h.x = Math.round(this.hero.position.x);
    h.y = Math.round(this.hero.position.y);
    h.face = this.hero.face;
    h.pose = this.hero.pose;
  }

  private objectPosition(def: ObjectDef): Point {
    const moved = def.movedTo && this.session.state.flags[def.movedTo.flag];
    return moved ? { x: def.movedTo!.x, y: def.movedTo!.y } : { x: def.x, y: def.y };
  }

  private refreshObjects(): void {
    const state = this.session.state;
    for (const def of this.room.objects) {
      const sprite = this.objects.get(def.id)!;
      sprite.setVisible(conditionsHold(state, def.visibleIf));
      if (def.flag && !def.anim) {
        const tag = state.flags[def.flag] ? def.whenTrue : def.whenFalse;
        if (tag) sprite.setFrame(tagFrame(def.sheet, tag));
      }
      if (def.movedTo && !this.tweens.isTweening(sprite)) {
        const p = this.objectPosition(def);
        sprite.setPosition(p.x, p.y).setDepth(def.depth ?? p.y);
      }
      this.objectShadows.get(def.id)?.setVisible(sprite.visible).setPosition(sprite.x, sprite.y - 1);
    }
    if (this.hero?.sprite.active) this.hero.setSheet(this.heroSheet());
    this.applyTint();
  }

  private isCold(): boolean {
    return this.room.coldIf ? conditionsHold(this.session.state, this.room.coldIf) : false;
  }

  /**
   * The kiln's cold: on High the camera grade shifts (Atmosphere); on Low the scenery is tinted.
   * Either way it fades in over three seconds when it happens in front of the player.
   */
  private applyTint(): void {
    const cold = this.isCold();
    const animate = this.knownCold === false && cold;
    this.knownCold = cold;
    this.atmosphere.setCold(cold, animate);
    this.tintScenery();
    this.refreshAmbient(cold, animate);
    sound.ambience(this.room.id === 'ashways' ? 'wind' : cold ? 'cold' : 'kiln');
    sound.music(cold ? 'cold' : this.room.music ?? 'warm');
  }

  private coldTint(): number {
    return this.room.coldTint ?? COLD_TINT;
  }

  /** Low quality: tints the background, props and foreground by the (animated) cold factor. */
  private tintScenery(): void {
    const k = this.atmosphere.enabled ? 0 : this.atmosphere.cold;
    if (k === this.tintedCold) return;
    this.tintedCold = k;
    const tint = mixColor(0xffffff, this.coldTint(), k);
    for (const o of [this.background, ...this.objects.values(), ...this.foreground]) {
      if (k === 0) o.clearTint(); else o.setTint(tint);
    }
  }

  update(time: number): void {
    this.updateLighting();
    if (!this.hero?.sprite.active) return;
    this.tintScenery();
    if (this.atmosphere.enabled) this.atmosphere.updateReflections([...this.actors.values()].map(a => a.sprite), time);
    for (const [id, actor] of this.actors) {
      if (id === 'hero' || this.busy) continue;
      const d = Math.hypot(actor.sprite.x - this.hero.sprite.x, actor.sprite.y - this.hero.sprite.y);
      if (d < NOTICE_DISTANCE) actor.lookAt(this.hero.sprite.x);
    }
  }

  /**
   * Characters take the room's light, darker toward the back, warmer near kiln mouths, hearths and
   * lanterns (the room's glows), cooled once the kiln is cold (on Low; High grades the whole camera).
   */
  private updateLighting(): void {
    const light = this.room?.light;
    if (!light || !this.atmosphere) return;
    const cold = this.atmosphere.cold;
    const coldTint = this.atmosphere.enabled ? 0xffffff : mixColor(0xffffff, this.coldTint(), cold);
    const sources = this.room.ambient?.glows ?? [];
    const { farY, nearY } = this.room.scale;
    for (const actor of this.actors.values()) {
      const t = Phaser.Math.Clamp((actor.sprite.y - farY) / (nearY - farY), 0, 1);
      const dim = light.farDim + (1 - light.farDim) * t;
      const chest = { x: actor.sprite.x, y: actor.sprite.y - 40 * actor.sprite.scaleY * ART_SCALE };
      actor.sprite.setTint(addLight(multiplyColor(light.tint, dim, coldTint), localLight(chest, sources, cold)));
    }
  }

  /**
   * Particles and flickering light pools; warm ones go out with the kiln (fading over three seconds
   * when it happens in front of the player). Off with reduced motion. On High each glow also gets a
   * wide, faint bloom halo.
   */
  private refreshAmbient(cold: boolean, animate = false): void {
    if (this.ambientCold === cold && this.ambient.length) return;
    this.ambientCold = cold;
    const old = this.ambient;
    this.ambient = [];
    if (animate) {
      for (const o of old) {
        if (o instanceof Phaser.GameObjects.Particles.ParticleEmitter) o.stop();
        else this.tweens.killTweensOf(o);
        this.tweens.add({ targets: o, alpha: 0, duration: 3000, onComplete: () => o.destroy() });
      }
    } else {
      for (const o of old) o.destroy();
    }
    const def = this.room.ambient;
    if (!def || settings().reducedMotion) return;
    const bloom = highQuality(this);
    for (const p of def.particles ?? []) {
      if (cold && p.warm) continue;
      this.ambient.push(this.add.particles(p.x, p.y, 'fx-dot', particleConfig(p.kind, p.w, p.h)).setDepth(p.kind === 'dust' ? 9000 : -5000));
    }
    for (const g of def.glows ?? []) {
      if (cold && g.warm) continue;
      const light = this.add.image(g.x, g.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(g.color)
        .setScale((g.r * 2) / 128).setAlpha(0.35).setDepth(-5000);
      this.tweens.add({ targets: light, alpha: { from: 0.22, to: 0.42 }, duration: Phaser.Math.Between(180, 420), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 300) });
      this.ambient.push(light);
      if (bloom) {
        const halo = this.add.image(g.x, g.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(g.color)
          .setScale((g.r * 5) / 128).setAlpha(0.1).setDepth(8500);
        this.tweens.add({ targets: halo, alpha: { from: 0.07, to: 0.13 }, duration: Phaser.Math.Between(600, 1100), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.ambient.push(halo);
      }
    }
  }

  // ----------------------------------------------------------------- script ---
  /** Plays interaction commands in order. Input only skips speech until it finishes. */
  async runScript(commands: Command[]): Promise<void> {
    if (this.isBusy() || commands.length === 0) return;
    this.busy = true;
    this.clearFocus();
    this.hero.stop();
    this.syncHero();
    this.session.ui.setBusy(true);
    this.session.ui.setHover('');
    try {
      for (const command of commands) {
        if (!(await this.exec(command))) return;
      }
    } finally {
      if (this.sys.isActive() && !this.leaving) {
        this.busy = false;
        this.session.ui.setBusy(false);
        this.session.ui.renderInventory();
        this.session.autosave();
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  private async say(actorId: ActorId, key: string, at?: Point): Promise<void> {
    const actor = this.actors.get(actorId);
    const point = actor?.headPoint() ?? at ?? { x: 320, y: 60 };
    await this.session.ui.say(actorId, t(key), point, LINE_MOODS[key]);
  }

  /** Executes one command. Returns false when the script must stop (room change or the end). */
  private async exec(command: Command): Promise<boolean> {
    const state = this.session.state;
    switch (command.type) {
      case 'walk': {
        if (this.hero.pose !== 'stand') this.hero.setPose('stand');
        await this.hero.walk(this.area.findPath(this.hero.position, command.to));
        if (command.face) this.hero.setFacing(command.face);
        this.syncHero();
        return true;
      }
      case 'face':
        this.actors.get(command.actor)?.setFacing(command.face);
        applyCommand(state, command);
        return true;
      case 'pose':
        this.actors.get(command.actor)?.setPose(command.pose);
        applyCommand(state, command);
        return true;
      case 'say':
        await this.say(command.actor, command.text, command.at);
        return true;
      case 'setFlag':
      case 'addItem':
      case 'removeItem':
        if (command.type === 'addItem') sound.pickup();
        if (command.type === 'setFlag' && command.value && command.flag === 'latchFixed') sound.latch();
        if (command.type === 'setFlag' && command.value && command.flag === 'valveVented') sound.hiss();
        const newSecret = command.type === 'setFlag' && command.value && !state.flags[command.flag]
          && (SECRET_FLAGS as readonly string[]).includes(command.flag);
        applyCommand(state, command);
        if (newSecret) {
          sound.choose();
          const found = SECRET_FLAGS.filter(f => state.flags[f]).length;
          this.session.ui.toast(t('ui.secretFound', { found: String(found), total: String(SECRET_FLAGS.length) }));
        }
        this.refreshObjects();
        this.session.ui.renderInventory();
        return true;
      case 'looked':
        applyCommand(state, command);
        return true;
      case 'wait':
        await this.wait(command.ms);
        return true;
      case 'shake':
        sound.rumble(command.ms);
        if (!settings().reducedMotion) this.cameras.main.shake(command.ms, 0.004);
        await this.wait(Math.min(command.ms, 400));
        return true;
      case 'moveObject': {
        const sprite = this.objects.get(command.id);
        if (!sprite) return true;
        const sheet = this.room.objects.find(o => o.id === command.id)!.sheet;
        const idle = sprite.anims.currentAnim?.key;
        if (this.anims.exists(`${sheet}:scurry`)) sprite.play(`${sheet}:scurry`);
        if (sheet === 'sweeper') sound.brushes(command.ms);
        await new Promise<void>(resolve => this.tweens.add({
          targets: sprite, x: command.x, y: command.y, duration: command.ms, ease: 'Sine.easeInOut',
          onUpdate: () => { sprite.setDepth(sprite.y); this.objectShadows.get(command.id)?.setPosition(sprite.x, sprite.y - 1); },
          onComplete: () => resolve(),
        }));
        if (idle) sprite.play(idle);
        return true;
      }
      case 'dialogue':
        await this.runDialogue(command.id);
        return true;
      case 'room': {
        this.leaving = true;
        this.session.ui.closeRadial();
        const v = FACE_VECTOR[this.hero.face];
        const out = { x: this.hero.position.x + v.x * DOORWAY_STEP, y: this.hero.position.y + v.y * DOORWAY_STEP };
        void this.hero.walk([out]);
        this.cameras.main.fadeOut(FADE_MS + 60, 0, 0, 0);
        await this.wait(FADE_MS + 80);
        this.hero.stop();
        applyCommand(state, command);
        this.session.arrival = command.entry;
        this.scene.restart();
        return false;
      }
      case 'end':
        this.leaving = true;
        this.cameras.main.fadeOut(900, 0, 0, 0);
        await this.wait(700);
        this.session.ui.showEnd();
        return false;
    }
  }

  private async runDialogue(id: string): Promise<void> {
    const tree = DIALOGUES[id];
    const state = this.session.state;
    let nodeId: string | null = tree.start;
    while (nodeId) {
      const node = resolveNode(tree, nodeId, state);
      for (const line of node.lines) await this.say(line.actor, line.text);
      for (const [flag, value] of Object.entries(node.set)) applyCommand(state, { type: 'setFlag', flag, value });
      for (const item of node.items) applyCommand(state, { type: 'addItem', item });
      if (node.items.length > 0) this.session.ui.renderInventory();
      if (node.choices.length > 0) {
        const index = await this.session.ui.choose(node.choices.map(c => t(c.text)));
        sound.choose();
        const choice = node.choices[index];
        await this.say('hero', choice.text);
        nodeId = choice.next;
      } else {
        nodeId = node.next;
      }
    }
  }
}
