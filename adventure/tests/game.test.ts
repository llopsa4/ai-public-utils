import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIALOGUES } from '../src/content/dialogue';
import { ACTOR_VERBS, INTERACTION_KEYS, interact } from '../src/content/interactions';
import { ROOMS } from '../src/content/rooms';
import { resolveNode } from '../src/engine/dialogue';
import { applyCommand, newGame } from '../src/engine/state';
import type { Command, GameState, Verb } from '../src/engine/types';

/** Plays commands against the state the way the scene does, returning the spoken lines. */
function run(state: GameState, verb: Verb, target: string, item?: string): string[] {
  const commands: Command[] = interact(state, verb, target, item);
  const spoken: string[] = [];
  for (const c of commands) {
    applyCommand(state, c);
    if (c.type === 'say') spoken.push(c.text);
  }
  return spoken;
}

test('the door is locked until the key from the suitcase is used on it', () => {
  const s = newGame();
  assert.deepEqual(run(s, 'open', 'door'), ['line.doorLocked']);
  assert.equal(s.flags.doorOpen, undefined);
  assert.deepEqual(run(s, 'go', 'door'), ['line.doorClosedGo']);
  assert.equal(s.room, 'hall');

  assert.deepEqual(run(s, 'open', 'suitcase'), ['line.suitcaseOpenKey']);
  assert.equal(s.flags.suitcaseOpen, true);
  assert.equal(s.hero.pose, 'stand', 'the hero crouches to open it, then stands again');

  assert.deepEqual(run(s, 'take', 'key'), ['line.keyTaken']);
  assert.deepEqual(s.inventory, ['key']);
  assert.equal(s.flags.keyTaken, true);

  assert.deepEqual(run(s, 'use', 'suitcase', 'key'), ['line.keyNotSuitcase']);
  assert.deepEqual(run(s, 'use', 'door', 'key'), ['line.doorUnlocked']);
  assert.equal(s.flags.doorUnlocked, true);
  assert.deepEqual(s.inventory, []);

  run(s, 'open', 'door');
  assert.equal(s.flags.doorOpen, true);
  run(s, 'go', 'door');
  assert.equal(s.room, 'street');
  assert.deepEqual({ x: s.hero.x, y: s.hero.y }, { x: ROOMS.street.entries.fromHall.x, y: ROOMS.street.entries.fromHall.y });

  run(s, 'go', 'hotelDoor');
  assert.equal(s.room, 'hall');
});

test('the hero walks to an object before using it', () => {
  const s = newGame();
  const commands = interact(s, 'open', 'suitcase');
  assert.equal(commands[0].type, 'walk');
  assert.deepEqual(commands.find(c => c.type === 'pose'), { type: 'pose', actor: 'hero', pose: 'crouch' });
});

test('pose verbs change both characters', () => {
  const s = newGame();
  run(s, 'crouch', 'hero');
  assert.equal(s.hero.pose, 'crouch');
  run(s, 'lie', 'hero');
  assert.equal(s.hero.pose, 'dead');
  run(s, 'stand', 'hero');
  assert.equal(s.hero.pose, 'stand');

  s.room = 'street';
  run(s, 'lie', 'keeper');
  assert.equal(s.keeper.pose, 'dead');
  assert.deepEqual(run(s, 'look', 'keeper'), ['line.keeperLookDead']);
  run(s, 'crouch', 'keeper');
  assert.equal(s.keeper.pose, 'crouch');
  run(s, 'stand', 'keeper');
  assert.equal(s.keeper.pose, 'stand');
  const talk = interact({ ...s, keeper: { ...s.keeper, pose: 'dead' } }, 'talk', 'keeper');
  assert.ok(talk.some(c => c.type === 'pose' && c.actor === 'keeper' && c.pose === 'stand'), 'he gets up to talk');
});

test('unknown combinations fall back to a polite refusal', () => {
  const s = newGame();
  assert.deepEqual(run(s, 'talk', 'window'), ['line.cannot']);
  assert.deepEqual(run(s, 'look', 'nonexistent'), ['line.nothingSpecial']);
  assert.deepEqual(run(s, 'use', 'painting', 'key'), ['line.useFails']);
});

test('keeper dialogue branches on what the player has done', () => {
  const tree = DIALOGUES.keeper;
  const s = newGame();
  const first = resolveNode(tree, tree.start, s);
  assert.equal(first.id, 'first');
  for (const [flag, value] of Object.entries(first.set)) s.flags[flag] = value;
  assert.equal(resolveNode(tree, tree.start, s).id, 'again');

  const choices = () => resolveNode(tree, 'hub', s).choices.map(c => c.next);
  assert.deepEqual(choices(), ['who', 'place', 'bye']);
  s.flags.askedWho = true;
  s.flags.keyTaken = true;
  assert.deepEqual(choices(), ['whoAgain', 'place', 'key', 'bye']);
  s.flags.toldKey = true;
  assert.deepEqual(choices(), ['whoAgain', 'place', 'bye']);
});

test('every dialogue link and room hotspot verb is valid', () => {
  for (const tree of Object.values(DIALOGUES)) {
    assert.ok(tree.nodes[tree.start]);
    for (const node of Object.values(tree.nodes)) {
      for (const next of [node.next, ...(node.branch ?? []).map(b => b.next), ...(node.choices ?? []).map(c => c.next)]) {
        if (next) assert.ok(tree.nodes[next], `missing node ${next}`);
      }
    }
  }
  const s = newGame();
  for (const room of Object.values(ROOMS)) {
    s.room = room.id;
    for (const h of room.hotspots) for (const verb of h.verbs) assert.ok(interact(s, verb, h.id).length > 0);
  }
  for (const verb of ACTOR_VERBS.hero) assert.ok(interact(s, verb, 'hero').every(c => c.type !== 'say' || INTERACTION_KEYS.includes(c.text)));
});
