import { lineKind, lookKey, type CrowdDef, type ExtraDef, type Mood, type Station } from '../../engine/crowd';

/**
 * Background people: the kiln hall's workers and the firing house's kids, rigged from Codex's
 * drawings (art/rig.mjs EXTRAS; the shovel, slate and sack are drawn on them). Nothing here is saved or changes the story; strings live under `name.<id>`, `speaker.<id>`
 * and `line.<id>.*` in en.json.
 */

const st = (id: string, x: number, y: number, face: Station['face'], task: Station['task'], wait: [number, number]): Station =>
  ({ id, x, y, face, task, wait });
const byId = <T extends { id: string }>(list: T[]): Record<string, T> => Object.fromEntries(list.map(s => [s.id, s]));

// ------------------------------------------------------------------ the kiln hall ---
const HALL: CrowdDef = {
  // They keep clear of every spot Mara walks to (tests/crowd.test.ts).
  stations: byId([
    st('mouthA', 338, 304, 'up', 'work', [3500, 6500]),
    st('mouthB', 468, 304, 'up', 'work', [3500, 6500]),
    st('mouthC', 400, 330, 'up', 'work', [3000, 5000]),
    // Hollis spends most of his time clearing the fire, then tips the ash into the cart.
    st('stokerFire', 360, 300, 'up', 'work', [15000, 25000]),
    st('ashCart', 552, 310, 'up', 'reach', [3000, 5000]),
    // Dace sorts reusable pieces from the broken pots in the front-right corner.
    st('brokenPottery', 580, 330, 'right', 'work', [15000, 25000]),
    st('clayPile', 190, 320, 'left', 'work', [2500, 4500]),
    st('pulley', 100, 310, 'up', 'reach', [3000, 5500]),
    st('tallyWall', 60, 330, 'left', 'tap', [3000, 6000]),
    // On the crate (the kiln hall's foreground 'hall-crate', sized to his drawn sitting pose).
    st('bench', 140, 340, 'right', 'sit', [7000, 12000]),
    st('talkSpot', 300, 330, 'left', 'stand', [2500, 5000]),
    st('lookout', 530, 322, 'up', 'stand', [2000, 4000]),
    st('nearTent', 220, 334, 'down', 'stand', [1500, 3000]),
    // Once the kiln is cold: standing about, looking at the dead mouths.
    st('huddle1', 360, 326, 'up', 'stand', [5000, 9000]),
    st('huddle3', 270, 310, 'right', 'stand', [5000, 9000]),
    st('staring', 440, 326, 'up', 'stand', [6000, 10000]),
  ]),
  exits: {
    curtain: { id: 'curtain', x: 612, y: 300, out: { x: 660, y: 300 } },
    west: { id: 'west', x: 20, y: 312, out: { x: -24, y: 312 } },
  },
  wander: { x: 130, y: 300, w: 400, h: 40 },
  extras: [
    {
      id: 'extra-stoker', sheet: 'extra-stoker', met: 'metHollis', body: 0.95, speed: 0.9, color: '#e8a878', carry: 'shovel', carryDrawn: true,
      routines: {
        warm: { stations: ['stokerFire', 'ashCart'] },
        cold: { stations: ['staring', 'huddle1'], detour: 0.1 },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 3, cold: 1 },
    },
    {
      id: 'extra-hoist', sheet: 'extra-hoist', met: 'metWren', body: 0.95, speed: 0.95, color: '#9ed6b8',
      routines: {
        warm: { stations: ['pulley', 'clayPile', 'pulley', 'nearTent'], detour: 0.1 },
        cold: { stations: ['pulley', 'huddle3'], detour: 0.05 },
        // Waiting at the hoist for Mara's hand with the rope.
        errand: { stations: ['pulley'] },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 3, cold: 1 },
    },
    {
      id: 'extra-hauler', sheet: 'extra-hauler', met: 'metDace', body: 1, speed: 0.85, color: '#d9b26a', leavesWhenCold: true,
      routines: {
        warm: { stations: ['brokenPottery'] },
        cold: { stations: ['huddle1'], leave: { exit: 'curtain', chance: 1, away: [0, 0] } },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 2, cold: 1 },
    },
    {
      id: 'extra-tally', sheet: 'extra-tally', met: 'metAnsel', leaving: 2, body: 0.92, speed: 0.7, color: '#b8c8e8', carry: 'slate', carryDrawn: true, leavesWhenCold: true,
      routines: {
        warm: { stations: ['tallyWall', 'mouthA', 'bench', 'lookout'], detour: 0.1, leave: { exit: 'west', chance: 0.1, away: [10000, 18000] } },
        cold: { stations: ['bench'], leave: { exit: 'west', chance: 1, away: [0, 0] } },
      },
      talk: { warm: 4, cold: 2 }, chat: { warm: 3, cold: 1 },
    },
  ],
};

// ---------------------------------------------------------- the firing house's kids ---
const FIRING_HOUSE: CrowdDef = {
  stations: byId([
    st('chalk1', 180, 330, 'right', 'work', [3000, 6000]),
    st('chalk2', 400, 336, 'left', 'work', [3000, 6000]),
    st('soupPeek', 130, 310, 'up', 'reach', [1500, 3000]),
    st('hearthSit', 80, 322, 'left', 'sit', [4000, 8000]),
    // Tag: short waits between far-apart spots, at a run.
    st('tag1', 520, 312, 'left', 'stand', [400, 1200]),
    st('tag2', 560, 340, 'left', 'stand', [400, 1200]),
    st('tag3', 380, 306, 'right', 'stand', [400, 1200]),
    st('tag4', 320, 340, 'right', 'stand', [400, 1200]),
    // The alarm: close to Nell (who stands at 250,300).
    st('byNellA', 276, 330, 'left', 'stand', [6000, 12000]),
    st('byNellB', 226, 324, 'right', 'stand', [6000, 12000]),
    // The cold: huddled by the dead hearth.
    st('coldA', 100, 340, 'left', 'sit', [8000, 14000]),
    st('coldB', 140, 338, 'left', 'sit', [8000, 14000]),
  ]),
  exits: {
    east: { id: 'east', x: 626, y: 326, out: { x: 662, y: 326 } },
  },
  wander: { x: 300, y: 300, w: 250, h: 40 },
  extras: [
    {
      id: 'extra-runner', sheet: 'extra-runner', met: 'metPip', curious: true, body: 0.66, speed: 1.5, color: '#f2d27a',
      routines: {
        warm: { stations: ['tag1', 'chalk2', 'tag2', 'soupPeek', 'tag3', 'tag4'], detour: 0.3, leave: { exit: 'east', chance: 0.12, away: [5000, 10000] } },
        alarm: { stations: ['byNellA'] },
        cold: { stations: ['coldA'] },
      },
      talk: { warm: 3, alarm: 2, cold: 2 }, chat: { warm: 3, alarm: 1, cold: 1 },
    },
    {
      id: 'extra-kid', sheet: 'extra-kid', met: 'metBea', curious: true, body: 0.68, speed: 1.4, color: '#f0a8c0',
      routines: {
        warm: { stations: ['tag3', 'chalk1', 'tag1', 'hearthSit', 'tag4', 'soupPeek', 'tag2'], detour: 0.3 },
        alarm: { stations: ['byNellB'] },
        cold: { stations: ['coldB'] },
      },
      talk: { warm: 3, alarm: 2, cold: 2 }, chat: { warm: 3, alarm: 1, cold: 1 },
    },
  ],
};

// ------------------------------------------------------------------ the ashways' peddler ---
const ASHWAYS: CrowdDef = {
  // Near the way back, out of the way of the valve and the sweeper.
  stations: byId([
    st('stall', 90, 330, 'left', 'stand', [8000, 16000]),
    st('stall2', 130, 334, 'right', 'stand', [5000, 9000]),
  ]),
  exits: {},
  wander: { x: 80, y: 316, w: 60, h: 24 },
  extras: [
    {
      id: 'extra-merchant', sheet: 'extra-merchant', body: 0.95, speed: 0.6, color: '#c8d890', shop: true,
      routines: { warm: { stations: ['stall', 'stall2'] }, cold: { stations: ['stall', 'stall2'] } },
      talk: { warm: 3, cold: 1 }, chat: { warm: 2, cold: 1 },
    },
  ],
};

/** Rooms with background people, by room id. */
export const CROWDS: Record<string, CrowdDef> = { maraRoom: HALL, firingHouse: FIRING_HOUSE, ashways: ASHWAYS };

/** Everyone, in every room. */
export const EXTRAS: ExtraDef[] = Object.values(CROWDS).flatMap(c => c.extras);

/** Every string key the crowds use (checked against en.json by the tests). */
export function crowdKeys(): string[] {
  const n = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}.${i + 1}`);
  return EXTRAS.flatMap(e => {
    const moods: Mood[] = e.routines.alarm ? ['warm', 'alarm', 'cold'] : ['warm', 'cold'];
    return [
      `name.${e.id}`, `speaker.${e.id}`, ...moods.map(m => lookKey(e, m)), ...n(`line.${e.id}.leaving`, e.leaving ?? 0), ...(e.curious ? [`line.${e.id}.follow`] : []),
      ...moods.flatMap(m => (['talk', 'chat'] as const).flatMap(k => { const l = lineKind(e, k, m); return n(l.key, l.count); })),
    ];
  });
}
