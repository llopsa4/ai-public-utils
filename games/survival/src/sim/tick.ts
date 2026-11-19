// The simulation loop: a fixed tick of 10 per second, orders applied at the start of each tick.
// Pure TypeScript, no Phaser. Order handling is in `orders.ts`.
import mapConfig from '../data/map.json';
import { stepEnemies } from './combat';
import { stepEconomy } from './economy';
import { stepWaves } from './waves';
import { stepPerson } from './jobs';
import { syncWorkers } from './buildings';
import { flushOrders } from './orders';
import { assignHousing, spawnPeople } from './people';
import { createState, type GameState } from './state';

export { queueOrders } from './orders';

/** A fresh run: map, buildings, 20 people housed as far as the tipis allow. */
export function newGame(seed: number): GameState {
  const s = createState(seed);
  spawnPeople(s);
  assignHousing(s);
  return s;
}

function stepOnce(s: GameState): void {
  flushOrders(s);
  // Berries regrow slowly up to their maximum.
  const berry = mapConfig.tiles.berry;
  for (let i = 0; i < s.map.tiles.length; i++) {
    if (s.map.tiles[i] === 'berry' && s.map.amount[i] < berry.food) {
      s.map.amount[i] = Math.min(berry.food, s.map.amount[i] + berry.regrow);
    }
  }
  for (const p of s.people) stepPerson(s, p);
  syncWorkers(s);
  stepEnemies(s);
  s.tick++;
  stepEconomy(s);
  stepWaves(s);
}

/** Advances the simulation by `n` ticks; a finished run (`state.result`) stops advancing. */
export function step(s: GameState, n = 1): void {
  for (let i = 0; i < n && s.result === null; i++) stepOnce(s);
}
