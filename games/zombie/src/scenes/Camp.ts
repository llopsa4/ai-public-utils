import Phaser from 'phaser';
import camp from '../data/camp.json';
import view from '../data/view.json';
import { clampCenter, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../render/camera';
import { type P, circlePoints, conePolygon, ringLook } from '../render/cones';
import { TILE_H, tileToWorld, worldBounds, worldToTile, worldToTileF } from '../render/iso';
import { anchorOf } from '../render/placeholders';
import { enemyViewer } from '../sim/ai';
import {
  TICK_HZ,
  type CampState,
  type PlaceResult,
  campFallen,
  createCamp,
  orderAttack,
  orderMove,
  orderWatch,
  placeBarricade,
  stepCamp,
} from '../sim/camp';
import { type Campaign, ENDING, browserStorage, newCampaign, nextMission, saveCampaign, withCamp } from '../sim/campaign';
import { TREE } from '../sim/grid';
import { survivorViewer, type Survivor } from '../sim/mission';

const N = view.campSize;
const CAM = view.camera;
const STEP_MS = 1000 / TICK_HZ;
const DRAG_PX = 6; // below this a left press is a click, not a box
const PICK_W = 16; // half-width and height (world px) of a unit's click target
const PICK_H = 44;
const RESTART_MS = 2500;
const NOISE_COLOR: Record<string, number> = { step: 0xd8d8d0, shot: 0xe0a45a, lure: 0x8fb4d8, alarm: 0xd85a4a };
const REFUSED: Record<Exclude<PlaceResult, 'ok'>, string> = {
  blocked: 'Cannot build there',
  occupied: 'Someone is standing there',
  scrap: 'Not enough scrap',
};

type Pending = null | 'watch' | 'build';
type Ord =
  | { type: 'move'; ids: string[]; to: [number, number] }
  | { type: 'watch'; id: string; toward: [number, number] }
  | { type: 'attack'; ids: string[]; target: string }
  | { type: 'build'; at: [number, number] };

interface Debug {
  state: CampState;
  step(n: number): void;
  orders(list: Ord[]): void;
}
declare global {
  interface Window {
    dw?: Debug;
  }
}

const name = (u: Survivor): string => u.kind[0]!.toUpperCase() + u.kind.slice(1);

/**
 * Camp scene (DESIGN §2, §10, §12, §13): the woods clearing with a tent, a fire, trees, the two
 * survivors and four roaming zombies. Left-click selects, drag box-selects, right-click moves (or
 * attacks a zombie), V then click sets a watch, B then click builds a barricade. All rules live in
 * `src/sim/camp.ts`; this scene draws the state and sends orders.
 */
export class CampScene extends Phaser.Scene {
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private hover!: Phaser.GameObjects.Image;
  private box!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private ping!: Phaser.GameObjects.Image;
  private centre: [number, number] = [0, 0];
  private state!: CampState;
  private campaign!: Campaign;
  private sprites = new Map<string, { body: Phaser.GameObjects.Image; ring?: Phaser.GameObjects.Image }>();
  private bodySprites = new Map<string, Phaser.GameObjects.Image>();
  private fenceSprites = new Map<string, Phaser.GameObjects.Image>();
  private decalCount = 0;
  private prev = new Map<string, [number, number]>();
  private selected = new Set<string>();
  private pending: Pending = null;
  private acc = 0;
  private endedAt = 0;
  private toastText = '';
  private toastUntil = 0;
  private dragFrom: { x: number; y: number } | null = null;

  constructor() {
    super('Camp');
  }

  create(): void {
    this.campaign = (this.registry.get('campaign') as Campaign | null | undefined) ?? newCampaign();
    this.registry.set('campaign', this.campaign);
    this.state = createCamp(this.campaign);
    this.sprites.clear();
    this.bodySprites.clear();
    this.fenceSprites.clear();
    this.prev.clear();
    this.selected.clear();
    this.decalCount = 0;
    this.pending = null;
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
      this.sprites.set(u.id, { body: this.add.image(0, 0, `survivor_${u.kind}`).setOrigin(...anchorOf(`survivor_${u.kind}`)), ring });
    }
    for (const e of this.state.enemies) this.sprites.set(e.id, { body: this.add.image(0, 0, 'zombie').setOrigin(...anchorOf('zombie')) });
    this.sync(1);

    const cam = this.cameras.main;
    cam.setBackgroundColor('#141614');
    cam.setZoom(CAM.zoomStart);
    const start = this.state.survivors[0]!;
    const mid = tileToWorld(start.x, start.y, N);
    this.centre = [mid.x, mid.y];
    cam.centerOn(mid.x, mid.y);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as typeof this.keys;
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const z = zoomStep(cam.zoom, dy, CAM.zoomStep, CAM.zoomMin, CAM.zoomMax);
      if (z === cam.zoom) return;
      this.centre = clampCenter(...zoomAtCursor(this.centre[0], this.centre[1], cam.zoom, p.x, p.y, cam.width, cam.height, z), worldBounds(N));
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
    kb.on('keydown-V', () => this.arm('watch'));
    kb.on('keydown-B', () => this.arm('build'));
    kb.on('keydown-M', () => this.startMission());
    kb.on('keydown-ESC', () => {
      if (this.pending) this.pending = null;
      else this.leave();
    });

    this.scene.launch('Hud');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('Hud'));
    this.publish();

    if (new URLSearchParams(window.location.search).has('debug')) {
      window.dw = {
        state: this.state,
        step: (k) => {
          for (let i = 0; i < k; i++) this.tickOnce();
          this.sync(1);
        },
        orders: (list) => list.forEach((o) => this.debugOrder(o)),
      };
    }
  }

  /** Keeps the camp's food, scrap and fences in the campaign and writes the save slot. */
  private keep(): void {
    this.campaign = withCamp(this.campaign, this.state.food, this.state.scrap, this.state.barricades);
    this.registry.set('campaign', this.campaign);
    saveCampaign(browserStorage(), this.campaign);
  }

  private leave(): void {
    this.keep();
    delete window.dw;
    this.scene.start('Menu');
  }

  private startMission(): void {
    if (campFallen(this.state)) return;
    if (!nextMission(this.campaign)) return this.toast(ENDING);
    this.keep();
    delete window.dw;
    this.scene.start('Mission');
  }

  private debugOrder(o: Ord): void {
    if (o.type === 'move') orderMove(this.state, o.ids, o.to);
    else if (o.type === 'watch') orderWatch(this.state, o.id, o.toward);
    else if (o.type === 'attack') orderAttack(this.state, o.ids, o.target);
    else placeBarricade(this.state, o.at[0], o.at[1]);
  }

  /** Ground, trees, tent and fire. Upright things are depth-sorted by the world y of their foot. */
  private drawWorld(): void {
    const g = this.state.grid;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const w = tileToWorld(x, y, N);
        this.add.image(w.x, w.y, (x + y) % 2 ? 'tile_ground_b' : 'tile_ground').setOrigin(...anchorOf('tile_ground')).setDepth(-1);
        if (g.tiles[y * N + x] === TREE) {
          this.add.image(w.x, w.y, 'tree').setOrigin(...anchorOf('tree')).setDepth(w.y);
        }
      }
    }
    const t = camp.tent;
    const tw = tileToWorld(t.x + (t.w - 1) / 2, t.y + (t.h - 1) / 2, N);
    this.add.image(tw.x, tw.y, 'tent').setOrigin(...anchorOf('tent')).setDepth(tw.y + TILE_H / 2);
    const fw = tileToWorld(camp.fire.x, camp.fire.y, N);
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
      const sp = this.sprites.get(u.id)!;
      sp.body.setVisible(u.hp > 0);
      sp.ring?.setVisible(false);
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, N);
      sp.body.setPosition(w.x, w.y).setDepth(w.y);
      if (u.side === 'survivor') sp.ring?.setPosition(w.x, w.y).setVisible(this.selected.has(u.id));
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
      img.setPosition(w.x, w.y).setDepth(w.y - 1);
    }
    for (; this.decalCount < s.decals.length; this.decalCount++) {
      const d = s.decals[this.decalCount]!;
      const w = tileToWorld(d.x, d.y, N);
      this.add.image(w.x, w.y, 'blood').setOrigin(...anchorOf('blood')).setDepth(0.2);
    }
    this.syncBarricades();
  }

  /** One sprite per placed segment; a damaged one fades; a broken one disappears. */
  private syncBarricades(): void {
    const live = new Set<string>();
    for (const b of this.state.barricades) {
      const key = `${b.x},${b.y}`;
      live.add(key);
      let img = this.fenceSprites.get(key);
      if (!img) {
        const w = tileToWorld(b.x, b.y, N);
        img = this.add.image(w.x, w.y, 'barricade').setOrigin(...anchorOf('barricade')).setDepth(w.y);
        this.fenceSprites.set(key, img);
      }
      img.setAlpha(0.45 + (0.55 * b.hp) / camp.barricade.hp);
    }
    for (const [key, img] of this.fenceSprites) {
      if (live.has(key)) continue;
      img.destroy();
      this.fenceSprites.delete(key);
    }
  }

  private tickOnce(): void {
    for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
    stepCamp(this.state);
  }

  // ---- Drawing the cones, rings and health bars each frame ----

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
      this.fill(conePolygon(s.grid, { ...enemyViewer(e), x, y }), 0xd04030, 0.2, 0.5);
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
      const w = circlePoints(r.x, r.y, look.r).map(([px, py]) => tileToWorld(px, py, N));
      this.fx.lineStyle(2, NOISE_COLOR[r.kind] ?? 0xd8d8d0, look.alpha).strokePoints(w, true);
    }
    for (const u of [...s.survivors, ...s.enemies]) {
      if (u.hp <= 0 || (u.side !== 'survivor' && u.hp >= u.maxHp)) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, N);
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

  private get canOrder(): boolean {
    return !campFallen(this.state);
  }

  private toast(msg: string): void {
    this.toastText = msg;
    this.toastUntil = this.time.now + 1800;
  }

  private arm(mode: 'watch' | 'build'): void {
    if (!this.canOrder) return;
    if (mode === 'watch' && this.chosen().length === 0) return this.toast('Select a survivor first');
    this.pending = this.pending === mode ? null : mode;
  }

  private leftClick(p: Phaser.Input.Pointer): void {
    const wp = this.worldOf(p);
    if (this.pending && this.canOrder) return this.resolvePending(p, wp);
    const id = this.unitAt(wp, this.state.survivors);
    this.selected.clear();
    if (id) this.selected.add(id);
    this.sync(1);
  }

  /** Watch ends after its click; build stays armed so a fence can be laid segment by segment. */
  private resolvePending(p: Phaser.Input.Pointer, wp: { x: number; y: number }): void {
    if (this.pending === 'watch') {
      const f = worldToTileF(wp.x, wp.y, N);
      for (const u of this.chosen()) orderWatch(this.state, u.id, [f.x, f.y]);
      this.pending = null;
    } else if (this.pending === 'build') {
      const t = this.tileOf(p);
      const r = placeBarricade(this.state, t.x, t.y);
      if (r !== 'ok') this.toast(REFUSED[r]);
      else if (this.state.scrap < camp.barricade.cost) this.pending = null;
      this.syncBarricades();
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

  /** Right-click: cancels a pending order; else attack a zombie, or move. */
  private rightClick(p: Phaser.Input.Pointer): void {
    if (this.pending) {
      this.pending = null;
      return;
    }
    const who = this.chosen();
    if (!this.canOrder || who.length === 0) return;
    const ids = who.map((u) => u.id);
    const zombie = this.unitAt(this.worldOf(p), this.state.enemies);
    if (zombie) {
      orderAttack(this.state, ids, zombie);
      return;
    }
    const t = this.tileOf(p);
    if (t.x < 0 || t.y < 0 || t.x >= N || t.y >= N) return;
    if (orderMove(this.state, ids, [t.x, t.y]).length === 0) return;
    const w = tileToWorld(t.x, t.y, N);
    this.ping.setPosition(w.x, w.y).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.ping);
    this.tweens.add({ targets: this.ping, alpha: 0, duration: 500, onComplete: () => this.ping.setVisible(false) });
  }

  // ---- Frame ----

  private publish(): void {
    const s = this.state;
    const lines = this.chosen().map((u) => {
      const bits = [`${name(u)}  HP ${u.hp}`];
      if (u.order?.type === 'watch') bits.push('watching');
      if (u.order?.type === 'attack') bits.push('attacking');
      return bits.join('  ·  ');
    });
    const zombies = s.enemies.filter((e) => e.hp > 0).length;
    this.registry.set('food', s.food);
    this.registry.set('scrap', s.scrap);
    this.registry.set('zombies', zombies);
    this.registry.set('selected', lines.join('\n'));
    const hint = this.pending === 'watch' ? 'Click where to watch (right-click cancels)' : this.pending === 'build' ? `Click a tile to build a barricade, ${camp.barricade.cost} scrap each (right-click cancels)` : '';
    const next = nextMission(this.campaign);
    const idle = next ? `M: start ${next.title}` : ENDING;
    this.registry.set('hint', this.time.now < this.toastUntil ? this.toastText : hint || idle);
    this.registry.set('banner', campFallen(s) ? 'The camp has fallen.  Restarting...' : '');
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
      this.centre = clampCenter(this.centre[0] + mx, this.centre[1] + my, worldBounds(N));
      cam.centerOn(...this.centre);
    }

    const fallen = campFallen(this.state);
    if (!fallen) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS; i++) {
        this.tickOnce();
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else this.acc = 0;
    const frac = fallen ? 1 : this.acc / STEP_MS;
    this.sync(frac);
    this.drawFx(frac);

    if (fallen) {
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
    const inside = t.x >= 0 && t.y >= 0 && t.x < N && t.y < N;
    this.hover.setVisible(inside).setTint(this.pending ? 0xe8c46a : 0xffffff);
    if (inside) {
      const w = tileToWorld(t.x, t.y, N);
      this.hover.setPosition(w.x, w.y);
    }
    this.publish();
  }
}
