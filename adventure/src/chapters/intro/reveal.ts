// The Ashlands reveal, after Silas's intro (STORY: Sigrid's "Walk with me"): the camera pulls back
// from Ironhaven over a far view of the Ashlands, in four layers that move apart (parallax). On the
// music's hit "The Rift" appears big, then "Ashlands" fades in as the music settles into the warm
// score; then the chapter map. Any click or key skips it. Times come from the music (REVEAL_TIMING).
//
// Part of the intro's lazily loaded code, and importable in Node (the chapter's tests): it does not
// import Phaser or the pictures as modules. The game builds the scene with its Phaser
// (makeRevealScene, from session.playReveal); the pictures are URLs Vite resolves.
import type PhaserType from 'phaser';
import { REVEAL_TIMING } from '../../audio/music';
import { sound } from '../../audio/sound';
import { t } from '../../engine/i18n';
import { settings } from '../../engine/settings';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** Back to front, with how much each moves with the camera (0 still, 1 fully). */
const LAYERS = [
  { key: 'reveal-sky', follow: 0.15 },
  { key: 'reveal-mountains', follow: 0.4 },
  { key: 'reveal-plains', follow: 0.7 },
  { key: 'reveal-ridge', follow: 1 },
] as const;
// Written out per layer: Vite only resolves a literal new URL(...) path.
const URLS: Record<string, string> = {
  'reveal-sky': new URL('../../../art/src/intro/reveal/reveal-sky.webp', import.meta.url).href,
  'reveal-mountains': new URL('../../../art/src/intro/reveal/reveal-mountains.webp', import.meta.url).href,
  'reveal-plains': new URL('../../../art/src/intro/reveal/reveal-plains.webp', import.meta.url).href,
  'reveal-ridge': new URL('../../../art/src/intro/reveal/reveal-ridge.webp', import.meta.url).href,
};
/** Ironhaven on the ridge layer, in world units (the art is 2x): where the camera starts. */
const IRONHAVEN = { x: 152, y: 132 };
/** How close the camera starts on Ironhaven, and when the pull-back ends (just after the hit). */
const START_ZOOM = 2.4;
const PULL_BACK_S = REVEAL_TIMING.hit + 1.5;

export interface RevealData { done: () => void }
/** The game's world size and art scale (src/ui/ui.ts). */
export interface Stage { ART_SCALE: number; LOGICAL_W: number; LOGICAL_H: number }

export function makeRevealScene(Phaser: typeof PhaserType, { ART_SCALE, LOGICAL_W, LOGICAL_H }: Stage): typeof PhaserType.Scene {
return class RevealScene extends Phaser.Scene {
  private images: PhaserType.GameObjects.Image[] = [];
  private progress = { t: 0 };
  private timers: number[] = [];
  private finished = false;
  private done: () => void = () => {};
  private readonly skip = (e: Event) => {
    if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    this.finish(true);
  };

  constructor() { super('reveal'); }

  preload(): void {
    for (const l of LAYERS) if (!this.textures.exists(l.key)) this.load.image(l.key, URLS[l.key]);
  }

  create(data: RevealData): void {
    this.done = data.done;
    this.finished = false;
    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2).setBackgroundColor('#000000');
    this.images = LAYERS.map((l, i) => this.add.image(LOGICAL_W / 2, LOGICAL_H / 2, l.key).setDepth(i));
    const reduced = settings().reducedMotion || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.progress = { t: reduced ? 1 : 0 };
    this.layout();
    if (!reduced) this.tweens.add({ targets: this.progress, t: 1, duration: PULL_BACK_S * 1000, ease: 'Sine.easeInOut' });
    this.cameras.main.fadeIn(1400, 0, 0, 0);
    sound.music('reveal');

    // The title over the picture, timed to the music.
    const box = $('reveal'), title = $('reveal-title'), sub = $('reveal-sub'), hint = $('reveal-skip');
    const touch = globalThis.matchMedia?.('(pointer: coarse)').matches === true;
    title.textContent = t('ui.revealTitle');
    sub.textContent = t('ui.revealSub');
    hint.textContent = t(touch ? 'ui.revealSkipTap' : 'ui.revealSkip');
    box.classList.remove('title-in', 'sub-in', 'out', 'flash');
    box.hidden = false;
    // The game's bar (satchel, notebook, menu) steps aside for the cinematic.
    document.body.classList.add('in-reveal');
    const at = (s: number, run: () => void) => this.timers.push(window.setTimeout(run, s * 1000));
    // On the hit: a warm flash behind the letters, and the title lands from slightly larger.
    at(REVEAL_TIMING.hit, () => box.classList.add('title-in', 'flash'));
    at(REVEAL_TIMING.hit + 0.7, () => box.classList.remove('flash'));
    at(REVEAL_TIMING.subtitle, () => box.classList.add('sub-in'));
    at(REVEAL_TIMING.fadeOut, () => box.classList.add('out'));
    at(REVEAL_TIMING.end, () => this.finish(false));
    // Skipping: not on the very click that ended Sigrid's scene.
    at(0.6, () => { for (const kind of ['pointerdown', 'keydown'] as const) window.addEventListener(kind, this.skip, { capture: true }); });
  }

  update(): void {
    this.layout();
  }

  /** Each layer zoomed and shifted by how much it follows the camera, around Ironhaven. */
  private layout(): void {
    const p = this.progress.t, zoom = START_ZOOM + (1 - START_ZOOM) * p;
    const cx = LOGICAL_W / 2, cy = LOGICAL_H / 2;
    LAYERS.forEach((l, i) => {
      const scale = 1 + (zoom - 1) * l.follow;
      // The point on this layer at the screen's centre: Ironhaven at first, the middle at the end.
      const fx = cx + (IRONHAVEN.x - cx) * (1 - p) * l.follow, fy = cy + (IRONHAVEN.y - cy) * (1 - p) * l.follow;
      this.images[i].setScale(scale / ART_SCALE).setPosition(cx + (cx - fx) * scale, cy + (cy - fy) * scale);
    });
  }

  private finish(skipped: boolean): void {
    if (this.finished) return;
    this.finished = true;
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    for (const kind of ['pointerdown', 'keydown'] as const) window.removeEventListener(kind, this.skip, { capture: true });
    // Skipped: straight on to the warm music the cue would have ended on.
    if (skipped) sound.music('warm');
    const box = $('reveal');
    box.classList.add('out');
    this.cameras.main.fadeOut(skipped ? 300 : 900, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      box.hidden = true;
      document.body.classList.remove('in-reveal');
      box.classList.remove('title-in', 'sub-in', 'out');
      this.scene.stop();
      this.done();
    });
  }
};
}
