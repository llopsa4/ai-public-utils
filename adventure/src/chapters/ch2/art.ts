// Chapter 2's art (placeholders; art/manifest.mjs lists them for Codex): loaded with the chapter,
// in the browser only, and added to the game's art tables (src/game/assets.ts).
import brynJson from '../../../art/src/ch2/characters/bryn.json';
import brynPng from '../../../art/src/ch2/characters/bryn.png';
import brynPortrait from '../../../art/src/ch2/portraits/bryn.png';
import roadRoom from '../../../art/src/ch2/rooms/road.webp';
import workshopRoom from '../../../art/src/ch2/rooms/workshop.webp';
import backroomRoom from '../../../art/src/ch2/rooms/backroom.webp';
import { registerArt } from '../../game/assets';

export function registerChapterArt(): void {
  registerArt({
    rooms: { 'room-road': roadRoom, 'room-workshop': workshopRoom, 'room-backroom': backroomRoom },
    sheets: { bryn: { png: brynPng, json: brynJson } },
    lazySheets: ['bryn'],
    npcSheets: { bryn: 'bryn' },
    portraits: { bryn: brynPortrait },
  });
}
