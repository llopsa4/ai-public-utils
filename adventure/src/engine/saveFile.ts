import { ROOMS } from '../chapters/ch1/rooms';
import { MATERIALS, TONIC, MAX_SALVAGE } from '../content/kit';
import { newBag, newKit, validKit } from './kit';
import { FLAGS, ITEMS } from '../chapters/ch1/flags';
import { NPC_IDS, type ActorState, type Facing, type GameState, type NpcId, type Pose } from './types';

const SAVE_FORMAT = 'cinderfold-save';
/** Version 5: Mara's kit (health, gear) and bag (salvage, materials, tonics). Versions 3 and 4 still load. */
const SAVE_VERSION = 5;
const READABLE_VERSIONS = [3, 4, 5];
const MAX_LOOK_KEYS = 64;
export const MAX_SAVE_BYTES = 64 * 1024;

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const POSES: Pose[] = ['stand', 'crouch', 'dead'];

export type ImportResult = { ok: true; state: GameState } | { ok: false; error: string };

export function serializeSave(state: GameState, now = new Date()): string {
  return JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: now.toISOString(), state }, null, 2);
}

export function saveFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `cinderfold-save-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function actor(v: unknown): ActorState | null {
  if (!isObject(v) || !FACINGS.includes(v.face as Facing) || !POSES.includes(v.pose as Pose)) return null;
  return { face: v.face as Facing, pose: v.pose as Pose };
}

/**
 * Parses and fully validates an imported save. Only known rooms, characters, flags, items, poses and
 * facings are accepted, so a tampered or foreign file can never put the game into an impossible state.
 * Error values are string-table keys.
 */
export function parseSave(text: string): ImportResult {
  if (text.length > MAX_SAVE_BYTES) return { ok: false, error: 'save.error.tooLarge' };
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'save.error.notJson' }; }
  if (!isObject(data) || data.format !== SAVE_FORMAT) return { ok: false, error: 'save.error.notSave' };
  if (!READABLE_VERSIONS.includes(data.version as number)) return { ok: false, error: 'save.error.version' };
  const s = data.state;
  const invalid: ImportResult = { ok: false, error: 'save.error.invalid' };
  if (!isObject(s)) return invalid;
  if (typeof s.room !== 'string' || !Object.hasOwn(ROOMS, s.room)) return invalid;

  const hero = s.hero;
  const heroPose = actor(hero);
  if (!isObject(hero) || !heroPose) return invalid;
  if (typeof hero.x !== 'number' || typeof hero.y !== 'number' || !Number.isFinite(hero.x) || !Number.isFinite(hero.y)) return invalid;
  if (hero.x < 0 || hero.x > 640 || hero.y < 0 || hero.y > 360) return invalid;

  if (!isObject(s.npcs)) return invalid;
  const keys = Object.keys(s.npcs);
  if (keys.length !== NPC_IDS.length || !keys.every(k => (NPC_IDS as readonly string[]).includes(k))) return invalid;
  const npcs = {} as Record<NpcId, ActorState>;
  for (const id of NPC_IDS) {
    const a = actor(s.npcs[id]);
    if (!a) return invalid;
    npcs[id] = a;
  }

  if (!isObject(s.flags)) return invalid;
  const flags: Record<string, boolean> = {};
  for (const [name, value] of Object.entries(s.flags)) {
    if (!(FLAGS as readonly string[]).includes(name) || typeof value !== 'boolean') return invalid;
    if (value) flags[name] = true;
  }

  if (!Array.isArray(s.inventory) || s.inventory.length > ITEMS.length) return invalid;
  const inventory: string[] = [];
  for (const item of s.inventory) {
    if (typeof item !== 'string' || !(ITEMS as readonly string[]).includes(item) || inventory.includes(item)) return invalid;
    inventory.push(item);
  }

  // Look counters: absent in version 3 saves.
  const looks: Record<string, number> = {};
  if (s.looks !== undefined) {
    if (!isObject(s.looks) || Object.keys(s.looks).length > MAX_LOOK_KEYS) return invalid;
    for (const [id, n] of Object.entries(s.looks)) {
      if (!/^[\w:]{1,40}$/.test(id) || typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99) return invalid;
      looks[id] = n;
    }
  }

  // Kit and bag: absent before version 5 (a fresh kit and an empty bag).
  const kit = newKit();
  if (s.kit !== undefined) {
    const k = s.kit;
    if (!isObject(k) || !isObject(k.equipment) || !Array.isArray(k.owned) || k.owned.length > 32) return invalid;
    const equipment = {} as Record<string, { id: string }>;
    for (const slot of ['gauntlet', 'armor', 'utility']) {
      const e = k.equipment[slot];
      if (!isObject(e) || typeof e.id !== 'string' || (e.upgraded !== undefined && e.upgraded !== false)) return invalid;
      equipment[slot] = { id: e.id };
    }
    if (!k.owned.every((id: unknown) => typeof id === 'string')) return invalid;
    Object.assign(kit, { hp: k.hp, mp: k.mp, equipment, owned: [...k.owned] });
    if (!validKit(kit)) return invalid;
  }
  const bag = newBag();
  if (s.bag !== undefined) {
    const b = s.bag;
    const count = (n: unknown, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
    if (!isObject(b) || !count(b.salvage, MAX_SALVAGE) || !count(b.tonics, TONIC.max) || !isObject(b.materials)) return invalid;
    for (const [id, n] of Object.entries(b.materials)) {
      if (!Object.hasOwn(MATERIALS, id) || !count(n, 99)) return invalid;
      if ((n as number) > 0) bag.materials[id] = n as number;
    }
    bag.salvage = b.salvage as number;
    bag.tonics = b.tonics as number;
  }

  return { ok: true, state: { room: s.room, hero: { x: hero.x, y: hero.y, ...heroPose }, npcs, flags, inventory, looks, kit, bag } };
}
