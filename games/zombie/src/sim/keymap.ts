import keyData from '../data/keys.json';

// The key map (DESIGN §19 *Options*): every game key is an action with one default key (`data/keys.json`)
// that the player can rebind. Pure (no Phaser, no storage), so rebinding is testable; `sim/options.ts` keeps
// the player's overrides and `scenes/actionKeys.ts` turns key presses into actions.

/** Every action id; `tests/options.test.ts` checks this list against `data/keys.json`. */
export type ActionId =
  | 'panUp' | 'panDown' | 'panLeft' | 'panRight'
  | 'select1' | 'select2' | 'cycle' | 'freeze' | 'alert'
  | 'weapon1' | 'weapon2'
  | 'crouch' | 'hold' | 'freefire' | 'takedown' | 'carry' | 'lure'
  | 'fix' | 'cook' | 'eat' | 'give' | 'build' | 'trap';

export interface KeyAction {
  id: ActionId;
  label: string;
  /** The default key, as Phaser names it ("W", "ONE", "F1", "TAB", "SPACE"). */
  key: string;
  /** Extra keys that always work for the action and can never be bound elsewhere (the arrow keys for panning). */
  also?: readonly string[];
}

export const ACTIONS: readonly KeyAction[] = keyData.actions as KeyAction[];
export const ACTION_IDS: readonly ActionId[] = ACTIONS.map((a) => a.id);

/** Keys the game keeps for itself (menus, restart, the pan arrows): they cannot be bound to an action. */
export const RESERVED: readonly string[] = keyData.reserved;

/** A resolved key map: the key of every action. */
export type Bindings = Readonly<Record<ActionId, string>>;
/** What the player changed: only actions whose key differs from the default appear. */
export type Overrides = Partial<Record<ActionId, string>>;

const FUNCTION_KEYS = ['F1', 'F2', 'F3', 'F4', 'F6', 'F7', 'F8', 'F9', 'F10']; // F5 reloads, F11 and F12 belong to the browser
const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/** Every key a player may bind: letters, digits, F1-F4 and F6-F10, Tab and Space (minus the reserved ones). */
export const BINDABLE: readonly string[] = [...LETTERS, ...DIGITS, ...FUNCTION_KEYS, 'TAB', 'SPACE'].filter((k) => !RESERVED.includes(k));

/**
 * The key name for a `KeyboardEvent.keyCode` (the code Phaser itself uses, so it follows the player's
 * keyboard layout), or null for a key the game does not name.
 */
export function keyNameOf(keyCode: number): string | null {
  if (keyCode >= 65 && keyCode <= 90) return String.fromCharCode(keyCode);
  if (keyCode >= 48 && keyCode <= 57) return DIGITS[keyCode - 48]!;
  if (keyCode >= 112 && keyCode <= 123) return `F${keyCode - 111}`;
  const named: Record<number, string> = { 9: 'TAB', 13: 'ENTER', 27: 'ESC', 32: 'SPACE', 37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN' };
  return named[keyCode] ?? null;
}

/** How a key is shown to the player: "1" for ONE, "Tab", "Space", otherwise the name itself. */
export function keyLabel(key: string): string {
  const digit = DIGITS.indexOf(key);
  if (digit >= 0) return String(digit);
  if (key === 'TAB') return 'Tab';
  if (key === 'SPACE') return 'Space';
  return key;
}

export const defaultBindings = (): Record<ActionId, string> =>
  Object.fromEntries(ACTIONS.map((a) => [a.id, a.key])) as Record<ActionId, string>;

const isAction = (id: string): id is ActionId => ACTION_IDS.includes(id as ActionId);

/** True when no key serves two actions (the `also` keys count). */
function distinct(b: Bindings): boolean {
  const used = ACTIONS.flatMap((a) => [b[a.id], ...(a.also ?? [])]);
  return new Set(used).size === used.length;
}

/** Defaults with the overrides on top. An unusable override (unknown action, unbindable key) is ignored. */
export function resolveKeys(overrides: Overrides | undefined): Bindings {
  const out = defaultBindings();
  for (const [id, key] of Object.entries(overrides ?? {})) {
    if (isAction(id) && typeof key === 'string' && BINDABLE.includes(key)) out[id] = key;
  }
  return distinct(out) ? out : defaultBindings(); // a damaged slot that doubles a key: back to the defaults as a whole
}

/** Reads the stored `keys` field: only overrides that differ from the defaults, none if the slot is damaged. */
export function parseOverrides(raw: unknown): Overrides {
  if (typeof raw !== 'object' || raw === null) return {};
  const resolved = resolveKeys(raw as Overrides);
  const defaults = defaultBindings();
  const out: Overrides = {};
  for (const a of ACTIONS) if (resolved[a.id] !== defaults[a.id]) out[a.id] = resolved[a.id];
  return out;
}

export type BindResult =
  | { ok: true; overrides: Overrides }
  | { ok: false; reason: 'reserved' | 'unusable' | 'taken'; by?: ActionId };

/** Binds `key` to `action`; a key that is reserved, unusable or already serving another action is refused. */
export function bindKey(overrides: Overrides | undefined, action: ActionId, key: string): BindResult {
  if (RESERVED.includes(key)) return { ok: false, reason: 'reserved' };
  if (!BINDABLE.includes(key)) return { ok: false, reason: 'unusable' };
  const current = resolveKeys(overrides);
  const owner = ACTIONS.find((a) => a.id !== action && current[a.id] === key);
  if (owner) return { ok: false, reason: 'taken', by: owner.id };
  const defaults = defaultBindings();
  const next: Overrides = { ...parseOverrides(overrides) };
  if (key === defaults[action]) delete next[action];
  else next[action] = key;
  return { ok: true, overrides: next };
}

/** The action a pressed key triggers, or null (the fixed `also` keys count, the arrows pan). */
export function actionFor(b: Bindings, key: string): ActionId | null {
  return ACTIONS.find((a) => b[a.id] === key || a.also?.includes(key))?.id ?? null;
}

/** All keys of an action for polling (its bound key, then the fixed ones). */
export function keysOf(b: Bindings, action: ActionId): string[] {
  return [b[action], ...(ACTIONS.find((a) => a.id === action)?.also ?? [])];
}

/** The action behind an action-bar button; `slotKey` is the button's default key, which numbers a weapon. */
export function buttonAction(id: string, slotKey: string): ActionId | null {
  if (id.startsWith('weapon:')) return isAction(`weapon${slotKey}`) ? (`weapon${slotKey}` as ActionId) : null;
  if (id === 'spike' || id === 'can') return 'trap';
  return isAction(id) ? id : null;
}

/** Why a bind was refused, in words for the Keys page. */
export function refusal(r: Extract<BindResult, { ok: false }>): string {
  if (r.reason === 'reserved') return 'That key is kept for menus and cannot be used.';
  if (r.reason === 'unusable') return 'That key cannot be bound. Use a letter, a digit, F1-F4, F6-F10, Tab or Space.';
  return `Already used by ${ACTIONS.find((a) => a.id === r.by)?.label ?? 'another action'}. Rebind that first.`;
}
