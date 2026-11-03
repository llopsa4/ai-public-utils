import type { StoryRules } from '../../engine/story';

/** Chapter 2's story rules (src/engine/story.ts): each room's own score, wind on the road and in the tunnels. */
export const STORY: StoryRules = {
  music: [],
  ambience: [{ room: 'road', pick: 'wind' }, { room: 'tunnelCollapse', pick: 'wind' }, { room: 'tunnelSteam', pick: 'wind' }, { room: 'tunnelCistern', pick: 'wind' }],
  defaultAmbience: 'kiln',
  hush: [],
  crowdMood: [],
  crowdReactsTo: [],
  onEnter: [],
  flagSounds: { retuned: 'latch', steamOff: 'hiss', grateOpen: 'latch', bridgeDown: 'latch' },
  // The gauntlet has been lit since chapter 1.
  heroSheet: [{ pick: 'mara-gauntlet' }],
  // Sparring is a free fight, not Kiln Courier's lesson.
  guided: [],
  // After a fight the room's own score comes back (tense in the tunnels, warm at Bryn's).
  afterFight: { hush: false },
};
