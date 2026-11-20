// Save files (DESIGN-saves.md *Save file*, *Reading a save*, *Continue*). Pure TypeScript: no storage
// and no Phaser here; `src/save/slots.ts` keeps the text in localStorage.
import { DAY_TICKS, type GameState } from './state';

/** Raise whenever `GameState` changes shape. Older versions are not migrated: they are unreadable. */
export const SAVE_VERSION = 5; // 2: `store.pemmican` (seasons); 3: `gift`, `upgrades`; 4: wave runs have `scouted`, tier 2 buildings and societies; 5: `horses`, `tended` on buildings, `powersUsed`
export const SAVE_FORMAT = 'camp-fire-save';

export interface SaveSummary {
  day: number;
  people: number;
  seed: number;
}

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  version: number;
  savedAt: string;
  summary: SaveSummary;
  state: GameState;
}

export type ParsedSave = { ok: true; save: SaveFile } | { ok: false; reason: string };

/** The day shown to the player: day 1 is the first 1200 ticks. */
export function dayOf(s: { tick: number }): number {
  return Math.floor(s.tick / DAY_TICKS) + 1;
}

/** The save text of a state. Orders and messages are written empty; the state is not changed. */
export function serialize(state: GameState, now: Date = new Date()): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: now.toISOString(),
    summary: { day: dayOf(state), people: state.people.length, seed: state.seed },
    state: { ...state, orders: [], messages: [] },
  };
  return JSON.stringify(file);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Reads save text. Returns the save, or the reason it is unreadable; nothing is ever repaired. */
export function parseSave(text: string): ParsedSave {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not JSON' };
  }
  if (!isObject(raw)) return { ok: false, reason: 'not an object' };
  if (raw.format !== SAVE_FORMAT) return { ok: false, reason: 'wrong format' };
  if (raw.version !== SAVE_VERSION) return { ok: false, reason: 'wrong version' };
  const s = raw.state;
  if (!isObject(s)) return { ok: false, reason: 'no state' };
  for (const key of ['seed', 'tick', 'wotakuye', 'gift', 'horses', 'nextPersonId', 'nextBuildingId', 'nextEnemyId']) {
    if (!isNum(s[key])) return { ok: false, reason: `bad ${key}` };
  }
  if (!isObject(s.rng) || !isNum(s.rng.s)) return { ok: false, reason: 'bad rng' };
  for (const key of ['people', 'buildings', 'enemies', 'waves', 'blocked']) {
    if (!Array.isArray(s[key])) return { ok: false, reason: `bad ${key}` };
  }
  if (!(s.waves as unknown[]).every((w) => isObject(w) && typeof w.scouted === 'boolean')) return { ok: false, reason: 'bad waves' };
  if (!(s.buildings as unknown[]).every((b) => isObject(b) && isNum(b.tended))) return { ok: false, reason: 'bad buildings' };
  if (!Array.isArray(s.upgrades)) return { ok: false, reason: 'bad upgrades' };
  if (!Array.isArray(s.powersUsed)) return { ok: false, reason: 'bad powersUsed' };
  const store = s.store;
  if (!isObject(store) || !isNum(store.food) || !isNum(store.wood) || !isNum(store.hides) || !isNum(store.pemmican)) {
    return { ok: false, reason: 'bad store' };
  }
  const map = s.map;
  if (!isObject(map) || !isNum(map.size) || !Array.isArray(map.tiles)) return { ok: false, reason: 'bad map' };
  const cells = map.size * map.size;
  if (map.tiles.length !== cells || (s.blocked as unknown[]).length !== cells) {
    return { ok: false, reason: 'map size mismatch' };
  }
  if (s.result !== null) return { ok: false, reason: 'finished run' };
  return { ok: true, save: raw as unknown as SaveFile };
}

/** The state to continue from: paused at 1x, no queued orders or messages (the camera is the view's). */
export function loadState(save: SaveFile): GameState {
  const state = JSON.parse(JSON.stringify(save.state)) as GameState;
  state.orders = [];
  state.messages = [];
  state.speed = 1;
  state.paused = true;
  return state;
}
