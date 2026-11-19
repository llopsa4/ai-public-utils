// Map labels on dark plates, readable over any part of the painted map (the chapter map and the
// notebook's Map tab). The plates are sized to their text once the map is on screen.
import { MAP_SIZE } from '../content/world';

const el = (name: string, attrs: Record<string, string | number>, text?: string): SVGElement => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
};

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

interface PlateBox { x: number; y: number; width: number; height: number }

/** Keep labels near their landmarks while leaving a clear gap and an inset at every edge. */
export function layoutNotebookPlates(boxes: PlateBox[], gap: number, inset: number): PlateBox[] {
  const placed: PlateBox[] = [];
  const clamp = (value: number, size: number, limit: number) => Math.max(inset, Math.min(value, limit - inset - size));
  for (const box of boxes) {
    const width = Math.min(box.width, MAP_SIZE.w - inset * 2);
    const height = Math.min(box.height, MAP_SIZE.h - inset * 2);
    const xs = [clamp(box.x, width, MAP_SIZE.w), inset, MAP_SIZE.w - inset - width];
    const ys = [clamp(box.y, height, MAP_SIZE.h), inset, MAP_SIZE.h - inset - height];
    for (const other of placed) {
      xs.push(clamp(other.x - gap - width, width, MAP_SIZE.w), clamp(other.x + other.width + gap, width, MAP_SIZE.w));
      ys.push(clamp(other.y - gap - height, height, MAP_SIZE.h), clamp(other.y + other.height + gap, height, MAP_SIZE.h));
    }
    const candidates = xs.flatMap(x => ys.map(y => ({ x, y, width, height })));
    candidates.sort((a, b) => Math.hypot(a.x - box.x, a.y - box.y) - Math.hypot(b.x - box.x, b.y - box.y));
    const clear = candidates.find(candidate => placed.every(other =>
      candidate.x + width + gap <= other.x || other.x + other.width + gap <= candidate.x
      || candidate.y + height + gap <= other.y || other.y + other.height + gap <= candidate.y));
    placed.push(clear ?? candidates[0]);
  }
  return placed;
}

const originalPositions = new WeakMap<SVGTextElement, { x: string; y: string }>();

/** Notebook-only sizing in screen pixels; chapter selection retains its original typography. */
export function fitNotebookPlates(svg: SVGSVGElement): void {
  const screenWidth = svg.getBoundingClientRect().width;
  if (!screenWidth) return; // Tab activation, resize and fonts loading will measure it when visible.
  const scale = screenWidth / MAP_SIZE.w;
  const groups = [...svg.querySelectorAll<SVGGElement>('.map-plate')]
    .sort((a, b) => Number(b.classList.contains('live')) - Number(a.classList.contains('live')));
  const padX = 8 / scale, padY = 3 / scale;
  const measured = groups.map(group => {
    const text = group.querySelector('text') as SVGTextElement;
    let original = originalPositions.get(text);
    if (!original) {
      original = { x: text.getAttribute('x')!, y: text.getAttribute('y')! };
      originalPositions.set(text, original);
    }
    text.setAttribute('x', original.x);
    text.setAttribute('y', original.y);
    const live = group.classList.contains('live');
    text.style.fontSize = `${Math.ceil(Math.max(live ? 22 : 18, (live ? 14 : 12) / scale) * 1000) / 1000}px`;
    text.removeAttribute('textLength');
    text.removeAttribute('lengthAdjust');
    const box = text.getBBox();
    const maxWidth = MAP_SIZE.w - 8 / scale - padX * 2;
    if (box.width > maxWidth) {
      text.setAttribute('textLength', String(maxWidth));
      text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    const fitted = text.getBBox();
    return { text, x: fitted.x - padX, y: fitted.y - padY, width: Math.min(fitted.width, maxWidth) + padX * 2, height: fitted.height + padY * 2 };
  });
  const positions = layoutNotebookPlates(measured, 4 / scale, 4 / scale);
  positions.forEach((position, index) => {
    const item = measured[index], rect = groups[index].querySelector('rect')!;
    item.text.setAttribute('x', String(Number(item.text.getAttribute('x')) + position.x - item.x));
    item.text.setAttribute('y', String(Number(item.text.getAttribute('y')) + position.y - item.y));
    for (const [key, value] of Object.entries(position)) rect.setAttribute(key, String(value));
  });
}
