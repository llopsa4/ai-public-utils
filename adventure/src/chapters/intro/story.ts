import type { StoryRules } from '../../engine/story';
import type { Command, GameState } from '../../engine/types';

const say = (text: string, actor: 'hero' | 'guard' | 'warden' = 'hero'): Command => ({ type: 'say', actor, text });
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
  ...unset(`${p}Sus1`, `${p}Sus2`, `${p}Sus3`, ...reset),
  { type: 'fade', to: 'clear', ms: 700 },
  { type: 'checkpoint' },
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
    run: s => s.looks['intro.wake'] ? [] : [
      { type: 'looked', id: 'intro.wake' },
      { type: 'wait', ms: 700 },
      say('line.i.wake1'), say('line.i.wake2'),
    ],
  }, {
    room: 'guardroom', if: [{ notFlag: 'sawWarden' }],
    run: () => [{ type: 'setFlag', flag: 'sawWarden', value: true }, { type: 'wait', ms: 400 }, say('line.i.warden1'), say('line.i.warden2')],
  }, {
    room: 'outerDoor', if: [{ notFlag: 'metSigrid' }],
    run: () => [{ type: 'wait', ms: 600 }, { type: 'walk', to: { x: 300, y: 304 }, face: 'right' }, { type: 'dialogue', id: 'sigrid' }],
  }],
  flagSounds: { cellOpen: 'latch', grateOpen: 'latch' },
  heroSheet: [
    { if: [{ flag: 'wearingHarrow' }], pick: 'silas-harrow' },
    { if: [{ flag: 'wearingClerk' }], pick: 'silas-clerk' },
    { pick: 'silas' },
  ],
  heroName: [
    { if: [{ flag: 'wearingHarrow' }], pick: 'speaker.harrow' },
    { if: [{ flag: 'wearingClerk' }], pick: 'speaker.clerk' },
  ],
  heroPortrait: [
    { if: [{ flag: 'wearingHarrow' }], pick: 'silas-harrow' },
    { if: [{ flag: 'wearingClerk' }], pick: 'silas-clerk' },
  ],
  afterDialogue: (id, s) => {
    if (id === 'guard' && s.flags.gSus3) return caught('guard', 'g', ['guardAwake']);
    if (id === 'warden' && s.flags.wSus3) return caught('warden', 'w', []);
    if (id === 'guard' && s.flags.guardGone) return [say(s.flags.gotKeys ? 'line.i.afterGuardKeys' : 'line.i.afterGuard')];
    if (id === 'warden' && s.flags.wardenBusy) return [say('line.i.afterWarden')];
    if (id === 'sigrid' && s.flags.metSigrid) return [{ type: 'chooseChapter' }];
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
