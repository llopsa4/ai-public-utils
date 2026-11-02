import { ROOMS } from '../content/rooms';
import { FLAGS, ITEMS } from './state';
import type { Facing, GameState, Pose } from './types';

export const SAVE_FORMAT = 'adventure-pilot-save';
export const SAVE_VERSION = 1;
export const MAX_SAVE_BYTES = 64 * 1024;

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const POSES: Pose[] = ['stand', 'crouch', 'dead'];

export type ImportResult = { ok: true; state: GameState } | { ok: false; error: string };

export function serializeSave(state: GameState, now = new Date()): string {
  return JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: now.toISOString(), state }, null, 2);
}

export function saveFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `adventure-save-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Parses and fully validates an imported save. Only known rooms, flags, items, poses and facings are
 * accepted, so a tampered or foreign file can never put the game into an impossible state.
 * Error values are string-table keys.
 */
export function parseSave(text: string): ImportResult {
  if (text.length > MAX_SAVE_BYTES) return { ok: false, error: 'save.error.tooLarge' };
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'save.error.notJson' }; }
  if (!isObject(data) || data.format !== SAVE_FORMAT) return { ok: false, error: 'save.error.notSave' };
  if (data.version !== SAVE_VERSION) return { ok: false, error: 'save.error.version' };
  const s = data.state;
  if (!isObject(s)) return { ok: false, error: 'save.error.invalid' };

  const invalid: ImportResult = { ok: false, error: 'save.error.invalid' };
  if (typeof s.room !== 'string' || !Object.hasOwn(ROOMS, s.room)) return invalid;

  const hero = s.hero, keeper = s.keeper;
  if (!isObject(hero) || !isObject(keeper)) return invalid;
  if (typeof hero.x !== 'number' || typeof hero.y !== 'number' || !Number.isFinite(hero.x) || !Number.isFinite(hero.y)) return invalid;
  if (hero.x < 0 || hero.x > 640 || hero.y < 0 || hero.y > 360) return invalid;
  for (const actor of [hero, keeper]) {
    if (!FACINGS.includes(actor.face as Facing) || !POSES.includes(actor.pose as Pose)) return invalid;
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

  return {
    ok: true,
    state: {
      room: s.room,
      hero: { x: hero.x, y: hero.y, face: hero.face as Facing, pose: hero.pose as Pose },
      keeper: { face: keeper.face as Facing, pose: keeper.pose as Pose },
      flags,
      inventory,
    },
  };
}
