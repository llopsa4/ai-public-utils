import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import { ambience } from '../audio/ambience';
import { CALM } from '../audio/mood';
import { resetMoods } from '../render/moods';
import { isFinal, uiOf } from '../render/ui';
import { type Campaign, ENDING, SCENES, TITLES, browserStorage, hasSlot, loadCampaign, newCampaign, replayBase1, saveCampaign } from '../sim/campaign';
import { TITLE_BG, TITLE_LOGO, kitSlice, menuButton, titleBackdrop } from './kit';
import { changeScene } from './Card';
import { type BiosPage, BIOS_PANEL_W, drawBiosPage } from './biosPage';
import { progressOfSave } from '../sim/bios';
import { drawOptionsPage } from './optionsPage';
import { DIFFICULTY_NAME, SCENES as RECORD_SCENES, SCENE_NAME, loadRecords } from '../sim/records';
import { BADGES, DIFFICULTIES, GRADE_NAME, clock } from '../sim/stats';
import { FOOD_SHOWN } from '../sim/food';

const FONT = GAME_FONT;

/** The menu's pages: the title, the "replace your save?" question, the end screen (stage `done`) and Options. */
type Page = 'main' | 'confirm' | 'done' | 'options' | 'records' | 'bios';

/**
 * Title screen: Continue (when a readable save exists) resumes the saved scene's start; New Game starts
 * at the Intro and asks first when any save is in the slot (DESIGN §18). A slot that cannot be read is
 * kept, never erased, and the menu says so.
 */
export class MenuScene extends Phaser.Scene {
  private page: Page = 'main';
  private save: Campaign | null = null;
  private slotUsed = false;
  /** The Bios page while it is showing (its arrow keys and wheel go here). */
  private bios: BiosPage | null = null;

  constructor() {
    super('Menu');
  }

  /** A kit button (Z57); the secondary buttons use a dimmer label colour. */
  private button(x: number, y: number, label: string, size: number, color: string, onClick: () => void, minW = 240): void {
    menuButton(this, x, y, label, FONT, size, onClick, color, minW);
  }

  /** The logo image once it is final, else the plain title text; returns the y of its bottom edge. */
  private drawLogo(cx: number): number {
    if (isFinal(TITLE_LOGO) && this.textures.exists(TITLE_LOGO)) {
      const it = uiOf(TITLE_LOGO);
      const k = 2; // 1x art shown 2x, like the background
      const y = 70;
      this.add.image(cx, y, TITLE_LOGO).setOrigin(0.5, 0).setDisplaySize(it.size[0] * k, it.size[1] * k);
      return y + it.size[1] * k;
    }
    const { height } = this.scale;
    this.add.text(cx, height * 0.26, 'DEAD WOODS', { fontFamily: FONT, fontSize: '72px', color: '#d6d4cc', stroke: '#101210', strokeThickness: 8 }).setOrigin(0.5);
    return height * 0.26 + 40;
  }

  /** Every scene of the story reads the campaign from the registry and saves the next one itself. */
  private play(c: Campaign): void {
    const scene = SCENES[c.stage];
    if (!scene) return this.show('done'); // the story is over: no scene to start
    this.registry.set('campaign', c);
    changeScene(this, scene);
  }

  /** New Game or Replay: the new campaign replaces the old save at once. */
  private begin(c: Campaign): void {
    resetMoods(); // a fresh start: every card neutral until its survivor speaks
    saveCampaign(browserStorage(), c);
    this.play(c);
  }

  private newGame(): void {
    if (this.slotUsed) this.show('confirm');
    else this.begin(newCampaign());
  }

  /** What Enter does on the current page. */
  private enter(): void {
    if (this.page === 'bios') return; // Enter reads nothing on the Bios page
    if (this.page === 'confirm') this.begin(newCampaign());
    else if (this.page === 'done') this.begin(replayBase1(this.save!));
    else if (this.save) this.play(this.save);
    else this.newGame();
  }

  private show(page: Page): void {
    this.page = page;
    this.children.removeAll(true);
    this.bios = null;
    const { width, height } = this.scale;
    const cx = width / 2;
    const art = titleBackdrop(this, page === 'main' ? 0.1 : 0.55); // the options and question pages need a darker veil under their text
    const bottom = page === 'options' || page === 'bios' ? 0 : this.drawLogo(cx); // Options has ten rows: a plain title instead, as in Pause
    /** A line of text on a small paper label (kit_tooltip), so it reads over the art. */
    const note = (y: number, text: string, color = '#d6d4cc', size = 18): void => {
      const t = this.add.text(cx, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);
      const w = Math.round(t.width) + 28;
      const h = Math.round(t.height) + 12;
      kitSlice(this, 'kit_tooltip', Math.round(cx - w / 2), Math.round(y - h / 2), w, h).setDepth(t.depth - 0.5);
      t.setDepth(t.depth + 0.5);
    };
    const primary = '#e8e6de';
    const secondary = '#a8a69e';

    if (page === 'options') {
      // The same layout as the Pause menu's Options page: a title, then the ten rows above the Back button.
      this.add.text(cx, 80, 'Options', { fontFamily: FONT, fontSize: '56px', color: '#d6d4cc', stroke: '#101210', strokeThickness: 6 }).setOrigin(0.5);
      drawOptionsPage(this, cx, 190);
      this.button(cx, height - 50, 'Back', 26, secondary, () => this.show('main'));
      return; // no footer note: the rows use the space
    }
    if (page === 'bios') {
      // The Bios page (DESIGN §24) on a panel of its own, like the Pause menu's: the story up to the save's progress.
      kitSlice(this, 'kit_panel', Math.round(cx - BIOS_PANEL_W / 2), 24, BIOS_PANEL_W, height - 48);
      this.bios = drawBiosPage(this, cx, progressOfSave(this.save!), () => this.show('main'));
      return; // no footer note: the page has its own hint line
    }
    if (page === 'records') {
      this.drawRecords(cx, bottom + 30);
      this.button(cx, height - 50, 'Back', 26, secondary, () => this.show('main'));
      return;
    }
    if (page === 'done') {
      const replayY = Math.max(height * 0.5, bottom + 96);
      note(bottom + 30, ENDING, primary, 28);
      this.button(cx, replayY, 'Replay Base 1', 32, primary, () => this.begin(replayBase1(this.save!)));
      // Z93: Mission 2 is playable before the story reaches it (Z100 wires Base 1 -> Mission 2 -> Base 2 and the save)
      this.button(cx, replayY + 76, 'Mission 2 (preview)', 26, primary, () => {
        this.registry.set('campaign', this.save);
        changeScene(this, 'Mission', { mission: 'm02' }, 'Mission2');
      });
      this.button(cx, replayY + 140, 'Menu', 26, secondary, () => this.show('main'));
    } else if (page === 'confirm') {
      const confirmY = Math.max(height * 0.5 + 20, bottom + 132);
      note(bottom + 30, 'Start a new game?', primary, 28);
      note(bottom + 76, this.save ? 'Your saved game will be replaced.' : 'The save in this browser cannot be read; it will be replaced.');
      this.button(cx, confirmY, 'Yes, new game', 30, primary, () => this.begin(newCampaign()));
      this.button(cx, confirmY + 76, 'Cancel', 26, secondary, () => this.show('main'));
    } else {
      if (!art || !isFinal(TITLE_BG) || !isFinal(TITLE_LOGO)) note(bottom + 24, 'early build - grey placeholders', secondary);
      let y = height * 0.5 + 20;
      if (this.save) {
        this.button(cx, y, 'Continue', 36, primary, () => this.play(this.save!));
        note(y + 52, TITLES[this.save.stage], secondary, 16);
        y += 104;
      } else if (this.slotUsed) {
        note(y - 62, 'The saved game cannot be read. It is kept; New Game will ask before replacing it.', '#b0a07a', 16);
      }
      this.button(cx, y, 'New Game', this.save ? 26 : 36, this.save ? secondary : primary, () => this.newGame());
      if (this.save) {
        // Bios only with a save: it tells the story up to where the save is.
        this.button(cx - 250, y + 76, 'Options', 26, secondary, () => this.show('options'), 200);
        this.button(cx, y + 76, 'Records', 26, secondary, () => this.show('records'), 200);
        this.button(cx + 250, y + 76, 'Bios', 26, secondary, () => this.show('bios'), 200);
      } else {
        this.button(cx - 130, y + 76, 'Options', 26, secondary, () => this.show('options'));
        this.button(cx + 130, y + 76, 'Records', 26, secondary, () => this.show('records'));
      }
    }
    note(height * 0.93, 'Mature content: visible gore.  Desktop: mouse + keyboard.', '#a8a69e', 16);
  }

  /** The Records page (DESIGN §21): per scene and difficulty the best grade and time, then the badges earned. */
  private drawRecords(cx: number, top: number): void {
    const records = loadRecords(browserStorage());
    const lines: { text: string; color: string; size: number }[] = [];
    for (const scene of RECORD_SCENES) {
      lines.push({ text: SCENE_NAME[scene], color: '#e8c46a', size: 22 });
      const bests = DIFFICULTIES.flatMap((d) => (records.best[scene][d] ? [{ d, b: records.best[scene][d]! }] : []));
      if (bests.length === 0) lines.push({ text: 'Not won yet', color: '#a8a69e', size: 16 });
      for (const { d, b } of bests) lines.push({ text: `${DIFFICULTY_NAME[d]}:  ${GRADE_NAME[b.grade] ?? b.grade}  in  ${clock(b.seconds)}`, color: '#e8e6de', size: 18 });
      for (const badge of BADGES[scene]) {
        const earned = records.badges[scene][badge.id];
        if (badge.id === 'wellFed' && !FOOD_SHOWN) continue; // food is hidden until the main camp; an earned one stays stored
        const where = earned ? earned.map((d) => DIFFICULTY_NAME[d]).join(', ') : 'not yet';
        lines.push({ text: `${badge.name} (${badge.note}): ${where}`, color: earned ? '#9bc79b' : '#8a8d86', size: 16 });
      }
    }
    const texts = lines.map((l) => this.add.text(cx, 0, l.text, { fontFamily: FONT, fontSize: `${l.size}px`, color: l.color, align: 'center' }).setOrigin(0.5, 0).setDepth(1)); // above the panel, which sits above the backdrop
    const gap = 6;
    const total = texts.reduce((a, t) => a + t.height + gap, 0);
    const w = Math.max(...texts.map((t) => t.width)) + 56;
    kitSlice(this, 'kit_panel', Math.round(cx - w / 2), top - 14, w, total + 28);
    let y = top;
    for (const t of texts) {
      t.setY(y);
      y += t.height + gap;
    }
  }

  update(): void {
    ambience.update(CALM); // the calm woods bed under the title (DESIGN §6)
  }

  create(): void {
    const storage = browserStorage();
    this.save = loadCampaign(storage);
    this.slotUsed = hasSlot(storage);
    this.show('main');
    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', () => this.enter());
    kb?.on('keydown-ESC', () => {
      if (this.page !== 'main') this.show('main');
    });
    kb?.on('keydown-LEFT', () => this.page === 'bios' && this.bios?.step(-1));
    kb?.on('keydown-RIGHT', () => this.page === 'bios' && this.bios?.step(1));
    kb?.on('keydown-UP', () => this.page === 'bios' && this.bios?.scroll(-48));
    kb?.on('keydown-DOWN', () => this.page === 'bios' && this.bios?.scroll(48));
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => this.page === 'bios' && this.bios?.scroll(dy));
  }
}
