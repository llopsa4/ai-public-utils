// The open store on hover (DESIGN-upgrades-3.md `## Open store on hover`): pointing at a finished store swaps its
// sprite for a cutaway and shows small isometric items inside: a basket of fruit, log, bundle of hides or bag of
// pemmican for each fortieth of the camp's capacity. Visual only: it reads the state and changes nothing.
import type Phaser from 'phaser';
import { footprintOf, storeCap, type GameState, type Res } from '../sim/state';
import { entry } from './manifest';
import { worldToTile } from './iso';

const RESOURCES: Res[] = ['food', 'wood', 'hides', 'pemmican'];
/** The small prop that stands for one portion of each resource (a basket of fruit, a log, a bundle of hides, a bag). */
const ITEM_KEY: Record<Res, string> = { food: 'item_basket', wood: 'item_log', hides: 'item_hides', pemmican: 'item_bag' };
/** A full camp store shows this many items of a resource (a portion is then `cap / 40`: 20 food, 15 wood, 4 hides, 10 pemmican). */
export const MAX_ITEMS = 40;
/** The open store's floor, as drawn by `building_store_open`: a diamond this far from its centre to each corner. */
const FLOOR_HW = 100;
const FLOOR_HH = 50;
/** Where each resource's quarter of the floor starts, in floor coordinates (a: along the right-down edge, b: along the left-down one). */
const QUARTER: Record<Res, [number, number]> = { food: [0.06, 0.06], wood: [0.52, 0.06], hides: [0.06, 0.52], pemmican: [0.52, 0.52] };
const QUARTER_SIZE = 0.42;
/** A quarter holds a grid of 5 x 4 slots, and a second layer of items goes on top of the first. */
const COLS = 5;
const ROWS = 4;
const LAYER_PX = 6;
/** How far below the pointer's tile the roof still counts: the store is drawn about 50 px taller than its floor. */
const ROOF_PX = 28;

/** How many items show for `amount` of a resource when the camp holds at most `cap` of it: `ceil(40 x amount / cap)`, 0 when empty. */
export function itemCount(amount: number, cap: number): number {
  if (cap <= 0 || amount <= 0) return 0;
  return Math.min(MAX_ITEMS, Math.ceil((MAX_ITEMS * amount) / cap - 1e-9));
}

/**
 * Where the `i`th item (0-39) of a resource stands: a pixel offset from the open store's centre (the foot of the
 * item), and a depth offset so items nearer the viewer draw over the ones behind. The first 20 items fill the grid
 * back to front; the next 20 sit on top of them.
 */
export function itemSlot(res: Res, i: number): { dx: number; dy: number; depth: number } {
  const layer = i >= COLS * ROWS ? 1 : 0;
  const j = i % (COLS * ROWS);
  const [a0, b0] = QUARTER[res];
  const a = a0 + ((j % COLS) + 0.5) * (QUARTER_SIZE / COLS);
  const b = b0 + (Math.floor(j / COLS) + 0.5) * (QUARTER_SIZE / ROWS);
  return {
    dx: (a - b) * FLOOR_HW,
    dy: (a + b - 1) * FLOOR_HH - layer * LAYER_PX,
    depth: (a + b) + layer * 0.001,
  };
}

/** The finished store under a world point (its floor, or its roof just above), or null. */
export function storeAt(s: GameState, wx: number, wy: number): number | null {
  const stores = s.buildings.filter((b) => b.type === 'store' && b.done);
  for (const [px, py] of [[wx, wy], [wx, wy + ROOF_PX]]) {
    const t = worldToTile(px, py, s.map.size);
    for (const b of stores) {
      if (footprintOf(b.type, b.x, b.y).some(([x, y]) => x === t.x && y === t.y)) return b.id;
    }
  }
  return null;
}

export class StoreHover {
  private open: number | null = null;
  /** One list of item sprites per resource, grown as the stock grows. */
  private items: Record<Res, Phaser.GameObjects.Image[]> = { food: [], wood: [], hides: [], pemmican: [] };

  constructor(private scene: Phaser.Scene) {}

  /** Call every frame with the store views by building id and the world point under the pointer (null when none). */
  update(s: GameState, views: Map<number, Phaser.GameObjects.Image>, world: { x: number; y: number } | null): void {
    const id = world ? storeAt(s, world.x, world.y) : null;
    const view = id === null ? undefined : views.get(id);
    if (id === null || !view) {
      this.close(views);
      return;
    }
    if (this.open !== null && this.open !== id) this.close(views);
    this.open = id;
    view.setTexture('building_store_open');
    for (const res of RESOURCES) {
      const n = itemCount(s.store[res], storeCap(s, res));
      const list = this.items[res];
      const a = entry(ITEM_KEY[res]).anchor;
      for (let i = 0; i < Math.max(n, list.length); i++) {
        if (i >= n) {
          list[i].setVisible(false);
          continue;
        }
        const img = (list[i] ??= this.scene.add.image(0, 0, ITEM_KEY[res]).setOrigin(a[0], a[1]));
        const slot = itemSlot(res, i);
        img.setPosition(view.x + slot.dx, view.y + slot.dy).setDepth(view.depth + 1 + slot.depth).setVisible(true);
      }
    }
  }

  /** The store's roof comes back and the items go. */
  private close(views: Map<number, Phaser.GameObjects.Image>): void {
    if (this.open !== null) views.get(this.open)?.setTexture('building_store');
    this.open = null;
    for (const res of RESOURCES) for (const img of this.items[res]) img.setVisible(false);
  }

  /** The id of the store showing its inside now, and how many items of each resource show, for the smoke test. */
  shown(): { id: number; items: Record<string, number> } | null {
    if (this.open === null) return null;
    const items: Record<string, number> = {};
    for (const res of RESOURCES) items[res] = this.items[res].filter((img) => img.visible).length;
    return { id: this.open, items };
  }
}
