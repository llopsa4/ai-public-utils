import { conditionsHold } from './geometry';
import { EQUIPMENT } from '../combat/gear';
import { equip, giveSpares } from './kit';
import { applyCommand } from './state';
import type { ActorId, Condition, GameState, Kit } from './types';

export interface DialogueLine { actor: ActorId; text: string }
export interface DialogueChoice { text: string; next: string | null; if?: Condition[] }
export interface DialogueGear { give: readonly string[]; equip?: string }
export interface DialogueNode {
  /** Redirects: the first entry whose conditions hold decides the node actually entered. */
  branch?: { if?: Condition[]; next: string }[];
  lines?: DialogueLine[];
  /** Flags set after the lines are spoken. */
  set?: Record<string, boolean>;
  /** Items handed to Mara after the lines are spoken. */
  items?: string[];
  /** Gear granted after the lines; equip applies only when that piece is first received. */
  gear?: DialogueGear;
  /** Shown after the lines; the hero speaks the chosen text, then the dialogue moves on. */
  choices?: DialogueChoice[];
  /** Used when there are no choices; null or absent ends the conversation. */
  next?: string | null;
}
export interface DialogueTree { start: string; nodes: Record<string, DialogueNode> }

export interface ResolvedNode {
  id: string;
  lines: DialogueLine[];
  set: Record<string, boolean>;
  items: string[];
  gear?: DialogueGear;
  choices: DialogueChoice[];
  next: string | null;
}

/** Follows branches from `id` and returns the node to play, with choices filtered for the current state. */
export function resolveNode(tree: DialogueTree, id: string, state: GameState): ResolvedNode {
  let current = id;
  for (let hops = 0; hops < 16; hops++) {
    const node = tree.nodes[current];
    if (!node) throw new Error(`Unknown dialogue node: ${current}`);
    const redirect = node.branch?.find(b => conditionsHold(state, b.if));
    if (redirect) { current = redirect.next; continue; }
    return {
      id: current,
      lines: node.lines ?? [],
      set: node.set ?? {},
      items: node.items ?? [],
      gear: node.gear,
      choices: (node.choices ?? []).filter(c => conditionsHold(state, c.if)),
      next: node.next ?? null,
    };
  }
  throw new Error(`Dialogue branch loop at: ${id}`);
}

/** Grants dialogue equipment once, without overriding an outfit chosen after the reward. */
export function applyDialogueGear(kit: Kit, reward: DialogueGear | undefined): boolean {
  if (!reward) return false;
  const received = reward.give.filter(id => !kit.owned.includes(id));
  if (!received.length) return false;
  giveSpares(kit, received);
  if (reward.equip && received.includes(reward.equip)) {
    const item = EQUIPMENT[reward.equip];
    if (item) equip(kit, item.slot, reward.equip);
  }
  return true;
}

/** Applies a resolved node after its lines finish, before presenting its already-resolved choices. */
export function applyDialogueEffects(state: GameState, node: ResolvedNode): { inventoryChanged: boolean; gearReceived: boolean } {
  for (const [flag, value] of Object.entries(node.set)) applyCommand(state, { type: 'setFlag', flag, value });
  const before = state.inventory.length;
  for (const item of node.items) applyCommand(state, { type: 'addItem', item });
  const gearReceived = applyDialogueGear(state.kit, node.gear);
  return { inventoryChanged: state.inventory.length !== before, gearReceived };
}

/** Collects every string key used by a tree (for translation completeness checks). */
export function dialogueKeys(tree: DialogueTree): string[] {
  const keys: string[] = [];
  for (const node of Object.values(tree.nodes)) {
    for (const line of node.lines ?? []) keys.push(line.text);
    for (const choice of node.choices ?? []) keys.push(choice.text);
  }
  return keys;
}
