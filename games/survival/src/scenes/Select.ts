// Selection and orders (DESIGN-slice.md `## Orders`, `## UI`): click and box select, right-click orders,
// the keys R / Z X C / Delete / Space / 1-3, the selection panel and the toasts. Scenes only send orders;
// the rules are in `src/sim/orders.ts`.
import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { buildingDefs, buildingName } from '../sim/buildings';
import { HUNGRY_AT } from '../sim/economy';
import { carryText, displayLabel, englishLabel } from '../sim/labels';
import { createHover, type Hover } from './hover';
import { queueOrders } from '../sim/orders';
import { ages, canWork } from '../sim/people';
import { addMessage } from '../sim/state';
import type { Building, Enemy, GameState, Order, Person, Res, Stance, Tile2 } from '../sim/state';
import {
  hasUpgrade, missingFor, upgradeCost, upgradeNeeds, upgradesOf, type UpgradeId,
} from '../sim/upgrades';
import { TILE_H, TILE_W, tileToWorld, worldToTile } from '../render/iso';
import type { BuildScene } from './Build';
import type { GameScene } from './Game';
import type { HudScene } from './Hud';

const PANEL = { x: 0, y: 600, w: 880, h: 120 };
const BAR = { x: 0, y: 0, w: 1280, h: 32 };
const DRAG_PX = 6;
const CLICK_PX = 12;
/** World pixels from a person's feet up to the middle of the body (the click target). */
const BODY_UP = 14;
const TOAST_TICKS = 50;
const INK = '#f3e9d2';
const HINT = 'Left-click to select, right-click to order, B to build';
/** The Upgrades list of a selected finished building: one row per upgrade, just above the selection panel. */
const UP = { x: 0, w: 620, head: 28, row: 50, maxRows: 8 };
/** One line on what each upgrade does (DESIGN-upgrades.md `## Upgrades`). */
const UPGRADE_EFFECT: Record<UpgradeId, string> = {
  dogs: 'Hunting succeeds 15% more often, and hunters aim a little better.',
  bows: "Hunters' bows reach 5 tiles and hit for 15.",
  healers: "Lets you build a healers' lodge: they heal the wounded and ease winter cold.",
  scouts: "Lets you build a scouts' lodge: staffed, it warns of a wave a minute ahead and counts the wolves.",
  warriors: "Lets you build lancers' and archers' lodges: assigned people fight as that class.",
  builders: 'Lets you set traps and fire pits.',
  tools: 'All building goes 1.5 times faster.',
  barricades: 'Lets you raise spike barricades (drag a line): they block wolves and people, and wolves break them (60 hp).',
  horses: 'Two horses join the camp at once; a tended corral breeds one more every 3 days.',
  riders: 'Drafted lancers ride a free horse: 2.5 times faster, reach 1.8, hit for 18. A rider who dies loses the horse.',
  spirits: 'Lets you build a spirit lodge, where the camp buys its four powers.',
  spirit_warriors: 'Power (F1), once a wave: four spirit fighters guard the fire for 60 seconds.',
  guardian_wolves: 'Power (F2), once a wave: five friendly wolves fight at the fire for 60 seconds.',
  bison_charge: 'Power (F3), once a wave: a herd runs across the map through a point you pick and hurts every wolf it touches.',
  storm_caller: 'Power (F4), once a wave: a storm over a point you pick slows and hurts wolves for 20 seconds.',
};
/** A right-click ping (DESIGN-hunting.md `## Right-click feedback`): green move, gold work, red attack, grey refused. */
type PingKind = 'move' | 'work' | 'attack' | 'refuse';
type PingTarget = 'ground' | 'tree' | 'berry' | 'building' | 'enemy';
interface Ping {
  kind: PingKind;
  /** Where it was clicked, in world pixels. */
  x: number;
  y: number;
  /** Scene clock (ms) at the click: pings keep fading while the game is paused. */
  t0: number;
  enemy?: number;
  building?: number;
  tile?: Tile2;
}
const PING_MS = 700;
const PING_COLOR: Record<PingKind, number> = { move: 0x6fbf5f, work: 0xe0b050, attack: 0xd9534f, refuse: 0x9a9a9a };

interface UpgradeRow {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  effect: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  buy: Phaser.GameObjects.Text;
  id: UpgradeId | null;
}

interface Button {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  onClick: () => void;
}

export class SelectScene extends Phaser.Scene {
  private game2!: GameScene;
  private selected: number[] = [];
  private selectedBuilding: number | null = null;
  /** A clicked berry bush, shown in the panel with how much fruit is left on it. */
  private selectedTile: Tile2 | null = null;
  private down: { x: number; y: number; ui: boolean } | null = null;
  private shift!: Phaser.Input.Keyboard.Key;
  /** Whether placing or the build menu was active at the last frame, so Esc can leave them alone. */
  private busy = false;
  private box!: Phaser.GameObjects.Graphics;
  private rings!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private pingGfx!: Phaser.GameObjects.Graphics;
  private pings: Ping[] = [];
  private pingCount = 0;
  private lastPing: { kind: PingKind; target: PingTarget; count: number } | null = null;
  private title!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private barGfx!: Phaser.GameObjects.Graphics;
  private barText!: Phaser.GameObjects.Text;
  private toasts!: Phaser.GameObjects.Text;
  private draftButton!: Button;
  private stanceButtons: Button[] = [];
  private cancelButton!: Button;
  private upBg!: Phaser.GameObjects.Rectangle;
  private upHead!: Phaser.GameObjects.Text;
  private upRows: UpgradeRow[] = [];
  private hover!: Hover;
  /** Pooled text pairs (name, family) drawn under selected people; grown on demand, hidden when unused. */
  private labels: { name: Phaser.GameObjects.Text; family: Phaser.GameObjects.Text }[] = [];
  /** The screen rectangle of the Upgrades list while it shows, else null (the map ignores clicks on it). */
  private upRect: { x: number; y: number; w: number; h: number } | null = null;

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
    this.upRows = [];
    this.upRect = null;
    this.labels = [];
    this.pings = [];
    this.pingCount = 0;
    this.lastPing = null;
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
    this.pingGfx = world.add.graphics().setDepth(1e6 - 1);
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
    this.createUpgrades();
    this.hover.attach(this.title, () => {
      const t = this.building(this.selectedBuilding)?.type;
      return t && displayLabel(t) !== englishLabel(t) ? englishLabel(t) : null;
    });

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
    // 1-5 belong to the build menu while it is open.
    ([['ONE', 1], ['TWO', 2], ['THREE', 4]] as const).forEach(([k, value]) =>
      kb.on(`keydown-${k}`, () => !this.buildScene()?.isOpen() && this.send([{ type: 'speed', value }])),
    );
    kb.on('keydown-ESC', () => {
      if (this.busy) return;
      this.selected = [];
      this.selectedBuilding = null;
      this.selectedTile = null;
    });
  }

  private button(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Button {
    const bg = this.add.rectangle(x, y, w, h, 0x3a3328, 1).setOrigin(0).setInteractive();
    bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
    const t = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0.5);
    return { bg, label: t, onClick };
  }

  /** The pooled rows of the Upgrades list (DESIGN-upgrades-3.md `## Upgrade homes`); `drawUpgrades` fills them. */
  private createUpgrades(): void {
    const font = (size: number, color = INK) => ({ fontFamily: 'sans-serif', fontSize: `${size}px`, color });
    this.hover = createHover(this);
    this.upBg = this.add.rectangle(UP.x, 0, UP.w, 10, 0x1d1a16, 0.92).setOrigin(0).setStrokeStyle(1, 0x6b5a3a).setVisible(false);
    this.upHead = this.add.text(UP.x + 10, 0, '', font(14)).setVisible(false);
    for (let i = 0; i < UP.maxRows; i++) {
      const bg = this.add.rectangle(UP.x + 4, 0, UP.w - 8, UP.row - 4, 0x3a3328, 1).setOrigin(0).setVisible(false);
      const label = this.add.text(UP.x + 12, 0, '', font(14)).setVisible(false);
      const effect = this.add.text(UP.x + 12, 0, '', font(11, '#cdbf9c')).setWordWrapWidth(UP.w - 250).setVisible(false);
      const status = this.add.text(UP.x + UP.w - 232, 0, '', font(12)).setWordWrapWidth(130).setVisible(false);
      const buy = this.add
        .text(UP.x + UP.w - 84, 0, ' Buy ', { ...font(14, '#1d1a16'), backgroundColor: INK })
        .setPadding(10, 4).setVisible(false).setInteractive({ useHandCursor: true });
      const row: UpgradeRow = { bg, label, effect, status, buy, id: null };
      this.hover.attach(label, () => (row.id && displayLabel(row.id) !== englishLabel(row.id) ? englishLabel(row.id) : null));
      buy.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown() && row.id && this.canBuy(row.id)) this.send([{ type: 'buy', upgrade: row.id }]);
      });
      this.upRows.push(row);
    }
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.selectBuilding = (id: number | null) => { this.selected = []; this.selectedBuilding = id; this.selectedTile = null; };
      camp.selectPeople = (ids: number[]) => { this.selected = [...ids]; this.selectedBuilding = null; this.selectedTile = null; };
      // What the bottom panel says now (title and detail), for the smoke test.
      camp.panelText = () => ({ title: this.title.text, detail: this.detail.text });
      // The latest right-click ping: its colour kind, what it hit, and a running count; null before the first.
      camp.lastPing = () => this.lastPing;
      // What each shown row says (cost or Needs), by upgrade id; empty while no list shows.
      camp.upgradeRows = () => Object.fromEntries(this.upRows.filter((r) => r.id && r.bg.visible).map((r) => [r.id, r.status.text]));
      // The screen centre of a shown row's Buy button (1280 x 720 space), or null.
      camp.upgradeBuy = (id: string) => {
        const r = this.upRows.find((row) => row.id === id && row.buy.visible);
        return r ? [r.buy.x + r.buy.displayWidth / 2, r.buy.y + r.buy.displayHeight / 2] : null;
      };
    }
  }

  private canBuy(id: UpgradeId): boolean {
    const s = this.state;
    return !hasUpgrade(s, id) && !upgradeNeeds(s, id) && missingFor(s, id).length === 0;
  }

  /** Shows the selected finished building's upgrades (price, Buy, Needs, Owned), or hides the list. */
  private drawUpgrades(b: Building | undefined, showList: boolean): void {
    const ids = b && b.done && showList ? upgradesOf(b.type) : [];
    const top = ids.length > 0 ? PANEL.y - UP.head - ids.length * UP.row - 4 : PANEL.y;
    this.upRect = ids.length > 0 ? { x: UP.x, y: top, w: UP.w, h: PANEL.y - top } : null;
    this.toasts.setY(top - 80);
    this.upBg.setVisible(ids.length > 0);
    this.upHead.setVisible(ids.length > 0);
    if (ids.length > 0) {
      this.upBg.setPosition(UP.x, top).setSize(UP.w, PANEL.y - top);
      this.upHead.setPosition(UP.x + 10, top + 6).setText(`${buildingName(b!.type)} upgrades   ·   gift value ${Math.floor(this.state.gift)}`);
    }
    this.upRows.forEach((r, i) => {
      const id = ids[i] ?? null;
      r.id = id;
      for (const o of [r.bg, r.label, r.effect, r.status, r.buy]) o.setVisible(id !== null);
      if (!id) {
        r.buy.disableInteractive();
        return;
      }
      const s = this.state;
      const y = top + UP.head + i * UP.row;
      const owned = hasUpgrade(s, id);
      const needs = upgradeNeeds(s, id);
      const missing = missingFor(s, id);
      const price = Object.entries(upgradeCost(id)).map(([res, n]) => `${n} ${res}`).join(', ');
      r.bg.setPosition(UP.x + 4, y);
      r.label.setPosition(UP.x + 12, y + 4).setText(displayLabel(id));
      r.effect.setPosition(UP.x + 12, y + 23).setText(UPGRADE_EFFECT[id]);
      const lines = [`Cost: ${price}`, ...(missing.length ? [`Missing: ${missing.join(', ')}`] : [])];
      r.status.setPosition(UP.x + UP.w - 232, y + 4).setText(owned ? 'Owned' : needs ?? lines.join('\n'));
      const buyable = !owned && !needs;
      r.buy.setPosition(UP.x + UP.w - 84, y + 8).setVisible(buyable).setAlpha(missing.length ? 0.4 : 1);
      if (buyable) r.buy.setInteractive({ useHandCursor: true });
      else r.buy.disableInteractive();
    });
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
    const hud = this.scene.get('Hud') as HudScene | undefined;
    return !!hud?.menuOpen || !!hud?.overPowers(x, y) || inside(PANEL) || inside(BAR) || (!!this.upRect && inside(this.upRect)) || !!this.buildScene()?.overUi(x, y);
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
    return this.state.buildings.find((b) => {
      const [w, h] = buildingDefs[b.type].size;
      return t[0] >= b.x && t[0] < b.x + w && t[1] >= b.y && t[1] < b.y + h;
    });
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
      this.selectedTile = null;
      if (!add) this.selected = [person.id];
      else this.selected = this.selected.includes(person.id) ? this.selected.filter((i) => i !== person.id) : [...this.selected, person.id];
      return;
    }
    const b = this.buildingAtTile(this.tileAt(sx, sy));
    if (b && !add) {
      this.selected = [];
      this.selectedBuilding = b.id;
      this.selectedTile = null;
      return;
    }
    if (!add) {
      const t = this.tileAt(sx, sy);
      this.selected = [];
      this.selectedBuilding = null;
      // A berry bush with nothing on it: the panel says how much fruit is left.
      this.selectedTile = !b && this.state.map.tiles[t[1] * this.state.map.size + t[0]] === 'berry' ? t : null;
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
    this.selectedTile = null;
    this.selected = this.shift.isDown ? [...new Set([...this.selected, ...ids])] : ids;
  }

  private rightClick(sx: number, sy: number): void {
    const ids = this.selected;
    if (ids.length === 0) return;
    const people = this.selectedPeople();
    const w = this.game2.cameras.main.getWorldPoint(sx, sy);
    const wolf = this.enemyAt(sx, sy);
    if (wolf) {
      if (!people.some((p) => p.drafted)) {
        this.refuse(w.x, w.y, 'Nobody is drafted.', 'enemy');
        return;
      }
      this.send([{ type: 'attack', ids, enemy: wolf.id }]);
      this.ping('attack', w.x, w.y, 'enemy', { enemy: wolf.id });
      return;
    }
    const t = this.tileAt(sx, sy);
    const s = this.state;
    const b = this.buildingAtTile(t);
    const tile = s.map.tiles[t[1] * s.map.size + t[0]];
    if (b && (!b.done || buildingDefs[b.type].job)) {
      const job = b.done ? buildingDefs[b.type].job! : 'build';
      const reason = this.workRefusal(people, job);
      if (reason) this.refuse(w.x, w.y, reason, 'building');
      else {
        this.send([{ type: 'assign', ids, building: b.id }]);
        this.ping('work', w.x, w.y, 'building', { building: b.id });
      }
    } else if (!b && (tile === 'berry' || tile === 'forest')) {
      const job = tile === 'berry' ? 'gather' : 'chop';
      const reason = this.workRefusal(people, job);
      if (reason) this.refuse(w.x, w.y, reason, tile === 'berry' ? 'berry' : 'tree');
      else {
        this.send([{ type: 'assign', ids, job, tile: t }]);
        this.ping('work', w.x, w.y, tile === 'berry' ? 'berry' : 'tree', { tile: t });
      }
    } else {
      this.send([{ type: 'move', ids, to: t }]);
      this.ping('move', w.x, w.y, 'ground');
    }
  }

  /** Why a work order cannot start at all (known at the click), or null when somebody can take it. */
  private workRefusal(people: Person[], job: Parameters<typeof canWork>[1]): string | null {
    if (people.some((p) => !p.drafted && canWork(p, job))) return null;
    return people.every((p) => p.drafted) ? "Drafted people can't take work orders." : `Nobody can ${job} there.`;
  }

  /** A grey ring and a toast for an order refused at the click; nothing is sent. */
  private refuse(x: number, y: number, text: string, target: PingTarget): void {
    addMessage(this.state, text);
    this.ping('refuse', x, y, target);
  }

  private ping(kind: PingKind, x: number, y: number, target: PingTarget, follow: Partial<Ping> = {}): void {
    this.pings.push({ kind, x, y, t0: this.time.now, ...follow });
    this.pingCount++;
    this.lastPing = { kind, target, count: this.pingCount };
  }

  /** Draws the pings: a ring that grows and fades where you clicked, and a pulse on what was targeted. */
  private drawPings(): void {
    const g = this.pingGfx;
    g.clear();
    const now = this.time.now;
    this.pings = this.pings.filter((p) => now - p.t0 < PING_MS);
    const size = this.state.map.size;
    for (const p of this.pings) {
      const k = (now - p.t0) / PING_MS;
      const color = PING_COLOR[p.kind];
      const r = 5 + 20 * k;
      g.lineStyle(2, color, 1 - k).strokeEllipse(p.x, p.y, r * 2, r);
      const pulse = 0.35 + 0.65 * Math.abs(Math.cos(k * Math.PI * 3)) * (1 - k);
      g.lineStyle(2, color, pulse);
      if (p.enemy !== undefined) {
        const e = this.state.enemies.find((q) => q.id === p.enemy);
        if (e) {
          const f = tileToWorld(e.x, e.y, size);
          g.strokeEllipse(f.x, f.y, 30, 15);
        }
      } else if (p.building !== undefined) {
        const b = this.building(p.building);
        if (b) this.outline(g, b);
      } else if (p.tile) {
        const f = tileToWorld(p.tile[0], p.tile[1], size);
        g.strokePoints(
          [
            { x: f.x, y: f.y - TILE_H / 2 }, { x: f.x + TILE_W / 2, y: f.y },
            { x: f.x, y: f.y + TILE_H / 2 }, { x: f.x - TILE_W / 2, y: f.y },
          ],
          true,
        );
      }
    }
  }

  /** The diamond round a building's footprint. */
  private outline(g: Phaser.GameObjects.Graphics, b: Building): void {
    const size = this.state.map.size;
    const [w, h] = buildingDefs[b.type].size;
    const top = tileToWorld(b.x, b.y, size);
    const right = tileToWorld(b.x + w - 1, b.y, size);
    const bottom = tileToWorld(b.x + w - 1, b.y + h - 1, size);
    const left = tileToWorld(b.x, b.y + h - 1, size);
    g.strokePoints(
      [
        { x: top.x, y: top.y - TILE_H / 2 }, { x: right.x + TILE_W / 2, y: right.y },
        { x: bottom.x, y: bottom.y + TILE_H / 2 }, { x: left.x - TILE_W / 2, y: left.y },
      ],
      true,
    );
  }

  // ---- per frame ----

  update(): void {
    const s = this.state;
    this.selected = this.selected.filter((id) => s.people.some((p) => p.id === id));
    if (this.selectedBuilding !== null && !this.building(this.selectedBuilding)) this.selectedBuilding = null;
    this.busy = this.game2.placing !== null || this.game2.aiming !== null || !!this.buildScene()?.isOpen();

    this.drawBox();
    this.drawWorld();
    this.drawPings();
    this.drawPanel();
    const fresh = s.messages.filter((m) => s.tick - m.tick < TOAST_TICKS).slice(-3);
    this.toasts.setText(fresh.map((m) => m.text).join('\n'));
  }

  private drawBox(): void {
    this.box.clear();
    const p = this.input.activePointer;
    if (!this.down || this.down.ui || !p.leftButtonDown()) return;
    if (this.game2.consumedDownTime === p.downTime) return; // a press used for placing (a barricade drag)
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
    let used = 0;
    for (const p of this.state.people) {
      const f = tileToWorld(p.x, p.y, size);
      const sel = this.selected.includes(p.id);
      if (sel) this.placeLabel(used++, p, f.x, f.y);
      if (p.drafted) this.rings.lineStyle(2, 0xd9534f, 0.95).strokeEllipse(f.x, f.y, sel ? 30 : 26, sel ? 14 : 12);
      if (sel) this.rings.lineStyle(2, 0xf3e9d2, 0.95).strokeEllipse(f.x, f.y, 22, 10);
      if (p.health < 100) {
        this.bars.fillStyle(0x000000, 0.6).fillRect(f.x - 11, f.y - 38, 22, 4);
        this.bars.fillStyle(p.health < 40 ? 0xc0392b : 0x6aa84f, 1).fillRect(f.x - 10, f.y - 37, 20 * Math.max(0, p.health / 100), 2);
      }
      if (p.hunger >= HUNGRY_AT) this.bowl(f.x, f.y - (p.health < 100 ? 46 : 40));
    }
    for (let i = used; i < this.labels.length; i++) {
      this.labels[i].name.setVisible(false);
      this.labels[i].family.setVisible(false);
    }
    const b = this.building(this.selectedBuilding);
    if (b) this.outline(this.rings.lineStyle(2, 0xf3e9d2, 0.95), b);
  }

  /** The name under a selected person's feet and, smaller and dimmer under it, their family in its colour. */
  private placeLabel(i: number, p: Person, x: number, y: number): void {
    if (!this.labels[i]) {
      const world = this.game2;
      const make = (size: number) =>
        world.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: `${size}px`, color: INK, stroke: '#000000', strokeThickness: 3 })
          .setOrigin(0.5, 0).setDepth(1e6);
      this.labels[i] = { name: make(12), family: make(10).setAlpha(0.8) };
    }
    const l = this.labels[i];
    const families = mapConfig.start.families as string[];
    const colors = mapConfig.start.familyColors as string[];
    l.name.setText(p.name).setPosition(x, y + 8).setVisible(true);
    l.family.setText(families[p.family] ?? '').setColor(colors[p.family] ?? INK).setPosition(x, y + 21).setVisible(true);
  }

  /** The hungry-person icon: a small empty bowl over the head. */
  private bowl(x: number, y: number): void {
    this.bars.fillStyle(0x000000, 0.6).fillEllipse(x, y, 11, 8);
    this.bars.fillStyle(0xd9a05b, 1).fillRect(x - 4, y - 3, 8, 1).fillTriangle(x - 4, y - 2, x + 4, y - 2, x, y + 2);
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
    this.drawUpgrades(b, people.length === 0);
    this.hover.update();

    if (people.length === 1) {
      const p = people[0];
      const families = mapConfig.start.families as string[];
      this.title.setText(p.name);
      this.detail.setText([
        `${families[p.family]} family · ${p.age}`,
        `Job: ${this.jobLabel(p)}${p.drafted ? ` · drafted (${p.stance})` : ''}`,
        `Society: ${p.society ?? 'none'}`,
        carryText([p]),
      ].filter(Boolean).join('\n'));
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
        carryText(people),
      ].filter(Boolean).join('\n'));
    } else if (b) {
      const def = buildingDefs[b.type];
      this.title.setText(displayLabel(b.type));
      const lines: string[] = [];
      if (!b.done) {
        const need = def.buildPoints ?? 1;
        lines.push(`Under construction: ${Math.floor((100 * Math.min(need, b.built)) / need)}%`);
        const cost = def.cost ?? {};
        lines.push(`Materials: ${(Object.keys(cost) as Res[]).map((r) => `${r} ${Math.floor(b.delivered[r] ?? 0)} / ${cost[r]}`).join(', ')}`);
      } else if (def.hp && b.hp !== null && def.buildable !== false) {
        lines.push(`Strength ${Math.ceil(b.hp)} / ${def.hp}`);
      } else if (def.workers) {
        lines.push(`Workers ${b.workers.length} / ${def.workers}`);
      } else if (def.houses) {
        lines.push(`Residents ${b.residents.length} / ${def.houses}`);
      }
      this.detail.setText(lines.join('\n'));
    } else if (this.selectedTile) {
      const [x, y] = this.selectedTile;
      const left = Math.floor(this.state.map.amount[y * this.state.map.size + x]);
      this.title.setText('Berry patch');
      this.detail.setText(`${left} of ${mapConfig.tiles.berry.food} fruit left`);
    } else {
      this.title.setText('');
      this.detail.setText(HINT);
    }
  }
}
