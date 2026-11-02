import { conditionsHold } from './geometry';
import type { Command, Condition, GameState, RoomDef, Verb } from './types';

/**
 * Click rules: what a verb, or an inventory item, does to a target. A chapter lists its rules in
 * order and the first that matches answers; with no match the chapter's fallback does. Pure: rules
 * read the state and return commands for the scene to play.
 */
export interface Rule {
  /** Hotspot id, character id, or `item:<id>` for something in the inventory. */
  target: string | readonly string[];
  /** Verbs this rule answers (any verb when omitted). Ignored for item rules (using an item). */
  verb?: Verb | readonly Verb[];
  /** Without `item` the rule answers only plain verbs; `'*'` answers any item. */
  item?: string;
  when?: Condition[];
  /** Mara first walks to the hotspot's walk-to point. */
  walk?: boolean;
  do: readonly Command[] | ((ctx: RuleContext) => Command[]);
}

export interface RuleContext { state: GameState; verb: Verb; target: string; item?: string }

const list = <T>(v: T | readonly T[]): readonly T[] => (Array.isArray(v) ? v : [v as T]);

export function matches(rule: Rule, state: GameState, verb: Verb, target: string, item?: string): boolean {
  if (!list(rule.target).includes(target)) return false;
  if (item) { if (rule.item !== '*' && rule.item !== item) return false; }
  else if (rule.item !== undefined || (rule.verb !== undefined && !list(rule.verb).includes(verb))) return false;
  return conditionsHold(state, rule.when);
}

/** Mara's walk to a hotspot's walk-to point, if it has one. */
export function approach(rooms: Record<string, RoomDef>, state: GameState, target: string): Command[] {
  const spot = rooms[state.room]?.hotspots.find(h => h.id === target);
  return spot?.walkTo ? [{ type: 'walk', to: spot.walkTo, face: spot.face }] : [];
}

/** The first matching rule's commands, or null when none matches. */
export function applyRules(rules: readonly Rule[], rooms: Record<string, RoomDef>, state: GameState, verb: Verb, target: string, item?: string): Command[] | null {
  const rule = rules.find(r => matches(r, state, verb, target, item));
  if (!rule) return null;
  const body = typeof rule.do === 'function' ? rule.do({ state, verb, target, item }) : [...rule.do];
  return rule.walk ? [...approach(rooms, state, target), ...body] : body;
}

/**
 * Repeated looks cycle through a line's variants (`<key>`, `<key>.2`, `<key>.3`) and are counted
 * (the `looked` command), for the lines listed in `varied`.
 */
export function cycleLook(state: GameState, target: string, commands: Command[], varied: readonly string[]): Command[] {
  const i = commands.findIndex(c => c.type === 'say' && varied.includes(c.text));
  if (i < 0) return commands;
  const line = commands[i] as Extract<Command, { type: 'say' }>;
  const n = (state.looks[target] ?? 0) % 3;
  const text = n === 0 ? line.text : `${line.text}.${n + 1}`;
  return [...commands.slice(0, i), { ...line, text }, ...commands.slice(i + 1), { type: 'looked', id: target }];
}
