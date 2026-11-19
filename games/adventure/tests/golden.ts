// The states and questions the interaction golden file covers (see scripts/golden-interactions.ts).
import { interact } from '../src/chapters/ch1/interactions';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { VERBS, type GameState } from '../src/engine/types';
import { newGame } from '../src/engine/state';

/** The story in stages: the flags and items Mara has at each point (cumulative). */
const STAGES: { flags: string[]; items: string[] }[] = [
  { flags: [], items: [] },
  // The morning in everyday clothes: Wren's hoist, Nell's bread, dressed for work.
  { flags: ['wrenAsked', 'hoistHelped', 'metNell', 'breadAsked', 'nellFed', 'dressed'], items: [] },
  { flags: ['hasGauntlet'], items: ['gauntlet'] },
  { flags: ['hasNotebook'], items: ['notebook'] },
  { flags: ['metNell', 'latchFixed', 'alarm'], items: [] },
  { flags: ['metOren', 'patchFailed'], items: [] },
  { flags: ['toldRepair', 'toldMother', 'decided'], items: [] },
  { flags: ['procedureKnown'], items: [] },
  // The guided visit can be resumed before it is closed; shutdown remains blocked until prepared.
  { flags: ['gearUnlocked'], items: [] },
  { flags: ['protectionPrepared'], items: [] },
  { flags: ['kilnCold', 'fought', 'gearChecked'], items: ['regulator'] },
  { flags: ['gotBread', 'gotScarf'], items: ['bread', 'scarf'] },
  { flags: ['sawSweeper', 'valveVented', 'secretTally', 'secretChalk', 'secretSign', 'secretRail'], items: [] },
];

export function goldenStates(): { name: string; state: GameState }[] {
  const out: { name: string; state: GameState }[] = [];
  const flags: string[] = [], items: string[] = [];
  STAGES.forEach((stage, i) => {
    flags.push(...stage.flags);
    items.push(...stage.items);
    for (const pose of ['stand', 'crouch'] as const) {
      const s = newGame();
      for (const f of flags) s.flags[f] = true;
      s.inventory = [...items];
      s.hero.pose = pose;
      out.push({ name: `${i}${pose === 'crouch' ? 'c' : ''}`, state: s });
    }
  });
  return out;
}

/** Every answer: "<stage>|<room>|<target>|<verb>|<item>|<looks>" → the commands, as JSON. */
export function goldenAnswers(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const { name, state } of goldenStates()) {
    for (const room of Object.values(ROOMS)) {
      const targets = ['hero', ...room.hotspots.map(h => h.id), ...room.actors.map(a => a.id), ...state.inventory.map(i => `item:${i}`)];
      for (const target of targets) {
        for (const looks of target === 'hero' || target.startsWith('item:') ? [0] : [0, 1, 2]) {
          const s: GameState = structuredClone(state);
          s.room = room.id;
          if (looks) s.looks[target] = looks;
          for (const verb of VERBS) {
            if (looks && verb !== 'look') continue;
            answers[`${name}|${room.id}|${target}|${verb}||${looks}`] = JSON.stringify(interact(structuredClone(s), verb, target));
          }
          if (looks) continue;
          for (const item of state.inventory) answers[`${name}|${room.id}|${target}|use|${item}|0`] = JSON.stringify(interact(structuredClone(s), 'use', target, item));
        }
      }
    }
  }
  return answers;
}
