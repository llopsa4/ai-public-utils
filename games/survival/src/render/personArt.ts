// Which picture a person shows (art/SPEC.md section 4, art/STYLE.md section 5): the model key, the facing from
// screen-space movement, the animation for their state and job, and the frame at a moment. Pure: no Phaser, so the
// tests can check it.
import type { Building, Person } from '../sim/state';
import { isSitting, materialsComplete } from '../sim/buildings';
import { sexOf } from '../sim/people';
import { FACINGS, entry } from './manifest';

export type Facing = (typeof FACINGS)[number];
/** The attack a fighter plays: bow, lance or club (`combat.ts` `fighterOf`). */
export type Weapon = 'shoot' | 'thrust' | 'strike';

/** The model of a person: man, woman, elder man, elder woman, or the one child model. */
export function personKey(p: Pick<Person, 'id' | 'age'> & { sex?: Person['sex'] }): string {
  if (p.age === 'child') return 'person_child';
  const sex = sexOf(p) === 'female' ? 'woman' : 'man';
  return p.age === 'elder' ? `person_elder_${sex}` : `person_${sex}`;
}

/** Screen movement (world px) below this length keeps the previous facing. */
const STILL = 0.05;

/**
 * The facing for a screen-space movement (x right, y down the screen), one of 8 sectors of 45 degrees: `s` is down
 * the screen, `e` to the right. A movement too small to read keeps `prev`.
 */
export function facingFrom(dx: number, dy: number, prev: Facing = 's'): Facing {
  if (Math.hypot(dx, dy) < STILL) return prev;
  // Angle from straight down, turning towards the left (s 0, sw 45, w 90, ... se 315), as FACINGS lists them.
  const deg = (Math.atan2(-dx, dy) * 180) / Math.PI;
  return FACINGS[((Math.round(deg / 45) % 8) + 8) % 8];
}

/** The animation for a person's state and job, before checking that their model has it (`playable`). */
export interface AnimPick {
  anim: string;
  /** Playback speed: flee plays `walk` at 1.5x. */
  rate: number;
}

/** A drafted person's attack, as `combat.ts` `fighterOf` picks the fighter: bow for hunters and archers, lance for lancers, else a club. */
export function weaponOf(p: Pick<Person, 'society'>): Weapon {
  if (p.society === 'lancers') return 'thrust';
  return p.society === 'hunters' || p.society === 'archers' ? 'shoot' : 'strike';
}

/** True while a fighter or hunter is in a fight: standing, and their weapon has fired in the last cooldown. */
function attacking(p: Person): boolean {
  if (p.cooldown <= 0 || p.task.step === 'walk' || p.task.step === 'flee') return false;
  return p.drafted || p.job?.kind === 'hunt';
}

/**
 * The state/job-to-animation map (art/STYLE.md section 5). Dying is not here: a person who died is gone from the state, and the view plays `die` on its own.
 */
export function animFor(p: Person, buildings: Building[]): AnimPick {
  const step = p.task.step;
  if (step === 'flee') return { anim: 'walk', rate: 1.5 };
  if (attacking(p)) return { anim: p.drafted ? weaponOf(p) : 'shoot', rate: 1 };
  if (step === 'walk') return { anim: p.carry.amount > 0 ? 'carry_walk' : 'walk', rate: 1 };
  if (isSitting(p, buildings)) return { anim: 'sit', rate: 1 };
  if (step === 'work' && p.job && !p.drafted) {
    switch (p.job.kind) {
      case 'chop':
        return { anim: 'chop', rate: 1 };
      case 'gather':
        return { anim: 'gather', rate: 1 };
      case 'build': {
        // A builder swings only while the site has all its materials; otherwise they stand waiting for the haulers.
        const site = buildings.find((b) => b.id === p.job!.building);
        return { anim: site && !site.done && materialsComplete(site) ? 'build' : 'idle', rate: 1 };
      }
      case 'dry':
        return { anim: 'scrape', rate: 1 };
      case 'heal':
      case 'tend':
        return { anim: 'tend', rate: 1 };
      case 'drill':
        return { anim: weaponOf(p), rate: 1 };
      default:
        return { anim: 'idle', rate: 1 };
    }
  }
  return { anim: 'idle', rate: 1 };
}

/** The animation the model really has: elders and children lack the fighting and chopping ones, so they idle. */
export function playable(key: string, anim: string): string {
  const anims = entry(key).anims ?? {};
  return anim in anims ? anim : 'idle';
}

/** The frame index of an animation `ms` after it started: loops wrap, a holding one (die) stops on its last frame. */
export function frameAt(key: string, anim: string, ms: number, rate = 1): number {
  const a = entry(key).anims?.[anim];
  if (!a) return 0;
  const n = Math.floor((Math.max(0, ms) * a.fps * rate) / 1000);
  return a.loop ? n % a.frames : Math.min(n, a.frames - 1);
}

/** How long a holding animation takes to reach its last frame, in ms (0 for an unknown one). */
export function animLength(key: string, anim: string): number {
  const a = entry(key).anims?.[anim];
  return a ? ((a.frames - 1) * 1000) / a.fps : 0;
}

/** The atlas frame name (pattern A, art/SPEC.md section 8). */
export function personFrame(key: string, layer: string, anim: string, facing: Facing, n: number): string {
  return `${key}/${layer}/${anim}/${facing}/${String(n).padStart(2, '0')}`;
}

/** A `#rrggbb` family colour as a Phaser tint number. */
export function tintOf(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
