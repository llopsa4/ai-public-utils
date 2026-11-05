import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTERS, loadAllChapters, setChapter, type Chapter } from '../src/chapters';

// Every chapter, chapters after the first included (they load on demand in the game).
await loadAllChapters();
import { resolveNode } from '../src/engine/dialogue';
import { conditionsHold } from '../src/engine/geometry';
import { TABLES } from '../src/engine/i18n';
import { applyCommand, newGame } from '../src/engine/state';
import { onEnter } from '../src/engine/story';
import { VERBS, type Command, type GameState } from '../src/engine/types';

/**
 * Explores every story state a chapter can reach through clicks, items and conversation choices
 * (positions, poses and look counts aside) and checks the story can always be finished.
 * Optional finds (secrets, people met) are left out of the search to keep it small; they gate
 * nothing (checked here too).
 */

const key = (s: GameState) => `${s.room}|${Object.keys(s.flags).filter(f => s.flags[f]).sort().join(',')}|${[...s.inventory].sort().join(',')}`;

interface Outcome { state: GameState; ended: boolean; lines: string[] }

/** Scene creation runs the first matching room-entry script before accepting clicks. */
function entryCommands(c: Chapter, state: GameState): Command[] {
  const room = c.rooms[state.room];
  return onEnter(c.story, { state, room, cold: !!room.coldIf && conditionsHold(state, room.coldIf) });
}

/** Plays commands on a copy of the state; conversations branch into one outcome per path. */
function play(c: Chapter, start: GameState, commands: Command[]): Outcome[] {
  let outcomes: Outcome[] = [{ state: structuredClone(start), ended: false, lines: [] }];
  for (const command of commands) {
    const next: Outcome[] = [];
    for (const o of outcomes) {
      if (o.ended) { next.push(o); continue; }
      if (command.type === 'end') { next.push({ ...o, ended: true }); continue; }
      if (command.type === 'say') o.lines.push(command.text);
      if (command.type === 'dialogue') { next.push(...talk(c, o, command.id)); continue; }
      applyCommand(o.state, command);
      if (command.type === 'room') {
        for (const entered of play(c, o.state, entryCommands(c, o.state))) {
          next.push({ ...entered, lines: [...o.lines, ...entered.lines] });
        }
        continue;
      }
      next.push(o);
    }
    outcomes = next;
  }
  return outcomes;
}

function talk(c: Chapter, o: Outcome, id: string): Outcome[] {
  const tree = c.dialogues[id];
  const ends = new Map<string, GameState>();
  const seen = new Set<string>();
  const walk = (nodeId: string | null, state: GameState) => {
    if (!nodeId) { ends.set(key(state), state); return; }
    const visit = `${nodeId}|${key(state)}`;
    if (seen.has(visit)) return;
    seen.add(visit);
    const node = resolveNode(tree, nodeId, state);
    const s = structuredClone(state);
    for (const line of node.lines) o.lines.push(line.text);
    for (const [flag, value] of Object.entries(node.set)) applyCommand(s, { type: 'setFlag', flag, value });
    for (const item of node.items) applyCommand(s, { type: 'addItem', item });
    if (node.choices.length) for (const ch of node.choices) { o.lines.push(ch.text); walk(ch.next, s); }
    else walk(node.next, s);
  };
  walk(tree.start, o.state);
  // Paths that end in the same story state are one outcome (sharing the lines heard).
  return [...ends.values()].map(state => ({ state, ended: false, lines: o.lines }));
}

/** Every click the player can make in a state: verbs on visible targets, items on them. */
function clicks(c: Chapter, s: GameState): { verb: (typeof VERBS)[number]; target: string; item?: string }[] {
  const room = c.rooms[s.room];
  const hotspots = room.hotspots.filter(h => conditionsHold(s, h.visibleIf));
  const actors = room.actors.filter(a => conditionsHold(s, a.visibleIf));
  const out: { verb: (typeof VERBS)[number]; target: string; item?: string }[] = [];
  for (const h of hotspots) for (const verb of h.verbs) out.push({ verb, target: h.id });
  for (const a of actors) for (const verb of (c.actorVerbs[a.id] ?? [])) out.push({ verb, target: a.id });
  for (const verb of (c.actorVerbs.hero ?? [])) out.push({ verb, target: 'hero' });
  for (const item of s.inventory) {
    for (const verb of c.itemVerbs) out.push({ verb, target: `item:${item}` });
    for (const t of ['hero', ...hotspots.map(h => h.id), ...actors.map(a => a.id)]) out.push({ verb: 'use', target: t, item });
  }
  return out;
}

function explore(c: Chapter) {
  const optional = new Set([...c.secretFlags, ...c.metFlags]);
  const fresh = newGame(c.id);
  const initial = play(c, fresh, entryCommands(c, fresh));
  const states = new Map<string, GameState>(initial.map(o => [key(o.state), o.state]));
  const edges = new Map<string, Set<string>>();
  const ends = new Set(initial.filter(o => o.ended).map(o => key(o.state)));
  const lines = new Set(initial.flatMap(o => o.lines));
  const optionalFound = new Set<string>();
  const queue = initial.filter(o => !o.ended).map(o => o.state);
  while (queue.length) {
    const s = queue.shift()!;
    if (states.size > 20000) throw new Error(`state explosion: ${states.size} states`);
    const from = key(s);
    const to = new Set<string>();
    edges.set(from, to);
    for (const { verb, target, item } of clicks(c, s)) {
      for (const o of play(c, s, c.interact(structuredClone(s), verb, target, item))) {
        for (const l of o.lines) lines.add(l);
        for (const f of optional) if (o.state.flags[f] && !s.flags[f]) optionalFound.add(f);
        for (const f of optional) if (!s.flags[f]) delete o.state.flags[f];
        if (o.ended) { ends.add(from); continue; }
        const k = key(o.state);
        if (k === from) continue;
        to.add(k);
        if (!states.has(k)) { states.set(k, o.state); queue.push(o.state); }
      }
    }
  }
  // States from which the end can still be reached (walking the edges backwards).
  const canFinish = new Set(ends);
  for (let grew = true; grew;) {
    grew = false;
    for (const [from, to] of edges) {
      if (!canFinish.has(from) && [...to].some(k => canFinish.has(k))) { canFinish.add(from); grew = true; }
    }
  }
  return { states, ends, canFinish, lines, optionalFound };
}

for (const c of Object.values(CHAPTERS)) {
  test(`${c.id}: every story state can still reach the end; every room, goal and line exists`, () => {
    setChapter(c.id);
    const { states, ends, canFinish, lines, optionalFound } = explore(c);
    if (c.id === 'ch1') assert.ok(lines.has('line.wrenCalls'), 'room-entry scripts participate in the story graph');
    assert.ok(ends.size > 0, 'the end is reachable');
    const stuck = [...states.keys()].filter(k => !canFinish.has(k));
    assert.deepEqual(stuck.slice(0, 5), [], `${stuck.length} dead-end states`);
    const visited = new Set([...states.values()].map(s => s.room));
    assert.deepEqual(Object.keys(c.rooms).filter(r => !visited.has(r)), [], 'rooms never reached');
    const done = new Set([...states.values()].flatMap(s => c.objectives(s).filter(o => o.done).map(o => o.key)));
    // The last goal is done on the way out (the end), so it may not show in a reachable state.
    assert.deepEqual(c.objectiveKeys.filter(k => !done.has(k)).slice(0, -1), [], 'goals never done');
    const strings = TABLES.en;
    assert.deepEqual([...lines].filter(l => !(l in strings)), [], 'lines with no text');
    assert.deepEqual(c.secretFlags.filter(f => !optionalFound.has(f)), [], 'secrets never found');
    console.log(`${c.id}: ${states.size} story states, ${lines.size} distinct lines`);
  });
}
