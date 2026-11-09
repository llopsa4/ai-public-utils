// What the chapter map shows for each chapter (src/ui/chapterMap.ts draws it; tested in
// tests/chapter-map.test.ts): the chapters that may be played next, live, and the chapters already
// played, dimmed and ticked. A live chapter set before the latest played one says how far back it
// goes ("Three days earlier…").
import type { Chapter } from '../chapters/types';
import { t } from '../engine/i18n';
import { dayLine } from './journalData';

export interface MapPin {
  ch: Chapter;
  played: boolean;
  /** Above the pin: "Mara · Embers" (live), "Silas · Day 3 · Intro" (played). */
  label: string;
  /** Below a live pin: its day line. */
  day: string;
  /** Above a live pin set before the latest played chapter: "Three days earlier…", else ''. */
  earlier: string;
}

const who = (ch: Chapter) => t(ch.hero?.name ?? 'speaker.hero');

/** "Three days earlier…" (or "The day before…"), counted back from the latest played chapter. */
export function daysEarlier(days: number): string {
  if (days <= 0) return '';
  if (days === 1) return t('ui.dayBefore');
  const word = t(`ui.number.${days}`);
  return t('ui.daysEarlier', { n: word.startsWith('ui.') ? String(days) : word });
}

export function mapPins(open: readonly Chapter[], played: readonly Chapter[]): MapPin[] {
  const latest = Math.max(0, ...played.map(ch => ch.when.day));
  return [
    ...played.map(ch => ({
      ch, played: true, day: '', earlier: '',
      label: `${who(ch)} · ${t('ui.dayOf', { day: String(ch.when.day) })} · ${t(ch.mapName ?? ch.title)}`,
    })),
    ...open.map(ch => ({
      ch, played: false, day: dayLine(ch), earlier: daysEarlier(latest - ch.when.day),
      label: `${who(ch)} · ${t(ch.title)}`,
    })),
  ];
}
