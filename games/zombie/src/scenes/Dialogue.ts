import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import { audio } from '../audio/engine';
import { uiFactor } from '../render/cues';
import type { SquadCard } from '../render/squad';
import { noteMood } from '../render/moods';
import { dialoguePortrait } from '../render/ui';
import { options } from '../sim/options';
import { type DialogueLine, type DialogueState, advance, currentLine, isTyping, skipDialogue, startDialogue, stepDialogue, visibleText } from '../sim/dialogue';
import { TICK_HZ } from '../sim/time';
import { barH } from './ActionBar';
import { CARD_SCENE } from './Card';
import { kitSlice, uiImage } from './kit';
import { ui } from './uiScale';

// Dialogue box (DESIGN §6): across the bottom of the screen above the action bar, speaker name,
// the speaker's portrait (128 px, in the line's mood; hurt under 35% HP, DESIGN §6), typewriter text. Opening it pauses every other running scene (so the
// simulation, orders and hotkeys stop); closing it resumes exactly those scenes.

export const TYPEWRITER_FONT = GAME_FONT;
export const DIALOGUE_SCENE = 'Dialogue';

const PORTRAIT = 128; // display px at 100% text size (art/STYLE.md *UI art*); the box, portrait and text grow with the option (DESIGN §19)
const EDGE = 14;
const BOX_H = PORTRAIT + 2 * EDGE;
const PAD = 20;
const STEP_MS = 1000 / TICK_HZ;

export interface DialogueData {
  lines: readonly DialogueLine[];
  onDone?: () => void;
}

/** Opens the dialogue box over `from`. Does nothing when a box is already open or there are no lines. */
export function openDialogue(from: Phaser.Scene, lines: readonly DialogueLine[], onDone?: () => void): void {
  if (lines.length === 0) {
    onDone?.();
    return;
  }
  if (from.scene.isActive(DIALOGUE_SCENE)) return;
  from.scene.launch(DIALOGUE_SCENE, { lines, onDone } satisfies DialogueData);
}

export class DialogueScene extends Phaser.Scene {
  private state!: DialogueState;
  private onDone?: () => void;
  private paused: string[] = [];
  private acc = 0;
  private shown = 0; // letters visible at the last look (blips)
  private letters = 0;
  private closed = false;
  private head!: Phaser.GameObjects.Image;
  private headKey = '';
  private name!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private more!: Phaser.GameObjects.Text;

  constructor() {
    super(DIALOGUE_SCENE);
  }

  init(data: DialogueData): void {
    this.state = startDialogue(data.lines);
    this.onDone = data.onDone;
    this.acc = 0;
    this.shown = 0;
    this.letters = 0;
    this.closed = false;
  }

  create(): void {
    // Freeze whatever is running under the box, remembering it so closing resumes the same scenes.
    this.paused = this.scene.manager
      .getScenes(true)
      .map((s) => s.scene.key)
      .filter((k) => k !== DIALOGUE_SCENE && k !== CARD_SCENE);
    for (const k of this.paused) this.scene.pause(k);

    const { width, height } = this.scale;
    const w = Math.min(width - 2 * PAD, 1100);
    const x0 = Math.round((width - w) / 2);
    const boxH = ui(BOX_H);
    const edge = ui(EDGE);
    const pic = ui(PORTRAIT);
    const y0 = height - barH() - boxH - 10;

    // A full-screen catcher so a click anywhere advances the line and never reaches the world.
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.25)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', () => this.next());
    kitSlice(this, 'kit_panel', x0, y0, w, boxH, uiFactor(options().textSize)); // the worn-kit panel (Z54)
    this.add.rectangle(x0 + edge, y0 + edge, pic, pic, 0x1a1c19).setOrigin(0, 0).setStrokeStyle(2, 0x8a8d86); // behind the portrait; shows alone for a speaker without one
    this.head = uiImage(this, 'portrait_fighter_neutral', x0 + edge, y0 + edge, pic).setVisible(false);
    this.headKey = '';
    this.name = this.add.text(x0 + edge + pic + 18, y0 + ui(12), '', { fontFamily: TYPEWRITER_FONT, fontSize: `${ui(22)}px`, color: '#e8c46a' });
    this.body = this.add.text(x0 + edge + pic + 18, y0 + ui(44), '', {
      fontFamily: TYPEWRITER_FONT,
      fontSize: `${ui(20)}px`,
      color: '#e8e6de',
      lineSpacing: 6,
      wordWrap: { width: w - pic - edge * 2 - 18 - 14 },
    });
    this.more = this.add
      .text(x0 + w - 14, y0 + boxH - 10, 'Click / Enter', { fontFamily: TYPEWRITER_FONT, fontSize: `${ui(14)}px`, color: '#a8a69e' })
      .setOrigin(1, 1);

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.next());
    kb.on('keydown-SPACE', () => this.next());
    kb.on('keydown-ESC', () => this.skip());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const k of this.paused) if (this.scene.isPaused(k)) this.scene.resume(k);
    });
    this.refresh();
  }

  private next(): void {
    advance(this.state);
    if (this.state.finished) this.close();
    else this.refresh();
  }

  /** Esc: skip the whole beat, every remaining line included. */
  private skip(): void {
    skipDialogue(this.state);
    this.close();
  }

  /** Closes the box once: stops it, then calls `onDone` exactly once. */
  private close(): void {
    if (this.closed) return;
    this.closed = true;
    const done = this.onDone;
    this.scene.stop();
    done?.();
  }

  private refresh(): void {
    const line = currentLine(this.state);
    if (!line) return;
    this.name.setText(line.speaker);
    this.showPortrait(line);
    this.body.setText(visibleText(this.state));
    this.more.setVisible(!isTyping(this.state));
  }

  /** The speaker's portrait in the line's mood; hurt replaces it while that survivor is under 35% HP (the squad cards hold the HP). */
  private showPortrait(line: DialogueLine): void {
    const cards = this.registry.get('m_squad') as SquadCard[] | null | undefined;
    const card = cards?.find((c) => c.name === line.speaker);
    noteMood(line.speaker, line.mood);
    const key = dialoguePortrait(line.speaker, line.mood, card ? { hp: card.hp, maxHp: card.maxHp } : undefined);
    if (!key) {
      this.head.setVisible(false);
      this.headKey = '';
      return;
    }
    if (key !== this.headKey) {
      this.headKey = key;
      this.head.setFrame(key);
    }
    this.head.setVisible(true);
  }

  update(_t: number, dt: number): void {
    if (this.state.finished) return;
    this.acc += Math.min(dt, 250);
    while (this.acc >= STEP_MS) {
      this.acc -= STEP_MS;
      stepDialogue(this.state, 1);
    }
    this.refresh();
    this.blip();
  }

  /** A typewriter clack for every second letter that appears (spaces make none), so the typing is heard (DESIGN §6). */
  private blip(): void {
    const text = visibleText(this.state);
    const from = text.length < this.shown ? 0 : this.shown; // a new line starts over
    const fresh = text.slice(from);
    this.shown = text.length;
    for (const ch of fresh) {
      if (ch.trim() === '') continue;
      if (++this.letters % 2 === 0) audio.play('blip', { gain: 0.6, variant: Math.random() });
    }
  }
}
