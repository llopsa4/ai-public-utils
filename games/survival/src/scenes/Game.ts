import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { buildingDefs, lineSites, placementError } from '../sim/buildings';
import { music } from '../audio/music';
import { BISON_HALF_WIDTH, bisonLane, STORM_RADIUS } from '../sim/effects';
import { flushOrders } from '../sim/orders';
import { campCentre } from '../sim/map';
import { newGame, queueOrders, step } from '../sim/tick';
import { loadState, serialize, type SaveFile } from '../sim/save';
import { addMessage, DAY_TICKS, footprintOf, type GameState, type Order, type Tile2 } from '../sim/state';
import { browserStorage, clearSlot, writeSlot, type SlotId, type SlotStorage } from '../save/slots';
import { TILE_H, TILE_W, tileToWorld, worldBounds, worldToTileF } from '../render/iso';
import { applyArt, fromAtlas, spriteFor } from '../render/art';
import { barricadeMask, buildingFrame, buildingState, flameFrame, FLAMES } from '../render/buildingArt';
import { seasonAt } from '../sim/seasons';
import { TerrainView } from '../render/terrainView';
import { ArrowsView } from '../render/arrows';
import { EnemiesView } from '../render/enemies';
import { FxView } from '../render/fx';
import { PeopleView } from '../render/people';
import { StoreHover } from '../render/stores';
import type { BuildScene } from './Build';
import type { HudScene } from './Hud';
import type { SelectScene } from './Select';
import { clampCenter, clampZoom, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../render/camera';

const TICK_MS = 100;

export class GameScene extends Phaser.Scene {
  state!: GameState;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private pointerInside = false;
  private people!: PeopleView;
  private enemies!: EnemiesView;
  private arrows!: ArrowsView;
  private fx!: FxView;
  private stores!: StoreHover;
  private terrain!: TerrainView;
  private seenMapVersion = 0;
  private acc = 0;
  private buildingViews = new Map<number, Phaser.GameObjects.Image>();
  /** The frame each building sprite shows now, so a texture is set only when the frame changes. */
  private buildingFrames = new Map<number, string>();
  private flames = new Map<number, Phaser.GameObjects.Image>();
  /** The building type being placed (ghost under the cursor), or null. */
  placing: string | null = null;
  /** Whether the ghost's tile is valid now (the cursor turns to `invalid` when it is not). */
  ghostOk = true;
  /** The people selected when the building card was picked: the `place` order's builders (up to 3 of them build). */
  placers: number[] = [];
  /** The aimed power (bison charge, storm caller) waiting for a left-click on the map, or null. */
  aiming: string | null = null;
  private ghost!: Phaser.GameObjects.Image;
  private ghostTiles!: Phaser.GameObjects.Graphics;
  /** Where a line building's drag started (barricades: drag a straight line), or null. */
  private dragStart: Tile2 | null = null;
  /** `downTime` of the last press this scene used for building placement, so selection ignores it. */
  consumedDownTime = -1;
  /** The slot this run saves into, or null when the browser cannot store (DESIGN-saves.md). */
  private slot: SlotId | null = null;
  private storage: SlotStorage | null = null;
  private lastDay = 0;
  private lastPaused = false;
  /** Set once the run has a result: its slot was cleared and nothing is saved after that. */
  private ended = false;
  private warned = false;
  private readonly onHide = (): void => {
    if (document.visibilityState === 'hidden') this.saveNow();
  };
  private readonly onPageHide = (): void => void this.saveNow();

  constructor() {
    super('Game');
  }

  /** A new camp (`seed`) or a loaded one (`save`), in a slot or in none. */
  create(data: { slot?: SlotId | null; seed?: number; save?: SaveFile }): void {
    this.state = data.save ? loadState(data.save) : newGame(data.seed ?? mapConfig.start.seed);
    // The scene object outlives a run: forget the last run's views and save bookkeeping.
    this.buildingViews.clear();
    this.buildingFrames.clear();
    this.flames.clear();
    this.acc = 0;
    this.placing = null;
    this.placers = [];
    this.aiming = null;
    this.dragStart = null;
    this.consumedDownTime = -1;
    this.seenMapVersion = this.state.mapVersion;
    this.slot = data.slot ?? null;
    this.storage = this.slot === null ? null : browserStorage();
    if (!this.storage) this.slot = null;
    this.lastDay = Math.floor(this.state.tick / DAY_TICKS);
    this.lastPaused = this.state.paused;
    this.ended = false;
    this.warned = false;
    music.reset();
    document.addEventListener('visibilitychange', this.onHide);
    window.addEventListener('pagehide', this.onPageHide);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onHide);
      window.removeEventListener('pagehide', this.onPageHide);
      music.reset();
    });
    if (this.slot === null) this.warnAutosaveOff();
    this.terrain = new TerrainView(this, this.state);
    this.people = new PeopleView(this, this.state.map.size);
    this.enemies = new EnemiesView(this, this.state.map.size);
    this.arrows = new ArrowsView(this, this.state.map.size);
    this.fx = new FxView(this, this.state.map.size);
    this.stores = new StoreHover(this);
    this.setupCamera();
    this.setupPlacing();
    // Select first: the building cards (Build) sit on its panel, and the HUD's panels sit above both.
    this.scene.launch('Select', { game: this });
    this.scene.launch('Build', { game: this });
    this.scene.launch('Hud', { game: this });
    if (new URLSearchParams(location.search).has('debug')) {
      const s = this.state;
      (window as unknown as { camp: unknown }).camp = {
        state: s,
        step: (n: number) => step(s, n),
        orders: (list: Order[]) => queueOrders(s, list),
        scene: this,
        storeOpen: () => this.stores.shown(),
        terrain: () => ({ ...this.terrain.counts(), frame: (x: number, y: number) => this.terrain.groundFrame(x, y) }),
        music: () => music.status(),
        creatures: () => ({
          ...this.enemies.shown(),
          arrows: this.arrows.shown(),
          fx: { ...this.fx.counts },
          playing: this.fx.playing(),
          person: (id: number) => this.people.shown(id),
        }),
        buildings: () => ({
          frames: Object.fromEntries(this.buildingFrames),
          flames: [...this.flames].filter(([, f]) => f.visible).map(([id]) => id),
        }),
      };
    }
  }

  /** The slot a save would go into (the HUD menu reads it for the export name). */
  get saveSlot(): SlotId | null {
    return this.slot;
  }

  private warnAutosaveOff(): void {
    if (this.warned) return;
    this.warned = true;
    addMessage(this.state, "Autosave is off: the browser can't store it.");
  }

  /** Writes the run into its slot now; false when there is no slot, the write failed or the run ended. */
  saveNow(): boolean {
    if (this.ended || this.state.result !== null) return false;
    if (this.slot === null || !this.storage) {
      this.warnAutosaveOff();
      return false;
    }
    const ok = writeSlot(this.storage, this.slot, serialize(this.state));
    if (!ok) this.warnAutosaveOff();
    return ok;
  }

  /** After the ticks of a frame (never in the middle of one): the result, a new day, a fresh pause. */
  private autosave(): void {
    const s = this.state;
    if (this.ended) return;
    if (s.result !== null) {
      this.ended = true;
      if (this.slot !== null && this.storage) clearSlot(this.storage, this.slot);
      return;
    }
    const day = Math.floor(s.tick / DAY_TICKS);
    const newDay = day > this.lastDay;
    const justPaused = s.paused && !this.lastPaused;
    this.lastDay = Math.max(this.lastDay, day);
    this.lastPaused = s.paused;
    if (newDay || justPaused) this.saveNow();
  }

  private place(key: string, tx: number, ty: number, dx = 0, dy = 0): Phaser.GameObjects.Image {
    const w = tileToWorld(tx, ty, this.state.map.size);
    const img = spriteFor(this, key, w.x + dx, w.y + dy);
    img.setDepth(w.y + dy);
    return img;
  }

  /**
   * The sprite of a building follows the state: the frame of its build stage, then finished or winter (a barricade by its
   * neighbours, the drying rack looping). Without final art a site is faint and firms up as it is built. A finished fire or
   * fire pit carries a flame when `fx_flame` has art.
   */
  private syncBuildings(time: number): void {
    const alive = new Set<number>();
    const winter = seasonAt(this.state.tick) === 'winter';
    const open = this.stores.shown()?.id ?? null;
    const walls = new Set<string>();
    for (const b of this.state.buildings) if (b.type === 'barricade') walls.add(`${b.x},${b.y}`);
    for (const b of this.state.buildings) {
      alive.add(b.id);
      const key = b.type === 'fire' ? 'fire_central' : `building_${b.type}`;
      let img = this.buildingViews.get(b.id);
      if (!img) {
        const [w, h] = buildingDefs[b.type].size;
        img = this.place(key, b.x + (w - 1) / 2, b.y + (h - 1) / 2);
        this.buildingViews.set(b.id, img);
      }
      const points = buildingDefs[b.type].buildPoints ?? 1;
      if (b.id === open) {
        // The open store shows its inside (StoreHover owns the sprite); the frame is picked again when it closes.
        this.buildingFrames.delete(b.id);
        img.setAlpha(1);
      } else {
        const state = buildingState(b.built, points, b.done, winter);
        const mask = b.type === 'barricade' ? barricadeMask((x, y) => walls.has(`${x},${y}`), b.x, b.y) : 0;
        const frame = buildingFrame(key, state, mask, time, b.id * 0.37);
        if (this.buildingFrames.get(b.id) !== frame) {
          applyArt(img, key, frame);
          this.buildingFrames.set(b.id, frame);
        }
        img.setAlpha(b.done || fromAtlas(this, key, frame) ? 1 : 0.35 + 0.5 * Math.min(1, b.built / points));
      }
      this.syncFlame(b.id, b.type, b.done, img, time);
    }
    for (const [id, img] of this.buildingViews) {
      if (!alive.has(id)) {
        img.destroy();
        this.buildingViews.delete(id);
        this.buildingFrames.delete(id);
        this.flames.get(id)?.destroy();
        this.flames.delete(id);
      }
    }
  }

  /** The flame loop on a finished fire or fire pit, anchored on the footprint centre (the hearth); none without art. */
  private syncFlame(id: number, type: string, done: boolean, base: Phaser.GameObjects.Image, time: number): void {
    const scale = FLAMES[type];
    if (scale === undefined) return;
    const frame = flameFrame(time, id * 0.37);
    const show = done && fromAtlas(this, 'fx_flame', frame);
    let flame = this.flames.get(id);
    if (!show) {
      flame?.setVisible(false);
      return;
    }
    if (!flame) {
      flame = spriteFor(this, 'fx_flame', base.x, base.y, frame);
      this.flames.set(id, flame);
    }
    applyArt(flame, 'fx_flame', frame).setScale(0.5 * scale).setPosition(base.x, base.y).setDepth(base.depth + 0.5).setVisible(true);
  }

  private buildScene(): BuildScene | undefined {
    return this.scene.get('Build') as BuildScene | undefined;
  }

  /** True when a screen point is on the selection panel (the building cards are part of it) or the HUD. */
  private overUi(x: number, y: number): boolean {
    const select = this.scene.get('Select') as SelectScene | undefined;
    const hud = this.scene.get('Hud') as HudScene | undefined;
    return !!hud?.menuOpen || !!select?.overUi(x, y);
  }

  /** Starts or stops placing a building (the Build scene calls this); `builders` is the selection at the pick. */
  setPlacing(type: string | null, builders: number[] = []): void {
    this.placing = type;
    this.placers = type ? builders : [];
    if (type) this.aiming = null;
    this.dragStart = null;
    this.ghost.setVisible(false);
    this.ghostTiles.clear();
    if (type) {
      applyArt(this.ghost, `building_${type}`);
    }
  }

  /** Starts or stops aiming a power at the map (the power bar in the HUD calls this); it ends any placing. */
  setAiming(id: string | null): void {
    if (id) this.setPlacing(null);
    this.aiming = id;
    if (!id) this.ghostTiles.clear();
  }

  private setupPlacing(): void {
    this.ghost = spriteFor(this, 'building_tipi', 0, 0).setAlpha(0.6).setDepth(100000).setVisible(false);
    this.ghostTiles = this.add.graphics().setDepth(99999);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overUi(pointer.x, pointer.y)) return;
      if (this.aiming) {
        this.consumedDownTime = pointer.downTime;
        if (pointer.rightButtonDown()) this.setAiming(null);
        else if (pointer.leftButtonDown()) {
          const max = this.state.map.size - 1;
          const [x, y] = this.ghostTile(pointer);
          queueOrders(this.state, [{ type: 'cast', power: this.aiming, at: [Math.min(max, Math.max(0, x)), Math.min(max, Math.max(0, y))] }]);
          this.setAiming(null);
        }
        return;
      }
      if (this.placing) this.consumedDownTime = pointer.downTime;
      if (pointer.rightButtonDown()) {
        if (this.placing) this.setPlacing(null);
        return;
      }
      if (!this.placing || !pointer.leftButtonDown()) return;
      const [x, y] = this.ghostTile(pointer);
      if (buildingDefs[this.placing].line) {
        this.dragStart = [x, y];
        return;
      }
      const error = placementError(this.state, this.placing, x, y);
      if (error) {
        this.buildScene()?.toast(error);
        return;
      }
      queueOrders(this.state, [{ type: 'place', building: this.placing, at: [x, y], builders: this.placers }]);
      this.setPlacing(null);
    });
    // A line building is placed on release: one site per free, paid-for tile of the line. Placing goes on, so
    // the next line can be dragged at once; right-click or Esc stops.
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const start = this.dragStart;
      this.dragStart = null;
      if (!start || !this.placing) return;
      const line = lineSites(this.state, this.placing, start, this.ghostTile(pointer));
      // One order for the whole line: the first site is `at`, the rest follow, so its builders move along it.
      const tiles = line.tiles.filter((_, i) => line.ok[i]);
      if (tiles.length === 0) this.buildScene()?.toast(line.error ?? "Can't build there.");
      else queueOrders(this.state, [{ type: 'place', building: this.placing, at: tiles[0], line: tiles.slice(1), builders: this.placers }]);
    });
  }

  /** The tile under the pointer: the top-left tile of the footprint being placed. */
  private ghostTile(pointer: Phaser.Input.Pointer): [number, number] {
    const w = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const f = worldToTileF(w.x, w.y, this.state.map.size);
    return [Math.floor(f.x), Math.floor(f.y)];
  }

  /** The aiming reticle: the storm's circle, or the bison's lane across the map, under the pointer. */
  private drawAim(pointer: Phaser.Input.Pointer): void {
    this.ghost.setVisible(false);
    this.ghostTiles.clear();
    if (!this.pointerInside || this.overUi(pointer.x, pointer.y)) return;
    const size = this.state.map.size;
    const max = size - 1;
    const [px, py] = this.ghostTile(pointer);
    const at: Tile2 = [Math.min(max, Math.max(0, px)), Math.min(max, Math.max(0, py))];
    const [cx, cy] = at; // tile centres are whole numbers in tile space
    this.ghostTiles.fillStyle(0x4caf50, 0.35).lineStyle(2, 0xf3e9d2, 0.9);
    if (this.aiming === 'storm_caller') {
      const c = tileToWorld(cx, cy, size);
      const rx = STORM_RADIUS * TILE_W * Math.SQRT1_2;
      const ry = STORM_RADIUS * TILE_H * Math.SQRT1_2;
      this.ghostTiles.fillEllipse(c.x, c.y, rx * 2, ry * 2).strokeEllipse(c.x, c.y, rx * 2, ry * 2);
      return;
    }
    // The lane: from where the herd starts, along the direction it runs, BISON_HALF_WIDTH either side, for its run (kept on the map).
    const { start, dir, run } = bisonLane(size, at);
    const w = BISON_HALF_WIDTH;
    const clip = (v: number) => Math.min(max + 0.5, Math.max(-0.5, v));
    const ex = clip(start[0] + dir[0] * run);
    const ey = clip(start[1] + dir[1] * run);
    const [sx, sy] = [clip(start[0] - dir[0] * 0.5), clip(start[1] - dir[1] * 0.5)];
    const lane = dir[0] !== 0 ? [[sx, cy - w], [ex, cy - w], [ex, cy + w], [sx, cy + w]] : [[cx - w, sy], [cx + w, sy], [cx + w, ey], [cx - w, ey]];
    const pts = lane.map(([x, y]) => tileToWorld(x, y, size));
    this.ghostTiles.fillPoints(pts, true).strokePoints(pts, true);
  }

  private updateGhost(): void {
    const pointer = this.input.activePointer;
    if (this.aiming) {
      this.drawAim(pointer);
      return;
    }
    this.ghostOk = true;
    if (!this.placing || !this.pointerInside || this.overUi(pointer.x, pointer.y)) {
      this.ghost.setVisible(false);
      this.ghostTiles.clear();
      return;
    }
    const [x, y] = this.ghostTile(pointer);
    if (this.dragStart) {
      const line = lineSites(this.state, this.placing, this.dragStart, [x, y]);
      this.ghost.setVisible(false);
      this.ghostTiles.clear();
      line.tiles.forEach(([tx, ty], i) => {
        const t = tileToWorld(tx, ty, this.state.map.size);
        this.ghostTiles.fillStyle(line.ok[i] ? 0x4caf50 : 0xd9534f, 0.45).fillPoints([
          { x: t.x, y: t.y - TILE_H / 2 }, { x: t.x + TILE_W / 2, y: t.y },
          { x: t.x, y: t.y + TILE_H / 2 }, { x: t.x - TILE_W / 2, y: t.y },
        ], true);
      });
      return;
    }
    const ok = placementError(this.state, this.placing, x, y) === null;
    this.ghostOk = ok;
    const [w, h] = buildingDefs[this.placing].size;
    const c = tileToWorld(x + (w - 1) / 2, y + (h - 1) / 2, this.state.map.size);
    this.ghost.setPosition(c.x, c.y).setVisible(true).setTint(ok ? 0xffffff : 0xff8080);
    this.ghostTiles.clear().fillStyle(ok ? 0x4caf50 : 0xd9534f, 0.4);
    for (const [tx, ty] of footprintOf(this.placing, x, y)) {
      const t = tileToWorld(tx, ty, this.state.map.size);
      this.ghostTiles.fillPoints([
        { x: t.x, y: t.y - TILE_H / 2 }, { x: t.x + TILE_W / 2, y: t.y },
        { x: t.x, y: t.y + TILE_H / 2 }, { x: t.x - TILE_W / 2, y: t.y },
      ], true);
    }
  }

  /** The open store: hovering a finished store (not while placing, aiming or over a panel) shows its inside. */
  private hoverStore(): void {
    const p = this.input.activePointer;
    const on = this.pointerInside && !this.placing && !this.aiming && !this.overUi(p.x, p.y);
    this.stores.update(this.state, this.buildingViews, on ? this.cameras.main.getWorldPoint(p.x, p.y) : null);
  }

  /** The world rectangle the camera shows now (`worldView` is only refreshed at render time, a frame late). */
  private cameraView(): { x: number; y: number; width: number; height: number } {
    const cam = this.cameras.main;
    const width = cam.width / cam.zoom;
    const height = cam.height / cam.zoom;
    return { x: cam.scrollX + cam.width / 2 - width / 2, y: cam.scrollY + cam.height / 2 - height / 2, width, height };
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    const bounds = worldBounds(this.state.map.size);
    const [fx, fy] = campCentre(this.state.map);
    const fire = tileToWorld(fx - 0.5, fy - 0.5, this.state.map.size);
    cam.setZoom(1);
    cam.centerOn(fire.x, fire.y);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointermove', () => (this.pointerInside = true));
    this.input.on('gameout', () => (this.pointerInside = false));
    this.input.on('gameover', () => (this.pointerInside = true));
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      const [zMin, zMax] = mapConfig.camera.zoom;
      const next = zoomStep(cam.zoom, dy, mapConfig.camera.zoomStep, zMin, zMax);
      if (next === cam.zoom) return;
      const [cx, cy] = zoomAtCursor(
        cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2, cam.zoom,
        pointer.x, pointer.y, cam.width, cam.height, next,
      );
      cam.setZoom(clampZoom(next, zMin, zMax));
      const [px, py] = clampCenter(cx, cy, bounds);
      cam.centerOn(px, py);
    });
  }

  /** Centres the camera on a world point, kept on the map (the minimap's left-click and drag). */
  centerOnWorld(x: number, y: number): void {
    const [cx, cy] = clampCenter(x, y, worldBounds(this.state.map.size));
    this.cameras.main.centerOn(cx, cy);
  }

  private panCamera(delta: number): void {
    const cam = this.cameras.main;
    const k = this.keys;
    let dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (dx === 0 && dy === 0 && this.pointerInside) {
      const p = this.input.activePointer;
      [dx, dy] = edgeDirection(p.x, p.y, cam.width, cam.height, mapConfig.camera.edgePx);
    }
    if (dx === 0 && dy === 0) return;
    const [mx, my] = panVector(dx, dy, delta, cam.zoom, mapConfig.camera.panPxPerSec);
    const [cx, cy] = clampCenter(
      cam.scrollX + cam.width / 2 + mx, cam.scrollY + cam.height / 2 + my, worldBounds(this.state.map.size),
    );
    cam.centerOn(cx, cy);
  }

  update(time: number, delta: number): void {
    this.panCamera(delta);
    // Fixed simulation tick: 10 per second at 1x; 2x and 4x run more ticks per frame. While paused,
    // orders still take effect (people just do not move until the game runs again).
    if (this.state.paused) {
      flushOrders(this.state);
      this.acc = 0;
    } else {
      this.acc += delta * this.state.speed;
      let guard = 0;
      while (this.acc >= TICK_MS && guard++ < 40) {
        step(this.state, 1);
        this.acc -= TICK_MS;
      }
      if (guard >= 40) this.acc = 0;
    }
    this.autosave();
    if (this.state.mapVersion !== this.seenMapVersion) {
      this.seenMapVersion = this.state.mapVersion;
      this.terrain.refresh(this.state);
    }
    this.terrain.update(this.state);
    this.terrain.cull(this.cameraView());
    this.hoverStore();
    this.syncBuildings(time);
    this.updateGhost();
    this.people.sync(this.state, delta, time);
    this.enemies.sync(this.state, delta, time);
    this.arrows.update(this.state, time, (id) => this.people.ground(id));
    this.fx.update(this.state, time);
    music.update(this.state.enemies.length > 0, this.state.tick);
  }
}
