import Phaser from 'phaser';
import { manifest } from '../render/manifest';
import { ensureTextures } from '../render/placeholders';
import mapConfig from '../data/map.json';

// Art PNGs under art/ (the glob finds none until Codex delivers the first final asset).
const artFiles = import.meta.glob('../../art/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const [key, e] of Object.entries(manifest)) {
      if (e.status !== 'final') continue;
      const url = artFiles[`../../art/${e.file}`];
      if (url) this.load.image(key, url);
    }
  }

  create(): void {
    ensureTextures(this);
    const seed = Number(new URLSearchParams(location.search).get('seed') ?? mapConfig.start.seed);
    this.scene.start('Game', { seed: Number.isFinite(seed) ? seed : mapConfig.start.seed });
  }
}
