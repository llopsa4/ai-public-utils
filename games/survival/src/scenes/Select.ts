// Selection and orders (DESIGN-slice.md `## Orders`, `## UI`): click and box select, right-click orders,
// the keys R / Z X C / Delete / Space / 1-3, the selection panel and the toasts. Scenes only send orders;
// the rules are in `src/sim/orders.ts`.
import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { buildingDefs, buildingName } from '../sim/buildings';
import { queueOrders } from '../sim/orders';
import { ages } from '../sim/people';
import type { Building, Enemy, GameState, Order, Person, Res, Stance, Tile2 } from '../sim/state';
import { TILE_H, TILE_W, tileToWorld, worldToTile } from '../render/iso';
import type { BuildScene } from './Build';
import type { GameScene } from './Game';

const PANEL = { x: 0, y: 600, w: 880, h: 120 };
const BAR = { x: 0, y: 0, w: 1280, h: 32 };
const DRAG_PX = 6;
const CLICK_PX = 12;
/** World pixels from a person's feet up to the middle of the body (the click target). */
const BODY_UP = 14;
const TOAST_TICKS = 50;
const INK = '#f3e9d2';
const HINT = 'Left-click to select, right-click to order, B to build';

interface Button {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  onClick: () => void;
}

export class SelectScene extends Phaser.Scene {
  private game2!: GameScene;
  private selected: number[] = [];
  private selectedBuilding: number | null = null;
  private down: { x: number; y: number; ui: boolean } | null = null;
  private shift!: Phaser.Input.Keyboard.Key;
  /** Whether placing or the build menu was active at the last frame, so Esc can leave them alone. */
  private busy = false;
  private box!: Phaser.GameObjects.Graphics;
  private rings!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private barGfx!: Phaser.GameObjects.Graphics;
  private barText!: Phaser.GameObjects.Text;
  private toasts!: Phaser.GameObjects.Text;
  private draftButton!: Button;
  private stanceButtons: Button[] = [];
  private cancelButton!: Button;

  constructor() {
    super('Select');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
    this.selected = [];
    this.selectedBuilding = null;
    this.down = null;
    this.busy = false;
    this.stanceButtons = [];
  }

  private get state(): GameState {
    return this.game2.state;
  }

  private buildScene(): BuildScene | undefined {
    return this.scene.get('Build') as BuildScene | undefined;
  }

  create(): void {
    const world = this.game2;
    this.rings = world.add.graphics().setDepth(-99999);
    this.bars = world.add.graphics().setDepth(1e6);
    this.box = this.add.graphics().setDepth(10);

    this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0x1d1a16, 0.85).setOrigin(0);
    const text = (x: number, y: number, size: number, color = INK) =>
      this.add.text(x, y, '', { fontFamily: 'sans-serif', fontSize: `${size}px`, color });
    this.title = text(12, 608, 16);
    this.detail = text(12, 636, 13).setLineSpacing(4);
    this.barGfx = this.add.graphics();
    this.barText = text(360, 608, 12, '#cdbf9c').setLineSpacing(14);
    this.toasts = text(16, 520, 14, '#ffb4a8').setLineSpacing(4);

    this.draftButton = this.button(560, 608, 110, 28, 'Draft (R)', () => this.toggleDraft());
    (['hold', 'defend', 'chase'] as Stance[]).forEach((st, i) => {
      const key = 'ZXC'[i];
      this.stanceButtons.push(
        this.button(680 + i * 66, 608, 62, 28, `${st[0].toUpperCase()}${st.slice(1)} (${key})`, () => this.setStance(st)),
      );
    });
    this.cancelButton = this.button(560, 648, 110, 28, 'Cancel (Del)', () => this.cancelSite());

    this.shift = this.input.keyboard!.addKey('SHIFT');
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.down = { x: p.x, y: p.y, ui: this.overUi(p.x, p.y) };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onUp(p));

    const kb = this.input.keyboard!;
    kb.on('keydown-R', () => this.toggleDraft());
    kb.on('keydown-Z', () => this.setStance('hold'));
    kb.on('keydown-X', () => this.setStance('defend'));
    kb.on('keydown-C', () => this.setStance('chase'));
    kb.on('keydown-DELETE', () => this.cancelSite());
    kb.on('keydown-SPACE', () => this.send([{ type: 'pause', on: !this.state.paused }]));
    // 1-4 belong to the build menu while it is open.
    ([['ONE', 1], ['TWO', 2], ['THREE', 4]] as const).forEach(([k, value]) =>
      kb.on(`keydown-${k}`, () => !this.buildScene()?.isOpen() && this.send([{ type: 'speed', value }])),
    );
    kb.on('keydown-ESC', () => {
      if (this.busy) return;
      this.selected = [];
      this.selectedBuilding = null;
    });
  }

  private button(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Button {
    const bg = this.add.rectangle(x, y, w, h, 0x3a3328, 1).setOrigin(0).setInteractive();
    bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
    const t = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0.5);
    return { bg, label: t, onClick };
  }

  private setVisible(b: Button, on: boolean): void {
    b.bg.setVisible(on);
    b.label.setVisible(on);
    if (on) b.bg.setInteractive();
    else b.bg.disableInteractive();
  }

  /** True when a screen point is on the selection panel, the top bar or the build menu. */
  overUi(x: number, y: number): boolean {
    const inside = (r: { x: number; y: number; w: number; h: number }) =>
      x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    return inside(PANEL) || inside(BAR) || !!this.buildScene()?.overUi(x, y);
  }

  private send(orders: Order[]): void {
    queueOrders(this.state, orders);
  }

  private selectedPeople(): Person[] {
    return this.selected.map((id) => this.state.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  }

  private building(id: number | null): Building | undefined {
    return id === null ? undefined : this.state.buildings.find((b) => b.id === id);
  }

  // ---- keys and buttons ----

  private toggleDraft(): void {
    const adults = this.selectedPeople().filter((p) => ages[p.age].draft);
    if (this.selected.length === 0) return;
    this.send([{ type: 'draft', ids: this.selected, on: adults.some((p) => !p.drafted) }]);
  }

  private setStance(stance: Stance): void {
    if (this.selectedPeople().some((p) => p.drafted)) this.send([{ type: 'stance', ids: this.selected, stance }]);
  }

  private cancelSite(): void {
    const b = this.building(this.selectedBuilding);
    if (b && !b.done) {
      this.send([{ type: 'cancel', building: b.id }]);
      this.selectedBuilding = null;
    }
  }

  // ---- pointer ----

  /** The tile under a screen point. */
  private tileAt(sx: number, sy: number): Tile2 {
    const w = this.game2.cameras.main.getWorldPoint(sx, sy);
    const t = worldToTile(w.x, w.y, this.state.map.size);
    const max = this.state.map.size - 1;
    return [Math.min(max, Math.max(0, t.x)), Math.min(max, Math.max(0, t.y))];
  }

  private buildingAtTile(t: Tile2): Building | undefined {
    return this.state.buildings.find((b) => t[0] >= b.x && t[0] <= b.x + 1 && t[1] >= b.y && t[1] <= b.y + 1);
  }

  /** The person nearest a screen point within the click radius (feet or body), or null. */
  private personAt(sx: number, sy: number): Person | null {
    const cam = this.game2.cameras.main;
    const w = cam.getWorldPoint(sx, sy);
    const reach = CLICK_PX / cam.zoom;
    let best: Person | null = null;
    let bestD = reach;
    for (const p of this.state.people) {
      const f = tileToWorld(p.x, p.y, this.state.map.size);
      const d = Math.min(Math.hypot(w.x - f.x, w.y - f.y), Math.hypot(w.x - f.x, w.y - (f.y - BODY_UP)));
      if (d <= bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  /** The wolf nearest a screen point within the click radius, or null. */
  private enemyAt(sx: number, sy: number): Enemy | null {
    const cam = this.game2.cameras.main;
    const w = cam.getWorldPoint(sx, sy);
    const reach = (CLICK_PX + 6) / cam.zoom;
    let best: Enemy | null = null;
    let bestD = reach;
    for (const e of this.state.enemies) {
      const f = tileToWorld(e.x, e.y, this.state.map.size);
      const d = Math.min(Math.hypot(w.x - f.x, w.y - f.y), Math.hypot(w.x - f.x, w.y - (f.y - BODY_UP / 2)));
      if (d <= bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private onUp(p: Phaser.Input.Pointer): void {
    const d = this.down;
    this.down = null;
    if (!d || d.ui || this.game2.consumedDownTime === p.downTime) return;
    if (p.button === 2) {
      this.rightClick(p.x, p.y);
      return;
    }
    if (p.button !== 0) return;
    if (Math.hypot(p.x - d.x, p.y - d.y) > DRAG_PX) this.boxSelect(d.x, d.y, p.x, p.y);
    else this.clickSelect(p.x, p.y);
  }

  private clickSelect(sx: number, sy: number): void {
    const add = this.shift.isDown;
    const person = this.personAt(sx, sy);
    if (person) {
      this.selectedBuilding = null;
      if (!add) this.selected = [person.id];
      else this.selected = this.selected.includes(person.id) ? this.selected.filter((i) => i !== person.id) : [...this.selected, person.id];
      return;
    }
    const b = this.buildingAtTile(this.tileAt(sx, sy));
    if (b && !add) {
      this.selected = [];
      this.selectedBuilding = b.id;
      return;
    }
    if (!add) {
      this.selected = [];
      this.selectedBuilding = null;
    }
  }

  private boxSelect(x0: number, y0: number, x1: number, y1: number): void {
    const cam = this.game2.cameras.main;
    const a = cam.getWorldPoint(Math.min(x0, x1), Math.min(y0, y1));
    const b = cam.getWorldPoint(Math.max(x0, x1), Math.max(y0, y1));
    const ids = this.state.people
      .filter((p) => {
        const f = tileToWorld(p.x, p.y, this.state.map.size);
        return f.x >= a.x && f.x <= b.x && f.y >= a.y && f.y <= b.y;
      })
      .map((p) => p.id);
    this.selectedBuilding = null;
    this.selected = this.shift.isDown ? [...new Set([...this.selected, ...ids])] : ids;
  }

  private rightClick(sx: number, sy: number): void {
    const ids = this.selected;
    if (ids.length === 0) return;
    const wolf = this.enemyAt(sx, sy);
    if (wolf) {
      this.send([{ type: 'attack', ids, enemy: wolf.id }]);
      return;
    }
    const t = this.tileAt(sx, sy);
    const s = this.state;
    const b = this.buildingAtTile(t);
    const tile = s.map.tiles[t[1] * s.map.size + t[0]];
    if (b && (!b.done || buildingDefs[b.type].job)) {
      this.send([{ type: 'assign', ids, building: b.id }]);
    } else if (!b && (tile === 'berry' || tile === 'forest')) {
      this.send([{ type: 'assign', ids, job: tile === 'berry' ? 'gather' : 'chop', tile: t }]);
    } else {
      this.send([{ type: 'move', ids, to: t }]);
    }
  }

  // ---- per frame ----

  update(): void {
    const s = this.state;
    this.selected = this.selected.filter((id) => s.people.some((p) => p.id === id));
    if (this.selectedBuilding !== null && !this.building(this.selectedBuilding)) this.selectedBuilding = null;
    this.busy = this.game2.placing !== null || !!this.buildScene()?.isOpen();

    this.drawBox();
    this.drawWorld();
    this.drawPanel();
    const fresh = s.messages.filter((m) => s.tick - m.tick < TOAST_TICKS).slice(-3);
    this.toasts.setText(fresh.map((m) => m.text).join('\n'));
  }

  private drawBox(): void {
    this.box.clear();
    const p = this.input.activePointer;
    if (!this.down || this.down.ui || !p.leftButtonDown()) return;
    if (Math.hypot(p.x - this.down.x, p.y - this.down.y) <= DRAG_PX) return;
    const x = Math.min(p.x, this.down.x);
    const y = Math.min(p.y, this.down.y);
    const w = Math.abs(p.x - this.down.x);
    const h = Math.abs(p.y - this.down.y);
    this.box.fillStyle(0xf3e9d2, 0.12).fillRect(x, y, w, h).lineStyle(1, 0xf3e9d2, 0.8).strokeRect(x, y, w, h);
  }

  /** Rings under selected and drafted people, a health bar over the hurt, an outline round a building. */
  private drawWorld(): void {
    const size = this.state.map.size;
    this.rings.clear();
    this.bars.clear();
    for (const p of this.state.people) {
      const f = tileToWorld(p.x, p.y, size);
      const sel = this.selected.includes(p.id);
      if (p.drafted) this.rings.lineStyle(2, 0xd9534f, 0.95).strokeEllipse(f.x, f.y, sel ? 30 : 26, sel ? 14 : 12);
      if (sel) this.rings.lineStyle(2, 0xf3e9d2, 0.95).strokeEllipse(f.x, f.y, 22, 10);
      if (p.health < 100) {
        this.bars.fillStyle(0x000000, 0.6).fillRect(f.x - 11, f.y - 38, 22, 4);
        this.bars.fillStyle(p.health < 40 ? 0xc0392b : 0x6aa84f, 1).fillRect(f.x - 10, f.y - 37, 20 * Math.max(0, p.health / 100), 2);
      }
    }
    const b = this.building(this.selectedBuilding);
    if (b) {
      const top = tileToWorld(b.x, b.y, size);
      const right = tileToWorld(b.x + 1, b.y, size);
      const bottom = tileToWorld(b.x + 1, b.y + 1, size);
      const left = tileToWorld(b.x, b.y + 1, size);
      this.rings.lineStyle(2, 0xf3e9d2, 0.95).strokePoints(
        [
          { x: top.x, y: top.y - TILE_H / 2 }, { x: right.x + TILE_W / 2, y: right.y },
          { x: bottom.x, y: bottom.y + TILE_H / 2 }, { x: left.x - TILE_W / 2, y: left.y },
        ],
        true,
      );
    }
  }

  private jobLabel(p: Person): string {
    if (!p.job) return 'idle';
    const at = this.building(p.job.building);
    return at ? `${p.job.kind} at the ${buildingName(at.type)}` : p.job.kind;
  }

  private bar(x: number, y: number, value: number, color: number): void {
    this.barGfx.fillStyle(0x3a3328, 1).fillRect(x, y, 160, 12);
    this.barGfx.fillStyle(color, 1).fillRect(x, y, 160 * Math.min(1, Math.max(0, value / 100)), 12);
  }

  private drawPanel(): void {
    this.barGfx.clear();
    this.barText.setText('');
    const people = this.selectedPeople();
    const b = this.building(this.selectedBuilding);
    const drafted = people.filter((p) => p.drafted).length;
    const adults = people.filter((p) => ages[p.age].draft).length;

    this.setVisible(this.draftButton, people.length > 0);
    this.draftButton.label.setText(adults > 0 && drafted === adults ? 'Undraft (R)' : 'Draft (R)');
    this.stanceButtons.forEach((sb, i) => {
      this.setVisible(sb, drafted > 0);
      const stance = (['hold', 'defend', 'chase'] as Stance[])[i];
      sb.bg.setFillStyle(people.some((p) => p.drafted && p.stance === stance) ? 0x6b5a2e : 0x3a3328, 1);
    });
    this.setVisible(this.cancelButton, !!b && !b.done);

    if (people.length === 1) {
      const p = people[0];
      const families = mapConfig.start.families as string[];
      this.title.setText(p.name);
      this.detail.setText([
        `${families[p.family]} family · ${p.age}`,
        `Job: ${this.jobLabel(p)}${p.drafted ? ` · drafted (${p.stance})` : ''}`,
        `Society: ${p.society ?? 'none'}`,
      ].join('\n'));
      this.barText.setText('Health\nHunger');
      this.bar(420, 609, p.health, p.health < 40 ? 0xc0392b : 0x6aa84f);
      this.bar(420, 637, p.hunger, p.hunger >= 70 ? 0xd9a441 : 0x8a7a55);
    } else if (people.length > 1) {
      const counts = new Map<string, number>();
      for (const p of people) counts.set(p.job?.kind ?? 'idle', (counts.get(p.job?.kind ?? 'idle') ?? 0) + 1);
      this.title.setText(`${people.length} people selected`);
      this.detail.setText([
        [...counts].map(([k, n]) => `${k} ${n}`).join(', '),
        `Drafted: ${drafted} of ${adults} adults`,
      ].join('\n'));
    } else if (b) {
      const def = buildingDefs[b.type];
      this.title.setText(buildingName(b.type));
      const lines: string[] = [];
      if (!b.done) {
        const need = def.buildPoints ?? 1;
        lines.push(`Under construction: ${Math.floor((100 * Math.min(need, b.built)) / need)}%`);
        const cost = def.cost ?? {};
        lines.push(`Materials: ${(Object.keys(cost) as Res[]).map((r) => `${r} ${Math.floor(b.delivered[r] ?? 0)} / ${cost[r]}`).join(', ')}`);
      } else if (def.workers) {
        lines.push(`Workers ${b.workers.length} / ${def.workers}`);
      } else if (def.houses) {
        lines.push(`Residents ${b.residents.length} / ${def.houses}`);
      }
      this.detail.setText(lines.join('\n'));
    } else {
      this.title.setText('');
      this.detail.setText(HINT);
    }
  }
}
