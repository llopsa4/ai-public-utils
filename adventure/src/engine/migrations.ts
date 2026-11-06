import { newBag, newKit } from './kit';

/**
 * Save format upgrades. Each step takes the saved `state` of one version to the next; a save is
 * walked up the chain to the current version and then validated (src/engine/saveFile.ts).
 * Add a step here whenever the format changes, and a fixture save of the old version in
 * tests/fixtures/saves/.
 */
export const SAVE_VERSION = 9;

type Raw = Record<string, unknown>;

const STEPS: Record<number, (s: Raw) => void> = {
  // 3 → 4: look counters (repeated looks cycle through their lines).
  3: s => { s.looks ??= {}; },
  // 4 → 5: Mara's kit (health, gear) and bag (salvage, materials, tonics).
  4: s => { s.kit ??= newKit(); s.bag ??= newBag(); },
  // 5 → 6: chapters. Flags are kept per chapter; every older save is in chapter 1.
  5: s => {
    s.chapter = 'ch1';
    s.reached = ['ch1'];
    s.flags = { ch1: s.flags };
  },
  // 6 -> 7: techniques learned and the limits they raise (none yet in older saves).
  6: s => {
    const k = s.kit as Raw | undefined;
    if (k && typeof k === 'object') { k.techniques ??= []; k.maxHp ??= 60; k.maxMp ??= 10; }
  },
  // 7 -> 8: Tobi joins chapter 1's named cast; chapter 2 still has only Bryn.
  7: s => {
    const npcs = s.npcs;
    if (s.chapter === 'ch1' && npcs && typeof npcs === 'object' && !Array.isArray(npcs)
      && Object.keys(npcs).length === 2 && Object.hasOwn(npcs, 'oren') && Object.hasOwn(npcs, 'nell')) {
      (npcs as Raw).tobi = { pose: 'stand', face: 'right' };
    }
  },
  // 8 -> 9: move the guided Gear visit before shutdown, preserving old progress and equipment.
  8: s => {
    const flags = s.flags;
    if (!flags || typeof flags !== 'object' || Array.isArray(flags)) return;
    const ch1 = (flags as Raw).ch1;
    if (!ch1 || typeof ch1 !== 'object' || Array.isArray(ch1)) return;
    const f = ch1 as Raw;
    if (f.metOren === true) f.gearUnlocked = true;
    if (f.kilnCold === true || f.fought === true || f.gearChecked === true) {
      f.gearUnlocked = true;
      f.protectionPrepared = true;
    }
  },
};

/** Versions a save can be read from. */
export const READABLE_VERSIONS = [...Object.keys(STEPS).map(Number), SAVE_VERSION];

/** The saved state upgraded to the current version, or null for a version this game can't read. */
export function migrate(version: number, state: Raw): Raw | null {
  if (!READABLE_VERSIONS.includes(version)) return null;
  const s = structuredClone(state);
  for (let v = version; v < SAVE_VERSION; v++) STEPS[v](s);
  return s;
}
