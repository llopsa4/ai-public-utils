import type { EncounterDefinition } from '../../combat/types';
import type { Reward } from '../../content/kit';

/**
 * Chapter 2's one fight: sparring against Bryn's training rig (Kiln Courier's Training Rig).
 * Mara overdrives; afterwards Bryn asks what he is trying to get through so quickly.
 */
export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  trainingRig: {
    id: 'training-rig', title: "BRYN'S PRACTICE RIG",
    enemy: { name: 'Training Rig', label: 'Rig', maxHp: 24, intents: [{ name: 'Practice sweep', damage: 4, block: 0 }] },
    energyPerTurn: 3, handSize: 5,
    introduction: "Bryn's rig swings back at whatever strikes it. Show her what the gauntlet does.",
    victoryText: 'The rig judders to a stop. Bryn lets out a low whistle.',
  },
};

/** Sparring pays nothing but the lesson. */
export const REWARDS: Record<string, Reward> = {};

/** No gear handed over in this chapter. */
export const SPARES: string[] = [];
