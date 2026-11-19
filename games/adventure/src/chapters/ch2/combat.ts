import type { EncounterDefinition } from '../../combat/types';
import type { Reward } from '../../content/kit';

/** A tunnel creature: a free fight with a two-move cycle. */
const creature = (id: string, title: string, name: string, label: string, maxHp: number, intents: { name: string; damage: number; block: number }[], introduction: string, victoryText: string): EncounterDefinition => ({
  id, title, enemy: { name, label, maxHp, intents }, energyPerTurn: 3, handSize: 5, introduction, victoryText,
});

/**
 * The tunnels under the ashways: each puzzle wakes one of these, drawn at random on every attempt
 * (a lost fight starts again against a new draw).
 */
const TUNNEL_CREATURES: Record<string, EncounterDefinition> = {
  'cinder-rat': creature('cinder-rat', 'TUNNEL: CINDER RAT', 'Cinder Rat', 'Rat', 16,
    [{ name: 'Bite', damage: 3, block: 0 }, { name: 'Gnaw', damage: 5, block: 0 }],
    'A rat the size of a dog, fur singed to wire. It has had the tunnel to itself for a long time.', 'The rat squeals and bolts into the dark.'),
  'rat-pack': creature('rat-pack', 'TUNNEL: RAT PACK', 'Rat Pack', 'Pack', 26,
    [{ name: 'Swarm', damage: 4, block: 0 }, { name: 'Scatter', damage: 0, block: 5 }],
    'Not one rat. Several, and they move together.', 'The pack breaks and scatters into the pipes.'),
  'ash-mites': creature('ash-mites', 'TUNNEL: ASH MITES', 'Ash Mite Swarm', 'Mites', 20,
    [{ name: 'Sting', damage: 4, block: 0 }, { name: 'Burrow', damage: 0, block: 6 }],
    'The ash on the floor stands up and clicks.', 'The mites sink back into the ash and go still.'),
  'pipe-beetle': creature('pipe-beetle', 'TUNNEL: PIPE BEETLE', 'Pipe Beetle', 'Beetle', 28,
    [{ name: 'Shell up', damage: 0, block: 8 }, { name: 'Ram', damage: 7, block: 0 }],
    'A beetle with a shell like a copper pot lid, warm from living on the pipes.', 'The beetle tips onto its back, legs waving, then rights itself and scuttles off.'),
};

/** The tunnels draw from all four creatures. */
export const POOLS: Record<string, readonly string[]> = { tunnel: Object.keys(TUNNEL_CREATURES) };

/**
 * Chapter 2's sparring against Bryn's training rig (Kiln Courier's Training Rig).
 * Mara overdrives; afterwards Bryn asks what he is trying to get through so quickly.
 */
export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  ...TUNNEL_CREATURES,
  trainingRig: {
    id: 'training-rig', title: "BRYN'S PRACTICE RIG",
    enemy: { name: 'Training Rig', label: 'Rig', maxHp: 24, intents: [{ name: 'Practice sweep', damage: 4, block: 0 }] },
    energyPerTurn: 3, handSize: 5,
    introduction: "Bryn's rig swings back at whatever strikes it. Show her what the gauntlet does.",
    victoryText: 'The rig judders to a stop. Bryn lets out a low whistle.',
  },
};

/** Each tunnel creature leaves a little salvage behind; sparring pays nothing but the lesson. */
export const REWARDS: Record<string, Reward> = Object.fromEntries(Object.keys(TUNNEL_CREATURES).map(id => [id, { salvage: 4, materials: {} }]));

/** No gear handed over in this chapter. */
export const SPARES: string[] = [];
