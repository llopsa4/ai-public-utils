import Phaser from 'phaser';
import m01 from '../data/missions/m01.json';
import view from '../data/view.json';
import { clampCenter, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../render/camera';
import { type P, circlePoints, conePolygon, ringLook } from '../render/cones';
import { tileToWorld, worldBounds, worldToTile, worldToTileF } from '../render/iso';
import { anchorOf } from '../render/placeholders';
import { canCarry, canLure, canTakedown, orderOpen, orderTakedown, toggleCarry, useLure } from '../sim/abilities';
import { enemyViewer } from '../sim/ai';
import { TICK_HZ } from '../sim/camp';
import { type Campaign, applyDebrief, browserStorage, nextMission, saveCampaign } from '../sim/campaign';
import { BUSH, COVER, TREE, WALL } from '../sim/grid';
import {
  type MissionSpec,
  type MissionState,
  type Stance,
  type Survivor,
  createMission,
  nextStance,
  orderAttack,
  orderMove,
  orderWatch,
  setStance,
  stepMission,
  survivorViewer,
} from '../sim/mission';

const CAM = view.camera;
const STEP_MS = 1000 / TICK_HZ;
const DRAG_PX = 6; // below this a left press is a click, not a box
const PICK_W = 16; // half-width and height (world px) of a unit's click target
const PICK_H = 44;
const RESTART_MS = 2500;
const FONT = 'Georgia, "Times New Roman", serif';
const STANCE_SCALE: Record<Stance, number> = { walk: 1, crouch: 0.72, crawl: 0.4 };
const NOISE_COLOR: Record<string, number> = { step: 0xd8d8d0, shot: 0xe0a45a, lure: 0x8fb4d8, alarm: 0xd85a4a };

type Pending = null | 'watch' | 'takedown' | 'lure';
type Ord =
  | { type: 'move'; ids: string[]; to: [number, number]; run?: boolean }
  | { type: 'watch'; id: string; toward: [number, number] }
  | { type: 'attack'; ids: string[]; target: string }
  | { type: 'takedown'; id: string; target: string }
  | { type: 'open'; id: string; crate: string }
  | { type: 'lure'; id: string; at: [number, number] }
  | { type: 'carry'; id: string }
  | { type: 'stance'; id: string; stance: Stance };

const name = (u: Survivor): string => u.kind[0]!.toUpperCase() + u.kind.slice(1);

/**
 * Mission scene (DESIGN §3, §6, §7, §8, §13, §14): m01 on the stealth sim. Draws the state, vision
 * cones and noise rings, and sends orders. All rules live in `src/sim/`.
 */
export class MissionScene extends Phaser.Scene {
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private n = 32;
  private state!: MissionState;
  private campaign: Campaign | null = null; // null: the menu's test run, which has no camp to return to
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private box!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Image;
  private ping!: Phaser.GameObjects.Image;
  private centre: [number, number] = [0, 0];
  private units = new Map<string, { body: Phaser.GameObjects.Image; ring?: Phaser.GameObjects.Image }>();
  private bodySprites = new Map<string, Phaser.GameObjects.Image>();
  private crateSprites = new Map<string, Phaser.GameObjects.Image>();
  private decalCount = 0;
  private prev = new Map<string, [number, number]>();
  private selected = new Set<string>();
  private pending: Pending = null;
  private paused = false;
  private acc = 0;
  private endedAt = 0;
  private toastText = '';
  private toastUntil = 0;
  private dragFrom: { x: number; y: number } | null = null;

  constructor() {
    super('Mission');
  }

  create(): void {
    this.campaign = (this.registry.get('campaign') as Campaign | null | undefined) ?? null;
    this.state = createMission(m01 as unknown as MissionSpec);
    this.n = this.state.grid.size;
    this.units.clear();
    this.bodySprites.clear();
    this.crateSprites.clear();
    this.prev.clear();
    this.selected.clear();
    this.decalCount = 0;
    this.pending = null;
    this.paused = false;
    this.acc = 0;
    this.endedAt = 0;
    this.toastText = '';
    this.dragFrom = null;

    this.drawWorld();
    this.fx = this.add.graphics().setDepth(0.3);
    this.hover = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5);
    this.ping = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
    this.bars = this.add.graphics().setDepth(850);
    this.box = this.add.graphics().setScrollFactor(0).setDepth(900);
    for (const u of this.state.survivors) {
      const ring = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
      this.units.set(u.id, { body: this.add.image(0, 0, `survivor_${u.kind}`).setOrigin(...anchorOf(`survivor_${u.kind}`)), ring });
    }
    for (const e of this.state.enemies) {
      const key = e.kind === 'zombie' ? 'zombie' : 'human_guard';
      this.units.set(e.id, { body: this.add.image(0, 0, key).setOrigin(...anchorOf(key)) });
    }
    this.sync(1);

    const cam = this.cameras.main;
    cam.setBackgroundColor('#141614');
    cam.setZoom(CAM.zoomStart);
    const mid = tileToWorld(
      this.state.survivors.reduce((a, u) => a + u.x, 0) / this.state.survivors.length,
      this.state.survivors.reduce((a, u) => a + u.y, 0) / this.state.survivors.length,
      this.n,
    );
    this.centre = [mid.x, mid.y];
    cam.centerOn(mid.x, mid.y);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as typeof this.keys;
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const z = zoomStep(cam.zoom, dy, CAM.zoomStep, CAM.zoomMin, CAM.zoomMax);
      if (z === cam.zoom) return;
      this.centre = clampCenter(...zoomAtCursor(this.centre[0], this.centre[1], cam.zoom, p.x, p.y, cam.width, cam.height, z), worldBounds(this.n));
      cam.setZoom(z);
      cam.centerOn(...this.centre);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.rightClick(p);
      else this.dragFrom = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonReleased() || !this.dragFrom) return;
      const from = this.dragFrom;
      this.dragFrom = null;
      this.box.clear();
      if (Math.hypot(p.x - from.x, p.y - from.y) < DRAG_PX) this.leftClick(p);
      else this.boxSelect(from, p);
    });
    kb.on('keydown-SPACE', () => this.togglePause());
    kb.on('keydown-C', () => this.cycleStance());
    kb.on('keydown-V', () => this.arm('watch'));
    kb.on('keydown-F', () => this.arm('takedown'));
    kb.on('keydown-L', () => this.arm('lure'));
    kb.on('keydown-G', () => this.carry());
    kb.on('keydown-R', () => this.scene.restart());
    kb.on('keydown-ENTER', () => {
      if (this.state.status === 'success') this.debrief();
    });
    kb.on('keydown-ESC', () => {
      if (this.pending) this.pending = null;
      else this.leave();
    });

    this.scene.launch('MissionHud');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('MissionHud'));

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

  /** Esc: back to the camp (no loot) in the campaign, or to the menu in the test run. */
  private leave(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    this.scene.start(this.campaign ? 'Camp' : 'Menu');
  }

  /** Enter after extraction: the loot joins the campaign, the slot is saved and the debrief opens. */
  private debrief(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    const c = this.campaign;
    if (!c) {
      this.scene.start('Menu');
      return;
    }
    const mission = nextMission(c);
    const next = applyDebrief(c, this.state.loot);
    this.registry.set('campaign', next);
    this.registry.set('debrief', { title: mission?.title ?? '', loot: { ...this.state.loot } });
    saveCampaign(browserStorage(), next);
    this.scene.start('Debrief');
  }

  private debugOrder(o: Ord): void {
    const s = this.state;
    switch (o.type) {
      case 'move': orderMove(s, o.ids, o.to, o.run); break;
      case 'watch': orderWatch(s, o.id, o.toward); break;
      case 'attack': orderAttack(s, o.ids, o.target); break;
      case 'takedown': orderTakedown(s, o.id, o.target); break;
      case 'open': orderOpen(s, o.id, o.crate); break;
      case 'lure': useLure(s, o.id, o.at); break;
      case 'carry': toggleCarry(s, o.id); break;
      case 'stance': setStance(s, o.id, o.stance); break;
    }
  }

  /** Ground, the extract zone, walls, fence, bushes, trees and crates. Upright things sort by foot y. */
  private drawWorld(): void {
    const s = this.state;
    const n = this.n;
    const z = s.extract;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const w = tileToWorld(x, y, n);
        const inZone = x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h;
        const ground = inZone ? 'tile_extract' : (x + y) % 2 ? 'tile_ground_b' : 'tile_ground';
        this.add.image(w.x, w.y, ground).setOrigin(...anchorOf('tile_ground')).setDepth(-1);
        const k = s.grid.tiles[y * n + x];
        const key = k === WALL ? 'wall' : k === TREE ? 'tree' : k === COVER ? 'cover' : k === BUSH ? 'bush' : null;
        if (key) this.add.image(w.x, w.y, key).setOrigin(...anchorOf(key)).setDepth(w.y + (k === BUSH ? 1 : 0));
      }
    }
    for (const c of s.crates) {
      const w = tileToWorld(c.x, c.y, n);
      this.crateSprites.set(c.id, this.add.image(w.x, w.y, 'crate').setOrigin(...anchorOf('crate')).setDepth(w.y));
    }
  }

  private at(u: { id: string; x: number; y: number }, frac: number): [number, number] {
    const p = this.prev.get(u.id) ?? [u.x, u.y];
    return [p[0] + (u.x - p[0]) * frac, p[1] + (u.y - p[1]) * frac];
  }

  /** Puts every sprite at its tile, `frac` of the way from the last tick to this one. */
  private sync(frac: number): void {
    const s = this.state;
    const n = this.n;
    for (const u of [...s.survivors, ...s.enemies]) {
      const sp = this.units.get(u.id)!;
      sp.body.setVisible(u.hp > 0);
      sp.ring?.setVisible(false);
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, n);
      sp.body.setPosition(w.x, w.y).setDepth(w.y);
      if (u.side === 'survivor') {
        sp.body.setScale(1, STANCE_SCALE[u.stance]);
        sp.ring?.setPosition(w.x, w.y).setVisible(this.selected.has(u.id));
      } else {
        const m = u.ai.mode;
        if (m === 'alert' || m === 'chase') sp.body.setTint(0xff8a78);
        else if (m === 'investigate' || m === 'body' || m === 'search') sp.body.setTint(0xf0dc8a);
        else sp.body.clearTint();
      }
    }
    for (const b of s.bodies) {
      let img = this.bodySprites.get(b.id);
      if (!img) {
        img = this.add.image(0, 0, 'body').setOrigin(...anchorOf('body'));
        this.bodySprites.set(b.id, img);
      }
      const carrier = b.carriedBy ? s.survivors.find((u) => u.id === b.carriedBy) : undefined;
      const [bx, by] = carrier ? this.at(carrier, frac) : [b.x, b.y];
      const w = tileToWorld(bx, by, n);
      img.setPosition(w.x, w.y - (carrier ? 16 : 0)).setDepth(carrier ? w.y + 1 : w.y - 1);
    }
    for (; this.decalCount < s.decals.length; this.decalCount++) {
      const d = s.decals[this.decalCount]!;
      const w = tileToWorld(d.x, d.y, n);
      this.add.image(w.x, w.y, 'blood').setOrigin(...anchorOf('blood')).setDepth(0.2);
    }
    for (const c of s.crates) this.crateSprites.get(c.id)!.setAlpha(c.opened ? 0.45 : 1);
  }

  private tickOnce(): void {
    for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
    stepMission(this.state);
  }

  // ---- Drawing the cones, rings and health bars each frame ----

  private fill(pts: P[], color: number, alpha: number, outline = 0): void {
    const w = pts.map(([x, y]) => tileToWorld(x, y, this.n));
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
      const v = { ...enemyViewer(e), x, y };
      if (e.kind === 'human') {
        this.fill(conePolygon(s.grid, v), 0xe0c040, 0.14, 0.4); // far half: sees standing survivors
        this.fill(conePolygon(s.grid, v, v.range / 2), 0xd04030, 0.22, 0.5); // near half: sees anyone
      } else this.fill(conePolygon(s.grid, v), 0xd04030, 0.2, 0.5);
    }
    for (const u of s.survivors) {
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const v = { ...survivorViewer(u), x, y };
      if (u.order?.type === 'watch') this.fill(conePolygon(s.grid, v), 0x58c070, 0.24, 0.8);
      else if (this.selected.has(u.id)) this.fill(conePolygon(s.grid, v), 0x58c070, 0.08, 0.3);
    }
    for (const r of s.rings) {
      const look = ringLook(r.radius, r.age);
      const w = circlePoints(r.x, r.y, look.r).map(([px, py]) => tileToWorld(px, py, this.n));
      this.fx.lineStyle(2, NOISE_COLOR[r.kind] ?? 0xd8d8d0, look.alpha).strokePoints(w, true);
    }
    for (const u of [...s.survivors, ...s.enemies]) {
      if (u.hp <= 0 || (u.side !== 'survivor' && u.hp >= u.maxHp)) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, this.n);
      const top = w.y - 52;
      this.bars.fillStyle(0x1a1c19, 0.8).fillRect(w.x - 14, top, 28, 4);
      this.bars.fillStyle(u.side === 'survivor' ? 0x9bc79b : 0xc77b6b, 1).fillRect(w.x - 14, top, (28 * u.hp) / u.maxHp, 4);
    }
  }

  // ---- Input ----

  private worldOf(p: { x: number; y: number }): { x: number; y: number } {
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  private tileOf(p: { x: number; y: number }): { x: number; y: number } {
    const wp = this.worldOf(p);
    return worldToTile(wp.x, wp.y, this.n);
  }

  private hit(wp: { x: number; y: number }, x: number, y: number): number {
    const w = tileToWorld(x, y, this.n);
    const dx = Math.abs(wp.x - w.x);
    const dy = w.y - wp.y; // positive above the feet
    if (dx > PICK_W || dy < -8 || dy > PICK_H) return Infinity;
    return dx + Math.abs(dy - PICK_H / 2);
  }

  private survivorAt(wp: { x: number; y: number }): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const u of this.state.survivors) {
      const d = u.hp > 0 ? this.hit(wp, u.x, u.y) : Infinity;
      if (d < bd) [bd, best] = [d, u.id];
    }
    return best;
  }

  private enemyAt(wp: { x: number; y: number }): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const e of this.state.enemies) {
      const d = e.hp > 0 ? this.hit(wp, e.x, e.y) : Infinity;
      if (d < bd) [bd, best] = [d, e.id];
    }
    return best;
  }

  private crateAt(wp: { x: number; y: number }): string | null {
    for (const c of this.state.crates) {
      const w = tileToWorld(c.x, c.y, this.n);
      const dy = w.y - wp.y;
      if (!c.opened && Math.abs(wp.x - w.x) <= 18 && dy >= -8 && dy <= 24) return c.id;
    }
    return null;
  }

  private chosen(): Survivor[] {
    return this.state.survivors.filter((u) => u.hp > 0 && this.selected.has(u.id));
  }

  private get canOrder(): boolean {
    return !this.paused && this.state.status === 'playing';
  }

  private toast(msg: string): void {
    this.toastText = msg;
    this.toastUntil = this.time.now + 1800;
  }

  private arm(mode: 'watch' | 'takedown' | 'lure'): void {
    if (!this.canOrder) return;
    const who = this.chosen();
    const ok = mode === 'watch' ? who.length > 0 : mode === 'takedown' ? who.some(canTakedown) : who.some(canLure);
    if (!ok) return this.toast(mode === 'watch' ? 'Select a survivor first' : mode === 'takedown' ? 'Select the Fighter first' : 'Select the Scout first');
    this.pending = this.pending === mode ? null : mode;
  }

  private cycleStance(): void {
    if (!this.canOrder) return;
    const who = this.chosen();
    if (who.length === 0) return;
    const next = nextStance(who[0]!.stance);
    for (const u of who) setStance(this.state, u.id, next);
  }

  private carry(): void {
    if (!this.canOrder) return;
    const who = this.chosen().filter(canCarry);
    if (who.length === 0) return this.toast('Select the Fighter to carry');
    for (const u of who) if (toggleCarry(this.state, u.id)) return;
    this.toast('No body within reach');
  }

  private togglePause(): void {
    if (this.state.status === 'playing') this.paused = !this.paused;
    if (this.paused) this.pending = null;
  }

  private leftClick(p: Phaser.Input.Pointer): void {
    const wp = this.worldOf(p);
    if (this.pending && this.canOrder) return this.resolvePending(p, wp);
    const id = this.survivorAt(wp);
    this.selected.clear();
    if (id) this.selected.add(id);
    this.sync(1);
  }

  private resolvePending(p: Phaser.Input.Pointer, wp: { x: number; y: number }): void {
    const mode = this.pending;
    const who = this.chosen();
    const f = worldToTileF(wp.x, wp.y, this.n);
    if (mode === 'watch') {
      for (const u of who) orderWatch(this.state, u.id, [f.x, f.y]);
    } else if (mode === 'takedown') {
      const target = this.enemyAt(wp);
      if (!target) return this.toast('Click an enemy');
      if (!who.some((u) => canTakedown(u) && orderTakedown(this.state, u.id, target))) return;
    } else if (mode === 'lure') {
      const t = this.tileOf(p);
      const scout = who.find(canLure);
      if (!scout) return;
      if (!useLure(this.state, scout.id, [t.x, t.y])) return this.toast(scout.lureCd > 0 ? `Lure ready in ${Math.ceil(scout.lureCd / TICK_HZ)} s` : 'Out of throwing range');
    }
    this.pending = null;
  }

  private boxSelect(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const a = this.worldOf(from);
    const b = this.worldOf(to);
    const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    this.selected.clear();
    for (const u of this.state.survivors) {
      const w = tileToWorld(u.x, u.y, this.n);
      const cy = w.y - PICK_H / 2; // the middle of the body
      if (u.hp > 0 && w.x >= x0 && w.x <= x1 && cy >= y0 && cy <= y1) this.selected.add(u.id);
    }
    this.sync(1);
  }

  /** Right-click: cancels a pending order; else attack an enemy, open a crate, or move (Shift = run). */
  private rightClick(p: Phaser.Input.Pointer): void {
    if (this.pending) {
      this.pending = null;
      return;
    }
    const who = this.chosen();
    if (!this.canOrder || who.length === 0) return;
    const wp = this.worldOf(p);
    const ids = who.map((u) => u.id);
    const enemy = this.enemyAt(wp);
    if (enemy) {
      orderAttack(this.state, ids, enemy);
      return;
    }
    const crate = this.crateAt(wp);
    if (crate) {
      const c = this.state.crates.find((c) => c.id === crate)!;
      const nearest = [...who].sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0]!;
      orderOpen(this.state, nearest.id, crate);
      return;
    }
    const t = worldToTile(wp.x, wp.y, this.n);
    if (t.x < 0 || t.y < 0 || t.x >= this.n || t.y >= this.n) return;
    const run = (p.event as MouseEvent | undefined)?.shiftKey === true;
    if (orderMove(this.state, ids, [t.x, t.y], run).length === 0) return;
    const w = tileToWorld(t.x, t.y, this.n);
    this.ping.setPosition(w.x, w.y).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.ping);
    this.tweens.add({ targets: this.ping, alpha: 0, duration: 500, onComplete: () => this.ping.setVisible(false) });
  }

  // ---- Frame ----

  private publish(): void {
    const s = this.state;
    const lines = this.chosen().map((u) => {
      const bits = [`${name(u)}  HP ${u.hp}`, u.stance];
      if (u.order?.type === 'watch') bits.push('watching');
      if (u.order?.type === 'takedown') bits.push('takedown');
      if (u.order?.type === 'open') bits.push('opening crate');
      if (u.carrying) bits.push('carrying a body');
      if (canLure(u)) bits.push(u.lureCd > 0 ? `lure ${Math.ceil(u.lureCd / TICK_HZ)} s` : 'lure ready');
      return bits.join('  ·  ');
    });
    const opened = s.crates.filter((c) => c.opened).length;
    this.registry.set('m_loot', `Food ${s.loot.food}    Scrap ${s.loot.scrap}    Crates ${opened}/${s.crates.length}`);
    this.registry.set('m_sel', lines.length ? lines.join('\n') : 'Nobody selected');
    const hint = this.pending === 'watch' ? 'Click where to watch (right-click cancels)' : this.pending === 'takedown' ? 'Click an enemy to take down' : this.pending === 'lure' ? 'Click where to throw the lure' : '';
    this.registry.set('m_hint', this.time.now < this.toastUntil ? this.toastText : hint);
    let banner = '';
    if (s.status === 'failed') banner = 'A survivor died.  Restarting...';
    else if (s.status === 'success') banner = `Extracted!  Loot: food ${s.loot.food}, scrap ${s.loot.scrap}.  Press Enter for the ${this.campaign ? 'debrief' : 'menu'}.`;
    else if (this.paused) banner = 'PAUSED  (Space to resume; no orders while paused)';
    this.registry.set('m_banner', banner);
  }

  update(_t: number, dt: number): void {
    const cam = this.cameras.main;
    const k = this.keys;
    const p = this.input.activePointer;
    let dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (dx === 0 && dy === 0 && !this.dragFrom && this.game.input.mouse?.locked !== true && p.x > 0 && p.y > 0) {
      [dx, dy] = edgeDirection(p.x, p.y, cam.width, cam.height, CAM.edgePx);
    }
    const [mx, my] = panVector(dx, dy, dt, cam.zoom, CAM.panPxPerSec);
    if (mx || my) {
      this.centre = clampCenter(this.centre[0] + mx, this.centre[1] + my, worldBounds(this.n));
      cam.centerOn(...this.centre);
    }

    if (this.state.status === 'playing' && !this.paused) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS; i++) {
        this.tickOnce();
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else this.acc = 0;
    const frac = this.state.status === 'playing' && !this.paused ? this.acc / STEP_MS : 1;
    this.sync(frac);
    this.drawFx(frac);

    if (this.state.status === 'failed') {
      this.endedAt += dt;
      if (this.endedAt >= RESTART_MS) this.scene.restart();
    }

    this.box.clear();
    if (this.dragFrom && p.isDown && Math.hypot(p.x - this.dragFrom.x, p.y - this.dragFrom.y) >= DRAG_PX) {
      const f = this.dragFrom;
      this.box.fillStyle(0xe8e6de, 0.12).fillRect(f.x, f.y, p.x - f.x, p.y - f.y);
      this.box.lineStyle(1, 0xe8e6de, 0.8).strokeRect(f.x, f.y, p.x - f.x, p.y - f.y);
    }

    const t = this.tileOf(p);
    const inside = t.x >= 0 && t.y >= 0 && t.x < this.n && t.y < this.n;
    this.hover.setVisible(inside).setTint(this.pending ? 0xe8c46a : 0xffffff);
    if (inside) {
      const w = tileToWorld(t.x, t.y, this.n);
      this.hover.setPosition(w.x, w.y);
    }
    this.publish();
  }
}

/** Screen overlay over the mission: loot, selection, hints, controls and the pause / end banner. */
export class MissionHudScene extends Phaser.Scene {
  private loot!: Phaser.GameObjects.Text;
  private sel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;

  constructor() {
    super('MissionHud');
  }

  create(): void {
    const { width, height } = this.scale;
    const box = { backgroundColor: '#1d201cb0', padding: { x: 10, y: 6 } };
    this.loot = this.add.text(16, 12, '', { fontFamily: FONT, fontSize: '22px', color: '#e8e6de', ...box });
    this.sel = this.add.text(16, height - 16, '', { fontFamily: FONT, fontSize: '18px', color: '#e8e6de', ...box }).setOrigin(0, 1);
    this.hint = this.add.text(width / 2, height - 70, '', { fontFamily: FONT, fontSize: '20px', color: '#f0dc8a', ...box }).setOrigin(0.5, 1);
    this.banner = this.add.text(width / 2, height * 0.35, '', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', backgroundColor: '#141614d0', padding: { x: 24, y: 14 } }).setOrigin(0.5);
    this.add.text(width - 16, 14, 'Click/drag: select    Right-click: move / attack / open crate (Shift: run)\nC: stance    V: watch    F: takedown    G: carry body    L: lure\nSpace: pause    R: restart    Esc: leave', {
      fontFamily: FONT, fontSize: '13px', color: '#a8a69e', align: 'right',
    }).setOrigin(1, 0);
  }

  update(): void {
    const r = this.registry;
    this.loot.setText((r.get('m_loot') as string | undefined) ?? '');
    this.sel.setText((r.get('m_sel') as string | undefined) ?? '');
    const hint = (r.get('m_hint') as string | undefined) ?? '';
    this.hint.setText(hint).setVisible(hint !== '');
    const banner = (r.get('m_banner') as string | undefined) ?? '';
    this.banner.setText(banner).setVisible(banner !== '');
  }
}
