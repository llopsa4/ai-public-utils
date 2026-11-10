// Map labels on dark plates, readable over any part of the painted map (the chapter map and the
// notebook's Map tab). The plates are sized to their text once the map is on screen.
import { MAP_SIZE } from '../content/world';
import { el } from './journal';

/** A label on a dark plate; `anchor` as SVG text-anchor (the plate follows it). */
export function plated(text: string, x: number, y: number, kind: string, anchor: 'start' | 'middle' | 'end' = 'middle'): SVGGElement {
  const g = el('g', { class: `map-plate ${kind}` }) as SVGGElement;
  g.append(el('rect', { rx: 6, ry: 6 }), el('text', { x, y, 'text-anchor': anchor }, text));
  return g;
}

/** Sizes each plate to its text, and nudges plates that would cross the map's edge back inside. */
export function fitPlates(svg: SVGSVGElement): void {
  for (const g of svg.querySelectorAll<SVGGElement>('.map-plate')) {
    const text = g.querySelector('text') as SVGTextElement, rect = g.querySelector('rect') as SVGRectElement;
    const box = text.getBBox(), padX = 10, padY = 4;
    let shift = 0;
    if (box.x - padX < 4) shift = 4 - (box.x - padX);
    else if (box.x + box.width + padX > MAP_SIZE.w - 4) shift = MAP_SIZE.w - 4 - (box.x + box.width + padX);
    if (shift) text.setAttribute('x', String(Number(text.getAttribute('x')) + shift));
    rect.setAttribute('x', String(box.x + shift - padX));
    rect.setAttribute('y', String(box.y - padY));
    rect.setAttribute('width', String(box.width + padX * 2));
    rect.setAttribute('height', String(box.height + padY * 2));
  }
}

/** fitPlates once the map is actually shown (a hidden map measures every text as empty). */
export function fitPlatesWhenShown(svg: SVGSVGElement, tries = 120): void {
  const text = svg.querySelector('.map-plate text') as SVGTextElement | null;
  if (!text) return;
  if (svg.isConnected && text.getBBox().width > 0) { fitPlates(svg); return; }
  if (tries > 0) requestAnimationFrame(() => fitPlatesWhenShown(svg, tries - 1));
}
