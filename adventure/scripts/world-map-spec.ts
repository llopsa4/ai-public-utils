// The layout image for Codex's world map (art/spec/world-map.png): the land from src/content/world.ts
// with every place's mark and name, so the painting puts each place exactly where the game pins it.
// Written by npm run art:guide.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LAND, MAP_SIZE, PLACES, labelAt } from '../src/content/world';
import en from '../src/content/strings/en.json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function writeWorldMapSpec(): Promise<string> {
  const names = en as Record<string, string>;
  const peaks = (list: [number, number][], s: number) => list.map(([x, y]) => `<path d="M${x - s},${y + s * 0.6} L${x},${y - s * 0.9} L${x + s},${y + s * 0.6}" fill="none" stroke="#5a3a20" stroke-width="2"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_SIZE.w * 2}" height="${MAP_SIZE.h * 2}" viewBox="0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}">
  <rect width="100%" height="100%" fill="#e9d6a8"/>
  <path d="${LAND.coast}" fill="#d6be8c" stroke="#5a3a20" stroke-width="2.5"/>
  <path d="${LAND.snow}" fill="#ffffff" fill-opacity="0.6" stroke="#9a8060" stroke-dasharray="4 5"/>
  <path d="${LAND.rift}" fill="none" stroke="#3a2414" stroke-width="6"/>
  <path d="${LAND.river}" fill="none" stroke="#46769a" stroke-width="3.5"/>
  <path d="${LAND.road}" fill="none" stroke="#784620" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>
  ${peaks(LAND.hills, 10)}${peaks(LAND.mountains, 16)}
  ${LAND.forest.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#46643280" stroke="#324620"/>`).join('')}
  ${LAND.ash.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#50463c"/>`).join('')}
  ${Object.values(PLACES).map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.kind === 'town' ? 7 : 5}" fill="#f4e6c6" stroke="#4a2a14" stroke-width="2.5"/>
  <text x="${labelAt(p).x}" y="${labelAt(p).y}" text-anchor="${labelAt(p).anchor}" font-family="Georgia, serif" font-style="italic" font-weight="600" font-size="20" fill="#3a2414">${names[p.name]}</text>`).join('')}
  <text x="20" y="${MAP_SIZE.h - 18}" font-family="Georgia, serif" font-size="16" fill="#8a2a18">Layout only: paint the land, no words. The Rift is the dark chasm; Spanwick is its one bridge.</text>
</svg>`;
  const out = join(root, 'art', 'spec', 'world-map.png');
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(out);
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) console.log(`Wrote ${await writeWorldMapSpec()}`);
