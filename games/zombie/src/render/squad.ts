/**
 * Squad panel logic (DESIGN §17 *Squad panel*): the cards, and what a card click, F1/F2 and Tab do to the
 * selection. Pure (no Phaser), so the scenes only own the selection set and carry out the result.
 */

/** What the panel needs to know about a survivor. */
export interface SquadUnit {
  id: string;
  hp: number;
  maxHp: number;
}

export type HungerLevel = 'ok' | 'low' | 'critical' | 'starving';

/** One card: name, HP and (Base 1 only) hunger; `selected` and `alive` drive its look. */
export interface SquadCard {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  alive: boolean;
  selected: boolean;
  key: string; // the F-key that selects this card ("F1", "F2"...), '' past the last bound key
  hunger?: { frac: number; level: HungerLevel };
}

/** One card per survivor, in roster order, dead ones included (greyed) so a lost friend is still visible. */
export function squadCards(
  units: readonly SquadUnit[],
  selected: ReadonlySet<string>,
  nameOf: (id: string) => string,
  selectKeys: readonly string[],
  hungerOf?: (id: string) => { frac: number; level: HungerLevel } | undefined,
): SquadCard[] {
  return units.map((u, i) => ({
    id: u.id,
    name: nameOf(u.id),
    hp: Math.max(0, u.hp),
    maxHp: u.maxHp,
    alive: u.hp > 0,
    selected: u.hp > 0 && selected.has(u.id),
    key: selectKeys[i] ?? '',
    hunger: u.hp > 0 ? hungerOf?.(u.id) : undefined,
  }));
}

/** A card click: select only that survivor; with Shift add it, or take it out when it is already selected. A dead survivor changes nothing. */
export function pressCard(units: readonly SquadUnit[], selected: ReadonlySet<string>, id: string, add: boolean): Set<string> {
  const u = units.find((x) => x.id === id);
  const next = new Set(selected);
  if (!u || u.hp <= 0) return next;
  if (!add) return new Set([id]);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** F1 / F2 ...: the i-th survivor of the roster (0-based) if alive, else null. */
export function selectIndex(units: readonly SquadUnit[], i: number): string | null {
  const u = units[i];
  return u && u.hp > 0 ? u.id : null;
}

/** Tab: the next living survivor after the first selected one (the first living one when none is selected), wrapping round. */
export function cycleNext(units: readonly SquadUnit[], selected: ReadonlySet<string>): string | null {
  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  const at = alive.findIndex((u) => selected.has(u.id));
  return alive[(at + 1) % alive.length]!.id;
}
