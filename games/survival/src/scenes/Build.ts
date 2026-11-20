// The build menu (DESIGN-slice.md `## UI`, DESIGN-upgrades-2.md `## UI`): B opens it, Tab switches between
// the Camp and Societies pages, 1-6 pick a building on the shown page, the Game scene shows the ghost and
// places it on a left-click; right-click or Esc cancels. Runs above the Game scene in screen space.
import Phaser from 'phaser';
import { BUILDABLE, buildingDefs, buildingName } from '../sim/buildings';
import type { Res } from '../sim/state';
import type { GameScene } from './Game';

type Page = 'camp' | 'societies';
const PAGES: { id: Page; label: string }[] = [
  { id: 'camp', label: 'Camp' },
  { id: 'societies', label: 'Societies' },
];

const SLOT_W = 79;
const SLOT_TOP = 26;
const PANEL = { x: 880, y: 580, w: 400, h: 140 };
const MIN_W = 250;
const OPEN_BUTTON = { x: 1176, y: 684, w: 96, h: 28 };
const INK = '#f3e9d2';

interface Slot {
  type: string;
  x: number;
  bg: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  parts: Phaser.GameObjects.GameObject[];
}

export class BuildScene extends Phaser.Scene {
  private game2!: GameScene;
  private open = false;
  private page: Page = 'camp';
  private slots: Slot[] = [];
  private panel: Phaser.GameObjects.GameObject[] = [];
  private panelBg!: Phaser.GameObjects.Rectangle;
  /** The types the panel shows now, in order: this page's, minus those still waiting for an upgrade. */
  private shownTypes: string[] = [];
  private tabText!: Phaser.GameObjects.Text;
  private openButton!: Phaser.GameObjects.GameObject[];
  private toastText!: Phaser.GameObjects.Text;
  private toastUntil = 0;

  constructor() {
    super('Build');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
    this.open = false;
    this.page = 'camp';
    this.slots = [];
    this.panel = [];
    this.shownTypes = [];
  }

  create(): void {
    const text = (x: number, y: number, s: string, size = 14, color = INK) =>
      this.add.text(x, y, s, { fontFamily: 'sans-serif', fontSize: `${size}px`, color });

    // The small "Build (B)" button shown while the menu is closed.
    const ob = this.add.rectangle(OPEN_BUTTON.x, OPEN_BUTTON.y, OPEN_BUTTON.w, OPEN_BUTTON.h, 0x1d1a16, 0.85).setOrigin(0).setInteractive();
    ob.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.setOpen(true));
    this.openButton = [ob, text(OPEN_BUTTON.x + 14, OPEN_BUTTON.y + 6, 'Build (B)')];

    // The menu panel: a page strip, then one button per building (positions set by `layout`).
    this.panelBg = this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0x1d1a16, 0.85).setOrigin(0);
    this.tabText = text(PANEL.x + 8, PANEL.y + 4, '', 13);
    this.panel.push(this.panelBg, this.tabText);
    BUILDABLE.forEach((type) => {
      const x = PANEL.x + 5;
      const y = PANEL.y + SLOT_TOP;
      const bg = this.add.rectangle(x, y, 75, 108, 0x3a3328, 1).setOrigin(0).setInteractive();
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.pick(this.shownTypes.indexOf(type)));
      const small = (buildingDefs[type].size[0] === 1);
      const icon = this.add.image(x + 37, y + 56, `building_${type}`).setScale(small ? 0.8 : 0.45).setOrigin(0.5, 0.75);
      const cost = buildingDefs[type].cost ?? {};
      const costText = (Object.keys(cost) as Res[]).map((r) => `${cost[r]} ${r}`).join(', ');
      const title = text(x + 4, y + 3, buildingName(type), 10).setWordWrapWidth(68);
      const parts = [icon, title, text(x + 4, y + 80, costText, 10, '#cdbf9c').setWordWrapWidth(68)];
      this.slots.push({ type, x, bg, title, parts });
      this.panel.push(bg, ...parts);
    });

    this.toastText = text(PANEL.x, PANEL.y - 24, '', 14, '#ffb4a8');
    this.layout();
    this.setOpen(false);

    const kb = this.input.keyboard!;
    kb.addCapture('TAB');
    kb.on('keydown-B', () => this.setOpen(!this.open));
    kb.on('keydown-TAB', () => this.open && this.nextPage());
    kb.on('keydown-ESC', () => {
      if (this.game2.placing) this.game2.setPlacing(null);
      else this.setOpen(false);
    });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.open && this.pick(i)));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) camp.buildMenu = () => ({ open: this.open, page: this.page, shown: [...this.shownTypes] });
  }

  /** Types whose upgrade (if any) has been bought; they keep BUILDABLE's order. */
  private unlocked(type: string): boolean {
    const req = buildingDefs[type].requires;
    return !req || this.game2.state.upgrades.includes(req);
  }

  private typesOn(page: Page): string[] {
    return BUILDABLE.filter((t) => (buildingDefs[t].page ?? 'camp') === page && this.unlocked(t));
  }

  /** Tab: the other page, if it has anything unlocked to show. */
  private nextPage(): void {
    const other = PAGES.find((p) => p.id !== this.page)!;
    if (this.typesOn(other.id).length === 0) return;
    this.page = other.id;
    this.setOpen(true);
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.layout();
    for (const o of this.panel) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(open);
    this.slots.forEach((slot) => {
      const on = open && this.shownTypes.includes(slot.type);
      slot.bg.setVisible(on);
      if (on) slot.bg.setInteractive();
      else slot.bg.disableInteractive();
      slot.parts.forEach((o) => (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(on));
    });
    this.tabText.setVisible(open);
    for (const o of this.openButton) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(!open);
    if (!open && this.game2.placing) this.game2.setPlacing(null);
  }

  /** Shows this page's unlocked types left to right and resizes the panel, keeping its right edge at the screen edge. */
  private layout(): void {
    if (this.typesOn(this.page).length === 0) this.page = 'camp';
    this.shownTypes = this.typesOn(this.page);
    const n = this.shownTypes.length;
    PANEL.w = Math.max(MIN_W, 5 + n * SLOT_W + 1);
    PANEL.x = 1280 - PANEL.w;
    this.panelBg.setPosition(PANEL.x, PANEL.y).setSize(PANEL.w, PANEL.h);
    this.toastText.setX(PANEL.x);
    this.tabText.setPosition(PANEL.x + 8, PANEL.y + 4);
    const hasOther = PAGES.some((p) => p.id !== this.page && this.typesOn(p.id).length > 0);
    this.tabText.setText(PAGES.map((p) => (p.id === this.page ? `[${p.label}]` : p.label)).join('  ') + (hasOther ? '   Tab: switch' : ''));
    this.slots.forEach((slot) => {
      const i = this.shownTypes.indexOf(slot.type);
      if (i < 0) return;
      const nx = PANEL.x + 5 + i * SLOT_W;
      const dx = nx - slot.x;
      slot.title.setText(`${i + 1} ${buildingName(slot.type)}`);
      if (dx === 0) return;
      slot.x = nx;
      slot.bg.x += dx;
      for (const o of slot.parts) (o as unknown as Phaser.GameObjects.Components.Transform).x += dx;
    });
  }

  private pick(i: number): void {
    const type = this.shownTypes[i];
    if (!type) return;
    const cost = buildingDefs[type].cost ?? {};
    const short = (Object.keys(cost) as Res[]).find((r) => this.game2.state.store[r] < (cost[r] ?? 0));
    if (short) {
      this.toast(`Not enough ${short}.`);
      return;
    }
    this.game2.setPlacing(this.game2.placing === type ? null : type);
  }

  /** A short red message above the menu. */
  toast(message: string): void {
    this.toastText.setText(message);
    this.toastUntil = this.time.now + 2500;
  }

  isOpen(): boolean {
    return this.open;
  }

  /** True when a screen point is on the menu or its button, so the world should ignore the click. */
  overUi(x: number, y: number): boolean {
    const r = this.open ? PANEL : OPEN_BUTTON;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  update(): void {
    const now = this.typesOn(this.page).join();
    if (now !== this.shownTypes.join() || (this.typesOn(this.page).length === 0 && this.page !== 'camp')) this.setOpen(this.open);
    this.toastText.setVisible(this.time.now < this.toastUntil);
    const store = this.game2.state.store;
    for (const slot of this.slots) {
      const cost = buildingDefs[slot.type].cost ?? {};
      const ok = (Object.keys(cost) as Res[]).every((r) => store[r] >= (cost[r] ?? 0));
      slot.bg.setFillStyle(this.game2.placing === slot.type ? 0x6b5a2e : 0x3a3328, 1);
      slot.parts.forEach((o) => (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(ok ? 1 : 0.45));
    }
  }
}
