import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import {
  ARROW_FLIGHT_MS,
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
import { addSprite } from '../render/placeholders';
import { type BarkWatch, barkEvents, newBarkWatch } from '../sim/barks';
import type { UnitSprite } from '../render/units';
import type { Trap } from '../sim/traps';
import { options } from '../sim/options';
import { barH } from './ActionBar';
import type { ViewInput } from './input';
import { ui } from './uiScale';

const FONT = GAME_FONT;
const FLASH_TINT = 0xffffff;
const ARROW_LIFT = 24; // world px above the feet: where an alert points on a figure
const OFFSCREEN_PAD = 32; // a shake or pop this near the screen counts as seen
const BARK_FONT = GAME_FONT;
const BARK_MS = 3000; // a bark stays this long above the speaker (DESIGN §22)
const BARK_FADE = 400; // and fades over its last part
const BARK_LIFT = 88; // world px above the feet: over the head

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
  private readonly barkWatch: BarkWatch = newBarkWatch();
  private barks: { id: string; text: Phaser.GameObjects.Text; until: number }[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: { n: () => number; view: () => ViewInput; sprites: () => Map<string, UnitSprite>; hearth?: () => { x: number; y: number } | null },
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.registry.set('fx_alerts', []);
      scene.registry.set('fx_flash', null);
    });
  }

  /** Reads the sim, reacts to what changed, and publishes the arrows. Call after the scene's `sync`. `rain` (0..1) is the rain layer's level (Base 1, DESIGN §20). */
  frame(s: Watched & { traps?: Trap[]; herd?: { warned: boolean } }, rain = 0): void {
    const now = this.scene.time.now;
    this.alerts = liveAlerts(this.alerts, now);
    for (const e of observe(this.watch, s)) this.react(e, now);
    this.applyFlashes(now);
    this.publishArrows(now);
    this.playSounds(s);
    this.speak(s);
    ambience.update(moodOf(s), rain); // the adaptive layers follow the chase, the alarm and the herd (DESIGN §6)
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
    else if (e.kind === 'arrow') this.flyArrow(e);
    else {
      if (!this.alerts.some((a) => a.key === e.key && now - a.at < 1000)) this.jumpIdx = 0; // a new attack: the key starts from it
      this.alerts = touchAlert(this.alerts, { key: e.key, label: e.label, x: e.x, y: e.y, at: now });
    }
  }

  /** A bow shot (DESIGN §5): the `arrow_fly` sprite crosses from the archer's chest to the target in about 0.2 s. */
  private flyArrow(e: Extract<FxEvent, { kind: 'arrow' }>): void {
    const n = this.hooks.n();
    const a = tileToWorld(e.x, e.y, n);
    const b = tileToWorld(e.tx, e.ty, n);
    const lift = ARROW_LIFT; // chest height, both ends
    const img = addSprite(this.scene, 'arrow_fly', a.x, a.y - lift, 905).setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    this.scene.tweens.add({ targets: img, x: b.x, y: b.y - lift, duration: ARROW_FLIGHT_MS, ease: 'Linear', onComplete: () => img.destroy() });
  }

  /** Barks (DESIGN §22): a new one floats above its speaker for a few seconds and follows them; the game never pauses for it. */
  private speak(s: Parameters<typeof barkEvents>[1]): void {
    const now = this.scene.time.now;
    const b = barkEvents(this.barkWatch, s, this.hooks.hearth?.() ?? null);
    if (b) {
      const text = this.scene.add
        .text(0, 0, b.text, { fontFamily: BARK_FONT, fontSize: `${ui(16)}px`, color: '#f4efe0', stroke: '#141614', strokeThickness: 4, align: 'center', wordWrap: { width: ui(260) } })
        .setOrigin(0.5, 1)
        .setDepth(910);
      this.barks.push({ id: b.id, text, until: now + BARK_MS });
      audio.play('blip', { gain: 0.5, variant: Math.random() });
    }
    this.barks = this.barks.filter((k) => {
      const u = s.survivors.find((v) => v.id === k.id);
      if (!u || now >= k.until) {
        k.text.destroy();
        return false;
      }
      const w = tileToWorld(u.x, u.y, this.hooks.n());
      k.text.setPosition(w.x, w.y - BARK_LIFT).setAlpha(Math.min(1, (k.until - now) / BARK_FADE));
      return true;
    });
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
