import Phaser from 'phaser';
import { t } from '../engine/i18n';
import { settings } from '../engine/settings';
import type { RoomDef } from '../engine/types';
import { ART_SCALE } from '../ui/ui';
import woodFace from '../../art/src/props/sign-wood.png';
import ironFace from '../../art/src/props/sign-iron.png';
import shieldFace from '../../art/src/props/sign-shield.png';
import { carvedWidth, carveLine } from './carvedLetters';

type SignDef = NonNullable<RoomDef['sign']>;
export const SIGN_IMAGES = { 'sign-art-wood': woodFace, 'sign-art-iron': ironFace, 'sign-art-shield': shieldFace };

/** Imported sign faces with runtime lettering, so room names stay legible and translatable. */
function paint(canvas: Phaser.Textures.CanvasTexture, def: SignDef, text: string, face: CanvasImageSource): void {
  const ctx = canvas.getContext(), k = ART_SCALE, W = canvas.width;
  ctx.clearRect(0, 0, W, canvas.height);
  const top = def.drop * k, w = def.w * k, h = def.h * k, x0 = (W - w) / 2;
  const iron = def.style === 'iron', shield = iron && h > w * 0.4;

  // Keep the established hook and hanging points above the imported blank face.
  ctx.strokeStyle = iron ? '#514236' : '#5a4630';
  ctx.lineWidth = 2;
  for (const end of [x0 + w * 0.18, x0 + w * 0.82]) {
    ctx.beginPath(); ctx.moveTo(W / 2, 3); ctx.lineTo(end, top + 4); ctx.stroke();
    if (iron) {
      const length = Math.hypot(end - W / 2, top + 1);
      for (let d = 4; d < length; d += 6) {
        const f = d / length;
        ctx.fillStyle = '#a08058';
        ctx.fillRect(Math.round(W / 2 + (end - W / 2) * f) - 1, Math.round(3 + (top + 1) * f), 2, 2);
      }
    }
  }
  ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(W / 2, 4, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(face, x0, top, w, h);

  // Fit the separate words before reducing the font on the Gallery's shield.
  const words = text.split(' ');
  const lines = shield && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text];
  const room = w * (shield ? 0.74 : 0.76);
  const unit = Math.min((shield ? 0.24 : 0.52) * h / 7, room / Math.max(...lines.map(carvedWidth)));
  const cy = top + h * (shield ? 0.43 : 0.52);
  lines.forEach((line, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * unit * 9;
    carveLine(ctx, line, W / 2, y, unit, iron);
  });
  canvas.refresh();
}

/** A room's illustrated name board, preserving its hook, scale, position and reduced-motion rules. */
export class RoomSign {
  readonly image: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, room: RoomDef) {
    const def = room.sign!, key = 'sign-' + room.id, text = t('room.' + room.id);
    const material = def.style === 'wood' ? 'sign-art-wood' : def.h > def.w * 0.4 ? 'sign-art-shield' : 'sign-art-iron';
    const face = scene.textures.get(material).getSourceImage() as HTMLImageElement;
    if (!scene.textures.exists(key)) {
      const canvas = scene.textures.createCanvas(key, Math.ceil((def.w + 4) * ART_SCALE), Math.ceil((def.drop + def.h + 2) * ART_SCALE))!;
      paint(canvas, def, text, face);
    }
    this.image = scene.add.image(def.x, def.y, key).setOrigin(0.5, 0).setScale(1 / ART_SCALE).setDepth(def.depth ?? -8000);
    this.image.setData({ material, label: text });
    if (!settings().reducedMotion) this.sway();
  }

  private sway(): void {
    this.scene.tweens.add({ targets: this.image, angle: { from: -0.8, to: 0.8 }, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** A kiln groan jolts the sign before it settles back to its idle sway. */
  jolt(): void {
    if (settings().reducedMotion) return;
    this.scene.tweens.killTweensOf(this.image);
    this.scene.tweens.chain({
      targets: this.image,
      tweens: [
        { angle: 4, duration: 180, ease: 'Sine.easeOut' },
        { angle: -3, duration: 420, ease: 'Sine.easeInOut' },
        { angle: 1.6, duration: 420, ease: 'Sine.easeInOut' },
        { angle: -0.8, duration: 400, ease: 'Sine.easeInOut' },
      ],
      onComplete: () => this.sway(),
    });
  }
}
