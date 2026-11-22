// The HUD (DESIGN-slice.md `## UI`): resource bar and Wotakuye bar, in screen space above the Game scene.
// Also the pause/speed buttons and the wave banner; toasts, the selection panel and a building's upgrades live in Select.ts.
import Phaser from 'phaser';
import data from '../data/resources.json';
import { applyArt, spriteFor } from '../render/art';
import { addIcon, makeSurface, palette, setButtonVisible, setLook, surfaceShows, textButton, UI_FONT, type Palette, type TextButton } from '../render/ui';
import { music } from '../audio/music';
import { unityBand } from '../sim/economy';
import { wotakuyeHelp } from '../sim/help';
import { displayLabel, englishLabel } from '../sim/labels';
import { castError, hasUpgrade, POWER_IDS, powerAims, powerSpent, steadyEnough, type UpgradeId } from '../sim/upgrades';
import upgradeData from '../data/upgrades.json';
import { addMessage } from '../sim/state';
import { createHover, type Hover } from './hover';
import { MinimapView } from './MinimapView';
import seasonData from '../data/seasons.json';
import { downloadText, exportName } from '../save/files';
import { queueOrders } from '../sim/orders';
import { serialize } from '../sim/save';
import { dayInSeason, seasonLabel, seasonOf, yearOf } from '../sim/seasons';
import { DAY_TICKS, horseCap, storeCap, type GameState, type Res } from '../sim/state';
import { waveBanner } from '../sim/waves';
import type { GameScene } from './Game';

const BAR = { x: 0, y: 0, w: 1280, h: 32 };
const BANNER = { x: 400, y: 44, w: 480, h: 40 };
const UNITY = { x: 750, y: 6, w: 170, h: 20 };
const MENU_BUTTON = { x: 930, y: 4, w: 76, h: 24 };
const SPEED = { x: 1016, y: 4, w: 256, h: 24 };
// A speed button also resumes a paused game; the number keys only change the speed.
const SPEED_BUTTONS: { label: string; pause: boolean; speed?: 1 | 2 | 4 }[] = [
  { label: 'Pause', pause: true },
  { label: '1x', pause: false, speed: 1 },
  { label: '2x', pause: false, speed: 2 },
  { label: '4x', pause: false, speed: 4 },
];
/** The power bar (DESIGN-upgrades-3.md `## UI`): one button per bought power, left under the resource bar. */
const POWER_BAR = { x: 8, y: 40, w: 168, h: 28, gap: 4 };
const TIP_W = 440;
const INK = '#f3e9d2';
/** A part of the resource bar: an optional icon texture key and its text. */
interface BarPart {
  icon?: string;
  /** What the bar shows; an icon stands in for the resource's word. */
  text: string;
  /** The same with its word (`Food 12 / 100`), for the smoke test; defaults to `text`. */
  plain?: string;
  /** The resource's name, shown when its icon is hovered. */
  name?: string;
}
/** The bar's icons are drawn 16 x 16 on screen (their art canvas is 32 x 32). */
const ICON = 16;
const RES: Res[] = ['food', 'wood', 'hides', 'pemmican'];

export class HudScene extends Phaser.Scene {
  private game2!: GameScene;
  private pal!: Palette;
  private barSlots: { icon: Phaser.GameObjects.Image; name: string; text: Phaser.GameObjects.Text }[] = [];
  /** The bar's texts joined, as the old single line read (the smoke test reads it). */
  private barPlain = '';
  private tint!: Phaser.GameObjects.Rectangle;
  private unityFill!: Phaser.GameObjects.Rectangle;
  /** The fill drawn from `ui_bar_fill` art (tinted), when it exists; the rectangle above is the fallback. */
  private unityArt: Phaser.GameObjects.Image | null = null;
  private unityText!: Phaser.GameObjects.Text;
  private bannerBox!: Phaser.GameObjects.Rectangle;
  private bannerText!: Phaser.GameObjects.Text;
  private endBox!: Phaser.GameObjects.Rectangle;
  private endText!: Phaser.GameObjects.Text;
  private endButton!: TextButton;
  private menuObjects: Phaser.GameObjects.GameObject[] = [];
  private tip!: { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text };
  private menuNote!: Phaser.GameObjects.Text;
  private musicToggle!: TextButton;
  private musicLevel!: Phaser.GameObjects.Text;
  private quitLabel!: TextButton;
  /** After a failed save, the quit button's next click leaves without saving. */
  private quitUnsaved = false;
  private hover!: Hover;
  private minimap!: MinimapView;
  private powerButtons: { id: UpgradeId; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image | null }[] = [];
  private aimNote!: Phaser.GameObjects.Text;
  private speedButtons: { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; b: (typeof SPEED_BUTTONS)[number] }[] = [];

  constructor() {
    super('Hud');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
  }

  /** True when a screen point is on a shown power button, so the map ignores the click. */
  overPowers(x: number, y: number): boolean {
    return this.powerButtons.some((b) => b.bg.visible && x >= b.bg.x && x <= b.bg.x + b.bg.width && y >= b.bg.y && y <= b.bg.y + b.bg.height);
  }

  /** True when a screen point is on the minimap's panel, so the map ignores the click. */
  overMinimap(x: number, y: number): boolean {
    return !!this.minimap?.contains(x, y);
  }

  /** True while the menu panel is open: the map and the other panels ignore clicks. */
  get menuOpen(): boolean {
    return this.menuObjects.length > 0 && this.menuObjects[0].active && (this.menuObjects[0] as Phaser.GameObjects.Rectangle).visible;
  }

  create(): void {
    this.menuObjects = [];
    this.quitUnsaved = false;
    // The season's tint over the map (presentation only; spring has none), under every bar and panel.
    this.tint = this.add.rectangle(0, 0, 1280, 720, 0xffffff, 0).setOrigin(0).setDepth(-1);
    this.pal = palette(this);
    makeSurface(this, 'panel', BAR.x, BAR.y, BAR.w, BAR.h, { fill: 0x1d1a16, alpha: 0.85 });
    this.barSlots = [];
    this.barPlain = '';
    this.add.rectangle(UNITY.x, UNITY.y, UNITY.w, UNITY.h, 0x3a3328, 1).setOrigin(0);
    this.unityFill = this.add.rectangle(UNITY.x, UNITY.y, 0, UNITY.h, 0x6aa84f, 1).setOrigin(0);
    this.unityArt = addIcon(this, 'ui_bar_fill', UNITY.x, UNITY.y, 1)?.setOrigin(0).setVisible(false) ?? null;
    // The frame art goes over the fill; without art this surface is invisible.
    makeSurface(this, 'bar', UNITY.x, UNITY.y, UNITY.w, UNITY.h, { fill: 0, alpha: 0 });
    this.unityText = this.add
      .text(UNITY.x + UNITY.w / 2, UNITY.y + UNITY.h / 2, '', { fontFamily: UI_FONT, fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5);
    this.createUnityTip();
    this.bannerBox = this.add.rectangle(BANNER.x, BANNER.y, BANNER.w, BANNER.h, 0x6b1f1a, 0.9).setOrigin(0).setVisible(false);
    this.bannerText = this.add
      .text(BANNER.x + BANNER.w / 2, BANNER.y + BANNER.h / 2, '', { fontFamily: UI_FONT, fontSize: '16px', color: INK })
      .setOrigin(0.5)
      .setVisible(false);
    this.endBox = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7).setOrigin(0).setVisible(false).setDepth(10).setInteractive();
    this.endText = this.add
      .text(640, 300, '', { fontFamily: UI_FONT, fontSize: '28px', color: INK, align: 'center' })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(11);
    this.endButton = textButton(this, 640, 420, 'Play again', 22, [22, 8], () => {
      for (const key of ['Game', 'Build', 'Select']) this.scene.stop(key);
      this.scene.start('Menu'); // also stops this scene
    }, 11);
    setButtonVisible(this.endButton, false);

    // With `?debug`, the smoke test reads the banner as drawn.
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.banner = () => (this.bannerBox.visible ? this.bannerText.text : null);
      camp.hudText = () => this.barPlain;
      // The bar's laid-out parts (icon key or null, text, x of the text's right end), for the smoke test.
      camp.hudBar = () => this.barSlots.filter((b) => b.text.text).map((b) => {
        const { icon } = b;
        const key = icon.frame.name === '__BASE' ? icon.texture.key : icon.frame.name;
        return { icon: icon.visible ? key : null, text: b.text.text, right: b.text.x + b.text.width };
      });
      // The frame each speed button's surface shows (null without interface art), for the smoke test.
      camp.speedFrames = () => this.speedButtons.map((b) => surfaceShows(b.bg));
      camp.wotakuyeTip = () => (this.tip.box.visible ? this.tip.text.text : null);
    }

    // Pause / 1x / 2x / 4x: the buttons only send orders, like the keys in Select.ts.
    this.speedButtons = SPEED_BUTTONS.map((b, i) => {
      const bg = makeSurface(this, 'button', SPEED.x + i * 64, SPEED.y, 60, SPEED.h, { activeFill: 0x8a6d2f }).setInteractive({ useHandCursor: true });
      // A picture of the speed when its icon exists, else the word.
      const pic = addIcon(this, `icon_speed_${b.pause ? 'pause' : `${b.speed}x`}`, bg.x + 30, bg.y + SPEED.h / 2, SPEED.h - 4);
      const label = this.add.text(bg.x + 30, bg.y + SPEED.h / 2, b.label, { fontFamily: UI_FONT, fontSize: '14px', color: this.pal.ink }).setOrigin(0.5).setVisible(!pic);
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && queueOrders(this.game2.state, [...(b.speed ? [{ type: 'speed', value: b.speed } as const] : []), { type: 'pause', on: b.pause }]));
      return { bg, label, b };
    });
    this.createMenu();
    this.createPowers();
    this.minimap = new MinimapView(this, this.game2);
  }

  /** The power bar: F1-F4 or a click casts at once, or starts aiming (bison, storm); Esc or right-click cancels. */
  private createPowers(): void {
    this.hover = createHover(this);
    this.powerButtons = POWER_IDS.map((id, i) => {
      const bg = makeSurface(this, 'button', POWER_BAR.x, POWER_BAR.y + i * (POWER_BAR.h + POWER_BAR.gap), POWER_BAR.w, POWER_BAR.h, { activeFill: 0x8a6d2f });
      const key = (upgradeData.upgrades[id] as { power: { key: string } }).power.key;
      const icon = addIcon(this, `icon_upgrade_${id}`, bg.x + 16, bg.y + POWER_BAR.h / 2, POWER_BAR.h - 4);
      const label = this.add.text(bg.x + (icon ? 32 : 8), bg.y + POWER_BAR.h / 2, `${key}  ${displayLabel(id)}`, { fontFamily: UI_FONT, fontSize: '14px', color: this.pal.ink }).setOrigin(0, 0.5);
      bg.setVisible(false);
      label.setVisible(false);
      icon?.setVisible(false);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.usePower(id));
      this.hover.attach(bg, () => this.powerTip(id));
      return { id, bg, label, icon };
    });
    this.aimNote = this.add
      .text(640, 592, '', { fontFamily: UI_FONT, fontSize: '14px', color: INK, backgroundColor: '#1d1a16' })
      .setOrigin(0.5, 1).setPadding(8, 4).setDepth(5).setVisible(false);
    const kb = this.input.keyboard!;
    kb.addCapture('F1,F2,F3,F4');
    POWER_IDS.forEach((id) => {
      const key = (upgradeData.upgrades[id] as { power: { key: string } }).power.key;
      kb.on(`keydown-${key}`, () => this.usePower(id));
    });
    kb.on('keydown-ESC', () => this.game2.aiming && this.game2.setAiming(null));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.powers = () => this.powerButtons.filter((b) => b.bg.visible).map((b) => b.id);
      // The screen centre of a shown power button (1280 x 720 space), or null.
      camp.powerButton = (id: string) => {
        const b = this.powerButtons.find((x) => x.id === id && x.bg.visible);
        return b ? [b.bg.x + b.bg.width / 2, b.bg.y + b.bg.height / 2] : null;
      };
      camp.hoverTip = () => this.hover.shown();
    }
  }

  /** The hover for a power button: the English name when the label is Dakota, plus why it cannot be cast now. */
  private powerTip(id: UpgradeId): string | null {
    const lines: string[] = [];
    if (displayLabel(id) !== englishLabel(id)) lines.push(englishLabel(id));
    const s = this.game2.state;
    if (powerSpent(s, id)) lines.push('Spent until the next wave warning.');
    else if (!steadyEnough(s)) lines.push('The camp must be Steady or better.');
    return lines.length ? lines.join('\n') : null;
  }

  /** A key or a click on a power: cast now, or aim it at the map, or toast why not. */
  private usePower(id: UpgradeId): void {
    const s = this.game2.state;
    if (!hasUpgrade(s, id) || s.result || this.menuOpen) return;
    if (this.game2.aiming === id) {
      this.game2.setAiming(null);
      return;
    }
    if (!powerAims(id)) {
      queueOrders(s, [{ type: 'cast', power: id }]);
      return;
    }
    const error = castError(s, id, [0, 0]);
    if (error) addMessage(s, error);
    else this.game2.setAiming(id);
  }

  /** The `?` on the Wotakuye bar and the hover tooltip with its rules (DESIGN-upgrades.md `## Wotakuye help`). */
  private createUnityTip(): void {
    this.add.text(UNITY.x + UNITY.w - 10, UNITY.y + UNITY.h / 2, '?', { fontFamily: UI_FONT, fontSize: '13px', color: INK }).setOrigin(0.5);
    const box = this.add.rectangle(1280 - 8 - TIP_W, BAR.h + 4, TIP_W, 40, 0x1d1a16, 0.96).setOrigin(0).setStrokeStyle(2, 0x6b5a3a).setDepth(18).setVisible(false);
    const text = this.add
      .text(box.x + 10, box.y + 8, '', { fontFamily: 'monospace', fontSize: '12px', color: INK, lineSpacing: 3, wordWrap: { width: TIP_W - 20 } })
      .setDepth(19)
      .setVisible(false);
    this.tip = { box, text };
    const hover = this.add.rectangle(UNITY.x, UNITY.y, UNITY.w, UNITY.h, 0xffffff, 0.001).setOrigin(0).setInteractive();
    const show = (on: boolean) => {
      box.setVisible(on);
      text.setVisible(on);
      if (on) this.refreshTip();
    };
    hover.on('pointerover', () => show(true));
    hover.on('pointerout', () => show(false));
  }

  /** Redraws the tooltip text from the camp as it is now, and fits the box to it. */
  private refreshTip(): void {
    const h = wotakuyeHelp(this.game2.state);
    const lines = [`${data.labels.unity}: ${h.band}`, '', ...h.live, '', 'How it moves', ...h.rules];
    this.tip.text.setText(lines.join('\n'));
    this.tip.box.setSize(TIP_W, this.tip.text.height + 16);
  }

  /** The Menu button and its panel (DESIGN-saves.md `## HUD menu`). */
  private createMenu(): void {
    const open = makeSurface(this, 'button', MENU_BUTTON.x, MENU_BUTTON.y, MENU_BUTTON.w, MENU_BUTTON.h).setInteractive({ useHandCursor: true });
    this.add.text(open.x + MENU_BUTTON.w / 2, open.y + MENU_BUTTON.h / 2, 'Menu', { fontFamily: UI_FONT, fontSize: '14px', color: this.pal.ink }).setOrigin(0.5);
    open.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.openMenu());

    const shade = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.6).setOrigin(0).setInteractive().setDepth(20);
    const panel = makeSurface(this, 'panel', 640, 360, 440, 340, { fill: 0x1d1a16, alpha: 0.96, stroke: [0x6b5a3a, 2], origin: [0.5, 0.5] }).setDepth(21);
    const title = this.add.text(640, 222, 'Menu', { fontFamily: UI_FONT, fontSize: '28px', color: this.pal.ink }).setOrigin(0.5).setDepth(22);
    const resume = textButton(this, 640, 274, 'Resume', 22, [14, 6], () => this.closeMenu(true), 22);
    const exportBtn = textButton(this, 640, 326, 'Export this camp', 22, [14, 6], () => this.exportCamp(), 22);
    this.quitLabel = textButton(this, 640, 378, 'Save and quit to menu', 22, [14, 6], () => this.quit(), 22);
    // Music: an on/off toggle and a volume in tenths, remembered by the browser (src/audio/music.ts).
    this.musicToggle = textButton(this, 540, 434, 'Music: on', 18, [10, 4], () => {
      music.setOn(!music.on);
      this.refreshMusic();
    }, 22);
    const quieter = textButton(this, 670, 434, '-', 18, [14, 4], () => {
      music.setVolume(music.volume - 0.1);
      this.refreshMusic();
    }, 22);
    this.musicLevel = this.add.text(722, 434, '', { fontFamily: UI_FONT, fontSize: '18px', color: this.pal.ink }).setOrigin(0.5).setDepth(22);
    const louder = textButton(this, 774, 434, '+', 18, [14, 4], () => {
      music.setVolume(music.volume + 0.1);
      this.refreshMusic();
    }, 22);
    this.menuNote = this.add.text(640, 484, '', { fontFamily: UI_FONT, fontSize: '14px', color: this.pal.art ? '#8a2a1a' : '#ffb4a8', align: 'center', wordWrap: { width: 400 } }).setOrigin(0.5).setDepth(22);
    // The shade comes first: `menuOpen` reads it.
    this.menuObjects = [shade, panel, title, ...this.pair(resume), ...this.pair(exportBtn), ...this.pair(this.quitLabel), ...this.pair(this.musicToggle), ...this.pair(quieter), this.musicLevel, ...this.pair(louder), this.menuNote];
    this.setMenuVisible(false);
    this.input.keyboard!.on('keydown-ESC', () => this.menuOpen && this.closeMenu(true));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) camp.hud = this;
  }

  private pair(b: TextButton): Phaser.GameObjects.GameObject[] {
    return [b.bg, b.text];
  }

  private refreshMusic(): void {
    this.musicToggle.setLabel(music.on ? 'Music: on' : 'Music: off');
    this.musicLevel.setText(`${Math.round(music.volume * 100)}%`).setAlpha(music.on ? 1 : 0.5);
  }

  private setMenuVisible(on: boolean): void {
    for (const o of this.menuObjects) {
      (o as Phaser.GameObjects.Rectangle).setVisible(on);
      if (o.input) o.input.enabled = on;
    }
  }

  /** Pauses (the Game scene saves on that) and shows the panel. */
  openMenu(): void {
    if (this.menuOpen) return;
    queueOrders(this.game2.state, [{ type: 'pause', on: true }]);
    this.quitUnsaved = false;
    this.menuNote.setText('');
    this.refreshMusic();
    this.quitLabel.setLabel(this.game2.saveSlot === null ? 'Quit to menu (not saved)' : 'Save and quit to menu');
    this.setMenuVisible(true);
  }

  private closeMenu(resume: boolean): void {
    this.setMenuVisible(false);
    if (resume) queueOrders(this.game2.state, [{ type: 'pause', on: false }]);
  }

  private exportCamp(): void {
    const s = this.game2.state;
    downloadText(exportName(this.game2.saveSlot, Math.floor(s.tick / DAY_TICKS) + 1), serialize(s));
  }

  private quit(): void {
    if (this.game2.saveSlot !== null && !this.quitUnsaved && !this.game2.saveNow()) {
      this.quitUnsaved = true;
      this.menuNote.setText("The browser can't store this camp. Export it first, or quit anyway.");
      this.quitLabel.setLabel('Quit anyway (not saved)');
      return;
    }
    for (const key of ['Game', 'Build', 'Select']) this.scene.stop(key);
    this.scene.start('Menu'); // also stops this scene
  }

  private showEnd(s: GameState): void {
    const won = s.result === 'won';
    const day = Math.floor(s.tick / DAY_TICKS) + 1;
    this.endBox.setVisible(true);
    this.endText.setVisible(true).setText(
      `${won ? 'The camp held' : 'The camp is lost'}\n\nDay ${day}   ·   People ${s.people.length}   ·   ${data.labels.unity} ${Math.round(s.wotakuye)}`,
    );
    setButtonVisible(this.endButton, true);
  }

  /** Shows the bought powers stacked, greyed while spent or below Steady, gold while aiming. */
  private updatePowers(s: GameState): void {
    let row = 0;
    const ready = steadyEnough(s);
    for (const b of this.powerButtons) {
      const own = hasUpgrade(s, b.id);
      b.bg.setVisible(own && !this.menuOpen);
      b.label.setVisible(own && !this.menuOpen);
      b.icon?.setVisible(own && !this.menuOpen);
      if (b.bg.input) b.bg.input.enabled = own && !this.menuOpen;
      if (!own) continue;
      const y = POWER_BAR.y + row++ * (POWER_BAR.h + POWER_BAR.gap);
      b.bg.setY(y);
      b.label.setY(y + POWER_BAR.h / 2);
      b.icon?.setY(y + POWER_BAR.h / 2);
      const aiming = this.game2.aiming === b.id;
      const off = powerSpent(s, b.id) || !ready;
      setLook(b.bg, aiming ? 'active' : off ? 'disabled' : 'normal');
      const alpha = off ? 0.4 : 1;
      b.bg.setAlpha(alpha);
      b.label.setAlpha(alpha);
      b.icon?.setAlpha(alpha);
    }
    const aimed = this.game2.aiming;
    this.aimNote.setVisible(!!aimed);
    if (aimed) this.aimNote.setText(`${displayLabel(aimed as UpgradeId)}: left-click the map to cast, right-click or Esc to cancel`);
    this.hover.update();
  }

  /** Lays the bar's parts out left to right: a 16 px icon (when it has one), then its text, then a gap. */
  private drawBar(parts: BarPart[]): void {
    let x = 12;
    parts.forEach((part, i) => {
      let slot = this.barSlots[i];
      if (!slot) {
        const icon = spriteFor(this, 'icon_food', 0, BAR.h / 2).setDisplaySize(ICON, ICON);
        slot = {
          icon,
          name: '',
          text: this.add.text(0, BAR.h / 2, '', { fontFamily: UI_FONT, fontSize: '13px', color: this.pal.ink }).setOrigin(0, 0.5),
        };
        this.barSlots[i] = slot;
        const mine = slot;
        this.hover.attach(icon, () => mine.name || null);
      }
      slot.name = part.name ?? '';
      slot.icon.setVisible(!!part.icon);
      if (slot.icon.input) slot.icon.input.enabled = !!part.icon;
      if (part.icon) {
        applyArt(slot.icon, part.icon).setDisplaySize(ICON, ICON).setPosition(x + ICON / 2, BAR.h / 2);
        x += ICON + 4;
      }
      slot.text.setText(part.text).setX(x);
      x += slot.text.width + 18;
    });
    for (let i = parts.length; i < this.barSlots.length; i++) {
      this.barSlots[i].icon.setVisible(false);
      this.barSlots[i].text.setText('');
    }
    this.barPlain = parts.map((p) => p.plain ?? p.text).join('   ');
  }

  update(): void {
    const s = this.game2.state;
    const parts: BarPart[] = RES.map((r) => {
      const n = `${Math.floor(s.store[r])} / ${storeCap(s, r)}`;
      return { icon: `icon_${r}`, text: n, plain: `${data.resources[r].label} ${n}`, name: data.resources[r].label };
    });
    parts.push({ icon: 'icon_gift', text: `Gift ${Math.floor(s.gift)}`, name: 'Gift value' });
    if (s.horses > 0) parts.push({ icon: 'icon_horses', text: `${s.horses} / ${horseCap(s)}`, plain: `Horses ${s.horses} / ${horseCap(s)}`, name: 'Horses' });
    parts.push({ icon: 'icon_people', text: `${s.people.length}`, plain: `People ${s.people.length}`, name: 'People' }, { text: `${seasonLabel(seasonOf(s))}, day ${dayInSeason(s)}${yearOf(s) > 1 ? `  Year ${yearOf(s)}` : ''}` });
    const tint = seasonData.tint[seasonOf(s)];
    this.tint.setFillStyle(tint ? tint[0] : 0xffffff, tint ? tint[1] : 0);
    this.drawBar(parts);
    if (this.tip.box.visible) this.refreshTip();

    const w = s.wotakuye;
    const fillColor = w < 20 ? 0xc0392b : w < 40 ? 0xd9a441 : 0x6aa84f;
    this.unityFill.setSize((UNITY.w * w) / 100, UNITY.h).setFillStyle(fillColor, 1);
    if (this.unityArt) {
      this.unityFill.setVisible(false);
      this.unityArt.setVisible(w > 0).setDisplaySize(Math.max(1, (UNITY.w * w) / 100), UNITY.h).setTint(fillColor);
    }
    this.unityText.setText(`${data.labels.unity} ${Math.round(w)} · ${unityBand(s).name}`);

    const banner = waveBanner(s);
    this.bannerBox.setVisible(!!banner);
    this.bannerText.setVisible(!!banner);
    if (banner) this.bannerText.setText(banner.seconds === null ? banner.text : `${banner.text} — ${banner.seconds} s`);
    for (const { bg, b } of this.speedButtons) {
      const active = b.pause ? s.paused : !s.paused && b.speed === s.speed;
      setLook(bg, active ? 'active' : 'normal');
    }
    this.updatePowers(s);
    this.minimap.update();
    if (this.menuOpen && !s.paused) queueOrders(s, [{ type: 'pause', on: true }]);
    if (s.result) this.showEnd(s);
  }
}
