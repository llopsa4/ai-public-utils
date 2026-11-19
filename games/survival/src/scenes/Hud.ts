// The HUD (DESIGN-slice.md `## UI`): resource bar and Wotakuye bar, in screen space above the Game scene.
// Pause/speed, the wave banner, toasts and the selection panel arrive with later tasks.
import Phaser from 'phaser';
import data from '../data/resources.json';
import { unityBand } from '../sim/economy';
import { DAY_TICKS, storeCap, type GameState, type Res } from '../sim/state';
import { waveBanner } from '../sim/waves';
import type { GameScene } from './Game';

const BAR = { x: 0, y: 0, w: 1280, h: 32 };
const BANNER = { x: 400, y: 44, w: 480, h: 40 };
const UNITY = { x: 760, y: 6, w: 240, h: 20 };
const INK = '#f3e9d2';
const RES: Res[] = ['food', 'wood', 'hides'];

export class HudScene extends Phaser.Scene {
  private game2!: GameScene;
  private resourceText!: Phaser.GameObjects.Text;
  private unityFill!: Phaser.GameObjects.Rectangle;
  private unityText!: Phaser.GameObjects.Text;
  private bannerBox!: Phaser.GameObjects.Rectangle;
  private bannerText!: Phaser.GameObjects.Text;
  private endBox!: Phaser.GameObjects.Rectangle;
  private endText!: Phaser.GameObjects.Text;
  private endButton!: Phaser.GameObjects.Text;

  constructor() {
    super('Hud');
  }

  init(data: { game: GameScene }): void {
    this.game2 = data.game;
  }

  create(): void {
    this.add.rectangle(BAR.x, BAR.y, BAR.w, BAR.h, 0x1d1a16, 0.85).setOrigin(0);
    this.resourceText = this.add.text(12, 8, '', { fontFamily: 'sans-serif', fontSize: '14px', color: INK });
    this.add.rectangle(UNITY.x, UNITY.y, UNITY.w, UNITY.h, 0x3a3328, 1).setOrigin(0);
    this.unityFill = this.add.rectangle(UNITY.x, UNITY.y, 0, UNITY.h, 0x6aa84f, 1).setOrigin(0);
    this.unityText = this.add
      .text(UNITY.x + UNITY.w / 2, UNITY.y + UNITY.h / 2, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffffff' })
      .setOrigin(0.5);
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
    // A fresh page is the simplest restart until the menu scene (C7) can start a run.
    this.endButton.on('pointerdown', () => location.reload());
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
    const adults = s.people.filter((p) => p.age === 'adult').length;
    parts.push(`People ${adults} / ${s.people.length}`, `Day ${Math.floor(s.tick / DAY_TICKS) + 1}`);
    this.resourceText.setText(parts.join('     '));

    const w = s.wotakuye;
    this.unityFill.setSize((UNITY.w * w) / 100, UNITY.h).setFillStyle(w < 20 ? 0xc0392b : w < 40 ? 0xd9a441 : 0x6aa84f, 1);
    this.unityText.setText(`${data.labels.unity} ${Math.round(w)} · ${unityBand(s).name}`);

    const banner = waveBanner(s);
    this.bannerBox.setVisible(!!banner);
    this.bannerText.setVisible(!!banner);
    if (banner) this.bannerText.setText(banner.seconds === null ? banner.text : `${banner.text} — ${banner.seconds} s`);
    if (s.result) this.showEnd(s);
  }
}
