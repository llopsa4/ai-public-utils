// The minimap in the HUD (DESIGN-map.md `## Minimap`): an isometric diamond of the whole map, top right under the
// speed buttons, never scrolling or zooming. Drawing only; the maths is in `render/minimap.ts`. No fog of war.
import { makeSurface } from '../render/ui';
import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { miniSize, miniToTile, miniToWorld, terrainPixels, tileToMini, viewRect } from '../render/minimap';
import { animalsOf } from '../sim/animals';
import { footprintOf } from '../sim/state';
import type { GameScene } from './Game';
import type { HudScene } from './Hud';
import type { SelectScene } from './Select';

const PAD = 8;
const PANEL_TOP = 36;
const FRAME = 1280;
const DYNAMIC_EVERY = 6; // frames between redraws of the people, herds and wolves
const TEXTURE = 'minimap_terrain';

/** Terrain colours: the tile colours, with the forest darker and the berries plum so neither reads as a wolf or a herd. */
const TERRAIN: Record<string, number> = { grass: 0x8fae5a, river: 0x4f8f9a, ford: 0x8fb0a0, forest: 0x3f6b34, berry: 0xa8559a };
const BUILDING = 0xe6d3a3;
const FIRE = 0xe8742a;
const DRAFTED = 0xd83a3a;
const HERD = 0x6b4a2e;
const WOLF = 0xff1f1f;
const WOLF_HALO = 0x1d1a16;

export class MinimapView {
  /** The minimap's screen rectangle (1280 x 720 HUD space), without the panel's padding. */
  readonly rect: { x: number; y: number; w: number; h: number };
  private readonly size: number;
  private readonly buildings: Phaser.GameObjects.Graphics;
  private readonly dots: Phaser.GameObjects.Graphics;
  private readonly view: Phaser.GameObjects.Graphics;
  private seenMapVersion: number;
  private buildingSig = '';
  private frame = 0;
  private counts = { people: 0, drafted: 0, herds: 0, wolves: 0, buildings: 0 };
  private readonly familyColors: number[];

  constructor(private readonly scene: Phaser.Scene, private readonly game: GameScene) {
    const state = game.state;
    this.size = state.map.size;
    const m = miniSize(this.size);
    this.rect = { x: FRAME - 8 - PAD - m.w, y: PANEL_TOP + PAD, w: m.w, h: m.h };
    this.familyColors = (mapConfig.start.familyColors as string[]).map((c) => parseInt(c.slice(1), 16));
    makeSurface(scene, 'panel', this.rect.x - PAD, PANEL_TOP, m.w + PAD * 2, m.h + PAD * 2, { fill: 0x1d1a16, alpha: 0.85 });

    // A canvas texture is global to the game: a new run replaces the last one.
    if (scene.textures.exists(TEXTURE)) scene.textures.remove(TEXTURE);
    scene.textures.createCanvas(TEXTURE, m.w, m.h);
    scene.add.image(this.rect.x, this.rect.y, TEXTURE).setOrigin(0);
    this.seenMapVersion = state.mapVersion;
    this.drawTerrain();
    this.buildings = scene.add.graphics();
    this.dots = scene.add.graphics();
    this.view = scene.add.graphics();

    this.setupMouse();

    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) camp.minimap = () => this.status();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.textures.exists(TEXTURE) && scene.textures.remove(TEXTURE));
    this.update();
  }

  /** True when a screen point is on the minimap or its panel (the world below never sees these clicks). */
  contains(x: number, y: number): boolean {
    const r = this.rect;
    return x >= r.x - PAD && x <= r.x + r.w + PAD && y >= r.y - PAD && y <= r.y + r.h + PAD;
  }

  /**
   * Mouse (DESIGN-map.md `## Minimap`): left-click or drag centres the camera there and never selects; right-click sends
   * the selected people a move order (nothing while placing or aiming, when a click only moves the camera).
   */
  private setupMouse(): void {
    const r = this.rect;
    const zone = this.scene.add.zone(r.x - PAD, PANEL_TOP, r.w + PAD * 2, r.h + PAD * 2).setOrigin(0).setInteractive();
    let dragging = false;
    const menuOpen = (): boolean => !!(this.scene as HudScene).menuOpen;
    const centre = (p: Phaser.Input.Pointer): void => {
      const mx = Math.min(r.w, Math.max(0, p.x - r.x));
      const my = Math.min(r.h, Math.max(0, p.y - r.y));
      const w = miniToWorld(mx, my);
      this.game.centerOnWorld(w.x, w.y);
    };
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (menuOpen()) return;
      if (p.leftButtonDown()) {
        dragging = true;
        centre(p);
      } else if (p.rightButtonDown() && !this.game.placing && !this.game.aiming) {
        const t = miniToTile(p.x - r.x, p.y - r.y, this.size);
        if (t) (this.scene.scene.get('Select') as SelectScene).moveSelectionTo([t.x, t.y]);
      }
    });
    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      if (p.leftButtonDown() && !menuOpen()) centre(p);
      else dragging = false;
    });
    this.scene.input.on('pointerup', () => (dragging = false));
  }

  /** What the smoke test reads: where the minimap is, the camera outline on it, and what was drawn. */
  private status(): { rect: number[]; view: number[]; counts: MinimapView['counts'] } {
    const v = viewRect(this.game.cameras.main.worldView, this.size);
    return {
      rect: [this.rect.x, this.rect.y, this.rect.w, this.rect.h],
      view: [this.rect.x + v.x, this.rect.y + v.y, v.w, v.h],
      counts: { ...this.counts },
    };
  }

  private drawTerrain(): void {
    const m = miniSize(this.size);
    const tex = this.scene.textures.get(TEXTURE) as Phaser.Textures.CanvasTexture;
    const data = new ImageData(terrainPixels(this.game.state.map.tiles, this.size, TERRAIN), m.w, m.h);
    tex.context.putImageData(data, 0, 0);
    tex.refresh();
  }

  /** One tile's 2 x 1 px diamond, on the minimap's pixel grid. */
  private tile(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const p = tileToMini(x, y, this.size);
    g.fillRect(this.rect.x + Math.round(p.x) - 1, this.rect.y + Math.floor(p.y), 2, 1);
  }

  /** A dot `d` px across centred on a (fractional) tile. */
  private dot(g: Phaser.GameObjects.Graphics, x: number, y: number, d: number): void {
    const p = tileToMini(x, y, this.size);
    g.fillRect(this.rect.x + Math.round(p.x - d / 2), this.rect.y + Math.round(p.y - d / 2), d, d);
  }

  private drawBuildings(): void {
    const g = this.buildings.clear();
    const list = this.game.state.buildings;
    for (const b of list) {
      const tiles = footprintOf(b.type, b.x, b.y);
      g.fillStyle(BUILDING, b.done ? 1 : 0.5);
      for (const [x, y] of tiles) this.tile(g, x, y);
      if (b.type === 'fire') {
        const cx = tiles.reduce((a, t) => a + t[0], 0) / tiles.length;
        const cy = tiles.reduce((a, t) => a + t[1], 0) / tiles.length;
        g.fillStyle(FIRE, 1);
        this.dot(g, cx, cy, 3);
      }
    }
    this.counts.buildings = list.length;
  }

  private drawDots(): void {
    const s = this.game.state;
    const g = this.dots.clear();
    g.fillStyle(HERD, 1);
    let herds = 0;
    for (const a of animalsOf(s)) {
      if (a.dead) continue;
      this.dot(g, a.x, a.y, 2);
      herds++;
    }
    let drafted = 0;
    for (const p of s.people) {
      if (p.drafted) drafted++;
      g.fillStyle(p.drafted ? DRAFTED : (this.familyColors[p.family] ?? 0xffffff), 1);
      this.dot(g, p.x, p.y, 2);
    }
    // A wolf is a bright red 3 px dot in a dark halo, so it never reads as a berry patch.
    for (const e of s.enemies) {
      g.fillStyle(WOLF_HALO, 1);
      this.dot(g, e.x, e.y, 5);
      g.fillStyle(WOLF, 1);
      this.dot(g, e.x, e.y, 3);
    }
    this.counts.people = s.people.length;
    this.counts.drafted = drafted;
    this.counts.herds = herds;
    this.counts.wolves = s.enemies.length;
  }

  /** Redraws what changed: the camera outline every frame, the rest every few frames or when the map or buildings change. */
  update(): void {
    const s = this.game.state;
    if (s.mapVersion !== this.seenMapVersion) {
      this.seenMapVersion = s.mapVersion;
      this.drawTerrain();
    }
    const sig = s.buildings.map((b) => `${b.id}${b.done ? 'd' : ''}`).join(',');
    if (sig !== this.buildingSig) {
      this.buildingSig = sig;
      this.drawBuildings();
    }
    if (this.frame++ % DYNAMIC_EVERY === 0) this.drawDots();
    const v = viewRect(this.game.cameras.main.worldView, this.size);
    this.view.clear().lineStyle(1, 0xffffff, 1).strokeRect(this.rect.x + v.x + 0.5, this.rect.y + v.y + 0.5, Math.max(0, v.w - 1), Math.max(0, v.h - 1));
  }
}
