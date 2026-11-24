import Phaser from 'phaser';
import view from '../data/view.json';
import { type Bounds, clampCenter, edgeDirection, panVector, pointerInside, snapZoom, stepZoom, wheelSteps, zoomAtCursor } from '../render/camera';
import { uiImageUrl } from '../render/atlas';
import { cursorCss } from '../render/ui';
import { keysOf } from '../sim/keymap';
import { liveKeys, options } from '../sim/options';

const CAM = view.camera;
const DRAG_PX = 6; // below this a left press is a click, not a box

/** What a scene does with the pointer; the controller only decides which of these a gesture is. */
export interface ViewHooks {
  /** World size in pixels (the camera never leaves it). */
  bounds: () => Bounds;
  /** The pointer is over a HUD control: the world below ignores it. */
  blocked: (p: Phaser.Input.Pointer) => boolean;
  onLeft: (p: Phaser.Input.Pointer) => void;
  onRight: (p: Phaser.Input.Pointer) => void;
  onBox: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
}

/**
 * The input and camera every playable scene shares (DESIGN §1, §3): pan keys and edge scroll, wheel zoom
 * in fixed steps around the cursor, and the left-press gesture (click or drag box). Scenes pass hooks and
 * call `update` once a frame; they keep their own orders and keys.
 */
export class ViewInput {
  centre: [number, number] = [0, 0];
  /** Where a left press began while it may still become a click or a box; null otherwise. */
  dragFrom: { x: number; y: number } | null = null;
  private readonly pan = new Map<string, Phaser.Input.Keyboard.Key>(); // made when a key is first polled, so a rebind needs no setup
  private readonly box: Phaser.GameObjects.Graphics;
  private outside = false; // the pointer left the canvas, so its last position says nothing
  private wheelAcc = 0;
  private wheelAt = 0;
  private glide: { from: [number, number]; to: [number, number]; t: number; ms: number } | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly hooks: ViewHooks) {
    this.box = scene.add.graphics().setScrollFactor(0).setDepth(900);
    const input = scene.input;
    input.on(Phaser.Input.Events.GAME_OUT, () => (this.outside = true));
    input.on(Phaser.Input.Events.GAME_OVER, () => (this.outside = false));
    // Phaser's own 'wheel' event fires at most once per frame and would drop touchpad deltas: use the DOM events.
    const canvas = scene.game.canvas;
    const onWheel = (e: WheelEvent): void => this.wheel(e);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => canvas.removeEventListener('wheel', onWheel));
    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.outside = false;
      if (hooks.blocked(p)) return;
      if (p.rightButtonDown()) hooks.onRight(p);
      else this.dragFrom = { x: p.x, y: p.y };
    });
    input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonReleased() || !this.dragFrom) return;
      const from = this.dragFrom;
      this.dragFrom = null;
      this.box.clear();
      if (hooks.blocked(p)) return;
      if (Math.hypot(p.x - from.x, p.y - from.y) < DRAG_PX) hooks.onLeft(p);
      else hooks.onBox(from, p);
    });
  }

  /** Sets the canvas's CSS cursor (a scene calls it once a frame with what a left click would do, `render/click.ts`). */
  setCursor(css: string): void {
    const canvas = this.scene.game.canvas;
    const value = cursorCss(css, uiImageUrl); // the painted cursor once its art is final, else the plain CSS one
    if (canvas.style.cursor !== value) canvas.style.cursor = value;
  }

  /** Puts the camera at the start zoom, centred on a world point. Call at the end of the scene's `create`. */
  start(cx: number, cy: number): void {
    const cam = this.scene.cameras.main;
    cam.setBackgroundColor('#141614');
    cam.roundPixels = true;
    cam.setZoom(snapZoom(CAM.zoomStart, CAM.zoomSteps));
    this.centreOn(cx, cy);
  }

  centreOn(cx: number, cy: number): void {
    this.glide = null;
    this.put(cx, cy);
  }

  private put(cx: number, cy: number): void {
    this.centre = clampCenter(cx, cy, this.hooks.bounds());
    this.scene.cameras.main.centerOn(...this.centre);
  }

  /** Slides the camera to a world point over `ms` (the jump key, the herd's arrival); a pan key or `centreOn` stops it. */
  glideTo(cx: number, cy: number, ms = 600): void {
    this.glide = { from: [...this.centre], to: clampCenter(cx, cy, this.hooks.bounds()), t: 0, ms };
  }

  private wheel(e: WheelEvent): void {
    if (!this.scene.scene.isActive()) return; // paused under a dialogue: the view stays put
    const cam = this.scene.cameras.main;
    const p = this.scene.input.activePointer;
    if (e.timeStamp - this.wheelAt > CAM.wheelResetMs) this.wheelAcc = 0; // old touchpad leftovers do not count
    this.wheelAt = e.timeStamp;
    const [acc, steps] = wheelSteps(this.wheelAcc, e.deltaY, e.deltaMode, CAM.wheelPx);
    this.wheelAcc = acc;
    for (let i = 0; i < Math.abs(steps); i++) {
      const z = stepZoom(cam.zoom, steps, CAM.zoomSteps);
      if (z === cam.zoom) break;
      this.centre = clampCenter(...zoomAtCursor(this.centre[0], this.centre[1], cam.zoom, p.x, p.y, cam.width, cam.height, z), this.hooks.bounds());
      cam.setZoom(z);
      cam.centerOn(...this.centre);
    }
  }

  /** Pans by keys or the screen edge and draws the drag box. Call at the start of the scene's `update`. */
  update(dt: number): void {
    const cam = this.scene.cameras.main;
    const bound = liveKeys();
    const down = (action: 'panUp' | 'panDown' | 'panLeft' | 'panRight'): boolean =>
      keysOf(bound, action).some((n) => {
        let key = this.pan.get(n);
        if (!key) this.pan.set(n, (key = this.scene.input.keyboard!.addKey(n)));
        return key.isDown;
      });
    let dx = (down('panRight') ? 1 : 0) - (down('panLeft') ? 1 : 0);
    let dy = (down('panDown') ? 1 : 0) - (down('panUp') ? 1 : 0);
    const p = this.scene.input.activePointer;
    if (
      dx === 0 && dy === 0 && options().edgeScroll && !this.dragFrom && !this.outside &&
      this.scene.game.input.mouse?.locked !== true && pointerInside(p.x, p.y, cam.width, cam.height) &&
      p.x > 0 && p.y > 0 && !this.hooks.blocked(p)
    ) {
      [dx, dy] = edgeDirection(p.x, p.y, cam.width, cam.height, CAM.edgePx);
    }
    const [mx, my] = panVector(dx, dy, dt, cam.zoom, CAM.panPxPerSec);
    if (mx || my) this.centreOn(this.centre[0] + mx, this.centre[1] + my);
    else if (this.glide) {
      const g = this.glide;
      g.t += dt;
      const k = Math.min(1, g.t / g.ms);
      const e = k * k * (3 - 2 * k); // smoothstep
      this.put(g.from[0] + (g.to[0] - g.from[0]) * e, g.from[1] + (g.to[1] - g.from[1]) * e);
      if (k >= 1) this.glide = null;
    }

    this.box.clear();
    const f = this.dragFrom;
    if (f && p.isDown && Math.hypot(p.x - f.x, p.y - f.y) >= DRAG_PX) {
      this.box.fillStyle(0xe8e6de, 0.12).fillRect(f.x, f.y, p.x - f.x, p.y - f.y);
      this.box.lineStyle(1, 0xe8e6de, 0.8).strokeRect(f.x, f.y, p.x - f.x, p.y - f.y);
    }
  }
}
