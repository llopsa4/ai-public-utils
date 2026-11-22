import Phaser from 'phaser';
import { loadAtlases } from '../render/atlases';
import { installCursors } from '../render/cursors';
import { ensureTextures } from '../render/placeholders';
import { loadTitle } from '../render/title';

// Loads the art atlases (none exist until Codex's first delivery is installed), then draws a code placeholder for every
// key with no final art. `?standins` on the dev server loads grey stand-ins instead (art/PIPELINE.md).
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    loadAtlases(this);
    loadTitle(this);
  }

  create(): void {
    ensureTextures(this);
    installCursors(this);
    this.scene.start('Menu');
  }
}
