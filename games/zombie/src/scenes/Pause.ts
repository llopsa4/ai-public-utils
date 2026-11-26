import Phaser from 'phaser';
import { type ActionId, keyLabel, keyNameOf, refusal, shownActions } from '../sim/keymap';
import { liveKeys, rebindKey, resetKeys } from '../sim/options';
import { keyOf } from './actionKeys';
import { DEBRIEF_SCENE } from './Debrief';
import { DIALOGUE_SCENE } from './Dialogue';
import { CARD_SCENE } from './Card';
import { KitButton, kitSlice, menuButton, titleBackdrop } from './kit';
import { type BiosPage, drawBiosPage } from './biosPage';
import { UI_FONT, drawOptionsPage } from './optionsPage';
import type { Progress } from '../sim/bios';

// Pause menu (DESIGN §19): Esc in Intro, Mission 1 and Base 1 (R goes straight to its Restart question;
// losing window focus opens it too). Like the dialogue box it freezes every other running scene while
// it is open and resumes exactly those when it closes. It never opens over a dialogue.

export const PAUSE_SCENE = 'Pause';

type Page = 'main' | 'restart' | 'quit' | 'options' | 'controls' | 'keys' | 'bios';

/** What a playable scene tells the pause menu. */
export interface PauseHooks {
  /** Esc cancels a pending order first: returns true when it did, so the menu stays closed. */
  cancelPending: () => boolean;
  /** The scene is showing its fail screen, where any key restarts: R must not also open the menu. */
  failed: () => boolean;
  restart: () => void;
  quit: () => void;
  /** The scene's key lines (its HUD help) for the Controls page. */
  controls: () => readonly string[];
  /** The scene's start hints for the Controls page. */
  hints: () => readonly string[];
  /** Replaces the Quit page's note when Continue would not start the scene from its beginning (Base 1's herd checkpoint). */
  quitNote?: () => string;
  /** How far the story has got in this scene, for the Bios page (DESIGN §24). */
  progress: () => Progress;
}

interface PauseData {
  hooks: PauseHooks;
  page: Page;
}

let open = false; // one menu at a time, also in the frame between launch and create

/** Wires Esc, R and window blur of a playable scene to the pause menu. Call once in `create`. */
export function bindPause(scene: Phaser.Scene, hooks: PauseHooks): void {
  const launch = (page: Page): void => {
    if (open || !scene.scene.isActive() || scene.scene.isActive(DIALOGUE_SCENE) || scene.scene.isActive(DEBRIEF_SCENE)) return;
    open = true;
    scene.scene.launch(PAUSE_SCENE, { hooks, page } satisfies PauseData);
  };
  const kb = scene.input.keyboard!;
  kb.on('keydown-ESC', () => {
    if (scene.scene.isActive(DIALOGUE_SCENE) || scene.scene.isActive(DEBRIEF_SCENE) || hooks.cancelPending()) return; // the dialogue and the debrief take Esc
    launch('main');
  });
  kb.on('keydown-R', () => {
    if (!hooks.failed()) launch('restart');
  });
  const lostFocus = (): void => launch('main');
  const events = scene.game.events;
  events.on(Phaser.Core.Events.BLUR, lostFocus);
  events.on(Phaser.Core.Events.HIDDEN, lostFocus);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    events.off(Phaser.Core.Events.BLUR, lostFocus);
    events.off(Phaser.Core.Events.HIDDEN, lostFocus);
  });
}

/** The key map's own lines (pan and squad keys, from the live map), then the scene's lines split into one item each. */
export function controlLines(scene: readonly string[]): string[] {
  const pan = (['panUp', 'panLeft', 'panDown', 'panRight'] as const).map(keyOf).join(' ');
  return [
    `Pan: ${pan}, the arrow keys or the screen edge`,
    'Zoom: mouse wheel',
    `Select survivor: ${keyOf('select1')} / ${keyOf('select2')}    Next survivor: ${keyOf('cycle')}`,
    ...scene.flatMap((line) => line.split(/ {2,}/)).filter((l) => l !== ''),
  ];
}

/** The Keys page: the actions in two columns, in the order of `data/keys.json`. */
const KEY_COLUMNS = 2;

export class PauseScene extends Phaser.Scene {
  private hooks!: PauseHooks;
  private page: Page = 'main';
  private home: Page = 'main';
  private paused: string[] = [];
  private closed = false;
  private resumeOnClose = true;
  /** The Keys page is waiting for the next key press to bind to this action. */
  private listening: ActionId | null = null;
  private keyNote = '';
  /** The key event the Keys page just took, so the menu's own handlers (Esc, Enter, R) ignore it. */
  private captured: KeyboardEvent | null = null;
  /** The Bios page while it is showing (its arrow keys and wheel go here). */
  private bios: BiosPage | null = null;

  constructor() {
    super(PAUSE_SCENE);
  }

  init(data: PauseData): void {
    this.hooks = data.hooks;
    this.home = data.page;
    this.page = data.page;
    this.closed = false;
    this.resumeOnClose = true;
    this.listening = null;
    this.keyNote = '';
    this.captured = null;
  }

  create(): void {
    // Freeze whatever is running under the menu, remembering it so closing resumes the same scenes.
    this.paused = this.scene.manager
      .getScenes(true)
      .map((s) => s.scene.key)
      .filter((k) => k !== PAUSE_SCENE && k !== CARD_SCENE);
    for (const k of this.paused) this.scene.pause(k);

    const kb = this.input.keyboard!;
    // While the Keys page waits for a key, every press is the new binding: the menu's own keys sit out.
    const menuKey = (fn: () => void) => (e: KeyboardEvent): void => {
      if (this.listening === null && e !== this.captured) fn();
    };
    kb.on('keydown-ESC', menuKey(() => this.back()));
    kb.on('keydown-ENTER', menuKey(() => this.confirm()));
    kb.on('keydown-Y', menuKey(() => this.confirm()));
    kb.on('keydown-N', menuKey(() => {
      if (this.page === 'restart' || this.page === 'quit') this.back();
    }));
    kb.on('keydown-R', menuKey(() => {
      if (this.page === 'main') this.show('restart');
    }));
    kb.on('keydown', (e: KeyboardEvent) => this.capture(e));
    kb.on('keydown-LEFT', () => this.page === 'bios' && this.bios?.step(-1));
    kb.on('keydown-RIGHT', () => this.page === 'bios' && this.bios?.step(1));
    kb.on('keydown-UP', () => this.page === 'bios' && this.bios?.scroll(-48));
    kb.on('keydown-DOWN', () => this.page === 'bios' && this.bios?.scroll(48));
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => this.page === 'bios' && this.bios?.scroll(dy));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      open = false;
      if (this.resumeOnClose) for (const k of this.paused) if (this.scene.isPaused(k)) this.scene.resume(k);
    });
    this.show(this.page);
  }

  /** A kit button centred on (x, y) (Z54); `color` dims the secondary buttons. */
  private button(x: number, y: number, label: string, size: number, onClick: () => void, color = '#e8e6de'): void {
    menuButton(this, x, y, label, UI_FONT, size, onClick, color, 200);
  }

  /** Esc, Cancel and No: one page back, or out of the menu from the first page. */
  private back(): void {
    if (this.page === 'main' || this.page === this.home) this.close();
    else this.show(this.page === 'keys' ? 'options' : 'main');
  }

  /** A key press while the Keys page waits: Esc gives up, anything else is bound or refused with the reason. */
  private capture(e: KeyboardEvent): void {
    const action = this.listening;
    if (action === null) return;
    e.preventDefault();
    this.captured = e;
    const name = keyNameOf(e.keyCode);
    if (name === 'ESC') {
      this.listening = null;
      this.keyNote = '';
    } else if (name === null) {
      if (![16, 17, 18, 20, 91, 92, 93].includes(e.keyCode)) this.keyNote = 'That key cannot be bound. Use a letter, a digit, F1-F4, F6-F10, Tab or Space.';
      else return; // a modifier on its own: keep waiting
    } else {
      const r = rebindKey(action, name);
      if (r.ok) {
        this.listening = null;
        this.keyNote = '';
      } else {
        this.keyNote = refusal(r); // keeps waiting: press another key, or Esc
      }
    }
    this.show('keys');
  }

  /** Enter or Y: yes on a question; on the main page Enter means Resume. */
  private confirm(): void {
    if (this.page === 'restart') this.leaveWith(this.hooks.restart);
    else if (this.page === 'quit') this.leaveWith(this.hooks.quit);
    else if (this.page === 'main') this.close();
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.scene.stop();
  }

  /**
   * Closes the menu, then runs a scene change (restart or quit) that tears the scenes below down. They stay
   * paused: resuming one that is about to be stopped would run its update once more with nothing left to draw.
   */
  private leaveWith(action: () => void): void {
    if (this.closed) return;
    this.closed = true;
    this.resumeOnClose = false;
    this.scene.stop();
    action();
  }

  /** The Keys page (DESIGN §19): click a key, press the new one; a refused key says why; Reset restores the defaults. */
  private drawKeys(cx: number, height: number): void {
    this.add.text(cx, 56, 'Keys', { fontFamily: UI_FONT, fontSize: '48px', color: '#d6d4cc' }).setOrigin(0.5);
    this.add
      .text(cx, 104, 'Click a key, then press the new one.  Esc cancels.', { fontFamily: UI_FONT, fontSize: '18px', color: '#a8a69e' })
      .setOrigin(0.5);
    const actions = shownActions();
    const perColumn = Math.ceil(actions.length / KEY_COLUMNS);
    const ROW = 38; // the rows, the refusal note and the buttons all fit inside the panel
    const bound = liveKeys();
    actions.forEach((a, i) => {
      const col = Math.floor(i / perColumn);
      const x = cx - 580 + col * 600;
      const y = 150 + (i % perColumn) * ROW;
      this.add.text(x, y, a.label, { fontFamily: UI_FONT, fontSize: '20px', color: '#d6d4cc' }).setOrigin(0, 0.5);
      const waiting = this.listening === a.id;
      const cell = new KitButton(this, {
        x: x + 340,
        y: y - 17,
        w: 170,
        h: 34,
        label: waiting ? 'Press a key...' : keyLabel(bound[a.id]),
        fontFamily: UI_FONT,
        fontPx: 20,
        color: waiting ? '#f0dc8a' : '#e8e6de',
        fireOn: 'up',
        onClick: () => {
          this.listening = waiting ? null : a.id;
          this.keyNote = '';
          this.show('keys');
        },
      });
      cell.active = waiting; // the lit frame marks the key that is waiting
      cell.refresh();
    });
    this.add
      .text(cx, 150 + perColumn * ROW + 2, this.keyNote, { fontFamily: UI_FONT, fontSize: '18px', color: '#e0806a', align: 'center' })
      .setOrigin(0.5, 0);
    this.button(cx - 150, height - 66, 'Reset to defaults', 24, () => {
      resetKeys();
      this.listening = null;
      this.keyNote = '';
      this.show('keys');
    }, '#c8c6be');
    this.button(cx + 150, height - 66, 'Back', 26, () => this.show('options'), '#a8a69e');
  }

  private show(page: Page): void {
    this.page = page;
    if (page !== 'keys') {
      this.listening = null;
      this.keyNote = '';
    }
    this.children.removeAll(true);
    this.bios = null;
    const { width, height } = this.scale;
    const cx = width / 2;
    // The title art dimmed behind the panel once it is final (Z57), else plain black; either way it blocks the world below.
    const art = titleBackdrop(this, 0, true);
    this.add.rectangle(0, 0, width, height, 0x000000, art ? 0.8 : 0.88).setOrigin(0, 0).setInteractive();
    const panelW = page === 'main' ? 560 : page === 'options' || page === 'restart' || page === 'quit' ? 800 : 1240;
    kitSlice(this, 'kit_panel', Math.round(cx - panelW / 2), 24, panelW, height - 48); // the painted panel behind every page (Z54)
    const title = (text: string, y = 110): void => void this.add.text(cx, y, text, { fontFamily: UI_FONT, fontSize: '56px', color: '#d6d4cc' }).setOrigin(0.5);
    const note = (y: number, text: string, color = '#a8a69e', size = 20): void => void this.add.text(cx, y, text, { fontFamily: UI_FONT, fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);

    if (page === 'main') {
      title('PAUSED');
      let y = 230;
      this.button(cx, y, 'Resume', 32, () => this.close());
      y += 80;
      this.button(cx, y, 'Restart  (R)', 26, () => this.show('restart'), '#c8c6be');
      y += 70;
      this.button(cx, y, 'Options', 26, () => this.show('options'), '#c8c6be');
      y += 70;
      this.button(cx, y, 'Controls', 26, () => this.show('controls'), '#c8c6be');
      y += 70;
      this.button(cx, y, 'Bios', 26, () => this.show('bios'), '#c8c6be');
      y += 70;
      this.button(cx, y, 'Quit to menu', 26, () => this.show('quit'), '#c8c6be');
      note(height - 60, 'Esc: resume', '#a8a69e', 16);
    } else if (page === 'restart' || page === 'quit') {
      const restart = page === 'restart';
      title(restart ? 'Restart?' : 'Quit to menu?');
      note(190, restart ? 'This scene starts again from its beginning.' : (this.hooks.quitNote?.() ?? 'Progress in this scene is lost; Continue starts it again from its beginning.'));
      this.button(cx, 320, restart ? 'Yes, restart  (Enter)' : 'Yes, quit  (Enter)', 30, () => this.leaveWith(restart ? this.hooks.restart : this.hooks.quit));
      this.button(cx, 410, 'Cancel  (Esc)', 26, () => this.back(), '#a8a69e');
    } else if (page === 'options') {
      title('Options', 80);
      drawOptionsPage(this, cx, 190);
      this.button(cx - 110, height - 70, 'Back', 26, () => this.show('main'), '#a8a69e');
      this.button(cx + 110, height - 70, 'Keys', 26, () => this.show('keys'), '#c8c6be');
    } else if (page === 'keys') {
      this.drawKeys(cx, height);
    } else if (page === 'bios') {
      this.bios = drawBiosPage(this, cx, this.hooks.progress(), () => this.show('main'));
    } else {
      title('Controls', 70);
      const style = { fontFamily: UI_FONT, fontSize: '17px', color: '#d6d4cc', lineSpacing: 3, wordWrap: { width: 640 } };
      this.add.text(cx - 570, 140, controlLines(this.hooks.controls()).join('\n'), style);
      const hints = this.hooks.hints();
      if (hints.length > 0) {
        this.add.text(cx + 60, 140, 'Hints at the start', { ...style, color: '#e8c46a' });
        this.add.text(cx + 60, 172, hints.join('\n'), { ...style, wordWrap: { width: 520 } });
      }
      this.button(cx, height - 66, 'Back', 26, () => this.show('main'), '#a8a69e');
    }
  }
}
