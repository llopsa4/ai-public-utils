import Phaser from 'phaser';
import eliteUrl from '../fonts/SpecialElite.ttf?url';
import { crispAtlases, loadAtlases } from '../render/atlas';
import { ensureTextures } from '../render/placeholders';

/** Loads the figure atlases and the typewriter font and makes the grey placeholder textures, then opens the menu. */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    loadAtlases(this);
  }

  create(): void {
    ensureTextures(this);
    crispAtlases(this);
    // The dialogue font (DESIGN §6). If it fails to load the box falls back to a monospace font.
    new FontFace('Special Elite', `url(${eliteUrl})`)
      .load()
      .then((f) => document.fonts.add(f))
      .catch(() => undefined)
      .finally(() => this.scene.start('Menu'));
  }
}
