// The text of the Wotakuye tooltip (DESIGN-upgrades.md `## Wotakuye help`): live numbers and the rules,
// all read from the data files so the text cannot contradict the game. Pure TypeScript, no Phaser.
import data from '../data/resources.json';
import seasonData from '../data/seasons.json';
import { BANDS, coldPerPerson, EV, mealNeed, PEMMICAN_VALUE, unityBand } from './economy';
import { DAY_TICKS, type GameState } from './state';
import { giftForBand } from './upgrades';

export interface WotakuyeHelp {
  /** The band the camp is in now. */
  band: string;
  /** What is true of this camp right now (about, since meals and the day start interact). */
  live: string[];
  /** The standing rules; the current band's line starts with `>`. */
  rules: string[];
}

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
const EFFECT: Record<string, string> = { newcomer: 'newcomers join', leave: 'an adult leaves each day' };

function liveLines(s: GameState): string[] {
  const band = unityBand(s);
  const out: string[] = [];

  const unhoused = s.people.filter((p) => p.home === null).length;
  out.push(
    unhoused === 0
      ? 'Everyone has a bed.'
      : `${unhoused} ${unhoused === 1 ? 'person has' : 'people have'} no bed: ${signed(Math.round(unhoused * coldPerPerson(s) * 10) / 10)} at the next day start.`,
  );

  const need = mealNeed(s);
  const have = s.store.food + s.store.pemmican * PEMMICAN_VALUE;
  if (need > 0) {
    if (have >= need - 1e-9) {
      out.push(`Next meal: ${signed(EV.mealFull)} (the store covers it).`);
    } else {
      const share = have / need;
      const delta = EV.mealShortBase + EV.mealShortScale * (1 - share);
      out.push(`Next meal: ${Math.ceil(need - have)} food short, about ${signed(Math.round(delta))}.`);
    }
  }

  out.push(`Gift tomorrow: ${signed(giftForBand(band.name))} (${band.name}).`);

  const i = BANDS.findIndex((b) => b.name === band.name);
  const up = BANDS[i + 1];
  if (up) out.push(`${Math.ceil(up.from - s.wotakuye)} more to ${up.name} (at ${up.from}).`);
  if (i > 0) out.push(`${band.name} holds down to ${band.from}.`);
  return out;
}

function ruleLines(s: GameState): string[] {
  const unhoused = seasonData.unhousedPerDay;
  const meals = DAY_TICKS / data.economy.mealEvery;
  const lines = [
    `Full meal: ${signed(EV.mealFull)} (${meals} a day)`,
    `Short meal: ${signed(EV.mealShortBase)}, down to ${signed(EV.mealShortBase + EV.mealShortScale)} with no food`,
    `A death: ${signed(EV.death)}`,
    `No bed, each person each day: ${signed(unhoused.spring)} (winter ${signed(unhoused.winter)})`,
    `Wave beaten: ${signed(EV.waveCleanNoDeaths)}, or ${signed(EV.waveCleanWithDeaths)} if someone died`,
  ];
  const current = unityBand(s).name;
  for (let i = BANDS.length - 1; i >= 0; i--) {
    const b = BANDS[i];
    const to = BANDS[i + 1] ? BANDS[i + 1].from - 1 : data.wotakuye.max;
    const effect = b.dayEffect ? `, ${EFFECT[b.dayEffect] ?? b.dayEffect}` : '';
    const gift = giftForBand(b.name);
    lines.push(`${b.name === current ? '> ' : '  '}${b.name} ${b.from}-${to}: work x${b.work}${effect}${gift ? `, gift ${signed(gift)} a day` : ''}`);
  }
  return lines;
}

/** The tooltip text for the Wotakuye bar. */
export function wotakuyeHelp(s: GameState): WotakuyeHelp {
  return { band: unityBand(s).name, live: liveLines(s), rules: ruleLines(s) };
}
