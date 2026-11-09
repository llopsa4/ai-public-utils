// The intro's art (placeholders; art/manifest.mjs lists them for Codex): loaded with the chapter,
// in the browser only, and added to the game's art tables (src/game/assets.ts).
import cellRoom from '../../../art/src/intro/rooms/cell.webp';
import guardroomRoom from '../../../art/src/intro/rooms/guardroom.webp';
import doorRoom from '../../../art/src/intro/rooms/prison-door.webp';
import { registerArt } from '../../game/assets';

const sheetPngs = import.meta.glob('../../../art/src/intro/characters/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const sheetJsons = import.meta.glob('../../../art/src/intro/characters/*.json', { eager: true, import: 'default' }) as Record<string, never>;
const objectPngs = import.meta.glob('../../../art/src/intro/objects/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const objectJsons = import.meta.glob('../../../art/src/intro/objects/*.json', { eager: true, import: 'default' }) as Record<string, never>;
const portraitPngs = import.meta.glob('../../../art/src/intro/portraits/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const itemPngs = import.meta.glob('../../../art/src/intro/items/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const byName = <T>(files: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(files).map(([path, v]) => [path.replace(/^.*\/([\w-]+)\.\w+$/, '$1'), v]));

export function registerChapterArt(): void {
  const pngs = { ...byName(sheetPngs), ...byName(objectPngs) }, jsons = { ...byName(sheetJsons), ...byName(objectJsons) };
  registerArt({
    rooms: { 'room-cell': cellRoom, 'room-guardroom': guardroomRoom, 'room-prison-door': doorRoom },
    sheets: Object.fromEntries(Object.keys(pngs).map(id => [id, { png: pngs[id], json: jsons[id] }])),
    lazySheets: Object.keys(pngs),
    items: byName(itemPngs),
    npcSheets: { guard: 'guard', warden: 'warden', sigrid: 'sigrid' },
    portraits: byName(portraitPngs),
  });
}
