/** Small drawn cursors that say what a click will do (pointer devices only). */
export type CursorKind = 'look' | 'hand' | 'talk' | 'exit';

const svg = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='#ffd79a' stroke='#1a1014' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>${body}</g></svg>`,
  )}")`;

const SHAPES: Record<CursorKind, { body: string; x: number; y: number; fallback: string }> = {
  // An eye.
  look: { body: "<path d='M2 14 Q14 3 26 14 Q14 25 2 14 Z'/><circle cx='14' cy='14' r='4' fill='#1a1014'/>", x: 14, y: 14, fallback: 'help' },
  // An open hand reaching.
  hand: { body: "<path d='M8 26 L6 14 Q6 11 9 12 L10 15 L10 5 Q12 3 14 5 L14 13 L14 4 Q16 2 18 4 L18 13 L18 6 Q20 4 22 6 L22 18 Q21 25 16 26 Z'/>", x: 12, y: 4, fallback: 'pointer' },
  // A speech bubble.
  talk: { body: "<path d='M3 5 H25 V18 H12 L6 24 L7 18 H3 Z'/><circle cx='9' cy='11.5' r='1.5' fill='#1a1014'/><circle cx='14' cy='11.5' r='1.5' fill='#1a1014'/><circle cx='19' cy='11.5' r='1.5' fill='#1a1014'/>", x: 14, y: 12, fallback: 'pointer' },
  // A doorway with an arrow walking through it.
  exit: { body: "<path d='M4 26 V4 H16 V26'/><path d='M12 15 H26 M21 10 L26 15 L21 20' fill='none'/>", x: 14, y: 15, fallback: 'pointer' },
};

export function cursorFor(kind: CursorKind | null): string {
  if (!kind) return '';
  const s = SHAPES[kind];
  return `${svg(s.body)} ${s.x} ${s.y}, ${s.fallback}`;
}
