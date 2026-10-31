import { PROTOTYPE_ENCOUNTER } from './encounter';
export const BRIDGE_ENCOUNTER = { ...PROTOTYPE_ENCOUNTER, id: 'cable-warden', title: 'HANGING CROSSING',
  enemy: { name: 'Cable Warden', label: 'Warden', maxHp: 68, intents: [{ name: 'Rail clamp', damage: 6, block: 0 }, { name: 'Tension pull', damage: 10, block: 0 }, { name: 'Anchor lock', damage: 8, block: 4 }] },
  introduction: 'Iven braces the rail. The stranded carriers wait behind you.', victoryText: 'The clamps relax. People begin to cross.' };
