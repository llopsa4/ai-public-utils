import type { StoryRules } from '../../engine/story';
import type { Command } from '../../engine/types';

/** Chapter 2's story rules (src/engine/story.ts): each room's own score, wind on the road and in the tunnels. */
export const STORY: StoryRules = {
  music: [],
  ambience: [{ room: 'road', pick: 'wind' }, { room: 'tunnelCollapse', pick: 'wind' }, { room: 'tunnelSteam', pick: 'wind' }, { room: 'tunnelCistern', pick: 'wind' }],
  defaultAmbience: 'kiln',
  hush: [],
  crowdMood: [],
  crowdReactsTo: [],
  // The first time into the steam junction, Mara has had enough of the road.
  onEnter: [{
    room: 'tunnelSteam', if: [{ notFlag: 'grumbled' }],
    run: () => [
      { type: 'setFlag', flag: 'grumbled', value: true },
      { type: 'wait', ms: 400 },
      ...['line2.grumble1', 'line2.grumble2', 'line2.grumble3', 'line2.grumble4'].map((text): Command => ({ type: 'say', actor: 'hero', text })),
    ],
  }],
  flagSounds: { retuned: 'latch', steamOff: 'hiss', grateOpen: 'latch', bridgeDown: 'latch' },
  // The gauntlet has been lit since chapter 1.
  heroSheet: [{ pick: 'mara-gauntlet' }],
  // Sparring is a free fight, not Kiln Courier's lesson.
  guided: [],
  // After a fight the room's own score comes back (tense in the tunnels, warm at Bryn's).
  afterFight: { hush: false },
};
