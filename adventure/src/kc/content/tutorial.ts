// Copied from Kiln Courier (FFCardGame/client/src), same repository. Keep in step with it; local changes are marked "Cinderfold:".
import { CAMPAIGN_PROFILE } from './campaign';
import type { CardInstance, EncounterDefinition } from '../game/types';

export type LessonDialog = 'intent' | 'draw' | 'discard' | 'help' | 'log' | 'restart';
export type LessonAction = { type: 'open' | 'close'; dialog: LessonDialog } | { type: 'play'; id: string } | { type: 'end-turn' } | { type: 'finish' };
interface LessonStep { readonly target: string; readonly prompt: string; readonly action: LessonAction; readonly dialog?: LessonDialog | 'outcome' }
export const LESSON_STEPS: readonly LessonStep[] = [
  { target: 'intent', prompt: 'Inspect what the scavenger will do.', action: { type: 'open', dialog: 'intent' } },
  { target: 'close-modal', prompt: 'Close to choose your response.', dialog: 'intent', action: { type: 'close', dialog: 'intent' } },
  { target: 'strike-a', prompt: 'Play Knuckle Drive. It costs 1 energy.', action: { type: 'play', id: 'strike-a' } },
  { target: 'guard-a', prompt: 'Gain block before the attack.', action: { type: 'play', id: 'guard-a' } },
  { target: 'end-turn', prompt: 'End turn. Your block absorbs its attack.', action: { type: 'end-turn' } },
  { target: 'draw-button', prompt: 'Inspect your draw pile.', action: { type: 'open', dialog: 'draw' } },
  { target: 'close-modal', prompt: 'Close the draw pile.', dialog: 'draw', action: { type: 'close', dialog: 'draw' } },
  { target: 'discard-button', prompt: 'Played and unused cards return here.', action: { type: 'open', dialog: 'discard' } },
  { target: 'close-modal', prompt: 'Close the discard pile.', dialog: 'discard', action: { type: 'close', dialog: 'discard' } },
  { target: 'help-button', prompt: 'Help stays available during battle.', action: { type: 'open', dialog: 'help' } },
  { target: 'close-modal', prompt: 'Close Help to return.', dialog: 'help', action: { type: 'close', dialog: 'help' } },
  { target: 'log-button', prompt: 'The log records what happened.', action: { type: 'open', dialog: 'log' } },
  { target: 'close-modal', prompt: 'Close the battle log.', dialog: 'log', action: { type: 'close', dialog: 'log' } },
  { target: 'restart-button', prompt: 'Restart always asks first.', action: { type: 'open', dialog: 'restart' } },
  { target: 'lesson-cancel', prompt: 'Cancel to keep this lesson.', dialog: 'restart', action: { type: 'close', dialog: 'restart' } },
  { target: 'pulse-a', prompt: 'Pulse uses MP and builds strain.', action: { type: 'play', id: 'pulse-a' } },
  { target: 'end-turn', prompt: 'End turn to draw again.', action: { type: 'end-turn' } },
  { target: 'piston-b', prompt: 'Finish the scavenger off.', action: { type: 'play', id: 'piston-b' } },
  { target: 'lesson-continue', prompt: 'It is down.', dialog: 'outcome', action: { type: 'finish' } },
];
export const LESSON_DECK: readonly CardInstance[] = [
  { type: 'strike', id: 'strike-a' }, { type: 'guard', id: 'guard-a' }, { type: 'shield', id: 'shield-a' },
  { type: 'cycle', id: 'cycle-a' }, { type: 'vent', id: 'vent-a' }, { type: 'pulse', id: 'pulse-a' },
  { type: 'piston', id: 'piston-a' }, { type: 'guard', id: 'guard-b' }, { type: 'strike', id: 'strike-b' },
  { type: 'guard', id: 'guard-c' }, { type: 'piston', id: 'piston-b' }, { type: 'strike', id: 'strike-c' },
];
export const LESSON_PROFILE = { ...CAMPAIGN_PROFILE, deck: LESSON_DECK };
export const LESSON_ENCOUNTER: EncounterDefinition = {
  // Cinderfold: the Hatch Scavenger in the regulator gallery, in place of the practice sweeper.
  id: 'hatch-scavenger', title: 'REGULATOR GALLERY',
  enemy: { name: 'Hatch Scavenger', label: 'Scavenger', maxHp: 30, intents: [{ name: 'Collect', damage: 4, block: 0 }] },
  energyPerTurn: 3, handSize: 5,
  introduction: 'Something squeezed out of the hatch, drawn to the regulator. Read its intention before acting.',
  victoryText: 'The scavenger shudders, sparks, and goes still.',
};
export const LESSON_NODE = 'guided-combat';
export const LESSON_CLAIM = 'guided-combat:clear';
