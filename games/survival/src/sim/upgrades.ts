// Upgrades and gift value (DESIGN-upgrades.md): the daily gift by Wotakuye band, and buying.
// Pure TypeScript, no Phaser.
import data from '../data/upgrades.json';
import { callAllies } from './allies';
import { startEffect } from './effects';
import { buildingName } from './buildings';
import { BANDS, unityBand } from './economy';
import { addMessage, horseCap, type GameState, type Res, type Tile2 } from './state';

export type UpgradeId = keyof typeof data.upgrades;

export const UPGRADE_IDS = Object.keys(data.upgrades) as UpgradeId[];
export const upgradeLabel = (id: UpgradeId): string => data.upgrades[id].label;
export const upgradeCost = (id: UpgradeId): Partial<Record<'gift' | Res, number>> => data.upgrades[id].cost;

export const hasUpgrade = (s: Pick<GameState, 'upgrades'>, id: UpgradeId): boolean => s.upgrades.includes(id);

/** Build points a worker adds per tick, times this: 1.5 with the tools upgrade, else 1. */
export const buildSpeed = (s: Pick<GameState, 'upgrades'>): number =>
  hasUpgrade(s, 'tools') ? data.upgrades.tools.buildSpeed : 1;

/** Gift value a band earns at a day start. */
export const giftForBand = (band: string): number => (data.giftPerDay as Record<string, number>)[band] ?? 0;

/** The upgrade an upgrade needs before it can be bought (tier 2 needs a tier 1), or null. */
export const requiresOf = (id: UpgradeId): UpgradeId | null =>
  ((data.upgrades[id] as { requires?: string }).requires as UpgradeId | undefined) ?? null;

/** The tier 1 upgrade this one needs and the camp does not own yet, or null (DESIGN-upgrades-2.md `## Upgrades`). */
export function missingRequirement(s: Pick<GameState, 'upgrades'>, id: UpgradeId): UpgradeId | null {
  const req = requiresOf(id);
  return req && !hasUpgrade(s, req) ? req : null;
}

/** The building type whose panel sells an upgrade (DESIGN-upgrades-3.md `## Upgrade homes`). */
export const homeOf = (id: UpgradeId): string => (data.upgrades[id] as { home: string }).home;

/** The Wotakuye band an upgrade needs to be bought (the Fantasy tier needs United), or null. */
export const bandOf = (id: UpgradeId): string | null => (data.upgrades[id] as { band?: string }).band ?? null;

/** The upgrades sold at a building type, in data order; empty for most types. */
export const upgradesOf = (type: string): UpgradeId[] => UPGRADE_IDS.filter((id) => homeOf(id) === type);

/** True when the camp has no finished building of the upgrade's home type. */
export const missingHome = (s: Pick<GameState, 'buildings'>, id: UpgradeId): boolean =>
  !s.buildings.some((b) => b.type === homeOf(id) && b.done);

/** The band the camp must reach to buy an upgrade, when it is not in it now; else null. */
export const missingBand = (s: GameState, id: UpgradeId): string | null => {
  const need = bandOf(id);
  return need && unityBand(s).name !== need ? need : null;
};

/**
 * What blocks buying apart from the price, as the row shows it: `Needs <upgrade label>`, `Needs United`, or
 * `Needs a <building>` when the home building is gone. Null when only the price may be in the way.
 */
export function upgradeNeeds(s: GameState, id: UpgradeId): string | null {
  const req = missingRequirement(s, id);
  if (req) return `Needs ${upgradeLabel(req)}`;
  const band = missingBand(s, id);
  if (band) return `Needs ${band}`;
  if (missingHome(s, id)) return `Needs a finished ${buildingName(homeOf(id))}`;
  return null;
}

/** What the camp still lacks for an upgrade, e.g. `['gift 2', 'wood 5']`; empty when it can be bought. */
export function missingFor(s: GameState, id: UpgradeId): string[] {
  const out: string[] = [];
  for (const [res, need] of Object.entries(upgradeCost(id)) as ['gift' | Res, number][]) {
    const have = res === 'gift' ? s.gift : s.store[res];
    if (have < need) out.push(`${res} ${Math.ceil(need - have)}`);
  }
  return out;
}

/** The Fantasy power upgrades (spirit lodge), in data order: the ones with a `power` entry. */
export const POWER_IDS = UPGRADE_IDS.filter((id) => 'power' in data.upgrades[id]);

export const isPower = (id: string): id is UpgradeId => (POWER_IDS as string[]).includes(id);

/** True when a power is cast at a clicked point (bison charge, storm caller) rather than at once. */
export const powerAims = (id: UpgradeId): boolean => (data.upgrades[id] as { power?: { aim: boolean } }).power?.aim ?? false;

/** True once a power has been cast since the last wave warning started. */
export const powerSpent = (s: Pick<GameState, 'powersUsed'>, id: UpgradeId): boolean => s.powersUsed.includes(id);

/** True when the camp is in the Steady band or a better one, which a cast needs. */
export function steadyEnough(s: GameState): boolean {
  const names = BANDS.map((b) => b.name);
  return names.indexOf(unityBand(s).name) >= names.indexOf(data.castBand);
}

/** Why a power cannot be cast now (a short sentence), or null when it can. `at` is the clicked tile for aimed powers. */
export function castError(s: GameState, id: string, at?: Tile2): string | null {
  if (!isPower(id) || !hasUpgrade(s, id)) return "That power isn't known yet.";
  if (powerSpent(s, id)) return `${upgradeLabel(id)} is spent until the next wave warning.`;
  if (!steadyEnough(s)) return `The camp is too ${unityBand(s).name.toLowerCase()} to call ${upgradeLabel(id)}.`;
  if (powerAims(id) && !at) return `${upgradeLabel(id)} needs a point on the map.`;
  return null;
}

/**
 * Casts a power once per wave (the cast order, so it works while paused). Marks it spent and toasts the refusal
 * or the call; the spirit warriors and guardian wolves appear at once (`allies.ts`); the bison lane and the
 * storm start at the point (`effects.ts`). Returns false when refused.
 */
export function castPower(s: GameState, id: string, at?: Tile2): boolean {
  const error = castError(s, id, at);
  if (error) {
    addMessage(s, error);
    return false;
  }
  s.powersUsed.push(id);
  callAllies(s, id);
  startEffect(s, id, at);
  addMessage(s, `${upgradeLabel(id as UpgradeId)} called.`);
  return true;
}

/** Buys an upgrade once: takes the gift value and goods and toasts it. False when owned or short. */
export function buyUpgrade(s: GameState, id: UpgradeId): boolean {
  if (!(id in data.upgrades) || hasUpgrade(s, id) || upgradeNeeds(s, id) || missingFor(s, id).length > 0) return false;
  for (const [res, need] of Object.entries(upgradeCost(id)) as ['gift' | Res, number][]) {
    if (res === 'gift') s.gift -= need;
    else s.store[res] -= need;
  }
  s.upgrades.push(id);
  const horses = (data.upgrades[id] as { startHorses?: number }).startHorses;
  if (horses) s.horses = Math.min(horseCap(s), s.horses + horses);
  addMessage(s, data.toasts[id]);
  return true;
}
