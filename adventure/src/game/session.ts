import { readAutosave, writeAutosave } from '../engine/autosave';
import { onSettingsChange, settings } from '../engine/settings';
import { setChapter } from '../chapters';
import { newGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { Ui } from '../ui/ui';
import type { RoomScene, TitleScene } from './scenes';

const AUTOSAVE_DELAY = 400;

/**
 * The single running game: its state (autosaved to this browser; export/import for copies),
 * the carried inventory item, the interface, the title screen and the active room scene.
 */
export class Session {
  state: GameState = newGame();
  selectedItem: string | null = null;
  scene: RoomScene | null = null;
  title: TitleScene | null = null;
  /** True while the title screen is showing (no room is running). */
  onTitle = true;
  /** Entry Mara is walking in through after a room change (null on load / new game). */
  arrival: string | null = null;
  /** The next room fades in slowly (a new story, after the opening). */
  slowFadeIn = false;
  /** `?debug`: draw walk areas and hotspots. */
  readonly debug = new URLSearchParams(location.search).has('debug');
  /** `?debug`: the walk-area overlay (switched in the debug panel). */
  showWalkAreas = true;
  readonly ui: Ui;
  private autosaveTimer = 0;

  constructor() {
    this.ui = new Ui({
      getState: () => this.state,
      isBusy: () => this.onTitle || (this.scene?.isBusy() ?? true),
      selectedItem: () => this.selectedItem,
      selectItem: item => this.selectItem(item),
      itemClicked: (item, index) => this.scene?.openItemRing(item, index),
      replaceState: state => this.replaceState(state),
      hotspotLabels: () => (this.onTitle ? [] : this.scene?.hotspotLabels() ?? []),
      newGame,
      startStory: () => { this.slowFadeIn = true; this.replaceState(newGame()); },
      autosave: () => this.autosave(),
      refreshHeroAppearance: () => this.scene?.refreshObjects(),
      continueGame: () => this.continueGame(),
      toTitle: () => this.toTitle(),
      cycleFocus: direction => (!this.onTitle && this.scene?.cycleFocus(direction)) ?? false,
      activateFocus: () => (!this.onTitle && this.scene?.activateFocus()) ?? false,
    });
    // Effects are built when a room starts: rebuild the current room when the quality changes.
    let quality = settings().visualQuality;
    onSettingsChange(s => {
      if (s.visualQuality === quality) return;
      quality = s.visualQuality;
      if (!this.onTitle && this.scene && !this.scene.isBusy()) this.scene.scene.restart();
    });
  }

  selectItem(item: string | null): void {
    this.selectedItem = item;
    this.ui.renderInventory();
    this.ui.setHover('');
  }

  /** Starts a different game (new, imported or continued): from the title or in place of the current one. */
  replaceState(state: GameState): void {
    this.endBattle();
    setChapter(state.chapter);
    this.state = state;
    this.selectedItem = null;
    this.ui.closeRadial();
    this.ui.hideEnd();
    this.arrival = null;
    this.ui.resetSession();
    this.ui.skip();
    if (this.onTitle) {
      this.onTitle = false;
      this.ui.hideTitle();
      this.title?.scene.start('room');
    } else {
      this.scene?.scene.restart();
    }
  }

  continueGame(): void {
    const saved = readAutosave();
    if (saved.kind === 'ok') this.replaceState(saved.state);
  }

  toTitle(): void {
    if (this.onTitle || !this.scene) return;
    window.clearTimeout(this.autosaveTimer);
    if (!this.scene.isBusy()) writeAutosave(this.state);
    this.endBattle();
    this.onTitle = true;
    this.selectedItem = null;
    this.ui.closeRadial();
    this.ui.hideEnd();
    this.ui.skip();
    this.scene.scene.start('title');
  }

  /** Called by the title scene once it is drawn. */
  onTitleShown(): void {
    this.onTitle = true;
    const saved = readAutosave();
    this.ui.showTitle(saved.kind === 'ok');
    if (saved.kind === 'corrupt') this.ui.toast(this.ui.text('ui.autosaveCorrupt'), 6000);
  }

  /** Saves to this browser shortly after the game settles (never mid-script or on the title). */
  /** Saves at once, even mid-script (just before a fight). */
  saveNow(): void {
    window.clearTimeout(this.autosaveTimer);
    writeAutosave(this.state);
  }

  /** Removes Kiln Courier's battle screen if a fight is on (set by the room while it runs). */
  closeBattle: (() => void) | null = null;

  /** Stops a fight in progress (new game, import, title screen). */
  private endBattle(): void {
    this.closeBattle?.();
    this.closeBattle = null;
  }

  autosave(): void {
    window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => {
      if (this.onTitle || this.scene?.isBusy()) return;
      if (!writeAutosave(this.state)) return;
    }, AUTOSAVE_DELAY);
  }
}
