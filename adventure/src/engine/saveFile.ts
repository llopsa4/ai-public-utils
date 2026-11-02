import { ROOMS } from '../content/rooms';
import { FLAGS, ITEMS } from './state';
import { NPC_IDS, type ActorState, type Facing, type GameState, type NpcId, type Pose } from './types';

export const SAVE_FORMAT = 'adventure-pilot-save';
/** Version 2: Cinderfold (scene 1). Version 1 saves belonged to the engine pilot's hotel rooms. */
export const SAVE_VERSION = 2;
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
  if (data.version !== SAVE_VERSION) return { ok: false, error: 'save.error.version' };
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

  return { ok: true, state: { room: s.room, hero: { x: hero.x, y: hero.y, ...heroPose }, npcs, flags, inventory } };
}
