// Kota entry point: builds the shared helpers (settings, sound, input, UI, hints), starts Phaser and the
// scenes, and owns the Settings menu. Scenes reach the helpers through `registry.get('app')`.

import { createSettings } from './settings.js';
import { createAudio } from './audio/audio.js';
import { createInput } from './input/touch.js';
import { createUI } from './ui/screens.js';
import { createHints } from './ui/hints.js';
import { loadCamp, saveCamp } from './camp/save.js';
import { BootScene } from './scenes/BootScene.js';
import { CampScene } from './scenes/CampScene.js';
import { RunScene } from './scenes/RunScene.js';

const $ = (id) => document.getElementById(id);

const settings = createSettings();
const ui = createUI();
const input = createInput({
  surface: $('game'), buttons: $('buttons'),
  stickBase: document.querySelector('.stick-base'), stickKnob: document.querySelector('.stick-knob'),
});
input.setLeftHanded(settings.values.leftHanded);
const audio = createAudio(settings);
const hints = createHints({
  settings,
  hintEl: $('hint'), textEl: $('hint-text'), skipEl: $('hint-skip'),
  bannerEl: $('banner'), titleEl: $('banner-title'), subEl: $('banner-sub'),
});
const app = { settings, ui, input, audio, hints, paused: false, mode: 'boot', camp: loadCamp(), fell: false };
app.saveCamp = () => saveCamp(app.camp);

// Browsers only start sound after a touch or key press.
const unlockAudio = () => { audio.unlock(); if (audio.pending) { audio.setAmbience(audio.pending); audio.pending = null; } };
for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, unlockAudio);
$('screen').addEventListener('click', (e) => { if (e.target.closest('.opt')) audio.click(); });

// The canvas is drawn at the screen's pixel ratio (capped at 2; 1 on "light" quality) and shown at 100%.
const pixelRatio = () => (settings.values.quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
const canvasSize = () => ({ width: Math.round(window.innerWidth * pixelRatio()), height: Math.round(window.innerHeight * pixelRatio()) });

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1a16',
  scale: { mode: Phaser.Scale.NONE, ...canvasSize() },
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },   // input is handled in input/touch.js
  fps: { target: 60 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, CampScene, RunScene],
  callbacks: { preBoot: (g) => g.registry.set('app', app) },
});
const resizeCanvas = () => { const { width, height } = canvasSize(); game.scale.resize(width, height); };
window.addEventListener('resize', resizeCanvas);

// Settings (saved on this device). The game pauses while the menu is open.
let settingsSnap = null;
function openSettings() {
  if (!settingsSnap) settingsSnap = ui.snapshot();
  app.paused = true;
  const s = settings.values;
  const options = [
    { label: `Sound: ${s.sound ? 'on' : 'off'}`, onClick: () => { settings.set('sound', !s.sound); openSettings(); } },
    { label: `Controls: ${s.leftHanded ? 'left-handed' : 'right-handed'}`, onClick: () => { settings.set('leftHanded', !s.leftHanded); openSettings(); } },
    { label: `Screen shake: ${s.reduceShake ? 'reduced' : 'normal'}`, onClick: () => { settings.set('reduceShake', !s.reduceShake); openSettings(); } },
    { label: `Hints: ${s.hints ? 'on' : 'off'}`, onClick: () => { settings.set('hints', !s.hints); openSettings(); } },
    { label: `Quality: ${s.quality === 'high' ? 'high' : 'light (faster)'}`, onClick: () => { settings.set('quality', s.quality === 'high' ? 'low' : 'high'); openSettings(); } },
  ];
  if (app.mode === 'run') {
    options.push({ label: 'Leave run', detail: 'Return to camp', onClick: () => { settingsSnap = null; game.scene.getScene('Run').leave(); } });
  }
  options.push({ label: 'Back', onClick: () => { app.paused = false; ui.restore(settingsSnap); settingsSnap = null; } });
  ui.show('Settings', 'Saved on this device.', options);
}
$('settings-btn').addEventListener('click', () => { if (!settingsSnap) openSettings(); });
settings.onChange((key, value) => {
  if (key === 'sound') audio.setEnabled(value);
  if (key === 'leftHanded') input.setLeftHanded(value);
  if (key === 'quality') resizeCanvas();
});

// Testing hook, only with ?debug in the address (e.g. index.html?debug): shows fps and exposes `window.kota`.
if (new URLSearchParams(location.search).has('debug')) {
  window.kota = { game, app, run: () => game.scene.getScene('Run') };
  setInterval(() => { $('hud').textContent = `${Math.round(game.loop.actualFps)} fps`; }, 500);
}
