import type { Exit, Routine, Station, WanderBox } from '../engine/crowd';
import type { ExtraId } from '../engine/types';

/**
 * The kiln hall's background people. Placeholder art (recoloured variants of the three bodies,
 * art/rig.mjs EXTRAS): each sheet can be replaced on its own. Nothing here is saved or changes
 * the story; strings live under `name.<id>`, `speaker.<id>` and `line.<id>.*` in en.json.
 */

const st = (id: string, x: number, y: number, face: Station['face'], task: Station['task'], wait: [number, number]): Station =>
  ({ id, x, y, face, task, wait });

/** Kiln hall stations. They keep clear of every spot Mara walks to (tests/crowd.test.ts). */
export const HALL_STATIONS: Record<string, Station> = Object.fromEntries([
  st('mouthA', 340, 244, 'up', 'work', [3500, 6500]),
  st('mouthB', 462, 242, 'up', 'work', [3500, 6500]),
  st('mouthC', 540, 264, 'up', 'work', [3000, 5000]),
  st('clayPile', 140, 282, 'left', 'work', [2500, 4500]),
  st('pulley', 96, 272, 'up', 'reach', [3000, 5500]),
  st('tallyWall', 150, 312, 'left', 'tap', [3000, 6000]),
  st('bench', 130, 332, 'right', 'sit', [7000, 12000]),
  st('sweep1', 200, 302, 'left', 'sweep', [2500, 4000]),
  st('sweep2', 320, 306, 'right', 'sweep', [2500, 4000]),
  st('sweep3', 430, 324, 'right', 'sweep', [2500, 4000]),
  st('sweep4', 300, 342, 'left', 'sweep', [2500, 4000]),
  st('talkSpot', 384, 282, 'left', 'stand', [2500, 5000]),
  st('lookout', 500, 300, 'up', 'stand', [2000, 4000]),
  st('cartSide', 470, 276, 'right', 'stand', [1500, 3000]),
  st('nearTent', 230, 296, 'down', 'stand', [1500, 3000]),
  // Once the kiln is cold: standing about, looking at the dead mouths.
  st('huddle1', 336, 284, 'up', 'stand', [5000, 9000]),
  st('huddle2', 356, 300, 'left', 'stand', [5000, 9000]),
  st('huddle3', 300, 304, 'right', 'stand', [5000, 9000]),
  st('staring', 450, 268, 'up', 'stand', [6000, 10000]),
].map(s => [s.id, s]));

export const HALL_EXITS: Record<string, Exit> = {
  curtain: { id: 'curtain', x: 592, y: 244, out: { x: 632, y: 238 } },
  west: { id: 'west', x: 54, y: 248, out: { x: 6, y: 248 } },
};

/** Where detours wander (clamped to the floor by the scene). */
export const HALL_WANDER: WanderBox = { x: 130, y: 272, w: 400, h: 70 };

/** What someone holds: a placeholder sprite made in code (game/Crowd.ts). */
export type Carry = 'shovel' | 'broom' | 'slate' | 'sack';

export interface ExtraDef {
  id: ExtraId;
  /** Sprite sheet (art/src/characters/<sheet>.webp). */
  sheet: ExtraId;
  /** Size relative to an adult, for hit boxes and the speech point. */
  body: number;
  /** Walking speed relative to Mara. */
  speed: number;
  warm: Routine;
  cold: Routine;
  /** Leaves the hall for good when the kiln goes cold (and is gone if the hall is entered cold). */
  leavesWhenCold?: boolean;
  carry?: Carry;
  /** The hauler only has a sack between the clay pile and a kiln mouth. */
  carryBetween?: { pick: string; drop: string[] };
  /** Ring tone of the name in the dialogue panel and chatter bubbles. */
  color: string;
  talk: number;
  talkCold: number;
  chat: number;
  chatCold: number;
}

export const EXTRAS: ExtraDef[] = [
  {
    id: 'extra-stoker', sheet: 'extra-stoker', body: 0.95, speed: 0.9, color: '#e8a878', carry: 'shovel',
    warm: { stations: ['mouthA', 'mouthB', 'mouthC', 'mouthB', 'talkSpot'], detour: 0.15 },
    cold: { stations: ['staring', 'huddle1'], detour: 0.1 },
    talk: 3, talkCold: 2, chat: 3, chatCold: 1,
  },
  {
    id: 'extra-hoist', sheet: 'extra-hoist', body: 0.95, speed: 0.95, color: '#9ed6b8',
    warm: { stations: ['pulley', 'clayPile', 'pulley', 'nearTent'], detour: 0.1 },
    cold: { stations: ['pulley', 'huddle3'], detour: 0.05 },
    talk: 3, talkCold: 2, chat: 3, chatCold: 1,
  },
  {
    id: 'extra-hauler', sheet: 'extra-hauler', body: 1, speed: 0.85, color: '#d9b26a', carry: 'sack', leavesWhenCold: true,
    carryBetween: { pick: 'clayPile', drop: ['mouthA', 'mouthB'] },
    warm: { stations: ['clayPile', 'mouthA', 'clayPile', 'mouthB'], detour: 0.05, leave: { exit: 'curtain', chance: 0.12, away: [9000, 16000] } },
    cold: { stations: ['huddle2'], leave: { exit: 'curtain', chance: 1, away: [0, 0] } },
    talk: 3, talkCold: 2, chat: 2, chatCold: 1,
  },
  {
    id: 'extra-sweeper', sheet: 'extra-sweeper', body: 0.95, speed: 0.8, color: '#c8b4e0', carry: 'broom',
    warm: { stations: ['sweep1', 'sweep2', 'sweep3', 'sweep4'], detour: 0.1 },
    cold: { stations: ['sweep2', 'huddle1', 'sweep4'], detour: 0.05 },
    talk: 3, talkCold: 2, chat: 3, chatCold: 1,
  },
  {
    id: 'extra-runner', sheet: 'extra-runner', body: 0.66, speed: 1.5, color: '#f2d27a', leavesWhenCold: true,
    warm: { stations: ['talkSpot', 'pulley', 'lookout', 'cartSide', 'nearTent', 'bench'], detour: 0.35, leave: { exit: 'curtain', chance: 0.22, away: [6000, 12000] } },
    cold: { stations: ['huddle2'], leave: { exit: 'curtain', chance: 1, away: [0, 0] } },
    talk: 3, talkCold: 2, chat: 3, chatCold: 1,
  },
  {
    id: 'extra-tally', sheet: 'extra-tally', body: 0.92, speed: 0.7, color: '#b8c8e8', carry: 'slate', leavesWhenCold: true,
    warm: { stations: ['tallyWall', 'mouthA', 'bench', 'lookout'], detour: 0.1, leave: { exit: 'west', chance: 0.1, away: [10000, 18000] } },
    cold: { stations: ['bench'], leave: { exit: 'west', chance: 1, away: [0, 0] } },
    talk: 4, talkCold: 2, chat: 3, chatCold: 1,
  },
];

/** Every string key the crowd uses (checked against en.json by the tests). */
export function crowdKeys(): string[] {
  const n = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}.${i + 1}`);
  return EXTRAS.flatMap(e => [
    `name.${e.id}`, `speaker.${e.id}`, `line.${e.id}.look`, `line.${e.id}.lookCold`,
    ...n(`line.${e.id}.talk`, e.talk), ...n(`line.${e.id}.talkCold`, e.talkCold),
    ...n(`line.${e.id}.chat`, e.chat), ...n(`line.${e.id}.chatCold`, e.chatCold),
  ]);
}
