// Upgrades and gift value (DESIGN-upgrades.md): the daily gift by Wotakuye band, and buying.
// Pure TypeScript, no Phaser.
import data from '../data/upgrades.json';
import { addMessage, type GameState, type Res } from './state';

export type UpgradeId = keyof typeof data.upgrades;

export const UPGRADE_IDS = Object.keys(data.upgrades) as UpgradeId[];
export const upgradeLabel = (id: UpgradeId): string => data.upgrades[id].label;
export const upgradeCost = (id: UpgradeId): Partial<Record<'gift' | Res, number>> => data.upgrades[id].cost;

export const hasUpgrade = (s: Pick<GameState, 'upgrades'>, id: UpgradeId): boolean => s.upgrades.includes(id);

/** Gift value a band earns at a day start. */
export const giftForBand = (band: string): number => (data.giftPerDay as Record<string, number>)[band] ?? 0;

/** What the camp still lacks for an upgrade, e.g. `['gift 2', 'wood 5']`; empty when it can be bought. */
export function missingFor(s: GameState, id: UpgradeId): string[] {
  const out: string[] = [];
  for (const [res, need] of Object.entries(upgradeCost(id)) as ['gift' | Res, number][]) {
    const have = res === 'gift' ? s.gift : s.store[res];
    if (have < need) out.push(`${res} ${Math.ceil(need - have)}`);
  }
  return out;
}

/** Buys an upgrade once: takes the gift value and goods and toasts it. False when owned or short. */
export function buyUpgrade(s: GameState, id: UpgradeId): boolean {
  if (!(id in data.upgrades) || hasUpgrade(s, id) || missingFor(s, id).length > 0) return false;
  for (const [res, need] of Object.entries(upgradeCost(id)) as ['gift' | Res, number][]) {
    if (res === 'gift') s.gift -= need;
    else s.store[res] -= need;
  }
  s.upgrades.push(id);
  addMessage(s, data.toasts[id]);
  return true;
}
