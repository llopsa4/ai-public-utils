import Phaser from 'phaser';
import intro from '../data/intro.json';
import { type P, circlePoints, conePolygon, ringLook, sightPolygon } from '../render/cones';
import { NOISE_DASH, dashSegments } from '../render/cues';
import { type ClickTarget, DoubleClick, cursorFor, resolveClick } from '../render/click';
import { TILE_H, tileToWorld, worldBounds, worldToTile, worldToTileF } from '../render/iso';
import { anchorOf } from '../render/placeholders';
import { bakeGround, checker } from './ground';
import { UnitSprite } from '../render/units';
import { barButtons, selectWeapon } from '../sim/abilities';
import { enemyViewer } from '../sim/ai';
import { type Campaign, browserStorage, newCampaign, saveCampaign, toMission1 } from '../sim/campaign';
import { TICK_HZ } from '../sim/time';
import { TREE } from '../sim/grid';
import { type Survivor, failText, orderAttack, orderHold, orderMove, survivorViewer } from '../sim/mission';
import { type IntroState, STEPS, ackSay, createIntro, hintOf, introLines, objectiveAt, stepIntro } from '../sim/tutorial';
import { ACTION_EVENT, type BarModel, HINT_WRAP, SKIP_AFTER_MS, barH, overBar, placeHint } from './ActionBar';
import { options } from '../sim/options';
import { CounterRow } from './counters';
import { placeText, scaleText, sizeBanner } from './uiScale';
import { type Counter, lootCounters } from '../render/uiview';
import { pressCard } from '../render/squad';
import { Feel } from './feelFx';
import { ViewInput } from './input';
import { bindSquad, overSquad } from './Squad';
import { openDialogue } from './Dialogue';
import { bindPause } from './Pause';
import { bindActionKeys, fillHelp } from './actionKeys';

const N = intro.size;
const STEP_MS = 1000 / TICK_HZ;
const PICK_W = 16; // half-width and height (world px) of a unit's click target
const PICK_H = 44;
const RESTART_MS = 2500;
const FONT = 'Georgia, "Times New Roman", serif';

/** The key lines in the HUD corner and on the pause menu's Controls page. */
// `{action}` is filled with the live key (rebindable, `fillHelp`).
const HELP = 'Drag: box select    Left-click: select / move / attack (double-click: run)    Right-click: cancel    {hold}: hold    {weapon1} / {weapon2}: weapon    {alert}: jump to attack\n{panUp}{panLeft}{panDown}{panRight} / screen edge: pan    Wheel: zoom    {select1} / {select2} / {cycle}: select survivor    Shift-click: add    Esc: menu';
const NOISE_COLOR: Record<string, number> = { step: 0xd8d8d0, shot: 0xe0a45a, lure: 0x8fb4d8, alarm: 0xd85a4a };

type Ord =
  | { type: 'move'; ids: string[]; to: [number, number] }
  | { type: 'hold'; id: string; toward: [number, number] }
  | { type: 'attack'; ids: string[]; target: string };

const name = (u: Survivor): string => u.kind[0]!.toUpperCase() + u.kind.slice(1);

/**
 * Intro scene (DESIGN §15): the woods camp right after a fight, and the tutorial. Four gated steps
 * (move, knife, gun, hold) with dialogue between them; then Mission 1. All rules live in
 * `src/sim/tutorial.ts`; this scene draws the state, plays the dialogue and sends orders.
 */
export class IntroScene extends Phaser.Scene {
  private hover!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Image;
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private ping!: Phaser.GameObjects.Image;
  private view!: ViewInput;
  private feel!: Feel;
  private state!: IntroState;
  private sprites = new Map<string, UnitSprite>();
  private bodySprites = new Map<string, Phaser.GameObjects.Image>();
  private decalCount = 0;
  private prev = new Map<string, [number, number]>();
  private selected = new Set<string>();
  private squad!: { publish: () => void };
  private readonly dbl = new DoubleClick();
  private pendingHold = false;
  private acc = 0;
  private endedAt = 0;
  private toastText = '';
  private toastUntil = 0;
  private sayOpen = false;
  private replay = false;

  constructor() {
    super('Intro');
  }

  init(data?: { replay?: boolean }): void {
    this.replay = data?.replay === true;
  }

  create(): void {
    this.state = createIntro();
    if (this.replay) this.state.say = null; // after a death the opening is not played again
    this.sprites.clear();
    this.bodySprites.clear();
    this.prev.clear();
    this.selected.clear();
    this.decalCount = 0;
    this.pendingHold = false;
    this.acc = 0;
    this.endedAt = 0;
    this.toastText = '';
    this.sayOpen = false;

    this.drawWorld();
    this.fx = this.add.graphics().setDepth(0.3);
    this.hover = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5);
    this.marker = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.6).setTint(0xe8c46a);
    this.ping = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
    this.bars = this.add.graphics().setDepth(850);
    for (const u of this.state.survivors) {
      const ring = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
      this.sprites.set(u.id, new UnitSprite(this, u, ring));
    }
    this.sync(1);

    const mid = tileToWorld(intro.fire.x - 2, intro.fire.y + 1, N);
    this.view = new ViewInput(this, {
      bounds: () => worldBounds(N),
      blocked: (p) => this.onBar(p),
      onLeft: (p) => this.leftClick(p),
      onRight: (p) => this.rightClick(p),
      onBox: (a, b) => this.boxSelect(a, b),
    });
    this.view.start(mid.x, mid.y);
    this.feel = new Feel(this, { n: () => N, view: () => this.view, sprites: () => this.sprites });
    this.squad = bindSquad(this, {
      units: () => this.state.survivors,
      nameOf: (id) => name(this.state.survivors.find((u) => u.id === id)!),
      selection: () => this.selected,
      select: (ids) => {
        this.selected = ids;
        this.sync(1);
      },
      centreOn: (id) => {
        const u = this.state.survivors.find((x) => x.id === id)!;
        const w = tileToWorld(u.x, u.y, N);
        this.view.centreOn(w.x, w.y - PICK_H / 2);
      },
    });

    const kb = this.input.keyboard!;
    bindActionKeys(this, {
      hold: () => this.armHold(),
      alert: () => this.feel.jump() || this.toast('Nothing is under attack'),
      weapon1: () => this.chooseWeapon(0),
      weapon2: () => this.chooseWeapon(1),
    });
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.state.status === 'failed' && e.key !== 'Escape' && this.endedAt >= SKIP_AFTER_MS) this.endedAt = RESTART_MS;
    });
    bindPause(this, {
      cancelPending: () => {
        const had = this.pendingHold;
        this.pendingHold = false;
        return had;
      },
      failed: () => this.state.status === 'failed',
      restart: () => this.scene.restart({ replay: true }),
      quit: () => this.leave(),
      controls: () => fillHelp(HELP).split('\n'),
      hints: () => [],
    });

    this.scene.launch('IntroHud');
    this.scene.launch('ActionBar');
    this.scene.launch('Squad');
    this.scene.launch('Feel');
    this.game.events.on(ACTION_EVENT, this.onAction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('IntroHud');
      this.scene.stop('ActionBar');
      this.scene.stop('Squad');
      this.scene.stop('Feel');
      this.game.events.off(ACTION_EVENT, this.onAction, this);
      this.registry.set('m_bar', null);
    });
    this.publish();
    this.playSay();

    if (new URLSearchParams(window.location.search).has('debug')) {
      (window as unknown as { dw?: unknown }).dw = {
        state: this.state,
        step: (k: number) => {
          for (let i = 0; i < k; i++) this.tickOnce();
          this.sync(1);
        },
        orders: (list: Ord[]) => list.forEach((o) => this.debugOrder(o)),
      };
    }
  }

  private leave(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    this.scene.start('Menu');
  }

  /** The Intro is over: Mission 1 is saved as the next scene (with the ammo left) and starts. */
  private startMission(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    const next = toMission1((this.registry.get('campaign') as Campaign | undefined) ?? newCampaign(), this.state.ammo);
    this.registry.set('campaign', next);
    saveCampaign(browserStorage(), next);
    this.scene.start('Mission');
  }

  private debugOrder(o: Ord): void {
    if (o.type === 'move') orderMove(this.state, o.ids, o.to);
    else if (o.type === 'hold') orderHold(this.state, o.id, o.toward);
    else orderAttack(this.state, o.ids, o.target);
  }

  /** Plays the dialogue the sim is waiting on (once); when it closes the sim runs again, or Mission 1 starts. */
  private playSay(): void {
    const key = this.state.say;
    if (key === null || this.sayOpen) return;
    this.sayOpen = true;
    this.pendingHold = false;
    openDialogue(this, introLines(key), () => {
      this.sayOpen = false;
      ackSay(this.state);
      if (this.state.done) this.startMission();
    });
  }

  /** Ground, trees, tent and fire. Upright things are depth-sorted by the world y of their foot. */
  private drawWorld(): void {
    const g = this.state.grid;
    bakeGround(this, N, checker);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const w = tileToWorld(x, y, N);
        if (g.tiles[y * N + x] === TREE) this.add.image(w.x, w.y, 'tree').setOrigin(...anchorOf('tree')).setDepth(w.y);
      }
    }
    const t = intro.tent;
    const tw = tileToWorld(t.x + (t.w - 1) / 2, t.y + (t.h - 1) / 2, N);
    this.add.image(tw.x, tw.y, 'tent').setOrigin(...anchorOf('tent')).setDepth(tw.y + TILE_H / 2);
    const fw = tileToWorld(intro.fire.x, intro.fire.y, N);
    this.add.image(fw.x, fw.y, 'fire').setOrigin(...anchorOf('fire')).setDepth(fw.y);
  }

  private at(u: { id: string; x: number; y: number }, frac: number): [number, number] {
    const p = this.prev.get(u.id) ?? [u.x, u.y];
    return [p[0] + (u.x - p[0]) * frac, p[1] + (u.y - p[1]) * frac];
  }

  /** Puts every sprite at its tile, `frac` of the way from the last tick to this one. */
  private sync(frac: number): void {
    const s = this.state;
    for (const u of [...s.survivors, ...s.enemies]) {
      let sp = this.sprites.get(u.id);
      if (!sp) {
        sp = new UnitSprite(this, u); // a zombie the next step brought in
        this.sprites.set(u.id, sp);
      }
      const drawn = sp.update(u, s.tick, frac);
      sp.ring?.setVisible(false);
      if (!drawn) {
        sp.showCue(u, false, 0, 0);
        continue;
      }
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, N);
      sp.body.setPosition(w.x, w.y).setDepth(w.y);
      sp.showCue(u, true, w.x, w.y);
      if (u.hp <= 0) sp.body.clearTint();
      else if (u.side === 'survivor') sp.ring?.setPosition(w.x, w.y).setVisible(this.selected.has(u.id));
      else if (u.ai.mode === 'chase') sp.body.setTint(0xff8a78);
      else if (u.ai.mode === 'investigate') sp.body.setTint(0xf0dc8a);
      else sp.body.clearTint();
    }
    for (const b of s.bodies) {
      let img = this.bodySprites.get(b.id);
      if (!img) {
        img = this.add.image(0, 0, 'body').setOrigin(...anchorOf('body'));
        this.bodySprites.set(b.id, img);
      }
      const w = tileToWorld(b.x, b.y, N);
      img.setPosition(w.x, w.y).setDepth(w.y - 1).setVisible(!this.sprites.get(b.id)?.dying);
    }
    for (; this.decalCount < s.decals.length; this.decalCount++) {
      const d = s.decals[this.decalCount]!;
      const w = tileToWorld(d.x, d.y, N);
      this.add.image(w.x, w.y, 'blood').setOrigin(...anchorOf('blood')).setDepth(0.2);
    }
  }

  private tickOnce(): void {
    for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
    stepIntro(this.state);
    this.playSay();
  }

  // ---- Drawing the cones, rings, health bars and the objective marker each frame ----

  private fill(pts: P[], color: number, alpha: number, outline = 0): void {
    const w = pts.map(([x, y]) => tileToWorld(x, y, N));
    this.fx.fillStyle(color, alpha).fillPoints(w, true);
    if (outline > 0) this.fx.lineStyle(1, color, outline).strokePoints(w, true);
  }

  private drawFx(frac: number): void {
    const s = this.state;
    this.fx.clear();
    this.bars.clear();
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      const [x, y] = this.at(e, frac);
      this.fill(sightPolygon(s.grid, x, y, enemyViewer(e).range), 0x9a9a92, 0.1, 0.3); // faint grey sight circle
    }
    for (const u of s.survivors) {
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const v = { ...survivorViewer(u), x, y };
      if (u.order?.type === 'hold') this.fill(conePolygon(s.grid, v), 0x58c070, 0.24, 0.8);
      else if (this.selected.has(u.id)) this.fill(conePolygon(s.grid, v), 0x58c070, 0.08, 0.3);
    }
    for (const r of s.rings) {
      const look = ringLook(r.radius, r.age);
      const w = circlePoints(r.x, r.y, look.r).map(([px, py]) => tileToWorld(px, py, N));
      this.fx.lineStyle(2, NOISE_COLOR[r.kind] ?? 0xd8d8d0, look.alpha);
      const dash = options().cues ? NOISE_DASH[r.kind] : NOISE_DASH.step; // DESIGN §19: each noise kind has its own line style
      for (const run of dashSegments(w.map((q): [number, number] => [q.x, q.y]), dash.on, dash.off)) this.fx.strokePoints(run.map(([px, py]) => ({ x: px, y: py })));
    }
    for (const u of [...s.survivors, ...s.enemies]) {
      if (u.hp <= 0 || (u.side !== 'survivor' && u.hp >= u.maxHp)) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, N);
      const top = w.y - 52;
      this.bars.fillStyle(0x1a1c19, 0.8).fillRect(w.x - 14, top, 28, 4);
      this.bars.fillStyle(u.side === 'survivor' ? 0x9bc79b : 0xc77b6b, 1).fillRect(w.x - 14, top, (28 * u.hp) / u.maxHp, 4);
    }
    const goal = objectiveAt(s);
    if (goal && !this.sayOpen) {
      const z = s.enemies.find((e) => e.id === s.zombieId && e.hp > 0);
      const [gx, gy] = z ? this.at(z, frac) : goal;
      const w = tileToWorld(gx, gy, N);
      const pulse = 0.55 + 0.35 * Math.sin(this.time.now / 220);
      this.marker.setPosition(w.x, w.y).setVisible(true).setAlpha(pulse).setScale(1 + 0.15 * Math.sin(this.time.now / 220));
    } else this.marker.setVisible(false);
  }

  // ---- Input ----

  private onBar(p: Phaser.Input.Pointer): boolean {
    return overBar(this.registry, p.x, p.y, this.scale.width, this.scale.height) || overSquad(this.registry, p.x, p.y);
  }

  private worldOf(p: { x: number; y: number }): { x: number; y: number } {
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  private tileOf(p: { x: number; y: number }): { x: number; y: number } {
    const wp = this.worldOf(p);
    return worldToTile(wp.x, wp.y, N);
  }

  private hit(wp: { x: number; y: number }, x: number, y: number): number {
    const w = tileToWorld(x, y, N);
    const dx = Math.abs(wp.x - w.x);
    const dy = w.y - wp.y; // positive above the feet
    if (dx > PICK_W || dy < -8 || dy > PICK_H) return Infinity;
    return dx + Math.abs(dy - PICK_H / 2);
  }

  private unitAt(wp: { x: number; y: number }, list: readonly { id: string; x: number; y: number; hp: number }[]): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const u of list) {
      const d = u.hp > 0 ? this.hit(wp, u.x, u.y) : Infinity;
      if (d < bd) [bd, best] = [d, u.id];
    }
    return best;
  }

  private chosen(): Survivor[] {
    return this.state.survivors.filter((u) => u.hp > 0 && this.selected.has(u.id));
  }

  /** Orders are refused while a dialogue is waiting and once a survivor has died. */
  private get canOrder(): boolean {
    return this.state.say === null && !this.state.done && this.state.status === 'playing';
  }

  private toast(msg: string): void {
    this.toastText = msg;
    this.toastUntil = this.time.now + 1800;
  }

  private armHold(): void {
    if (!this.canOrder) return;
    if (this.chosen().length === 0) return this.toast('Select a survivor first');
    this.pendingHold = !this.pendingHold;
  }

  /** What lies under a world point, in click priority: survivor, zombie, ground (open map), nothing. */
  private targetAt(wp: { x: number; y: number }): { kind: ClickTarget; id?: string } {
    const sv = this.unitAt(wp, this.state.survivors);
    if (sv) return { kind: 'survivor', id: sv };
    const z = this.unitAt(wp, this.state.enemies);
    if (z) return { kind: 'enemy', id: z };
    const t = worldToTile(wp.x, wp.y, N);
    return { kind: t.x < 0 || t.y < 0 || t.x >= N || t.y >= N ? 'none' : 'ground' };
  }

  /** Left click (DESIGN §1 *Mouse*): select a survivor, attack a zombie, or walk (a quick second click runs). */
  private leftClick(p: Phaser.Input.Pointer): void {
    const wp = this.worldOf(p);
    if (this.pendingHold && this.canOrder) {
      const f = worldToTileF(wp.x, wp.y, N);
      for (const u of this.chosen()) orderHold(this.state, u.id, [f.x, f.y]);
      this.pendingHold = false;
      this.dbl.reset();
      return;
    }
    const who = this.chosen();
    const target = this.targetAt(wp);
    const action = resolveClick(target.kind, this.canOrder && who.length > 0);
    if (action !== 'walk') this.dbl.reset();
    const ids = who.map((u) => u.id);
    if (action === 'select') {
      this.selected = pressCard(this.state.survivors, this.selected, target.id!, p.event.shiftKey); // Shift adds
      this.sync(1);
    } else if (action === 'attack') {
      orderAttack(this.state, ids, target.id!);
    } else if (action === 'walk') {
      const t = worldToTile(wp.x, wp.y, N);
      const run = this.dbl.walkClick(p.x, p.y, p.downTime);
      if (orderMove(this.state, ids, [t.x, t.y], run).length === 0) return;
      const w = tileToWorld(t.x, t.y, N);
      this.ping.setPosition(w.x, w.y).setVisible(true).setAlpha(1);
      this.tweens.killTweensOf(this.ping);
      this.tweens.add({ targets: this.ping, alpha: 0, duration: 500, onComplete: () => this.ping.setVisible(false) });
    }
  }

  private boxSelect(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const a = this.worldOf(from);
    const b = this.worldOf(to);
    const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    this.selected.clear();
    for (const u of this.state.survivors) {
      const w = tileToWorld(u.x, u.y, N);
      const cy = w.y - PICK_H / 2; // the middle of the body
      if (u.hp > 0 && w.x >= x0 && w.x <= x1 && cy >= y0 && cy <= y1) this.selected.add(u.id);
    }
    this.sync(1);
  }

  /** Right-click gives no orders: it only cancels a pending Hold (DESIGN §1 *Mouse*). */
  private rightClick(_p: Phaser.Input.Pointer): void {
    this.pendingHold = false;
  }

  /** Bar button or its hotkey. The intro bar only has weapons and Hold. */
  private onAction(id: string): void {
    if (!this.canOrder) return;
    if (id === 'hold') return this.armHold();
    if (!id.startsWith('weapon:')) return;
    const wid = id.slice('weapon:'.length);
    const who = this.chosen();
    if (who.length === 0 || !who.some((u) => selectWeapon(this.state, u.id, wid))) this.toast(this.state.ammo <= 0 && wid === 'pistol' ? 'Out of ammo' : 'That survivor does not carry it');
  }

  /** Keys 1 and 2: the first and second weapon button of the selected survivor. */
  private chooseWeapon(i: number): void {
    const u = this.chosen()[0];
    const b = u ? barButtons(this.state, u).filter((b) => b.id.startsWith('weapon:'))[i] : undefined;
    if (b) this.onAction(b.id);
    else if (u) this.toast('That survivor has no second weapon');
    else this.toast('Select a survivor first');
  }

  // ---- Frame ----

  private publish(): void {
    const s = this.state;
    const lines = this.chosen().map((u) => {
      const bits = [`${name(u)}  HP ${u.hp}`];
      if (u.order?.type === 'hold') bits.push('holding');
      if (u.order?.type === 'attack') bits.push('attacking');
      return bits.join('  ·  ');
    });
    const first = this.chosen()[0];
    const model: BarModel | null = first
      ? { name: name(first), hp: first.hp, buttons: barButtons(s, first).filter((b) => b.id.startsWith('weapon:') || b.id === 'hold') }
      : null;
    this.registry.set('m_bar', model);
    this.squad.publish();
    this.registry.set('i_counters', lootCounters({ ammo: s.ammo }));
    this.registry.set('i_sel', lines.length ? lines.join('\n') : 'Nobody selected');
    const step = Math.min(s.step + 1, STEPS.length);
    this.registry.set('i_goal', s.done || s.step >= STEPS.length ? 'Find a place to stay' : `${step}/${STEPS.length}   ${hintOf(s)}`);
    const pending = this.pendingHold ? 'Click where to hold (right-click cancels)' : '';
    this.registry.set('i_hint', this.time.now < this.toastUntil ? this.toastText : pending);
    this.registry.set('i_banner', s.status === 'failed' ? `${failText(s)}\nPress any key to try again.` : '');
  }

  update(_t: number, dt: number): void {
    if (this.state.done) return; // Mission 1 is starting: the dialogue's close may resume this scene for one more frame
    this.view.update(dt);
    const p = this.input.activePointer;

    const failed = this.state.status === 'failed';
    if (!failed && this.state.say === null) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS; i++) {
        this.tickOnce();
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else this.acc = 0;
    const frac = failed || this.state.say !== null ? 1 : this.acc / STEP_MS;
    this.sync(frac);
    this.feel.frame(this.state);
    this.drawFx(frac);

    if (failed) {
      this.endedAt += dt;
      if (this.endedAt >= RESTART_MS) this.scene.restart({ replay: true });
    }


    const t = this.tileOf(p);
    const inside = t.x >= 0 && t.y >= 0 && t.x < N && t.y < N && !this.onBar(p);
    this.hover.setVisible(inside).setTint(this.pendingHold ? 0xe8c46a : 0xffffff);
    this.view.setCursor(this.onBar(p) ? 'default' : cursorFor(resolveClick(this.targetAt(this.worldOf(p)).kind, this.canOrder && this.chosen().length > 0), this.pendingHold && this.canOrder));
    if (inside) {
      const w = tileToWorld(t.x, t.y, N);
      this.hover.setPosition(w.x, w.y);
    }
    this.publish();
  }
}

/** Screen overlay over the Intro: ammo, the current step, the selection, hints and the controls. */
export class IntroHudScene extends Phaser.Scene {
  private counters!: CounterRow;
  private goal!: Phaser.GameObjects.Text;
  private sel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private help!: Phaser.GameObjects.Text;

  constructor() {
    super('IntroHud');
  }

  create(): void {
    const { width, height } = this.scale;
    const box = { backgroundColor: '#1d201cb0', padding: { x: 10, y: 6 } };
    this.counters = new CounterRow(this, FONT);
    this.goal = this.add
      .text(width / 2, 46, '', { fontFamily: FONT, fontSize: '20px', color: '#f0dc8a', wordWrap: { width: 720 }, align: 'center', ...box })
      .setOrigin(0.5, 0);
    this.sel = this.add.text(16, height - barH() - 12, '', { fontFamily: FONT, fontSize: '18px', color: '#e8e6de', ...box }).setOrigin(0, 1);
    this.hint = this.add.text(width / 2, height - barH() - 12, '', { fontFamily: FONT, fontSize: '20px', color: '#f0dc8a', wordWrap: { width: HINT_WRAP }, align: 'center', ...box }).setOrigin(0.5, 1);
    this.banner = this.add
      .text(width / 2, height * 0.35, '', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', backgroundColor: '#141614d0', padding: { x: 24, y: 14 }, align: 'center' })
      .setOrigin(0.5);
    this.help = this.add
      .text(width - 16, 14, fillHelp(HELP), {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#a8a69e',
        align: 'right',
      })
      .setOrigin(1, 0);
  }

  /** Text size (DESIGN §19): sizes and rows follow the option each frame, so a change in the pause menu applies at once. */
  private layout(): void {
    this.help.setText(fillHelp(HELP)); // a key rebound in the pause menu shows at once
    scaleText(this.goal, 20, 10, 6);
    scaleText(this.sel, 18, 10, 6);
    scaleText(this.hint, 20, 10, 6);
    scaleText(this.banner, 34, 24, 14);
    sizeBanner(this.banner, this.scale.width);
    placeText(this.goal, this.scale.width / 2, 46);
    this.sel.setPosition(16, this.scale.height - barH() - 12);
  }

  update(): void {
    this.layout();
    const r = this.registry;
    this.counters.update((r.get('i_counters') as Counter[] | undefined) ?? [], 16, 12);
    this.goal.setText(fillHelp((r.get('i_goal') as string | undefined) ?? ''));
    this.sel.setText((r.get('i_sel') as string | undefined) ?? '');
    const hint = (r.get('i_hint') as string | undefined) ?? '';
    this.hint.setText(fillHelp(hint)).setVisible(hint !== '');
    placeHint(this.hint, this.sel, this.scale.width);
    const banner = (r.get('i_banner') as string | undefined) ?? '';
    this.banner.setText(banner).setVisible(banner !== '');
  }
}
