import Phaser from 'phaser';
import eliteUrl from '../fonts/SpecialElite.ttf?url';
import { crispAtlases, loadAtlases } from '../render/atlas';
import { ensureTextures } from '../render/placeholders';
import { CARD_SCENE, changeScene } from './Card';

const BAR_W = 400;
const BAR_H = 20;

/** Loads the figure atlases and the typewriter font (behind a loading bar, DESIGN §22) and makes the grey placeholder textures, then fades to the menu. */
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const x = Math.round((width - BAR_W) / 2);
    const y = Math.round(height / 2 - BAR_H / 2);
    this.add.rectangle(x, y, BAR_W, BAR_H).setOrigin(0).setStrokeStyle(2, 0x6b6a62);
    const fill = this.add.rectangle(x, y, 0, BAR_H, 0xa8a69e).setOrigin(0);
    this.load.on('progress', (p: number) => fill.setSize(BAR_W * p, BAR_H));
    loadAtlases(this);
  }

  create(): void {
    this.scene.launch(CARD_SCENE); // the scene-change fade and location cards (Card.ts) run from here on
    ensureTextures(this);
    crispAtlases(this);
    // The dialogue font (DESIGN §6). If it fails to load the box falls back to a monospace font.
    new FontFace('Special Elite', `url(${eliteUrl})`)
      .load()
      .then((f) => document.fonts.add(f))
      .catch(() => undefined)
      .finally(() => changeScene(this, 'Menu'));
  }
}
