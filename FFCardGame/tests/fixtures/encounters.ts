// Synthetic development fixture, never imported by the production entry point.
// Reuses guardian artwork; it is not authored campaign content or a new enemy.
import type { BattleSetup } from '../../client/src/game/types';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../../client/src/content/encounter';

export const SIGNATURE_SETUP: BattleSetup = {
  seed: 1,
  profile: { ...PROTOTYPE_PROFILE, mp: 3 },
  encounter: { ...PROTOTYPE_ENCOUNTER, id: 'signature-practice-fixture', title: 'TECHNIQUE TEST' },
};

export const COOLING_RIG_SETUP: BattleSetup = {
  seed: 101,
  profile: {
    id: 'mara-fixture', name: 'Mara', maxHp: 48, hp: 42, maxMp: 6, mp: 3,
    deck: [
      { type: 'strike', id: 'rig-strike' }, { type: 'guard', id: 'rig-guard' },
      { type: 'piston', id: 'rig-piston' }, { type: 'vent', id: 'rig-vent' },
      { type: 'cycle', id: 'rig-cycle' }, { type: 'pulse', id: 'rig-pulse' },
      { type: 'shield', id: 'rig-shield' },
    ],
  },
  encounter: {
    id: 'cooling-rig-fixture', title: 'COOLING BAY',
    enemy: { name: 'Cooling Rig', label: 'Rig', maxHp: 27, intents: [
      { name: 'Pressure test', damage: 3, block: 4 },
      { name: 'Release', damage: 2, block: 0 },
    ] },
    energyPerTurn: 2, handSize: 3,
    introduction: 'A synthetic cooling rig tests the configurable battle setup.',
    victoryText: 'The cooling rig settles. The configuration test is complete.',
  },
};
