import type { HotspotDef } from '../../engine/types';
import type { Actor } from '../Actor';
import type { Member } from '../Crowd';
// Constants and helpers shared by the room scene and its modules.
import Phaser from 'phaser';
import type { Command, Point, Verb } from '../../engine/types';
import { SHEETS } from '../assets';

export const FADE_MS = 280;
/** How far Mara walks past a doorway on leaving, and in from it on arriving (world units). */
export const DOORWAY_STEP = 26;
export const FACE_VECTOR: Record<string, Point> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
/** NPCs turn toward Mara within this distance. */
export const NOTICE_DISTANCE = 90;
/** Cool, dimmed tint for Cinderfold once the kiln is shut down. */
export const COLD_TINT = 0x8796b8;

/** Queues a sheet for loading unless it is already loaded or queued. */
/**
 * Sheets requested but not yet in the texture cache. A background load can outlive the room that
 * started it (Mara leaves the tent before the lit gauntlet arrives); the next room must not request
 * it again, or Phaser reports the texture key twice.
 */
export const inFlight = new Set<string>();

export function queueSheet(scene: Phaser.Scene, key: string): void {
  // A sheet not drawn yet (casual Mara before Codex delivers it) is skipped: the scene falls back.
  if (scene.textures.exists(key) || inFlight.has(key) || !SHEETS[key]) return;
  inFlight.add(key);
  scene.textures.once(`${Phaser.Textures.Events.ADD_KEY}${key}`, () => inFlight.delete(key));
  scene.load.atlas(key, SHEETS[key].png, SHEETS[key].json);
}

/** Runs `then` once the sheet is in the cache (now, or when its pending load lands). */
export function whenSheet(scene: Phaser.Scene, key: string, then: () => void): void {
  if (scene.textures.exists(key)) { then(); return; }
  scene.textures.once(`${Phaser.Textures.Events.ADD_KEY}${key}`, () => scene.time.delayedCall(0, then));
}

/** One animation per frame tag of a loaded sheet, keyed `<sheet>:<tag>` (once per sheet). */
export function createSheetAnims(scene: Phaser.Scene, key: string): void {
  const { json } = SHEETS[key];
  for (const tag of json.meta.frameTags) {
    if (scene.anims.exists(`${key}:${tag.name}`)) continue;
    const frames = json.frames.slice(tag.from, tag.to + 1);
    if (tag.direction === 'reverse') frames.reverse();
    const average = frames.reduce((sum, f) => sum + f.duration, 0) / frames.length;
    scene.anims.create({
      key: `${key}:${tag.name}`,
      frames: frames.map(f => ({ key, frame: f.filename })),
      frameRate: 1000 / average,
      repeat: frames.length > 1 ? -1 : 0,
      yoyo: tag.direction === 'pingpong',
    });
  }
}

/**
 * For hands-on verbs that walk up to something first, marks the moment Mara arrives (right after
 * the approach walk) so the scene can show him handling it.
 */
export function withHandling(commands: Command[], verb: Verb, target: string): Command[] {
  if (verb !== 'take' && verb !== 'use' && verb !== 'open') return commands;
  const arrive = commands.findIndex(c => c.type !== 'walk' && c.type !== 'face');
  if (arrive <= 0 || commands[arrive - 1].type !== 'walk') return commands;
  return [...commands.slice(0, arrive), { type: 'handle', target }, ...commands.slice(arrive)];
}

/** Multiplies a colour by a brightness factor and a second colour (both as 0xRRGGBB). */
export function multiplyColor(color: number, factor: number, other: number): number {
  const ch = (c: number, shift: number) => ((c >> shift) & 255) / 255;
  const r = Math.round(ch(color, 16) * ch(other, 16) * factor * 255);
  const g = Math.round(ch(color, 8) * ch(other, 8) * factor * 255);
  const b = Math.round(ch(color, 0) * ch(other, 0) * factor * 255);
  return (r << 16) | (g << 8) | b;
}

/**
 * Ambient particles. `rich` (High quality) uses the textured puff and ember streak, with turning
 * smoke and wobbling embers; otherwise plain dots at a lower rate.
 */
export function particleConfig(kind: 'embers' | 'steam' | 'dust' | 'ash', w: number, h: number, rich = false): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  const area = { x: { min: 0, max: w }, y: { min: 0, max: h } };
  if (rich) {
    switch (kind) {
      case 'embers':
        return { ...area, lifespan: { min: 2200, max: 4200 }, speedY: { min: -30, max: -10 }, speedX: { min: -8, max: 8 }, scale: { start: 0.5, end: 0.1 },
          alpha: { start: 1, end: 0 }, tint: [0xffd070, 0xff9a3a, 0xff6a1a], frequency: 200, blendMode: 'ADD', accelerationX: { min: -6, max: 6 } };
      case 'steam':
        return { ...area, lifespan: { min: 2800, max: 4400 }, speedY: { min: -11, max: -4 }, speedX: { min: -4, max: 4 }, scale: { start: 0.35, end: 1.5 },
          alpha: { start: 0.22, end: 0 }, tint: 0xf4efe6, frequency: 300, rotate: { start: 0, end: 90 } };
      case 'dust':
        return { ...area, lifespan: { min: 5000, max: 8000 }, speedY: { min: -2, max: 2 }, speedX: { min: -3, max: 3 }, scale: { min: 0.03, max: 0.07 },
          alpha: { start: 0.7, end: 0 }, tint: 0xffe2b0, frequency: 340, blendMode: 'ADD' };
      case 'ash':
        return { ...area, lifespan: { min: 6000, max: 9000 }, speedY: { min: 2, max: 7 }, speedX: { min: 4, max: 14 }, scale: { min: 0.05, max: 0.12 },
          alpha: { start: 0.6, end: 0 }, tint: [0xd8d0c8, 0xffb070], frequency: 200, rotate: { start: 0, end: 360 } };
    }
  }
  switch (kind) {
    case 'embers':
      return { ...area, lifespan: { min: 2200, max: 4200 }, speedY: { min: -26, max: -8 }, speedX: { min: -6, max: 6 }, scale: { start: 0.22, end: 0 },
        alpha: { start: 1, end: 0 }, tint: [0xffc060, 0xff8a2a, 0xff6a1a], frequency: 240, blendMode: 'ADD' };
    case 'steam':
      return { ...area, lifespan: { min: 2600, max: 4000 }, speedY: { min: -10, max: -3 }, speedX: { min: -3, max: 3 }, scale: { start: 0.5, end: 1.8 },
        alpha: { start: 0.18, end: 0 }, tint: 0xf4efe6, frequency: 380 };
    case 'dust':
      return { ...area, lifespan: { min: 5000, max: 8000 }, speedY: { min: -2, max: 2 }, speedX: { min: -3, max: 3 }, scale: { min: 0.06, max: 0.12 },
        alpha: { start: 0.6, end: 0 }, tint: 0xffe2b0, frequency: 420, blendMode: 'ADD' };
    case 'ash':
      return { ...area, lifespan: { min: 6000, max: 9000 }, speedY: { min: 2, max: 7 }, speedX: { min: 4, max: 12 }, scale: { min: 0.08, max: 0.16 },
        alpha: { start: 0.55, end: 0 }, tint: [0xd8d0c8, 0xffb070], frequency: 260 };
  }
}

/** What the pointer or the focus ring can be on. */
export type Target = { kind: 'hotspot'; hotspot: HotspotDef } | { kind: 'actor'; actor: Actor } | { kind: 'extra'; member: Member };
