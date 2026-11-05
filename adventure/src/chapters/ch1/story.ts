import type { StoryRules } from '../../engine/story';
import { afterRelease, wrenCalls } from './interactions';

const fought = [{ flag: 'fought' }];

/** Chapter 1's story rules (src/engine/story.ts). */
export const STORY: StoryRules = {
  // Nervous from the fight to the end of the chapter, else the cold kiln, else the room's own.
  music: [{ if: fought, pick: 'nervous' }, { cold: true, pick: 'cold' }],
  ambience: [{ room: 'ashways', pick: 'wind' }, { cold: true, pick: 'cold' }],
  defaultAmbience: 'kiln',
  // After the fight the nervous score is the only sound.
  hush: [{ if: fought }],
  crowdMood: [
    { cold: true, pick: 'cold' }, { if: [{ flag: 'alarm' }], pick: 'alarm' },
    // Wren waits at the hoist for Mara's hand (the morning's first errand).
    { room: 'maraRoom', if: [{ flag: 'wrenAsked' }, { notFlag: 'hoistHelped' }], pick: 'errand' },
  ],
  // The kiln groans and the alarm goes up: the firing house's kids run to Nell. Wren calls for a hand
  // at the hoist and goes back to her rounds once it is done.
  crowdReactsTo: ['alarm', 'wrenAsked', 'hoistHelped'],
  // A reload between the release and Oren's send-off picks the sequence up again (the fight
  // restarts from its beginning).
  onEnter: [
    { room: 'gallery', if: [{ flag: 'kilnCold' }], run: s => afterRelease(s.flags) },
    // The first time Mara steps into the hall, Wren calls from the hoist.
    { room: 'maraRoom', if: [{ notFlag: 'wrenAsked' }, { notFlag: 'hasGauntlet' }], run: () => wrenCalls() },
  ],
  flagSounds: { latchFixed: 'latch', valveVented: 'hiss' },
  // A new adventure starts with Mara in everyday clothes. He dresses for work at the crate in his tent
  // (armour, the gauntlet still dark), and the gauntlet lights when he takes the cell from its cradle.
  heroSheet: [{ if: [{ flag: 'hasGauntlet' }], pick: 'mara-gauntlet' }, { if: [{ flag: 'dressed' }], pick: 'mara' }, { pick: 'mara-casual' }],
  guided: [{ if: [{ notFlag: 'fought' }] }],
  // After the fight, the nervous score alone until the chapter ends.
  afterFight: { music: 'nervous', hush: true },
};
