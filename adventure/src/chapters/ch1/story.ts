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
  // A new adventure starts with Mara in everyday clothes; he gears up (armour, the gauntlet lit) when
  // he takes the cell from its cradle. Until casual Mara is drawn the game shows the unlit-gauntlet sheet.
  heroSheet: [{ if: [{ flag: 'hasGauntlet' }], pick: 'mara-gauntlet' }, { pick: 'mara-casual' }],
  guided: [{ if: [{ notFlag: 'fought' }] }],
  // After the fight, the nervous score alone until the chapter ends.
  afterFight: { music: 'nervous', hush: true },
};
