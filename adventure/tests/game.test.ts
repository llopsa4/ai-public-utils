import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIALOGUES } from '../src/content/dialogue';
import { ACTOR_VERBS, INTERACTION_KEYS, ITEM_VERBS, interact } from '../src/content/interactions';
import { ROOMS } from '../src/content/rooms';
import { resolveNode } from '../src/engine/dialogue';
import { FLAGS, ITEMS, applyCommand, newGame } from '../src/engine/state';
import type { Command, GameState, Verb } from '../src/engine/types';

/** Plays commands against the state the way the scene does, returning the spoken lines and commands. */
function run(state: GameState, verb: Verb, target: string, item?: string) {
  const commands: Command[] = interact(state, verb, target, item);
  const spoken: string[] = [];
  for (const c of commands) {
    applyCommand(state, c);
    if (c.type === 'say') spoken.push(c.text);
  }
  return { spoken, commands };
}

/**
 * Plays a conversation the way the scene does. `pick` chooses among the visible choices by their
 * target node; when it returns undefined the last choice is taken.
 */
function talk(state: GameState, id: string, pick: (next: (string | null)[]) => string | null | undefined = () => undefined): string[] {
  const tree = DIALOGUES[id];
  const visited: string[] = [];
  let nodeId: string | null = tree.start;
  for (let guard = 0; nodeId && guard < 50; guard++) {
    const node = resolveNode(tree, nodeId, state);
    visited.push(node.id);
    for (const [flag, value] of Object.entries(node.set)) applyCommand(state, { type: 'setFlag', flag, value });
    for (const item of node.items) applyCommand(state, { type: 'addItem', item });
    if (node.choices.length) {
      const options = node.choices.map(c => c.next);
      const wanted = pick(options);
      nodeId = wanted !== undefined && options.includes(wanted) ? wanted : options.at(-1)!;
    } else nodeId = node.next;
  }
  return visited;
}

/** Plays the scene up to (but excluding) the shutdown decision. */
function toArgument(): GameState {
  const s = newGame();
  run(s, 'take', 'rack');
  run(s, 'take', 'notebook');
  run(s, 'go', 'tentFlap');
  run(s, 'go', 'roomCurtain');
  run(s, 'use', 'pantryDoor', 'gauntlet');
  run(s, 'go', 'stairs');
  run(s, 'use', 'regulator', 'gauntlet');
  return s;
}

test('the whole scene plays from Mara\'s tent to the ashways', () => {
  const s = newGame();
  assert.equal(s.room, 'tent');
  assert.deepEqual(run(s, 'go', 'tentFlap').spoken, ['line.tentNotYet'], 'he needs the gauntlet working before leaving');
  assert.equal(s.room, 'tent');

  run(s, 'take', 'rack');
  assert.ok(s.flags.hasGauntlet);
  assert.deepEqual(s.inventory, ['gauntlet']);
  run(s, 'take', 'notebook');
  assert.deepEqual(s.inventory, ['gauntlet', 'notebook']);

  run(s, 'go', 'tentFlap');
  assert.equal(s.room, 'maraRoom');
  run(s, 'go', 'toTent');
  assert.equal(s.room, 'tent', 'the tent can be revisited');
  run(s, 'go', 'tentFlap');
  run(s, 'go', 'roomCurtain');
  assert.equal(s.room, 'firingHouse');
  assert.deepEqual(run(s, 'go', 'stairs').spoken, ['line.stairsNotYet'], 'the gallery waits for the alarm');
  assert.deepEqual(run(s, 'go', 'kilnGate').spoken, ['line.gateNotYet'], 'Mara has no reason to leave yet');

  const latch = run(s, 'use', 'pantryDoor', 'gauntlet');
  assert.ok(s.flags.latchFixed && s.flags.alarm);
  assert.ok(latch.spoken.includes('line.orenCalls'));
  assert.ok(latch.commands.some(c => c.type === 'shake'));

  run(s, 'go', 'stairs');
  assert.equal(s.room, 'gallery');
  assert.deepEqual(run(s, 'use', 'regulator', 'notebook').spoken, ['line.notebookTooSoon']);
  run(s, 'use', 'regulator', 'gauntlet');
  assert.ok(s.flags.patchFailed, 'the patch fails at the locking ring');
  assert.deepEqual(run(s, 'use', 'regulator', 'gauntlet').spoken, ['line.notReady'], 'not before talking to Oren');
  assert.deepEqual(run(s, 'use', 'regulator', 'notebook').spoken, ['line.notebookNotReady']);

  talk(s, 'oren', options => options.find(n => n === 'decide') ?? options[0]);
  assert.ok(s.flags.decided);
  assert.deepEqual(run(s, 'use', 'regulator', 'gauntlet').spoken, ['line.needProcedure'], 'the notebook comes first');
  run(s, 'use', 'regulator', 'notebook');
  assert.ok(s.flags.procedureKnown);
  const release = run(s, 'use', 'regulator', 'gauntlet');
  assert.ok(s.flags.kilnCold);
  assert.ok(s.inventory.includes('regulator'));
  assert.ok(release.commands.some(c => c.type === 'pose' && c.actor === 'hero' && c.pose === 'crouch'));

  run(s, 'go', 'galleryStairs');
  assert.equal(s.room, 'firingHouse');
  talk(s, 'nell');
  assert.ok(s.inventory.includes('bread') && s.inventory.includes('scarf'), 'neighbours give supplies once it is cold');

  run(s, 'go', 'kilnGate');
  assert.equal(s.room, 'ashways');
  assert.deepEqual(run(s, 'go', 'passage').spoken, ['line.passageBlocked']);
  assert.deepEqual(run(s, 'look', 'sweeper').spoken, ['line.sweeperLook1', 'line.sweeperLook2'], 'mystery: it guards the pipe');
  assert.deepEqual(run(s, 'use', 'sweeper', 'gauntlet').spoken, ['line.sweeperFight'], 'no fighting');
  const vent = run(s, 'use', 'valve', 'gauntlet');
  assert.ok(s.flags.valveVented);
  assert.ok(vent.commands.some(c => c.type === 'moveObject' && c.id === 'sweeper'));
  const exit = run(s, 'go', 'passage');
  assert.equal(exit.commands.at(-1)?.type, 'end');
});

test('every path through the argument reaches Mara\'s own decision', () => {
  const concerns = ['repair', 'mother', 'leaving', 'whyMe'];
  const pairs = concerns.flatMap((a, i) => concerns.slice(i + 1).map(b => [a, b]));
  for (const [a, b] of pairs) {
    const s = toArgument();
    const order = [a, b, 'decide'];
    talk(s, 'oren', options => order.find(n => options.includes(n)));
    assert.ok(s.flags.decided, `${a} + ${b} should lead to the decision`);
  }
  // One concern is not enough; "I need a minute" always leaves the door open.
  const s = toArgument();
  const seen: (string | null)[][] = [];
  talk(s, 'oren', options => { seen.push(options); return seen.length === 1 ? 'repair' : 'minute'; });
  assert.ok(!seen[1].includes('decide'));
  assert.ok(!s.flags.decided);
  const again = talk(s, 'oren', options => options.includes('mother') ? 'mother' : 'decide');
  assert.ok(s.flags.decided);
  assert.ok(!again.includes('argue'), 'returning skips the opening line');
});

test('the gauntlet changes the hero sheet flag and the cold flag tints Cinderfold', () => {
  const s = newGame();
  assert.ok(!s.flags.hasGauntlet);
  run(s, 'use', 'rack');
  assert.ok(s.flags.hasGauntlet);
  for (const id of ['maraRoom', 'firingHouse', 'gallery']) assert.deepEqual(ROOMS[id].coldIf, [{ flag: 'kilnCold' }]);
  assert.equal(ROOMS.ashways.coldIf, undefined);
});

test('pose verbs work on Mara and every neighbour', () => {
  const s = toArgument();
  run(s, 'crouch', 'hero');
  assert.equal(s.hero.pose, 'crouch');
  run(s, 'lie', 'hero');
  assert.equal(s.hero.pose, 'dead');
  run(s, 'stand', 'hero');
  assert.equal(s.hero.pose, 'stand');
  for (const id of ['oren', 'nell'] as const) {
    run(s, 'lie', id);
    assert.equal(s.npcs[id].pose, 'dead');
    run(s, 'crouch', id);
    assert.equal(s.npcs[id].pose, 'crouch');
    run(s, 'stand', id);
    assert.equal(s.npcs[id].pose, 'stand');
  }
});

test('every content reference is valid', () => {
  for (const tree of Object.values(DIALOGUES)) {
    assert.ok(tree.nodes[tree.start]);
    for (const node of Object.values(tree.nodes)) {
      for (const next of [node.next, ...(node.branch ?? []).map(b => b.next), ...(node.choices ?? []).map(c => c.next)]) {
        if (next) assert.ok(tree.nodes[next], `missing node ${next}`);
      }
      for (const item of node.items ?? []) assert.ok((ITEMS as readonly string[]).includes(item), `unknown item ${item}`);
      for (const flag of Object.keys(node.set ?? {})) assert.ok((FLAGS as readonly string[]).includes(flag), `unknown flag ${flag}`);
    }
  }
  const s = newGame();
  const flagsUsed = new Set<string>();
  for (const room of Object.values(ROOMS)) {
    s.room = room.id;
    for (const h of room.hotspots) for (const verb of h.verbs) {
      const commands = interact(s, verb, h.id);
      assert.ok(commands.length > 0);
      for (const c of commands) {
        if (c.type === 'say') assert.ok(INTERACTION_KEYS.includes(c.text), `unlisted line ${c.text}`);
        if (c.type === 'setFlag') flagsUsed.add(c.flag);
        if (c.type === 'room') assert.ok(ROOMS[c.room]?.entries[c.entry], `bad exit ${c.room}/${c.entry}`);
      }
    }
    for (const o of room.objects) {
      for (const f of [o.flag, o.movedTo?.flag]) if (f) assert.ok((FLAGS as readonly string[]).includes(f), `unknown flag ${f}`);
    }
  }
  for (const verb of ACTOR_VERBS.hero) assert.ok(interact(s, verb, 'hero').length > 0);
  for (const item of ITEMS) for (const verb of ITEM_VERBS) assert.ok(interact(s, verb, `item:${item}`).length > 0);
  for (const f of flagsUsed) assert.ok((FLAGS as readonly string[]).includes(f), `unknown flag ${f}`);
});
