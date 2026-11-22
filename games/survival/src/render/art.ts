// Draws a manifest key as an image: from its atlas frame (final art, or a stand-in with `?standins`) at scale 0.5,
// else from its code placeholder (art/SPEC.md sections 1 and 9). Every place that shows a key goes through here, so
// replacing an asset needs no change in the scenes.
import Phaser from 'phaser';
import { standinsOn } from './standins';
import { defaultFrame } from './frames';
import { anchorOf, entry } from './manifest';

const warned = new Set<string>();

/** True when the key's frame is drawn from an atlas rather than from its code placeholder. */
export function fromAtlas(scene: Phaser.Scene, key: string, frame?: string): boolean {
  const e = entry(key);
  if (!e.atlas || !e.anchor || !scene.textures.exists(e.atlas)) return false;
  if (e.status !== 'final' && !standinsOn()) return false;
  return scene.textures.get(e.atlas).has(frame ?? defaultFrame(key));
}

/** Gives the image the key's picture, scale and origin; `frame` defaults to the key's first frame. Returns the image. */
export function applyArt<T extends Phaser.GameObjects.Image>(img: T, key: string, frame?: string): T {
  const scene = img.scene;
  const e = entry(key);
  if (fromAtlas(scene, key, frame)) {
    const [ax, ay] = e.anchor as [number, number];
    return img.setTexture(e.atlas as string, frame ?? defaultFrame(key)).setScale(0.5).setOrigin(ax, ay) as T;
  }
  if (!scene.textures.exists(key)) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`Art key ${key} has no final art and no placeholder (open the dev server with ?standins).`);
    }
    return img.setTexture('__MISSING').setScale(1).setOrigin(0.5, 0.5) as T;
  }
  const [ax, ay] = anchorOf(key);
  return img.setTexture(key).setScale(1).setOrigin(ax, ay) as T;
}

/** Adds an image for a manifest key at a world point (the anchor sits on the point). */
export function spriteFor(scene: Phaser.Scene, key: string, x: number, y: number, frame?: string): Phaser.GameObjects.Image {
  return applyArt(scene.add.image(x, y, '__DEFAULT'), key, frame);
}
