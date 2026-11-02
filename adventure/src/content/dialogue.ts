import type { DialogueTree } from '../engine/dialogue';

export const DIALOGUES: Record<string, DialogueTree> = {
  keeper: {
    start: 'start',
    nodes: {
      start: { branch: [{ if: [{ notFlag: 'metKeeper' }], next: 'first' }, { next: 'again' }] },
      first: {
        lines: [
          { actor: 'keeper', text: 'dlg.keeper.first1' },
          { actor: 'keeper', text: 'dlg.keeper.first2' },
        ],
        set: { metKeeper: true },
        next: 'hub',
      },
      again: { lines: [{ actor: 'keeper', text: 'dlg.keeper.again' }], next: 'hub' },
      hub: {
        choices: [
          { text: 'dlg.choice.who', next: 'who', if: [{ notFlag: 'askedWho' }] },
          { text: 'dlg.choice.whoAgain', next: 'whoAgain', if: [{ flag: 'askedWho' }] },
          { text: 'dlg.choice.place', next: 'place' },
          { text: 'dlg.choice.key', next: 'key', if: [{ flag: 'keyTaken', notFlag: 'toldKey' }] },
          { text: 'dlg.choice.bye', next: 'bye' },
        ],
      },
      who: {
        lines: [
          { actor: 'keeper', text: 'dlg.keeper.who1' },
          { actor: 'keeper', text: 'dlg.keeper.who2' },
        ],
        set: { askedWho: true },
        next: 'hub',
      },
      whoAgain: { lines: [{ actor: 'keeper', text: 'dlg.keeper.whoAgain' }], next: 'hub' },
      place: {
        lines: [
          { actor: 'keeper', text: 'dlg.keeper.place1' },
          { actor: 'keeper', text: 'dlg.keeper.place2' },
        ],
        next: 'hub',
      },
      key: {
        lines: [
          { actor: 'keeper', text: 'dlg.keeper.key1' },
          { actor: 'hero', text: 'dlg.hero.key2' },
          { actor: 'keeper', text: 'dlg.keeper.key3' },
        ],
        set: { toldKey: true },
        next: 'hub',
      },
      bye: { lines: [{ actor: 'keeper', text: 'dlg.keeper.bye' }], next: null },
    },
  },
};
