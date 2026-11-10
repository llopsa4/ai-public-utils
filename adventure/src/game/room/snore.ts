// Sleepers snore (a room person with `snores`, holding the `sit` task: Benn on his chair, on his stool):
// every 3-5 seconds "z z Z" drift up from the head and fade, silently. Never while a script
// or a conversation runs. The letters are drawn once on a canvas (this Phaser build has no text).
import Phaser from 'phaser';
import { conditionsHold } from '../../engine/geometry';
import { settings } from '../../engine/settings';
import type { RoomScene } from '../scenes';

const KEY = 'fx-snore-z';
/** Above the room's darkness, so a sleeper in the dark still shows his snores. */
const DEPTH = 9500;
const next = new Map<string, number>();

function letterTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(KEY)) return;
  const tex = scene.textures.createCanvas(KEY, 32, 32);
  if (!tex) return;
  const ctx = tex.getContext();
  // A plain bold z: the blackletter and the old-print italic z both read as other letters.
  ctx.font = 'bold 26px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#2a1408';
  ctx.strokeText('z', 16, 15);
  ctx.fillStyle = '#ffd79a';
  ctx.fillText('z', 16, 15);
  tex.refresh();
}

/** One "z z Z": three letters, staggered, drifting up and aside, growing and fading. */
function puff(scene: RoomScene, at: { x: number; y: number }): void {
  const depth = DEPTH;
  letterTexture(scene);
  const still = settings().reducedMotion || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  [0.36, 0.46, 0.6].forEach((size, i) => {
    const img = scene.add.image(at.x + 4 + i * 7, at.y - i * 5, KEY).setScale(size).setAlpha(0).setDepth(depth);
    scene.tweens.add({
      targets: img, delay: i * 260, duration: 2500, ease: 'Sine.easeOut',
      x: still ? img.x : img.x + 10, y: still ? img.y : img.y - 22, scale: size * 1.4,
      // Fades in, then out: the tween runs the drift; the alpha follows its progress.
      onUpdate: tween => img.setAlpha(Math.sin(Math.PI * tween.progress) * 0.95),
      onComplete: () => img.destroy(),
    });
  });
}

/** Called every frame by the room: snores the sleepers that are due. */
export function updateSnores(scene: RoomScene, time: number): void {
  const state = scene.session.state;
  for (const def of scene.room.actors) {
    if (!def.snores) continue;
    const key = `${scene.room.id}:${def.id}`;
    const due = next.get(key);
    if (due === undefined) { next.set(key, time + 1000 + Math.random() * 1000); continue; }
    if (time < due) continue;
    next.set(key, time + 3000 + Math.random() * 2000);
    const actor = scene.actors.get(def.id);
    if (!actor?.sprite.active || actor.currentTask !== 'sit' || scene.isBusy()) continue;
    if (!conditionsHold(state, def.visibleIf) || !conditionsHold(state, def.snores)) continue;
    // headPoint() is over a standing head; seated (and slumped), his head is about half as high.
    const head = actor.headPoint(), feet = actor.sprite.y;
    puff(scene, { x: head.x + 4, y: feet - (feet - head.y) * 0.5 });
  }
}
