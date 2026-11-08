import type { Command, GameState } from '../../engine/types';

export const CONCERNS = ['repair', 'mother', 'leaving', 'whyMe'] as const;
export const CONCERN_FLAGS = CONCERNS.map(c => `concern-${c}`);
export const REGULATOR_FLAGS = ['boltLeft', 'boltRight', 'pressureBled', 'ringReleased'] as const;
export type RegulatorAction = 'left' | 'right' | 'vent' | 'ring';

export function regulatorStage(f: Record<string, boolean>): 'bolts' | 'vent' | 'ring' | 'done' {
  return !f.boltLeft || !f.boltRight ? 'bolts' : !f.pressureBled ? 'vent' : !f.ringReleased ? 'ring' : 'done';
}

/** The panel and tests share only the mechanical rules, not DOM or timing. */
export function operateRegulator(f: Record<string, boolean>, action: RegulatorAction): string {
  const stage = regulatorStage(f);
  if (stage === 'done') return 'puzzle.done';
  if (action === 'left' || action === 'right') {
    const key = action === 'left' ? 'boltLeft' : 'boltRight';
    if (f[key]) return 'puzzle.boltAlready';
    f[key] = true;
    return regulatorStage(f) === 'vent' ? 'puzzle.boltsDone' : 'puzzle.boltDone';
  }
  if (stage === 'bolts') return 'puzzle.needBolts';
  if (action === 'vent') {
    if (f.pressureBled) return 'puzzle.ventAlready';
    f.pressureBled = true;
    return 'puzzle.ventDone';
  }
  if (stage === 'vent') return 'puzzle.needVent';
  f.ringReleased = true;
  return 'puzzle.done';
}

/** Evaluate the flags after the task just completed, whichever room it happened in. */
export function morningAlarm(state: GameState, completed: string): Command[] {
  const f = { ...state.flags, [completed]: true };
  if (f.alarm || f.kilnCold || !f.hoistHelped || !f.nellFed || !f.latchFixed) return [];
  return [{ type: 'shake', ms: 700 }, { type: 'say', actor: 'hero', text: 'line.kilnGroans' },
    ...(state.room === 'firingHouse' ? [{ type: 'say' as const, actor: 'oren' as const, text: 'line.orenCalls', at: { x: 538, y: 100 } }] : []),
    { type: 'setFlag', flag: 'alarm', value: true }, { type: 'say', actor: 'hero', text: 'line.maraAlarm' }];
}

export function concernKey(f: Record<string, boolean>, prefix: string): string {
  return `${prefix}.${CONCERNS.find(c => f[`concern-${c}`]) ?? 'neutral'}`;
}

const flag = (name: string): Command => ({ type: 'setFlag', flag: name, value: true });
const checkpoint: Command = { type: 'checkpoint' };

/** Each committed beat is resumable; an interrupted fight never repeats the explosion. */
export function ashwaysFinale(f: Record<string, boolean>): Command[] {
  const out: Command[] = [];
  if (!f.ashwaysExploded) out.push({type:'say',actor:'hero',text:'line.cellEcho'},flag('ashwaysStarted'), checkpoint,
    { type: 'ashwaysBeat', phase: 'depart' },
    { type: 'say', actor: 'extra-merchant', text: 'line.corvinSalvage' },
    { type: 'ashwaysBeat', phase: 'rupture' }, flag('ashwaysExploded'), checkpoint);
  if (!f.ashwaysWon) {
    out.push({ type: 'ashwaysBeat', phase: 'return' });
    if(!f.ashwaysConfronted)out.push({ type: 'say', actor: 'hero', text: 'line.maraCorvin' },
      { type: 'say', actor: 'extra-merchant', text: 'line.corvinHelp' },flag('ashwaysConfronted'),checkpoint);
    out.push({ type: 'fight', id: 'ashwaysBoss' }, flag('ashwaysWon'), checkpoint);
  }
  if (!f.ashwaysAftermath) out.push({ type: 'ashwaysBeat', phase: 'settle' },
    { type: 'say', actor: 'hero', text: 'line.maraCorvinCheck' },
    { type: 'say', actor: 'extra-merchant', text: 'line.corvinAdmits' },
    { type: 'say', actor: 'hero', text: 'line.maraNetwork' },
    { type: 'say', actor: 'extra-merchant', text: 'line.corvinSurvives' }, flag('ashwaysAftermath'), checkpoint);
  out.push({ type: 'say', actor: 'hero', text: 'line.farewellUrgent' }, { type: 'end' });
  return out;
}
