import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import { hungerLabel, barMetrics, uiFactor, type BarMetrics } from '../render/cues';
import { ammoCount, barIcon, tooltipText } from '../render/uiview';
import type { BarButton } from '../sim/abilities';
import { buttonAction } from '../sim/keymap';
import { options } from '../sim/options';
import { keyOf } from './actionKeys';
import { KitButton, Tooltip, kitSlice, resizeSlice, uiImage } from './kit';
import { scaleText, ui } from './uiScale';

// Action bar (DESIGN §17): the selected survivor's portrait and action buttons along the bottom. Icon buttons
// from the UI kit (Z54): the icon, the bound key in the top-left corner, the ammo count in the bottom-right
// one, the name on a tooltip; the portrait stays grey until Z56. It reads the registry key `m_bar` and
// reports a click or a hotkey-less press as the game event `dw-action` with the button id.

const FONT = GAME_FONT;
export const BAR_H = 68;
const BAR_HALF_W = 330; // the bar never reaches farther than this from the screen centre

/** The bar's height at the current text size (DESIGN §19); `BAR_H` is its height at 100%. */
export const barH = (): number => ui(BAR_H);

export interface BarModel {
  name: string;
  hp: number;
  buttons: BarButton[];
  hunger?: { frac: number; level: 'ok' | 'low' | 'critical' | 'starving' }; // Base 1: the meter under the portrait (DESIGN §12)
  meal?: boolean; // holding a cooked meal
}

export const ACTION_EVENT = 'dw-action';

/** Style for a HUD hint line: wraps instead of running off the screen (DESIGN §19 HUD). */
export const HINT_WRAP = 760;

/** A key press skips the fail-screen wait, but only after this long so keys held at the moment of death do not. */
export const SKIP_AFTER_MS = 600;

/** Puts the hint line just above the selection text; they used to share a row and overlap. */
export function placeHint(hint: Phaser.GameObjects.Text, sel: Phaser.GameObjects.Text, width: number): void {
  hint.setPosition(width / 2, sel.y - sel.height - 8);
}

/** True when a screen point is over the bar, so the world underneath must ignore the click. */
export function overBar(r: Phaser.Data.DataManager, x: number, y: number, width: number, height: number): boolean {
  return r.get('m_bar') != null && y >= height - barH() && Math.abs(x - width / 2) <= ((r.get('m_bar_w') as number | undefined) ?? BAR_HALF_W);
}

interface Slot {
  id: string;
  btn: KitButton;
  icon: Phaser.GameObjects.Image | null;
  key: Phaser.GameObjects.Text;
  ammo: Phaser.GameObjects.Text;
}

const CORNER = { fontFamily: FONT, color: '#f2efe4', stroke: '#101210' } as const;

export class ActionBarScene extends Phaser.Scene {
  private slots: Slot[] = [];
  private signature = '';
  private panel!: Phaser.GameObjects.NineSlice;
  private portrait!: Phaser.GameObjects.Rectangle;
  private caption!: Phaser.GameObjects.Text;
  private hungerWord!: Phaser.GameObjects.Text;
  private m!: BarMetrics;
  private meter!: Phaser.GameObjects.Graphics;
  private meterX = 0;
  private group!: Phaser.GameObjects.Container;
  private tip!: Tooltip;
  private hovered = -1;

  constructor() {
    super('ActionBar');
  }

  create(): void {
    this.slots = [];
    this.signature = '';
    this.hovered = -1;
    this.group = this.add.container(0, 0);
    this.m = barMetrics(options().textSize, 0, this.scale.width);
    this.panel = kitSlice(this, 'kit_panel', 0, 0, 40, 40);
    this.portrait = this.add.rectangle(0, 0, this.m.portrait, this.m.portrait, 0x5a5d58).setOrigin(0, 0).setStrokeStyle(2, 0x8a8d86);
    this.caption = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#e8e6de', align: 'center' }).setOrigin(0.5, 0);
    this.hungerWord = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#e8c46a', align: 'right' }).setOrigin(1, 0.5);
    this.meter = this.add.graphics();
    this.tip = new Tooltip(this, FONT);
    this.group.add([this.panel, this.portrait, this.caption, this.hungerWord, this.meter, ...this.tip.parts()]);
  }

  private rebuild(model: BarModel): void {
    for (const s of this.slots) {
      s.btn.destroy();
      s.icon?.destroy();
      s.key.destroy();
      s.ammo.destroy();
    }
    this.slots = [];
    this.hovered = -1;
    const { width, height } = this.scale;
    const f = uiFactor(options().textSize);
    const m = barMetrics(options().textSize, model.buttons.length, width);
    this.m = m;
    const total = m.portrait + m.gap + model.buttons.length * (m.btnW + m.gap) - m.gap;
    this.registry.set('m_bar_w', total / 2 + 14);
    const x0 = Math.round((width - total) / 2);
    const y0 = height - m.barH + Math.round((m.barH - m.btnH) / 2);
    this.meterX = x0;
    this.panel.setPosition(x0 - 14, height - m.barH);
    resizeSlice(this.panel, total + 28, m.barH);
    this.portrait.setSize(m.portrait, m.portrait).setPosition(x0, height - m.barH + 4);
    this.caption.setPosition(x0 + m.portrait / 2, height - m.barH + 4 + ui(9));
    scaleText(this.caption, 12);
    const pad = Math.max(3, Math.round(3 * f));
    const stroke = Math.max(2, Math.round(3 * f));
    model.buttons.forEach((b, i) => {
      const x = x0 + m.portrait + m.gap + i * (m.btnW + m.gap);
      const btn = new KitButton(this, {
        x,
        y: y0,
        w: m.btnW,
        h: m.btnH,
        f,
        fireOn: 'down',
        onClick: () => this.game.events.emit(ACTION_EVENT, b.id),
        onHover: (over) => {
          if (over) this.hovered = i;
          else if (this.hovered === i) this.hovered = -1;
        },
      });
      const name = barIcon(b.id);
      const icon = name ? uiImage(this, name, x + (m.btnW - m.icon) / 2, y0 + (m.btnH - m.icon) / 2, m.icon) : null;
      const key = this.add.text(x + pad + 1, y0 + pad, '', { ...CORNER, fontSize: `${m.keyPx}px`, strokeThickness: stroke }).setOrigin(0, 0);
      const ammo = this.add
        .text(x + m.btnW - pad - 1, y0 + m.btnH - pad, '', { ...CORNER, fontSize: `${m.keyPx + 2}px`, color: '#f0dc8a', strokeThickness: stroke })
        .setOrigin(1, 1);
      this.group.add([...btn.parts(), ...(icon ? [icon] : []), key, ammo]);
      this.slots.push({ id: b.id, btn, icon, key, ammo });
    });
    for (const o of this.tip.parts()) this.group.bringToTop(o); // the tooltip draws over the buttons
  }

  /** The hunger meter under the portrait: green, yellow at 2 min, red flashing at 30 s, solid red once starving. */
  private drawMeter(model: BarModel): void {
    const g = this.meter.clear();
    const h = model.hunger;
    if (!h) return;
    const { portrait, barH: bh } = this.m;
    const y = this.scale.height - bh + 4 + portrait + 2;
    const flash = h.level === 'critical' && Math.floor(this.time.now / 300) % 2 === 0;
    const color = h.level === 'ok' ? 0x9bc79b : h.level === 'low' ? 0xe8c46a : 0xd85a4a;
    g.fillStyle(0x1a1c19, 0.9).fillRect(this.meterX, y, portrait, 4);
    if (!flash) g.fillStyle(color, 1).fillRect(this.meterX, y, h.level === 'starving' ? portrait : portrait * Math.max(0, Math.min(1, h.frac)), 4);
  }

  /** With shape cues on, a word beside the meter says what its colour means (DESIGN §19). */
  private drawHungerWord(model: BarModel): void {
    const word = options().cues && model.hunger ? hungerLabel(model.hunger.level) : '';
    this.hungerWord.setVisible(word !== '').setText(word);
    if (word === '') return;
    const y = this.scale.height - this.m.barH + 4 + this.m.portrait + 4;
    scaleText(this.hungerWord, 12);
    this.hungerWord.setPosition(this.meterX - 8, y).setColor(model.hunger!.level === 'low' ? '#e8c46a' : '#e0806a');
  }

  update(): void {
    const model = this.registry.get('m_bar') as BarModel | null | undefined;
    this.group.setVisible(!!model);
    if (!model) {
      this.signature = '';
      this.hovered = -1;
      return;
    }
    const sig = `${options().textSize}:${this.scale.width}:${model.buttons.map((b) => b.id).join(',')}`;
    if (sig !== this.signature) {
      this.signature = sig;
      this.rebuild(model);
    }
    this.caption.setText(model.meal ? 'meal' : ''); // DESIGN §17: no name or HP here, the squad card holds them
    this.portrait.setStrokeStyle(2, model.meal ? 0xe8c46a : 0x8a8d86);
    this.drawMeter(model);
    this.drawHungerWord(model);
    model.buttons.forEach((b, i) => {
      const s = this.slots[i];
      if (!s) return;
      s.btn.enabled = b.enabled;
      s.btn.active = b.active;
      s.btn.refresh();
      const n = ammoCount(b.label);
      s.key.setText(this.keyShown(b));
      s.ammo.setText(n === null ? '' : String(n));
      const a = b.enabled ? 1 : 0.45;
      s.icon?.setAlpha(a);
      s.key.setAlpha(a);
      s.ammo.setAlpha(a);
    });
    this.drawTooltip(model);
  }

  /** The key a button shows: the bound one, not the default the sim lists (Z37). */
  private keyShown(b: BarButton): string {
    const action = buttonAction(b.id, b.key);
    return action ? keyOf(action) : b.key;
  }

  /** The name and key of the hovered button on a paper label above it (art/STYLE.md *UI art*). */
  private drawTooltip(model: BarModel): void {
    const b = model.buttons[this.hovered];
    const s = this.slots[this.hovered];
    if (!b || !s) {
      this.tip.hide();
      return;
    }
    const sl = s.btn.slice;
    this.tip.show(tooltipText(b.label, this.keyShown(b)), { x: sl.x, y: sl.y, w: this.m.btnW, h: this.m.btnH }, this.scale.width, uiFactor(options().textSize));
  }
}
