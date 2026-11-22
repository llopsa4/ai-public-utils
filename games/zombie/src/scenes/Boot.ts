import Phaser from 'phaser';
import { ensureTextures } from '../render/placeholders';

/** Makes the grey placeholder textures (final art will be queued here later), then opens the menu. */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    ensureTextures(this);
    this.scene.start('Menu');
  }
}
