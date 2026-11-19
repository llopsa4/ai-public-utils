import type { DialogueNode, DialogueTree } from '../../engine/dialogue';

/**
 * Suspicion rises one step (the eye narrows): a wrong note in a borrowed voice. At the third step
 * the conversation ends there and the chapter's afterDialogue plays the caught scene.
 */
const raise = (id: string, p: 'g' | 'w', then: string): Record<string, DialogueNode> => ({
  [id]: {
    branch: [
      { if: [{ flag: `${p}Sus2` }], next: `${id}3` },
      { if: [{ flag: `${p}Sus1` }], next: `${id}2` },
      { next: `${id}1` },
    ],
  },
  [`${id}1`]: { set: { [`${p}Sus1`]: true }, next: then },
  [`${id}2`]: { set: { [`${p}Sus2`]: true }, next: then },
  [`${id}3`]: { set: { [`${p}Sus3`]: true }, next: null },
});

export const DIALOGUES: Record<string, DialogueTree> = {
  // Benn, the night guard, woken by "Sergeant Harrow" behind the bars. Half asleep and frightened,
  // he wants to know how his sergeant got into a locked cell, and where the prisoner went. Each
  // marked reply uses what Silas read in him: afraid of being caught asleep, afraid of the captain,
  // cold to the bone. Plain orders, or a wrong answer, make him look harder.
  guard: {
    start: 'wake',
    nodes: {
      wake: {
        // Up off his chair, past the door and along the front of the cage, to stand outside it face to
        // face with his sergeant (and within reach of a hand through the bars).
        run: [{ type: 'step', actor: 'guard', to: { x: 270, y: 342 }, face: 'left', inFront: true }],
        lines: [
          { actor: 'guard', text: 'dlgI.guard.wake1' },
          { actor: 'guard', text: 'dlgI.guard.wake2' },
        ],
        next: 'hub1',
      },
      hub1: {
        choices: [
          { text: 'dlgI.choice.lockedIn', next: 'scolded', read: true, if: [{ flag: 'readGuard' }] },
          { text: 'dlgI.choice.keys', next: 'keysAsk' },
          { text: 'dlgI.choice.friend', next: 'friend' },
        ],
      },
      keysAsk: { lines: [{ actor: 'guard', text: 'dlgI.guard.keysAsk' }], next: 'gUp' },
      friend: { lines: [{ actor: 'guard', text: 'dlgI.guard.friend' }], next: 'gUp' },
      gAgain: { lines: [{ actor: 'guard', text: 'dlgI.guard.again' }], next: 'hub1' },
      ...raise('gUp', 'g', 'gAgain'),
      scolded: {
        lines: [
          { actor: 'guard', text: 'dlgI.guard.scolded1' },
          { actor: 'guard', text: 'dlgI.guard.scolded2' },
        ],
        next: 'hub2',
      },
      // Where is the prisoner? The answer that works makes it Benn's fault, and the captain's business.
      hub2: {
        choices: [
          { text: 'dlgI.choice.moved', next: 'moved', read: true, if: [{ flag: 'readGuard' }] },
          { text: 'dlgI.choice.whatPrisoner', next: 'whatPrisoner' },
          { text: 'dlgI.choice.underCot', next: 'underCot' },
        ],
      },
      whatPrisoner: { lines: [{ actor: 'guard', text: 'dlgI.guard.whatPrisoner' }], next: 'gMore' },
      underCot: { lines: [{ actor: 'guard', text: 'dlgI.guard.underCot' }], next: 'gMore' },
      ...raise('gMore', 'g', 'gAgain2'),
      gAgain2: { lines: [{ actor: 'guard', text: 'dlgI.guard.again2' }], next: 'hub2' },
      moved: {
        lines: [
          { actor: 'guard', text: 'dlgI.guard.moved1' },
          { actor: 'guard', text: 'dlgI.guard.moved2' },
        ],
        next: 'hub3',
      },
      // Now he only wants to be told what to do: the kind order (the cold) sends him away.
      hub3: {
        choices: [
          { text: 'dlgI.choice.warm', next: 'warm', read: true, if: [{ flag: 'readGuard' }] },
          { text: 'dlgI.choice.report', next: 'report' },
          { text: 'dlgI.choice.stay', next: 'stay' },
        ],
      },
      report: { lines: [{ actor: 'guard', text: 'dlgI.guard.report' }], next: 'gLast' },
      stay: { lines: [{ actor: 'guard', text: 'dlgI.guard.stay' }], next: 'gLast' },
      ...raise('gLast', 'g', 'gAgain3'),
      gAgain3: { lines: [{ actor: 'guard', text: 'dlgI.guard.again3' }], next: 'hub3' },
      // He comes to the bars to thank his sergeant; the key ring swings at his belt.
      warm: {
        lines: [
          { actor: 'guard', text: 'dlgI.guard.warm1' },
          { actor: 'guard', text: 'dlgI.guard.warm2' },
        ],
        set: { bennSaluting: true },
        next: 'salute',
      },
      // Benn salutes, eyes on the ceiling: the keys are a hand's width from the bars, for a moment.
      salute: {
        lines: [{ actor: 'hero', text: 'dlgI.hero.keysChance' }],
        next: 'palm',
      },
      palm: {
        choices: [
          { text: 'dlgI.choice.palm', next: 'palmed' },
          { text: 'dlgI.choice.dismiss', next: 'dismissed' },
        ],
        // The salute does not last: wait too long and he leaves with his keys (the nail still opens the door).
        timed: { ms: 5000, next: 'tooSlow' },
      },
      palmed: {
        run: [{ type: 'perform', actor: 'hero', tag: 'reach' }, { type: 'wait', ms: 1100 }, { type: 'perform', actor: 'hero', tag: null }],
        lines: [{ actor: 'guard', text: 'dlgI.guard.palmed' }],
        set: { bennSaluting: false, gotKeys: true, guardGone: true, harrowCracked: true, wearingHarrow: false },
        items: ['keys'],
        next: null,
      },
      tooSlow: {
        lines: [{ actor: 'guard', text: 'dlgI.guard.tooSlow' }],
        set: { bennSaluting: false, guardGone: true, harrowCracked: true, wearingHarrow: false },
        next: null,
      },
      dismissed: {
        lines: [{ actor: 'guard', text: 'dlgI.guard.dismissed' }],
        set: { bennSaluting: false, guardGone: true, harrowCracked: true, wearingHarrow: false },
        next: null,
      },
    },
  },

  // Kell, the guardroom's guard: wide awake, and he knows the real Harrow. As the tally clerk,
  // Silas leans on what he read (Kell's dice debt to the quartermaster, his hunger, his boredom).
  warden: {
    start: 'start',
    nodes: {
      start: {
        lines: [{ actor: 'warden', text: 'dlgI.warden.start' }, { actor: 'warden', text: 'dlgI.warden.start2' }],
        next: 'hub1',
      },
      hub1: {
        choices: [
          { text: 'dlgI.choice.tally', next: 'tally', read: true, if: [{ flag: 'readWarden' }] },
          { text: 'dlgI.choice.passing', next: 'passing' },
          { text: 'dlgI.choice.orders', next: 'orders' },
        ],
      },
      passing: { lines: [{ actor: 'warden', text: 'dlgI.warden.passing' }], next: 'wUp' },
      // Harrow's name wakes Benn's dream, and Benn talks in his sleep.
      orders: { lines: [{ actor: 'guard', text: 'dlgI.guard.sleepTalk' }, { actor: 'warden', text: 'dlgI.warden.orders' }], next: 'wUp' },
      wAgain: { lines: [{ actor: 'warden', text: 'dlgI.warden.again' }], next: 'hub1' },
      ...raise('wUp', 'w', 'wAgain'),
      tally: {
        lines: [
          { actor: 'warden', text: 'dlgI.warden.tally1' },
          { actor: 'warden', text: 'dlgI.warden.tally2' },
        ],
        next: 'hub2',
      },
      hub2: {
        choices: [
          { text: 'dlgI.choice.kitchen', next: 'kitchen', read: true, if: [{ flag: 'readWarden' }] },
          { text: 'dlgI.choice.grate', next: 'grate' },
        ],
      },
      grate: { lines: [{ actor: 'warden', text: 'dlgI.warden.grate' }], next: 'wMore' },
      ...raise('wMore', 'w', 'wAgain2'),
      wAgain2: { lines: [{ actor: 'warden', text: 'dlgI.warden.again' }], next: 'hub2' },
      kitchen: {
        lines: [
          { actor: 'warden', text: 'dlgI.warden.kitchen1' },
          { actor: 'warden', text: 'dlgI.warden.kitchen2' },
        ],
        set: { wardenBusy: true },
        next: null,
      },
    },
  },

  // Captain Sigrid at the outer door: she was waiting. She sees through the clerk, admires the
  // frame, and has a use for a man who can be anyone.
  sigrid: {
    start: 'start',
    nodes: {
      start: {
        lines: [
          { actor: 'sigrid', text: 'dlgI.sigrid.1' },
          { actor: 'sigrid', text: 'dlgI.sigrid.2' },
        ],
        next: 'hub',
      },
      hub: {
        choices: [
          { text: 'dlgI.choice.clerk', next: 'clerk' },
          { text: 'dlgI.choice.leaving', next: 'leaving' },
        ],
      },
      clerk: { lines: [{ actor: 'sigrid', text: 'dlgI.sigrid.clerk' }], next: 'frame' },
      leaving: { lines: [{ actor: 'sigrid', text: 'dlgI.sigrid.leaving' }], next: 'frame' },
      frame: {
        lines: [
          { actor: 'sigrid', text: 'dlgI.sigrid.frame1' },
          { actor: 'hero', text: 'dlgI.sigrid.frame2' },
          { actor: 'sigrid', text: 'dlgI.sigrid.frame3' },
          { actor: 'sigrid', text: 'dlgI.sigrid.frame4' },
        ],
        set: { metSigrid: true },
        next: null,
      },
    },
  },
};
