import type { Mood } from '../../game/assets';

/**
 * The face a speaker's portrait shows for a line (default: neutral). Characters whose portrait has
 * no such mood fall back to neutral.
 */
export const LINE_MOODS: Record<string, Mood> = {
  // Mara
  'line.kilnGroans': 'worried',
  'line.maraAlarm': 'worried',
  'line.maraPulse': 'worried',
  'line.heroLookCold': 'worried',
  'line.regulatorBareHands': 'worried',
  'line.needProcedure': 'worried',
  'line.wayBackGo': 'worried',
  'dlg.choice.repair': 'worried',
  'dlg.choice.leaving': 'worried',
  'dlg.choice.whyMe': 'angry',
  'dlg.choice.minute': 'worried',
  'dlg.choice.stillWarm': 'worried',
  'dlg.hero.decide1': 'angry',
  'line.sweeperFight': 'angry',
  // Oren
  'line.orenCalls': 'angry',
  'line.orenLockingRing': 'worried',
  'dlg.oren.before1': 'worried',
  'dlg.oren.argue1': 'worried',
  'dlg.oren.repair2': 'worried',
  'dlg.oren.leaving1': 'worried',
  'dlg.oren.whyMe1': 'worried',
  'dlg.oren.stillWarm2': 'worried',
  'line.orenStand': 'angry',
  'dlg.oren.minute': 'worried',
};
