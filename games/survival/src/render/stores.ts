// The open store on hover (DESIGN-upgrades-3.md `## Open store on hover`): pointing at a finished store swaps its
// sprite for a cutaway and shows one pile per resource inside. Visual only: it reads the state and changes nothing.
import type Phaser from 'phaser';
import { footprintOf, storeCap, type GameState, type Res } from '../sim/state';
import { entry } from './manifest';
import { worldToTile } from './iso';

const PILES: Res[] = ['food', 'wood', 'hides', 'pemmican'];
/** Where each pile stands on the open store's floor, as an offset from the store's centre in pixels. */
const SPOTS: Record<Res, [number, number]> = { food: [-18, -1], wood: [0, -11], hides: [18, -1], pemmican: [0, 9] };
/** How far below the pointer's tile the roof still counts: the store is drawn about 30 px taller than its floor. */
const ROOF_PX = 16;
/** The piles are drawn a little larger than their 32 x 24 canvas so they read inside the small store. */
const PILE_SCALE = 1.3;

/** Pile size 0-4 for `amount` of a resource when the camp holds at most `cap` of it: `ceil(4 * amount / cap)`. */
export function pileSize(amount: number, cap: number): number {
  if (cap <= 0 || amount <= 0) return 0;
  return Math.min(4, Math.ceil((4 * amount) / cap));
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
  private piles: Phaser.GameObjects.Image[] = [];

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
    PILES.forEach((res, i) => {
      const n = pileSize(s.store[res], storeCap(s, res));
      let img = this.piles[i];
      if (!img) img = this.piles[i] = this.scene.add.image(0, 0, `pile_${res}_1`);
      if (n === 0) {
        img.setVisible(false);
        return;
      }
      const [dx, dy] = SPOTS[res];
      const a = entry(`pile_${res}_${n}`).anchor;
      img.setTexture(`pile_${res}_${n}`).setOrigin(a[0], a[1]).setPosition(view.x + dx, view.y + dy + 4).setScale(PILE_SCALE).setDepth(view.depth + 1 + i * 0.01).setVisible(true);
    });
  }

  /** The store's roof comes back and the piles go. */
  private close(views: Map<number, Phaser.GameObjects.Image>): void {
    if (this.open !== null) views.get(this.open)?.setTexture('building_store');
    this.open = null;
    for (const img of this.piles) img.setVisible(false);
  }

  /** The id of the store showing its inside now, and the piles' sizes, for the smoke test. */
  shown(): { id: number; piles: Record<string, string | null> } | null {
    if (this.open === null) return null;
    const piles: Record<string, string | null> = {};
    PILES.forEach((res, i) => (piles[res] = this.piles[i]?.visible ? this.piles[i].texture.key : null));
    return { id: this.open, piles };
  }
}
