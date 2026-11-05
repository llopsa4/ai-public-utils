import Phaser from 'phaser';
import { conditionsHold } from '../engine/geometry';
import { settings } from '../engine/settings';
import type { GameState, PropDef, RoomDef } from '../engine/types';
import { ART_SCALE } from '../ui/ui';
import { highQuality } from './atmosphere';

/** Generated particle textures: a soft noisy puff (smoke, steam, dust) and a short ember streak. */
export function createParticleTextures(scene: Phaser.Scene): void {
  const puff = scene.textures.createCanvas('fx-puff', 32, 32);
  if (puff) {
    const ctx = puff.getContext();
    const img = ctx.createImageData(32, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 16;
      const n = 0.75 + 0.25 * Math.sin(x * 1.3 + Math.sin(y * 0.9) * 2) * Math.cos(y * 1.1);
      const o = (y * 32 + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(Math.max(0, 1 - d) ** 1.6 * n * 255);
    }
    ctx.putImageData(img, 0, 0);
    puff.refresh();
  }
  const ember = scene.textures.createCanvas('fx-ember', 4, 14);
  if (ember) {
    const ctx = ember.getContext();
    const g = ctx.createLinearGradient(0, 0, 0, 14);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 14);
    ember.refresh();
  }
}

/** Footstep puffs: colour, count and size per floor (none on metal grating). */
const STEP_DUST: Record<string, { tint: number; count: number; scale: number; alpha: number } | null> = {
  stone: { tint: 0xd8b898, count: 3, scale: 0.22, alpha: 0.22 },
  ash: { tint: 0xd8d0c4, count: 6, scale: 0.4, alpha: 0.6 },
  metal: null,
};

/**
 * The room's moving set pieces: the gauge needle, soup bubbles, the swinging hoist, lantern flames,
 * plus footstep dust and the sparks when the kiln groans. Presentation only: nothing here changes state.
 */
export class Props {
  private needles: { g: Phaser.GameObjects.Graphics; def: Extract<PropDef, { kind: 'gauge' }>; angle: number }[] = [];
  private swings = new Map<string, Phaser.GameObjects.Image>();
  private flames: { img: Phaser.GameObjects.Image; def: Extract<PropDef, { kind: 'flame' }> }[] = [];
  private emitters: { e: Phaser.GameObjects.Particles.ParticleEmitter; def: PropDef }[] = [];
  private steps: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private stepCount = 0;
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private readonly high: boolean;
  private readonly calm: boolean;

  constructor(private readonly scene: Phaser.Scene, room: RoomDef, private readonly state: () => GameState, private readonly cold: () => number) {
    this.high = highQuality(scene);
    this.calm = settings().reducedMotion;
    for (const def of room.props ?? []) this.build(def);
    const dust = STEP_DUST[room.surface ?? 'stone'];
    this.stepCount = dust ? (this.high ? dust.count : Math.ceil(dust.count / 2)) : 0;
    if (!this.calm && dust) {
      this.steps = scene.add.particles(0, 0, 'fx-puff', {
        emitting: false, lifespan: { min: 600, max: 1000 }, speedX: { min: -16, max: 16 }, speedY: { min: -12, max: -3 },
        scale: { start: dust.scale * 0.4, end: dust.scale }, alpha: { start: dust.alpha, end: 0 }, rotate: { min: 0, max: 360 }, tint: dust.tint,
      }).setDepth(9500);
    }
    if (!this.calm) {
      this.sparks = scene.add.particles(0, 0, this.high ? 'fx-ember' : 'fx-dot', {
        emitting: false, lifespan: { min: 500, max: 1100 }, speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 },
        gravityY: 120, scale: { start: this.high ? 0.6 : 0.2, end: 0 }, alpha: { start: 1, end: 0 },
        tint: [0xffd27a, 0xff9a3a, 0xff6a1a], blendMode: 'ADD', rotate: { onEmit: () => 0, onUpdate: (p: Phaser.GameObjects.Particles.Particle) => Phaser.Math.RadToDeg(Math.atan2(p.velocityY, p.velocityX)) - 90 },
      }).setDepth(9000);
    }
  }

  private visible(def: PropDef): boolean {
    return conditionsHold(this.state(), def.visibleIf) && !(def.warm && this.cold() >= 1);
  }

  /** A swinging prop's picture by its image name (for the hover outline), if this room has one. */
  image(name: string): Phaser.GameObjects.Image | undefined {
    return [...this.swings.values()].find(img => img.texture.key === `prop-${name}`);
  }

  private build(def: PropDef): void {
    const scene = this.scene;
    switch (def.kind) {
      case 'gauge': {
        scene.add.image(def.x, def.y, `prop-${def.image}`).setOrigin(0.5).setScale(1 / ART_SCALE).setDepth(-9000);
        const g = scene.add.graphics().setDepth(-8999);
        this.needles.push({ g, def, angle: def.angle });
        break;
      }
      case 'swing': {
        const img = scene.add.image(def.x, def.y, `prop-${def.image}`).setOrigin(def.pivotX, 0).setScale(1 / ART_SCALE).setDepth(def.depth ?? -9000);
        this.swings.set(def.hotspot, img);
        if (!this.calm) scene.tweens.add({ targets: img, angle: { from: -0.6, to: 0.6 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'bubbles': {
        if (this.calm) break;
        const e = scene.add.particles(def.x, def.y, 'fx-dot', {
          x: { min: 0, max: def.w }, y: { min: 0, max: def.h }, lifespan: { min: 300, max: 700 },
          scale: { start: 0.05, end: 0.16 }, alpha: { start: 0.9, end: 0 }, tint: def.color, frequency: this.high ? 110 : 260,
        }).setDepth(def.y + 1);
        this.emitters.push({ e, def });
        break;
      }
      case 'flame': {
        const img = scene.add.image(def.x, def.y, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(def.color)
          .setDisplaySize(def.size * 0.7, def.size).setDepth(def.depth ?? 9000);
        this.flames.push({ img, def });
        break;
      }
    }
  }

  /** Per frame: needle jitter, flame flicker, visibility of warm props as the kiln cools. */
  update(time: number): void {
    const cold = this.cold();
    for (const n of this.needles) {
      // Near the red and shivering while the kiln runs; settling to rest as it goes cold.
      const shiver = this.calm ? 0 : Math.sin(time / 37) * 1.6 + Math.sin(time / 91) * 2.4 + Math.sin(time / 13) * 0.6;
      const target = n.def.angle + (n.def.rest - n.def.angle) * cold + shiver * (1 - cold);
      n.angle += (target - n.angle) * 0.2;
      const a = Phaser.Math.DegToRad(n.angle - 90);
      const { x, y, length } = n.def;
      n.g.clear()
        .lineStyle(1.1, 0x24140e, 1).lineBetween(x - Math.cos(a) * length * 0.3, y - Math.sin(a) * length * 0.3, x + Math.cos(a) * length, y + Math.sin(a) * length)
        .fillStyle(0x3a2418, 1).fillCircle(x, y, 1.6);
    }
    for (const f of this.flames) {
      const on = this.visible(f.def);
      f.img.setVisible(on);
      if (!on) continue;
      const flicker = this.calm ? 1 : 0.85 + Math.sin(time / 53) * 0.07 + Math.sin(time / 21) * 0.06 + Math.random() * 0.05;
      f.img.setAlpha(0.75 * flicker).setDisplaySize(f.def.size * 0.7 * flicker, f.def.size * (0.9 + 0.2 * flicker));
    }
    for (const { e, def } of this.emitters) {
      const on = this.visible(def);
      if (on && !e.emitting) e.start(); else if (!on && e.emitting) e.stop();
    }
  }

  /** A hoist pot (or similar) swings when used, then settles back into its idle sway. */
  swing(hotspot: string): void {
    const img = this.swings.get(hotspot);
    if (!img || this.calm) return;
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.chain({
      targets: img,
      tweens: [
        { angle: 3.2, duration: 320, ease: 'Sine.easeOut' },
        { angle: -2.4, duration: 600, ease: 'Sine.easeInOut' },
        { angle: 1.4, duration: 560, ease: 'Sine.easeInOut' },
        { angle: -0.6, duration: 520, ease: 'Sine.easeInOut' },
      ],
      onComplete: () => { this.scene.tweens.add({ targets: img, angle: { from: -0.6, to: 0.6 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); },
    });
  }

  /** Dust kicked up by a footstep (set up per floor type when the room starts). */
  step(x: number, y: number): void {
    this.steps?.explode(this.stepCount, x, y - 1);
  }

  /** Sparks burst from the kiln's glows when it groans. */
  burst(points: { x: number; y: number }[]): void {
    if (!this.sparks) return;
    for (const p of points) this.sparks.explode(this.high ? 14 : 6, p.x, p.y);
  }
}
