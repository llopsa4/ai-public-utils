// Labels shown to the player (DESIGN-upgrades-3.md `## Labels (Dakota)`). Every upgrade and building
// type may carry a `dakota` word in its data file. A word is filled in only after the user approves it
// in CULTURE.md; until then the label is the English one. Pure TypeScript, no Phaser.
import upgradesData from '../data/upgrades.json';
import { buildingDefs, buildingName } from './buildings';
import type { Person, Res } from './state';

/** "Dakota (English)" when there is a Dakota word, else the English alone. */
export function labelText(english: string, dakota?: string): string {
  const word = dakota?.trim();
  return word ? `${word} (${english})` : english;
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The English label of an upgrade or a building type ("Hunting dogs", "Healers' lodge"). */
export function englishLabel(id: string): string {
  const upgrade = (upgradesData.upgrades as Record<string, { label: string }>)[id];
  return upgrade ? upgrade.label : sentenceCase(buildingName(id));
}

/** What the UI shows for an upgrade or building id. Hovering it shows `englishLabel(id)`. */
export function displayLabel(id: string): string {
  const upgrade = (upgradesData.upgrades as Record<string, { dakota?: string }>)[id];
  const dakota = upgrade ? upgrade.dakota : buildingDefs[id]?.dakota;
  return labelText(englishLabel(id), dakota);
}

/** `Carrying: 5 wood` for one person, the totals per resource for several; '' when nobody carries anything.
 *  A hunter's hides ride along with the food and count as hides. */
export function carryText(people: ReadonlyArray<Pick<Person, 'carry'>>): string {
  const totals = new Map<Res, number>();
  const add = (res: Res, amount: number): void => {
    if (amount > 0) totals.set(res, (totals.get(res) ?? 0) + amount);
  };
  for (const p of people) {
    add(p.carry.res, p.carry.amount);
    add('hides', p.carry.hides ?? 0);
  }
  const parts = [...totals]
    .map(([res, amount]) => [res, Math.floor(amount)] as const)
    .filter(([, n]) => n > 0)
    .map(([res, n]) => `${n} ${res === 'hides' && n === 1 ? 'hide' : res}`);
  return parts.length ? `Carrying: ${parts.join(', ')}` : '';
}
