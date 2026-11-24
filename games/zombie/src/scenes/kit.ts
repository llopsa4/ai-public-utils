import Phaser from 'phaser';
import { audio } from '../audio/engine';
import { UI_TEXTURE, isFinal, uiOf } from '../render/ui';
import { type Box, buttonFrame, tooltipBox } from '../render/uiview';

// The painted "worn field kit" in the scenes (Z54, art/STYLE.md *UI art*): Phaser objects that draw the
// kit pieces from the `ui` atlas. Geometry and choices live in the pure `render/ui.ts` and `render/uiview.ts`;
// this file only makes objects. Until Codex's art is installed the atlas holds grey labelled stand-ins.

export const TITLE_BG = 'title_bg';
export const TITLE_LOGO = 'title_logo';

/**
 * A kit piece stretched to `w` x `h` display px with its top-left at (x, y). The piece's corners show at their
 * display size times `f` (the text-size factor), the same geometry as `nineSlice()` in `render/ui.ts`. Pieces are
 * drawn at 2x, so the object is scaled by `f / k` and given a size `k / f` times larger.
 */
export function kitSlice(scene: Phaser.Scene, name: string, x: number, y: number, w: number, h: number, f = 1): Phaser.GameObjects.NineSlice {
  const it = uiOf(name);
  const k = it.scale;
  const [l, t, r, b] = it.inset ?? [0, 0, 0, 0];
  const s = f / k;
  return scene.add.nineslice(x, y, UI_TEXTURE, name, w / s, h / s, l * k, r * k, t * k, b * k).setOrigin(0, 0).setScale(s);
}

/** Resizes a kit piece to `w` x `h` display px (its scale is kept). */
export function resizeSlice(ns: Phaser.GameObjects.NineSlice, w: number, h: number): void {
  const s = ns.scaleX;
  if (ns.width !== w / s) ns.width = w / s;
  if (ns.height !== h / s && !ns.is3Slice) ns.height = h / s;
}

/** Shows another kit piece of the same shape (a button's state) on an existing slice. */
export function setSliceFrame(ns: Phaser.GameObjects.NineSlice, name: string): void {
  if (ns.frame.name === name) return;
  ns.setFrame(name);
  ns.updateVertices();
}

/**
 * The title art over the whole screen (640x360 at 1x, so exactly 2x at 1280x720; the texture is already NEAREST),
 * then a black veil of opacity `dim`. Draws nothing and returns false when the texture is missing, or (with
 * `onlyFinal`) while it is still a grey stand-in. Z57: the title menu and the pause menu share it.
 */
export function titleBackdrop(scene: Phaser.Scene, dim: number, onlyFinal = false): boolean {
  if (!scene.textures.exists(TITLE_BG) || (onlyFinal && !isFinal(TITLE_BG))) return false;
  const { width, height } = scene.scale;
  scene.add.image(0, 0, TITLE_BG).setOrigin(0, 0).setDisplaySize(width, height);
  if (dim > 0) scene.add.rectangle(0, 0, width, height, 0x000000, dim).setOrigin(0, 0);
  return true;
}

/** An atlas icon drawn `px` display pixels wide and tall with its top-left at (x, y). */
export function uiImage(scene: Phaser.Scene, name: string, x: number, y: number, px: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, UI_TEXTURE, name).setOrigin(0, 0).setDisplaySize(px, px);
}

export interface KitButtonOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text-size factor for the corners (the action bar passes the option's; menus pass 1). */
  f?: number;
  label?: string;
  fontFamily?: string;
  fontPx?: number;
  color?: string;
  /** Fires on pointer down (the action bar) or on release (menus). */
  fireOn?: 'down' | 'up';
  onClick: () => void;
  /** Called when the pointer enters and leaves, so a bar can show its tooltip. */
  onHover?: (over: boolean) => void;
  /** Plays the menu tick when it fires (default true). */
  sound?: boolean;
}

/** A button drawn from the kit: normal, hover, pressed, disabled and active frames, with an optional centred label. */
export class KitButton {
  readonly slice: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text | null;
  enabled = true;
  active = false;
  private hover = false;
  private down = false;

  constructor(scene: Phaser.Scene, o: KitButtonOptions) {
    this.slice = kitSlice(scene, 'kit_button_normal', o.x, o.y, o.w, o.h, o.f ?? 1).setInteractive({ useHandCursor: true });
    this.label =
      o.label === undefined
        ? null
        : scene.add
            .text(o.x + o.w / 2, o.y + o.h / 2, o.label, { fontFamily: o.fontFamily, fontSize: `${o.fontPx ?? 20}px`, color: o.color ?? '#e8e6de', align: 'center' })
            .setOrigin(0.5);
    const fire = (): void => {
      if (!this.enabled) return;
      if (o.sound !== false) audio.ui();
      o.onClick();
    };
    this.slice
      .on('pointerover', () => {
        this.hover = true;
        o.onHover?.(true);
        this.refresh();
      })
      .on('pointerout', () => {
        this.hover = false;
        this.down = false;
        o.onHover?.(false);
        this.refresh();
      })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        this.down = true;
        this.refresh();
        if (o.fireOn === 'down') fire();
      })
      .on('pointerup', () => {
        const was = this.down;
        this.down = false;
        this.refresh();
        if (was && o.fireOn !== 'down') fire();
      });
    this.refresh();
  }

  /** Picks the frame for the current state; call after changing `enabled` or `active`. */
  refresh(): void {
    setSliceFrame(this.slice, buttonFrame({ enabled: this.enabled, active: this.active, hover: this.hover, down: this.down }));
  }

  get isHover(): boolean {
    return this.hover;
  }

  /** Every game object, for a container to take over. */
  parts(): Phaser.GameObjects.GameObject[] {
    return this.label ? [this.slice, this.label] : [this.slice];
  }

  destroy(): void {
    this.slice.destroy();
    this.label?.destroy();
  }
}

/**
 * A menu button centred on (cx, cy): the label is measured first, then the kit button is made `padX` wider on
 * each side and `padY` taller (menus are not scaled by the text size, so the corners stay at their 100% size).
 */
export function menuButton(scene: Phaser.Scene, cx: number, cy: number, label: string, fontFamily: string, fontPx: number, onClick: () => void, color = '#e8e6de', minW = 0): KitButton {
  const probe = scene.add.text(0, 0, label, { fontFamily, fontSize: `${fontPx}px` });
  const w = Math.max(minW, Math.round(probe.width) + 56);
  const h = Math.round(probe.height) + 22;
  probe.destroy();
  return new KitButton(scene, { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, label, fontFamily, fontPx, color, onClick });
}

/** The small paper label over a button: kit_tooltip with one line of text. */
export class Tooltip {
  private readonly slice: Phaser.GameObjects.NineSlice;
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, fontFamily: string) {
    this.slice = kitSlice(scene, 'kit_tooltip', 0, 0, 40, 24).setVisible(false);
    this.text = scene.add.text(0, 0, '', { fontFamily, fontSize: '14px', color: '#e8e6de' }).setOrigin(0.5).setVisible(false);
  }

  /** Shows `text` over (or, near the top of the screen, under) a button's box. `f` scales the font and padding. */
  show(text: string, btn: Box, screenW: number, f = 1): void {
    const px = Math.round(14 * f);
    if (this.text.style.fontSize !== `${px}px`) this.text.setFontSize(px);
    this.text.setText(text);
    const padX = Math.round(10 * f);
    const padY = Math.round(5 * f);
    const w = Math.round(this.text.width) + 2 * padX;
    const h = Math.round(this.text.height) + 2 * padY;
    const b = tooltipBox(btn, w, h, screenW);
    this.slice.setPosition(b.x, b.y).setVisible(true);
    resizeSlice(this.slice, w, h);
    this.text.setPosition(b.x + w / 2, b.y + h / 2).setVisible(true);
  }

  hide(): void {
    this.slice.setVisible(false);
    this.text.setVisible(false);
  }

  parts(): Phaser.GameObjects.GameObject[] {
    return [this.slice, this.text];
  }
}
