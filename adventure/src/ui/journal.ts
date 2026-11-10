// The notebook's Diary and Map drawn from ./journalData.ts, and its tabs.
import { chapter } from '../chapters';
import { LAND, MAP_SIZE, PLACES, labelAt } from '../content/world';
import { fitPlatesWhenShown, plated } from './mapPlates';
import { t } from '../engine/i18n';
import type { GameState } from '../engine/types';
import { diary, mapState } from './journalData';


/** Codex's painted map (no lettering), once it has been delivered; else the land is drawn here. */
// Codex's painting, served as WebP (like the rooms; the PNG stays the source).
const paintedFiles = import.meta.glob('../../art/src/ui/world-map.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const PAINTED = Object.values(paintedFiles)[0] as string | undefined;

const SVG = 'http://www.w3.org/2000/svg';
export const el = (name: string, attrs: Record<string, string | number> = {}, text?: string): SVGElement => {
  const e = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
};

/** The placeholder land: coast, snow, the Rift, the river, hills, mountains, forest, ash, the road. */
export function drawLand(svg: SVGElement): void {
  svg.append(
    el('path', { d: LAND.coast, class: 'map-land' }),
    el('path', { d: LAND.snow, class: 'map-snow' }),
    el('path', { d: LAND.rift, class: 'map-rift' }),
    el('path', { d: LAND.river, class: 'map-river' }),
    el('path', { d: LAND.road, class: 'map-road' }),
  );
  for (const [x, y] of LAND.hills) svg.append(el('path', { d: `M${x - 10},${y + 6} L${x},${y - 8} L${x + 10},${y + 6}`, class: 'map-peak' }));
  for (const [x, y] of LAND.mountains) svg.append(el('path', { d: `M${x - 16},${y + 10} L${x},${y - 14} L${x + 16},${y + 10}`, class: 'map-peak big' }));
  for (const [x, y] of LAND.forest) svg.append(el('circle', { cx: x, cy: y, r: 7, class: 'map-tree' }));
  for (const [x, y] of LAND.ash) svg.append(el('circle', { cx: x, cy: y, r: 1.6, class: 'map-ash' }));
}

/** Draws the world map: the land, the names of known places, and a marker where the character is. */
export function renderMap(host: HTMLElement, state: GameState): void {
  const { at, known } = mapState(state);
  const who = t(chapter().when.viewpoint), here = PLACES[at];
  const svg = el('svg', { viewBox: `0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`, role: 'img', 'aria-label': t('ui.mapLabel', { who, place: t(here.name) }), class: 'world-map' });
  if (PAINTED) svg.append(el('image', { href: PAINTED, x: 0, y: 0, width: MAP_SIZE.w, height: MAP_SIZE.h }));
  else drawLand(svg);
  for (const id of known) {
    const p = PLACES[id];
    svg.append(el('circle', { cx: p.x, cy: p.y, r: p.kind === 'town' ? 7 : 5, class: 'map-place' }));
    const at = labelAt(p);
    svg.append(plated(t(p.name), at.x, at.y, 'name', at.anchor));
  }
  // The marker: a ring and a pin over the current place.
  svg.append(el('circle', { cx: here.x, cy: here.y, r: 16, class: 'map-here-ring' }));
  svg.append(el('path', { d: `M${here.x},${here.y} l-9,-22 a10,10 0 1 1 18,0 z`, class: 'map-here-pin' }));
  svg.append(plated(t('ui.mapHere', { who }), here.x, here.y - 38, 'live'));
  host.replaceChildren(svg);
  fitPlatesWhenShown(svg as SVGSVGElement);
}

/** Writes the diary into the notebook: a heading per day, then each chapter's entries. */
export function renderDiary(host: HTMLElement, state: GameState): void {
  host.replaceChildren(...diary(state).flatMap(day => {
    const h = document.createElement('h2');
    h.className = 'diary-day';
    h.textContent = t('ui.dayOf', { day: String(day.day) });
    return [h, ...day.chapters.flatMap(c => {
      const sub = document.createElement('h3');
      sub.className = 'diary-chapter';
      sub.textContent = c.heading;
      return [sub, ...c.entries.map(text => { const p = document.createElement('p'); p.className = 'diary-entry'; p.textContent = text; return p; })];
    })];
  }));
}

/** The notebook's tabs: click or arrow keys switch between Notes, Diary and Map. */
export function initNotebookTabs(): void {
  const tabs = ['notes', 'diary', 'map'];
  const select = (name: string, focus = false) => {
    for (const n of tabs) {
      const tab = document.getElementById(`tab-${n}`)!, panel = document.getElementById(`${n}-panel`)!;
      const on = n === name;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (on && focus) tab.focus();
    }
    // The map needs room: the page opens wider while it is shown.
    document.getElementById('notebook')?.classList.toggle('wide', name === 'map');
  };
  for (const n of tabs) {
    const tab = document.getElementById(`tab-${n}`)!;
    tab.addEventListener('click', () => select(n));
    tab.addEventListener('keydown', e => {
      const i = tabs.indexOf(n);
      if (e.key === 'ArrowRight') { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + tabs.length - 1) % tabs.length], true); }
    });
  }
}
