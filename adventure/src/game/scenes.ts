import Phaser from 'phaser';
import { DIALOGUES } from '../content/dialogue';
import { ACTOR_VERBS, ITEM_VERBS, interact } from '../content/interactions';
import { ROOMS } from '../content/rooms';
import { resolveNode } from '../engine/dialogue';
import { conditionsHold, pointInPolygon } from '../engine/geometry';
import { t } from '../engine/i18n';
import { WalkArea } from '../engine/pathfinding';
import { settings } from '../engine/settings';
import { applyCommand } from '../engine/state';
import type { ActorId, Command, HotspotDef, ObjectDef, Point, RoomDef, Verb } from '../engine/types';
import { Actor } from './Actor';
import { FOREGROUND_IMAGES, NPC_SHEETS, ROOM_IMAGES, SHEETS, tagFrame } from './assets';
import type { Session } from './session';
import { ART_SCALE, LOGICAL_H, LOGICAL_W } from '../ui/ui';

const FADE_MS = 280;
/** Cool, dimmed tint for Cinderfold once the kiln is shut down. */
const COLD_TINT = 0x8796b8;

/** Loads every sheet and builds one animation per frame tag, keyed `<sheet>:<tag>`. */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload(): void {
    for (const [key, sheet] of Object.entries(SHEETS)) this.load.atlas(key, sheet.png, sheet.json);
    for (const [key, url] of Object.entries(ROOM_IMAGES)) this.load.image(key, url);
    for (const [key, url] of Object.entries(FOREGROUND_IMAGES)) this.load.image(`fg-${key}`, url);
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
    for (const [key, { json }] of Object.entries(SHEETS)) {
      for (const tag of json.meta.frameTags) {
        const frames = json.frames.slice(tag.from, tag.to + 1);
        if (tag.direction === 'reverse') frames.reverse();
        const average = frames.reduce((sum, f) => sum + f.duration, 0) / frames.length;
        this.anims.create({
          key: `${key}:${tag.name}`,
          frames: frames.map(f => ({ key, frame: f.filename })),
          frameRate: 1000 / average,
          repeat: frames.length > 1 ? -1 : 0,
          yoyo: tag.direction === 'pingpong',
        });
      }
    }
    document.getElementById('loading')?.remove();
    this.scene.start('room');
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

function particleConfig(kind: 'embers' | 'steam' | 'dust' | 'ash', w: number, h: number): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
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
  private foreground: Phaser.GameObjects.Image[] = [];
  private ambient: Phaser.GameObjects.GameObject[] = [];
  private ambientCold: boolean | null = null;
  private busy = false;
  private leaving = false;

  constructor(private readonly session: Session) { super('room'); }

  isBusy(): boolean {
    return this.busy || this.leaving;
  }

  create(): void {
    const state = this.session.state;
    this.room = ROOMS[state.room];
    this.area = new WalkArea(this.room.walkable.outer, this.room.walkable.holes);
    this.actors = new Map();
    this.objects = new Map();
    this.foreground = (this.room.foreground ?? []).map(f =>
      this.add.image(f.x, f.y, `fg-${f.image}`).setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(f.depth));
    this.ambient = [];
    this.ambientCold = null;
    this.busy = false;
    this.leaving = false;

    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    this.background = this.add.image(0, 0, this.room.background).setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(-10000);
    for (const def of this.room.objects) {
      const sprite = this.add.sprite(def.x, def.y, def.sheet, SHEETS[def.sheet].json.frames[0].filename).setOrigin(0.5, 1).setScale(1 / ART_SCALE).setDepth(def.depth ?? def.y);
      if (def.anim) sprite.play(`${def.sheet}:${def.anim}`);
      this.objects.set(def.id, sprite);
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

    this.session.ui.setHover('');
    this.session.ui.setBusy(false);
    this.session.ui.renderInventory();
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
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

  private heroSheet(): string {
    return this.session.state.flags.hasGauntlet ? 'mara-gauntlet' : 'mara';
  }

  // ------------------------------------------------------------------ input ---
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const ui = this.session.ui;
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
    if (target) {
      const id = this.targetId(target);
      const verbs: Verb[] = target.kind === 'actor' ? ACTOR_VERBS[target.actor.id] : target.hotspot.verbs;
      ui.openRadial(at, this.targetName(target), verbs, verb => {
        void this.runScript(interact(this.session.state, verb, id));
      });
      return;
    }
    void this.walkTo(at);
  }

  /** Name labels for every interactive thing in the room (hold Space / eye button). */
  hotspotLabels(): { text: string; x: number; y: number }[] {
    const state = this.session.state;
    const labels = this.room.hotspots
      .filter(h => conditionsHold(state, h.visibleIf))
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
    const at = { x: 70 + index * 46, y: 300 };
    this.session.ui.openRadial(at, t(`name.${item}`), ITEM_VERBS, verb => {
      if (verb === 'use') this.session.selectItem(item);
      else void this.runScript(interact(this.session.state, verb, `item:${item}`));
    });
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.wasTouch) return;
    const target = this.isBusy() ? null : this.hitTest({ x: pointer.worldX, y: pointer.worldY });
    const item = this.session.selectedItem;
    const name = target ? this.targetName(target) : '';
    if (item) {
      const itemName = t(`name.${item}`);
      this.session.ui.setHover(name ? t('ui.useWith', { item: itemName, target: name }) : t('ui.useWithNothing', { item: itemName }));
    } else {
      this.session.ui.setHover(name);
    }
    this.input.setDefaultCursor(target && !item ? 'pointer' : '');
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
    await this.hero.walk(this.area.findPath(this.hero.position, target));
    this.syncHero();
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
    }
    if (this.hero?.sprite.active) this.hero.setSheet(this.heroSheet());
    this.applyTint();
  }

  private isCold(): boolean {
    return this.room.coldIf ? conditionsHold(this.session.state, this.room.coldIf) : false;
  }

  private applyTint(): void {
    const cold = this.isCold();
    const targets: (Phaser.GameObjects.Image | Phaser.GameObjects.Sprite)[] = [this.background, ...this.objects.values(), ...this.foreground];
    for (const o of targets) {
      if (cold) o.setTint(COLD_TINT);
      else o.clearTint();
    }
    this.refreshAmbient(cold);
  }

  update(): void {
    this.updateLighting();
  }

  /** Characters take the room's light, darker toward the back, cooled once the kiln is cold. */
  private updateLighting(): void {
    const light = this.room?.light;
    if (!light) return;
    const cold = this.isCold();
    const { farY, nearY } = this.room.scale;
    for (const actor of this.actors.values()) {
      const t = Phaser.Math.Clamp((actor.sprite.y - farY) / (nearY - farY), 0, 1);
      const dim = light.farDim + (1 - light.farDim) * t;
      actor.sprite.setTint(multiplyColor(light.tint, dim, cold ? COLD_TINT : 0xffffff));
    }
  }

  /** Particles and flickering light pools; warm ones go out with the kiln. Off with reduced motion. */
  private refreshAmbient(cold: boolean): void {
    if (this.ambientCold === cold && this.ambient.length) return;
    this.ambientCold = cold;
    for (const o of this.ambient) o.destroy();
    this.ambient = [];
    const def = this.room.ambient;
    if (!def || settings().reducedMotion) return;
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
    }
  }

  // ----------------------------------------------------------------- script ---
  /** Plays interaction commands in order. Input only skips speech until it finishes. */
  async runScript(commands: Command[]): Promise<void> {
    if (this.isBusy() || commands.length === 0) return;
    this.busy = true;
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
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  private async say(actorId: ActorId, key: string, at?: Point): Promise<void> {
    const actor = this.actors.get(actorId);
    const point = actor?.headPoint() ?? at ?? { x: 320, y: 60 };
    await this.session.ui.say(actorId, t(key), point);
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
        applyCommand(state, command);
        this.refreshObjects();
        this.session.ui.renderInventory();
        return true;
      case 'wait':
        await this.wait(command.ms);
        return true;
      case 'shake':
        if (!settings().reducedMotion) this.cameras.main.shake(command.ms, 0.004);
        await this.wait(Math.min(command.ms, 400));
        return true;
      case 'moveObject': {
        const sprite = this.objects.get(command.id);
        if (!sprite) return true;
        const sheet = this.room.objects.find(o => o.id === command.id)!.sheet;
        const idle = sprite.anims.currentAnim?.key;
        if (this.anims.exists(`${sheet}:scurry`)) sprite.play(`${sheet}:scurry`);
        await new Promise<void>(resolve => this.tweens.add({
          targets: sprite, x: command.x, y: command.y, duration: command.ms, ease: 'Sine.easeInOut',
          onUpdate: () => sprite.setDepth(sprite.y), onComplete: () => resolve(),
        }));
        if (idle) sprite.play(idle);
        return true;
      }
      case 'dialogue':
        await this.runDialogue(command.id);
        return true;
      case 'room':
        this.leaving = true;
        this.session.ui.closeRadial();
        this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
        await this.wait(FADE_MS + 20);
        applyCommand(state, command);
        this.scene.restart();
        return false;
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
        const choice = node.choices[index];
        await this.say('hero', choice.text);
        nodeId = choice.next;
      } else {
        nodeId = node.next;
      }
    }
  }
}
