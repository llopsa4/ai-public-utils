// A small hover tooltip for labels (DESIGN-upgrades-3.md `## Labels (Dakota)`): when a label shows a Dakota
// word, hovering it shows the English. One tooltip per scene, drawn above its other objects.
import Phaser from 'phaser';

export interface Hover {
  /** Shows `text` next to the pointer while `target` is hovered; `text()` may return null for no tip. */
  attach(target: Phaser.GameObjects.GameObject, text: () => string | null): void;
  /** The tooltip text now shown, or null. */
  shown(): string | null;
  /** Call every frame: drops the tip when its target was hidden under the pointer. */
  update(): void;
}

export function createHover(scene: Phaser.Scene): Hover {
  const box = scene.add.rectangle(0, 0, 10, 10, 0x1d1a16, 0.96).setOrigin(0).setStrokeStyle(1, 0x6b5a3a).setDepth(30).setVisible(false);
  const label = scene.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '12px', color: '#f3e9d2' }).setDepth(31).setVisible(false);
  let owner: Phaser.GameObjects.GameObject | null = null;
  const hide = (): void => {
    owner = null;
    box.setVisible(false);
    label.setVisible(false);
  };
  const place = (p: Phaser.Input.Pointer): void => {
    const w = label.width + 12;
    const h = label.height + 8;
    const x = Math.min(1280 - w - 4, p.x + 14);
    const y = p.y + 22 + h > 716 ? p.y - h - 8 : p.y + 22;
    box.setPosition(x, y).setSize(w, h);
    label.setPosition(x + 6, y + 4);
  };
  return {
    attach(target, text) {
      if (!target.input) target.setInteractive();
      target.on('pointerover', (p: Phaser.Input.Pointer) => {
        const t = text();
        if (!t) return;
        owner = target;
        label.setText(t);
        box.setVisible(true);
        label.setVisible(true);
        place(p);
      });
      target.on('pointermove', (p: Phaser.Input.Pointer) => owner === target && place(p));
      target.on('pointerout', () => owner === target && hide());
    },
    shown: () => (box.visible ? label.text : null),
    update() {
      if (owner && !(owner as unknown as Phaser.GameObjects.Components.Visible).visible) hide();
    },
  };
}
