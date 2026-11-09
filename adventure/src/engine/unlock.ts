// Which chapters the player may start next (STORY.md, "Unlock rules"): a chapter opens once every
// chapter it requires has been finished, and closes once it has been played. More rules (one new
// character per chapter, weaving between people, Day 4 and Day 5) come as more chapters exist.

/** Each chapter's required chapters. The intro (Silas's flash-forward) opens Mara 1. */
export const REQUIRES: Record<string, readonly string[]> = {
  ch1: ['intro'],
  ch2: ['ch1'],
};

/** The chapters open to start, in story order, given those already finished. */
export function openChapters(finished: readonly string[]): string[] {
  const done = new Set(finished);
  return Object.entries(REQUIRES).filter(([id, needs]) => !done.has(id) && needs.every(n => done.has(n))).map(([id]) => id);
}
