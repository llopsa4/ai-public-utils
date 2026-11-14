/** Small drawn cursors that say what a click will do (pointer devices only). */
import workGlove from '../../art/src/ui/cursor-work-glove.png';
import exitDoor from '../../art/src/ui/cursor-exit-door.png';
import { CURSOR_ART } from '../content/art';
export type CursorKind = 'look' | 'hand' | 'talk' | 'exit';

const svg = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='#ffd79a' stroke='#1a1014' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>${body}</g></svg>`,
  )}")`;

const SHAPES: Record<'look' | 'talk', { body: string; x: number; y: number; fallback: string }> = {
  // An eye.
  look: { body: "<path d='M2 14 Q14 3 26 14 Q14 25 2 14 Z'/><circle cx='14' cy='14' r='4' fill='#1a1014'/>", x: 14, y: 14, fallback: 'help' },
  // A speech bubble.
  talk: { body: "<path d='M3 5 H25 V18 H12 L6 24 L7 18 H3 Z'/><circle cx='9' cy='11.5' r='1.5' fill='#1a1014'/><circle cx='14' cy='11.5' r='1.5' fill='#1a1014'/><circle cx='19' cy='11.5' r='1.5' fill='#1a1014'/>", x: 14, y: 12, fallback: 'pointer' },
};

export function cursorFor(kind: CursorKind | null): string {
  if (!kind) return '';
  if (kind === 'hand' || kind === 'exit') {
    const [x, y] = CURSOR_ART[kind].hotspot;
    return `url("${kind === 'hand' ? workGlove : exitDoor}") ${x} ${y}, pointer`;
  }
  const s = SHAPES[kind];
  return `${svg(s.body)} ${s.x} ${s.y}, ${s.fallback}`;
}
