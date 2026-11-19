import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { BuildScene } from './scenes/Build';
import { GameScene } from './scenes/Game';
import { HudScene } from './scenes/Hud';
import { SelectScene } from './scenes/Select';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#2b2a24',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, GameScene, BuildScene, HudScene, SelectScene],
});
