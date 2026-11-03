import { createBattle } from '../combat/combat';
import { cardDefinition } from '../combat/cards';
import { EQUIPMENT_SLOTS, deriveStats, withEquipment } from '../combat/equipment';
import { EQUIPMENT } from '../combat/gear';
import type { BattleState, BattleStats, EquipmentSlot } from '../combat/types';
import { HERO_MAX_HP, HERO_MAX_MP, LOCKED_SLOTS, MAX_SALVAGE, STARTING_EQUIPMENT, STARTING_OWNED, TECHNIQUES, TONIC, maraProfile, type Reward } from '../content/kit';
import type { EncounterDefinition } from '../combat/types';
import type { Bag, GameState, Kit } from './types';

/** Mara's fighting kit and bag at the start of a game (and for saves from before fights existed). */
export function newKit(): Kit {
  return { hp: HERO_MAX_HP, mp: HERO_MAX_MP, maxHp: HERO_MAX_HP, maxMp: HERO_MAX_MP, techniques: [], equipment: structuredClone(STARTING_EQUIPMENT), owned: [...STARTING_OWNED] };
}

/** A teacher passes on a technique: once only; the most health and MP grow, and so do the current ones. */
export function learn(kit: Kit, technique: string): boolean {
  const t = TECHNIQUES[technique];
  if (!t || kit.techniques.includes(technique)) return false;
  kit.techniques.push(technique);
  kit.maxHp += t.maxHp;
  kit.hp += t.maxHp;
  kit.maxMp += t.maxMp;
  kit.mp += t.maxMp;
  return true;
}
export function newBag(): Bag {
  return { salvage: 0, materials: {}, tonics: 0 };
}

/** A free battle for an encounter, from Mara's current kit (the first fight is Kiln Courier's lesson, from FFCardGame). */
export function startBattle(state: GameState, encounter: EncounterDefinition, seed: number): BattleState {
  return createBattle(maraProfile(state.kit), encounter, seed);
}

/** Ends a fight: health and MP carry over; a win pays out. */
export function finishBattle(state: GameState, battle: BattleState, reward?: Reward): void {
  state.kit.hp = Math.max(1, battle.hero.hp);
  state.kit.mp = battle.mp;
  if (battle.outcome !== 'victory') return;
  if (!reward) return;
  state.bag.salvage = Math.min(MAX_SALVAGE, state.bag.salvage + reward.salvage);
  for (const [id, n] of Object.entries(reward.materials)) state.bag.materials[id] = (state.bag.materials[id] ?? 0) + n;
}

/** Drinks a Kiln Tonic in a fight (costs no energy). Returns the same state if there is none or HP is full. */
export function drinkTonic(battle: BattleState, bag: Bag): BattleState {
  if (battle.outcome || bag.tonics <= 0 || battle.hero.hp >= battle.config.hero.maxHp) return battle;
  bag.tonics--;
  const next = structuredClone(battle);
  next.hero.hp = Math.min(next.config.hero.maxHp, next.hero.hp + TONIC.heal);
  next.revision++;
  next.log.push(`Kiln Tonic: +${TONIC.heal} HP.`);
  return next;
}

export type PurchaseResult = 'bought' | 'noSalvage' | 'full';
export function buyTonic(bag: Bag): PurchaseResult {
  if (bag.tonics >= TONIC.max) return 'full';
  if (bag.salvage < TONIC.price) return 'noSalvage';
  bag.salvage -= TONIC.price;
  bag.tonics++;
  return 'bought';
}

/** Oren's spares join the gear Mara can choose from. */
export function giveSpares(kit: Kit, items: readonly string[]): void {
  for (const id of items) if (!kit.owned.includes(id)) kit.owned.push(id);
}

export function isLocked(slot: EquipmentSlot): boolean {
  return (LOCKED_SLOTS as readonly string[]).includes(slot);
}

/** Puts an owned item in its slot. False if it is not owned, not for that slot, or the slot is locked. */
/** Puts an owned piece in its slot. `ignoreLock` (debug mode only) lets the locked gauntlet change too. */
export function equip(kit: Kit, slot: EquipmentSlot, id: string, ignoreLock = false): boolean {
  const item = EQUIPMENT[id];
  if (!item || item.slot !== slot || !kit.owned.includes(id) || (isLocked(slot) && !ignoreLock)) return false;
  const profile = withEquipment(maraProfile(kit), { ...kit.equipment, [slot]: { id } });
  kit.equipment = structuredClone(profile.equipment!);
  kit.mp = profile.mp;
  return true;
}

/** Stats with the current gear, and with one slot changed (for the before/after comparison). */
export function statsWith(kit: Kit, slot?: EquipmentSlot, id?: string): BattleStats {
  const equipment = slot && id ? { ...kit.equipment, [slot]: { id } } : kit.equipment;
  return deriveStats(maraProfile({ ...kit, equipment }));
}

/** Owned items that fit a slot. */
export function optionsFor(kit: Kit, slot: EquipmentSlot): string[] {
  return kit.owned.filter(id => EQUIPMENT[id]?.slot === slot);
}

/** True if a saved kit only holds known, owned, correctly slotted gear and sane numbers. */
export function validKit(kit: Kit): boolean {
  // The limits are the starting ones plus what the learned techniques add, exactly.
  if (!Array.isArray(kit.techniques) || new Set(kit.techniques).size !== kit.techniques.length || !kit.techniques.every(t => Object.hasOwn(TECHNIQUES, t))) return false;
  const grown = (key: 'maxHp' | 'maxMp') => kit.techniques.reduce((n, t) => n + TECHNIQUES[t][key], 0);
  if (kit.maxHp !== HERO_MAX_HP + grown('maxHp') || kit.maxMp !== HERO_MAX_MP + grown('maxMp')) return false;
  if (!Number.isInteger(kit.hp) || kit.hp < 1 || kit.hp > kit.maxHp) return false;
  if (!kit.owned.every(id => Object.hasOwn(EQUIPMENT, id)) || new Set(kit.owned).size !== kit.owned.length) return false;
  for (const slot of EQUIPMENT_SLOTS) {
    const e = kit.equipment[slot];
    if (!e || !Object.hasOwn(EQUIPMENT, e.id) || EQUIPMENT[e.id].slot !== slot || !kit.owned.includes(e.id) || e.upgraded) return false;
  }
  try {
    const stats = deriveStats(maraProfile(kit));
    return Number.isInteger(kit.mp) && kit.mp >= 0 && kit.mp <= stats.maxMp;
  } catch {
    return false;
  }
}

/** The text of a card, for the battle UI. */
export { cardDefinition };
