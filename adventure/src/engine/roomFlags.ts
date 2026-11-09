// Which of a chapter's story flags belong to a room (the debug panel lists those first): every flag
// named by the room itself (hotspots, objects, people, darkness, cold), by the click rules on its
// things and people, by the conversations those rules or people start, and by the room's own
// scripts (on entering). Read from the chapter's data, so it never goes stale.
import type { Chapter } from '../chapters/types';

/** Text of data or a function (a rule's `do`, a script's `run`), for finding the flags it names. */
function text(v: unknown): string {
  if (typeof v === 'function') return v.toString();
  return JSON.stringify(v, (_k, x) => (typeof x === 'function' ? x.toString() : x)) ?? '';
}

export function roomFlags(ch: Chapter, roomId: string): string[] {
  const room = ch.rooms[roomId];
  if (!room) return [];
  const targets = new Set<string>([...room.hotspots.map(h => h.id), ...room.actors.map(a => a.id)]);
  const parts: string[] = [text(room)];
  for (const rule of ch.rules ?? []) {
    const on = Array.isArray(rule.target) ? rule.target : [rule.target];
    if (on.some(t => targets.has(t))) parts.push(text(rule.when), text(rule.do));
  }
  for (const entry of ch.story.onEnter) if (entry.room === roomId) parts.push(text(entry));
  if (ch.crowds[roomId]) parts.push(text(ch.crowds[roomId]));
  // Conversations: those started here (a dialogue command with its id), and the room's people's own.
  const joined = parts.join('\n');
  const talks = new Set<string>(room.actors.map(a => a.id));
  for (const m of joined.matchAll(/["']?type["']?\s*:\s*["']dialogue["']\s*,\s*["']?id["']?\s*:\s*["'](\w+)["']/g)) talks.add(m[1]);
  for (const id of talks) if (ch.dialogues[id]) parts.push(text(ch.dialogues[id]));
  const all = parts.join('\n');
  return ch.flags.filter(f => ch.flagRooms?.[f] === roomId || new RegExp(`["'\`]${f}["'\`]`).test(all));
}
