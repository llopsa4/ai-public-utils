import Phaser from 'phaser';
import { initLanguage, t } from './engine/i18n';
import { BootScene, RoomScene } from './game/scenes';
import { Session } from './game/session';
import { ART_SCALE, LOGICAL_H, LOGICAL_W } from './ui/ui';
import './style.css';

initLanguage();
const session = new Session();
const room = new RoomScene(session);
session.scene = room;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // The canvas is 2x the 640x360 world; the camera zooms 2x so content keeps world coordinates.
  width: LOGICAL_W * ART_SCALE,
  height: LOGICAL_H * ART_SCALE,
  backgroundColor: '#000000',
  antialias: true,
  roundPixels: true,
  banner: false,
  scale: { mode: Phaser.Scale.NONE, zoom: session.ui.layout() / ART_SCALE },
  input: { activePointers: 2 },
  scene: [BootScene, room],
});

function relayout(): void {
  game.scale.setZoom(session.ui.layout() / ART_SCALE);
}
window.addEventListener('resize', relayout);
window.addEventListener('orientationchange', relayout);

session.ui.toast(t('ui.notice'), 9000);

// Opt-in inspection hook for testing art and timing: open the game with ?debug.
if (new URLSearchParams(location.search).has('debug')) {
  Object.assign(window, { adventure: { game, session } });
}
