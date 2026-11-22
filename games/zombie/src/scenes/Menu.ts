import Phaser from 'phaser';
import { type Campaign, browserStorage, loadCampaign, newCampaign, saveCampaign } from '../sim/campaign';

const FONT = 'Georgia, "Times New Roman", serif';

/** Title screen: Continue (when a save exists), New Game, and the Mission 1 test run. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  private button(x: number, y: number, label: string, size: number, color: string, bg: string, onClick: () => void): void {
    const t = this.add.text(x, y, label, { fontFamily: FONT, fontSize: `${size}px`, color, backgroundColor: bg, padding: { x: 24, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setColor('#ffffff').setBackgroundColor('#3a3e39'));
    t.on('pointerout', () => t.setColor(color).setBackgroundColor(bg));
    t.on('pointerup', onClick);
  }

  private play(c: Campaign | null): void {
    this.registry.set('campaign', c);
    this.scene.start(c ? 'Camp' : 'Mission');
  }

  create(): void {
    const { width, height } = this.scale;
    const save = loadCampaign(browserStorage());
    this.add.text(width / 2, height * 0.26, 'DEAD WOODS', { fontFamily: FONT, fontSize: '72px', color: '#d6d4cc' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.26 + 58, 'early build - grey placeholders', { fontFamily: FONT, fontSize: '18px', color: '#8a8a82' }).setOrigin(0.5);

    let y = height * 0.5;
    if (save) {
      this.button(width / 2, y, 'Continue', 36, '#e8e6de', '#2a2d29', () => this.play(save));
      y += 68;
    }
    const newGame = (): void => {
      const c = newCampaign();
      saveCampaign(browserStorage(), c); // a new game replaces the old save at once
      this.play(c);
    };
    this.button(width / 2, y, 'New Game', save ? 26 : 36, save ? '#a8a69e' : '#e8e6de', save ? '#242723' : '#2a2d29', newGame);
    this.button(width / 2, y + 66, 'Mission 1 (test)', 22, '#8a8a82', '#202320', () => this.play(null));
    this.input.keyboard?.once('keydown-ENTER', () => (save ? this.play(save) : newGame()));

    this.add.text(width / 2, height * 0.9, 'Mature content: visible gore.  Desktop: mouse + keyboard.', { fontFamily: FONT, fontSize: '16px', color: '#6f6f68' }).setOrigin(0.5);
  }
}
