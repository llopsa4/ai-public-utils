// Chapter 2's art (placeholders; art/manifest.mjs lists them for Codex): loaded with the chapter,
// in the browser only, and added to the game's art tables (src/game/assets.ts).
import brynJson from '../../../art/src/ch2/characters/bryn.json';
import brynPng from '../../../art/src/ch2/characters/bryn.png';
import brynPortrait from '../../../art/src/ch2/portraits/bryn.png';
import roadRoom from '../../../art/src/ch2/rooms/road.webp';
import workshopRoom from '../../../art/src/ch2/rooms/workshop.webp';
import backroomRoom from '../../../art/src/ch2/rooms/backroom.webp';
import tunnelMouth from '../../../art/src/ch2/rooms/tunnel-mouth.webp';
import tunnelCollapse from '../../../art/src/ch2/rooms/tunnel-collapse.webp';
import tunnelSteam from '../../../art/src/ch2/rooms/tunnel-steam.webp';
import tunnelCistern from '../../../art/src/ch2/rooms/tunnel-cistern.webp';
import gratePng from '../../../art/src/ch2/objects/grate.png';
import grateJson from '../../../art/src/ch2/objects/grate.json';
import steamPng from '../../../art/src/ch2/objects/steam.png';
import steamJson from '../../../art/src/ch2/objects/steam.json';
import bridgePng from '../../../art/src/ch2/objects/bridge.png';
import bridgeJson from '../../../art/src/ch2/objects/bridge.json';
import basketPng from '../../../art/src/ch2/objects/basket.png';
import basketJson from '../../../art/src/ch2/objects/basket.json';
import ragPng from '../../../art/src/ch2/objects/rag.png';
import ragJson from '../../../art/src/ch2/objects/rag.json';
import ragIcon from '../../../art/src/ch2/items/rag.png';
import ratFight from '../../../art/src/ch2/creatures/cinder-rat.webp';
import ratSprite from '../../../art/src/ch2/creatures/cinder-rat.png';
import packFight from '../../../art/src/ch2/creatures/rat-pack.webp';
import packSprite from '../../../art/src/ch2/creatures/rat-pack.png';
import mitesFight from '../../../art/src/ch2/creatures/ash-mites.webp';
import mitesSprite from '../../../art/src/ch2/creatures/ash-mites.png';
import beetleFight from '../../../art/src/ch2/creatures/pipe-beetle.webp';
import beetleSprite from '../../../art/src/ch2/creatures/pipe-beetle.png';
import { registerArt } from '../../game/assets';

export function registerChapterArt(): void {
  registerArt({
    rooms: {
      'room-tunnel-mouth': tunnelMouth, 'room-tunnel-collapse': tunnelCollapse, 'room-tunnel-steam': tunnelSteam, 'room-tunnel-cistern': tunnelCistern,
      'room-road': roadRoom, 'room-workshop': workshopRoom, 'room-backroom': backroomRoom,
    },
    sheets: {
      bryn: { png: brynPng, json: brynJson },
      grate: { png: gratePng, json: grateJson }, steam: { png: steamPng, json: steamJson },
      bridge: { png: bridgePng, json: bridgeJson }, basket: { png: basketPng, json: basketJson },
      rag: { png: ragPng, json: ragJson },
    },
    lazySheets: ['bryn', 'grate', 'steam', 'bridge', 'basket', 'rag'],
    items: { rag: ragIcon },
    npcSheets: { bryn: 'bryn' },
    portraits: { bryn: brynPortrait },
    // The tunnel creatures fight in the tunnel they come out of (the collapsed tunnel's picture).
    creatures: {
      'cinder-rat': { fight: ratFight, sprite: ratSprite, arena: tunnelCollapse },
      'rat-pack': { fight: packFight, sprite: packSprite, arena: tunnelCollapse },
      'ash-mites': { fight: mitesFight, sprite: mitesSprite, arena: tunnelCollapse },
      'pipe-beetle': { fight: beetleFight, sprite: beetleSprite, arena: tunnelCollapse },
    },
  });
}
