// Each chapter's strings, merged into the language tables (src/engine/i18n.ts). English only.
import { CHAPTERS } from '.';

export const CHAPTER_STRINGS: Record<string, Record<string, string>> = Object.fromEntries(Object.values(CHAPTERS).map(c => [c.id, c.strings]));
