import type { Exit, Routine, Station, WanderBox } from '../engine/crowd';
import type { MET_FLAGS } from '../engine/state';
import type { ExtraId } from '../engine/types';

/**
 * Background people: the kiln hall's workers and the firing house's kids. Placeholder art
 * (recoloured variants of the three bodies, art/rig.mjs EXTRAS): each sheet can be replaced on its
 * own. Nothing here is saved or changes the story; strings live under `name.<id>`, `speaker.<id>`
 * and `line.<id>.*` in en.json.
 */

const st = (id: string, x: number, y: number, face: Station['face'], task: Station['task'], wait: [number, number]): Station =>
  ({ id, x, y, face, task, wait });
const byId = <T extends { id: string }>(list: T[]): Record<string, T> => Object.fromEntries(list.map(s => [s.id, s]));

/** What someone holds: a placeholder sprite made in code (game/Crowd.ts). */
export type Carry = 'shovel' | 'broom' | 'slate' | 'sack';

/**
 * The story moment a room's people react to: normal, the alarm (the kiln groaning, before the
 * shutdown) and the cold kiln.
 */
export type Mood = 'warm' | 'alarm' | 'cold';

/** How many lines of a kind someone has per mood (`line.<id>.<kind>`, `<kind>Alarm`, `<kind>Cold` + `.1..n`). */
export interface LineCounts { warm: number; alarm?: number; cold: number }

export interface ExtraDef {
  id: ExtraId;
  /** Sprite sheet (art/src/characters/<sheet>.webp). */
  sheet: ExtraId;
  /** Size relative to an adult, for hit boxes and the speech point. */
  body: number;
  /** Walking speed relative to Mara. */
  speed: number;
  /** Routines per mood; without an `alarm` routine the warm one carries on through the alarm. */
  routines: { warm: Routine; alarm?: Routine; cold: Routine };
  /** Leaves for good when the kiln goes cold (and is gone if the room is entered cold). */
  leavesWhenCold?: boolean;
  carry?: Carry;
  /** The hauler only has a sack between the clay pile and a kiln mouth. */
  carryBetween?: { pick: string; drop: string[] };
  /** Ring tone of the name in the dialogue panel. */
  color: string;
  talk: LineCounts;
  chat: LineCounts;
  /** Flag set the first time Mara talks to them (the notebook counts the people met). */
  met?: (typeof MET_FLAGS)[number];
  /** Talking opens the merchant's stall after their line. */
  shop?: boolean;
  /** Kids tag along a few steps when Mara walks past. */
  curious?: boolean;
  /** How many lines they may say on their way out (`line.<id>.leaving.n`). */
  leaving?: number;
}

export interface CrowdDef {
  stations: Record<string, Station>;
  exits: Record<string, Exit>;
  /** Where detours wander (clamped to the floor by the scene). */
  wander: WanderBox;
  extras: ExtraDef[];
}

// ------------------------------------------------------------------ the kiln hall ---
const HALL: CrowdDef = {
  // They keep clear of every spot Mara walks to (tests/crowd.test.ts).
  stations: byId([
    st('mouthA', 340, 244, 'up', 'work', [3500, 6500]),
    st('mouthB', 462, 242, 'up', 'work', [3500, 6500]),
    st('mouthC', 540, 264, 'up', 'work', [3000, 5000]),
    st('clayPile', 140, 282, 'left', 'work', [2500, 4500]),
    st('pulley', 96, 272, 'up', 'reach', [3000, 5500]),
    st('tallyWall', 150, 312, 'left', 'tap', [3000, 6000]),
    st('bench', 130, 332, 'right', 'sit', [7000, 12000]),
    st('talkSpot', 384, 282, 'left', 'stand', [2500, 5000]),
    st('lookout', 500, 300, 'up', 'stand', [2000, 4000]),
    st('nearTent', 230, 296, 'down', 'stand', [1500, 3000]),
    // Once the kiln is cold: standing about, looking at the dead mouths.
    st('huddle1', 336, 284, 'up', 'stand', [5000, 9000]),
    st('huddle3', 300, 304, 'right', 'stand', [5000, 9000]),
    st('staring', 450, 268, 'up', 'stand', [6000, 10000]),
  ]),
  exits: {
    curtain: { id: 'curtain', x: 592, y: 244, out: { x: 632, y: 238 } },
    west: { id: 'west', x: 54, y: 248, out: { x: 6, y: 248 } },
  },
  wander: { x: 130, y: 272, w: 400, h: 70 },
  extras: [
    {
      id: 'extra-stoker', sheet: 'extra-stoker', met: 'metHollis', body: 0.95, speed: 0.9, color: '#e8a878', carry: 'shovel',
      routines: {
        warm: { stations: ['mouthA', 'mouthB', 'mouthC', 'mouthB', 'talkSpot'], detour: 0.15 },
        cold: { stations: ['staring', 'huddle1'], detour: 0.1 },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 3, cold: 1 },
    },
    {
      id: 'extra-hoist', sheet: 'extra-hoist', met: 'metWren', body: 0.95, speed: 0.95, color: '#9ed6b8',
      routines: {
        warm: { stations: ['pulley', 'clayPile', 'pulley', 'nearTent'], detour: 0.1 },
        cold: { stations: ['pulley', 'huddle3'], detour: 0.05 },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 3, cold: 1 },
    },
    {
      id: 'extra-hauler', sheet: 'extra-hauler', met: 'metDace', leaving: 2, body: 1, speed: 0.85, color: '#d9b26a', carry: 'sack', leavesWhenCold: true,
      carryBetween: { pick: 'clayPile', drop: ['mouthA', 'mouthB'] },
      routines: {
        warm: { stations: ['clayPile', 'mouthA', 'clayPile', 'mouthB'], detour: 0.05, leave: { exit: 'curtain', chance: 0.12, away: [9000, 16000] } },
        cold: { stations: ['huddle1'], leave: { exit: 'curtain', chance: 1, away: [0, 0] } },
      },
      talk: { warm: 3, cold: 2 }, chat: { warm: 2, cold: 1 },
    },
    {
      id: 'extra-tally', sheet: 'extra-tally', met: 'metAnsel', leaving: 2, body: 0.92, speed: 0.7, color: '#b8c8e8', carry: 'slate', leavesWhenCold: true,
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
    st('chalk1', 230, 340, 'right', 'work', [3000, 6000]),
    st('chalk2', 430, 336, 'left', 'work', [3000, 6000]),
    st('soupPeek', 226, 266, 'up', 'reach', [1500, 3000]),
    st('hearthSit', 196, 318, 'left', 'sit', [4000, 8000]),
    // Tag: short waits between far-apart spots, at a run.
    st('tag1', 500, 300, 'left', 'stand', [400, 1200]),
    st('tag2', 570, 342, 'left', 'stand', [400, 1200]),
    st('tag3', 400, 296, 'right', 'stand', [400, 1200]),
    st('tag4', 330, 344, 'right', 'stand', [400, 1200]),
    // The alarm: close to Nell (who stands at 292,292).
    st('byNellA', 322, 316, 'left', 'stand', [6000, 12000]),
    st('byNellB', 262, 312, 'right', 'stand', [6000, 12000]),
    // The cold: huddled by the dead hearth.
    st('coldA', 198, 292, 'left', 'sit', [8000, 14000]),
    st('coldB', 214, 316, 'left', 'sit', [8000, 14000]),
  ]),
  exits: {
    east: { id: 'east', x: 626, y: 326, out: { x: 662, y: 326 } },
  },
  wander: { x: 330, y: 300, w: 270, h: 50 },
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
    st('stall', 112, 296, 'left', 'stand', [8000, 16000]),
    st('stall2', 128, 318, 'right', 'stand', [5000, 9000]),
  ]),
  exits: {},
  wander: { x: 100, y: 290, w: 40, h: 30 },
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

/** The routine for a mood (the warm one carries on through the alarm if there is no alarm routine). */
export function routineFor(def: ExtraDef, mood: Mood): Routine {
  return mood === 'alarm' ? def.routines.alarm ?? def.routines.warm : def.routines[mood];
}

const SUFFIX: Record<Mood, string> = { warm: '', alarm: 'Alarm', cold: 'Cold' };

/** The string key prefix for a kind of line in a mood, falling back to warm lines when there are none. */
export function lineKind(def: ExtraDef, kind: 'talk' | 'chat', mood: Mood): { key: string; count: number } {
  const counts = def[kind];
  const m = mood === 'alarm' && !counts.alarm ? 'warm' : mood;
  return { key: `line.${def.id}.${kind}${SUFFIX[m]}`, count: counts[m]! };
}

export function lookKey(def: ExtraDef, mood: Mood): string {
  const m = mood === 'alarm' && !def.routines.alarm ? 'warm' : mood;
  return `line.${def.id}.look${SUFFIX[m]}`;
}

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
