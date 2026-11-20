import seasons from '../../src/data/seasons.json';
import { mealNeed } from '../../src/sim/economy';
import { addBuilding, type GameState } from '../../src/sim/state';
import { step } from '../../src/sim/tick';

/** Adds a finished hunting lodge, the home of Hunting dogs, Better bows and Akicita scouts. */
export function addHuntingLodge(s: GameState): void {
  addBuilding(s, 'hunting_lodge', 36, 36, true);
}

/**
 * Steps `n` ticks and puts back the food each meal eats, so job tests can watch the store alone.
 * Spoilage is switched off for the call too (it would also change the store at every day start).
 */
export function stepFed(s: GameState, n: number): void {
  const saved = { ...seasons.spoilPerDay };
  for (const k of Object.keys(seasons.spoilPerDay) as (keyof typeof saved)[]) seasons.spoilPerDay[k] = 0;
  try {
    for (let i = 0; i < n; i++) {
      const need = mealNeed(s);
      step(s, 1);
      if (s.tick % 600 === 0) s.store.food += need;
    }
  } finally {
    Object.assign(seasons.spoilPerDay, saved);
  }
}
