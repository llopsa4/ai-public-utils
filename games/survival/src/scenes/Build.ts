// The building cards (DESIGN-hunting.md `## Villager panel and building`): they fill the right part of the
// selection panel while at least one selected person can build (an adult who is not drafted), and are hidden
// otherwise. B arms them (they highlight), then 1-7 picks a building; clicking a card always works. Tab switches
// between the Camp and Societies pages. The Game scene shows the ghost and places on a left-click; right-click or
// Esc cancels. Placing remembers the people selected when the card was picked (`GameScene.placers`) and ends
// when nobody selected can build any more. Runs above the Select scene in screen space.
import Phaser from 'phaser';
import { BUILDABLE, buildingDefs } from '../sim/buildings';
import { displayLabel, englishLabel } from '../sim/labels';
import { addMessage, type Res } from '../sim/state';
import { createHover, type Hover } from './hover';
import type { GameScene } from './Game';
import type { SelectScene } from './Select';

type Page = 'camp' | 'societies';
const PAGES: { id: Page; label: string }[] = [
  { id: 'camp', label: 'Camp' },
  { id: 'societies', label: 'Societies' },
];

const SLOT_W = 72;
const SLOT_TOP = 22;
/** The cards' strip: the right part of the 120 px high selection panel; `w` and `x` follow the card count. */
const PANEL = { x: 880, y: 600, w: 400, h: 120 };
const MIN_W = 250;
const INK = '#f3e9d2';
const GOLD = 0xe0b85a;

interface Slot {
  type: string;
  x: number;
  bg: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  parts: Phaser.GameObjects.GameObject[];
}

export class BuildScene extends Phaser.Scene {
  private game2!: GameScene;
  /** True while the cards show (someone selected can build). */
  private visible = false;
  /** B was pressed: the next 1-7 picks a building. */
  private armed = false;
  /** Cleared on the next frame, so a number key that picked is not also read as a speed key by Select. */
  private disarmNext = false;
  private page: Page = 'camp';
  private slots: Slot[] = [];
  private panel: Phaser.GameObjects.GameObject[] = [];
  private panelBg!: Phaser.GameObjects.Rectangle;
  /** The types the strip shows now, in order: this page's, minus those still waiting for an upgrade. */
  private shownTypes: string[] = [];
  private tabText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastUntil = 0;
  private hover!: Hover;

  constructor() {
    super('Build');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
    this.visible = false;
    this.armed = false;
    this.disarmNext = false;
    this.page = 'camp';
    this.slots = [];
    this.panel = [];
    this.shownTypes = [];
  }

  private select(): SelectScene | undefined {
    return this.scene.get('Select') as SelectScene | undefined;
  }

  create(): void {
    const text = (x: number, y: number, s: string, size = 14, color = INK) =>
      this.add.text(x, y, s, { fontFamily: 'sans-serif', fontSize: `${size}px`, color });

    // The strip: a page line, then one card per building (positions set by `layout`).
    this.panelBg = this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0x2a251d, 0.9).setOrigin(0).setStrokeStyle(1, 0x6b5a3a);
    this.tabText = text(PANEL.x + 8, PANEL.y + 3, '', 12);
    this.panel.push(this.panelBg, this.tabText);
    this.hover = createHover(this);
    BUILDABLE.forEach((type) => {
      const x = PANEL.x + 5;
      const y = PANEL.y + SLOT_TOP;
      const bg = this.add.rectangle(x, y, SLOT_W - 4, 94, 0x3a3328, 1).setOrigin(0).setInteractive();
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.pick(this.shownTypes.indexOf(type)));
      // The art is fitted into a 56 x 32 box under the title, so a 4x4 store and a 1x1 trap both fit their card.
      const frame = this.textures.getFrame(`building_${type}`);
      const fit = Math.min(0.7, 56 / frame.width, 32 / frame.height);
      const icon = this.add.image(x + 34, y + 54, `building_${type}`).setScale(fit).setOrigin(0.5, 0.5);
      const cost = buildingDefs[type].cost ?? {};
      const costText = (Object.keys(cost) as Res[]).map((r) => `${cost[r]} ${r}`).join(', ');
      const title = text(x + 3, y + 2, displayLabel(type), 10).setWordWrapWidth(SLOT_W - 10);
      const parts = [icon, title, text(x + 3, y + 70, costText, 10, '#cdbf9c').setWordWrapWidth(SLOT_W - 10)];
      this.hover.attach(bg, () => (displayLabel(type) !== englishLabel(type) ? englishLabel(type) : null));
      this.slots.push({ type, x, bg, title, parts });
      this.panel.push(bg, ...parts);
    });

    this.toastText = text(PANEL.x, PANEL.y - 24, '', 14, '#ffb4a8');
    this.layout();
    this.applyVisible();

    const kb = this.input.keyboard!;
    kb.addCapture('TAB');
    kb.on('keydown-B', () => this.toggleArmed());
    kb.on('keydown-TAB', () => this.visible && this.nextPage());
    kb.on('keydown-ESC', () => {
      if (this.game2.placing) this.game2.setPlacing(null);
      else this.armed = false;
    });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.armed && this.pick(i)));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.buildMenu = () => ({
        visible: this.visible, armed: this.armed, page: this.page, shown: [...this.shownTypes], placing: this.game2.placing,
      });
      // The screen centre of a shown card (1280 x 720 space), or null.
      camp.buildCard = (type: string) => {
        const slot = this.slots.find((s) => s.type === type && s.bg.visible);
        return slot ? [slot.bg.x + slot.bg.width / 2, slot.bg.y + slot.bg.height / 2] : null;
      };
    }
  }

  /** Types whose upgrade (if any) has been bought; they keep BUILDABLE's order. */
  private unlocked(type: string): boolean {
    const req = buildingDefs[type].requires;
    return !req || this.game2.state.upgrades.includes(req);
  }

  private typesOn(page: Page): string[] {
    return BUILDABLE.filter((t) => (buildingDefs[t].page ?? 'camp') === page && this.unlocked(t));
  }

  /** B: arm the cards (the next number picks), or disarm. Nothing to arm when nobody selected can build. */
  private toggleArmed(): void {
    if (!this.visible) {
      addMessage(this.game2.state, 'Select an adult who is not drafted to build.');
      return;
    }
    this.armed = !this.armed;
  }

  /** Tab: the other page, if it has anything unlocked to show. */
  private nextPage(): void {
    const other = PAGES.find((p) => p.id !== this.page)!;
    if (this.typesOn(other.id).length === 0) return;
    this.page = other.id;
    this.applyVisible();
  }

  /** Lays the strip out for the current page and shows or hides every part of it. */
  private applyVisible(): void {
    const open = this.visible;
    this.layout();
    for (const o of this.panel) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(open);
    this.slots.forEach((slot) => {
      const on = open && this.shownTypes.includes(slot.type);
      slot.bg.setVisible(on);
      if (on) slot.bg.setInteractive();
      else slot.bg.disableInteractive();
      slot.parts.forEach((o) => (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(on));
    });
    if (!open) {
      this.armed = false;
      if (this.game2.placing) this.game2.setPlacing(null);
    }
  }

  /** Shows this page's unlocked types left to right and resizes the strip, keeping its right edge at the screen edge. */
  private layout(): void {
    if (this.typesOn(this.page).length === 0) this.page = 'camp';
    this.shownTypes = this.typesOn(this.page);
    const n = this.shownTypes.length;
    PANEL.w = Math.max(MIN_W, 5 + n * SLOT_W + 1);
    PANEL.x = 1280 - PANEL.w;
    this.panelBg.setPosition(PANEL.x, PANEL.y).setSize(PANEL.w, PANEL.h);
    this.toastText.setX(PANEL.x);
    this.tabText.setPosition(PANEL.x + 8, PANEL.y + 3);
    const hasOther = PAGES.some((p) => p.id !== this.page && this.typesOn(p.id).length > 0);
    this.tabText.setText(PAGES.map((p) => (p.id === this.page ? `[${p.label}]` : p.label)).join('  ') + (hasOther ? '  Tab' : ''));
    this.slots.forEach((slot) => {
      const i = this.shownTypes.indexOf(slot.type);
      if (i < 0) return;
      const nx = PANEL.x + 5 + i * SLOT_W;
      const dx = nx - slot.x;
      slot.title.setText(`${i + 1} ${displayLabel(slot.type)}`);
      if (dx === 0) return;
      slot.x = nx;
      slot.bg.x += dx;
      for (const o of slot.parts) (o as unknown as Phaser.GameObjects.Components.Transform).x += dx;
    });
  }

  private pick(i: number): void {
    this.disarmNext = true;
    const type = this.shownTypes[i];
    if (!type) return;
    const cost = buildingDefs[type].cost ?? {};
    const short = (Object.keys(cost) as Res[]).find((r) => this.game2.state.store[r] < (cost[r] ?? 0));
    if (short) {
      this.toast(`Not enough ${short}.`);
      return;
    }
    if (this.game2.placing === type) this.game2.setPlacing(null);
    else this.game2.setPlacing(type, this.select()?.selection() ?? []);
  }

  /** A short red message above the cards. */
  toast(message: string): void {
    this.toastText.setText(message);
    this.toastUntil = this.time.now + 2500;
  }

  /** True after B, until a number key (or the next frame after one) picks: Select leaves 1-3 to the cards then. */
  isArmed(): boolean {
    return this.armed;
  }

  update(): void {
    if (this.disarmNext) {
      this.disarmNext = false;
      this.armed = false;
    }
    const show = this.select()?.canBuild() ?? false;
    const types = this.typesOn(this.page).join();
    if (show !== this.visible || types !== this.shownTypes.join() || (this.typesOn(this.page).length === 0 && this.page !== 'camp')) {
      this.visible = show;
      this.applyVisible();
    }
    this.panelBg.setStrokeStyle(this.armed ? 2 : 1, this.armed ? GOLD : 0x6b5a3a);
    this.tabText.setText(this.tabText.text.replace(/\s+· press a number$/, '') + (this.armed ? '  · press a number' : ''));
    this.toastText.setVisible(this.visible && this.time.now < this.toastUntil);
    this.hover.update();
    const store = this.game2.state.store;
    for (const slot of this.slots) {
      const cost = buildingDefs[slot.type].cost ?? {};
      const ok = (Object.keys(cost) as Res[]).every((r) => store[r] >= (cost[r] ?? 0));
      slot.bg.setFillStyle(this.game2.placing === slot.type ? 0x6b5a2e : 0x3a3328, 1);
      slot.parts.forEach((o) => (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(ok ? 1 : 0.45));
    }
  }
}
