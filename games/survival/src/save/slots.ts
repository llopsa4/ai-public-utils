// The three save slots over an injectable Storage (DESIGN-saves.md *Slots*, *Storage failure*).
// Browser storage lives here and in the scenes, never in `src/sim`. The stored text is exactly
// what Export writes, so a slot never holds anything the player could not export.
import { parseSave, type SaveSummary } from '../sim/save';

export const SLOT_COUNT = 3;
export type SlotId = 1 | 2 | 3;
export const SLOT_IDS: readonly SlotId[] = [1, 2, 3];

/** The part of the DOM `Storage` the slots use, so tests can pass an in-memory one. */
export type SlotStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SlotInfo =
  | { slot: SlotId; status: 'empty' }
  | { slot: SlotId; status: 'filled'; summary: SaveSummary; savedAt: string }
  | { slot: SlotId; status: 'unreadable' }
  | { slot: SlotId; status: 'unavailable' };

export type ImportResult = 'ok' | 'filled' | 'unreadable' | 'unavailable';

const PROBE_KEY = 'campfire.probe';

export function slotKey(slot: SlotId): string {
  return `campfire.slot.${slot}`;
}

/** The browser's localStorage, or null where even touching it throws (blocked site data). */
export function browserStorage(): SlotStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** True when the storage accepts a write and a remove. */
export function probe(storage: SlotStorage | null): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** The stored text of a slot, null when empty. Throws when the storage does. */
export function readSlot(storage: SlotStorage, slot: SlotId): string | null {
  return storage.getItem(slotKey(slot));
}

/** Stores the text; false when the storage refuses it (blocked or full). */
export function writeSlot(storage: SlotStorage, slot: SlotId, text: string): boolean {
  try {
    storage.setItem(slotKey(slot), text);
    return true;
  } catch {
    return false;
  }
}

/** Removes the slot's camp; false when the storage refuses. */
export function clearSlot(storage: SlotStorage, slot: SlotId): boolean {
  try {
    storage.removeItem(slotKey(slot));
    return true;
  } catch {
    return false;
  }
}

export function slotInfo(storage: SlotStorage, slot: SlotId): SlotInfo {
  let text: string | null;
  try {
    text = readSlot(storage, slot);
  } catch {
    return { slot, status: 'unavailable' };
  }
  if (text === null) return { slot, status: 'empty' };
  const parsed = parseSave(text);
  if (!parsed.ok) return { slot, status: 'unreadable' };
  return { slot, status: 'filled', summary: parsed.save.summary, savedAt: parsed.save.savedAt };
}

export function listSlots(storage: SlotStorage): SlotInfo[] {
  return SLOT_IDS.map((slot) => slotInfo(storage, slot));
}

/** Stores a readable save in an empty slot only; to replace a camp, delete it first. */
export function importSlot(storage: SlotStorage, slot: SlotId, text: string): ImportResult {
  let current: string | null;
  try {
    current = readSlot(storage, slot);
  } catch {
    return 'unavailable';
  }
  if (current !== null) return 'filled';
  if (!parseSave(text).ok) return 'unreadable';
  return writeSlot(storage, slot, text) ? 'ok' : 'unavailable';
}

/** The first empty slot, or null when every slot is filled (or the storage is unavailable). */
export function firstEmptySlot(storage: SlotStorage): SlotId | null {
  const found = listSlots(storage).find((i) => i.status === 'empty');
  return found ? found.slot : null;
}
