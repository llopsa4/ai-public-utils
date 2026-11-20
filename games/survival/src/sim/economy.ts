// Economy and Wotakuye (DESIGN-slice.md `## Economy`, `## Wotakuye`): hunger, the evenly shared meal,
// starvation, deaths, the unity meter and its day-start effects. Pure TypeScript, no Phaser.
import jobsData from '../data/jobs.json';
import mapConfig from '../data/map.json';
import data from '../data/resources.json';
import { ages, assignHousing, makePerson, pickName, removePerson, spawnSpots } from './people';
import { rngNext } from './rng';
import { announceSeason, seasonal, seasonOf } from './seasons';
import seasonData from '../data/seasons.json';
import { addMessage, TIPI_BEDS, type GameState } from './state';
import { giftForBand } from './upgrades';

export interface Band {
  name: string;
  from: number;
  work: number;
  dayEffect: string | null;
  newcomerMinFood?: number;
}

export const BANDS = data.wotakuye.bands as Band[];
export const EV = data.wotakuye.events;
export const HUNGRY_AT = data.economy.hungryAt;
export const HUNGRY_WORK = data.economy.hungryWork;
/** Food units one pemmican feeds. */
export const PEMMICAN_VALUE = data.resources.pemmican.foodValue;
const FAMILIES = mapConfig.start.families;
/** The United band holds the newcomer food rule; spring reuses it at Steady. */
const UNITED = BANDS.find((b) => b.dayEffect === 'newcomer')!;

/** Adds to the unity meter, keeping it within 0..100. */
export function changeUnity(s: GameState, delta: number): void {
  s.wotakuye = Math.min(data.wotakuye.max, Math.max(data.wotakuye.min, s.wotakuye + delta));
}

/** The band the meter is in now (Quarrelling, Strained, Steady, United). */
export function unityBand(s: GameState): Band {
  let band = BANDS[0];
  for (const b of BANDS) if (s.wotakuye >= b.from) band = b;
  return band;
}

/** The work-rate multiplier of the current band. */
export function unityWork(s: GameState): number {
  return unityBand(s).work;
}

/** Food one meal needs for everyone alive (18 for the start camp; x1.25 in winter). */
export function mealNeed(s: GameState): number {
  return s.people.reduce((sum, p) => sum + ages[p.age].meal, 0) * seasonal(s, 'mealNeed');
}

/** The one slice rule, feed evenly: everyone eats a full meal, or the same share of one. */
function meal(s: GameState): void {
  const need = mealNeed(s);
  if (need <= 0) return;
  // Raw food goes first (it spoils); pemmican, worth more per unit, covers what is left.
  const foodEaten = Math.min(s.store.food, need);
  const pemEaten = Math.min(s.store.pemmican, (need - foodEaten) / PEMMICAN_VALUE);
  const eaten = foodEaten + pemEaten * PEMMICAN_VALUE;
  const full = eaten >= need - 1e-9;
  const share = full ? 1 : eaten / need;
  s.store.food -= foodEaten;
  s.store.pemmican -= pemEaten;
  for (const p of s.people) p.hunger = Math.max(0, p.hunger - data.economy.mealRelief * share);
  if (full) {
    changeUnity(s, EV.mealFull);
  } else {
    changeUnity(s, EV.mealShortBase + EV.mealShortScale * (1 - share));
    addMessage(s, share === 0 ? 'The store is empty: nobody ate.' : 'Not enough food: everyone ate a little.');
  }
}

/** Hunger rises, hunger 100 hurts, a fed person heals, and anyone at 0 health dies. */
function hungerAndHealth(s: GameState): void {
  const h = jobsData.health;
  for (const p of s.people) {
    p.hunger = Math.min(100, p.hunger + data.economy.hungerPerTick);
    if (p.hunger >= 100) p.health -= h.starveDamage;
    else if (p.hunger < h.regenBelowHunger) p.health = Math.min(h.max, p.health + h.regen);
  }
  for (const p of s.people.filter((q) => q.health <= 0)) {
    removePerson(s, p.id);
    changeUnity(s, EV.death);
    addMessage(s, `${p.name} has died.`);
  }
}

function familyCounts(s: GameState): number[] {
  const counts = FAMILIES.map(() => 0);
  for (const p of s.people) counts[p.family]++;
  return counts;
}

/** Quarrelling: one adult of the larger family leaves the camp (no death, no unity penalty). */
function leave(s: GameState): void {
  const counts = familyCounts(s);
  const family = counts.indexOf(Math.max(...counts));
  const adults = s.people.filter((p) => p.family === family && p.age === 'adult');
  if (adults.length === 0) return;
  const p = adults[Math.floor(rngNext(s.rng) * adults.length)];
  removePerson(s, p.id);
  addMessage(s, `${p.name} has left the camp.`);
}

/** United: an adult joins the smaller family when a bed is free and the store has food. */
function newcomer(s: GameState, band: Band): void {
  const beds = s.buildings.filter((b) => b.type === 'tipi' && b.done).reduce((n, b) => n + TIPI_BEDS - b.residents.length, 0);
  if (beds <= 0 || s.store.food < (band.newcomerMinFood ?? 0)) return;
  const counts = familyCounts(s);
  const family = counts.indexOf(Math.min(...counts));
  const taken = new Set(s.people.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`));
  const spots = spawnSpots(s).filter(([x, y]) => !taken.has(`${x},${y}`));
  if (spots.length === 0) return;
  const [x, y] = spots[Math.floor(rngNext(s.rng) * spots.length)];
  const p = makePerson(s, family, 'adult', pickName(s), x, y);
  s.people.push(p);
  assignHousing(s);
  addMessage(s, `${p.name} joins the camp.`);
}

/** Raw food rots a little each day (never pemmican); a toast when summer takes a lot. */
function spoil(s: GameState): void {
  const lost = Math.floor(s.store.food * seasonal(s, 'spoilPerDay'));
  if (lost <= 0) return;
  s.store.food -= lost;
  if (seasonOf(s) === 'summer' && lost >= seasonData.spoilToastMin) addMessage(s, 'Some food spoiled in the heat.');
}

/** Unity lost per unhoused person at day start; each staffed healer eases the cold by 1, down to -1. */
export function coldPerPerson(s: GameState): number {
  const cold = seasonal(s, 'unhousedPerDay');
  if (cold >= -1) return cold;
  const healers = s.people.filter((p) => p.job?.kind === 'heal').length;
  return Math.min(-1, cold + healers * jobsData.jobs.heal.coldEase);
}

/** At the start of a day: the season, spoilage, beds, the unhoused cost unity, then the band's effect. */
function dayStart(s: GameState): void {
  announceSeason(s);
  spoil(s);
  assignHousing(s);
  changeUnity(s, coldPerPerson(s) * s.people.filter((p) => p.home === null).length);
  const band = unityBand(s);
  // Spring newcomers also come at Steady, not only at United.
  const springWelcome = seasonOf(s) === 'spring' && s.wotakuye >= seasonData.newcomerMinWotakuye.spring;
  if (band.dayEffect === 'leave') leave(s);
  else if (band.dayEffect === 'newcomer') newcomer(s, band);
  else if (springWelcome) newcomer(s, UNITED);
  // Gift value comes last, from the band the camp ends the morning in.
  s.gift += giftForBand(unityBand(s).name);
}

/** One economy tick; call after `s.tick` has advanced, so `tick % 600 === 0` is a meal time. */
export function stepEconomy(s: GameState): void {
  hungerAndHealth(s);
  if (s.tick % data.economy.mealEvery === 0) meal(s);
  if (s.tick % 1200 === 0) dayStart(s);
}
