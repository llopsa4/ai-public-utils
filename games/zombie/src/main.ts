import Phaser from 'phaser';
import { audio } from './audio/engine';
import { ActionBarScene } from './scenes/ActionBar';
import { BaseHudScene, BaseScene } from './scenes/Base';
import { CardScene } from './scenes/Card';
import { Boot } from './scenes/Boot';
import { DebriefScene } from './scenes/Debrief';
import { DialogueScene } from './scenes/Dialogue';
import { AtmosScene } from './scenes/Atmos';
import { FeelScene } from './scenes/Feel';
import { IntroHudScene, IntroScene } from './scenes/Intro';
import { MenuScene } from './scenes/Menu';
import { MissionHudScene, MissionScene } from './scenes/Mission';
import { PauseScene } from './scenes/Pause';
import { SquadScene } from './scenes/Squad';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#141614',
  render: { roundPixels: true }, // DESIGN §3: pixel rounding stays on at every zoom step
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  disableContextMenu: true, // right-click only cancels a pending command
  audio: { noAudio: true }, // all sound is made in code by `audio/engine.ts`; Phaser's own sound manager stays off
  scene: [Boot, MenuScene, MissionScene, IntroScene, BaseScene, AtmosScene, MissionHudScene, IntroHudScene, BaseHudScene, ActionBarScene, SquadScene, FeelScene, DialogueScene, DebriefScene, PauseScene, CardScene], // the atmosphere sits over the worlds and under every HUD; overlays stay last; the card is the very top so they draw on top
});

audio.arm(); // the sound starts on the first click or key press (a browser rule)

if (new URLSearchParams(window.location.search).has('debug')) (window as unknown as { dwGame?: Phaser.Game }).dwGame = game; // browser checks reach the scenes through it
