import Phaser from 'phaser';
import { conditionsHold } from '../engine/geometry';
import { WalkArea } from '../engine/pathfinding';
import { settings } from '../engine/settings';
import { sound } from '../audio/sound';
import type { ActorId, Command, ObjectDef, Point, RoomDef } from '../engine/types';
import { Actor, SHADOW_DEPTH } from './Actor';
import { Atmosphere, createAtmosphereTextures } from './atmosphere';
import { Props, createParticleTextures } from './props';
import { Crowd } from './Crowd';
import { RoomSign, SIGN_IMAGES } from './sign';
import { AshwaysSet, queueAshways } from './ashways';
import type { Mood } from '../engine/crowd';
import { chapter } from '../chapters';
import { crowdMoodFor, heroSheetFor, hushed, onEnter, type StoryContext } from '../engine/story';
import { FOREGROUND_IMAGES, OUTLINES, PROP_IMAGES, LAZY_SHEETS, NPC_SHEETS, ROOM_IMAGES, SHEETS, tagFrame } from './assets';
import { outlineSheetKey } from './room/outline';
import { heroOf } from '../chapters/hero';
import type { Session } from './session';
import { ART_SCALE, LOGICAL_H, LOGICAL_W } from '../ui/ui';
import { DOORWAY_STEP, FACE_VECTOR, FADE_MS, NOTICE_DISTANCE, createSheetAnims, inFlight, particleConfig, queueSheet, whenSheet } from './room/shared';
import type { Target } from './room/shared';
import { activateFocus, clearFocus, cycleFocus, drawHover, hotspotLabels, onPointerDown, onPointerMove, openItemRing } from './room/input';
import { applyTint, tintScenery, updateLighting } from './room/lighting';
import { runScript } from './room/runner';
import { directionalStep } from './movement';

/** Loads the shared sheets (props and Mara) and builds their animations. */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload(): void {
    for (const [key, url] of Object.entries(SIGN_IMAGES)) this.load.image(key, url);
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
    createParticleTextures(this);
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
    const start = chapter().rooms[this.session.state.room].background;
    for (const key of new Set(['room-mara', start])) if (!this.textures.exists(key)) this.load.image(key, ROOM_IMAGES[key]);
  }

  create(): void {
    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    this.add.image(0, 0, 'room-mara', '__BASE').setOrigin(0, 0).setScale(1 / ART_SCALE).setTint(0x6a5a58);
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



/** One room: background, objects, characters, input and the command/dialogue runner. */
export class RoomScene extends Phaser.Scene {
  room!: RoomDef;
  area!: WalkArea;
  hero!: Actor;
  background!: Phaser.GameObjects.Image;
  actors = new Map<ActorId, Actor>();
  objects = new Map<string, Phaser.GameObjects.Sprite>();
  objectShadows = new Map<string, Phaser.GameObjects.Image>();
  foreground: Phaser.GameObjects.Image[] = [];
  ambient: Phaser.GameObjects.GameObject[] = [];
  ambientCold: boolean | null = null;
  /** The glow Mara carries in dark rooms (`RoomDef.heroLight`), moved with him. */
  heroLight: Phaser.GameObjects.Image | null = null;
  atmosphere!: Atmosphere;
  props!: Props;
  /** Background people (rooms in CROWDS), else null. */
  crowd: Crowd | null = null;
  /** The room's hanging name board, if it has one. */
  sign: RoomSign | null = null;
  ashways: AshwaysSet | null = null;
  /** Last cold state seen, to animate the shutdown when it happens in this room (null until created). */
  knownCold: boolean | null = null;
  /** Cold factor last applied to the background tint (Low quality). */
  tintedCold = -1;
  lastExitClick = { id: '', time: 0 };
  /** Keyboard play: index into focusTargets(), -1 = nothing focused. */
  focusIndex = -1;
  focusRing: Phaser.GameObjects.Graphics | null = null;
  /** Soft outline on whatever the pointer is over (not on touch screens). */
  hoverRing: Phaser.GameObjects.Graphics | null = null;
  /** The hover outline pictures in use (room/outline.ts), reused frame to frame. */
  hoverOutlines: Phaser.GameObjects.Image[] = [];
  hovered: Target | null = null;
  busy = false;
  leaving = false;
  private heroLoading: string | null = null;
  private moveDirection: Point = { x: 0, y: 0 };
  private keyboardMoved = false;

  constructor(readonly session: Session) { super('room'); }

  isBusy(): boolean {
    return this.busy || this.leaving;
  }

  /** Loads this room's background and foreground pieces if they are not cached yet. */
  preload(): void {
    const room = chapter().rooms[this.session.state.room];
    if(room.id==='ashways'){queueAshways(this);queueSheet(this,'extra-merchant');}
    const state = this.session.state;
    const sheet = heroSheetFor(chapter().story, { state, room, cold: false });
    if (sheet !== 'mara') queueSheet(this, sheet);
    for (const a of room.actors) if (conditionsHold(state, a.visibleIf)) queueSheet(this, NPC_SHEETS[a.id] ?? a.id);
    for (const o of room.objects) queueSheet(this, o.sheet);
    if (!this.textures.exists(room.background)) this.load.image(room.background, ROOM_IMAGES[room.background]);
    const outlines = OUTLINES[room.background];
    if (outlines && !this.textures.exists(outlineSheetKey(room.background))) this.load.atlas(outlineSheetKey(room.background), outlines.png, outlines.json);
    for (const p of room.props ?? []) {
      if ('image' in p && !this.textures.exists(`prop-${p.image}`)) this.load.image(`prop-${p.image}`, PROP_IMAGES[p.image]);
    }
    for (const f of room.foreground ?? []) {
      if (!this.textures.exists(`fg-${f.image}`)) this.load.image(`fg-${f.image}`, FOREGROUND_IMAGES[f.image]);
    }
  }

  create(): void {
    const state = this.session.state;
    this.room = chapter().rooms[state.room];
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
    this.hoverRing = this.add.graphics().setDepth(99998);
    this.hoverOutlines = [];
    this.hovered = null;
    this.busy = false;
    this.leaving = false;
    this.heroLoading = null;
    this.moveDirection = { x: 0, y: 0 };
    this.keyboardMoved = false;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.session.ui.controls.cancel());

    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    this.background = this.add.image(0, 0, this.room.background, '__BASE').setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(-10000);
    this.atmosphere = new Atmosphere(this, this.room, this.isCold());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.atmosphere.destroy());
    this.props = new Props(this, this.room, () => this.session.state, () => this.atmosphere.cold);
    this.sign = this.room.sign ? new RoomSign(this, this.room) : null;
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
      const s = state.npcs[a.id] ?? { pose: 'stand' as const, face: 'down' as const };
      this.actors.set(a.id, new Actor(this, a.id, NPC_SHEETS[a.id] ?? a.id, a.x, a.y, s.face, s.pose, this.room.scale, a.body));
    }
    this.crowd = chapter().crowds[this.room.id] ? new Crowd({
      scene: this, room: this.room, area: this.area, props: this.props,
      hero: () => this.hero,
      others: () => [...this.actors.entries()].filter(([id]) => id !== 'hero').map(([, a]) => a.position),
      busy: () => this.isBusy(),
      loadSheet: (key, then) => this.loadLazySheet(key, then),
      bubble: (text, at) => this.session.ui.chatter(text, at),
    }, this.crowdMood()) : null;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.crowd?.destroy(); this.crowd = null; });
    this.ashways=this.room.id==='ashways'?new AshwaysSet(this):null;
    // After the actors exist: refreshObjects also updates the hero's sheet, the cold tint and ambience.
    this.refreshObjects();
    updateLighting(this);
    if (this.session.debug && this.session.showWalkAreas) this.drawDebug();

    this.input.mouse?.disableContextMenu();
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => onPointerDown(this, p));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => onPointerMove(this, p));
    this.input.on(Phaser.Input.Events.GAME_OUT, () => this.session.ui.setHover(''));

    this.hero.onStep = () => {
      const surface = this.room.surface ?? 'stone';
      sound.step(surface);
      this.props.step(this.hero.sprite.x, this.hero.sprite.y);
    };
    // Mara's lit-gauntlet sheet: loaded in the background, swapped in when it arrives.
    if (heroOf().mara && !this.textures.exists('mara-gauntlet')) this.preloadGauntletSheet();
    // The kiln hall's people are fetched in the background from the first room on.
    for (const e of chapter().extras) this.loadLazySheet(e.sheet);
    for (const [id, actor] of this.actors) if (id !== 'hero') { this.scheduleFidget(actor); this.scheduleGlance(actor); }
    // Voices and work noises where people are about.
    const murmur: Record<string, number> = { maraRoom: 1, firingHouse: 0.55 };
    sound.crowd((murmur[this.room.id] ?? 0) * (this.isCold() ? 0.45 : 1));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => sound.crowd(0));

    this.session.ui.setHover('');
    this.session.ui.setBusy(false);
    this.session.ui.renderInventory();
    this.cameras.main.fadeIn(this.session.slowFadeIn ? 1800 : FADE_MS, 0, 0, 0);
    this.session.slowFadeIn = false;
    sound.hush(hushed(chapter().story, this.storyContext()));
    // Hand off directly from walking in to the entry script. A fixed delay can expire while
    // the walk is still busy, causing runScript to silently discard the chapter's commands.
    const pending = onEnter(chapter().story, this.storyContext());
    const arrived = () => {
      if (pending.length) void runScript(this, pending);
      else this.session.autosave();
    };
    const entry = this.session.arrival;
    this.session.arrival = null;
    if (entry) this.walkIn(entry, arrived);
    else if (pending.length) {
      // Reloaded sequences retain their short settling delay, with input reserved throughout.
      this.busy = true;
      this.session.ui.setBusy(true);
      this.time.delayedCall(700, () => {
        this.busy = false;
        this.session.ui.setBusy(false);
        arrived();
      });
    }
    else arrived();
  }

  /** On arrival Mara starts just beyond the doorway and walks in to the entry point. */
  walkIn(entryId: string, arrived: () => void): void {
    const entry = this.room.entries[entryId];
    if (!entry) { arrived(); return; }
    const hero = this.hero;
    const v = FACE_VECTOR[entry.face];
    this.hero.sprite.setPosition(entry.x - v.x * DOORWAY_STEP, entry.y - v.y * DOORWAY_STEP);
    this.busy = true;
    this.session.ui.setBusy(true);
    void this.hero.walk([{ x: entry.x, y: entry.y }]).then(() => {
      // A stopped walk may settle after a restart; it must not touch the new room or run
      // commands captured for the old one.
      if (!this.sys.isActive() || this.hero !== hero || this.leaving) return;
      this.hero.setFacing(entry.face);
      this.syncHero();
      this.busy = false;
      this.session.ui.setBusy(false);
      arrived();
    });
  }

  scheduleFidget(actor: Actor): void {
    this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => {
      if (!actor.sprite.active) return;
      if (!this.busy) actor.fidget();
      this.scheduleFidget(actor);
    });
  }

  /** Walk area (green), holes (red), hotspots (yellow) and approach points, for fitting art. */
  drawDebug(): void {
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

  /** Mara's sheet for the story so far, as soon as it has loaded. */
  heroSheet(): string {
    const sheet = heroSheetFor(chapter().story, this.storyContext());
    if (!this.textures.exists(sheet) && this.heroLoading !== sheet) {
      this.heroLoading = sheet;
      // Subscribe even if a previous room already queued this texture.
      this.loadLazySheet(sheet, () => { this.heroLoading = null; this.refreshObjects(); });
    }
    // Until it has loaded: the chapter hero's own sheet (Mara's for Mara).
    return this.textures.exists(sheet) ? sheet : this.textures.exists(heroOf().sheet) ? heroOf().sheet : 'mara';
  }

  /** In the tent, the lit-gauntlet sheet loads in the background while the player looks around. */
  preloadGauntletSheet(): void {
    if (this.textures.exists('mara-gauntlet')) return;
    const pending = inFlight.has('mara-gauntlet');
    queueSheet(this, 'mara-gauntlet');
    whenSheet(this, 'mara-gauntlet', () => {
      if (!this.sys.isActive()) return;
      createSheetAnims(this, 'mara-gauntlet');
      this.refreshObjects();
    });
    if (!pending) this.load.start();
  }

  /** Loads a lazy sheet in the background; `then` runs (in this room) once it and its animations are ready. */
  loadLazySheet(key: string, then?: () => void): void {
    const needsStart = !this.textures.exists(key) && !inFlight.has(key);
    queueSheet(this, key);
    whenSheet(this, key, () => {
      // Runs at once if the sheet is cached (the scene is still being created then), else on arrival.
      if (this.sys.settings.status >= Phaser.Scenes.SHUTDOWN) return;
      createSheetAnims(this, key);
      then?.();
    });
    if (needsStart && !this.load.isLoading()) this.load.start();
  }





  /** Moves the focus ring. Returns false when it runs past either end (focus then goes to the bar). */
  cycleFocus(direction: 1 | -1): boolean {
    return cycleFocus(this, direction);
  }

  activateFocus(): boolean {
    return activateFocus(this);
  }


  /** Name labels for every interactive thing in the room (hold Space / eye button). */
  hotspotLabels(): { text: string; x: number; y: number }[] {
    return hotspotLabels(this);
  }

  /** Action ring for an inventory item, shown just above the bar. */
  openItemRing(item: string, index: number): void {
    return openItemRing(this, item, index);
  }






  // --------------------------------------------------------------- movement ---
  /** Free walking from a click; a new click interrupts it. */
  async walkTo(target: Point): Promise<void> {
    this.session.ui.controls.stopMovement();
    const state = this.session.state;
    if (this.hero.pose !== 'stand') { this.hero.setPose('stand'); state.hero.pose = 'stand'; }
    this.crowd?.heroHeading(target);
    if (await this.hero.walk(this.area.findPath(this.hero.position, target))) {
      this.syncHero();
      this.session.autosave();
    } else {
      this.syncHero();
    }
  }

  syncHero(): void {
    const h = this.session.state.hero;
    h.x = Math.round(this.hero.position.x);
    h.y = Math.round(this.hero.position.y);
    h.face = this.hero.face;
    h.pose = this.hero.pose;
  }

  setMoveDirection(direction: Point): void {
    if (!direction.x && !direction.y) {
      this.moveDirection = { x: 0, y: 0 };
      this.hero?.stopManual();
      if (this.keyboardMoved && this.hero?.sprite.active) {
        this.syncHero(); this.session.autosave();
      }
      this.keyboardMoved = false;
      return;
    }
    if (!this.session.ui.controls.available() || !this.hero?.sprite.active) return;
    this.moveDirection = direction;
    clearFocus(this);
  }

  private updateKeyboardMovement(delta: number): void {
    this.session.ui.controls.reconcile();
    const direction = this.moveDirection;
    if (!direction.x && !direction.y) return;
    if (!this.session.ui.controls.available()) { this.setMoveDirection({ x: 0, y: 0 }); return; }
    const from = this.hero.position;
    const next = directionalStep(this.area, from, direction,
      110 * this.hero.speed * this.hero.perspective * Math.min(delta, 100) / 1000);
    if (Math.hypot(next.x - from.x, next.y - from.y) < 0.001) { this.hero.stopManual(); return; }
    this.hero.manualStep(next);
    this.keyboardMoved = true;
    this.syncHero();
    this.crowd?.heroHeading(next);
  }

  objectPosition(def: ObjectDef): Point {
    const moved = def.movedTo && this.session.state.flags[def.movedTo.flag];
    return moved ? { x: def.movedTo!.x, y: def.movedTo!.y } : { x: def.x, y: def.y };
  }

  refreshObjects(): void {
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
    applyTint(this);
  }

  /** The story's state as the chapter's rules see it (src/engine/story.ts). */
  storyContext(): StoryContext {
    return { state: this.session.state, room: this.room, cold: this.isCold() };
  }

  /** What the room's background people react to (the chapter's story rules). */
  crowdMood(): Mood {
    return crowdMoodFor(chapter().story, this.storyContext());
  }

  isCold(): boolean {
    return this.room.coldIf ? conditionsHold(this.session.state, this.room.coldIf) : false;
  }




  update(time: number, delta: number): void {
    updateLighting(this);
    if (!this.hero?.sprite.active) return;
    this.updateKeyboardMovement(delta);
    this.props.update(time);
    this.crowd?.update();
    this.ashways?.update(time);
    drawHover(this, time);
    tintScenery(this);
    if (this.atmosphere.enabled) this.atmosphere.updateReflections(this.allActors().map(a => a.sprite), time);
    for (const [id, actor] of this.actors) {
      if (id === 'hero' || this.busy) continue;
      const d = Math.hypot(actor.sprite.x - this.hero.sprite.x, actor.sprite.y - this.hero.sprite.y);
      if (d < NOTICE_DISTANCE) actor.lookAt(this.hero.sprite.x);
    }
  }


  /** Story characters look about now and then when Mara isn't near: at the kids, the room, the door. */
  scheduleGlance(actor: Actor): void {
    this.time.delayedCall(Phaser.Math.Between(4000, 9000), () => {
      if (!actor.sprite.active) return;
      const d = Math.hypot(actor.sprite.x - this.hero.sprite.x, actor.sprite.y - this.hero.sprite.y);
      if (!this.busy && d >= NOTICE_DISTANCE) {
        const people = this.crowd?.visible() ?? [];
        const x = people.length && Math.random() < 0.6
          ? people[Math.floor(Math.random() * people.length)].actor.sprite.x
          : actor.sprite.x + (Math.random() < 0.5 ? -100 : 100);
        actor.lookAt(x);
      }
      this.scheduleGlance(actor);
    });
  }

  /** Story characters plus any background people on screen. */
  allActors(): Actor[] {
    return [...this.actors.values(), ...(this.crowd?.visible().map(m => m.actor) ?? [])];
  }



  // ----------------------------------------------------------------- script ---
  /** Plays interaction commands in order. Input only skips speech until it finishes. */
  runScript(commands: Command[]): Promise<void> {
    return runScript(this, commands);
  }




  /** The creature out of the hatch (room/fightBridge.ts blowHatch), until its fight begins. */
  hatchCreature: Phaser.GameObjects.Image | null = null;




}
