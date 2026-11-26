// Theo on the speaker (Mission 2, DESIGN §26): four beats that fire once each while the mission plays, as
// subtitles that never pause the game. The fifth, the last squatter down, is the door scene (sim/bunker.ts).
// Pure TypeScript; the state is plain JSON on `MissionState.speaker`. The lines live in `data/story.json`
// (`speaker`); the scene shows each new beat's lines.
import type { MissionState, Zone } from './mission';
import { TICK_HZ } from './time';

/**
 * `call`: a survivor first comes within `callRange` tiles of the fence; Theo asks for help and the enemy highlight
 * turns on. `guards`: `tipDelay` seconds later, where the guards are. `inside`: a survivor enters the house.
 * `half`: half the squatters are down.
 */
export const SPEAKER_BEATS = ['call', 'guards', 'inside', 'half'] as const;
export type SpeakerBeat = (typeof SPEAKER_BEATS)[number];

/** From the mission data: how near the fence the call comes and how long after it the guard tip follows. */
export interface SpeakerSpec {
  callRange: number; // tiles
  tipDelay: number; // seconds
}

export interface Speaker extends SpeakerSpec {
  fence: Zone;
  said: SpeakerBeat[]; // in the order they fired
  callTick: number; // the tick of the call; -1 before it
}

export function newSpeaker(spec: SpeakerSpec, fence: Zone): Speaker {
  return { callRange: spec.callRange, tipDelay: spec.tipDelay, fence: { ...fence }, said: [], callTick: -1 };
}

/** Tiles from (x, y) to the nearest tile of the zone; 0 inside it. */
export function toZone(z: Zone, x: number, y: number): number {
  const dx = Math.max(z.x - x, 0, x - (z.x + z.w - 1));
  const dy = Math.max(z.y - y, 0, y - (z.y + z.h - 1));
  return Math.hypot(dx, dy);
}

function say(s: MissionState, sp: Speaker, beat: SpeakerBeat): void {
  sp.said.push(beat);
  if (beat === 'call') {
    sp.callTick = s.tick;
    s.theoOnAir = true;
  }
}

/** After each tick: any beat whose moment has come fires, at most once. Nothing fires before the call. */
export function stepSpeaker(s: MissionState, sp: Speaker): void {
  const has = (b: SpeakerBeat): boolean => sp.said.includes(b);
  if (!has('call')) {
    if (s.survivors.some((u) => u.hp > 0 && toZone(sp.fence, u.x, u.y) <= sp.callRange)) say(s, sp, 'call');
    else return;
  }
  if (!has('guards') && s.tick - sp.callTick >= sp.tipDelay * TICK_HZ) say(s, sp, 'guards');
  if (!has('inside') && s.roofOpen) say(s, sp, 'inside');
  const humans = s.enemies.filter((e) => e.kind === 'human');
  const down = humans.filter((e) => e.hp <= 0).length;
  // the last squatter down is the door scene, not this beat
  if (!has('half') && humans.length > 0 && down >= Math.ceil(humans.length / 2) && down < humans.length) say(s, sp, 'half');
}
