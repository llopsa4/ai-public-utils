// Base 1 balance check (DESIGN §12, §19 *Balance*; PLAN Z43). Plays Base 1 headless with two scripted
// defences over many seeds and prints how often each wins:
//   careful: fixes both windows and leaves the door gap as the kill zone, puts the spare scrap into spike
//            pits on the door's approach, holds both door posts (Fighter west, Scout east), saves the ammo for
//            the herd (then free fire), eats so the heal is not wasted, cooks in the lulls, hands a spare meal
//            to a hurt friend, and turns to strike anything biting from outside the hold cone.
//   passive: fixes all three openings, then both survivors hold one spot in the middle of the house facing
//            the door and eat when hungry. No traps, no free fire, no turning, no attacking.
// Target: careful 70–80%, passive under 20%. Tuning edits data only (base1.json, enemies.json, characters.json).
//
//   npm run balance                              100 seeds, both bots
//   npm run balance -- --seeds 200               more seeds
//   npm run balance -- --bot careful --verbose   one line per seed (cause, herd left, HP, bites taken)
//   npm run balance -- --bot careful --trace 7 --from 420   one line per second of seed 7 from 7:00
//
// A seed changes the world (zombie wandering) and the bot (its reaction delays), so a run stands for one
// player on one try. Survivors start with Base 1's default carry (base1.json `start`) and Cass's gun unlocked,
// as after the arrival beat.
import base from '../src/data/base1.json';
import {
  type BaseState,
  createBase,
  eat,
  give,
  herdLeft,
  hungerLevel,
  orderCook,
  orderFix,
  orderHold,
  orderMove,
  stepBase,
} from '../src/sim/base';
import { setFreeFire } from '../src/sim/abilities';
import { orderAttack, type Enemy, type Survivor } from '../src/sim/mission';
import { type RngState, makeRng, rngInt } from '../src/sim/rng';
import { TICK_HZ } from '../src/sim/time';
import { orderRearm, orderTrap } from '../src/sim/traps';
import { dist, lineOfSight } from '../src/sim/vision';

const LIMIT = 15 * 60 * TICK_HZ; // a run that is still going after 15 minutes counts as a loss

type Pt = [number, number];
interface Mem {
  rng: RngState;
  next: Record<string, number>; // tick of each survivor's next decision (reaction delay)
  jobs: Record<string, string[]>; // prep jobs still to do, in order
}
type Bot = (s: BaseState, m: Mem, u: Survivor) => void;

const live = (s: BaseState): Enemy[] => s.enemies.filter((e) => e.hp > 0);
const near = (s: BaseState, u: Survivor, r: number): Enemy[] => live(s).filter((e) => dist(u.x, u.y, e.x, e.y) <= r);
const busy = (u: Survivor): boolean => u.order !== null && u.order.type !== 'hold';
const at = (u: Survivor, p: Pt): boolean => dist(u.x, u.y, p[0], p[1]) < 0.05;
const inside = (u: Survivor): boolean => u.x > 9.5 && u.x < 21.5 && u.y > 9.5 && u.y < 18.5;
const holding = (u: Survivor): boolean => u.order?.type === 'hold';
const door = base.openings.find((o) => o.kind === 'door')!;

/** Walk to `post`, then hold facing `toward`. */
function holdAt(s: BaseState, u: Survivor, post: Pt, toward: Pt): void {
  if (!at(u, post)) {
    if (u.order?.type === 'move') return;
    if (orderMove(s, [u.id], post).length > 0 && u.path.length > 0) return;
  }
  if (!holding(u)) orderHold(s, u.id, toward); // there, or no way there: hold where they stand
}

// ---- careful ----

// Both posts reach a zombie in the gap. Most of the herd comes along the west side, so the Fighter (knife)
// takes the west post: a zombie stops at reach from her, and the east post cannot always reach it.
const POSTS: Record<string, Pt> = { fighter: [door.x - 1, door.y - 1], scout: [door.x + 1, door.y - 1] };
// Spike pits on the three tiles a zombie crosses to reach the door gap, front one first.
const PITS: Pt[] = [[door.x, door.y + 1], [door.x - 1, door.y + 1], [door.x + 1, door.y + 1]];

const careful: Bot = (s, m, u) => {
  const h = s.hunger[u.id]!;
  const threat = near(s, u, 6);
  // Strike anything in reach that the hold cone would miss (biting from the side or behind).
  const biter = threat.find((e) => dist(u.x, u.y, e.x, e.y) <= 1.5 && lineOfSight(s.grid, u.x, u.y, e.x, e.y));
  if (biter && !(holding(u) && inFront(u, biter))) {
    if (u.order?.type !== 'attack') orderAttack(s, [u.id], biter.id);
    return;
  }
  // Eat when the heal is not wasted or when badly hurt. Hungry before the herd: eat now and cook again in
  // the calm, so both go into the herd fed and holding a meal; during the herd hunger waits until starving.
  const hunger = hungerLevel(s, u.id);
  const hungry = s.herd.spawned === 0 ? hunger !== 'ok' : hunger === 'starving';
  if (h.meal && (u.hp + base.hunger.mealHeal <= u.maxHp + 10 || u.hp <= 45 || hungry)) eat(s, u.id);
  if (u.order?.type === 'attack') return;
  if (busy(u) && u.order?.type !== 'move') return;
  const jobs = m.jobs[u.id]!;
  while (jobs.length > 0) {
    const job = jobs[0]!;
    if (job.startsWith('fix:')) {
      const id = job.slice(4);
      if (s.openings.find((o) => o.id === id)?.fixed || orderFix(s, u.id, id) !== 'ok') jobs.shift();
      else return;
    } else if (job.startsWith('spike:')) {
      jobs.shift(); // one try: no scrap left, or the tile is taken
      const [x, y] = PITS[Number(job.slice(6))]!;
      if (orderTrap(s, u.id, 'spike', x, y) === 'ok') return;
    } else jobs.shift();
  }
  // Hand a spare meal to a hurt friend who has none.
  const other = s.survivors.find((v) => v !== u && v.hp > 0);
  if (h.meal && other && !s.hunger[other.id]!.meal && other.hp <= 55 && u.hp > other.hp && near(s, u, 2).length === 0) {
    if (dist(u.x, u.y, other.x, other.y) <= 1.5) give(s, u.id);
    else if (u.order?.type !== 'move') orderMove(s, [u.id], [Math.round(other.x), Math.round(other.y)]);
    return;
  }
  // Cook when calm: before the herd, or between herd zombies.
  const calm = s.herd.spawned === 0 ? near(s, u, 9).length === 0 : live(s).every((e) => dist(e.x, e.y, door.x, door.y) > 8) && (other?.hp ?? 0) >= 50;
  if (!h.meal && s.food > 0 && calm) {
    orderCook(s, u.id);
    return;
  }
  // Re-arm the pit when nothing is near it.
  const pit = s.traps.find((t) => t.kind === 'spike' && !t.armed);
  if (pit && u.kind === 'fighter' && s.scrap > 0 && live(s).every((e) => dist(e.x, e.y, pit.x, pit.y) > 7)) {
    orderRearm(s, u.id, pit.id);
    return;
  }
  setFreeFire(s, u.id, s.herd.spawned > 0); // keep the ammo for the herd
  holdAt(s, u, POSTS[u.id]!, [door.x, door.y]);
};

function inFront(u: Survivor, e: Enemy): boolean {
  const dx = e.x - u.x;
  const dy = e.y - u.y;
  const d = Math.hypot(dx, dy);
  return d < 1e-9 || (dx * u.facing[0] + dy * u.facing[1]) / d >= Math.cos(Math.PI / 4);
}

// ---- passive ----

const MIDDLE: Pt = [12, 14];

const passive: Bot = (s, m, u) => {
  const h = s.hunger[u.id]!;
  if (h.meal && hungerLevel(s, u.id) !== 'ok') eat(s, u.id);
  if (busy(u) && u.order?.type !== 'move') return;
  const jobs = m.jobs[u.id]!;
  while (jobs.length > 0) {
    const id = jobs[0]!.slice(4);
    if (id === 'door' && !s.survivors.every((v) => v.hp <= 0 || v === u || inside(v))) break; // wait for the other to come in
    if (s.openings.find((o) => o.id === id)?.fixed || orderFix(s, u.id, id) !== 'ok') jobs.shift();
    else return;
  }
  if (!h.meal && s.food > 0 && hungerLevel(s, u.id) !== 'ok') {
    orderCook(s, u.id);
    return;
  }
  const post: Pt = u.id === 'fighter' ? MIDDLE : [MIDDLE[0] + 1, MIDDLE[1]];
  holdAt(s, u, post, [door.x, door.y]);
};

const BOTS: Record<string, { bot: Bot; jobs: Record<string, string[]> }> = {
  careful: { bot: careful, jobs: { fighter: ['fix:window1', 'spike:0', 'spike:1'], scout: ['fix:window2', 'spike:2'] } },
  passive: { bot: passive, jobs: { fighter: ['fix:window1', 'fix:door'], scout: ['fix:window2'] } },
};

// ---- runs ----

interface Result {
  seed: number;
  win: boolean;
  seconds: number;
  herdLeft: number;
  why: string;
  hp: number[];
  bites: { roamer: number; herd: number; double: number }; // bites on survivors; `double`: ticks two or more landed
}

/** One line of the state, for `--trace`: survivors (hp, order, place, meal) and the live zombies near the house. */
function traceLine(s: BaseState): string {
  const us = s.survivors.map((u) => `${u.id[0]}${u.hp}${s.hunger[u.id]!.meal ? '+' : ''} ${u.order?.type ?? '-'}@${u.x.toFixed(1)},${u.y.toFixed(1)}`);
  const zs = live(s).map((e) => `${e.id}:${e.hp}${e.ai.mode[0]}@${Math.round(e.x)},${Math.round(e.y)}`);
  const os = s.openings.map((o) => `${o.id}:${o.fixed ? o.hp : 'gap'}`);
  return `${(s.tick / TICK_HZ).toFixed(0)}s food ${s.food} scrap ${s.scrap} ammo ${s.ammo} | ${us.join(' | ')} | ${os.join(' ')} | ${zs.join(' ')}`;
}

function play(name: string, seed: number, trace?: number): Result {
  const { bot, jobs } = BOTS[name]!;
  const s = createBase({ cassGun: true });
  s.rng = makeRng(seed * 7919 + 1);
  const m: Mem = { rng: makeRng(seed), next: {}, jobs: structuredClone(jobs) };
  const bites = { roamer: 0, herd: 0, double: 0 };
  while (s.status === 'playing' && s.tick < LIMIT) {
    if (trace !== undefined && s.tick >= trace * TICK_HZ && s.tick % TICK_HZ === 0) console.log(traceLine(s));
    for (const u of s.survivors) {
      if (u.hp <= 0 || s.tick < (m.next[u.id] ?? 0)) continue;
      bot(s, m, u);
      m.next[u.id] = s.tick + rngInt(m.rng, 2, 8); // a decision every 0.2–0.8 s
    }
    stepBase(s);
    let n = 0;
    for (const e of s.enemies) {
      if (e.act?.kind !== 'bite' || e.act.tick !== s.tick || !s.survivors.some((u) => dist(u.x, u.y, e.x, e.y) <= 1.5)) continue;
      n++;
      if (e.id.startsWith('h')) bites.herd++;
      else bites.roamer++;
    }
    if (n > 1) bites.double++;
  }
  const dead = s.survivors.find((u) => u.hp <= 0);
  const why = s.status === 'success' ? 'won' : dead ? `${dead.id} killed by ${dead.killedBy ?? '?'}` : 'timeout';
  return { seed, win: s.status === 'success', seconds: Math.round(s.tick / TICK_HZ), herdLeft: herdLeft(s), why, hp: s.survivors.map((u) => u.hp), bites };
}

function main(): void {
  const args = process.argv.slice(2);
  const opt = (k: string): string | undefined => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const seeds = Number(opt('--seeds') ?? 100);
  const names = opt('--bot') ? [opt('--bot')!] : Object.keys(BOTS);
  const verbose = args.includes('--verbose');
  if (opt('--trace')) {
    // --trace <seed> [--from <seconds>]: one line per second of one run
    const r = play(names[0]!, Number(opt('--trace')), Number(opt('--from') ?? 0));
    console.log(`${names[0]} seed ${r.seed}: ${r.why} at ${r.seconds}s, herd left ${r.herdLeft}`);
    return;
  }
  for (const name of names) {
    const t0 = performance.now();
    const rs: Result[] = [];
    for (let seed = 1; seed <= seeds; seed++) {
      const r = play(name, seed);
      rs.push(r);
      if (verbose) console.log(`  ${name} seed ${seed}: ${r.why} at ${r.seconds}s, herd left ${r.herdLeft}, hp ${r.hp.join('/')}, bites roamer ${r.bites.roamer} herd ${r.bites.herd} (double ${r.bites.double})`);
    }
    const wins = rs.filter((r) => r.win).length;
    const whys = new Map<string, number>();
    for (const r of rs) whys.set(r.why, (whys.get(r.why) ?? 0) + 1);
    const pct = Math.round((100 * wins) / seeds);
    const target = name === 'careful' ? '70–80%' : 'under 20%';
    const ok = name === 'careful' ? pct >= 70 && pct <= 80 : pct < 20;
    console.log(`${name}: ${wins}/${seeds} won (${pct}%, target ${target}: ${ok ? 'ok' : 'OFF'}) in ${(performance.now() - t0).toFixed(0)} ms`);
    console.log(`  ${[...whys].map(([k, v]) => `${k} ×${v}`).join(', ')}`);
  }
}

main();
