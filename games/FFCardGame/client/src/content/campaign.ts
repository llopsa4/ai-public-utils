import { PROTOTYPE_ENCOUNTER, PROTOTYPE_PROFILE } from './encounter';
import { STARTING_EQUIPMENT } from './equipment';
import type { CharacterProfile } from '../game/types';

// A small playable systems checkpoint, replaced by authored routes in D13.
// This is not the opening chapter or its guided tutorial.
export const CHECKPOINT_NODE = 'kiln-checkpoint';
export const CHECKPOINT_CLAIM = 'kiln-checkpoint:clear';
export const CAMPAIGN_ENCOUNTER = PROTOTYPE_ENCOUNTER;
export const CAMPAIGN_PROFILE: CharacterProfile = {
  ...PROTOTYPE_PROFILE, id: 'mara', equipment: STARTING_EQUIPMENT,
};
