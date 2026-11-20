// The build menu (DESIGN-slice.md `## UI`): B opens it, 1-5 pick a building, the Game scene shows the
// ghost and places it on a left-click; right-click or Esc cancels. Runs above the Game scene in screen space.
import Phaser from 'phaser';
import { BUILDABLE, buildingDefs, buildingName } from '../sim/buildings';
import type { Res } from '../sim/state';
import type { GameScene } from './Game';

const PANEL = { x: 880, y: 600, w: 400, h: 120 };
const OPEN_BUTTON = { x: 1176, y: 684, w: 96, h: 28 };
const INK = '#f3e9d2';

interface Slot {
  type: string;
  bg: Phaser.GameObjects.Rectangle;
  parts: Phaser.GameObjects.GameObject[];
}

export class BuildScene extends Phaser.Scene {
  private game2!: GameScene;
  private open = false;
  private slots: Slot[] = [];
  private panel: Phaser.GameObjects.GameObject[] = [];
  private openButton!: Phaser.GameObjects.GameObject[];
  private toastText!: Phaser.GameObjects.Text;
  private toastUntil = 0;

  constructor() {
    super('Build');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
    this.open = false;
    this.slots = [];
    this.panel = [];
  }

  create(): void {
    const text = (x: number, y: number, s: string, size = 14, color = INK) =>
      this.add.text(x, y, s, { fontFamily: 'sans-serif', fontSize: `${size}px`, color });

    // The small "Build (B)" button shown while the menu is closed.
    const ob = this.add.rectangle(OPEN_BUTTON.x, OPEN_BUTTON.y, OPEN_BUTTON.w, OPEN_BUTTON.h, 0x1d1a16, 0.85).setOrigin(0).setInteractive();
    ob.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.setOpen(true));
    this.openButton = [ob, text(OPEN_BUTTON.x + 14, OPEN_BUTTON.y + 6, 'Build (B)')];

    // The menu panel with one button per building.
    this.panel.push(this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0x1d1a16, 0.85).setOrigin(0));
    BUILDABLE.forEach((type, i) => {
      const x = PANEL.x + 5 + i * 79;
      const y = PANEL.y + 6;
      const bg = this.add.rectangle(x, y, 75, 108, 0x3a3328, 1).setOrigin(0).setInteractive();
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.pick(i));
      const icon = this.add.image(x + 37, y + 56, `building_${type}`).setScale(0.45).setOrigin(0.5, 0.75);
      const cost = buildingDefs[type].cost ?? {};
      const costText = (Object.keys(cost) as Res[]).map((r) => `${cost[r]} ${r}`).join(', ');
      const parts = [
        icon,
        text(x + 4, y + 3, `${i + 1} ${buildingName(type)}`, 10).setWordWrapWidth(68),
        text(x + 4, y + 80, costText, 10, '#cdbf9c').setWordWrapWidth(68),
      ];
      this.slots.push({ type, bg, parts });
      this.panel.push(bg, ...parts);
    });

    this.toastText = text(PANEL.x, PANEL.y - 24, '', 14, '#ffb4a8');
    this.setOpen(false);

    const kb = this.input.keyboard!;
    kb.on('keydown-B', () => this.setOpen(!this.open));
    kb.on('keydown-ESC', () => {
      if (this.game2.placing) this.game2.setPlacing(null);
      else this.setOpen(false);
    });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.open && this.pick(i)));
  }

  private setOpen(open: boolean): void {
    this.open = open;
    for (const o of this.panel) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(open);
    for (const o of this.openButton) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(!open);
    if (!open && this.game2.placing) this.game2.setPlacing(null);
  }

  private pick(i: number): void {
    const type = BUILDABLE[i];
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
