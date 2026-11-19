// A dark room (RoomDef.dark): near black, except pools of light (a candle) and a small ring of
// visibility around the hero, redrawn every frame as he moves. When the room's condition stops
// holding (light let in), the darkness lifts slowly; entering an already lit room shows no darkness.
import type Phaser from 'phaser';
import { conditionsHold } from '../../engine/geometry';
import { settings } from '../../engine/settings';
import { LOGICAL_H, LOGICAL_W } from '../../ui/ui';
import type { RoomScene } from '../scenes';

/** Above people, props and foreground; below lantern flames, light halos, dust and the hover ring. */
const DARK_DEPTH = 8000;
const LIFT_MS = 1800;

interface Layer { tex: Phaser.Textures.CanvasTexture; image: Phaser.GameObjects.Image; lifting: boolean }
const layers = new WeakMap<RoomScene, Layer>();
const KEY = 'room-darkness';

const live = (scene: RoomScene): Layer | null => {
  const layer = layers.get(scene);
  return layer && layer.image.scene ? layer : null;
};

/** Creates, keeps or lifts the darkness for the room's current state (called on every story change). */
export function refreshDarkness(scene: RoomScene): void {
  const dark = scene.room.dark;
  const isDark = !!dark && conditionsHold(scene.session.state, dark.if);
  const layer = live(scene);
  if (isDark && !layer) {
    // A canvas texture (the production build of Phaser leaves out render textures).
    if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
    const tex = scene.textures.createCanvas(KEY, LOGICAL_W, LOGICAL_H)!;
    const image = scene.add.image(0, 0, KEY).setOrigin(0, 0).setDepth(DARK_DEPTH);
    layers.set(scene, { tex, image, lifting: false });
    drawDarkness(scene);
  } else if (!isDark && layer && !layer.lifting) {
    layer.lifting = true;
    scene.tweens.add({
      targets: layer.image, alpha: 0, duration: settings().reducedMotion ? 200 : LIFT_MS, ease: 'Sine.easeInOut',
      onComplete: () => { layer.image.destroy(); layers.delete(scene); },
    });
  }
}

/** Redraws the darkness with its light pools and the ring around the hero (every frame). */
export function drawDarkness(scene: RoomScene): void {
  const layer = live(scene), dark = scene.room.dark;
  if (!layer || !dark) return;
  const ctx = layer.tex.getContext();
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.fillStyle = `rgba(5, 4, 10, ${dark.alpha ?? 0.94})`;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  // Light pools fade out from their centre: cut away the dark with soft-edged circles.
  ctx.globalCompositeOperation = 'destination-out';
  const pool = (x: number, y: number, r: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (const l of dark.lights) pool(l.x, l.y, l.r);
  const hero = scene.hero?.sprite;
  if (hero?.active) pool(hero.x, hero.y - 40, dark.heroR);
  layer.tex.refresh();
}
