// The HUD (DESIGN-slice.md `## UI`): resource bar and Wotakuye bar, in screen space above the Game scene.
// Also the pause/speed buttons and the wave banner; toasts and the selection panel live in Select.ts.
import Phaser from 'phaser';
import data from '../data/resources.json';
import { unityBand } from '../sim/economy';
import { wotakuyeHelp } from '../sim/help';
import seasonData from '../data/seasons.json';
import { downloadText, exportName } from '../save/files';
import { queueOrders } from '../sim/orders';
import { serialize } from '../sim/save';
import {
  hasUpgrade, missingFor, missingRequirement, requiresOf, upgradeCost, upgradeLabel, UPGRADE_IDS, type UpgradeId,
} from '../sim/upgrades';
import { dayInSeason, seasonLabel, seasonOf, yearOf } from '../sim/seasons';
import { DAY_TICKS, storeCap, type GameState, type Res } from '../sim/state';
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
const UPGRADES_BUTTON = { x: 1176, y: 38, w: 96, h: 26 };
// Two columns of cards: tier 1 on the left, the tier 2 upgrades on the right (DESIGN-upgrades-2.md `## UI`).
const UPGRADES_PANEL = { x: 160, y: 100, w: 960, h: 512 };
const CARD = { w: 460, h: 100, gap: 8 };
/** One line on what each upgrade does (DESIGN-upgrades.md `## Upgrades`). */
const UPGRADE_EFFECT: Record<UpgradeId, string> = {
  dogs: 'Hunting succeeds 15% more often, and hunters aim a little better.',
  bows: "Hunters' bows reach 5 tiles and hit for 15.",
  healers: "Lets you build a healers' lodge: they heal the wounded and ease winter cold.",
  scouts: "Lets you build a scouts' lodge: staffed, it warns of a wave a minute ahead and counts the wolves.",
  warriors: "Lets you build lancers' and archers' lodges: assigned people fight as that class.",
  builders: 'Lets you set traps and fire pits.',
  tools: 'All building goes 1.5 times faster.',
};
const TIP_W = 440;
const INK = '#f3e9d2';
const RES: Res[] = ['food', 'wood', 'hides', 'pemmican'];

export class HudScene extends Phaser.Scene {
  private game2!: GameScene;
  private resourceText!: Phaser.GameObjects.Text;
  private tint!: Phaser.GameObjects.Rectangle;
  private unityFill!: Phaser.GameObjects.Rectangle;
  private unityText!: Phaser.GameObjects.Text;
  private bannerBox!: Phaser.GameObjects.Rectangle;
  private bannerText!: Phaser.GameObjects.Text;
  private endBox!: Phaser.GameObjects.Rectangle;
  private endText!: Phaser.GameObjects.Text;
  private endButton!: Phaser.GameObjects.Text;
  private menuObjects: Phaser.GameObjects.GameObject[] = [];
  private upgradesObjects: Phaser.GameObjects.GameObject[] = [];
  private tip!: { box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text };
  private upgradesOpen = false;
  private cards: Record<string, { cost: Phaser.GameObjects.Text; buy: Phaser.GameObjects.Text }> = {};
  private menuNote!: Phaser.GameObjects.Text;
  private quitLabel!: Phaser.GameObjects.Text;
  /** After a failed save, the quit button's next click leaves without saving. */
  private quitUnsaved = false;
  private speedButtons: { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; b: (typeof SPEED_BUTTONS)[number] }[] = [];

  constructor() {
    super('Hud');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
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
    this.resourceText = this.add.text(12, 8, '', { fontFamily: 'sans-serif', fontSize: '13px', color: INK });
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
      camp.hudText = () => this.resourceText.text;
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
    this.createUpgrades();
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

  /** True when a screen point is on the open Upgrades panel or its button (the map ignores the click). */
  upgradesOverUi(x: number, y: number): boolean {
    const r = this.upgradesOpen ? UPGRADES_PANEL : UPGRADES_BUTTON;
    return (
      (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ||
      (x >= UPGRADES_BUTTON.x && x <= UPGRADES_BUTTON.x + UPGRADES_BUTTON.w && y >= UPGRADES_BUTTON.y && y <= UPGRADES_BUTTON.y + UPGRADES_BUTTON.h)
    );
  }

  /** The Upgrades button (key U) and its panel of cards (DESIGN-upgrades.md `## UI`). It does not pause. */
  private createUpgrades(): void {
    this.upgradesObjects = [];
    this.upgradesOpen = false;
    this.cards = {};
    const font = (size: number, color = INK) => ({ fontFamily: 'sans-serif', fontSize: `${size}px`, color });
    const open = this.add.rectangle(UPGRADES_BUTTON.x, UPGRADES_BUTTON.y, UPGRADES_BUTTON.w, UPGRADES_BUTTON.h, 0x1d1a16, 0.85).setOrigin(0).setInteractive({ useHandCursor: true });
    this.add.text(open.x + open.width / 2, open.y + open.height / 2, 'Upgrades (U)', font(13)).setOrigin(0.5);
    open.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.setUpgradesOpen(!this.upgradesOpen));

    const P = UPGRADES_PANEL;
    const objs = this.upgradesObjects;
    objs.push(this.add.rectangle(P.x, P.y, P.w, P.h, 0x1d1a16, 0.96).setOrigin(0).setStrokeStyle(2, 0x6b5a3a).setDepth(15).setInteractive());
    objs.push(this.add.text(P.x + 16, P.y + 10, `Upgrades  ·  Gift value earned each day from ${data.labels.unity}`, font(15)).setDepth(16));
    const close = this.add.text(P.x + P.w - 14, P.y + 8, 'x', font(18)).setOrigin(1, 0).setDepth(16).setInteractive({ useHandCursor: true });
    close.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && this.setUpgradesOpen(false));
    objs.push(close);
    const tier1 = UPGRADE_IDS.filter((id) => !requiresOf(id));
    const tier2 = UPGRADE_IDS.filter((id) => requiresOf(id));
    [tier1, tier2].forEach((ids, col) => {
      const x = P.x + 14 + col * (CARD.w + 14);
      objs.push(this.add.text(x, P.y + 40, col === 0 ? 'Tier 1' : 'Tier 2: needs a tier 1 upgrade', font(13, '#cdbf9c')).setDepth(16));
      ids.forEach((id, row) => {
        const y = P.y + 64 + row * (CARD.h + CARD.gap);
        objs.push(this.add.rectangle(x, y, CARD.w, CARD.h, 0x3a3328, 1).setOrigin(0).setDepth(16));
        objs.push(this.add.text(x + 10, y + 8, upgradeLabel(id), font(15)).setDepth(17));
        objs.push(this.add.text(x + 10, y + 34, UPGRADE_EFFECT[id], font(12, '#cdbf9c')).setWordWrapWidth(CARD.w - 190).setDepth(17));
        const costText = this.add.text(x + CARD.w - 170, y + 8, '', font(12)).setWordWrapWidth(160).setDepth(17);
        const buy = this.add
          .text(x + CARD.w - 170, y + 62, ' Buy ', { ...font(15, '#1d1a16'), backgroundColor: INK })
          .setPadding(10, 4).setDepth(17).setInteractive({ useHandCursor: true });
        buy.on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (p.leftButtonDown() && this.canBuy(id)) queueOrders(this.game2.state, [{ type: 'buy', upgrade: id }]);
        });
        this.cards[id] = { cost: costText, buy };
        objs.push(costText, buy);
      });
    });
    this.setUpgradesOpen(false);
    const kb = this.input.keyboard!;
    kb.on('keydown-U', () => this.setUpgradesOpen(!this.upgradesOpen));
    kb.on('keydown-ESC', () => this.upgradesOpen && this.setUpgradesOpen(false));
    const camp = (window as unknown as { camp?: Record<string, unknown> }).camp;
    if (camp) {
      camp.upgradesOpen = () => this.upgradesOpen;
      camp.upgradeCard = (id: string) => this.cards[id]?.cost.text ?? null;
    }
  }

  private canBuy(id: UpgradeId): boolean {
    const s = this.game2.state;
    return !hasUpgrade(s, id) && !missingRequirement(s, id) && missingFor(s, id).length === 0;
  }

  setUpgradesOpen(on: boolean): void {
    this.upgradesOpen = on;
    for (const o of this.upgradesObjects) {
      (o as Phaser.GameObjects.Rectangle).setVisible(on);
      if (o.input) o.input.enabled = on;
    }
    if (on) this.refreshUpgrades();
  }

  /** The cost line and Buy state of each card: Bought, buyable, or what is still missing. */
  private refreshUpgrades(): void {
    const s = this.game2.state;
    for (const id of UPGRADE_IDS) {
      const { cost, buy } = this.cards[id];
      const owned = hasUpgrade(s, id);
      const missing = missingFor(s, id);
      const needs = missingRequirement(s, id);
      const price = Object.entries(upgradeCost(id)).map(([r, n]) => `${n} ${r}`).join(', ');
      const lines = [`Cost: ${price}`];
      if (needs) lines.push(`Needs ${upgradeLabel(needs)}`);
      if (missing.length) lines.push(`Missing: ${missing.join(', ')}`);
      cost.setText(owned ? 'Bought' : lines.join('\n'));
      buy.setText(owned ? ' Bought ' : ' Buy ').setAlpha(owned || needs || missing.length ? 0.4 : 1);
    }
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

  update(): void {
    const s = this.game2.state;
    const parts = RES.map((r) => `${data.resources[r].label} ${Math.floor(s.store[r])} / ${storeCap(s, r)}`);
    parts.push(`Gift ${Math.floor(s.gift)}`);
    const adults = s.people.filter((p) => p.age === 'adult').length;
    parts.push(`People ${adults} / ${s.people.length}`, `${seasonLabel(seasonOf(s))}, day ${dayInSeason(s)}${yearOf(s) > 1 ? `  Year ${yearOf(s)}` : ''}`);
    const tint = seasonData.tint[seasonOf(s)];
    this.tint.setFillStyle(tint ? tint[0] : 0xffffff, tint ? tint[1] : 0);
    this.resourceText.setText(parts.join('   '));
    if (this.upgradesOpen) this.refreshUpgrades();
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
    if (this.menuOpen && !s.paused) queueOrders(s, [{ type: 'pause', on: true }]);
    if (s.result) this.showEnd(s);
  }
}
