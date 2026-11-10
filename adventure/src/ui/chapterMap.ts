// The chapter map: the Ashlands with a pin for each chapter the player may start next (at the
// chapter's place, src/content/world.ts), showing whose chapter it is, which, and its day. Chapters
// already played show dimmed and ticked, and cannot be picked; locked chapters do not show. Picking
// a live pin (or its button below the map) resolves with that chapter (pins: ./mapPins.ts).
import type { Chapter } from '../chapters/types';
import { MAP_SIZE, PLACES } from '../content/world';
import { t } from '../engine/i18n';
import { PAINTED, drawLand, el } from './journal';
import { mapPins } from './mapPins';
import { fitPlates, plated } from './mapPlates';
import { $ } from './ui';

export function showChapterMap(open: readonly Chapter[], played: readonly Chapter[] = []): Promise<Chapter> {
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
    for (const { ch, played: done, label, day, earlier } of mapPins(open, played)) {
      const at = PLACES[ch.pin];
      const b = document.createElement('button');
      b.type = 'button';
      if (done) {
        // Played: a dimmed pin with a tick, not to be picked again.
        const pin = el('g', { class: 'chapter-pin played', 'aria-hidden': 'true' });
        pin.append(
          el('path', { d: `M${at.x},${at.y} l-11,-27 a12,12 0 1 1 22,0 z`, class: 'map-here-pin' }),
          el('path', { d: `M${at.x - 6},${at.y - 32} l4,5 l8,-10`, class: 'pin-tick' }),
          plated(label, at.x, at.y - 48, 'played'),
        );
        svg.append(pin);
        b.textContent = `${label} · ${t('ui.played')}`;
        b.disabled = true;
        list.append(b);
        continue;
      }
      const pin = el('g', { class: 'chapter-pin' });
      pin.append(
        el('circle', { cx: at.x, cy: at.y, r: 18, class: 'map-here-ring' }),
        el('path', { d: `M${at.x},${at.y} l-11,-27 a12,12 0 1 1 22,0 z`, class: 'map-here-pin' }),
        plated(label, at.x, at.y - 46, 'live'),
        plated(day, at.x, at.y + 40, 'day'),
      );
      // "Two days earlier…" above the chapter's own label, never on top of it.
      if (earlier) pin.append(plated(earlier, at.x, at.y - 78, 'earlier'));
      pin.addEventListener('click', () => pick(ch));
      svg.append(pin);
      b.textContent = `${label} · ${day}`;
      b.addEventListener('click', () => pick(ch));
      list.append(b);
    }
    mapHost.replaceChildren(svg);
    screen.hidden = false;
    // Measured once shown (a hidden map measures every text as empty).
    fitPlates(svg as SVGSVGElement);
    (list.querySelector('button:not(:disabled)') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  });
}
