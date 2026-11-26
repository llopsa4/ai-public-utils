// The door scene (Mission 2, DESIGN §26): the scripted beat between the last squatter down and the Debrief.
// The squad gathers in the concrete room, Theo talks them through the backup power on the speaker, the bunker
// door opens and he walks out and joins (the Z90 `tinkerer` kind); the cache's ammo and scrap go to the shared
// pools. Pure TypeScript like `rescue.ts`; the scene plays the lines and draws it. Input stays locked throughout.
import chars from '../data/characters.json';
import { route, walkPath } from './ai';
import { face } from './combat';
import { FLOOR, setTile } from './grid';
import { type MissionState, type Survivor, type Zone, newSurvivor } from './mission';
import { type Pt, nearestFree } from './path';

/** `gather`: the squad walks to the concrete room. `power`: Theo's lines (scene). `open`: the door opens and he walks out. `talk`: the meeting (scene). `done`: the Debrief may open. */
export type DoorBeat = 'gather' | 'power' | 'open' | 'talk' | 'done';

/** From the mission data: the bunker door, the tile behind it where Theo waits, and the concrete room in front. */
export interface BunkerSpec {
  door: { x: number; y: number };
  inside: { x: number; y: number };
  room: Zone;
}

/** The weapons cache in the bunker (DESIGN §26): added to the shared pools when the door opens. */
export interface Cache {
  ammo: number;
  scrap: number;
}

export interface DoorScene {
  beat: DoorBeat;
  ticks: number; // ticks spent in this beat
}

export const THEO = 'tinkerer';
const GATHER_MAX = 80; // ticks: anyone still walking then is set down in the room
const OPEN_MAX = 60; // ticks: Theo's walk out is finished in place by then
const OPEN_PAUSE = 8; // ticks between the door opening and Theo's first step

const centre = (z: Zone): Pt => [z.x + Math.floor(z.w / 2), z.y + Math.floor(z.h / 2)];
const living = (s: MissionState): Survivor[] => s.survivors.filter((u) => u.hp > 0);

/** The last squatter is down: every survivor stops and heads for the concrete room. */
export function newDoorScene(s: MissionState, b: BunkerSpec): DoorScene {
  const taken = new Set<number>();
  const n = s.grid.size;
  for (const u of living(s)) {
    u.order = { type: 'move' };
    u.running = true;
    u.carrying = null;
    const spot = nearestFree(s.grid, centre(b.room), taken) ?? centre(b.room);
    taken.add(spot[1] * n + spot[0]);
    u.path = route(s.grid, u, spot);
  }
  for (const body of s.bodies) body.carriedBy = null;
  s.roofOpen = true; // the scene plays inside the house, even when the last squatter fell to a shot from outside
  return { beat: 'gather', ticks: 0 };
}

/** True while the scene must play lines before the door scene goes on. */
export function doorWaits(d: DoorScene): boolean {
  return d.beat === 'power' || d.beat === 'talk';
}

/** Everyone in the room faces the door (Theo faces the squad) and stands still. */
function settle(s: MissionState, b: BunkerSpec): void {
  const theo = s.survivors.find((u) => u.id === THEO);
  for (const u of living(s)) {
    u.order = null;
    u.path = [];
    u.running = false;
    if (u !== theo) face(u, b.door.x, b.door.y);
  }
  if (theo) {
    const others = living(s).filter((u) => u !== theo);
    if (others.length) face(theo, others.reduce((a, u) => a + u.x, 0) / others.length, others.reduce((a, u) => a + u.y, 0) / others.length);
  }
}

/** The door opens: its tile becomes floor, Theo steps out, and the cache goes into the pools. */
export function openBunker(s: MissionState, b: BunkerSpec, cache: Cache): Survivor {
  setTile(s.grid, b.door.x, b.door.y, FLOOR);
  const theo = newSurvivor(THEO, 'tinkerer', b.inside.x, b.inside.y);
  face(theo, b.door.x, b.door.y);
  s.survivors.push(theo);
  s.ammo += cache.ammo;
  s.loot.ammo += cache.ammo;
  s.loot.scrap += cache.scrap;
  return theo;
}

/** The scene calls this when a beat's lines are over: `power` → `open` (the door opens), `talk` → `done`. */
export function doorLinesDone(s: MissionState, d: DoorScene, b: BunkerSpec, cache: Cache): void {
  if (d.beat === 'power') {
    const theo = openBunker(s, b, cache);
    // he walks one tile past the doorway into the room
    const out: Pt = [b.door.x + (b.door.x - b.inside.x), b.door.y + (b.door.y - b.inside.y)];
    const taken = new Set(living(s).filter((u) => u !== theo).map((u) => Math.round(u.y) * s.grid.size + Math.round(u.x)));
    const spot = nearestFree(s.grid, out, taken) ?? out;
    theo.path = route(s.grid, theo, spot);
    theo.order = { type: 'move' };
    d.beat = 'open';
  } else if (d.beat === 'talk') d.beat = 'done';
  d.ticks = 0;
}

/** One 0.1 s tick of the moving beats; the line beats wait for `doorLinesDone`. */
export function stepDoor(s: MissionState, d: DoorScene, b: BunkerSpec): void {
  if (doorWaits(d) || d.beat === 'done') return;
  s.tick++;
  d.ticks++;
  if (d.beat === 'gather') {
    let moving = false;
    for (const u of living(s)) {
      if (u.path.length === 0) continue;
      moving = walkPath(s.grid, u, chars[u.kind].speed.run) > 0 || moving;
    }
    if (!moving || d.ticks >= GATHER_MAX) {
      // anyone still on the way is set down at the end of their route (the camera is at the door)
      for (const u of living(s)) {
        const end = u.path[u.path.length - 1];
        if (end) [u.x, u.y] = end;
      }
      settle(s, b);
      d.beat = 'power';
      d.ticks = 0;
    }
  } else if (d.beat === 'open') {
    const theo = s.survivors.find((u) => u.id === THEO);
    const moved = theo && d.ticks > OPEN_PAUSE && theo.path.length > 0 ? walkPath(s.grid, theo, chars.tinkerer.speed.walk) : 0;
    if (theo && d.ticks > OPEN_PAUSE && (moved === 0 || d.ticks >= OPEN_MAX)) {
      const end = theo.path[theo.path.length - 1];
      if (end) [theo.x, theo.y] = end;
      settle(s, b);
      d.beat = 'talk';
      d.ticks = 0;
    }
  }
}

/** Where the camera looks (tile coordinates): the bunker door, throughout. */
export function doorFocus(b: BunkerSpec): Pt {
  return [b.door.x, b.door.y + 1];
}
