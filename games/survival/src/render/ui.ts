// Interface surfaces and icons (art/SPEC.md section 10). A surface is the plain Rectangle the scenes already use for
// hit-testing and layout; when `ui_panel` / `ui_button` / `ui_bar_frame` have final art (or stand-ins with `?standins`)
// a Phaser NineSlice is drawn in its place and follows it every frame, so a scene never has to know which one shows.
// Without art the rectangle keeps its own fill, exactly as before.
import Phaser from 'phaser';
import { fromAtlas } from './art';
import { defaultFrame } from './frames';
import { entry } from './manifest';
import { KEY, surfaceFrame, type Look, type SurfaceKind } from './uiLogic';

export { surfaceFrame, type Look, type SurfaceKind };

/** The interface font (SIL Open Font License, bundled by `fonts.ts`), with fallbacks for the moment it loads. */
export const UI_FONT = 'Alegreya, Georgia, "Times New Roman", serif';

/** The tint a nine-slice panel or bar takes when it is `active` (a button has its own `pressed` frame instead). */
const ACTIVE_TINT = 0xffe0a0;

export interface SurfaceStyle {
  fill?: number;
  alpha?: number;
  /** Stroke colour and width of the fallback rectangle; none when omitted. */
  stroke?: [number, number];
  /** The fallback fill when `active` (defaults to the normal fill). */
  activeFill?: number;
  origin?: [number, number];
}

interface Surface {
  rect: Phaser.GameObjects.Rectangle;
  slice: Phaser.GameObjects.NineSlice | null;
  kind: SurfaceKind;
  style: SurfaceStyle;
  look: Look;
  over: boolean;
  down: boolean;
  /** What the slice shows now, so a frame is only set when it changes. */
  shown: { frame: string; w: number; h: number; tint: number };
}

const surfaces = new WeakMap<Phaser.Scene, Surface[]>();
const byRect = new WeakMap<Phaser.GameObjects.Rectangle, Surface>();

/** True when a texture key can be drawn now: from its atlas (final art or a stand-in), else from a code placeholder. */
export function iconAvailable(scene: Phaser.Scene, key: string): boolean {
  return fromAtlas(scene, key) || scene.textures.exists(key);
}

/**
 * Adds a rectangle that is a panel, button or bar frame. Everything a scene does with a rectangle still works
 * (position, size, visibility, alpha, depth, interactivity); change its look with `setLook`, not `setFillStyle`.
 */
export function makeSurface(
  scene: Phaser.Scene,
  kind: SurfaceKind,
  x: number,
  y: number,
  w: number,
  h: number,
  style: SurfaceStyle = {},
): Phaser.GameObjects.Rectangle {
  const [ox, oy] = style.origin ?? [0, 0];
  const rect = scene.add.rectangle(x, y, w, h, style.fill ?? 0x3a3328, style.alpha ?? 1).setOrigin(ox, oy);
  if (style.stroke) rect.setStrokeStyle(style.stroke[1], style.stroke[0]);
  const key = KEY[kind];
  const first = kind === 'button' ? 'ui_button/normal' : defaultFrame(key);
  const e = entry(key);
  let slice: Phaser.GameObjects.NineSlice | null = null;
  if (e.atlas && fromAtlas(scene, key, first)) {
    const s = e.slice ?? 16;
    slice = scene.add.nineslice(x, y, e.atlas, first, w * 2, h * 2, s, s, s, s).setOrigin(ox, oy).setScale(0.5);
    rect.setFillStyle(0x000000, 0).setStrokeStyle();
  }
  const surface: Surface = {
    rect, slice, kind, style, look: 'normal', over: false, down: false,
    shown: { frame: first, w: w * 2, h: h * 2, tint: 0xffffff },
  };
  byRect.set(rect, surface);
  if (kind === 'button') {
    rect.on('pointerover', () => (surface.over = true));
    rect.on('pointerout', () => ((surface.over = false), (surface.down = false)));
    rect.on('pointerdown', () => (surface.down = true));
    rect.on('pointerup', () => (surface.down = false));
  }
  let list = surfaces.get(scene);
  if (!list) {
    list = [];
    surfaces.set(scene, list);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, () => sync(scene));
  }
  list.push(surface);
  if (slice) place(surface);
  return rect;
}

/** Changes a surface's look: art picks the frame or tint, the fallback rectangle changes its fill. */
export function setLook(rect: Phaser.GameObjects.Rectangle, look: Look): void {
  const s = byRect.get(rect);
  if (!s || s.look === look) return;
  s.look = look;
  if (s.slice) place(s);
  else rect.setFillStyle(look === 'active' ? s.style.activeFill ?? s.style.fill ?? 0x3a3328 : s.style.fill ?? 0x3a3328, s.style.alpha ?? 1);
}

/** The frame name a surface shows now (null when it has no art), for the smoke test and unit checks. */
export function surfaceShows(rect: Phaser.GameObjects.Rectangle): string | null {
  const s = byRect.get(rect);
  return s?.slice ? s.shown.frame : null;
}

/** Sets the stroke of a fallback panel (the armed building strip uses a gold border); art shows it as a tint. */
export function setStroke(rect: Phaser.GameObjects.Rectangle, width: number, color: number, active: boolean): void {
  const s = byRect.get(rect);
  if (s?.slice) setLook(rect, active ? 'active' : 'normal');
  else rect.setStrokeStyle(width, color);
}

/** Moves the slice to its rectangle: frame, size, tint, position, visibility, alpha and depth. */
function place(s: Surface): void {
  const { rect, slice } = s;
  if (!slice) return;
  const frame = surfaceFrame(s.kind, s.look, s.over, s.down);
  const w = Math.max(1, rect.displayWidth) * 2;
  const h = Math.max(1, rect.displayHeight) * 2;
  const tint = s.kind !== 'button' && s.look === 'active' ? ACTIVE_TINT : 0xffffff;
  if (frame !== s.shown.frame) {
    slice.setTexture(entry(KEY[s.kind]).atlas as string, frame);
    s.shown.frame = frame;
  }
  if (w !== s.shown.w || h !== s.shown.h) {
    slice.setSize(w, h);
    s.shown.w = w;
    s.shown.h = h;
  }
  if (tint !== s.shown.tint) {
    slice.setTint(tint);
    s.shown.tint = tint;
  }
  slice.setPosition(rect.x, rect.y).setVisible(rect.visible).setAlpha(rect.alpha).setDepth(rect.depth);
}

function sync(scene: Phaser.Scene): void {
  const list = surfaces.get(scene);
  if (!list) return;
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    if (!s.rect.active) {
      // The scene restarted and destroyed the rectangle; drop its slice with it.
      s.slice?.destroy();
      list.splice(i, 1);
    } else place(s);
  }
}

/** Gives an image an icon's picture fitted into `size` px; returns false (and hides it) when the key has no art and no placeholder. */
export function showIcon(img: Phaser.GameObjects.Image, key: string, size: number): boolean {
  const scene = img.scene;
  if (!iconAvailable(scene, key)) {
    img.setVisible(false);
    return false;
  }
  if (fromAtlas(scene, key)) {
    const e = entry(key);
    const [ax, ay] = e.anchor as [number, number];
    img.setTexture(e.atlas as string, defaultFrame(key)).setOrigin(ax, ay);
  } else {
    img.setTexture(key).setOrigin(0.5, 0.5);
  }
  img.setScale(size / Math.max(img.width, img.height));
  return true;
}

/** Adds an icon image at a screen point, fitted into `size` px, or returns null when the key has no art and no placeholder. */
export function addIcon(scene: Phaser.Scene, key: string, x: number, y: number, size: number): Phaser.GameObjects.Image | null {
  const img = scene.add.image(x, y, '__DEFAULT');
  if (showIcon(img, key, size)) return img;
  img.destroy();
  return null;
}

/** Text colours for the surface they sit on: light on the dark fallback rectangles, dark on the tanned-hide art. */
export interface Palette {
  ink: string;
  dim: string;
  gold: string;
  /** True when panels are drawn from art (a light hide), false for the dark fallback rectangles. */
  art: boolean;
}
const DARK: Palette = { ink: '#f3e9d2', dim: '#cdbf9c', gold: '#e0b85a', art: false };
const HIDE: Palette = { ink: '#2b1d12', dim: '#5a4630', gold: '#7a4a10', art: true };

/** The text colours for panels: the hide palette when `ui_panel` has art (or a stand-in), else the dark one. */
export function palette(scene: Phaser.Scene): Palette {
  return fromAtlas(scene, 'ui_panel', 'ui_panel') ? HIDE : DARK;
}

export interface TextButton {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  setLabel: (label: string) => void;
}

/**
 * A button sized to its label, centred on (x, y): the cream rectangle with dark text as before, or `ui_button` art with
 * the palette's text. `onClick` runs on a left press. Hide `bg` and `text` together (or use `setButtonVisible`).
 */
export function textButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  size: number,
  pad: [number, number],
  onClick: () => void,
  depth = 0,
): TextButton {
  const P = palette(scene);
  const text = scene.add
    .text(x, y, label, { fontFamily: UI_FONT, fontSize: `${size}px`, color: P.art ? P.ink : '#1d1a16' })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  const bg = makeSurface(scene, 'button', x, y, text.width + pad[0] * 2, text.height + pad[1] * 2, {
    fill: 0xf3e9d2, activeFill: 0xffffff, origin: [0.5, 0.5],
  }).setDepth(depth);
  // Behind its label: the surface was added after the text, so move it down in the display list.
  scene.children.moveBelow(bg, text);
  bg.setInteractive({ useHandCursor: true });
  // The cream rectangle brightens under the pointer; art buttons have their own hover frame.
  if (!P.art) {
    bg.on('pointerover', () => setLook(bg, 'active'));
    bg.on('pointerout', () => setLook(bg, 'normal'));
  }
  bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
  const setLabel = (next: string): void => {
    text.setText(next);
    bg.setSize(text.width + pad[0] * 2, text.height + pad[1] * 2);
    if (bg.input) bg.input.hitArea.setTo(0, 0, bg.width, bg.height);
  };
  return { bg, text, setLabel };
}

/** Shows or hides a text button together with its hit area. */
export function setButtonVisible(b: TextButton, on: boolean): void {
  b.bg.setVisible(on);
  b.text.setVisible(on);
  if (b.bg.input) b.bg.input.enabled = on;
}

/** Moves a text button (its rectangle and its label) to a new centre. */
export function placeButton(b: TextButton, x: number, y: number): void {
  b.bg.setPosition(x, y);
  b.text.setPosition(x, y);
}
