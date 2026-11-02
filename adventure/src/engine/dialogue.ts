import { conditionsHold } from './geometry';
import type { ActorId, Condition, GameState } from './types';

export interface DialogueLine { actor: ActorId; text: string }
export interface DialogueChoice { text: string; next: string | null; if?: Condition[] }
export interface DialogueNode {
  /** Redirects: the first entry whose conditions hold decides the node actually entered. */
  branch?: { if?: Condition[]; next: string }[];
  lines?: DialogueLine[];
  /** Flags set after the lines are spoken. */
  set?: Record<string, boolean>;
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
      choices: (node.choices ?? []).filter(c => conditionsHold(state, c.if)),
      next: node.next ?? null,
    };
  }
  throw new Error(`Dialogue branch loop at: ${id}`);
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
