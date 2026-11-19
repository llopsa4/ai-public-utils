// Water dripping from the ceiling (a room's ambient `drips`: the cell's bucket): every `every` ms a
// pale drop falls from `top` to `bottom`, with a small splash and a plink. Seen even in the dark.
import { sound } from '../../audio/sound';
import type { RoomScene } from '../scenes';

/** Above the room's darkness (as the snores), so the drop shows in the black cell. */
const DEPTH = 9500;
const next = new Map<string, number>();
const KEY = 'fx-drop';

/** A solid little drop, 2x4 world px: bright at the bottom, paler above (drawn once). */
function dropTexture(scene: RoomScene): void {
  if (scene.textures.exists(KEY)) return;
  const tex = scene.textures.createCanvas(KEY, 4, 8);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(200,220,255,0.55)'; ctx.fillRect(1, 0, 2, 3);
  ctx.fillStyle = '#eef4ff'; ctx.fillRect(0, 3, 4, 5);
  tex.refresh();
}

export function updateDrips(scene: RoomScene, time: number): void {
  for (const [i, d] of (scene.room.ambient?.drips ?? []).entries()) {
    const key = `${scene.room.id}:${i}`;
    const due = next.get(key);
    if (due === undefined || due < time - 60000) { next.set(key, time + 600); continue; }
    if (time < due) continue;
    next.set(key, time + d.every);
    dropTexture(scene);
    const drop = scene.add.image(d.x, d.top, KEY).setScale(0.5).setDepth(DEPTH).setName('drip');
    // Falling under gravity (quadratic ease) to the water.
    const fall = Math.sqrt((d.bottom - d.top) / 400) * 1000;
    scene.tweens.add({
      targets: drop, y: d.bottom, duration: fall, ease: 'Quad.easeIn',
      onComplete: () => {
        drop.destroy();
        sound.drip();
        for (const dx of [-1.5, 1.5]) {
          const s = scene.add.image(d.x, d.bottom, KEY).setScale(0.3).setDepth(DEPTH).setAlpha(0.9);
          scene.tweens.add({ targets: s, x: d.x + dx * 2, y: d.bottom - 2, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => s.destroy() });
        }
      },
    });
  }
}
