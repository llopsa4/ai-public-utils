import Phaser from 'phaser';

// Code outlines (art/STYLE.md *Occlusion* and *Labels*): the hover outline on a usable object, and the glowing
// copy of a selected survivor seen through a wall. Both use a WebGL glow when there is one; otherwise a plain box
// (hover) or the copy alone (survivor), so the cue never depends on the renderer.
const HOVER = 0xf0dc8a;
const SELECT = 0xe8e6de;

type Glow = Phaser.FX.Glow;

function addGlow(img: Phaser.GameObjects.Image, color: number, strength: number): Glow | null {
  try {
    return img.postFX?.addGlow(color, strength, 0, false, 0.1, 8) ?? null;
  } catch {
    return null; // a canvas renderer has no post FX
  }
}

/** The outline of the one object under the pointer. `set(img)` outlines it; `set(null)` clears. */
export class HoverOutline {
  private target: Phaser.GameObjects.Image | null = null;
  private glow: Glow | null = null;
  private readonly box: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.box = scene.add.graphics().setDepth(881).setVisible(false);
  }

  set(img: Phaser.GameObjects.Image | null): void {
    if (img && !img.visible) img = null;
    if (img !== this.target) {
      if (this.target && this.glow) this.target.postFX?.remove(this.glow);
      this.glow = null;
      this.target = img;
      if (img) this.glow = addGlow(img, HOVER, 4);
    }
    // No glow (canvas): a thin box around the image keeps the cue.
    const boxed = this.target !== null && this.glow === null;
    this.box.setVisible(boxed);
    if (boxed && this.target) {
      const b = this.target.getBounds();
      this.box.clear().lineStyle(2, HOVER, 0.9).strokeRect(b.x, b.y, b.width, b.height);
    }
  }
}

/** Glowing copies of survivors that a wall or tree hides: the survivor shows through, outlined. */
export class Ghosts {
  private readonly copies = new Map<string, { img: Phaser.GameObjects.Image; glow: Glow | null }>();

  constructor(private readonly scene: Phaser.Scene) {}

  /** Shows the copy of `body` for `id` (copying its frame, flip and place) above the walls, or hides it. */
  show(id: string, body: Phaser.GameObjects.Image | null): void {
    let c = this.copies.get(id);
    if (!body || !body.visible) {
      c?.img.setVisible(false);
      return;
    }
    if (!c) {
      const img = this.scene.add.image(0, 0, body.texture.key).setDepth(879).setVisible(false);
      c = { img, glow: addGlow(img, SELECT, 3) };
      this.copies.set(id, c);
    }
    const { img } = c;
    if (img.texture.key !== body.texture.key || img.frame.name !== body.frame.name) img.setTexture(body.texture.key, body.frame.name);
    img.setOrigin(body.originX, body.originY).setScale(body.scaleX, body.scaleY).setFlipX(body.flipX).setPosition(body.x, body.y).setAlpha(0.7).setVisible(true);
  }

  hideAll(): void {
    for (const c of this.copies.values()) c.img.setVisible(false);
  }
}
