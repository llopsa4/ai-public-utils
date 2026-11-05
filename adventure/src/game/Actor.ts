import Phaser from 'phaser';
import type { DepthScale, Facing, Point, Pose, Speaker } from '../engine/types';
import { SHEETS } from './assets';
import { walkFrameAt, walkTiming } from './walk';

const WALK_SPEED = 110; // logical pixels per second at scale 1
const BLINK_MIN = 1500;
const BLINK_MAX = 2500;
const BLINK_LENGTH = 150;
/** Art is drawn at 2x the world: sprites are shown at half size. */
const ART_SCALE = 2;
/** Contact shadows sit on the floor: above the background, below everything standing on it. */
export const SHADOW_DEPTH = -4000;
const SHADOW_ALPHA = 0.5;

/** Visible body size per pose in world units at depth scale 1 (hit testing and speech placement). */
const BODY: Record<Pose, { w: number; h: number }> = {
  stand: { w: 62, h: 116 },
  crouch: { w: 70, h: 96 },
  dead: { w: 116, h: 64 },
};

/**
 * A character on screen: pose/facing state machine, path walking and the idle blink.
 * Animation keys are `<sheet>:<tag>`, built from the sprite sheet's frame tags.
 */
export class Actor {
  readonly sprite: Phaser.GameObjects.Sprite;
  /** Soft ellipse under the feet (the 'fx-shadow' texture made in BootScene). */
  private readonly shadow: Phaser.GameObjects.Image | null;
  pose: Pose;
  face: Facing;
  private side: 'left' | 'right';
  private walking = false;
  private walkToken = 0;
  private tween: Phaser.Tweens.Tween | null = null;
  private finishStep: (() => void) | null = null;
  private blinkTimer: Phaser.Time.TimerEvent | null = null;
  private sheet: string;
  private strideDistance = 0;
  private walkFrame = -1;
  /** Called on each footstep (used for sound). */
  onStep: (() => void) | null = null;
  /** Busy with a gesture (fidget) that should not be interrupted by the idle refresh. */
  private gesturing = false;
  /** Perspective scale for the current y (1 = full size). */
  private depth = 1;
  /** Walking speed relative to Mara's (background people hurry or dawdle). */
  speed = 1;
  /** Hit box width relative to the body (background people are narrower targets). */
  hitWidth = 1;
  /** A task tag held instead of the standing frame (background people at work), or null. */
  private task: string | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: Speaker,
    sheet: string,
    x: number,
    y: number,
    face: Facing,
    pose: Pose,
    private readonly depthScale: DepthScale,
    /** Body size relative to an adult (children are smaller), for hit boxes and speech placement. */
    private readonly bodyScale = 1,
  ) {
    this.sheet = sheet;
    this.sprite = scene.add.sprite(x, y, sheet).setOrigin(0.5, 1);
    this.shadow = scene.textures.exists('fx-shadow')
      ? scene.add.image(x, y, 'fx-shadow').setAlpha(SHADOW_ALPHA).setDepth(SHADOW_DEPTH)
      : null;
    this.face = face;
    this.side = face === 'left' ? 'left' : 'right';
    this.pose = pose;
    this.place();
    this.refresh();
    this.scheduleBlink();
    this.sprite.once(Phaser.GameObjects.Events.DESTROY, () => { this.blinkTimer?.remove(); this.shadow?.destroy(); });
  }

  get position(): Point {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  get isWalking(): boolean {
    return this.walking;
  }

  setFacing(face: Facing): void {
    this.face = face;
    if (face === 'left' || face === 'right') this.side = face;
    this.refresh();
  }

  setPose(pose: Pose): void {
    this.pose = pose;
    this.refresh();
    this.placeShadow();
  }

  /** Swaps the sprite sheet (e.g. Mara with or without the gauntlet), keeping pose and facing. */
  setSheet(sheet: string): void {
    if (sheet === this.sheet) return;
    this.sheet = sheet;
    this.sprite.anims.stop();
    this.sprite.setTexture(sheet);
    this.refresh();
  }

  /** Walks along the waypoints. Resolves true when the end is reached, false if interrupted. */
  async walk(path: Point[]): Promise<boolean> {
    this.stop();
    const token = ++this.walkToken;
    if (path.length === 0) return true;
    if (this.pose !== 'stand') this.pose = 'stand';
    this.task = null;
    this.walking = true;
    for (const target of path) {
      const dx = target.x - this.sprite.x, dy = target.y - this.sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) continue;
      // Vertical movement reads as depth, so prefer side-on walking unless clearly going up/down.
      this.setFacing(Math.abs(dx) >= Math.abs(dy) * 0.8 ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
      const duration = (distance / (WALK_SPEED * this.speed * this.depth)) * 1000;
      let last = { x: this.sprite.x, y: this.sprite.y };
      await new Promise<void>(resolve => {
        this.finishStep = resolve;
        this.tween = this.scene.tweens.add({
          targets: this.sprite, x: target.x, y: target.y, duration,
          onUpdate: () => {
            this.place();
            this.advanceStride(Math.hypot(this.sprite.x - last.x, this.sprite.y - last.y));
            last = { x: this.sprite.x, y: this.sprite.y };
          },
          onComplete: () => resolve(),
        });
      });
      if (token !== this.walkToken) return false;
    }
    this.tween = null;
    this.finishStep = null;
    this.walking = false;
    this.refresh();
    return true;
  }

  /** Stops walking where the actor stands. */
  stop(): void {
    if (!this.walking) return;
    this.walkToken++;
    this.tween?.stop();
    this.tween = null;
    const finish = this.finishStep;
    this.finishStep = null;
    this.walking = false;
    finish?.();
    this.refresh();
  }

  /** Screen-space hit box around the visible body for the current pose. */
  hitBox(): Phaser.Geom.Rectangle {
    const body = BODY[this.pose];
    const s = this.depth * this.bodyScale;
    const w = body.w * s * this.hitWidth;
    return new Phaser.Geom.Rectangle(this.sprite.x - w / 2, this.sprite.y - body.h * s, w, body.h * s);
  }

  /** Point just above the head, for speech text. */
  headPoint(): Point {
    return { x: this.sprite.x, y: this.sprite.y - (BODY[this.pose].h * this.bodyScale + 8) * this.depth };
  }

  private place(): void {
    const { farY, farScale, nearY, nearScale } = this.depthScale;
    const t = Phaser.Math.Clamp((this.sprite.y - farY) / (nearY - farY), 0, 1);
    this.depth = farScale + (nearScale - farScale) * t;
    this.sprite.setScale(this.depth / ART_SCALE);
    this.sprite.setDepth(this.sprite.y);
    this.placeShadow();
  }

  /** The shadow follows the feet and the pose: a wide pool when lying down, a small one standing. */
  private placeShadow(): void {
    if (!this.shadow) return;
    const body = BODY[this.pose];
    const w = (this.pose === 'dead' ? body.w * 1.05 : body.w * 0.82) * this.depth * this.bodyScale;
    const h = (this.pose === 'dead' ? 16 : 11) * this.depth * this.bodyScale;
    this.shadow.setPosition(this.sprite.x, this.sprite.y - h * 0.15).setDisplaySize(w, h);
  }

  private direction(): 'down' | 'up' | 'side' {
    return this.face === 'left' || this.face === 'right' ? 'side' : this.face;
  }

  /** Walk frames follow the distance covered, so each step matches the ground travelled. */
  private advanceStride(moved: number): void {
    const anim = this.scene.anims.get(`${this.sheet}:walk_${this.direction()}`);
    if (!anim) return;
    this.strideDistance += moved / Math.max(0.2, this.depth);
    const timing = walkTiming(SHEETS[this.sheet]?.json.meta.walk);
    const frame = walkFrameAt(this.strideDistance, anim.frames.length, timing);
    if (frame === this.walkFrame) return;
    this.walkFrame = frame;
    this.sprite.setFrame(anim.frames[frame].frame.name);
    if (timing.plantFrames.includes(frame)) this.onStep?.();
  }

  /** Perspective scale at the current position. */
  get perspective(): number {
    return this.depth;
  }

  /** Holds a task tag (work, carry, reach, sit...) while standing; null goes back to standing. */
  perform(tag: string | null): void {
    if (this.walking) return;
    this.task = tag && this.scene.anims.exists(`${this.sheet}:${tag}`) ? tag : null;
    this.refresh();
  }

  get currentTask(): string | null {
    return this.task;
  }

  /** Turns to look at a point (only while standing still and idle). */
  lookAt(x: number): void {
    if (this.walking || this.pose !== 'stand' || this.gesturing || this.task) return;
    const face = x < this.sprite.x ? 'left' : 'right';
    if (face !== this.face) this.setFacing(face);
  }

  /** Plays the idle gesture (fidget frame) for a moment, if the sheet has one. */
  fidget(ms = 1300): void {
    if (this.walking || this.pose !== 'stand' || this.gesturing || !this.scene.anims.exists(`${this.sheet}:fidget`)) return;
    this.gesturing = true;
    this.play('fidget', this.face === 'left');
    this.scene.time.delayedCall(ms, () => { this.gesturing = false; if (this.sprite.active) this.refresh(); });
  }

  private refresh(): void {
    if (!this.sprite.active) return;
    if (this.walking) {
      this.sprite.anims.stop();
      this.sprite.setFlipX(this.face === 'left');
      this.walkFrame = -1;
      this.advanceStride(0);
    } else if (this.gesturing) {
      return;
    } else if (this.task) {
      this.play(this.task, this.face === 'left');
    } else if (this.pose === 'stand') {
      this.play(`stand_${this.direction()}`, this.face === 'left');
    } else {
      // Crouching and lying down are drawn side-on: use the last horizontal facing.
      this.play(this.pose, this.side === 'left');
    }
  }

  private play(tag: string, flip: boolean): void {
    this.sprite.setFlipX(flip);
    const key = `${this.sheet}:${tag}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key);
  }

  /** Eyes close briefly at a random 1.5–2.5 s interval while standing still and visible from the front or side. */
  private scheduleBlink(): void {
    this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(BLINK_MIN, BLINK_MAX), () => {
      if (this.pose === 'stand' && !this.walking && !this.gesturing && !this.task && this.face !== 'up' && this.sprite.active) {
        this.play(`blink_${this.direction()}`, this.face === 'left');
        this.scene.time.delayedCall(BLINK_LENGTH, () => {
          if (this.pose === 'stand' && !this.walking && !this.gesturing && !this.task) this.refresh();
        });
      }
      if (this.sprite.active) this.scheduleBlink();
    });
  }
}
