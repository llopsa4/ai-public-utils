// The HUD (DESIGN-slice.md `## UI`): resource bar and Wotakuye bar, in screen space above the Game scene.
// Also the pause/speed buttons and the wave banner; toasts, the selection panel and a building's upgrades live in Select.ts.
import Phaser from 'phaser';
import data from '../data/resources.json';
import { unityBand } from '../sim/economy';
import { wotakuyeHelp } from '../sim/help';
import { displayLabel, englishLabel } from '../sim/labels';
import { castError, hasUpgrade, POWER_IDS, powerAims, powerSpent, steadyEnough, type UpgradeId } from '../sim/upgrades';
import upgradeData from '../data/upgrades.json';
import { addMessage } from '../sim/state';
import { createHover, type Hover } from './hover';
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
  private barSlots: { icon: Phaser.GameObjects.Image; name: string; text: Phaser.GameObjects.Text }[] = [];
  /** The bar's texts joined, as the old single line read (the smoke test reads it). */
  private barPlain = '';
  private tint!: Phaser.GameObjects.Rectangle;
  private unityFill!: Phaser.GameObjects.Rectangle;
  private unityText!: Phaser.GameObjects.Text;
  private bannerBox!: Phaser.GameObjects.Rectangle;
  private bannerText!: Phaser.GameObjects.Text;
  private endBox!: Phaser.GameObjects.Rectangle;
  private endText!: Phaser.GameObjects.Text;
  private endButton!: Phaser.GameObjects.Text;
  private menuObjects: Phaser.GameObjects.GameObject[] = [];
  private tip!: { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text };
  private menuNote!: Phaser.GameObjects.Text;
  private quitLabel!: Phaser.GameObjects.Text;
  /** After a failed save, the quit button's next click leaves without saving. */
  private quitUnsaved = false;
  private hover!: Hover;
  private powerButtons: { id: UpgradeId; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
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

  /** True while the menu panel is open: the map and the other panels ignore clicks. */
  get menuOpen(): boolean {
    return this.menuObjects.length > 0 && this.menuObjects[0].active && (this.menuObjects[0] as Phaser.GameObjects.Rectangle).visible;
  }

  create(): void {
    this.menuObjects = [];
    this.quitUnsaved = false;
    // The season's tint over the map (presentation only; spring has none), under every bar and panel.
    this.tint = this.add.rectangle(0, 0, 1280, 720, 0xffffff, 0).setOrigin(0).setDepth(-1);
    this.add.rectangle(BAR.x, BAR.y, BAR.w, BAR.h, 0x1d1a16, 0.85).setOrigin(0);
    this.barSlots = [];
    this.barPlain = '';
    this.add.rectangle(UNITY.x, UNITY.y, UNITY.w, UNITY.h, 0x3a3328, 1).setOrigin(0);
    this.unityFill = this.add.rectangle(UNITY.x, UNITY.y, 0, UNITY.h, 0x6aa84f, 1).setOrigin(0);
    this.unityText = this.add
      .text(UNITY.x + UNITY.w / 2, UNITY.y + UNITY.h / 2, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffffff' })
      .setOrigin(0.5);
    this.createUnityTip();
    this.bannerBox = this.add.rectangle(BANNER.x, BANNER.y, BANNER.w, BANNER.h, 0x6b1f1a, 0.9).setOrigin(0).setVisible(false);
    this.bannerText = this.add
      .text(BANNER.x + BANNER.w / 2, BANNER.y + BANNER.h / 2, '', { fontFamily: 'sans-serif', fontSize: '16px', color: INK })
      .setOrigin(0.5)
      .setVisible(false);
    this.endBox = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7).setOrigin(0).setVisible(false).setDepth(10).setInteractive();
    this.endText = this.add
      .text(640, 300, '', { fontFamily: 'sans-serif', fontSize: '28px', color: INK, align: 'center' })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(11);
    this.endButton = this.add
      .text(640, 420, ' Play again ', { fontFamily: 'sans-serif', fontSize: '22px', color: '#1d1a16', backgroundColor: INK })
      .setOrigin(0.5)
      .setPadding(10)
      .setVisible(false)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    this.endButton.on('pointerdown', () => {
      for (const key of ['Game', 'Build', 'Select']) this.scene.stop(key);
      this.scene.start('Menu'); // also stops this scene
    });

    // With `?debug`, the smoke test reads the banner as drawn.
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.banner = () => (this.bannerBox.visible ? this.bannerText.text : null);
      camp.hudText = () => this.barPlain;
      // The bar's laid-out parts (icon key or null, text, x of the text's right end), for the smoke test.
      camp.hudBar = () => this.barSlots.filter((b) => b.text.text).map((b) => ({ icon: b.icon.visible ? b.icon.texture.key : null, text: b.text.text, right: b.text.x + b.text.width }));
      camp.wotakuyeTip = () => (this.tip.box.visible ? this.tip.text.text : null);
    }

    // Pause / 1x / 2x / 4x: the buttons only send orders, like the keys in Select.ts.
    this.speedButtons = SPEED_BUTTONS.map((b, i) => {
      const bg = this.add.rectangle(SPEED.x + i * 64, SPEED.y, 60, SPEED.h, 0x3a3328, 1).setOrigin(0).setInteractive({ useHandCursor: true });
      const label = this.add.text(bg.x + 30, bg.y + SPEED.h / 2, b.label, { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0.5);
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && queueOrders(this.game2.state, [...(b.speed ? [{ type: 'speed', value: b.speed } as const] : []), { type: 'pause', on: b.pause }]));
      return { bg, label, b };
    });
    this.createMenu();
    this.createPowers();
  }

  /** The power bar: F1-F4 or a click casts at once, or starts aiming (bison, storm); Esc or right-click cancels. */
  private createPowers(): void {
    this.hover = createHover(this);
    this.powerButtons = POWER_IDS.map((id, i) => {
      const bg = this.add.rectangle(POWER_BAR.x, POWER_BAR.y + i * (POWER_BAR.h + POWER_BAR.gap), POWER_BAR.w, POWER_BAR.h, 0x3a3328, 1).setOrigin(0);
      const key = (upgradeData.upgrades[id] as { power: { key: string } }).power.key;
      const label = this.add.text(bg.x + 8, bg.y + POWER_BAR.h / 2, `${key}  ${displayLabel(id)}`, { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0, 0.5);
      bg.setVisible(false);
      label.setVisible(false);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.usePower(id));
      this.hover.attach(bg, () => this.powerTip(id));
      return { id, bg, label };
    });
    this.aimNote = this.add
      .text(640, 592, '', { fontFamily: 'sans-serif', fontSize: '14px', color: INK, backgroundColor: '#1d1a16' })
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
    this.add.text(UNITY.x + UNITY.w - 10, UNITY.y + UNITY.h / 2, '?', { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0.5);
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
    const open = this.add.rectangle(MENU_BUTTON.x, MENU_BUTTON.y, MENU_BUTTON.w, MENU_BUTTON.h, 0x3a3328, 1).setOrigin(0).setInteractive({ useHandCursor: true });
    this.add.text(open.x + MENU_BUTTON.w / 2, open.y + MENU_BUTTON.h / 2, 'Menu', { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0.5);
    open.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.openMenu());

    const shade = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.6).setOrigin(0).setInteractive().setDepth(20);
    const panel = this.add.rectangle(640, 360, 440, 300, 0x1d1a16, 0.96).setStrokeStyle(2, 0x6b5a3a).setDepth(21);
    const title = this.add.text(640, 250, 'Menu', { fontFamily: 'sans-serif', fontSize: '26px', color: INK }).setOrigin(0.5).setDepth(22);
    const button = (y: number, label: string, onClick: () => void): Phaser.GameObjects.Text => {
      const b = this.add
        .text(640, y, label, { fontFamily: 'sans-serif', fontSize: '20px', color: '#1d1a16', backgroundColor: INK })
        .setOrigin(0.5).setPadding(12, 7).setDepth(22).setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setBackgroundColor('#ffffff'));
      b.on('pointerout', () => b.setBackgroundColor(INK));
      b.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
      return b;
    };
    const resume = button(310, 'Resume', () => this.closeMenu(true));
    const exportBtn = button(365, 'Export this camp', () => this.exportCamp());
    this.quitLabel = button(420, 'Save and quit to menu', () => this.quit());
    this.menuNote = this.add.text(640, 468, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffb4a8', align: 'center', wordWrap: { width: 400 } }).setOrigin(0.5).setDepth(22);
    // The shade comes first: `menuOpen` reads it.
    this.menuObjects = [shade, panel, title, resume, exportBtn, this.quitLabel, this.menuNote];
    this.setMenuVisible(false);
    this.input.keyboard!.on('keydown-ESC', () => this.menuOpen && this.closeMenu(true));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) camp.hud = this;
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
    this.quitLabel.setText(this.game2.saveSlot === null ? 'Quit to menu (not saved)' : 'Save and quit to menu');
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
      this.quitLabel.setText('Quit anyway (not saved)');
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
    this.endButton.setVisible(true);
  }

  /** Shows the bought powers stacked, greyed while spent or below Steady, gold while aiming. */
  private updatePowers(s: GameState): void {
    let row = 0;
    const ready = steadyEnough(s);
    for (const b of this.powerButtons) {
      const own = hasUpgrade(s, b.id);
      b.bg.setVisible(own && !this.menuOpen);
      b.label.setVisible(own && !this.menuOpen);
      if (b.bg.input) b.bg.input.enabled = own && !this.menuOpen;
      if (!own) continue;
      const y = POWER_BAR.y + row++ * (POWER_BAR.h + POWER_BAR.gap);
      b.bg.setY(y);
      b.label.setY(y + POWER_BAR.h / 2);
      const aiming = this.game2.aiming === b.id;
      b.bg.setFillStyle(aiming ? 0x8a6d2f : 0x3a3328, 1);
      const alpha = powerSpent(s, b.id) || !ready ? 0.4 : 1;
      b.bg.setAlpha(alpha);
      b.label.setAlpha(alpha);
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
        const icon = this.add.image(0, BAR.h / 2, 'icon_food').setDisplaySize(ICON, ICON);
        slot = {
          icon,
          name: '',
          text: this.add.text(0, BAR.h / 2, '', { fontFamily: 'sans-serif', fontSize: '13px', color: INK }).setOrigin(0, 0.5),
        };
        this.barSlots[i] = slot;
        const mine = slot;
        this.hover.attach(icon, () => mine.name || null);
      }
      slot.name = part.name ?? '';
      slot.icon.setVisible(!!part.icon);
      if (slot.icon.input) slot.icon.input.enabled = !!part.icon;
      if (part.icon) {
        slot.icon.setTexture(part.icon).setDisplaySize(ICON, ICON).setPosition(x + ICON / 2, BAR.h / 2);
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
    const adults = s.people.filter((p) => p.age === 'adult').length;
    parts.push({ text: `People ${adults} / ${s.people.length}` }, { text: `${seasonLabel(seasonOf(s))}, day ${dayInSeason(s)}${yearOf(s) > 1 ? `  Year ${yearOf(s)}` : ''}` });
    const tint = seasonData.tint[seasonOf(s)];
    this.tint.setFillStyle(tint ? tint[0] : 0xffffff, tint ? tint[1] : 0);
    this.drawBar(parts);
    if (this.tip.box.visible) this.refreshTip();

    const w = s.wotakuye;
    this.unityFill.setSize((UNITY.w * w) / 100, UNITY.h).setFillStyle(w < 20 ? 0xc0392b : w < 40 ? 0xd9a441 : 0x6aa84f, 1);
    this.unityText.setText(`${data.labels.unity} ${Math.round(w)} · ${unityBand(s).name}`);

    const banner = waveBanner(s);
    this.bannerBox.setVisible(!!banner);
    this.bannerText.setVisible(!!banner);
    if (banner) this.bannerText.setText(banner.seconds === null ? banner.text : `${banner.text} — ${banner.seconds} s`);
    for (const { bg, b } of this.speedButtons) {
      const active = b.pause ? s.paused : !s.paused && b.speed === s.speed;
      bg.setFillStyle(active ? 0x8a6d2f : 0x3a3328, 1);
    }
    this.updatePowers(s);
    if (this.menuOpen && !s.paused) queueOrders(s, [{ type: 'pause', on: true }]);
    if (s.result) this.showEnd(s);
  }
}
