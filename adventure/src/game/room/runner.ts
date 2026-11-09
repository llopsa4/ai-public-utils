// Plays scripts: commands in order (src/game/room/commands.ts), speech and conversations.
import { applyDialogueEffects, resolveNode } from '../../engine/dialogue';
import { t } from '../../engine/i18n';
import { sound } from '../../audio/sound';
import type { ActorId, Command, Point, Speaker } from '../../engine/types';
import { chapter } from '../../chapters';
import type { RoomScene } from '../scenes';
import { COMMANDS } from './commands';
import { clearFocus } from './input';

// ----------------------------------------------------------------- script ---
/** Plays interaction commands in order. Input only skips speech until it finishes. */
export async function runScript(scene: RoomScene, commands: Command[]): Promise<void> {
  if (scene.isBusy() || commands.length === 0) return;
  scene.busy = true;
  clearFocus(scene);
  scene.hero.stop();
  scene.syncHero();
  scene.session.ui.setBusy(true);
  scene.session.ui.setHover('');
  try {
    for (const command of commands) {
      if (!(await exec(scene, command))) return;
    }
  } finally {
    if (scene.sys.isActive() && !scene.leaving) {
      scene.busy = false;
      scene.session.ui.setBusy(false);
      scene.session.ui.renderInventory();
      scene.session.autosave();
    }
  }
}

export function wait(scene: RoomScene, ms: number): Promise<void> {
  return new Promise(resolve => scene.time.delayedCall(ms, resolve));
}

export async function say(scene: RoomScene, actorId: Speaker, key: string, at?: Point): Promise<void> {
  const actor = scene.actors.get(actorId as ActorId);
  const point = actor?.headPoint() ?? at ?? { x: 320, y: 60 };
  await scene.session.ui.say(actorId, t(key), point, chapter().lineMoods[key]);
}

/** Executes one command (src/game/room/commands.ts). Returns false when the script must stop. */
export function exec(scene: RoomScene, command: Command): Promise<boolean> {
  const handler = COMMANDS[command.type] as (scene: RoomScene, command: Command) => Promise<boolean>;
  return handler(scene, command);
}

export async function runDialogue(scene: RoomScene, id: string): Promise<void> {
  const tree = chapter().dialogues[id];
  const state = scene.session.state;
  let nodeId: string | null = tree.start;
  while (nodeId) {
    const node = resolveNode(tree, nodeId, state);
    for (const command of node.run) await exec(scene, command);
    for (const line of node.lines) await say(scene, line.actor, line.text);
    const { inventoryChanged, gearReceived } = applyDialogueEffects(state, node);
    // Flags can change who holds what pose (Benn saluting) while the conversation goes on.
    if (gearReceived || Object.keys(node.set).length) scene.refreshObjects();
    if (inventoryChanged || gearReceived) scene.session.ui.renderInventory();
    if (node.choices.length > 0) {
      const index = await scene.session.ui.choose(node.choices.map(c => ({ text: t(c.text), read: c.read })), node.timed?.ms);
      if (index < 0 && node.timed) { nodeId = node.timed.next; continue; }
      sound.choose();
      const choice = node.choices[index];
      await say(scene, 'hero', choice.text);
      nodeId = choice.next;
    } else {
      nodeId = node.next;
    }
  }
}
