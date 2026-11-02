import type { StoryRules } from '../../engine/story';
import { afterRelease } from './interactions';

const fought = [{ flag: 'fought' }];

/** Chapter 1's story rules (src/engine/story.ts). */
export const STORY: StoryRules = {
  // Nervous from the fight to the end of the chapter, else the cold kiln, else the room's own.
  music: [{ if: fought, pick: 'nervous' }, { cold: true, pick: 'cold' }],
  ambience: [{ room: 'ashways', pick: 'wind' }, { cold: true, pick: 'cold' }],
  defaultAmbience: 'kiln',
  // After the fight the nervous score is the only sound.
  hush: [{ if: fought }],
  crowdMood: [{ cold: true, pick: 'cold' }, { if: [{ flag: 'alarm' }], pick: 'alarm' }],
  // The kiln groans and the alarm goes up: the firing house's kids run to Nell.
  crowdReactsTo: ['alarm'],
  // A reload between the release and Oren's send-off picks the sequence up again (the fight
  // restarts from its beginning).
  onEnter: [{ room: 'gallery', if: [{ flag: 'kilnCold' }], run: s => afterRelease(s.flags) }],
  flagSounds: { latchFixed: 'latch', valveVented: 'hiss' },
  // Mara with the gauntlet lit once the cell is fitted.
  heroSheet: [{ if: [{ flag: 'hasGauntlet' }], pick: 'mara-gauntlet' }],
  guided: [{ if: [{ notFlag: 'fought' }] }],
};
