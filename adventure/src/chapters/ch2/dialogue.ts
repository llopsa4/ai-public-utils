import type { DialogueTree } from '../../engine/dialogue';

const TOLD = ['toldRush', 'toldHome', 'toldAlone'];

export const DIALOGUES: Record<string, DialogueTree> = {
  // Bryn, the gauntlet smith. In the workshop she offers practice, then asks what Mara is rushing
  // towards; every answer is heard and none is wrong. Mara names what he needs himself. In the back
  // room, over supper: supplies (he learns to ask), the letter home, the valley on the map.
  bryn: {
    start: 'start',
    nodes: {
      start: {
        branch: [
          { if: [{ flag: 'recordsRead' }], next: 'evening' },
          { if: [{ flag: 'namedNeed' }], next: 'toRecords' },
          { if: [{ flag: 'sparred' }], next: 'ask' },
          { if: [{ flag: 'retuned' }], next: 'toRig' },
          { if: [{ flag: 'offeredPractice' }], next: 'waiting' },
          { next: 'intro' },
        ],
      },
      intro: {
        lines: [
          { actor: 'bryn', text: 'dlg2.bryn.intro1' },
          { actor: 'hero', text: 'dlg2.bryn.intro2' },
          { actor: 'bryn', text: 'dlg2.bryn.intro3' },
          { actor: 'bryn', text: 'dlg2.bryn.intro4' },
        ],
        set: { offeredPractice: true },
        next: null,
      },
      waiting: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.waiting' }], next: null },
      toRig: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.toRig' }], next: null },
      ask: {
        branch: [{ if: [{ atLeast: { count: 1, flags: TOLD } }], next: 'askHub' }],
        lines: [{ actor: 'bryn', text: 'dlg2.bryn.ask1' }, { actor: 'bryn', text: 'dlg2.bryn.ask2' }],
        next: 'askHub',
      },
      askHub: {
        choices: [
          { text: 'dlg2.choice.rush', next: 'rush', if: [{ notFlag: 'toldRush' }] },
          { text: 'dlg2.choice.home', next: 'home', if: [{ notFlag: 'toldHome' }] },
          { text: 'dlg2.choice.alone', next: 'alone', if: [{ notFlag: 'toldAlone' }] },
          { text: 'dlg2.choice.name', next: 'name', if: [{ atLeast: { count: 2, flags: TOLD } }] },
          { text: 'dlg2.choice.later', next: 'later' },
        ],
      },
      rush: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.rush1' }, { actor: 'bryn', text: 'dlg2.bryn.rush2' }], set: { toldRush: true }, next: 'askHub' },
      home: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.home1' }, { actor: 'bryn', text: 'dlg2.bryn.home2' }], set: { toldHome: true }, next: 'askHub' },
      alone: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.alone1' }, { actor: 'bryn', text: 'dlg2.bryn.alone2' }], set: { toldAlone: true }, next: 'askHub' },
      name: {
        lines: [
          { actor: 'bryn', text: 'dlg2.bryn.name1' },
          { actor: 'bryn', text: 'dlg2.bryn.name2' },
          { actor: 'hero', text: 'dlg2.bryn.name3' },
          { actor: 'bryn', text: 'dlg2.bryn.name4' },
        ],
        set: { namedNeed: true },
        next: null,
      },
      later: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.later' }], next: null },
      toRecords: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.toRecords' }], next: null },
      evening: {
        branch: [{ if: [{ flag: 'askedForHelp' }, { flag: 'letterSent' }, { flag: 'sawValley' }], next: 'night' }],
        lines: [{ actor: 'bryn', text: 'dlg2.bryn.evening' }],
        next: 'eveningHub',
      },
      eveningHub: {
        choices: [
          { text: 'dlg2.choice.supplies', next: 'supplies', if: [{ notFlag: 'askedForHelp' }] },
          { text: 'dlg2.choice.letter', next: 'letter', if: [{ notFlag: 'letterSent' }] },
          { text: 'dlg2.choice.valley', next: 'valley', if: [{ flag: 'sawValley' }] },
          { text: 'dlg2.choice.goodnight', next: 'goodnight' },
        ],
      },
      supplies: {
        lines: [{ actor: 'bryn', text: 'dlg2.bryn.supplies1' }, { actor: 'bryn', text: 'dlg2.bryn.supplies2' }],
        next: 'suppliesHub',
      },
      suppliesHub: {
        choices: [
          { text: 'dlg2.choice.manage', next: 'manage' },
          { text: 'dlg2.choice.askHelp', next: 'askHelp' },
        ],
      },
      manage: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.manage' }], next: 'eveningHub' },
      askHelp: {
        lines: [{ actor: 'bryn', text: 'dlg2.bryn.askHelp1' }, { actor: 'bryn', text: 'dlg2.bryn.askHelp2' }],
        set: { askedForHelp: true },
        next: 'eveningHub',
      },
      letter: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.letter1' }, { actor: 'bryn', text: 'dlg2.bryn.letter2' }], next: 'eveningHub' },
      valley: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.valley1' }, { actor: 'bryn', text: 'dlg2.bryn.valley2' }], next: 'eveningHub' },
      goodnight: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.goodnight' }], next: null },
      night: { lines: [{ actor: 'bryn', text: 'dlg2.bryn.night' }], next: null },
    },
  },
};
