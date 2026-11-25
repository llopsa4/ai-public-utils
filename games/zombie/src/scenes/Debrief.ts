import Phaser from 'phaser';
import { audio } from '../audio/engine';
import { type Filed } from '../sim/records';
import { BADGES, GRADE_NAME, GRADE_NOTE, type Result } from '../sim/stats';
import { TYPEWRITER_FONT } from './Dialogue';
import { CARD_SCENE } from './Card';
import { KitButton, kitSlice } from './kit';

// The debrief (DESIGN §21): a kit panel after Mission 1's and Base 1's win dialogue with time, kills, shots,
// damage, crates (or traps), the grade and the badges. It pauses what runs beneath it like the dialogue box
// and calls `onDone` once when Enter, Space, a click or the button closes it.

export const DEBRIEF_SCENE = 'Debrief';
const TITLE: Readonly<Record<Result['scene'], string>> = { mission1: 'Mission 1: the house in the woods', base1: 'Base 1: the house' };
const W = 560;
const PAD = 28;
const ROW_H = 30;

export interface DebriefData {
  result: Result;
  filed: Filed;
  onDone?: () => void;
}

/** Opens the debrief over `from`. Does nothing when one is already open. */
export function openDebrief(from: Phaser.Scene, result: Result, filed: Filed, onDone?: () => void): void {
  if (from.scene.isActive(DEBRIEF_SCENE)) return;
  from.scene.launch(DEBRIEF_SCENE, { result, filed, onDone } satisfies DebriefData);
}

export class DebriefScene extends Phaser.Scene {
  private data0!: DebriefData;
  private paused: string[] = [];
  private closed = false;

  constructor() {
    super(DEBRIEF_SCENE);
  }

  init(data: DebriefData): void {
    this.data0 = data;
    this.closed = false;
  }

  create(): void {
    this.paused = this.scene.manager
      .getScenes(true)
      .map((s) => s.scene.key)
      .filter((k) => k !== DEBRIEF_SCENE && k !== CARD_SCENE);
    for (const k of this.paused) this.scene.pause(k);

    const { result: r, filed } = this.data0;
    const { width, height } = this.scale;
    const badges = BADGES[r.scene].filter((b) => r.badges.includes(b.id));
    const h = PAD * 2 + 44 + r.rows.length * ROW_H + 24 + 64 + (badges.length > 0 ? 30 + badges.length * 26 : 30) + 72;
    const x0 = Math.round((width - W) / 2);
    const y0 = Math.round(Math.max(20, (height - h) / 2));

    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', () => this.close()); // a click anywhere leaves, like the dialogue box
    kitSlice(this, 'kit_panel', x0, y0, W, h);

    let y = y0 + PAD;
    this.add.text(x0 + W / 2, y, `${TITLE[r.scene]}\nDebrief`, { fontFamily: TYPEWRITER_FONT, fontSize: '22px', color: '#e8c46a', align: 'center' }).setOrigin(0.5, 0);
    y += 64;
    for (const [label, value] of r.rows) {
      this.add.text(x0 + PAD, y, label, { fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: '#a8a69e' });
      const mark = label === 'Time' && filed.newTime ? '   new best' : '';
      this.add.text(x0 + W - PAD, y, value + mark, { fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: mark ? '#9bc79b' : '#e8e6de' }).setOrigin(1, 0);
      y += ROW_H;
    }
    y += 14;
    this.add.text(x0 + PAD, y + 6, 'Grade', { fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: '#a8a69e' });
    this.add
      .text(x0 + W - PAD, y, `${GRADE_NAME[r.grade] ?? r.grade}${filed.newGrade ? '  new best' : ''}`, { fontFamily: TYPEWRITER_FONT, fontSize: '30px', color: filed.newGrade ? '#9bc79b' : '#f4efe0' })
      .setOrigin(1, 0);
    this.add.text(x0 + W - PAD, y + 38, GRADE_NOTE[r.grade] ?? '', { fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: '#a8a69e' }).setOrigin(1, 0);
    y += 70;
    if (badges.length === 0) this.add.text(x0 + PAD, y, 'No badges this time.', { fontFamily: TYPEWRITER_FONT, fontSize: '16px', color: '#a8a69e' });
    else {
      this.add.text(x0 + PAD, y, 'Badges', { fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: '#a8a69e' });
      y += 30;
      for (const b of badges) {
        const fresh = filed.newBadges.includes(b.id) ? '   new' : '';
        this.add.text(x0 + PAD, y, `${b.name}: ${b.note}${fresh}`, { fontFamily: TYPEWRITER_FONT, fontSize: '16px', color: fresh ? '#9bc79b' : '#e8e6de' });
        y += 26;
      }
    }

    new KitButton(this, { x: x0 + W / 2 - 100, y: y0 + h - PAD - 44, w: 200, h: 44, label: 'Continue', fontFamily: TYPEWRITER_FONT, fontPx: 20, onClick: () => this.close() });
    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.close());
    kb.on('keydown-SPACE', () => this.close());
    kb.on('keydown-ESC', () => this.close());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const k of this.paused) if (this.scene.isPaused(k)) this.scene.resume(k);
    });
    audio.ui();
  }

  /** Closes once: stops the overlay, then calls `onDone`. */
  private close(): void {
    if (this.closed) return;
    this.closed = true;
    const done = this.data0.onDone;
    this.scene.stop();
    done?.();
  }
}
