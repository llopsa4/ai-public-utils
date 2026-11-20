// Seasons (DESIGN-seasons.md): derived from the tick, so nothing is stored and saves are unaffected.
// Pure TypeScript, no Phaser.
import data from '../data/seasons.json';
import { addMessage, DAY_TICKS, type GameState } from './state';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASONS = data.order as Season[];
const TICKS = data.ticksPerSeason;
const YEAR_TICKS = TICKS * SEASONS.length;

/** The season a tick falls in (a new camp starts in spring). */
export function seasonAt(tick: number): Season {
  return SEASONS[Math.floor(tick / TICKS) % SEASONS.length];
}

export const seasonOf = (s: { tick: number }): Season => seasonAt(s.tick);

export const seasonLabel = (season: Season): string => data.labels[season];

/** 1-based year; the HUD shows it from year 2. */
export const yearOf = (s: { tick: number }): number => Math.floor(s.tick / YEAR_TICKS) + 1;

/** 1-based day inside the current season (1..3). */
export const dayInSeason = (s: { tick: number }): number => Math.floor((s.tick % TICKS) / DAY_TICKS) + 1;

/** The per-season number from one of the tables in seasons.json. */
export function seasonal(s: { tick: number }, table: 'gatherRate' | 'huntSuccess' | 'mealNeed' | 'unhousedPerDay' | 'spoilPerDay'): number {
  return data[table][seasonAt(s.tick)];
}

/** True on the first tick of a season after the first (a new camp is already in spring). */
export function seasonStarts(tick: number): boolean {
  return tick > 0 && tick % TICKS === 0;
}

/** At a day start: a toast when a new season has just begun. */
export function announceSeason(s: GameState): void {
  if (seasonStarts(s.tick)) addMessage(s, data.toasts[seasonAt(s.tick)]);
}
