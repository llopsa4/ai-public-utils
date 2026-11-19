// The menu scene (DESIGN-slice.md `## UI`): title, Start (the default seed), Random seed and the controls.
import Phaser from 'phaser';
import mapConfig from '../data/map.json';

const INK = '#f3e9d2';
const CONTROLS = [
  'Left-click: select      Drag: box select      Shift-click: add or remove',
  'Right-click: move, gather, chop, build, assign to a building, or attack a wolf',
  'R: draft or undraft      Z X C: hold / defend / chase      Delete: cancel a site',
  'B then 1-4: build (left-click to place, right-click to stop)',
  'Space: pause      1 2 3: speed 1x 2x 4x      Esc: clear the selection',
  'WASD or arrows or the screen edge: scroll      Mouse wheel: zoom',
];

/** The seed in the page address (`?seed=7`), or the one the design names. */
function defaultSeed(): number {
  const seed = Number(new URLSearchParams(location.search).get('seed') ?? mapConfig.start.seed);
  return Number.isFinite(seed) ? seed : mapConfig.start.seed;
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const text = (x: number, y: number, size: number, label: string, color = INK) =>
      this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);

    text(640, 150, 56, 'Camp Fire');
    text(640, 205, 18, 'A few families, one fire, and the winter ahead.', '#cdbf9c');

    this.button(640, 300, ' Start ', () => this.begin(defaultSeed()));
    this.button(640, 365, ' Random seed ', () => this.begin(Math.floor(Math.random() * 1_000_000) + 1));

    text(640, 450, 16, 'Controls', '#cdbf9c');
    CONTROLS.forEach((line, i) => text(640, 485 + i * 26, 15, line));

    this.input.keyboard!.on('keydown-ENTER', () => this.begin(defaultSeed()));
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const b = this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '24px', color: '#1d1a16', backgroundColor: INK })
      .setOrigin(0.5)
      .setPadding(14, 8)
      .setInteractive({ useHandCursor: true });
    b.on('pointerover', () => b.setBackgroundColor('#ffffff'));
    b.on('pointerout', () => b.setBackgroundColor(INK));
    b.on('pointerdown', (p: Phaser.Input.Pointer) => p.leftButtonDown() && onClick());
  }

  private begin(seed: number): void {
    this.scene.start('Game', { seed });
  }
}
