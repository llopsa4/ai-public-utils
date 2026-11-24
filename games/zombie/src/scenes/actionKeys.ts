import Phaser from 'phaser';
import { type ActionId, actionFor, keyLabel, keyNameOf } from '../sim/keymap';
import { liveKeys } from '../sim/options';

// Key presses become actions here (DESIGN §19 key rebinding): a scene lists what each action does and one
// listener looks the pressed key up in the live key map, so a rebind in the pause menu applies at once
// and no scene hard-codes a letter.

export type ActionHandlers = Partial<Record<ActionId, () => void>>;

/**
 * Calls the handler of whichever action the pressed key is bound to. Held keys (auto-repeat) do nothing.
 * A key that serves an action is kept from the browser (F1 help, Tab focus) even when this scene has no
 * handler for it, so the same key behaves the same in every scene. Call once in `create`.
 */
export function bindActionKeys(scene: Phaser.Scene, handlers: ActionHandlers): void {
  scene.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
    const name = keyNameOf(e.keyCode);
    const action = name ? actionFor(liveKeys(), name) : null;
    if (!action) return;
    e.preventDefault();
    if (!e.repeat) handlers[action]?.();
  });
}

/** The label of an action's key now ("C", "1", "Tab", "Space"). */
export function keyOf(action: ActionId): string {
  return keyLabel(liveKeys()[action]);
}

/**
 * Fills a help text: `{crouch}` becomes the label of the crouch key, and so on. Unknown names stay as
 * written, so a typo shows up on screen.
 */
export function fillHelp(text: string): string {
  return text.replace(/\{(\w+)\}/g, (whole, id: string) => {
    const key = (liveKeys() as Record<string, string | undefined>)[id];
    return key === undefined ? whole : keyLabel(key);
  });
}
