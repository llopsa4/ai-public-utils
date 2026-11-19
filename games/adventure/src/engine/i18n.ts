import game from '../content/strings/en.json';

/**
 * The game's own strings (interface, verbs, saves, the opening). Each chapter's strings are added
 * when the chapter registers or loads (src/chapters/index.ts, `addStrings`).
 */
const en: Record<string, string> = { ...game };

/** English only for now. To add a language: add strings/<code>.json and list it here. */
export const LANGUAGES = ['en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const TABLES: Record<Language, Record<string, string>> = { en };

/** A chapter's strings join the table when the chapter loads (src/chapters/index.ts). */
export function addStrings(strings: Record<string, string>): void {
  Object.assign(TABLES.en, strings);
}
const STORAGE_KEY = 'adventure.language';

let current: Language = 'en';
const listeners = new Set<(lang: Language) => void>();

export function detectLanguage(stored: string | null, browser: readonly string[]): Language {
  if (stored && (LANGUAGES as readonly string[]).includes(stored)) return stored as Language;
  for (const tag of browser) {
    const base = tag.toLowerCase().split('-')[0];
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Language;
  }
  return 'en';
}

/** Reads the stored preference (a language choice, not game progress) and the browser languages. */
export function initLanguage(): Language {
  let stored: string | null = null;
  try { stored = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null; } catch { /* storage blocked */ }
  current = detectLanguage(stored, globalThis.navigator?.languages ?? []);
  return current;
}

export function language(): Language {
  return current;
}

export function setLanguage(lang: Language): void {
  current = lang;
  try { globalThis.localStorage?.setItem(STORAGE_KEY, lang); } catch { /* storage blocked: keep for this session */ }
  for (const listener of listeners) listener(lang);
}

export function onLanguageChange(listener: (lang: Language) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Translates a key, falling back to English, then to the key itself. `{name}` placeholders are filled from params. */
export function t(key: string, params: Record<string, string> = {}): string {
  const text = TABLES[current][key] ?? TABLES.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => params[name] ?? `{${name}}`);
}
