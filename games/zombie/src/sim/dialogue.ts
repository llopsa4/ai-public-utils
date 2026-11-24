import { TICK_HZ } from './time';

// Dialogue box state (DESIGN §6): lines typed letter by letter; a click or Enter completes the line
// being typed, then advances to the next. Pure and tick-based like the rest of the sim, so it is
// unit-testable; scenes/Dialogue.ts only draws it.

export interface DialogueLine {
  speaker: string;
  /** neutral, afraid or determined (Z55); absent reads as neutral. `hurt` is applied by the box under 35% HP. */
  mood?: string;
  text: string;
}

export interface DialogueState {
  lines: readonly DialogueLine[];
  index: number;
  /** Characters of the current line shown so far. */
  shown: number;
  finished: boolean;
}

/** Typing speed, in characters per second. */
export const TYPE_CPS = 40;
const CHARS_PER_TICK = TYPE_CPS / TICK_HZ;

export function startDialogue(lines: readonly DialogueLine[]): DialogueState {
  return { lines, index: 0, shown: 0, finished: lines.length === 0 };
}

export function currentLine(s: DialogueState): DialogueLine | null {
  return s.finished ? null : (s.lines[s.index] ?? null);
}

/** True while the current line is still being typed. */
export function isTyping(s: DialogueState): boolean {
  const line = currentLine(s);
  return !!line && s.shown < line.text.length;
}

/** The part of the current line to draw. */
export function visibleText(s: DialogueState): string {
  const line = currentLine(s);
  return line ? line.text.slice(0, Math.floor(s.shown)) : '';
}

/** Type for `ticks` simulation ticks (a no-op once the line is complete). */
export function stepDialogue(s: DialogueState, ticks = 1): void {
  const line = currentLine(s);
  if (!line) return;
  s.shown = Math.min(line.text.length, s.shown + ticks * CHARS_PER_TICK);
}

/** Click or Enter: complete the line being typed, otherwise go to the next line (or finish). */
export function advance(s: DialogueState): void {
  const line = currentLine(s);
  if (!line) return;
  if (isTyping(s)) {
    s.shown = line.text.length;
    return;
  }
  s.index += 1;
  s.shown = 0;
  if (s.index >= s.lines.length) s.finished = true;
}

/** Esc: finish the whole dialogue at once (every remaining line is skipped). */
export function skipDialogue(s: DialogueState): void {
  s.index = s.lines.length;
  s.shown = 0;
  s.finished = true;
}
