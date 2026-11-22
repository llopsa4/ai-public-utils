// The menu scene (DESIGN-saves.md `## Menu`): title, three slot cards (New camp / Continue / Export /
// Delete / Import) and the controls. Without browser storage, the old Start and Random seed buttons.
import Phaser from 'phaser';
import mapConfig from '../data/map.json';
import { downloadText, exportName, pickTextFile } from '../save/files';
import {
  browserStorage, clearSlot, firstEmptySlot, importSlot, listSlots, probe, readSlot,
  type SlotId, type SlotInfo, type SlotStorage,
} from '../save/slots';
import { parseSave } from '../sim/save';
import { showCursor } from '../render/cursors';
import { addTitle } from '../render/title';
import { addIcon, makeSurface, palette, placeButton, textButton, UI_FONT, type Palette, type TextButton } from '../render/ui';

/** Text over the title picture (or the plain background): light with a dark edge, so it reads on either. */
const LIGHT = '#f3e9d2';
const LIGHT_DIM = '#e3d6b4';
const CARD = { w: 360, h: 150, y: 165, gap: 20 };
const CONTROLS = [
  'Left-click: select      Drag: box select      Shift-click: add or remove',
  'Right-click: move, gather, chop, build, assign to a building, hunt a deer or bison, or attack a wolf',
  'R: draft or undraft      Z X C: hold / defend / chase      Delete: cancel a site',
  'Select adults, then B and 1-7 or click a card: build (Tab: page; left-click places, drag for barricades, right-click stops)',
  'F1-F4: cast a bought spirit power, once a wave (the bison and the storm wait for a left-click on the map)',
  'Space: pause      1 2 3: speed 1x 2x 4x      Esc: clear the selection      Click a finished building: its upgrades',
  'WASD or arrows or the screen edge: scroll      Mouse wheel: zoom      Menu button: music on / off and volume',
  'Minimap (top right): click or drag to look there; right-click sends the selected people to that spot',
];
const REFUSED = 'That file is not a Camp Fire save, or it is from another version.';

/** The seed in the page address (`?seed=7`), or the one the design names. */
function defaultSeed(): number {
  const seed = Number(new URLSearchParams(location.search).get('seed') ?? mapConfig.start.seed);
  return Number.isFinite(seed) ? seed : mapConfig.start.seed;
}

const randomSeed = (): number => Math.floor(Math.random() * 1_000_000) + 1;

export class MenuScene extends Phaser.Scene {
  private storage: SlotStorage | null = null;
  /** The slot whose Delete is waiting for Yes / No. */
  private confirming: SlotId | null = null;
  private notice = '';
  /** Everything the cards drew, destroyed and redrawn on each change. */
  private dynamic: Phaser.GameObjects.GameObject[] = [];
  /** Button centres by name, for the `?debug` hook (the smoke test clicks them). */
  private spots: Record<string, [number, number]> = {};
  private cardTexts: string[] = [];
  private pal!: Palette;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.confirming = null;
    this.notice = '';
    this.dynamic = [];
    const store = browserStorage();
    this.storage = probe(store) ? store : null;

    this.pal = palette(this);
    showCursor(this, 'pointer');
    addTitle(this);
    // The title and its line sit on the picture's calm top centre; the code draws them, the picture has no text.
    const text = (x: number, y: number, size: number, label: string, color = LIGHT, edge = true) =>
      this.add.text(x, y, label, { fontFamily: UI_FONT, fontSize: `${size}px`, fontStyle: size >= 40 ? 'bold' : 'normal', color, align: 'center', stroke: '#1d1a16', strokeThickness: edge ? 4 : 0 }).setOrigin(0.5);
    text(640, 65, 60, 'Camp Fire');
    text(640, 116, 22, 'A few families, one fire, and the winter ahead.', LIGHT_DIM);
    addIcon(this, 'ui_emblem', 430, 70, 84);
    // The controls get their own panel, so they read over any picture.
    makeSurface(this, 'panel', 60, 392, 1160, 250, { fill: 0x1d1a16, alpha: 0.85 });
    const note = (x: number, y: number, size: number, label: string, color: string) =>
      this.add.text(x, y, label, { fontFamily: UI_FONT, fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);
    note(640, 412, 18, 'Controls', this.pal.dim);
    CONTROLS.forEach((line, i) => note(640, 440 + i * 24, 16, line, this.pal.ink));

    this.render();

    this.input.keyboard!.on('keydown-ENTER', () => {
      if (!this.storage) return this.begin(null, defaultSeed());
      const slot = firstEmptySlot(this.storage);
      if (slot !== null) this.begin(slot, defaultSeed());
    });

    if (new URLSearchParams(location.search).has('debug')) {
      (window as unknown as { menu: unknown }).menu = { buttons: () => this.spots, cards: () => this.cardTexts };
    }
  }

  /** Redraws the cards (or the no-storage fallback) and the notice line. */
  private render(): void {
    for (const o of this.dynamic) o.destroy();
    this.dynamic = [];
    this.spots = {};
    this.cardTexts = [];

    if (!this.storage) {
      this.label(640, 215, 'Saving is not available in this browser.', 20, LIGHT_DIM, true);
      this.button('start', 640, 265, 'Start', () => this.begin(null, defaultSeed()));
      this.button('random', 640, 325, 'Random seed', () => this.begin(null, randomSeed()));
      return;
    }

    const slots = listSlots(this.storage);
    const left = 640 - CARD.w - CARD.gap;
    slots.forEach((info, i) => this.card(left + i * (CARD.w + CARD.gap), info));
    if (this.notice) this.label(640, 350, this.notice, 17, '#ffb4a8', true);
  }

  private card(cx: number, info: SlotInfo): void {
    const { slot } = info;
    const top = CARD.y;
    this.dynamic.push(makeSurface(this, 'panel', cx, top + CARD.h / 2, CARD.w, CARD.h, { fill: 0x1d1a16, alpha: 0.85, stroke: [0x6b5a3a, 2], origin: [0.5, 0.5] }));
    this.label(cx, top + 24, `Slot ${slot}`, 22, this.pal.ink);

    const summary =
      info.status === 'filled'
        ? `Day ${info.summary.day} · People ${info.summary.people} · Seed ${info.summary.seed}`
        : info.status === 'empty' ? 'Empty' : 'Unreadable save';
    this.cardTexts.push(`Slot ${slot} ${summary}`);

    if (this.confirming === slot) {
      this.label(cx, top + 66, 'Delete this camp?', 19, this.pal.ink);
      this.row(cx, top + 112, [
        ['yes', 'Yes', () => this.deleteSlot(slot)],
        ['no', 'No', () => ((this.confirming = null), this.render())],
      ], slot);
      return;
    }
    this.label(cx, top + 66, summary, 18, info.status === 'filled' ? this.pal.ink : this.pal.dim);

    if (info.status === 'empty') {
      this.row(cx, top + 112, [
        ['new', 'New camp', () => this.begin(slot, defaultSeed())],
        ['random', 'Random seed', () => this.begin(slot, randomSeed())],
        ['import', 'Import', () => this.importInto(slot)],
      ], slot);
    } else if (info.status === 'filled') {
      this.row(cx, top + 112, [
        ['continue', 'Continue', () => this.continueSlot(slot)],
        ['export', 'Export', () => this.exportSlot(slot)],
        ['delete', 'Delete', () => ((this.confirming = slot), (this.notice = ''), this.render())],
      ], slot);
    } else {
      this.row(cx, top + 112, [
        ['export', 'Export', () => this.exportSlot(slot)],
        ['delete', 'Delete', () => ((this.confirming = slot), (this.notice = ''), this.render())],
      ], slot);
    }
  }

  private label(x: number, y: number, label: string, size: number, color: string, edge = false): void {
    this.dynamic.push(
      this.add.text(x, y, label, { fontFamily: UI_FONT, fontSize: `${size}px`, color, align: 'center', stroke: '#1d1a16', strokeThickness: edge ? 3 : 0 }).setOrigin(0.5),
    );
  }

  /** Buttons side by side, centred on `cx`: made first, then spaced by their real widths. */
  private row(cx: number, y: number, defs: [string, string, () => void][], slot: SlotId): void {
    const gap = 10;
    const made = defs.map(([name, label, onClick]) => ({ name, b: this.button(`slot${slot}.${name}`, 0, y, label, onClick, 18, 5) }));
    const widths = made.map(({ b }) => b.bg.displayWidth);
    let x = cx - (widths.reduce((a, c) => a + c, 0) + gap * (defs.length - 1)) / 2;
    made.forEach(({ name, b }, i) => {
      placeButton(b, x + widths[i] / 2, y);
      this.spots[`slot${slot}.${name}`] = [x + widths[i] / 2, y];
      x += widths[i] + gap;
    });
  }

  private button(name: string, x: number, y: number, label: string, onClick: () => void, size = 26, pad = 8): TextButton {
    const b = textButton(this, x, y, label, size, [size >= 24 ? 16 : 11, pad], onClick);
    this.dynamic.push(b.bg, b.text);
    this.spots[name] = [x, y];
    return b;
  }

  private begin(slot: SlotId | null, seed: number): void {
    this.scene.start('Game', { slot, seed });
  }

  private continueSlot(slot: SlotId): void {
    const text = this.storage && this.read(slot);
    const parsed = text ? parseSave(text) : null;
    if (!parsed?.ok) {
      this.notice = 'That camp could not be read.';
      return this.render();
    }
    this.scene.start('Game', { slot, save: parsed.save });
  }

  private exportSlot(slot: SlotId): void {
    const text = this.storage && this.read(slot);
    if (!text) return;
    const parsed = parseSave(text);
    downloadText(exportName(slot, parsed.ok ? parsed.save.summary.day : null), text);
  }

  private importInto(slot: SlotId): void {
    pickTextFile((text) => {
      if (!this.storage || !this.scene.isActive()) return;
      const result = importSlot(this.storage, slot, text);
      this.notice =
        result === 'ok' ? '' :
        result === 'unreadable' ? REFUSED :
        result === 'filled' ? 'That slot already holds a camp. Delete it first.' :
        "The browser can't store it.";
      this.render();
    });
  }

  private deleteSlot(slot: SlotId): void {
    if (this.storage) clearSlot(this.storage, slot);
    this.confirming = null;
    this.render();
  }

  private read(slot: SlotId): string | null {
    try {
      return this.storage ? readSlot(this.storage, slot) : null;
    } catch {
      return null;
    }
  }
}
