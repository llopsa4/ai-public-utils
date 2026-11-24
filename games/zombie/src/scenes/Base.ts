import Phaser from 'phaser';
import base from '../data/base1.json';
import story from '../data/story.json';
import { type P, circlePoints, conePolygon, ringLook, sightPolygon } from '../render/cones';
import { type ClickTarget, DoubleClick, cursorFor, resolveClick } from '../render/click';
import { NOISE_DASH, dashSegments, hungerLabel } from '../render/cues';
import { tileToWorld, worldBounds, worldToTile, worldToTileF } from '../render/iso';
import { anchorOf } from '../render/placeholders';
import { bakeGround, checker } from './ground';
import { UnitSprite } from '../render/units';
import { canFreeFire, selectWeapon, setFreeFire, unlockGun } from '../sim/abilities';
import { enemyViewer } from '../sim/ai';
import { type Campaign, browserStorage, saveCampaign, toDone, withCassGun, withCheckpoint } from '../sim/campaign';
import {
  COOK_TICKS,
  FIX_TICKS,
  HUNGER_TICKS,
  TICK_HZ,
  type BaseState,
  type PlaceResult,
  type WorkResult,
  addZombie,
  baseButtons,
  checkpointOf,
  cloneBase,
  createBase,
  eat,
  give,
  hungerLevel,
  herdSeconds,
  hungerSeconds,
  orderAttack,
  orderCook,
  orderFix,
  orderHold,
  objectiveText,
  orderMove,
  placeBarricade,
  setStance,
  stepBase,
} from '../sim/base';
import { BUSH, TREE, WALL } from '../sim/grid';
import { type Survivor, failText, nextStance, survivorViewer } from '../sim/mission';
import { options } from '../sim/options';
import { REARM_TICKS, TRAP_TICKS, type TrapKind, type TrapResult, orderRearm, orderTrap, trapAt, trapCost } from '../sim/traps';
import type { DialogueLine } from '../sim/dialogue';
import { ACTION_EVENT, type BarModel, HINT_WRAP, SKIP_AFTER_MS, barH, overBar, placeHint } from './ActionBar';
import { pressCard } from '../render/squad';
import { Feel } from './feelFx';
import { ViewInput } from './input';
import { DIALOGUE_SCENE, openDialogue } from './Dialogue';
import { bindPause } from './Pause';
import { bindActionKeys, fillHelp } from './actionKeys';
import { bindSquad, overSquad } from './Squad';
import { CounterRow } from './counters';
import { uiImage } from './kit';
import { placeText, scaleText, sizeBanner, ui } from './uiScale';
import { type Counter, lootCounters } from '../render/uiview';

const STEP_MS = 1000 / TICK_HZ;
const PICK_W = 16; // half-width and height (world px) of a unit's click target
const PICK_H = 44;
const RESTART_MS = 2500;
const BARK_MS = 4000;
const HINT_MS = 6000; // each start hint stays this long (only counted while the scene runs, so dialogues do not eat them)
const FONT = 'Georgia, "Times New Roman", serif';

/** The key lines in the HUD corner and on the pause menu's Controls page. */
// `{action}` is filled with the live key (rebindable, `fillHelp`).
const HELP = 'Drag: box select    Left-click: select / move / attack / cook / fix (double-click: run)    Right-click: cancel\n{crouch}: stance    {hold}: hold    {freefire}: free fire    {build}: barricade    {fix}: fix window or door    {weapon1} / {weapon2}: weapon\n{cook}: cook    {eat}: eat    {give}: give meal    {trap}: trap (spike pit / noise can)    {freeze}: pause    {alert}: jump to attack    R: restart    Esc: menu\n{select1} / {select2} / {cycle}: select survivor    Shift-click: add to selection    Double-click a squad card: centre';
const NOISE_COLOR: Record<string, number> = { step: 0xd8d8d0, shot: 0xe0a45a, lure: 0x8fb4d8, alarm: 0xd85a4a, can: 0xc8a0e0 };
const TRAP_REFUSED: Record<Exclude<TrapResult, 'ok'>, string> = {
  invalid: 'Nothing to do there',
  blocked: 'Cannot build a trap there',
  scrap: 'Not enough scrap',
};
const TRAP_NAME: Record<TrapKind, string> = { spike: 'spike pit', can: 'noise can' };
const PLACE_REFUSED: Record<Exclude<PlaceResult, 'ok'>, string> = {
  blocked: 'Cannot build there',
  occupied: 'Someone is standing there',
  scrap: 'Not enough scrap',
};
const WORK_REFUSED: Record<Exclude<WorkResult, 'ok'>, string> = {
  invalid: 'Nothing to do there',
  scrap: 'Not enough scrap',
  food: 'No food to cook',
  meal: 'Already holding a meal',
};

type Pending = null | 'hold' | 'build' | 'fix' | TrapKind;
type Ord =
  | { type: 'move'; ids: string[]; to: [number, number] }
  | { type: 'hold'; id: string; toward: [number, number] }
  | { type: 'attack'; ids: string[]; target: string }
  | { type: 'build'; at: [number, number] }
  | { type: 'fix'; id: string; opening: string }
  | { type: 'cook'; id: string }
  | { type: 'trap'; id: string; kind: TrapKind; at: [number, number] }
  | { type: 'rearm'; id: string; trap: string }
  | { type: 'eat'; id: string }
  | { type: 'give'; id: string }
  | { type: 'zombie'; at: [number, number] };

const name = (u: Survivor): string => u.kind[0]!.toUpperCase() + u.kind.slice(1);
const clock = (sec: number): string => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/**
 * Base 1 scene (DESIGN §12, §13, §17): the house from Mission 1 as a home. Left-click selects a survivor,
 * attacks a zombie, cooks at the stove, fixes a broken opening or walks (double-click runs), drag
 * box-selects, right-click only cancels, V hold, B barricade, X fix a
 * broken window or door, K cook, E eat, Q give. All rules live in `src/sim/base.ts`.
 */
export class BaseScene extends Phaser.Scene {
  private n = 32;
  private state!: BaseState;
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Image;
  private ping!: Phaser.GameObjects.Image;
  private view!: ViewInput;
  private feel!: Feel;
  private units = new Map<string, UnitSprite>();
  private bodySprites = new Map<string, Phaser.GameObjects.Image>();
  private blockSprites = new Map<string, Phaser.GameObjects.Image>();
  private openLabels = new Map<string, Phaser.GameObjects.Text>();
  private stoveLabel!: Phaser.GameObjects.Text;
  private decalCount = 0;
  private saidSeen = 0;
  private eventsSeen = 0;
  private won = false;
  private herdLabel!: Phaser.GameObjects.Text;
  private prev = new Map<string, [number, number]>();
  private selected = new Set<string>();
  private squad!: { publish: () => void };
  private readonly dbl = new DoubleClick();
  private pending: Pending = null;
  private paused = false;
  private acc = 0;
  private endedAt = 0;
  private toastText = '';
  private toastUntil = 0;
  private hintMs = 0;

  constructor() {
    super('Base');
  }

  create(): void {
    const from = this.registry.get('campaign') as Campaign | null | undefined;
    // A saved herd checkpoint (taken at the warning) is where Base 1 resumes: Retry, Continue (DESIGN §12, §18).
    const resume = from?.stage === 'base1' ? from.checkpoint : null;
    this.state = resume ? cloneBase(resume) : createBase(from?.stage === 'base1' ? { food: from.food, scrap: from.scrap, ammo: from.ammo, cassGun: from.cassGun } : undefined);
    this.n = this.state.grid.size;
    this.units.clear();
    this.bodySprites.clear();
    this.blockSprites.clear();
    this.openLabels.clear();
    this.prev.clear();
    this.selected.clear();
    this.decalCount = 0;
    this.saidSeen = this.state.said.length; // a resumed run does not replay old barks or the warning dialogue
    this.eventsSeen = this.state.events.length;
    this.won = false;
    this.pending = null;
    this.paused = false;
    this.acc = 0;
    this.endedAt = 0;
    this.toastText = resume ? 'Back at the herd warning' : '';
    this.toastUntil = resume ? this.time.now + BARK_MS : 0;
    this.hintMs = 0;

    this.drawWorld();
    this.fx = this.add.graphics().setDepth(0.3);
    this.hover = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5);
    this.ping = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
    this.bars = this.add.graphics().setDepth(850);
    this.sync(1);

    const us = this.state.survivors;
    const mid = tileToWorld(us.reduce((a, u) => a + u.x, 0) / us.length, us.reduce((a, u) => a + u.y, 0) / us.length, this.n);
    this.view = new ViewInput(this, {
      bounds: () => worldBounds(this.n),
      blocked: (p) => this.onBar(p),
      onLeft: (p) => this.leftClick(p),
      onRight: (p) => this.rightClick(p),
      onBox: (a, b) => this.boxSelect(a, b),
    });
    this.view.start(mid.x, mid.y);
    this.feel = new Feel(this, { n: () => this.n, view: () => this.view, sprites: () => this.units });
    this.squad = bindSquad(this, {
      units: () => this.state.survivors,
      nameOf: (id) => name(this.state.survivors.find((u) => u.id === id)!),
      hungerOf: (id) => ({ frac: (this.state.hunger[id]?.left ?? 0) / HUNGER_TICKS, level: hungerLevel(this.state, id) }),
      selection: () => this.selected,
      select: (ids) => {
        this.selected = ids;
        this.sync(1);
      },
      centreOn: (id) => {
        const u = this.state.survivors.find((x) => x.id === id)!;
        const w = tileToWorld(u.x, u.y, this.n);
        this.view.centreOn(w.x, w.y - PICK_H / 2);
      },
    });

    // First arrival: Cass takes back her pistol (DESIGN §5). The save keeps it, so a restart or Continue skips the beat.
    if (from?.stage === 'base1' && !from.cassGun && !resume) {
      openDialogue(this, story.dialogue.base1Arrival as DialogueLine[], () => {
        unlockGun(this.state, 'fighter');
        const next = withCassGun(from);
        this.registry.set('campaign', next);
        saveCampaign(browserStorage(), next);
      });
    }

    const kb = this.input.keyboard!;
    bindActionKeys(this, {
      freeze: () => this.togglePause(),
      alert: () => this.feel.jump() || this.toast('Nothing is under attack'),
      crouch: () => this.onAction('crouch'),
      hold: () => this.onAction('hold'),
      build: () => this.onAction('build'),
      fix: () => this.onAction('fix'),
      cook: () => this.onAction('cook'),
      trap: () => this.onAction('trap'),
      eat: () => this.onAction('eat'),
      give: () => this.onAction('give'),
      freefire: () => this.onAction('freefire'),
      weapon1: () => this.chooseWeapon(0),
      weapon2: () => this.chooseWeapon(1),
    });
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.state.status !== 'failed' || e.key === 'Escape' || this.endedAt < SKIP_AFTER_MS) return;
      if (!this.retryable()) this.endedAt = RESTART_MS; // before the warning any key restarts
      else if (e.key === 'Enter') this.scene.restart(); // the saved checkpoint is read again by `create`
      else if (e.key === 'r' || e.key === 'R') this.restartFresh();
    });
    bindPause(this, {
      cancelPending: () => {
        const had = this.pending !== null;
        this.pending = null;
        return had;
      },
      failed: () => this.state.status === 'failed',
      restart: () => this.restartFresh(),
      quit: () => this.leave(),
      quitNote: () => (this.retryable() ? 'Continue resumes at the herd warning.' : 'Progress in this scene is lost; Continue starts it again from its beginning.'),
      controls: () => fillHelp(HELP).split('\n'),
      hints: () => base.hints.map(fillHelp),
    });

    this.scene.launch('BaseHud');
    this.scene.launch('ActionBar');
    this.scene.launch('Squad');
    this.scene.launch('Feel');
    this.game.events.on(ACTION_EVENT, this.onAction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('BaseHud');
      this.scene.stop('ActionBar');
      this.scene.stop('Squad');
      this.scene.stop('Feel');
      this.game.events.off(ACTION_EVENT, this.onAction, this);
      this.registry.set('m_bar', null);
    });

    if (new URLSearchParams(window.location.search).has('debug')) {
      (window as unknown as { dw?: unknown }).dw = {
        state: this.state,
        step: (k: number) => {
          for (let i = 0; i < k; i++) this.tickOnce();
          this.sync(1);
        },
        orders: (list: Ord[]) => list.forEach((o) => this.debugOrder(o)),
      };
    }
  }

  /** Quit from the pause menu: back to the title; the save already names this scene's start (Continue replays Base 1). */
  private leave(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    this.scene.start('Menu');
  }

  private debugOrder(o: Ord): void {
    const s = this.state;
    switch (o.type) {
      case 'move': orderMove(s, o.ids, o.to); break;
      case 'hold': orderHold(s, o.id, o.toward); break;
      case 'attack': orderAttack(s, o.ids, o.target); break;
      case 'build': placeBarricade(s, o.at[0], o.at[1]); break;
      case 'fix': orderFix(s, o.id, o.opening); break;
      case 'cook': orderCook(s, o.id); break;
      case 'trap': orderTrap(s, o.id, o.kind, o.at[0], o.at[1]); break;
      case 'rearm': orderRearm(s, o.id, o.trap); break;
      case 'eat': eat(s, o.id); break;
      case 'give': give(s, o.id); break;
      case 'zombie': addZombie(s, o.at[0], o.at[1]); break;
    }
  }

  /** Ground, walls, trees, bushes, the stove and the labels over the openings. Upright things sort by foot y. */
  private drawWorld(): void {
    const s = this.state;
    const n = this.n;
    bakeGround(this, n, checker);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const w = tileToWorld(x, y, n);
        const k = s.grid.tiles[y * n + x];
        const key = k === WALL ? 'wall' : k === TREE ? 'tree' : k === BUSH ? 'bush' : null;
        if (key) this.add.image(w.x, w.y, key).setOrigin(...anchorOf(key)).setDepth(w.y + (k === BUSH ? 1 : 0));
      }
    }
    const sw = tileToWorld(s.stove.x, s.stove.y, n);
    this.add.image(sw.x, sw.y, 'fire').setOrigin(...anchorOf('fire')).setDepth(sw.y);
    this.stoveLabel = this.add.text(sw.x, sw.y - 40, 'Stove', { fontFamily: FONT, fontSize: '12px', color: '#d8d6ce' }).setOrigin(0.5).setDepth(880);
    const aw = tileToWorld(base.herd.arrow[0]!, base.herd.arrow[1]! + 4.2, n);
    this.herdLabel = this.add.text(aw.x, aw.y, '', { fontFamily: FONT, fontSize: '16px', color: '#ff8a78', backgroundColor: '#1d201cb0', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(880).setVisible(false);
    for (const o of s.openings) {
      const w = tileToWorld(o.x, o.y, n);
      this.openLabels.set(o.id, this.add.text(w.x, w.y - 34, '', { fontFamily: FONT, fontSize: '12px', color: '#e0806a' }).setOrigin(0.5).setDepth(880));
    }
  }

  private at(u: { id: string; x: number; y: number }, frac: number): [number, number] {
    const p = this.prev.get(u.id) ?? [u.x, u.y];
    return [p[0] + (u.x - p[0]) * frac, p[1] + (u.y - p[1]) * frac];
  }

  private unitSprite(u: Survivor | BaseState['enemies'][number]): UnitSprite {
    let sp = this.units.get(u.id);
    if (!sp) {
      const ring = u.side === 'survivor' ? this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de) : undefined;
      sp = new UnitSprite(this, u, ring);
      this.units.set(u.id, sp);
    }
    return sp;
  }

  /** Puts every sprite at its tile, `frac` of the way from the last tick to this one. */
  private sync(frac: number): void {
    const s = this.state;
    const n = this.n;
    for (const u of [...s.survivors, ...s.enemies]) {
      const sp = this.unitSprite(u);
      const drawn = sp.update(u, s.tick, frac);
      sp.ring?.setVisible(false);
      if (!drawn) {
        sp.showCue(u, false, 0, 0);
        continue;
      }
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, n);
      sp.body.setPosition(w.x, w.y).setDepth(w.y);
      sp.showCue(u, true, w.x, w.y);
      if (u.hp <= 0) sp.body.clearTint();
      else if (u.side === 'survivor') {
        sp.ring?.setPosition(w.x, w.y).setVisible(this.selected.has(u.id));
      } else if (u.ai.mode === 'chase') sp.body.setTint(0xff8a78);
      else if (u.ai.mode === 'investigate') sp.body.setTint(0xf0dc8a);
      else sp.body.clearTint();
    }
    for (const b of s.bodies) {
      let img = this.bodySprites.get(b.id);
      if (!img) {
        img = this.add.image(0, 0, 'body').setOrigin(...anchorOf('body'));
        this.bodySprites.set(b.id, img);
      }
      const w = tileToWorld(b.x, b.y, n);
      img.setPosition(w.x, w.y).setDepth(w.y - 1).setVisible(!this.units.get(b.id)?.dying);
    }
    for (; this.decalCount < s.decals.length; this.decalCount++) {
      const d = s.decals[this.decalCount]!;
      const w = tileToWorld(d.x, d.y, n);
      this.add.image(w.x, w.y, 'blood').setOrigin(...anchorOf('blood')).setDepth(0.2);
    }
    this.syncBlockers();
  }

  /** One sprite per barricade segment and per fixed opening; damage fades it; a broken one disappears. */
  private syncBlockers(): void {
    const s = this.state;
    const live = new Set<string>();
    for (const b of [...s.barricades, ...s.openings.filter((o) => o.fixed)]) {
      const key = `${b.x},${b.y}`;
      live.add(key);
      let img = this.blockSprites.get(key);
      if (!img) {
        const w = tileToWorld(b.x, b.y, this.n);
        img = this.add.image(w.x, w.y, 'barricade').setOrigin(...anchorOf('barricade')).setDepth(w.y);
        this.blockSprites.set(key, img);
      }
      img.setAlpha(0.45 + (0.55 * b.hp) / base.fix.hp);
    }
    for (const [key, img] of this.blockSprites) {
      if (live.has(key)) continue;
      img.destroy();
      this.blockSprites.delete(key);
    }
    for (const o of s.openings) this.openLabels.get(o.id)?.setText(o.fixed ? '' : o.kind === 'door' ? 'Broken door' : 'Broken window');
  }

  /** The world labels (stove, herd countdown, broken openings) follow the text size option too. */
  private scaleLabels(): void {
    scaleText(this.stoveLabel, 12);
    scaleText(this.herdLabel, 16, 6, 3);
    for (const l of this.openLabels.values()) scaleText(l, 12);
  }

  private tickOnce(): void {
    for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
    stepBase(this.state);
    if (this.state.herd.warned) this.takeCheckpoint();
  }

  /** The campaign being played, or undefined when Base 1 was started without one (a debug start). */
  private campaign(): Campaign | undefined {
    const c = this.registry.get('campaign') as Campaign | null | undefined;
    return c?.stage === 'base1' ? c : undefined;
  }

  /** The whole Base state at the herd warning goes into the save, once (DESIGN §12, §18). */
  private takeCheckpoint(): void {
    const from = this.campaign();
    const cp = from && !from.checkpoint ? checkpointOf(this.state) : null;
    if (!from || !cp) return;
    const next = withCheckpoint(from, cp);
    this.registry.set('campaign', next);
    saveCampaign(browserStorage(), next);
  }

  /** A checkpoint is saved, so the fail screen offers Retry from the warning. */
  private retryable(): boolean {
    return this.campaign()?.checkpoint != null;
  }

  /** Base 1 again from its very beginning: the checkpoint goes. */
  private restartFresh(): void {
    const from = this.campaign();
    if (from?.checkpoint) {
      const next = withCheckpoint(from, null);
      this.registry.set('campaign', next);
      saveCampaign(browserStorage(), next);
    }
    this.scene.restart();
  }

  // ---- Drawing the cones, rings, markers and bars each frame ----

  private fill(pts: P[], color: number, alpha: number, outline = 0): void {
    const w = pts.map(([x, y]) => tileToWorld(x, y, this.n));
    this.fx.fillStyle(color, alpha).fillPoints(w, true);
    if (outline > 0) this.fx.lineStyle(1, color, outline).strokePoints(w, true);
  }

  private drawFx(frac: number): void {
    const s = this.state;
    this.fx.clear();
    this.bars.clear();
    for (const o of s.openings) {
      if (o.fixed) continue;
      const [cx, cy] = [o.x, o.y];
      this.fill([[cx, cy - 0.5], [cx + 0.5, cy], [cx, cy + 0.5], [cx - 0.5, cy]], 0xd0604a, 0.25, 0.9); // a broken opening
    }
    if (s.herd.warned && s.herd.spawned < base.herd.count) {
      const [ax, ay] = base.herd.arrow as [number, number]; // a pulsing red arrow on the north edge, pointing out of the map
      const pulse = 0.55 + 0.35 * Math.sin(this.time.now / 180);
      this.fill([[ax, ay + 0.5], [ax + 1.4, ay + 2.2], [ax + 0.5, ay + 2.2], [ax + 0.5, ay + 4], [ax - 0.5, ay + 4], [ax - 0.5, ay + 2.2], [ax - 1.4, ay + 2.2]], 0xd8382a, pulse, 1);
    }
    for (const t of s.traps) {
      const [cx, cy] = [t.x, t.y];
      if (t.kind === 'spike') {
        const k = t.armed ? 0.32 : 0.22; // a spent pit is smaller and grey
        this.fill([[cx, cy - k], [cx + k, cy], [cx, cy + k], [cx - k, cy]], t.armed ? 0xd8c070 : 0x6a6a64, t.armed ? 0.6 : 0.35, 0.9);
      } else {
        this.fill(circlePoints(cx, cy, t.cooldown > 0 ? 0.18 : 0.26), NOISE_COLOR.can!, t.cooldown > 0 ? 0.3 : 0.6, 0.9);
      }
    }
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      const [x, y] = this.at(e, frac);
      this.fill(sightPolygon(s.grid, x, y, enemyViewer(e).range), 0x9a9a92, 0.1, 0.3); // faint grey sight circle
    }
    for (const u of s.survivors) {
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const v = { ...survivorViewer(u), x, y };
      if (u.order?.type === 'hold') this.fill(conePolygon(s.grid, v), 0x58c070, 0.24, 0.8);
      else if (this.selected.has(u.id)) this.fill(conePolygon(s.grid, v), 0x58c070, 0.08, 0.3);
    }
    for (const r of s.rings) {
      const look = ringLook(r.radius, r.age);
      const w = circlePoints(r.x, r.y, look.r).map(([px, py]) => tileToWorld(px, py, this.n));
      this.fx.lineStyle(2, NOISE_COLOR[r.kind] ?? 0xd8d8d0, look.alpha);
      const dash = options().cues ? NOISE_DASH[r.kind] : NOISE_DASH.step; // DESIGN §19: each noise kind has its own line style
      for (const run of dashSegments(w.map((q): [number, number] => [q.x, q.y]), dash.on, dash.off)) this.fx.strokePoints(run.map(([px, py]) => ({ x: px, y: py })));
    }
    for (const u of [...s.survivors, ...s.enemies]) {
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, this.n);
      if (u.side !== 'survivor' && u.hp >= u.maxHp) continue;
      const top = w.y - 52;
      this.bars.fillStyle(0x1a1c19, 0.8).fillRect(w.x - 14, top, 28, 4);
      this.bars.fillStyle(u.side === 'survivor' ? 0x9bc79b : 0xc77b6b, 1).fillRect(w.x - 14, top, (28 * u.hp) / u.maxHp, 4);
    }
    for (const u of s.survivors) {
      const o = u.order;
      if (u.hp <= 0 || o?.type !== 'work' || o.left < 0) continue;
      const kind = o.job === 'trap' ? (o.target.startsWith('can') ? 'can' : 'spike') : null;
      const total = o.job === 'fix' ? FIX_TICKS : o.job === 'cook' ? COOK_TICKS : kind ? TRAP_TICKS[kind] : REARM_TICKS;
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, this.n);
      this.bars.fillStyle(0x1a1c19, 0.8).fillRect(w.x - 14, w.y - 60, 28, 4);
      this.bars.fillStyle(0xe8c46a, 1).fillRect(w.x - 14, w.y - 60, (28 * (total - o.left)) / total, 4);
    }
  }

  // ---- Input ----

  private worldOf(p: { x: number; y: number }): { x: number; y: number } {
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  private tileOf(p: { x: number; y: number }): { x: number; y: number } {
    const wp = this.worldOf(p);
    return worldToTile(wp.x, wp.y, this.n);
  }

  private hit(wp: { x: number; y: number }, x: number, y: number): number {
    const w = tileToWorld(x, y, this.n);
    const dx = Math.abs(wp.x - w.x);
    const dy = w.y - wp.y; // positive above the feet
    if (dx > PICK_W || dy < -8 || dy > PICK_H) return Infinity;
    return dx + Math.abs(dy - PICK_H / 2);
  }

  private unitAt(wp: { x: number; y: number }, list: readonly { id: string; x: number; y: number; hp: number }[]): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const u of list) {
      const d = u.hp > 0 ? this.hit(wp, u.x, u.y) : Infinity;
      if (d < bd) [bd, best] = [d, u.id];
    }
    return best;
  }

  /** The point is on the tile or the sprite standing on it. */
  private onSpot(wp: { x: number; y: number }, x: number, y: number): boolean {
    const w = tileToWorld(x, y, this.n);
    const dy = w.y - wp.y;
    return Math.abs(wp.x - w.x) <= 18 && dy >= -10 && dy <= 30;
  }

  private chosen(): Survivor[] {
    return this.state.survivors.filter((u) => u.hp > 0 && this.selected.has(u.id));
  }

  private nearest(who: Survivor[], x: number, y: number): Survivor | undefined {
    return [...who].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
  }

  private get canOrder(): boolean {
    return !this.paused && this.state.status === 'playing';
  }

  private toast(msg: string): void {
    this.toastText = msg;
    this.toastUntil = this.time.now + 1800;
  }

  /** The pointer is over the action bar or a squad card: the world below ignores it. */
  private onBar(p: Phaser.Input.Pointer): boolean {
    return overBar(this.registry, p.x, p.y, this.scale.width, this.scale.height) || overSquad(this.registry, p.x, p.y);
  }

  private togglePause(): void {
    if (this.state.status === 'playing') this.paused = !this.paused;
    if (this.paused) this.pending = null;
  }

  private arm(mode: Exclude<Pending, null>): void {
    if (this.chosen().length === 0) return this.toast('Select a survivor first');
    this.pending = this.pending === mode ? null : mode;
  }

  /** Bar button or its hotkey. Orders are refused while paused or ended. */
  private onAction(id: string): void {
    if (!this.canOrder) return;
    const who = this.chosen();
    if (id.startsWith('weapon:')) {
      const wid = id.slice('weapon:'.length);
      if (who.length === 0 || !who.some((u) => selectWeapon(this.state, u.id, wid))) this.toast(this.state.ammo <= 0 && wid === 'pistol' ? 'Out of ammo' : 'That survivor does not carry it');
    } else if (id === 'hold' || id === 'build' || id === 'fix' || id === 'spike' || id === 'can') this.arm(id);
    else if (id === 'trap') {
      // T: spike pit, then noise can, then off (the bar buttons pick a type directly)
      if (this.pending === 'spike') this.arm('can');
      else if (this.pending === 'can') this.pending = null;
      else this.arm('spike');
    }
    else if (id === 'freefire') {
      const armed = who.filter(canFreeFire);
      if (armed.length === 0) return this.toast('Select a survivor with a gun');
      const on = !armed[0]!.freeFire;
      for (const u of armed) setFreeFire(this.state, u.id, on);
      this.toast(on ? 'Free fire on: Hold may use the gun' : 'Free fire off: Hold uses melee only');
    } else if (id === 'crouch') {
      if (who.length === 0) return;
      const next = nextStance(who[0]!.stance);
      for (const u of who) setStance(this.state, u.id, next);
    } else if (id === 'cook') {
      const cook = this.nearest(who, this.state.stove.x, this.state.stove.y);
      if (!cook) return this.toast('Select a survivor first');
      this.report(orderCook(this.state, cook.id));
    } else if (id === 'eat') {
      if (who.length === 0) return this.toast('Select a survivor first');
      if (!who.some((u) => eat(this.state, u.id))) this.toast('Nobody selected is holding a meal');
    } else if (id === 'give') {
      if (who.length === 0) return this.toast('Select a survivor first');
      if (!who.some((u) => give(this.state, u.id))) this.toast('Needs a meal and a survivor without one next to you');
    }
  }

  private report(r: WorkResult): void {
    if (r !== 'ok') this.toast(WORK_REFUSED[r]);
  }

  /** Keys 1 and 2: the first and second weapon button of the selected survivor. */
  private chooseWeapon(i: number): void {
    const u = this.chosen()[0];
    const b = u ? baseButtons(this.state, u).filter((b) => b.id.startsWith('weapon:'))[i] : undefined;
    if (b) this.onAction(b.id);
  }

  /** What lies under a world point, in click priority: survivor, zombie, stove or broken opening, ground (open map), nothing. */
  private targetAt(wp: { x: number; y: number }): { kind: ClickTarget; id?: string } {
    const sv = this.unitAt(wp, this.state.survivors);
    if (sv) return { kind: 'survivor', id: sv };
    const z = this.unitAt(wp, this.state.enemies);
    if (z) return { kind: 'enemy', id: z };
    const st = this.state.stove;
    if (this.onSpot(wp, st.x, st.y)) return { kind: 'object', id: 'stove' };
    const t = worldToTile(wp.x, wp.y, this.n);
    const o = this.state.openings.find((o) => !o.fixed && ((o.x === t.x && o.y === t.y) || this.onSpot(wp, o.x, o.y)));
    if (o) return { kind: 'object', id: o.id };
    return { kind: t.x < 0 || t.y < 0 || t.x >= this.n || t.y >= this.n ? 'none' : 'ground' };
  }

  /** Left click (DESIGN §1 *Mouse*): select a survivor, attack a zombie, cook at the stove or fix an opening, or walk (a quick second click runs). */
  private leftClick(p: Phaser.Input.Pointer): void {
    const wp = this.worldOf(p);
    if (this.pending && this.canOrder) {
      this.dbl.reset();
      return this.resolvePending(p, wp);
    }
    const who = this.chosen();
    const target = this.targetAt(wp);
    const action = resolveClick(target.kind, this.canOrder && who.length > 0);
    if (action !== 'walk') this.dbl.reset();
    const ids = who.map((u) => u.id);
    if (action === 'select') {
      this.selected = pressCard(this.state.survivors, this.selected, target.id!, p.event.shiftKey); // Shift adds
      this.sync(1);
    } else if (action === 'attack') {
      orderAttack(this.state, ids, target.id!);
    } else if (action === 'use') {
      if (target.id === 'stove') {
        const st = this.state.stove;
        this.report(orderCook(this.state, this.nearest(who, st.x, st.y)!.id));
      } else {
        const o = this.state.openings.find((o) => o.id === target.id)!;
        this.report(orderFix(this.state, this.nearest(who, o.x, o.y)!.id, o.id));
      }
    } else if (action === 'walk') {
      const t = worldToTile(wp.x, wp.y, this.n);
      const run = this.dbl.walkClick(p.x, p.y, p.downTime);
      if (orderMove(this.state, ids, [t.x, t.y], run).length === 0) return;
      const w = tileToWorld(t.x, t.y, this.n);
      this.ping.setPosition(w.x, w.y).setVisible(true).setAlpha(1);
      this.tweens.killTweensOf(this.ping);
      this.tweens.add({ targets: this.ping, alpha: 0, duration: 500, onComplete: () => this.ping.setVisible(false) });
    }
  }

  /** Hold and Fix end after their click; build stays armed so a fence can be laid segment by segment. */
  private resolvePending(p: Phaser.Input.Pointer, wp: { x: number; y: number }): void {
    const s = this.state;
    if (this.pending === 'hold') {
      const f = worldToTileF(wp.x, wp.y, this.n);
      for (const u of this.chosen()) orderHold(s, u.id, [f.x, f.y]);
      this.pending = null;
    } else if (this.pending === 'build') {
      const t = this.tileOf(p);
      const r = placeBarricade(s, t.x, t.y);
      if (r !== 'ok') this.toast(PLACE_REFUSED[r]);
      else if (s.scrap < base.barricade.cost) this.pending = null;
      this.syncBlockers();
    } else if (this.pending === 'fix') {
      const t = this.tileOf(p);
      const o = s.openings.find((o) => !o.fixed && ((o.x === t.x && o.y === t.y) || this.onSpot(wp, o.x, o.y)));
      if (!o) return this.toast('Click a broken window or door');
      const worker = this.nearest(this.chosen(), o.x, o.y);
      if (!worker) return;
      const r = orderFix(s, worker.id, o.id);
      this.report(r);
      if (r === 'ok') this.pending = null;
    } else if (this.pending === 'spike' || this.pending === 'can') {
      const t = this.tileOf(p);
      const worker = this.nearest(this.chosen(), t.x, t.y);
      if (!worker) return;
      const spent = trapAt(s, t.x, t.y);
      const r = spent && spent.kind === 'spike' && !spent.armed ? orderRearm(s, worker.id, spent.id) : orderTrap(s, worker.id, this.pending, t.x, t.y);
      if (r !== 'ok') this.toast(TRAP_REFUSED[r]);
      else this.pending = null;
    }
  }

  private boxSelect(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const a = this.worldOf(from);
    const b = this.worldOf(to);
    const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    this.selected.clear();
    for (const u of this.state.survivors) {
      const w = tileToWorld(u.x, u.y, this.n);
      const cy = w.y - PICK_H / 2; // the middle of the body
      if (u.hp > 0 && w.x >= x0 && w.x <= x1 && cy >= y0 && cy <= y1) this.selected.add(u.id);
    }
    this.sync(1);
  }

  /** Right-click gives no orders: it only cancels a pending V / B / X / T order (DESIGN §1 *Mouse*). */
  private rightClick(_p: Phaser.Input.Pointer): void {
    this.pending = null;
  }

  // ---- Frame ----

  private publish(): void {
    const s = this.state;
    const lines = this.chosen().map((u) => {
      const bits = [`${name(u)}  HP ${u.hp}`, u.stance];
      if (u.order?.type === 'hold') bits.push('holding');
      if (u.order?.type === 'work') bits.push(u.order.job === 'fix' ? 'fixing' : u.order.job === 'cook' ? 'cooking' : 'setting a trap');
      if (s.hunger[u.id]?.meal) bits.push('holding a meal');
      return bits.join('  ·  ');
    });
    const herdLeft = herdSeconds(s);
    const herdText = !s.herd.warned || s.status === 'success' ? '' : herdLeft > 0 ? `Herd in ${clock(herdLeft)}` : s.herd.spawned < base.herd.count ? 'The herd is coming in!' : 'Kill the herd';
    this.herdLabel.setText(herdText).setVisible(herdText !== '' && s.status === 'playing');
    this.registry.set('b_counters', lootCounters({ ammo: s.ammo, food: s.food, scrap: s.scrap, herd: herdText }));
    const word = (id: string): string => (options().cues ? hungerLabel(hungerLevel(s, id)).toLowerCase() : ''); // DESIGN §19: colour is not the only signal
    this.registry.set('b_hunger', s.survivors.map((u) => `${name(u)}  hunger ${u.hp > 0 ? clock(hungerSeconds(s, u.id)) : 'dead'}${u.hp > 0 && word(u.id) ? ` (${word(u.id)})` : ''}`).join('      '));
    const worst = s.survivors.some((u) => hungerLevel(s, u.id) === 'starving' || hungerLevel(s, u.id) === 'critical') ? '#e0806a' : s.survivors.some((u) => hungerLevel(s, u.id) === 'low') ? '#f0dc8a' : '#a8a69e';
    this.registry.set('b_hunger_color', worst);

    const first = this.chosen()[0];
    const bar: BarModel | null = first
      ? {
          name: name(first),
          hp: first.hp,
          buttons: baseButtons(s, first, this.pending),
          hunger: { frac: (s.hunger[first.id]?.left ?? 0) / HUNGER_TICKS, level: hungerLevel(s, first.id) },
          meal: s.hunger[first.id]?.meal ?? false,
        }
      : null;
    this.registry.set('m_bar', bar);
    this.squad.publish();
    this.registry.set('b_sel', lines.length ? lines.join('\n') : 'Nobody selected');

    const hint =
      this.pending === 'hold' ? 'Click where to hold (right-click cancels)'
      : this.pending === 'build' ? `Click a tile to build a barricade, ${base.barricade.cost} scrap each (right-click cancels)`
      : this.pending === 'fix' ? `Click a broken window or door: ${base.fix.time} s of work and ${base.fix.cost} scrap (right-click cancels)`
      : this.pending === 'spike' || this.pending === 'can' ? `Click a tile for a ${TRAP_NAME[this.pending]}, ${trapCost(this.pending)} scrap; click a spent pit to re-arm it; T switches type (right-click cancels)`
      : this.startHint();
    this.registry.set('b_hint', this.time.now < this.toastUntil ? this.toastText : hint);
    this.registry.set('b_objective', s.status === 'success' ? '' : objectiveText(s));
    let banner = '';
    if (s.status === 'failed') banner = `${failText(s)}\n${this.retryable() ? 'Enter: retry from the herd warning\nR: restart Base 1' : 'Press any key to try again.'}`;
    else if (this.won) banner = 'To be continued...  (Esc: menu)';
    else if (this.paused) banner = 'PAUSED  (Space to resume; no orders while paused)';
    this.registry.set('b_banner', banner);
  }

  /** The start hints (data/base1.json) one after another, each for HINT_MS of running time; none after the herd warning (DESIGN §12). */
  private startHint(): string {
    if (this.state.herd.warned || this.state.status !== 'playing') return '';
    const hints = base.hints;
    return hints[Math.floor(this.hintMs / HINT_MS)] ?? '';
  }

  /** Story moments from the sim, one per frame and never over an open dialogue: warning, arrival, win. */
  private storyEvents(): void {
    const s = this.state;
    if (this.eventsSeen >= s.events.length || this.scene.isActive(DIALOGUE_SCENE)) return;
    const e = s.events[this.eventsSeen++]!;
    const lines = (key: 'herdWarning' | 'base1Win'): DialogueLine[] => story.dialogue[key] as DialogueLine[];
    if (e.kind === 'herdWarning') openDialogue(this, lines('herdWarning'));
    else if (e.kind === 'herdArrives') {
      this.feel.herdArrives(base.herd.arrow[0]!, base.herd.row + 3); // flash and pan north (DESIGN §19)
      this.toastText = 'The herd is here!';
      this.toastUntil = this.time.now + BARK_MS;
    } else {
      this.saveDone();
      openDialogue(this, lines('base1Win'), () => (this.won = true));
    }
  }

  /** Base 1 is won: the save becomes `done`, so Continue shows "To be continued..." (DESIGN §18). */
  private saveDone(): void {
    const from = this.registry.get('campaign') as Campaign | null | undefined;
    if (!from || from.stage !== 'base1') return; // e.g. a debug start with no campaign: nothing to save
    const next = toDone(from);
    this.registry.set('campaign', next);
    saveCampaign(browserStorage(), next);
  }

  /** New barks from the sim ("I need to eat something.") show as a message for a few seconds. */
  private barks(): void {
    for (; this.saidSeen < this.state.said.length; this.saidSeen++) {
      const m = this.state.said[this.saidSeen]!;
      const who = this.state.survivors.find((u) => u.id === m.id);
      this.toastText = `${who ? name(who) : m.id}: "${m.text}"`;
      this.toastUntil = this.time.now + BARK_MS;
    }
  }

  update(_t: number, dt: number): void {
    this.view.update(dt);
    const p = this.input.activePointer;

    const running = this.state.status === 'playing' && !this.paused;
    if (running) {
      this.hintMs += Math.min(dt, 250);
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS; i++) {
        this.tickOnce();
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else this.acc = 0;
    const frac = running ? this.acc / STEP_MS : 1;
    this.sync(frac);
    this.feel.frame(this.state);
    this.scaleLabels();
    this.drawFx(frac);
    this.barks();
    this.storyEvents();

    if (this.state.status === 'failed') {
      this.endedAt += dt;
      if (this.endedAt >= RESTART_MS && !this.retryable()) this.scene.restart();
    }


    const t = this.tileOf(p);
    const inside = t.x >= 0 && t.y >= 0 && t.x < this.n && t.y < this.n && !this.onBar(p);
    this.hover.setVisible(inside).setTint(this.pending ? 0xe8c46a : 0xffffff);
    this.view.setCursor(this.onBar(p) ? 'default' : cursorFor(resolveClick(this.targetAt(this.worldOf(p)).kind, this.canOrder && this.chosen().length > 0), this.pending !== null && this.canOrder));
    if (inside) {
      const w = tileToWorld(t.x, t.y, this.n);
      this.hover.setPosition(w.x, w.y);
    }
    this.publish();
  }
}

/** Screen overlay over Base 1: resources, hunger, selection, hints, controls and the pause / fail banner. */
export class BaseHudScene extends Phaser.Scene {
  private counters!: CounterRow;
  private hungerIcon!: Phaser.GameObjects.Image;
  private hunger!: Phaser.GameObjects.Text;
  private objective!: Phaser.GameObjects.Text;
  private sel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private help!: Phaser.GameObjects.Text;

  constructor() {
    super('BaseHud');
  }

  create(): void {
    const { width, height } = this.scale;
    const box = { backgroundColor: '#1d201cb0', padding: { x: 10, y: 6 } };
    this.counters = new CounterRow(this, FONT);
    this.hungerIcon = uiImage(this, 'icon_hud_hunger', 16, 52, 24);
    this.hunger =this.add.text(16, 52, '', { fontFamily: FONT, fontSize: '16px', color: '#a8a69e', ...box });
    this.objective = this.add.text(16, 88, '', { fontFamily: FONT, fontSize: '18px', color: '#f0dc8a', ...box });
    this.sel = this.add.text(16, height - barH() - 12, '', { fontFamily: FONT, fontSize: '18px', color: '#e8e6de', ...box }).setOrigin(0, 1);
    this.hint = this.add.text(width / 2, height - barH() - 12, '', { fontFamily: FONT, fontSize: '20px', color: '#f0dc8a', wordWrap: { width: HINT_WRAP }, align: 'center', ...box }).setOrigin(0.5, 1);
    this.banner = this.add.text(width / 2, height * 0.35, '', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', backgroundColor: '#141614d0', padding: { x: 24, y: 14 }, align: 'center' }).setOrigin(0.5);
    this.help = this.add.text(width - 16, 14, fillHelp(HELP), {
      fontFamily: FONT, fontSize: '13px', color: '#a8a69e', align: 'right',
    }).setOrigin(1, 0);
  }

  /** Text size (DESIGN §19): sizes and rows follow the option each frame, so a change in the pause menu applies at once. */
  private layout(): void {
    this.help.setText(fillHelp(HELP)); // a key rebound in the pause menu shows at once
    const { height } = this.scale;
    scaleText(this.hunger, 16, 10, 6);
    scaleText(this.objective, 18, 10, 6);
    scaleText(this.sel, 18, 10, 6);
    scaleText(this.hint, 20, 10, 6);
    scaleText(this.banner, 34, 24, 14);
    sizeBanner(this.banner, this.scale.width);
    const icon = ui(24); // the hunger line starts after its icon (DESIGN §19 UI art)
    this.hungerIcon.setDisplaySize(icon, icon).setPosition(16, ui(52) + Math.round((this.hunger.height - icon) / 2));
    placeText(this.hunger, 16 + icon + 4, 52);
    placeText(this.objective, 16, 88);
    this.sel.setPosition(16, height - barH() - 12);
  }

  update(): void {
    this.layout();
    const r = this.registry;
    this.counters.update((r.get('b_counters') as Counter[] | undefined) ?? [], 16, 12);
    this.hunger.setText((r.get('b_hunger') as string | undefined) ?? '').setColor((r.get('b_hunger_color') as string | undefined) ?? '#a8a69e');
    const objective = (r.get('b_objective') as string | undefined) ?? '';
    this.objective.setText(objective).setVisible(objective !== '');
    this.sel.setText((r.get('b_sel') as string | undefined) ?? '');
    const hint = (r.get('b_hint') as string | undefined) ?? '';
    this.hint.setText(fillHelp(hint)).setVisible(hint !== '');
    placeHint(this.hint, this.sel, this.scale.width);
    const banner = (r.get('b_banner') as string | undefined) ?? '';
    this.banner.setText(banner).setVisible(banner !== '');
  }
}
