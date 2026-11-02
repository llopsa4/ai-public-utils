import Phaser from 'phaser';
import { COLD_GRADE, NEUTRAL_GRADE, gradeMatrix, lerpGrade } from '../engine/lighting';
import { settings } from '../engine/settings';
import type { Polygon, RoomDef } from '../engine/types';
import { ART_SCALE } from '../ui/ui';

/** True when shader effects are wanted and possible (WebGL, High quality). */
export function highQuality(scene: Phaser.Scene): boolean {
  return settings().visualQuality === 'high' && scene.game.renderer.type === Phaser.WEBGL;
}

/** Generated textures for the atmosphere: displacement noise, light beams. Called once from BootScene. */
export function createAtmosphereTextures(scene: Phaser.Scene): void {
  // Three smooth noise fields for the heat haze; cycling them makes the shimmer "boil".
  for (let n = 0; n < 3; n++) {
    const tex = scene.textures.createCanvas(`fx-noise${n}`, 64, 64);
    if (!tex) continue;
    const ctx = tex.getContext();
    const img = ctx.createImageData(64, 64);
    const seed = n * 17.3;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const v = (Math.sin(x * 0.35 + seed) + Math.sin(y * 0.52 + seed * 1.7) + Math.sin((x + y) * 0.21 + seed * 0.6)) / 6 + 0.5;
      const o = (y * 64 + x) * 4;
      img.data[o] = img.data[o + 1] = Math.round(v * 255);
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }
  // A soft beam: bright at the top, fading along its length and toward its edges.
  const beam = scene.textures.createCanvas('fx-beam', 64, 256);
  if (beam) {
    const ctx = beam.getContext();
    const img = ctx.createImageData(64, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
      const across = Math.exp(-(((x - 31.5) / 18) ** 2));
      const along = (1 - y / 256) ** 1.4 * Math.min(1, y / 20);
      const o = (y * 64 + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(across * along * 255);
    }
    ctx.putImageData(img, 0, 0);
    beam.refresh();
  }
}

const COLD_FADE_MS = 3000;

/**
 * A room's light and air on High quality: camera colour grade (tweened to the cold grade when the
 * kiln shuts down), vignette, heat haze, light shafts and floor reflections. On Low, nothing here
 * runs; the scene's tint path covers the cold.
 */
export class Atmosphere {
  private grade: Phaser.FX.ColorMatrix | null = null;
  private haze: Phaser.GameObjects.Image[] = [];
  private shafts: Phaser.GameObjects.Image[] = [];
  private reflections = new Map<Phaser.GameObjects.Sprite, Phaser.GameObjects.Sprite>();
  private reflectionMask: Phaser.Display.Masks.GeometryMask | null = null;
  private timers: Phaser.Time.TimerEvent[] = [];
  /** 0 = warm, 1 = cold; tweened on the shutdown. */
  cold = 0;
  readonly enabled: boolean;

  constructor(private readonly scene: Phaser.Scene, private readonly room: RoomDef, cold: boolean) {
    this.enabled = highQuality(scene);
    this.cold = cold ? 1 : 0;
    if (!this.enabled) return;
    const look = this.room.look ?? {};
    const camera = scene.cameras.main;
    camera.postFX.clear();
    this.grade = camera.postFX.addColorMatrix();
    camera.postFX.addVignette(0.5, 0.5, 0.82, look.vignette ?? 0.3);
    this.applyGrade();
    if (!settings().reducedMotion) this.buildHaze();
    this.buildShafts();
    if (look.reflective) this.buildReflectionMask(look.reflective.polygon);
  }

  /** Switches to the cold look, over three seconds when it happens in front of the player. */
  setCold(cold: boolean, animate: boolean): void {
    const target = cold ? 1 : 0;
    if (target === this.cold) return;
    if (!animate) { this.cold = target; this.onColdChanged(); return; }
    this.scene.tweens.addCounter({
      from: this.cold, to: target, duration: COLD_FADE_MS, ease: 'Sine.easeInOut',
      onUpdate: t => { this.cold = t.getValue() ?? target; this.onColdChanged(); },
    });
  }

  private onColdChanged(): void {
    this.applyGrade();
    for (const h of this.haze) h.setAlpha(0.75 * (1 - this.cold));
    for (const s of this.shafts) s.setData('base', 1 - this.cold * 0.7);
  }

  private applyGrade(): void {
    if (!this.grade) return;
    const look = this.room.look ?? {};
    const warm = look.grade ?? NEUTRAL_GRADE;
    const cold = look.coldGrade ?? COLD_GRADE;
    this.grade.set(gradeMatrix(lerpGrade(warm, cold, this.room.coldIf ? this.cold : 0)));
  }

  /** Copies of the hot regions of the background, displaced by drifting noise. */
  private buildHaze(): void {
    const scene = this.scene;
    const bg = scene.textures.get(this.room.background);
    (this.room.look?.haze ?? []).forEach((h, i) => {
      const frame = `haze-${i}`;
      if (!bg.has(frame)) bg.add(frame, 0, h.x * ART_SCALE, h.y * ART_SCALE, h.w * ART_SCALE, h.h * ART_SCALE);
      const img = scene.add.image(h.x, h.y, this.room.background, frame).setOrigin(0, 0).setScale(1 / ART_SCALE).setDepth(-9990);
      img.setAlpha(0.75 * (1 - this.cold));
      const fx = img.preFX?.addDisplacement('fx-noise0', 0.004, 0.006);
      if (!fx) { img.destroy(); return; }
      scene.tweens.add({ targets: fx, x: { from: -0.005, to: 0.005 }, y: { from: 0.008, to: 0.002 }, duration: 900 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      let n = 0;
      this.timers.push(scene.time.addEvent({ delay: 160, loop: true, callback: () => fx.setTexture(`fx-noise${++n % 3}`) }));
      this.haze.push(img);
    });
  }

  private buildShafts(): void {
    const scene = this.scene;
    for (const s of this.room.look?.shafts ?? []) {
      const beam = scene.add.image(s.x, s.y, 'fx-beam').setOrigin(0.5, 0).setDisplaySize(s.width, s.length)
        .setAngle(s.angle).setTint(s.color).setBlendMode(Phaser.BlendModes.ADD).setDepth(8000).setData('base', 1 - this.cold * 0.7);
      beam.setAlpha(0.22 * beam.getData('base'));
      if (!settings().reducedMotion) {
        scene.tweens.addCounter({
          from: 0, to: Math.PI * 2, duration: Phaser.Math.Between(5000, 8000), repeat: -1,
          onUpdate: t => {
            const v = t.getValue() ?? 0;
            beam.setAlpha((0.2 + 0.06 * Math.sin(v)) * (beam.getData('base') as number));
            beam.setAngle(s.angle + Math.sin(v * 0.5) * 1.5);
          },
        });
      }
      this.shafts.push(beam);
    }
  }

  private buildReflectionMask(polygon: Polygon): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillPoints(polygon as Phaser.Types.Math.Vector2Like[], true);
    this.reflectionMask = g.createGeometryMask();
  }

  /** Mirrors each character on the wet floor: same frame, flipped below the feet, wobbling slightly. */
  updateReflections(sprites: Phaser.GameObjects.Sprite[], time: number): void {
    const look = this.room.look?.reflective;
    if (!this.reflectionMask || !look) return;
    for (const sprite of sprites) {
      let mirror = this.reflections.get(sprite);
      if (!mirror) {
        // Anchored at the feet like the character; a negative y scale flips it down onto the floor.
        mirror = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key).setOrigin(0.5, 1).setDepth(-4500).setMask(this.reflectionMask);
        this.reflections.set(sprite, mirror);
        sprite.once(Phaser.GameObjects.Events.DESTROY, () => { mirror?.destroy(); this.reflections.delete(sprite); });
      }
      if (mirror.texture.key !== sprite.texture.key) mirror.setTexture(sprite.texture.key);
      mirror.setFrame(sprite.frame.name);
      const wobble = settings().reducedMotion ? 0 : Math.sin(time / 420 + sprite.x * 0.05) * 0.03;
      mirror.setPosition(sprite.x, sprite.y - 1).setScale(sprite.scaleX, -sprite.scaleY * (0.86 + wobble))
        .setFlipX(sprite.flipX).setTint(sprite.tintTopLeft).setAlpha(look.alpha * (sprite.visible ? 1 : 0));
    }
  }

  destroy(): void {
    for (const t of this.timers) t.remove();
    this.timers = [];
  }
}
