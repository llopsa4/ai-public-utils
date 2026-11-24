// Draws the ground and what grows on it from the map (art/SPEC.md sections 6 and 7): a ground tile per map tile (a bank
// where grass meets water), spill overlays where forest or berry ground meets grass, trees, a stump where one was
// felled, bushes on berry tiles and a few rocks and tufts. All of it follows the season. Pictures with final art (or the
// `?standins` grey boxes) are drawn from their atlas; a key with no art yet keeps its code placeholder (the ground tiles
// and the trees) or is left out (banks, spills, stumps, bushes, rocks, tufts), so the game looks as before without art.
import Phaser from 'phaser';
import { seasonAt } from '../sim/seasons';
import { footprintOf, type GameState } from '../sim/state';
import { applyArt, fromAtlas, spriteFor } from './art';
import { TILE_H, TILE_W, tileToWorld } from './iso';
import { manifest } from './manifest';
import {
  bankArt, bushKey, bushVariant, groundArt, hash01, propOf, seasonFrame, spillsOf, treeKey, treeVariant,
  type Season, type TileGrid,
} from './terrain';

export const GROUND_DEPTH = -100000;

/** World pixels kept visible beyond the camera: a tree's height, a tile's width, and a frame or two of panning. */
const CULL_MARGIN = 256;

/** Ground tiles per chunk side: a 16 x 16 chunk is one 1024 x 512 texture (96 x 96 tiles are 36 chunks, about 75 MB). */
const CHUNK = 16;
/** Ground tiles are drawn this much larger than their diamond so neighbours overlap and no seam is left between them. */
const SEAM_GROW = 1 + 2 / TILE_W;
/** Chunks redrawn per frame after a season change, so the swap spreads over a few frames instead of one long one. */
const REDRAWS_PER_FRAME = 6;

interface Standing {
  img: Phaser.GameObjects.Image;
  key: string;
  variant: number;
}

/** A square of ground tiles baked into one texture (world rectangle `left, top, right, bottom`). */
interface Chunk {
  rt: Phaser.GameObjects.RenderTexture;
  left: number;
  top: number;
  right: number;
  bottom: number;
  tiles: number[];
  dirty: boolean;
}

export class TerrainView {
  private readonly size: number;
  private readonly seed: number;
  /**
   * The picture each ground tile shows, as an image that is never on the display list: its position is inside its chunk, and
   * its chunk is drawn from these (a bank or tile, then the spills). The 9,216 tiles of the big map cost 17 fps as sprites.
   */
  private readonly ground: Phaser.GameObjects.Image[] = [];
  private readonly chunks: Chunk[] = [];
  private readonly chunkOf: Chunk[] = [];
  private readonly spills = new Map<number, Phaser.GameObjects.Image[]>();
  private readonly trees = new Map<number, Standing>();
  private readonly stumps = new Map<number, Standing>();
  private readonly bushes = new Map<number, Standing>();
  private readonly props = new Map<number, Standing>();
  private readonly seenBuildings = new Set<number>();
  /** The chunks live in a layer at the ground depth: the scene does not re-sort them with the people every frame. */
  private readonly floor: Phaser.GameObjects.Layer;
  private season: Season;
  /** Bumped when a standing sprite is made (a new one is visible until culled); `cull` redoes its pass when this or the view changed. */
  private made = 0;
  private culled = -1;
  private culledView = '';

  constructor(private readonly scene: Phaser.Scene, state: GameState) {
    this.size = state.map.size;
    this.seed = state.map.seed;
    this.season = seasonAt(state.tick);
    this.floor = scene.add.layer().setDepth(GROUND_DEPTH);
    this.makeChunks();
    const { size } = this;
    for (const b of state.buildings) this.seenBuildings.add(b.id);
    const covered = new Set<number>();
    for (const b of state.buildings) for (const [fx, fy] of footprintOf(b.type, b.x, b.y)) covered.add(fy * size + fx);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        this.skinGround(state.map, x, y);
        const type = state.map.tiles[i];
        if (type === 'forest') this.addTree(state.map, x, y);
        else if (type === 'berry') this.addBush(x, y);
        else if (!covered.has(i)) this.addProp(state.map, x, y);
      }
    }
    this.redraw(Infinity);
  }

  /** One texture per square of tiles, each tile's template image placed inside it. */
  private makeChunks(): void {
    const { size, scene } = this;
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    for (let y0 = 0; y0 < size; y0 += CHUNK) {
      for (let x0 = 0; x0 < size; x0 += CHUNK) {
        const x1 = Math.min(size, x0 + CHUNK) - 1;
        const y1 = Math.min(size, y0 + CHUNK) - 1;
        const left = (x0 - y1) * hw + size * hw - hw;
        const top = (x0 + y0) * hh + TILE_H - hh;
        const right = (x1 - y0) * hw + size * hw + hw;
        const bottom = (x1 + y1) * hh + TILE_H + hh;
        const rt = scene.add.renderTexture(left, top, right - left, bottom - top).setOrigin(0, 0);
        this.floor.add(rt);
        const chunk: Chunk = { rt, left, top, right, bottom, tiles: [], dirty: true };
        this.chunks.push(chunk);
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const i = y * size + x;
            const w = tileToWorld(x, y, size);
            this.chunkOf[i] = chunk;
            chunk.tiles.push(i);
            this.ground[i] = applyArt(scene.make.image({ x: w.x - left, y: w.y - top, key: '__DEFAULT' }, false), 'tile_grass');
          }
        }
      }
    }
  }

  /** Draws up to `limit` changed chunks again: the ground and bank images first, then the spills over them. */
  private redraw(limit: number): void {
    let left = limit;
    for (const chunk of this.chunks) {
      if (left <= 0) return;
      if (!chunk.dirty) continue;
      const drawn: Phaser.GameObjects.Image[] = chunk.tiles.map((i) => this.ground[i]);
      for (const i of chunk.tiles) drawn.push(...(this.spills.get(i) ?? []));
      chunk.rt.clear();
      chunk.rt.draw(drawn);
      chunk.dirty = false;
      left--;
    }
  }

  /** Per frame: a new season re-skins everything; a new building clears the props under it. */
  update(state: GameState): void {
    const season = seasonAt(state.tick);
    if (season !== this.season) {
      this.season = season;
      this.reskinAll(state.map);
    }
    for (const b of state.buildings) {
      if (this.seenBuildings.has(b.id)) continue;
      this.seenBuildings.add(b.id);
      for (const [fx, fy] of footprintOf(b.type, b.x, b.y)) this.drop(this.props, fy * this.size + fx);
    }
    this.redraw(REDRAWS_PER_FRAME);
  }

  /**
   * Per frame: only what is near the camera is visible. Phaser sends every visible image to the GPU whether or not it is on
   * screen, and a 96 x 96 map has about 10,000 of them (AC9: 17 fps with all of them submitted, 60 fps with the ground hidden).
   * `view` is the camera's world rectangle; the margin covers a tall tree or a tile's own size.
   */
  cull(view: { x: number; y: number; width: number; height: number }): void {
    // A pass costs about 2 ms: skip it while the camera has not moved a pixel and nothing new was made.
    const where = `${Math.round(view.x)},${Math.round(view.y)},${Math.round(view.width)},${Math.round(view.height)}`;
    if (where === this.culledView && this.made === this.culled) return;
    this.culledView = where;
    this.culled = this.made;
    const left = view.x - CULL_MARGIN;
    const right = view.x + view.width + CULL_MARGIN;
    const top = view.y - CULL_MARGIN;
    const bottom = view.y + view.height + CULL_MARGIN;
    for (const c of this.chunks) {
      const on = c.right >= left && c.left <= right && c.bottom >= top && c.top <= bottom;
      if (c.rt.visible !== on) c.rt.setVisible(on);
    }
    const show = (img: Phaser.GameObjects.Image): void => {
      const on = img.x >= left && img.x <= right && img.y >= top && img.y <= bottom;
      if (img.visible !== on) img.setVisible(on);
    };
    for (const group of [this.trees, this.stumps, this.bushes, this.props]) for (const s of group.values()) show(s.img);
  }

  /** The map changed (a felled tree): the tree goes, a stump stays, and the tile and its neighbours are redrawn. */
  refresh(state: GameState): void {
    const { size } = this;
    for (const [i, tree] of this.trees) {
      if (state.map.tiles[i] === 'forest') continue;
      tree.img.destroy();
      this.trees.delete(i);
      this.addStump(i % size, Math.floor(i / size));
      for (const [dx, dy] of [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = (i % size) + dx;
        const y = Math.floor(i / size) + dy;
        if (x >= 0 && y >= 0 && x < size && y < size) this.skinGround(state.map, x, y);
      }
    }
  }

  /** The frame a tile's ground image shows now (`null` for a tile that does not exist), for the tests and debugging. */
  groundFrame(x: number, y: number): string | null {
    const img = this.ground[y * this.size + x];
    return img ? String(img.frame.name) : null;
  }

  /** Counts of what is drawn, for the debug hook. */
  counts(): { ground: number; spills: number; trees: number; stumps: number; bushes: number; props: number; chunks: number; chunksShown: number } {
    let spills = 0;
    for (const list of this.spills.values()) spills += list.length;
    return {
      ground: this.ground.length, spills, trees: this.trees.size, stumps: this.stumps.size, bushes: this.bushes.size, props: this.props.size,
      chunks: this.chunks.length, chunksShown: this.chunks.filter((c) => c.rt.visible).length,
    };
  }

  private reskinAll(map: TileGrid & { seed: number }): void {
    const { size, season } = this;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) this.skinGround(map, x, y);
    const frame = (s: Standing): string => seasonFrame(s.key, season, s.variant);
    for (const group of [this.trees, this.stumps, this.bushes, this.props]) {
      for (const s of group.values()) applyArt(s.img, s.key, frame(s));
    }
  }

  /** Sets the ground image of one tile (its bank, else its tile variant) and its spill overlays. */
  private skinGround(map: TileGrid, x: number, y: number): void {
    const { size, season, seed } = this;
    const i = y * size + x;
    const img = this.ground[i];
    let art = bankArt(map, x, y, season);
    if (art && !fromAtlas(this.scene, art.key, art.frame)) art = null; // no bank art yet: the plain grass tile
    art ??= groundArt(map, seed, x, y, season);
    applyArt(img, art.key, art.frame);
    // A hard-edged diamond drawn at half size has half-transparent edge pixels, and the chunk under it is empty, so every shared edge
    // would show a faint dark seam when the chunk is magnified. Each ground tile overlaps its neighbours by a pixel instead.
    img.setScale(img.scaleX * SEAM_GROW, img.scaleY * SEAM_GROW);
    if (manifest[art.key].status === 'placeholder') {
      // A placeholder tile gets a little brightness noise so the flat colour is not a grid (final art needs none).
      const v = 0xff - Math.floor(hash01(x, y, 1) * 22);
      img.setTint((v << 16) | (v << 8) | v);
    } else {
      img.clearTint();
    }

    for (const old of this.spills.get(i) ?? []) old.destroy();
    this.spills.delete(i);
    const made: Phaser.GameObjects.Image[] = [];
    const chunk = this.chunkOf[i];
    const w = tileToWorld(x, y, size);
    for (const sp of spillsOf(map, x, y)) {
      const frame = seasonFrame(sp.key, season, sp.edge);
      if (!fromAtlas(this.scene, sp.key, frame)) continue; // spills have no placeholder
      made.push(applyArt(this.scene.make.image({ x: w.x - chunk.left, y: w.y - chunk.top, key: '__DEFAULT' }, false), sp.key, frame));
    }
    if (made.length > 0) this.spills.set(i, made);
    chunk.dirty = true;
  }

  /** A standing sprite on a tile, jittered a little, depth-sorted by its base; null when its art does not exist yet. */
  private stand(group: Map<number, Standing>, key: string, variant: number, x: number, y: number, dx: number, dy: number, placeholder: boolean): void {
    const frame = seasonFrame(key, this.season, variant);
    if (!placeholder && !fromAtlas(this.scene, key, frame)) return;
    const w = tileToWorld(x, y, this.size);
    const img = spriteFor(this.scene, key, w.x + dx, w.y + dy, frame).setDepth(w.y + dy);
    group.set(y * this.size + x, { img, key, variant });
    this.made++;
  }

  private addTree(map: TileGrid, x: number, y: number): void {
    const jx = (hash01(x, y, 2) - 0.5) * 16;
    const jy = (hash01(x, y, 3) - 0.5) * 6;
    // Trees keep a code placeholder, so they are always drawn.
    this.stand(this.trees, treeKey(map, this.seed, x, y), treeVariant(this.seed, x, y), x, y, jx, 8 + jy, true);
  }

  private addStump(x: number, y: number): void {
    const jx = (hash01(x, y, 2) - 0.5) * 16;
    const jy = (hash01(x, y, 3) - 0.5) * 6;
    this.stand(this.stumps, 'stump_tree', 0, x, y, jx, 8 + jy, false);
  }

  private addBush(x: number, y: number): void {
    const jx = (hash01(x, y, 4) - 0.5) * 10;
    const jy = (hash01(x, y, 5) - 0.5) * 4;
    this.stand(this.bushes, bushKey(this.seed, x, y), bushVariant(this.seed, x, y), x, y, jx, 6 + jy, false);
  }

  private addProp(map: TileGrid, x: number, y: number): void {
    const prop = propOf(map, this.seed, x, y);
    if (!prop) return;
    const jx = (hash01(x, y, 6) - 0.5) * 24;
    const jy = (hash01(x, y, 7) - 0.5) * 8;
    this.stand(this.props, prop.key, prop.variant, x, y, jx, 8 + jy, false);
  }

  private drop(group: Map<number, Standing>, i: number): void {
    group.get(i)?.img.destroy();
    group.delete(i);
  }
}
