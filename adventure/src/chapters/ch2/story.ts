import type { StoryRules } from '../../engine/story';

/** Chapter 2's story rules (src/engine/story.ts): each room's own score, wind on the road. */
export const STORY: StoryRules = {
  music: [],
  ambience: [{ room: 'road', pick: 'wind' }],
  defaultAmbience: 'kiln',
  hush: [],
  crowdMood: [],
  crowdReactsTo: [],
  onEnter: [],
  flagSounds: { retuned: 'latch' },
  // The gauntlet has been lit since chapter 1.
  heroSheet: [{ pick: 'mara-gauntlet' }],
  // Sparring is a free fight, not Kiln Courier's lesson.
  guided: [],
  afterFight: { music: 'warm', hush: false },
};
