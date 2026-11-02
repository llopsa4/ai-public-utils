import Phaser from 'phaser';
import type { ActorId, DepthScale, Facing, Point, Pose } from '../engine/types';

const WALK_SPEED = 110; // logical pixels per second at scale 1
const BLINK_MIN = 1500;
const BLINK_MAX = 2500;
const BLINK_LENGTH = 150;

/** Visible body size per pose at scale 1 (used for hit testing and speech placement). */
const BODY: Record<Pose, { w: number; h: number }> = {
  stand: { w: 44, h: 114 },
  crouch: { w: 60, h: 100 },
  dead: { w: 116, h: 30 },
};

/**
 * A character on screen: pose/facing state machine, path walking and the idle blink.
 * Animation keys are `<sheet>:<tag>`, built from the sprite sheet's frame tags.
 */
export class Actor {
  readonly sprite: Phaser.GameObjects.Sprite;
  pose: Pose;
  face: Facing;
  private side: 'left' | 'right';
  private walking = false;
  private walkToken = 0;
  private tween: Phaser.Tweens.Tween | null = null;
  private finishStep: (() => void) | null = null;
  private blinkTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: ActorId,
    x: number,
    y: number,
    face: Facing,
    pose: Pose,
    private readonly depthScale: DepthScale,
  ) {
    this.sprite = scene.add.sprite(x, y, id).setOrigin(0.5, 1);
    this.face = face;
    this.side = face === 'left' ? 'left' : 'right';
    this.pose = pose;
    this.place();
    this.refresh();
    this.scheduleBlink();
    this.sprite.once(Phaser.GameObjects.Events.DESTROY, () => this.blinkTimer?.remove());
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
  }

  /** Walks along the waypoints. Resolves true when the end is reached, false if interrupted. */
  async walk(path: Point[]): Promise<boolean> {
    this.stop();
    const token = ++this.walkToken;
    if (path.length === 0) return true;
    if (this.pose !== 'stand') this.pose = 'stand';
    this.walking = true;
    for (const target of path) {
      const dx = target.x - this.sprite.x, dy = target.y - this.sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) continue;
      // Vertical movement reads as depth, so prefer side-on walking unless clearly going up/down.
      this.setFacing(Math.abs(dx) >= Math.abs(dy) * 0.8 ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
      const duration = (distance / (WALK_SPEED * this.sprite.scale)) * 1000;
      await new Promise<void>(resolve => {
        this.finishStep = resolve;
        this.tween = this.scene.tweens.add({
          targets: this.sprite, x: target.x, y: target.y, duration,
          onUpdate: () => this.place(),
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
    const s = this.sprite.scale;
    return new Phaser.Geom.Rectangle(this.sprite.x - (body.w * s) / 2, this.sprite.y - body.h * s, body.w * s, body.h * s);
  }

  /** Point just above the head, for speech text. */
  headPoint(): Point {
    return { x: this.sprite.x, y: this.sprite.y - (BODY[this.pose].h + 8) * this.sprite.scale };
  }

  private place(): void {
    const { farY, farScale, nearY, nearScale } = this.depthScale;
    const t = Phaser.Math.Clamp((this.sprite.y - farY) / (nearY - farY), 0, 1);
    this.sprite.setScale(farScale + (nearScale - farScale) * t);
    this.sprite.setDepth(this.sprite.y);
  }

  private direction(): 'down' | 'up' | 'side' {
    return this.face === 'left' || this.face === 'right' ? 'side' : this.face;
  }

  private refresh(): void {
    if (!this.sprite.active) return;
    if (this.walking) {
      this.play(`walk_${this.direction()}`, this.face === 'left');
    } else if (this.pose === 'stand') {
      this.play(`stand_${this.direction()}`, this.face === 'left');
    } else {
      // Crouching and lying down are drawn side-on: use the last horizontal facing.
      this.play(this.pose, this.side === 'left');
    }
  }

  private play(tag: string, flip: boolean): void {
    this.sprite.setFlipX(flip);
    const key = `${this.id}:${tag}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key);
  }

  /** Eyes close briefly at a random 1.5–2.5 s interval while standing still and visible from the front or side. */
  private scheduleBlink(): void {
    this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(BLINK_MIN, BLINK_MAX), () => {
      if (this.pose === 'stand' && !this.walking && this.face !== 'up' && this.sprite.active) {
        this.play(`blink_${this.direction()}`, this.face === 'left');
        this.scene.time.delayedCall(BLINK_LENGTH, () => {
          if (this.pose === 'stand' && !this.walking) this.refresh();
        });
      }
      if (this.sprite.active) this.scheduleBlink();
    });
  }
}
