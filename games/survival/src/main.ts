import Phaser from 'phaser';
import { music } from './audio/music';
import { Boot } from './scenes/Boot';
import { BuildScene } from './scenes/Build';
import { GameScene } from './scenes/Game';
import { HudScene } from './scenes/Hud';
import { MenuScene } from './scenes/Menu';
import { SelectScene } from './scenes/Select';

music.arm(); // sound starts on the first click or key press

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#2b2a24',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Drawing order, bottom to top: the building cards (Build) sit on the selection panel (Select); the HUD is above both.
  scene: [Boot, MenuScene, GameScene, SelectScene, BuildScene, HudScene],
});
