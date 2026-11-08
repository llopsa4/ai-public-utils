import type { DialogueTree } from '../../engine/dialogue';
import { CONCERN_FLAGS } from './progression';

const CONCERNS = ['toldRepair', 'toldMother', 'toldLeaving', 'toldWhyMe'];

export const DIALOGUES: Record<string, DialogueTree> = {
  // Oren, the kiln tender. Once the patch fails, the argument lets Mara voice what the shutdown costs him.
  // Every reply is heard; none is a wrong answer, and he decides himself once he has said enough.
  oren: {
    start: 'start',
    nodes: {
      start: {
        branch: [
          { if: [{ flag: 'kilnCold' }], next: 'cold' },
          { if: [{ flag: 'decided' }], next: 'decided' },
          { if: [{ flag: 'patchFailed' }], next: 'argue' },
          { next: 'before' },
        ],
      },
      before: {
        lines: [
          { actor: 'oren', text: 'dlg.oren.before1' },
          { actor: 'oren', text: 'dlg.oren.before2' },
        ],
        set: { metOren: true },
        next: null,
      },
      argue: {
        branch: [{ if: [{ atLeast: { count: 1, flags: CONCERNS } }], next: 'hub' }],
        lines: [{ actor: 'oren', text: 'dlg.oren.argue1' }],
        next: 'hub',
      },
      hub: {
        choices: [
          { text: 'dlg.choice.repair', next: 'repair', if: [{ notFlag: 'toldRepair' }] },
          { text: 'dlg.choice.mother', next: 'mother', if: [{ notFlag: 'toldMother' }] },
          { text: 'dlg.choice.leaving', next: 'leaving', if: [{ notFlag: 'toldLeaving' }] },
          { text: 'dlg.choice.whyMe', next: 'whyMe', if: [{ notFlag: 'toldWhyMe' }] },
          { text: 'dlg.choice.decide', next: 'decide', if: [{ atLeast: { count: 2, flags: CONCERNS } }] },
          { text: 'dlg.choice.minute', next: 'minute' },
        ],
      },
      repair: {
        remember:{flag:'concern-repair',unless:CONCERN_FLAGS},
        lines: [{ actor: 'oren', text: 'dlg.oren.repair1' }, { actor: 'oren', text: 'dlg.oren.repair2' }],
        set: { toldRepair: true },
        next: 'hub',
      },
      mother: {
        remember:{flag:'concern-mother',unless:CONCERN_FLAGS},
        lines: [{ actor: 'oren', text: 'dlg.oren.mother1' }, { actor: 'oren', text: 'dlg.oren.mother2' }],
        set: { toldMother: true },
        next: 'hub',
      },
      leaving: {
        remember:{flag:'concern-leaving',unless:CONCERN_FLAGS},
        lines: [{ actor: 'oren', text: 'dlg.oren.leaving1' }, { actor: 'oren', text: 'dlg.oren.leaving2' }],
        set: { toldLeaving: true },
        next: 'hub',
      },
      whyMe: {
        remember:{flag:'concern-whyMe',unless:CONCERN_FLAGS},
        lines: [{ actor: 'oren', text: 'dlg.oren.whyMe1' }, { actor: 'oren', text: 'dlg.oren.whyMe2' }],
        set: { toldWhyMe: true },
        next: 'hub',
      },
      decide: {
        lines: [
          { actor: 'hero', text: 'dlg.hero.decide1' },
          { actor: 'hero', text: 'dlg.hero.decide2' },
          { actor: 'oren', text: 'dlg.oren.decide3' },
          { actor: 'hero', text: 'dlg.hero.decide4' },
          { actor: 'oren', text: 'dlg.oren.decide5' },
        ],
        set: { decided: true },
        next: null,
      },
      minute: { lines: [{ actor: 'oren', text: 'dlg.oren.minute' }], next: null },
      decided: {
        branch: [{ if: [{ flag: 'procedureKnown' }], next: 'ready' }],
        lines: [{ actor: 'oren', text: 'dlg.oren.notebookFirst' }],
        next: null,
      },
      ready: { lines: [{ actor: 'oren', text: 'dlg.oren.ready' }], next: null },
      cold: {
        lines: [{ actor: 'oren', text: 'dlg.oren.cold1' }, { actor: 'oren', text: 'dlg.oren.cold2' }],
        choices: [
          { text: 'dlg.choice.stillWarm', next: 'stillWarm', if: [{ has: 'regulator' }] },
          { text: 'dlg.choice.back', next: 'back' },
        ],
      },
      stillWarm: { lines: [{ actor: 'oren', text: 'dlg.oren.stillWarm1' }, { actor: 'oren', text: 'dlg.oren.stillWarm2' }], next: null },
      back: { lines: [{ actor: 'oren', text: 'dlg.oren.back' }], next: null },
    },
  },

  // Before the shutdown, Oren prepares Mara for the heat and flying ceramic.
  orenProtection: {
    start: 'advice',
    nodes: {
      advice: {
        lines: [
          { actor: 'oren', text: 'dlg.oren.protection1' },
          { actor: 'oren', text: 'dlg.oren.protection2' },
          { actor: 'hero', text: 'dlg.hero.protection' },
        ],
        set: { metOren: true },
        gear: { give: ['layered-armor'], equip: 'layered-armor' },
        next: null,
      },
    },
  },

  // Nell, the neighbour with the sticking latch and the soup pot. Tobi gives Mara his scarf beside her.
  nell: {
    start: 'start',
    nodes: {
      start: {
        branch: [
          { if: [{ flag: 'kilnCold' }], next: 'cold' },
          { if: [{ flag: 'latchFixed' }], next: 'afterLatch' },
          { if: [{ flag: 'nellFed' }], next: 'again' },
          { if: [{ flag: 'breadAsked' }], next: 'breadAgain' },
          { next: 'first' },
        ],
      },
      // The morning's errand: a loaf from the basket under the stairs for her soup.
      first: {
        lines: [{ actor: 'nell', text: 'dlg.nell.first1' }, { actor: 'nell', text: 'dlg.nell.first2' }],
        set: { metNell: true, breadAsked: true },
        next: null,
      },
      breadAgain: { lines: [{ actor: 'nell', text: 'dlg.nell.breadAgain' }], next: null },
      again: { lines: [{ actor: 'nell', text: 'dlg.nell.again' }], next: null },
      afterLatch: {
        choices: [
          { text: 'dlg.choice.soup', next: 'soup' },
          { text: 'dlg.choice.noise', next: 'noise', if: [{ flag: 'alarm' }] },
          { text: 'dlg.choice.later', next: 'later' },
        ],
      },
      soup: { lines: [{ actor: 'nell', text: 'dlg.nell.soup' }], next: 'afterLatch' },
      noise: { lines: [{ actor: 'nell', text: 'dlg.nell.noise' }], next: 'afterLatch' },
      later: { lines: [{ actor: 'nell', text: 'dlg.nell.later' }], next: null },
      cold: {
        branch: [{ if: [{ flag: 'gotBread' }], next: 'coldAgain' }],
        lines: [
          { actor: 'nell', text: 'dlg.nell.cold1' },
          { actor: 'nell', text: 'dlg.nell.cold2' },
          { actor: 'nell', text: 'dlg.nell.cold3' },
          { actor: 'nell', text: 'dlg.nell.cold4' },
          { actor: 'tobi', text: 'dlg.tobi.scarf' },
          { actor: 'hero', text: 'dlg.hero.tobiScarf' },
        ],
        set: { gotBread: true, gotScarf: true },
        items: ['bread', 'scarf'],
        next: null,
      },
      coldAgain: { lines: [{ actor: 'nell', text: 'dlg.nell.coldAgain' }], next: null },
    },
  },
  tobi: {
    start: 'start',
    nodes: {
      start: {
        branch: [
          { if: [{ flag: 'gotScarf' }], next: 'afterScarf' },
          { if: [{ flag: 'kilnCold' }], next: 'cold' },
          { next: 'warm' },
        ],
      },
      warm: {
        lines: [
          { actor: 'tobi', text: 'dlg.tobi.chalk' },
          { actor: 'hero', text: 'dlg.hero.tobiChalk' },
          { actor: 'tobi', text: 'dlg.tobi.chalkReply' },
        ],
        next: null,
      },
      cold: {
        lines: [
          { actor: 'tobi', text: 'dlg.tobi.cold' },
          { actor: 'hero', text: 'dlg.hero.tobiCold' },
        ],
        next: null,
      },
      afterScarf: {
        lines: [
          { actor: 'tobi', text: 'dlg.tobi.story' },
          { actor: 'hero', text: 'dlg.hero.tobiStory' },
        ],
        next: null,
      },
    },
  },
};

// Both children and Nell lead into the same one-time family farewell and gift effects.
DIALOGUES.farewell={start:'cold',nodes:{cold:DIALOGUES.nell.nodes.cold,coldAgain:DIALOGUES.nell.nodes.coldAgain}};
