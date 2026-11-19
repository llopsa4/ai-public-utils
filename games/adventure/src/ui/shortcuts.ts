import type { GameState } from '../engine/types';
import { CHAPTERS } from '../chapters';

export type ScreenPanel = 'gear' | 'notebook' | 'menu';
export interface ShortcutKey {
  key: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}
export interface ShortcutContext {
  editing: boolean;
  /** Speech, choices, intros, battles, title/end cards or an action ring. */
  blocked: boolean;
  busy: boolean;
  /** Every currently open dialog; more than one means a child is stacked on a parent. */
  dialogs: readonly string[];
  gearAvailable: boolean;
  gearPending: boolean;
  forcingGear: boolean;
  gearButtonFocused: boolean;
}
export type ScreenShortcut = { type: 'open' | 'close' | 'guide'; panel: ScreenPanel };

/** Chapter one's gear screen unlock is a story event, independent of conversation or owned gear. */
export function gearAvailable(state: Pick<GameState, 'chapter' | 'flags'>): boolean {
  // The gear is Mara's: another hero's chapter (Silas's intro) has none.
  if (CHAPTERS[state.chapter]?.hero && !CHAPTERS[state.chapter].hero!.mara) return false;
  return state.chapter !== 'ch1' || state.flags.gearUnlocked === true;
}

/** Pure policy; the DOM adapter performs cancellation and opens/closes the existing screens. */
export function screenShortcut(key: ShortcutKey, context: ShortcutContext): ScreenShortcut | null {
  if (key.repeat || key.ctrlKey || key.altKey || key.metaKey || context.editing || context.blocked || context.gearPending) return null;
  const letter = key.key.toLowerCase();
  if (context.forcingGear) {
    if (context.dialogs.length) return null;
    return letter === 'g' || (context.gearButtonFocused && (key.key === 'Enter' || key.key === ' '))
      ? { type: 'guide', panel: 'gear' } : null;
  }
  if (!['g', 'n', 'm'].includes(letter)) return null;
  const panel = ({ g: 'gear', n: 'notebook', m: 'menu' } as const)[letter as 'g' | 'n' | 'm'];
  if (context.dialogs.length) {
    return context.dialogs.length === 1 && context.dialogs[0] === panel ? { type: 'close', panel } : null;
  }
  if (context.busy || (panel === 'gear' && !context.gearAvailable)) return null;
  return { type: 'open', panel };
}
