// The notebook's day line, Diary and Map as plain data from the game state (STORY.md, "The five
// days"; tested in tests/journal.test.ts). ./journal.ts draws them into the notebook.
import { CHAPTERS, CHAPTER_IDS, chapter } from '../chapters';
import type { Chapter } from '../chapters/types';
import { PLACES } from '../content/world';
import { t } from '../engine/i18n';
import type { GameState } from '../engine/types';

/** "Day 1 · Morning · Cinderfold": the chapter's place in the story's five days. */
export function dayLine(ch: Chapter): string {
  return t('ui.dayLine', { day: String(ch.when.day), time: t(ch.when.time), place: t(ch.when.place) });
}

/** The chapters played so far, oldest first, each with the flags it ended (or stands) with. */
function playedChapters(state: GameState): { ch: Chapter; flags: Record<string, boolean>; current: boolean }[] {
  const out: { ch: Chapter; flags: Record<string, boolean>; current: boolean }[] = [];
  for (const id of CHAPTER_IDS) {
    const ch = CHAPTERS[id];
    if (id === state.chapter) { out.push({ ch: ch ?? chapter(), flags: state.flags, current: true }); break; }
    const flags = state.earlier?.[id];
    if (ch && flags) out.push({ ch, flags, current: false });
  }
  return out;
}

export interface DiaryDay { day: number; chapters: { heading: string; entries: string[] }[] }

/** The story so far: each played chapter's diary entries whose flags are set, grouped by day. */
export function diary(state: GameState): DiaryDay[] {
  const days: DiaryDay[] = [];
  for (const { ch, flags } of playedChapters(state)) {
    const entries = ch.diary.filter(e => e.after.every(f => flags[f])).map(e => t(e.key));
    if (!entries.length) continue;
    let day = days.find(d => d.day === ch.when.day);
    if (!day) days.push(day = { day: ch.when.day, chapters: [] });
    day.chapters.push({ heading: t('ui.diaryChapter', { time: t(ch.when.time), place: t(ch.when.place), who: t(ch.when.viewpoint) }), entries });
  }
  return days.sort((a, b) => a.day - b.day);
}

/** Where the viewpoint character is now, and every place they know (this chapter's and earlier ones'). */
export function mapState(state: GameState): { at: string; known: string[] } {
  const known = new Set<string>();
  for (const { ch, flags, current } of playedChapters(state)) {
    for (const p of ch.map.known(flags, current ? state.room : null)) known.add(p);
  }
  const at = chapter().map.at(state);
  known.add(at);
  return { at, known: [...known].filter(p => PLACES[p]) };
}
