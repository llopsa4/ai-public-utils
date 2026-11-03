import { parseSave, serializeSave } from './saveFile';
import type { GameState } from './types';

/** One autosave slot in this browser, in the same validated format as exported saves. */
const STORAGE_KEY = 'cinderfold.autosave';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStore = (): Store | undefined => {
  try { return globalThis.localStorage; } catch { return undefined; }
};

export type AutosaveRead = { kind: 'none' } | { kind: 'ok'; state: GameState } | { kind: 'corrupt' };

export function writeAutosave(state: GameState, store = defaultStore()): boolean {
  try { store?.setItem(STORAGE_KEY, serializeSave(state)); return !!store; } catch { return false; }
}

/** The autosave as stored (unchecked), or null: used to load its chapter before reading it. */
export function autosaveText(store = defaultStore()): string | null {
  try { return store?.getItem(STORAGE_KEY) ?? null; } catch { return null; }
}

/** A missing slot is 'none'; anything that fails save validation is 'corrupt' and never loaded. */
export function readAutosave(store = defaultStore()): AutosaveRead {
  let text: string | null = null;
  try { text = store?.getItem(STORAGE_KEY) ?? null; } catch { return { kind: 'none' }; }
  if (text === null) return { kind: 'none' };
  const result = parseSave(text);
  return result.ok ? { kind: 'ok', state: result.state } : { kind: 'corrupt' };
}

export function clearAutosave(store = defaultStore()): void {
  try { store?.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
}
