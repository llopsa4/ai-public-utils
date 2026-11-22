// Loads the art atlases (art/atlas/<group>.json, Phaser multiatlas pages; art/SPEC.md section 8). Boot calls
// loadAtlases(); until a key is `final` the game draws its code placeholder (art.ts decides per key).
// With `?standins` on the dev server it loads the grey stand-ins in art/standins/atlas/ instead (git-ignored, so the
// published build never contains them).
import type Phaser from 'phaser';
import { standJson, standPng } from './standinFiles';
import { standinsOn } from './standins';

interface AtlasJson {
  textures: { image: string }[];
}

// Vite resolves these globs at build time; a folder with no files gives an empty map.
const realJson = import.meta.glob('../../art/atlas/*.json', { eager: true, import: 'default' }) as Record<string, AtlasJson>;
const realPng = import.meta.glob('../../art/atlas/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;

/** `art/atlas/ground.json` -> `ground`. */
function groupOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');
}

/** The atlas groups available, each with its data and the resolved URL of each page. */
export function atlasGroups(): Map<string, AtlasJson> {
  const json = (standinsOn() ? standJson : realJson) as Record<string, AtlasJson>;
  const png = standinsOn() ? standPng : realPng;
  const out = new Map<string, AtlasJson>();
  for (const [path, data] of Object.entries(json)) {
    const dir = path.slice(0, path.lastIndexOf('/') + 1);
    // The page file names inside the JSON are relative to the JSON; point them at the bundled URLs.
    const textures = data.textures.map((t) => {
      const url = png[dir + t.image];
      if (!url) throw new Error(`Atlas ${path} names a page that does not exist: ${t.image}`);
      return { ...t, image: url };
    });
    out.set(groupOf(path), { ...data, textures });
  }
  return out;
}

/** Queues every atlas on the scene's loader and draws a progress bar while they load. */
export function loadAtlases(scene: Phaser.Scene): void {
  const groups = atlasGroups();
  if (groups.size === 0) return;
  const w = scene.scale.width;
  const h = scene.scale.height;
  const frame = scene.add.rectangle(w / 2, h / 2, 404, 24).setStrokeStyle(2, 0xe6d3a3);
  const bar = scene.add.rectangle(w / 2 - 200, h / 2, 0, 16, 0xe6d3a3).setOrigin(0, 0.5);
  scene.load.on('progress', (v: number) => bar.setSize(400 * v, 16));
  scene.load.once('complete', () => {
    frame.destroy();
    bar.destroy();
  });
  // The page URL is already complete, so the loader path stays empty.
  for (const [group, data] of groups) scene.load.multiatlas(group, data as unknown as string, '') /* Phaser also takes the parsed JSON */;
}
