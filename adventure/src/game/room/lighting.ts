// The room scene's light: the cold tint, character lighting and the ambient particles and glows.
import Phaser from 'phaser';
import { settings } from '../../engine/settings';
import { sound } from '../../audio/sound';
import { highQuality } from '../atmosphere';
import { addLight, localLight, mixColor } from '../../engine/lighting';
import { chapter } from '../../chapters';
import { ambienceFor, musicFor } from '../../engine/story';
import { ART_SCALE } from '../../ui/ui';
import type { RoomScene } from '../scenes';
import { COLD_TINT, multiplyColor, particleConfig } from './shared';
import { drawDarkness, refreshDarkness } from './darkness';

/**
 * The kiln's cold: on High the camera grade shifts (Atmosphere); on Low the scenery is tinted.
 * Either way it fades in over three seconds when it happens in front of the player.
 */
export function applyTint(scene: RoomScene): void {
  const cold = scene.isCold();
  const animate = scene.knownCold === false && cold;
  scene.knownCold = cold;
  scene.crowd?.setMood(scene.crowdMood(), animate);
  scene.atmosphere.setCold(cold, animate);
  tintScenery(scene);
  refreshAmbient(scene, cold, animate);
  refreshDarkness(scene);
  sound.ambience(ambienceFor(chapter().story, scene.storyContext()));
  sound.music(musicFor(chapter().story, scene.storyContext()));
}

export function coldTintOf(scene: RoomScene): number {
  return scene.room.coldTint ?? COLD_TINT;
}

/** Low quality: tints the background, props and foreground by the (animated) cold factor. */
export function tintScenery(scene: RoomScene): void {
  const k = scene.atmosphere.enabled ? 0 : scene.atmosphere.cold;
  if (k === scene.tintedCold) return;
  scene.tintedCold = k;
  const tint = mixColor(0xffffff, coldTintOf(scene), k);
  for (const o of [scene.background, ...scene.objects.values(), ...scene.foreground, ...(scene.sign ? [scene.sign.image] : [])]) {
    if (k === 0) o.clearTint(); else o.setTint(tint);
  }
}

/**
 * Characters take the room's light, darker toward the back, warmer near kiln mouths, hearths and
 * lanterns (the room's glows), cooled once the kiln is cold (on Low; High grades the whole camera).
 */
export function updateLighting(scene: RoomScene): void {
  drawDarkness(scene);
  const light = scene.room?.light;
  if (!light || !scene.atmosphere) return;
  const cold = scene.atmosphere.cold;
  const coldTint = scene.atmosphere.enabled ? 0xffffff : mixColor(0xffffff, coldTintOf(scene), cold);
  const carried = scene.room.heroLight;
  const glow = scene.heroLight;
  let sources = scene.room.ambient?.glows ?? [];
  if (carried && glow?.active && scene.hero?.sprite.active) {
    // At the gauntlet hand, a little ahead of him.
    const h = scene.hero.sprite;
    glow.setPosition(h.x + (h.flipX ? -14 : 14) * h.scaleX * ART_SCALE, h.y - 46 * h.scaleY * ART_SCALE);
    sources = [...sources, { x: glow.x, y: glow.y, r: carried.r, color: carried.color }];
  }
  const { farY, nearY } = scene.room.scale;
  for (const actor of scene.allActors()) {
    const t = Phaser.Math.Clamp((actor.sprite.y - farY) / (nearY - farY), 0, 1);
    const dim = light.farDim + (1 - light.farDim) * t;
    const chest = { x: actor.sprite.x, y: actor.sprite.y - 40 * actor.sprite.scaleY * ART_SCALE };
    actor.sprite.setTint(addLight(multiplyColor(light.tint, dim, coldTint), localLight(chest, sources, cold)));
  }
}

/**
 * Particles and flickering light pools; warm ones go out with the kiln (fading over three seconds
 * when it happens in front of the player). Off with reduced motion. On High each glow also gets a
 * wide, faint bloom halo.
 */
export function refreshAmbient(scene: RoomScene, cold: boolean, animate = false): void {
  if (scene.ambientCold === cold && scene.ambient.length) return;
  scene.ambientCold = cold;
  const old = scene.ambient;
  scene.ambient = [];
  if (animate) {
    for (const o of old) {
      if (o instanceof Phaser.GameObjects.Particles.ParticleEmitter) o.stop();
      else scene.tweens.killTweensOf(o);
      scene.tweens.add({ targets: o, alpha: 0, duration: 3000, onComplete: () => o.destroy() });
    }
  } else {
    for (const o of old) o.destroy();
  }
  // Mara's own light (dark rooms): lighting, not motion, so it stays with reduced motion.
  scene.heroLight = null;
  const carried = scene.room.heroLight;
  if (carried) {
    const light = scene.add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(carried.color)
      .setScale((carried.r * 2) / 128).setAlpha(0.4).setDepth(-4000);
    if (!settings().reducedMotion) scene.tweens.add({ targets: light, alpha: { from: 0.32, to: 0.46 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.ambient.push(light);
    scene.heroLight = light;
  }
  const def = scene.room.ambient;
  if (!def || settings().reducedMotion) return;
  const bloom = highQuality(scene);
  for (const p of def.particles ?? []) {
    if (cold && p.warm) continue;
    const texture = !bloom ? 'fx-dot' : p.kind === 'embers' ? 'fx-ember' : 'fx-puff';
    scene.ambient.push(scene.add.particles(p.x, p.y, texture, particleConfig(p.kind, p.w, p.h, bloom)).setDepth(p.kind === 'dust' ? 9000 : -5000));
  }
  for (const g of def.glows ?? []) {
    if (cold && g.warm) continue;
    const light = scene.add.image(g.x, g.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(g.color)
      .setScale((g.r * 2) / 128).setAlpha(0.35).setDepth(-5000);
    scene.tweens.add({ targets: light, alpha: { from: 0.22, to: 0.42 }, duration: Phaser.Math.Between(180, 420), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 300) });
    scene.ambient.push(light);
    if (bloom) {
      const halo = scene.add.image(g.x, g.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(g.color)
        .setScale((g.r * 5) / 128).setAlpha(0.1).setDepth(8500);
      scene.tweens.add({ targets: halo, alpha: { from: 0.07, to: 0.13 }, duration: Phaser.Math.Between(600, 1100), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.ambient.push(halo);
    }
  }
}
