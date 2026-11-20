// Labels shown to the player (DESIGN-upgrades-3.md `## Labels (Dakota)`). Every upgrade and building
// type may carry a `dakota` word in its data file. A word is filled in only after the user approves it
// in CULTURE.md; until then the label is the English one. Pure TypeScript, no Phaser.
import upgradesData from '../data/upgrades.json';
import { buildingDefs, buildingName } from './buildings';

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
