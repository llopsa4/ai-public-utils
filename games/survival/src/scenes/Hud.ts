// The HUD (DESIGN-slice.md `## UI`): resource bar and Wotakuye bar, in screen space above the Game scene.
// Pause/speed, the wave banner, toasts and the selection panel arrive with later tasks.
import Phaser from 'phaser';
import data from '../data/resources.json';
import { unityBand } from '../sim/economy';
import { DAY_TICKS, storeCap, type Res } from '../sim/state';
import type { GameScene } from './Game';

const BAR = { x: 0, y: 0, w: 1280, h: 32 };
const UNITY = { x: 760, y: 6, w: 240, h: 20 };
const INK = '#f3e9d2';
const RES: Res[] = ['food', 'wood', 'hides'];

export class HudScene extends Phaser.Scene {
  private game2!: GameScene;
  private resourceText!: Phaser.GameObjects.Text;
  private unityFill!: Phaser.GameObjects.Rectangle;
  private unityText!: Phaser.GameObjects.Text;

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
  }
}
