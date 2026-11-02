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
  /** Entry Mara is walking in through after a room change (null on load / new game). */
  arrival: string | null = null;
  /** `?debug`: draw walk areas and hotspots. */
  readonly debug = new URLSearchParams(location.search).has('debug');
  readonly ui: Ui;

  constructor() {
    this.ui = new Ui({
      getState: () => this.state,
      isBusy: () => this.scene?.isBusy() ?? true,
      selectedItem: () => this.selectedItem,
      selectItem: item => this.selectItem(item),
      itemClicked: (item, index) => this.scene?.openItemRing(item, index),
      replaceState: state => this.replaceState(state),
      hotspotLabels: () => this.scene?.hotspotLabels() ?? [],
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
    this.ui.hideEnd();
    this.arrival = null;
    this.ui.clearHistory();
    this.ui.skip();
    this.scene?.scene.restart();
  }
}
