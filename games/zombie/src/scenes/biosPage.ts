import Phaser from 'phaser';
import { hasFigure } from '../render/atlas';
import { GAME_FONT } from '../render/font';
import { isFinal, smallPortraitKey } from '../render/ui';
import { type Beat, type BioTab, type Progress, bioTabs } from '../sim/bios';
import { traitLine } from '../sim/traits';
import { KitButton, kitSlice, uiImage } from './kit';
import { ui } from './uiScale';

// The Bios page (DESIGN §24), shared by the title screen and the pause menu: one tab per survivor met so far,
// a full-body figure on the left, and on the right the name, age, past role, trait line and the scrolling story.
// The caller draws the panel behind it (1240 wide, 24 px from the top and bottom) and clears its children when
// it leaves the page; the page keeps its own tab and scroll state and hands back what the scene's keys and
// wheel need.

export const BIOS_PANEL_W = 1240;

const FONT = GAME_FONT;
const PAD = 24; // from the panel's edge to its content
const TAB_W = 200;
const TAB_H = 64;
const TOP = 124; // the figure card and the right column start here
const GAP = 30; // between the figure card and the right column
const FIGURE_W = Math.floor((BIOS_PANEL_W - 2 * PAD - GAP) / 2); // the card is half the page, the text the other half
const FRAME = 128; // the idle frame's cell, in source px
const SCROLL_W = 8; // the scrollbar's width, inside the right column's right edge

export const BEAT_LABEL: Record<Beat, string> = {
  intro: 'Intro',
  mission1: 'Mission 1',
  rescue: 'The rescue',
  base1: 'Base 1',
  herd: 'The herd',
  done: 'After the herd',
  bunker: 'The bunker door',
  base2: 'Base 2',
  hut: 'The hut',
};

/** What a scene's keys and wheel call on the page it is showing. */
export interface BiosPage {
  /** Next (1) or previous (-1) tab, wrapping. */
  step(dir: -1 | 1): void;
  /** Scrolls the story by `px` (positive = down). */
  scroll(px: number): void;
}

/**
 * Draws the Bios page for the story reached (`progress`) centred on `cx`. `onClose` runs from the X button (Esc is the scene's own).
 * The objects belong to the scene; they are destroyed with the scene's other children, or by the page itself when a tab changes.
 */
export function drawBiosPage(scene: Phaser.Scene, cx: number, progress: Progress, onClose: () => void): BiosPage {
  const tabs = bioTabs(progress);
  const { height } = scene.scale;
  const left = Math.round(cx - BIOS_PANEL_W / 2);
  const bottom = height - 62; // the hint line sits below
  let tab = 0;
  let scrollY = 0;
  let maxScroll = 0;
  let objects: Phaser.GameObjects.GameObject[] = [];
  let story: Phaser.GameObjects.Container | null = null;
  let viewTop = 0;
  let thumb: Phaser.GameObjects.Rectangle | null = null;
  let viewH = 0;

  const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    objects.push(o);
    return o;
  };
  const text = (x: number, y: number, s: string, px: number, color: string, wrap = 0): Phaser.GameObjects.Text =>
    scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${px}px`, color, lineSpacing: 4, wordWrap: wrap > 0 ? { width: wrap } : undefined });

  const select = (i: number): void => {
    tab = i;
    scrollY = 0;
    build();
  };

  const drawTabs = (): void => {
    tabs.forEach((t, i) => {
      const x = left + PAD + i * (TAB_W + 10);
      const y = 40;
      const b = new KitButton(scene, { x, y, w: TAB_W, h: TAB_H, label: t.name, fontFamily: FONT, fontPx: 24, fireOn: 'up', onClick: () => select(i) });
      b.label?.setPosition(x + 62 + (TAB_W - 62 - 12) / 2, y + TAB_H / 2);
      b.active = i === tab;
      b.refresh();
      b.parts().forEach(keep);
      keep(uiImage(scene, smallPortraitKey(t.kind, false), x + 12, y + TAB_H / 2 - 18, 36));
    });
    const close = new KitButton(scene, { x: left + BIOS_PANEL_W - PAD - 56, y: 40, w: 56, h: TAB_H, label: 'X', fontFamily: FONT, fontPx: 26, color: '#c8c6be', fireOn: 'up', onClick: onClose });
    close.parts().forEach(keep);
  };

  /** The full-body figure: the approved `bio_<kind>` once it is final (1:1 when it fits, on a baseline they all share), else the idle frame at the largest whole-number scale the card holds, nearest-neighbour. */
  const drawFigure = (t: BioTab): void => {
    const x = left + PAD;
    const h = bottom - TOP;
    keep(kitSlice(scene, 'kit_card', x, TOP, FIGURE_W, h));
    const mx = x + FIGURE_W / 2;
    const art = `bio_${t.kind}`;
    if (isFinal(art) && scene.textures.exists(art)) {
      const src = scene.textures.get(art).getSourceImage();
      const k = Math.min(1, (FIGURE_W - 16) / src.width, (h - 16) / src.height);
      keep(scene.add.image(mx, TOP + h - 8, art).setOrigin(0.5, 1).setScale(k));
    } else if (hasFigure(scene, t.kind, t.kind)) {
      const k = Math.max(1, Math.min(Math.floor((FIGURE_W - 16) / FRAME), Math.floor((h - 16) / FRAME)));
      keep(scene.add.image(mx, TOP + h / 2, t.kind, `${t.kind}_idle_se_0`).setScale(k));
    } else {
      keep(text(mx, TOP + h / 2, t.name, 32, '#a8a69e').setOrigin(0.5)); // no art loaded at all: the name on the card
    }
  };

  const drawStory = (t: BioTab, x0: number, w: number, top: number): void => {
    viewTop = top;
    viewH = Math.max(40, bottom - top);
    const wrap = w - SCROLL_W - 16;
    const box = scene.add.container(x0, top);
    story = box;
    let y = 0;
    const block = (heading: string, body: string): void => {
      const hd = text(0, y, heading, ui(20), '#e8c46a');
      const tx = text(0, y + hd.height + 2, body, ui(19), '#d6d4cc', wrap);
      box.add([hd, tx]);
      y += hd.height + 2 + tx.height + 16;
    };
    block('Background', t.background);
    for (const e of t.entries) block(BEAT_LABEL[e.beat], e.text);
    maxScroll = Math.max(0, Math.round(y - 16 - viewH));
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(x0, top, w, viewH);
    const mask = g.createGeometryMask();
    box.setMask(mask);
    box.once(Phaser.GameObjects.Events.DESTROY, () => {
      mask.destroy();
      g.destroy();
    });
    keep(box);
    thumb = null;
    if (maxScroll > 0) {
      const sx = x0 + w - SCROLL_W;
      keep(scene.add.rectangle(sx, top, SCROLL_W, viewH, 0x000000, 0.45).setOrigin(0, 0));
      const th = Math.max(30, Math.round((viewH * viewH) / (viewH + maxScroll)));
      thumb = keep(scene.add.rectangle(sx, top, SCROLL_W, th, 0xe8c46a, 0.8).setOrigin(0, 0));
    }
    place();
  };

  /** Moves the story and its scrollbar thumb to `scrollY`. */
  const place = (): void => {
    story?.setY(viewTop - scrollY);
    if (thumb && maxScroll > 0) thumb.setY(viewTop + (scrollY / maxScroll) * (viewH - thumb.height));
  };

  const build = (): void => {
    for (const o of objects) o.destroy();
    objects = [];
    story = null;
    thumb = null;
    const t = tabs[tab];
    drawTabs();
    drawFigure(t);
    const x0 = left + PAD + FIGURE_W + GAP;
    const w = left + BIOS_PANEL_W - PAD - x0;
    let y = TOP;
    const line = (s: string, px: number, color: string): void => {
      const o = keep(text(x0, y, s, px, color, w));
      y += o.height + 6;
    };
    line(t.fullName, ui(38), '#e8e6de');
    line(`Age ${t.age}  -  ${t.role}`, ui(20), '#a8a69e');
    if (t.dakota) line(`${t.dakota.name}  -  "${t.dakota.meaning}"`, ui(20), '#e8c46a');
    const trait = traitLine(t.name);
    if (trait) line(trait, ui(18), '#9bc79b');
    keep(scene.add.rectangle(x0, y + 4, w, 2, 0x5a5c54).setOrigin(0, 0));
    drawStory(t, x0, w, y + 16);
    keep(text(cx, height - 40, 'Left / Right: survivor     Wheel or Up / Down: scroll     Esc: back', 16, '#a8a69e').setOrigin(0.5));
  };

  build();
  return {
    step: (dir) => {
      if (tabs.length > 1) select((tab + dir + tabs.length) % tabs.length);
    },
    scroll: (px) => {
      scrollY = Math.max(0, Math.min(maxScroll, scrollY + px));
      place();
    },
  };
}
