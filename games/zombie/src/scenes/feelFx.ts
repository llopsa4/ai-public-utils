import Phaser from 'phaser';
import {
  type Alert,
  FLASH_MS,
  type FxEvent,
  HERD_FLASH_MS,
  HERD_FLASH_PEAK,
  type Insets,
  MAX_ARROWS,
  POP_MS,
  POP_RISE,
  SHAKE,
  type Watched,
  alertAlpha,
  edgeArrow,
  liveAlerts,
  newWatch,
  observe,
  pickJump,
  popColor,
  touchAlert,
  worldToScreen,
} from '../render/fx';
import { ambience } from '../audio/ambience';
import { audio } from '../audio/engine';
import { moodOf } from '../audio/mood';
import { REACH, newSoundWatch, soundEvents } from '../audio/events';
import { spatial } from '../audio/space';
import { tileToWorld } from '../render/iso';
import type { UnitSprite } from '../render/units';
import type { Trap } from '../sim/traps';
import { options } from '../sim/options';
import { barH } from './ActionBar';
import type { ViewInput } from './input';
import { ui } from './uiScale';

const FONT = 'Georgia, "Times New Roman", serif';
const FLASH_TINT = 0xffffff;
const ARROW_LIFT = 24; // world px above the feet: where an alert points on a figure
const OFFSCREEN_PAD = 32; // a shake or pop this near the screen counts as seen

/** What the overlay draws, published each frame (registry `fx_alerts`, `fx_flash`). */
export interface ArrowModel {
  x: number;
  y: number;
  angle: number;
  label: string;
  newest: boolean; // the arrow the jump key goes to first
  alpha: number;
}
export interface FlashModel {
  color: number;
  at: number; // performance.now() when it began
  ms: number;
  peak: number;
}

/**
 * Hit feedback for a playable scene (DESIGN §19): a white flash on a hit figure, a small shake on shots and
 * bites (the shake option), text pops for events, arrows at the screen edge for what is attacked out of sight
 * (plus the jump key) and the herd's arrival flash and pan. The rules are `render/fx.ts`; the scene calls
 * `frame` once a frame after it has synced its sprites and `FeelScene` draws the arrows and the flash.
 */
export class Feel {
  private readonly watch = newWatch();
  private readonly soundWatch = newSoundWatch();
  private readonly flashes = new Map<string, number>(); // unit id → scene time the flash ends
  private alerts: Alert[] = [];
  private jumpIdx = 0;
  private pops = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: { n: () => number; view: () => ViewInput; sprites: () => Map<string, UnitSprite> },
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.registry.set('fx_alerts', []);
      scene.registry.set('fx_flash', null);
    });
  }

  /** Reads the sim, reacts to what changed, and publishes the arrows. Call after the scene's `sync`. */
  frame(s: Watched & { traps?: Trap[]; herd?: { warned: boolean } }): void {
    const now = this.scene.time.now;
    this.alerts = liveAlerts(this.alerts, now);
    for (const e of observe(this.watch, s)) this.react(e, now);
    this.applyFlashes(now);
    this.publishArrows(now);
    this.playSounds(s);
    ambience.update(moodOf(s)); // the adaptive layers follow the chase, the alarm and the herd (DESIGN §6)
  }

  /** Starts the sounds the sim just made, each placed from the camera centre (DESIGN §6 *Audio*): panned, and fading about one screen out. */
  private playSounds(s: Watched & { traps?: Trap[] }): void {
    const cam = this.scene.cameras.main;
    const [cx, cy] = this.hooks.view().centre;
    for (const e of soundEvents(this.soundWatch, s)) {
      const w = tileToWorld(e.x, e.y, this.hooks.n());
      const p = spatial(w.x - cx, w.y - cy, cam.zoom, cam.width, REACH[e.id]);
      audio.play(e.id, { gain: e.gain * p.gain, pan: p.pan, variant: e.variant });
    }
  }

  /** The jump key: the camera glides to the newest attack, then to the next older on each press. False when nothing is under attack. */
  jump(): boolean {
    const a = pickJump(this.alerts, this.scene.time.now, this.jumpIdx);
    if (!a) return false;
    this.jumpIdx++;
    const w = tileToWorld(a.x, a.y, this.hooks.n());
    this.hooks.view().glideTo(w.x, w.y - ARROW_LIFT, 450);
    return true;
  }

  /** The herd is in: the screen flashes red and the camera glides to where they came from (tile x, y). */
  herdArrives(x: number, y: number): void {
    const flash: FlashModel = { color: 0xd8382a, at: performance.now(), ms: HERD_FLASH_MS, peak: HERD_FLASH_PEAK };
    this.scene.registry.set('fx_flash', flash);
    const w = tileToWorld(x, y, this.hooks.n());
    this.hooks.view().glideTo(w.x, w.y, 900);
  }

  private react(e: FxEvent, now: number): void {
    if (e.kind === 'flash') this.flashes.set(e.id, now + FLASH_MS);
    else if (e.kind === 'shake') this.shake(e);
    else if (e.kind === 'pop') this.pop(e.text, e.x, e.y);
    else {
      if (!this.alerts.some((a) => a.key === e.key && now - a.at < 1000)) this.jumpIdx = 0; // a new attack: the key starts from it
      this.alerts = touchAlert(this.alerts, { key: e.key, label: e.label, x: e.x, y: e.y, at: now });
    }
  }

  private onScreen(wx: number, wy: number): boolean {
    const v = this.scene.cameras.main.worldView;
    return wx >= v.x - OFFSCREEN_PAD && wx <= v.right + OFFSCREEN_PAD && wy >= v.y - OFFSCREEN_PAD && wy <= v.bottom + OFFSCREEN_PAD;
  }

  private shake(e: Extract<FxEvent, { kind: 'shake' }>): void {
    if (!options().shake) return;
    const w = tileToWorld(e.x, e.y, this.hooks.n());
    if (!this.onScreen(w.x, w.y)) return;
    const s = SHAKE[e.strength];
    this.scene.cameras.main.shake(s.ms, s.strength);
  }

  private pop(text: string, x: number, y: number): void {
    const w = tileToWorld(x, y, this.hooks.n());
    const t = this.scene.add
      .text(w.x, w.y - 56 - (this.pops++ % 3) * 16, text, { fontFamily: FONT, fontSize: `${ui(18)}px`, fontStyle: 'bold', color: popColor(text), stroke: '#141614', strokeThickness: 4 })
      .setOrigin(0.5, 1)
      .setDepth(900);
    this.scene.tweens.add({ targets: t, y: t.y - POP_RISE, alpha: 0, duration: POP_MS, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  /** A flash lasts a few frames: the figure is drawn solid white. A survivor's tint is otherwise never touched, so it is cleared; an enemy's state tint comes back with the next sync. */
  private applyFlashes(now: number): void {
    const sprites = this.hooks.sprites();
    for (const [id, until] of this.flashes) {
      const body = sprites.get(id)?.body;
      if (now < until) body?.setTintFill(FLASH_TINT);
      else {
        if (body?.tintFill) body.clearTint();
        this.flashes.delete(id);
      }
    }
  }

  /** The free screen area: what the HUD (counters, squad panel, action bar) leaves. */
  private insets(): Insets {
    return { l: ui(214) + 32, t: ui(124), r: 30, b: barH() + ui(54) };
  }

  private publishArrows(now: number): void {
    const cam = this.scene.cameras.main;
    const centre = this.hooks.view().centre;
    const out: ArrowModel[] = [];
    for (const a of liveAlerts(this.alerts, now)) {
      if (out.length >= MAX_ARROWS) break;
      const w = tileToWorld(a.x, a.y, this.hooks.n());
      const [sx, sy] = worldToScreen(w.x, w.y - ARROW_LIFT, centre, cam.zoom, cam.width, cam.height);
      const p = edgeArrow(sx, sy, cam.width, cam.height, this.insets());
      if (p) out.push({ ...p, label: a.label, newest: out.length === 0, alpha: alertAlpha(now - a.at) });
    }
    this.scene.registry.set('fx_alerts', out);
  }
}
