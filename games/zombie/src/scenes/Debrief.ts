import Phaser from 'phaser';
import { type Campaign, ENDING, type Loot, finished } from '../sim/campaign';

const FONT = 'Georgia, "Times New Roman", serif';

/** After an extraction: the mission's loot and the new totals, then back to the camp. */
export class DebriefScene extends Phaser.Scene {
  constructor() {
    super('Debrief');
  }

  create(): void {
    const { width, height } = this.scale;
    const c = this.registry.get('campaign') as Campaign | null | undefined;
    const d = this.registry.get('debrief') as { title: string; loot: Loot } | undefined;
    const loot = d?.loot ?? { food: 0, scrap: 0 };

    this.add.text(width / 2, height * 0.2, 'MISSION COMPLETE', { fontFamily: FONT, fontSize: '54px', color: '#d6d4cc' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.2 + 52, d?.title ?? '', { fontFamily: FONT, fontSize: '22px', color: '#8a8a82' }).setOrigin(0.5);
    const lines = [`Loot:  food +${loot.food}   scrap +${loot.scrap}`, `Camp now:  food ${c?.food ?? 0}   scrap ${c?.scrap ?? 0}`];
    if (c && finished(c)) lines.push('', ENDING);
    this.add.text(width / 2, height * 0.46, lines.join('\n'), { fontFamily: FONT, fontSize: '30px', color: '#e8e6de', align: 'center', lineSpacing: 10 }).setOrigin(0.5, 0);

    const go = (): void => void this.scene.start('Camp');
    const btn = this.add.text(width / 2, height * 0.8, 'Back to camp', { fontFamily: FONT, fontSize: '32px', color: '#e8e6de', backgroundColor: '#2a2d29', padding: { x: 24, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffffff').setBackgroundColor('#3a3e39'));
    btn.on('pointerout', () => btn.setColor('#e8e6de').setBackgroundColor('#2a2d29'));
    btn.on('pointerup', go);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.add.text(width / 2, height * 0.88, 'Enter: back to camp', { fontFamily: FONT, fontSize: '16px', color: '#6f6f68' }).setOrigin(0.5);
  }
}
