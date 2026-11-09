// The chapter map: the Ashlands with a pin for each chapter the player may start next (at the
// chapter's place, src/content/world.ts), showing whose chapter it is, which, and its day. Locked
// chapters do not show. Picking a pin (or its button below the map) resolves with that chapter.
import type { Chapter } from '../chapters/types';
import { MAP_SIZE, PLACES } from '../content/world';
import { t } from '../engine/i18n';
import { PAINTED, drawLand, el } from './journal';
import { dayLine } from './journalData';
import { $ } from './ui';

export function showChapterMap(open: readonly Chapter[]): Promise<Chapter> {
  const screen = $('chapter-map'), mapHost = $('chapter-map-svg'), list = $('chapter-map-list');
  return new Promise(resolve => {
    const pick = (ch: Chapter) => {
      screen.hidden = true;
      mapHost.replaceChildren();
      list.replaceChildren();
      resolve(ch);
    };
    const svg = el('svg', { viewBox: `0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`, class: 'world-map chapter-pins', role: 'img', 'aria-label': t('ui.chapterMapLabel') });
    if (PAINTED) svg.append(el('image', { href: PAINTED, x: 0, y: 0, width: MAP_SIZE.w, height: MAP_SIZE.h }));
    else drawLand(svg);
    for (const ch of open) {
      const at = PLACES[ch.pin];
      const who = t(ch.hero?.name ?? 'speaker.hero');
      const pin = el('g', { class: 'chapter-pin' });
      pin.append(
        el('circle', { cx: at.x, cy: at.y, r: 18, class: 'map-here-ring' }),
        el('path', { d: `M${at.x},${at.y} l-11,-27 a12,12 0 1 1 22,0 z`, class: 'map-here-pin' }),
        el('text', { x: at.x, y: at.y - 40, class: 'map-here-label' }, `${who} · ${t(ch.title)}`),
        el('text', { x: at.x, y: at.y + 38, class: 'map-name pin-day', 'text-anchor': 'middle' }, dayLine(ch)),
      );
      pin.addEventListener('click', () => pick(ch));
      svg.append(pin);
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${who} · ${t(ch.title)} · ${dayLine(ch)}`;
      b.addEventListener('click', () => pick(ch));
      list.append(b);
    }
    mapHost.replaceChildren(svg);
    screen.hidden = false;
    (list.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
  });
}
