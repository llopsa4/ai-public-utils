import type { StoryRules } from '../../engine/story';
import type { Command, GameState } from '../../engine/types';

import { say } from '../script';
const unset = (...flags: string[]): Command[] => flags.map(flag => ({ type: 'setFlag', flag, value: false }));
const count = (s: GameState, p: 'g' | 'w') => [1, 2, 3].filter(n => s.flags[`${p}Sus${n}`]).length;

/**
 * Caught: the deception falls apart. Silas has only played it through in his head (that is how it
 * would go), so the confrontation starts again from its checkpoint, the suspicion forgotten.
 */
const caught = (who: 'guard' | 'warden', p: 'g' | 'w', reset: string[]): Command[] => [
  say(`line.i.caught.${who}`, who),
  { type: 'shake', ms: 400 },
  { type: 'fade', to: 'black', ms: 700 },
  say(`line.i.caught.think.${who}`),
  // Only imagined: Benn is back asleep on his chair (he had come over to the bars).
  ...(who === 'guard' ? [{ type: 'step', actor: 'guard', to: { x: 570, y: 326 }, instant: true } as Command] : []),
  // Kell turns back to his watch.
  ...(who === 'warden' ? [{ type: 'face', actor: 'warden', face: 'right' } as Command] : []),
  ...unset(`${p}Sus1`, `${p}Sus2`, `${p}Sus3`, ...reset),
  { type: 'fade', to: 'clear', ms: 700 },
  { type: 'checkpoint' },
];

/**
 * Who Silas looks like now (his sprite and his portrait, the first that holds): the Harrow mask, the
 * clerk (in his cloak once he has it), his cloak, else his own clothes.
 */
const LOOKS = [
  { if: [{ flag: 'wearingHarrow' }], pick: 'silas-harrow' },
  { if: [{ flag: 'wearingClerk' }, { flag: 'tookCloak' }], pick: 'silas-cloak-clerk' },
  { if: [{ flag: 'wearingClerk' }], pick: 'silas-clerk' },
  { if: [{ flag: 'tookCloak' }], pick: 'silas-cloak' },
];

/**
 * The intro's story rules: Silas's masks change his name, face and sprite; the eye shows how close
 * the guard he is fooling is to seeing through him; Sigrid waits at the outer door.
 */
export const STORY: StoryRules = {
  music: [],
  ambience: [{ room: 'outerDoor', pick: 'wind' }],
  defaultAmbience: 'kiln',
  hush: [{ room: 'cell' }],
  crowdMood: [],
  crowdReactsTo: [],
  onEnter: [{
    // The calm start: the dark, the candle, the snoring.
    room: 'cell', if: [{ notFlag: 'cellLit' }],
    run: s => s.looks['intro:wake'] ? [] : [
      { type: 'looked', id: 'intro:wake' },
      { type: 'wait', ms: 700 },
      say('line.i.wake1'), say('line.i.wake2'),
    ],
  }, {
    room: 'guardroom', if: [{ notFlag: 'sawWarden' }],
    run: () => [{ type: 'setFlag', flag: 'sawWarden', value: true }, { type: 'wait', ms: 400 }, say('line.i.warden1'), say('line.i.warden2')],
  }, {
    room: 'outerDoor', if: [{ notFlag: 'metSigrid' }],
    run: () => [{ type: 'wait', ms: 600 }, { type: 'walk', to: { x: 280, y: 304 }, face: 'right' }, { type: 'dialogue', id: 'sigrid' }],
  }],
  flagSounds: { cellOpen: 'latch', grateOpen: 'latch' },
  // In his own cloak from the cell's corridor on (Codex's silas-cloak pack); the clerk is then his hood
  // pulled low and the ledger.
  heroSheet: [...LOOKS, { pick: 'silas' }],
  heroName: [
    { if: [{ flag: 'wearingHarrow' }], pick: 'speaker.harrow' },
    { if: [{ flag: 'wearingClerk' }], pick: 'speaker.clerk' },
  ],
  heroPortrait: LOOKS,
  afterDialogue: (id, s) => {
    if (id === 'guard' && s.flags.gSus3) return caught('guard', 'g', ['guardAwake']);
    if (id === 'warden' && s.flags.wSus3) return caught('warden', 'w', []);
    if (id === 'guard' && s.flags.guardGone) return [say(s.flags.gotKeys ? 'line.i.afterGuardKeys' : 'line.i.afterGuard')];
    if (id === 'warden' && s.flags.wardenBusy) return [say('line.i.afterWarden')];
    // Not fooled, not caught yet: back to watching the grate.
    if (id === 'warden') return [{ type: 'face', actor: 'warden', face: 'right' }];
    // "Walk with me": Silas walks off towards the snow, Sigrid turns to go with him, and the camera
    // pulls back into the Ashlands reveal.
    if (id === 'sigrid' && s.flags.metSigrid) return [
      { type: 'walk', to: { x: 610, y: 304 }, face: 'right' },
      { type: 'step', actor: 'sigrid', to: { x: 560, y: 304 }, face: 'right' },
      { type: 'chooseChapter', reveal: 'ashlands' },
    ];
    return [];
  },
  // The eye shows while someone is being deceived face to face.
  suspicion: s => {
    if (s.room === 'cell' && s.flags.guardAwake && !s.flags.guardGone) return count(s, 'g');
    if (s.room === 'guardroom' && s.flags.wearingClerk && !s.flags.wardenBusy) return count(s, 'w');
    return null;
  },
  guided: [],
};
