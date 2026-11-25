import { type StorageLike, browserStorage } from './campaign';
import { type Difficulty, isDifficulty } from './difficulty';
import { type ActionId, type BindResult, type Bindings, type Overrides, bindKey, parseOverrides, resolveKeys } from './keymap';

// Player options (DESIGN §19): stored in localStorage under `deadwoods.options`. Pure apart from the
// storage argument; a missing, damaged or partly wrong slot falls back to the defaults field by field.

export const OPTIONS_KEY = 'deadwoods.options';
export const TEXT_SIZES = [100, 125, 150] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const VOLUME_STEP = 0.05;

export interface Options {
  /** Volumes are 0..1 in steps of `VOLUME_STEP`; Z39 reads them. */
  master: number;
  effects: number;
  ambience: number;
  mute: boolean;
  edgeScroll: boolean;
  /** Text size in percent (Z36 applies it). */
  textSize: TextSize;
  /** Shape cues: `!` and `?` over zombies, dashed noise rings, hunger label (Z36 applies them). */
  cues: boolean;
  /** Screen shake on shots and bites (Z38 applies it). */
  shake: boolean;
  /** Rain and fog particles (DESIGN §20); dusk and light pools always stay. */
  weather: boolean;
  /** Key rebinding (Z37): only the keys that differ from `data/keys.json`; `liveKeys()` is the resolved map. */
  keys: Overrides;
  /** Easy / Normal / Hard (DESIGN §21): read when Mission 1 or Base 1 starts or restarts. */
  difficulty: Difficulty;
}

export const DEFAULT_OPTIONS: Readonly<Options> = {
  master: 0.8,
  effects: 1,
  ambience: 0.7,
  mute: false,
  edgeScroll: true,
  textSize: 100,
  cues: true,
  shake: true,
  weather: true,
  keys: {},
  difficulty: 'normal',
};

export type VolumeKey = 'master' | 'effects' | 'ambience';
export type ToggleKey = 'mute' | 'edgeScroll' | 'cues' | 'shake' | 'weather';

/** A volume snapped to the nearest step inside 0..1 (anything that is not a number reads as 0). */
export function snapVolume(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const clamped = Math.min(1, Math.max(0, v));
  return Math.round(Math.round(clamped / VOLUME_STEP) * VOLUME_STEP * 100) / 100;
}

/** The volume a click at `x` on a slider that starts at `left` and is `width` wide means. */
export function sliderValue(x: number, left: number, width: number): number {
  return width > 0 ? snapVolume((x - left) / width) : 0;
}

/** The next text size in the cycle 100 → 125 → 150 → 100; an unknown size restarts at 100. */
export function nextTextSize(size: number): TextSize {
  const i = TEXT_SIZES.findIndex((s) => s === size);
  return TEXT_SIZES[(i + 1) % TEXT_SIZES.length]!;
}

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const volume = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? snapVolume(v) : fallback);

/** Parses a stored slot; every field that is missing or wrong takes its default, and it never throws. */
export function parseOptions(text: string | null): Options {
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_OPTIONS;
  return {
    master: volume(r.master, d.master),
    effects: volume(r.effects, d.effects),
    ambience: volume(r.ambience, d.ambience),
    mute: bool(r.mute, d.mute),
    edgeScroll: bool(r.edgeScroll, d.edgeScroll),
    textSize: TEXT_SIZES.find((s) => s === r.textSize) ?? d.textSize,
    cues: bool(r.cues, d.cues),
    shake: bool(r.shake, d.shake),
    weather: bool(r.weather, d.weather),
    keys: parseOverrides(r.keys),
    difficulty: isDifficulty(r.difficulty) ? r.difficulty : d.difficulty,
  };
}

export function loadOptions(storage: StorageLike | undefined): Options {
  try {
    return parseOptions(storage?.getItem(OPTIONS_KEY) ?? null);
  } catch {
    return { ...DEFAULT_OPTIONS, keys: {} };
  }
}

/** Storage can be missing or throw (private window, blocked site data): saving then quietly fails. */
export function saveOptions(storage: StorageLike | undefined, o: Options): boolean {
  try {
    storage?.setItem(OPTIONS_KEY, JSON.stringify(o));
    return storage !== undefined;
  } catch {
    return false;
  }
}

let current: Options | null = null;

/** The live options, read from the browser's storage once and then kept in memory. Treat as read-only. */
export function options(storage: StorageLike | undefined = browserStorage()): Options {
  current ??= loadOptions(storage);
  return current;
}

/** Changes some options and saves them at once. */
export function updateOptions(patch: Partial<Options>, storage: StorageLike | undefined = browserStorage()): Options {
  current = { ...options(storage), ...patch };
  saveOptions(storage, current);
  return current;
}

/** The key of every action now: the defaults with the player's rebinds (Z37). */
export function liveKeys(): Bindings {
  return resolveKeys(options().keys);
}

/** Rebinds one action and saves; a key that is reserved, unusable or taken is refused and nothing changes. */
export function rebindKey(action: ActionId, key: string, storage: StorageLike | undefined = browserStorage()): BindResult {
  const r = bindKey(options(storage).keys, action, key);
  if (r.ok) updateOptions({ keys: r.overrides }, storage);
  return r;
}

/** Puts every key back to its default and saves. */
export function resetKeys(storage: StorageLike | undefined = browserStorage()): void {
  updateOptions({ keys: {} }, storage);
}

/** Forgets the in-memory copy (tests, and a reload of the storage). */
export function resetOptionsCache(): void {
  current = null;
}
