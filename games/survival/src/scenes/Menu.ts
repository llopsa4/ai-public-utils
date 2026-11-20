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

const INK = '#f3e9d2';
const DIM = '#cdbf9c';
const CARD = { w: 360, h: 150, y: 165, gap: 20 };
const CONTROLS = [
  'Left-click: select      Drag: box select      Shift-click: add or remove',
  'Right-click: move, gather, chop, build, assign to a building, or attack a wolf',
  'R: draft or undraft      Z X C: hold / defend / chase      Delete: cancel a site',
  'B then 1-6: build (left-click to place, right-click to stop)',
  'Space: pause      1 2 3: speed 1x 2x 4x      Esc: clear the selection',
  'WASD or arrows or the screen edge: scroll      Mouse wheel: zoom',
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

  constructor() {
    super('Menu');
  }

  create(): void {
    this.confirming = null;
    this.notice = '';
    this.dynamic = [];
    const store = browserStorage();
    this.storage = probe(store) ? store : null;

    const text = (x: number, y: number, size: number, label: string, color = INK) =>
      this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);

    text(640, 65, 52, 'Camp Fire');
    text(640, 112, 18, 'A few families, one fire, and the winter ahead.', DIM);
    text(640, 405, 16, 'Controls', DIM);
    CONTROLS.forEach((line, i) => text(640, 438 + i * 25, 15, line));

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
      this.label(640, 215, 'Saving is not available in this browser.', 18, DIM);
      this.button('start', 640, 265, 'Start', () => this.begin(null, defaultSeed()));
      this.button('random', 640, 325, 'Random seed', () => this.begin(null, randomSeed()));
      return;
    }

    const slots = listSlots(this.storage);
    const left = 640 - CARD.w - CARD.gap;
    slots.forEach((info, i) => this.card(left + i * (CARD.w + CARD.gap), info));
    if (this.notice) this.label(640, 340, this.notice, 15, '#ffb4a8');
  }

  private card(cx: number, info: SlotInfo): void {
    const { slot } = info;
    const top = CARD.y;
    this.dynamic.push(this.add.rectangle(cx, top + CARD.h / 2, CARD.w, CARD.h, 0x1d1a16, 0.85).setStrokeStyle(2, 0x6b5a3a));
    this.label(cx, top + 24, `Slot ${slot}`, 20, INK);

    const summary =
      info.status === 'filled'
        ? `Day ${info.summary.day} · People ${info.summary.people} · Seed ${info.summary.seed}`
        : info.status === 'empty' ? 'Empty' : 'Unreadable save';
    this.cardTexts.push(`Slot ${slot} ${summary}`);

    if (this.confirming === slot) {
      this.label(cx, top + 66, 'Delete this camp?', 17, INK);
      this.row(cx, top + 112, [
        ['yes', 'Yes', () => this.deleteSlot(slot)],
        ['no', 'No', () => ((this.confirming = null), this.render())],
      ], slot);
      return;
    }
    this.label(cx, top + 66, summary, 16, info.status === 'filled' ? INK : DIM);

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

  private label(x: number, y: number, label: string, size: number, color: string): void {
    this.dynamic.push(
      this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5),
    );
  }

  /** Buttons side by side, centred on `cx`. */
  private row(cx: number, y: number, defs: [string, string, () => void][], slot: SlotId): void {
    const labels = defs.map(([, label]) => label);
    const widths = labels.map((l) => l.length * 8 + 28);
    const gap = 10;
    let x = cx - (widths.reduce((a, b) => a + b, 0) + gap * (defs.length - 1)) / 2;
    defs.forEach(([name, label, onClick], i) => {
      this.button(`slot${slot}.${name}`, x + widths[i] / 2, y, label, onClick, 15, 6);
      x += widths[i] + gap;
    });
  }

  private button(name: string, x: number, y: number, label: string, onClick: () => void, size = 24, pad = 8): void {
    const b = this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, color: '#1d1a16', backgroundColor: INK })
      .setOrigin(0.5)
      .setPadding(size === 24 ? 14 : 10, pad)
      .setInteractive({ useHandCursor: true });
    b.on('pointerover', () => b.setBackgroundColor('#ffffff'));
    b.on('pointerout', () => b.setBackgroundColor(INK));
    b.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
    this.dynamic.push(b);
    this.spots[name] = [x, y];
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
