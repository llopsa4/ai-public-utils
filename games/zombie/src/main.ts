import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { CampScene } from './scenes/Camp';
import { DebriefScene } from './scenes/Debrief';
import { HudScene } from './scenes/Hud';
import { MenuScene } from './scenes/Menu';
import { MissionHudScene, MissionScene } from './scenes/Mission';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#141614',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  disableContextMenu: true, // right-click is the move order
  scene: [Boot, MenuScene, CampScene, HudScene, MissionScene, MissionHudScene, DebriefScene],
});
