import Phaser from 'phaser';
import { t } from '../engine/i18n';
import { settings } from '../engine/settings';
import type { RoomDef } from '../engine/types';
import { ART_SCALE } from '../ui/ui';

const FONT = '"Zilla Slab", Georgia, serif';

type SignDef = NonNullable<RoomDef['sign']>;

/**
 * Paints a room's name board into a canvas texture at art resolution: a weathered plank (or a
 * riveted iron shield-plate) hung from a hook by a rope V. Drawn in code, so no image download;
 * redrawn once the interface font has loaded.
 */
function paint(canvas: Phaser.Textures.CanvasTexture, def: SignDef, text: string): void {
  const k = ART_SCALE;
  const ctx = canvas.getContext();
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const top = def.drop * k, w = def.w * k, h = def.h * k, x0 = (W - w) / 2;
  const iron = def.style === 'iron';

  // Rope (or chain) from the hook to the board's upper corners.
  ctx.strokeStyle = iron ? '#3a3430' : '#5a4630';
  ctx.lineWidth = 2.2 * k / 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 3); ctx.lineTo(x0 + w * 0.18, top + 4);
  ctx.moveTo(W / 2, 3); ctx.lineTo(x0 + w * 0.82, top + 4);
  ctx.stroke();
  ctx.fillStyle = '#2a2420';
  ctx.beginPath(); ctx.arc(W / 2, 4, 3.2, 0, Math.PI * 2); ctx.fill();

  const shape = () => {
    ctx.beginPath();
    if (iron) {
      // A shield: flat top, straight sides, a point at the bottom.
      ctx.moveTo(x0, top);
      ctx.lineTo(x0 + w, top);
      ctx.lineTo(x0 + w, top + h * 0.55);
      ctx.quadraticCurveTo(x0 + w, top + h * 0.85, x0 + w / 2, top + h);
      ctx.quadraticCurveTo(x0, top + h * 0.85, x0, top + h * 0.55);
      ctx.closePath();
    } else {
      // A plank with slightly uneven ends.
      ctx.moveTo(x0 + 3, top);
      ctx.lineTo(x0 + w - 2, top + 2);
      ctx.lineTo(x0 + w, top + h - 3);
      ctx.lineTo(x0 + 2, top + h);
      ctx.closePath();
    }
  };
  shape();
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  if (iron) { g.addColorStop(0, '#6a5a4c'); g.addColorStop(0.5, '#4a3e36'); g.addColorStop(1, '#2e2622'); }
  else { g.addColorStop(0, '#8a6440'); g.addColorStop(0.55, '#6e4c2e'); g.addColorStop(1, '#4e3420'); }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Grain (wood) or rust streaks (iron).
  for (let i = 0; i < (iron ? 14 : 9); i++) {
    const y = top + ((i + 0.5) / (iron ? 14 : 9)) * h;
    ctx.strokeStyle = iron ? `rgba(150, 70, 30, ${0.12 + (i % 3) * 0.05})` : `rgba(40, 24, 12, ${0.18 + (i % 3) * 0.06})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (let x = 0; x <= w; x += 12) ctx.lineTo(x0 + x, y + Math.sin((x + i * 37) * 0.05) * 1.6);
    ctx.stroke();
  }
  ctx.restore();
  shape();
  ctx.strokeStyle = iron ? '#1e1814' : '#2e1c10';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Nails or rivets.
  ctx.fillStyle = iron ? '#a89070' : '#3a3632';
  const studs = iron
    ? [[0.1, 0.12], [0.9, 0.12], [0.1, 0.5], [0.9, 0.5], [0.5, 0.88]]
    : [[0.05, 0.3], [0.95, 0.3]];
  for (const [sx, sy] of studs) { ctx.beginPath(); ctx.arc(x0 + sx * w, top + sy * h, 2.4, 0, Math.PI * 2); ctx.fill(); }

  // The name, fitted to the board.
  let size = (iron ? 0.24 : 0.56) * h;
  ctx.font = `700 ${size}px ${FONT}`;
  const room = w * (iron ? 0.8 : 0.86);
  while (ctx.measureText(text).width > room && size > 8) { size -= 1; ctx.font = `700 ${size}px ${FONT}`; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ty = top + h * (iron ? 0.38 : 0.53);
  if (iron && ctx.measureText(text).width > room * 0.98) {
    // Two lines on the shield if one would be too small.
    const [a, ...rest] = text.split(' ');
    const lines = rest.length ? [a, rest.join(' ')] : [text];
    lines.forEach((line, i) => { carve(ctx, line, W / 2, ty + (i - (lines.length - 1) / 2) * size * 1.05, iron); });
  } else {
    carve(ctx, text, W / 2, ty, iron);
  }
  canvas.refresh();
}

/** Burnt-in letters on wood, embossed brass letters on iron. */
function carve(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, iron: boolean): void {
  ctx.fillStyle = iron ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 220, 170, 0.25)';
  ctx.fillText(text, x + 1, y + 1.5);
  ctx.fillStyle = iron ? '#e2c48a' : '#2a160c';
  ctx.fillText(text, x, y);
}

/**
 * A room's name board, hanging and swaying a little; it jolts when the kiln groans. Decoration
 * only: it is not a hotspot.
 */
export class RoomSign {
  readonly image: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, room: RoomDef) {
    const def = room.sign!;
    const key = `sign-${room.id}`;
    const text = t(`room.${room.id}`);
    if (!scene.textures.exists(key)) {
      const w = Math.ceil((def.w + 4) * ART_SCALE), h = Math.ceil((def.drop + def.h + 2) * ART_SCALE);
      const canvas = scene.textures.createCanvas(key, w, h)!;
      paint(canvas, def, text);
      // The interface font may still be loading: repaint once it is in.
      if (document.fonts && !document.fonts.check(`700 20px ${FONT}`)) {
        void document.fonts.load(`700 20px ${FONT}`).then(() => { if (scene.textures.exists(key)) paint(canvas, def, text); });
      }
    }
    this.image = scene.add.image(def.x, def.y, key).setOrigin(0.5, 0).setScale(1 / ART_SCALE).setDepth(def.depth ?? -8000);
    if (!settings().reducedMotion) this.sway();
  }

  private sway(): void {
    this.scene.tweens.add({ targets: this.image, angle: { from: -0.8, to: 0.8 }, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** A jolt when the kiln groans, settling back into the idle sway. */
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
