import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import { audio } from '../audio/engine';
import { UI_TEXTURE, uiOf } from '../render/ui';
import { DIFFICULTY_NAME, nextDifficulty } from '../sim/difficulty';
import { type ToggleKey, type VolumeKey, nextTextSize, options, sliderValue, updateOptions } from '../sim/options';
import { kitSlice, menuButton } from './kit';

export const UI_FONT = GAME_FONT;

const ROW_H = 44;
const LABEL_X = -300; // from the page centre
const TRACK_X = 10;
const TRACK_W = 240;
const VALUE_X = 305;
const CHECK_X = 10; // the checkbox's left edge, from the page centre

const VOLUMES: { key: VolumeKey; label: string }[] = [
  { key: 'master', label: 'Master volume' },
  { key: 'effects', label: 'Effects volume' },
  { key: 'ambience', label: 'Ambience volume' },
];
const TOGGLES: { key: ToggleKey; label: string; on: string; off: string }[] = [
  { key: 'mute', label: 'Mute all sound', on: 'Muted', off: 'Sound on' },
  { key: 'edgeScroll', label: 'Edge scroll', on: 'On', off: 'Off' },
  { key: 'shake', label: 'Screen shake', on: 'On', off: 'Off' },
  { key: 'cues', label: 'Shape cues', on: 'On', off: 'Off' },
  { key: 'weather', label: 'Weather and fog', on: 'On', off: 'Off' },
];

/**
 * Draws the Options rows (DESIGN §19) on `scene`, centred on `cx` from `top` down, and returns the y below
 * the last row. Every change is saved at once through `updateOptions`; the objects belong to the scene, so
 * the page clears them with the rest of its children. The sliders, checkboxes and the text-size button are
 * the painted kit (Z54).
 */
export function drawOptionsPage(scene: Phaser.Scene, cx: number, top: number): number {
  const refresh: (() => void)[] = [];
  let y = top;
  const label = (text: string): void => void scene.add.text(cx + LABEL_X, y, text, { fontFamily: UI_FONT, fontSize: '22px', color: '#d6d4cc' }).setOrigin(0, 0.5);
  const knobSize = uiOf('kit_slider_knob').display;
  const checkSize = uiOf('kit_check_off').display;
  const trackH = uiOf('kit_slider_track').display[1];

  for (const v of VOLUMES) {
    label(v.label);
    const left = cx + TRACK_X;
    const row = y;
    kitSlice(scene, 'kit_slider_track', left, row - trackH / 2, TRACK_W, trackH);
    const fill = scene.add.rectangle(left, row, 0, 4, 0xe8c46a).setOrigin(0, 0.5);
    const knob = scene.add.image(left, row, UI_TEXTURE, 'kit_slider_knob').setDisplaySize(knobSize[0], knobSize[1]);
    const value = scene.add.text(cx + VALUE_X, row, '', { fontFamily: UI_FONT, fontSize: '20px', color: '#e8e6de' }).setOrigin(0.5);
    const set = (p: Phaser.Input.Pointer): void => {
      const next = sliderValue(p.x, left, TRACK_W);
      if (next === options()[v.key]) return;
      updateOptions({ [v.key]: next });
      audio.sync();
      if (v.key !== 'ambience') audio.ui(); // a tick at the new level, so the slider can be judged by ear
      refresh.forEach((r) => r());
    };
    scene.add
      .rectangle(left - 12, row, TRACK_W + 24, 30, 0x000000, 0.001)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', set)
      .on('pointermove', (p: Phaser.Input.Pointer) => {
        if (p.isDown) set(p);
      });
    refresh.push(() => {
      const f = options()[v.key];
      fill.width = TRACK_W * f;
      knob.setPosition(left + TRACK_W * f, row);
      value.setText(`${Math.round(f * 100)}%`);
    });
    y += ROW_H;
  }

  for (const t of TOGGLES) {
    label(t.label);
    const row = y;
    const box = scene.add.image(cx + CHECK_X, row, UI_TEXTURE, 'kit_check_off').setOrigin(0, 0.5).setDisplaySize(checkSize[0], checkSize[1]);
    const word = scene.add.text(cx + CHECK_X + checkSize[0] + 12, row, '', { fontFamily: UI_FONT, fontSize: '20px', color: '#e8e6de' }).setOrigin(0, 0.5);
    const toggle = (): void => {
      updateOptions({ [t.key]: !options()[t.key] });
      audio.sync();
      audio.ui();
      refresh.forEach((r) => r());
    };
    // The box and its word are one target, as wide as the row's word needs.
    scene.add
      .rectangle(cx + CHECK_X - 6, row, checkSize[0] + 12 + 12 + 110, ROW_H - 8, 0x000000, 0.001)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', toggle);
    refresh.push(() => {
      const on = options()[t.key];
      box.setFrame(on ? 'kit_check_on' : 'kit_check_off');
      word.setText(on ? t.on : t.off);
    });
    y += ROW_H;
  }

  label('Text size');
  const sizeButton = menuButton(scene, cx + CHECK_X + 50, y, '150%', UI_FONT, 20, () => {
    updateOptions({ textSize: nextTextSize(options().textSize) });
    refresh.forEach((r) => r());
  }, '#e8e6de', 100);
  refresh.push(() => sizeButton.label?.setText(`${options().textSize}%`));
  y += ROW_H;

  // Difficulty (DESIGN §21): Easy → Normal → Hard; it applies when a scene next starts or restarts.
  label('Difficulty');
  const levelButton = menuButton(scene, cx + CHECK_X + 50, y, 'Normal', UI_FONT, 20, () => {
    updateOptions({ difficulty: nextDifficulty(options().difficulty) });
    audio.ui();
    refresh.forEach((r) => r());
  }, '#e8e6de', 100);
  scene.add.text(cx + CHECK_X + 126, y, 'from the next start or restart', { fontFamily: UI_FONT, fontSize: '16px', color: '#9a988f' }).setOrigin(0, 0.5);
  refresh.push(() => levelButton.label?.setText(DIFFICULTY_NAME[options().difficulty]));
  y += ROW_H;

  refresh.forEach((r) => r());
  return y;
}
