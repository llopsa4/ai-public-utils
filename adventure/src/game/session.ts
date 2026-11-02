import { newGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { Ui } from '../ui/ui';
import type { RoomScene } from './scenes';

/**
 * The single running game: its state (kept only in memory; export/import is the save system),
 * the carried inventory item, the interface and the active room scene.
 */
export class Session {
  state: GameState = newGame();
  selectedItem: string | null = null;
  scene: RoomScene | null = null;
  readonly ui: Ui;

  constructor() {
    this.ui = new Ui({
      getState: () => this.state,
      isBusy: () => this.scene?.isBusy() ?? true,
      selectedItem: () => this.selectedItem,
      selectItem: item => this.selectItem(item),
      replaceState: state => this.replaceState(state),
      newGame,
    });
  }

  selectItem(item: string | null): void {
    this.selectedItem = item;
    this.ui.renderInventory();
    this.ui.setHover('');
  }

  replaceState(state: GameState): void {
    this.state = state;
    this.selectedItem = null;
    this.ui.closeRadial();
    this.ui.skip();
    this.scene?.scene.restart();
  }
}
