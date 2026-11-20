import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { buildingDefs, placementError } from '../sim/buildings';
import { flushOrders } from '../sim/orders';
import { newGame, queueOrders, step } from '../sim/tick';
import { loadState, serialize, type SaveFile } from '../sim/save';
import { addMessage, DAY_TICKS, type GameState, type Order } from '../sim/state';
import { browserStorage, clearSlot, writeSlot, type SlotId, type SlotStorage } from '../save/slots';
import { TILE_H, TILE_W, tileToWorld, worldBounds, worldToTileF } from '../render/iso';
import { entry, manifest } from '../render/manifest';
import { EnemiesView } from '../render/enemies';
import { PeopleView } from '../render/people';
import { ENEMIES } from '../sim/combat';
import type { BuildScene } from './Build';
import type { HudScene } from './Hud';
import type { SelectScene } from './Select';
import { clampCenter, clampZoom, edgeDirection, panVector, zoomAtCursor, zoomStep } from '../render/camera';

const GROUND_DEPTH = -100000;
const TICK_MS = 100;

/** Small deterministic hash in [0, 1) so tiles vary without touching the sim RNG. */
function hash(x: number, y: number, k: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263 + k * 2246822519, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class GameScene extends Phaser.Scene {
  state!: GameState;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private pointerInside = false;
  private people!: PeopleView;
  private enemies!: EnemiesView;
  private ground: Phaser.GameObjects.Image[] = [];
  private trees = new Map<number, Phaser.GameObjects.Image>();
  private seenMapVersion = 0;
  private acc = 0;
  private buildingViews = new Map<number, Phaser.GameObjects.Image>();
  /** The building type being placed (ghost under the cursor), or null. */
  placing: string | null = null;
  private ghost!: Phaser.GameObjects.Image;
  private ghostTiles!: Phaser.GameObjects.Graphics;
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
    this.ground = [];
    this.trees.clear();
    this.buildingViews.clear();
    this.acc = 0;
    this.placing = null;
    this.consumedDownTime = -1;
    this.seenMapVersion = this.state.mapVersion;
    this.slot = data.slot ?? null;
    this.storage = this.slot === null ? null : browserStorage();
    if (!this.storage) this.slot = null;
    this.lastDay = Math.floor(this.state.tick / DAY_TICKS);
    this.lastPaused = this.state.paused;
    this.ended = false;
    this.warned = false;
    document.addEventListener('visibilitychange', this.onHide);
    window.addEventListener('pagehide', this.onPageHide);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onHide);
      window.removeEventListener('pagehide', this.onPageHide);
    });
    if (this.slot === null) this.warnAutosaveOff();
    this.drawMap();
    this.people = new PeopleView(this, this.state.map.size);
    this.enemies = new EnemiesView(this, this.state.map.size);
    this.setupCamera();
    this.setupPlacing();
    this.scene.launch('Build', { game: this });
    this.scene.launch('Hud', { game: this });
    this.scene.launch('Select', { game: this });
    if (new URLSearchParams(location.search).has('debug')) {
      const s = this.state;
      (window as unknown as { camp: unknown }).camp = {
        state: s,
        step: (n: number) => step(s, n),
        orders: (list: Order[]) => queueOrders(s, list),
        scene: this,
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
    const e = entry(key);
    const w = tileToWorld(tx, ty, this.state.map.size);
    const img = this.add.image(w.x + dx, w.y + dy, key).setOrigin(e.anchor[0], e.anchor[1]);
    img.setDepth(w.y + dy);
    return img;
  }

  private drawMap(): void {
    const { size, tiles } = this.state.map;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const type = tiles[y * size + x];
        const key = `tile_${type}`;
        const e = manifest[key];
        const w = tileToWorld(x, y, size);
        const ground = this.add.image(w.x, w.y, key).setOrigin(e.anchor[0], e.anchor[1]).setDepth(GROUND_DEPTH);
        if (e.status === 'placeholder') {
          const v = 0xff - Math.floor(hash(x, y, 1) * 22);
          ground.setTint((v << 16) | (v << 8) | v);
        }
        this.ground[y * size + x] = ground;
        if (type === 'forest') {
          // Upright tree standing near the tile centre, jittered a little, depth-sorted by its base.
          const jx = (hash(x, y, 2) - 0.5) * 16;
          const jy = (hash(x, y, 3) - 0.5) * 6;
          this.trees.set(y * size + x, this.place('object_tree', x, y, jx, 8 + jy));
        }
      }
    }
  }

  /** The sprite of a building follows the state: a site is faint and firms up as it is built. */
  private syncBuildings(): void {
    const alive = new Set<number>();
    for (const b of this.state.buildings) {
      alive.add(b.id);
      let img = this.buildingViews.get(b.id);
      if (!img) {
        const fire = b.type === 'fire';
        img = this.place(fire ? 'fire_central' : `building_${b.type}`, b.x + 0.5, b.y + 0.5, 0, fire ? 8 : 0);
        this.buildingViews.set(b.id, img);
      }
      const points = buildingDefs[b.type].buildPoints ?? 1;
      img.setAlpha(b.done ? 1 : 0.35 + 0.5 * Math.min(1, b.built / points));
    }
    for (const [id, img] of this.buildingViews) {
      if (!alive.has(id)) {
        img.destroy();
        this.buildingViews.delete(id);
      }
    }
  }

  private buildScene(): BuildScene | undefined {
    return this.scene.get('Build') as BuildScene | undefined;
  }

  /** True when a screen point is on the build menu or the selection panel. */
  private overUi(x: number, y: number): boolean {
    const select = this.scene.get('Select') as SelectScene | undefined;
    const hud = this.scene.get('Hud') as HudScene | undefined;
    return !!hud?.menuOpen || !!this.buildScene()?.overUi(x, y) || !!select?.overUi(x, y);
  }

  /** Starts or stops placing a building (the Build scene calls this). */
  setPlacing(type: string | null): void {
    this.placing = type;
    this.ghost.setVisible(false);
    this.ghostTiles.clear();
    if (type) {
      const a = entry(`building_${type}`).anchor;
      this.ghost.setTexture(`building_${type}`).setOrigin(a[0], a[1]);
    }
  }

  private setupPlacing(): void {
    this.ghost = this.add.image(0, 0, 'building_tipi').setAlpha(0.6).setDepth(100000).setVisible(false);
    this.ghostTiles = this.add.graphics().setDepth(99999);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overUi(pointer.x, pointer.y)) return;
      if (this.placing) this.consumedDownTime = pointer.downTime;
      if (pointer.rightButtonDown()) {
        if (this.placing) this.setPlacing(null);
        return;
      }
      if (!this.placing || !pointer.leftButtonDown()) return;
      const [x, y] = this.ghostTile(pointer);
      const error = placementError(this.state, this.placing, x, y);
      if (error) {
        this.buildScene()?.toast(error);
        return;
      }
      queueOrders(this.state, [{ type: 'place', building: this.placing, at: [x, y] }]);
      this.setPlacing(null);
    });
  }

  /** Top-left tile of a 2x2 footprint centred under the pointer. */
  private ghostTile(pointer: Phaser.Input.Pointer): [number, number] {
    const w = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const f = worldToTileF(w.x, w.y, this.state.map.size);
    return [Math.floor(f.x), Math.floor(f.y)];
  }

  private updateGhost(): void {
    const pointer = this.input.activePointer;
    if (!this.placing || !this.pointerInside || this.overUi(pointer.x, pointer.y)) {
      this.ghost.setVisible(false);
      this.ghostTiles.clear();
      return;
    }
    const [x, y] = this.ghostTile(pointer);
    const ok = placementError(this.state, this.placing, x, y) === null;
    const c = tileToWorld(x + 0.5, y + 0.5, this.state.map.size);
    this.ghost.setPosition(c.x, c.y).setVisible(true).setTint(ok ? 0xffffff : 0xff8080);
    this.ghostTiles.clear().fillStyle(ok ? 0x4caf50 : 0xd9534f, 0.4);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const t = tileToWorld(x + dx, y + dy, this.state.map.size);
      this.ghostTiles.fillPoints([
        { x: t.x, y: t.y - TILE_H / 2 }, { x: t.x + TILE_W / 2, y: t.y },
        { x: t.x, y: t.y + TILE_H / 2 }, { x: t.x - TILE_W / 2, y: t.y },
      ], true);
    }
  }

  /** A felled forest tile loses its tree and turns to grass. */
  private refreshMap(): void {
    const { tiles } = this.state.map;
    for (const [i, tree] of this.trees) {
      if (tiles[i] !== 'forest') {
        tree.destroy();
        this.trees.delete(i);
        this.ground[i].setTexture('tile_grass');
      }
    }
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    const bounds = worldBounds(this.state.map.size);
    const fire = tileToWorld(this.state.map.fire[0] + 0.5, this.state.map.fire[1] + 0.5, this.state.map.size);
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
      this.refreshMap();
    }
    this.syncBuildings();
    this.updateGhost();
    this.people.sync(this.state.people, delta, time);
    this.enemies.sync(this.state.enemies, (kind) => ENEMIES[kind].hp);
  }
}
