// Prints every room's hotspots, objects and painting as JSON, for art/outlines.py (npm run art:outlines).
import { MANIFEST } from '../art/manifest.mjs';
import { ROOMS as CH1 } from '../src/chapters/ch1/rooms';
import { ROOMS as CH2 } from '../src/chapters/ch2/rooms';
import { ROOMS as INTRO } from '../src/chapters/intro/rooms';

const files = new Map((MANIFEST as { id: string; kind: string; file: string }[]).filter(e => e.kind === 'room').map(e => [e.id, e.file]));
const rooms = Object.values({ ...CH1, ...CH2, ...INTRO }).map(r => ({
  id: r.id,
  background: r.background,
  image: files.get(r.background) ?? null,
  objects: (r.objects ?? []).map(o => o.id),
  hotspots: r.hotspots.map(h => ({ id: h.id, polygon: h.polygon, outline: h.outline ?? null })),
}));
process.stdout.write(JSON.stringify(rooms));
