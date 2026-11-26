import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import m01 from '../data/missions/m01.json';
import m02 from '../data/missions/m02.json';
import { type P, circlePoints, conePolygon, ringLook, sightPolygon, survivorCone } from '../render/cones';
import { NOISE_DASH, dashSegments } from '../render/cues';
import { type ClickTarget, DoubleClick, cursorFor, finishCursor, resolveClick } from '../render/click';
import { tileToWorld, worldBounds, worldToTile, worldToTileF } from '../render/iso';
import { Occlusion } from '../render/occlude';
import { EnemyHighlight } from '../render/highlight';
import { Ghosts, HoverOutline } from '../render/outline';
import { addSprite, anchorOf, boxOf } from '../render/placeholders';
import { BORDER, bushKey, groundKey, pathTiles, wallRun, wallVariantKey, bloodKey, mapTreeKey, roofPieces } from '../render/terrain';
import { addForestFront, addHousePieces, bakeGround } from './ground';
import { type HouseMap, clearingOf, houseDressing, housePieces } from '../render/dressing';
import { changeScene } from './Card';
import { UnitSprite } from '../render/units';
import { barButtons, canCarry, canFreeFire, canLure, canTakedown, finishAvailable, finisherFor, orderFinish, orderOpen, orderTakedown, selectWeapon, setFreeFire, toggleCarry, useLure } from '../sim/abilities';
import { enemyViewer } from '../sim/ai';
import { BOND_REFUSAL_TEXT, bondAim, bondPlaying, startBond } from '../sim/bond';
import { drawBondAim, followBond } from './bondView';
import { activeWeapon } from '../sim/combat';
import { type Campaign, browserStorage, newCampaign, saveCampaign, toBase1 } from '../sim/campaign';
import { TICK_HZ } from '../sim/time';
import { BUSH, COVER, TREE, WALL } from '../sim/grid';
import { type BunkerSpec, type Cache, type DoorBeat, type DoorScene, doorFocus, doorLinesDone, doorWaits, newDoorScene, stepDoor } from '../sim/bunker';
import type { SpeakerBeat } from '../sim/speaker';
import {
  type MissionSpec,
  type MissionState,
  type Stance,
  type Survivor,
  type SurvivorKind,
  newSurvivor,
  createMission,
  riseIn,
  failText,
  withDifficulty,
  withLayout,
  rollLayout,
  nextStance,
  orderAttack,
  orderMove,
  orderHold,
  setStance,
  stepMission,
  survivorViewer,
  underRoof,
  SURVIVOR_NAME,
} from '../sim/mission';

import story from '../data/story.json';
import type { DialogueLine } from '../sim/dialogue';
import { ACTION_EVENT, type BarModel, HINT_WRAP, SKIP_AFTER_MS, barH, overBar, placeHint } from './ActionBar';
import { options } from '../sim/options';
import { CounterRow } from './counters';
import { scaleText, sizeBanner } from './uiScale';
import { type Counter, lootCounters } from '../render/uiview';
import { FOOD_SHOWN } from '../sim/food';
import { pressCard } from '../render/squad';
import { FOG_LEVEL } from '../render/atmos';
import { publishAtmos, startAtmos } from './Atmos';
import { Feel } from './feelFx';
import { BowView } from './bowView';
import { recordRun } from '../sim/records';
import { type Rescue, type RescueBeat, linesDone, newRescue, rescueFocus, startAmbush, stepRescue, waitsForLines } from '../sim/rescue';
import { missionResult, observeStats } from '../sim/stats';
import { openDebrief } from './Debrief';
import { ViewInput } from './input';
import { bindSquad, overSquad } from './Squad';
import { openDialogue } from './Dialogue';
import { progressOfMission } from '../sim/bios';
import { bindPause } from './Pause';
import { bindActionKeys, fillHelp } from './actionKeys';
import { highlightAvailable, highlighted } from '../sim/highlight';

const STEP_MS = 1000 / TICK_HZ;
const PICK_W = 16; // half-width and height (world px) of a unit's click target
const PICK_H = 44;
const RESTART_MS = 2500;
const HINT_MS = 5000; // each entry hint stays this long
const ROOF_H = 52; // roof height above the floor (world px)
const ROOF_FADE_MS = 700;
const TALK_LIFT = 110; // screen px the rescue talk's camera sits below the four, so they show above the dialogue box
const FONT = GAME_FONT;

/** The key lines in the HUD corner and on the pause menu's Controls page. */
// `{action}` is filled with the live key (rebindable, `fillHelp`).
const HELP = 'Drag: box select    Left-click: select / move / attack / open crate (double-click: run)    Right-click: cancel\n{crouch}: stance    {hold}: hold    {freefire}: free fire    {takedown}: takedown    {carry}: carry body    {lure}: lure    {bond}: bond move    {weapon1} / {weapon2} / {weapon3}: weapon\n{freeze}: pause    {alert}: jump to attack    R: restart    Esc: menu\n{select1} / {select2} / {cycle}: select survivor    Shift-click: add to selection    Double-click a squad card: centre';
const NOISE_COLOR: Record<string, number> = { step: 0xd8d8d0, shot: 0xe0a45a, lure: 0x8fb4d8, alarm: 0xd85a4a };

type Pending = null | 'hold' | 'takedown' | 'lure' | 'bond' | 'finish';
type Ord =
  | { type: 'move'; ids: string[]; to: [number, number]; run?: boolean }
  | { type: 'hold'; id: string; toward: [number, number] }
  | { type: 'attack'; ids: string[]; target: string }
  | { type: 'takedown'; id: string; target: string }
  | { type: 'open'; id: string; crate: string }
  | { type: 'lure'; id: string; at: [number, number] }
  | { type: 'bond'; at: [number, number] }
  | { type: 'carry'; id: string }
  | { type: 'finish'; id: string; body: string }
  | { type: 'stance'; id: string; stance: Stance };

const name = (u: Survivor): string => SURVIVOR_NAME[u.kind]; // player-visible: Cass, Eli (DESIGN §5)

/** A mission's data file: the sim spec plus what only the scene draws (the house, its roof pieces, hints, Mission 2's bunker). */
type MissionData = MissionSpec & HouseMap & { chimney?: { x: number; y: number }; hints?: string[]; bunker?: BunkerSpec; cache?: Cache };
const MISSIONS: Readonly<Record<string, MissionData>> = { m01: m01 as unknown as MissionData, m02: m02 as unknown as MissionData };
/** Mission 2's estate props (DESIGN §26), by map character; every other cover tile is drawn as `cover`. */
const PROP_KEY: Readonly<Record<string, string>> = { f: 'fence', G: 'gate', s: 'solar_panel', i: 'inverter', g: 'generator', p: 'intercom' };
const SPEAKER_MS = 5500; // each speaker subtitle stays this long (DESIGN §26: bark-style, the game never pauses)
const SPEAKER_LINES = (story as unknown as { speaker: Record<SpeakerBeat, string[]> }).speaker;

/**
 * Mission scene (DESIGN §3, §6, §7, §8, §13, §14): m01 on the stealth sim. Draws the state, vision
 * cones and noise rings, and sends orders. All rules live in `src/sim/`.
 */
export class MissionScene extends Phaser.Scene {
  private n = 32;
  private missionId = 'm01'; // `m01` or `m02` (Mission 2, DESIGN §26); a restart keeps it
  private md!: MissionData; // the mission's data file
  private door: DoorScene | null = null; // Mission 2's door scene after the last squatter (DESIGN §26); input stays locked while it plays
  private doorSeen: DoorBeat | null = null;
  private doorSprite: Phaser.GameObjects.Image | null = null;
  private spoken = 0; // speaker beats already queued
  private subtitles: string[] = []; // speaker lines still to show
  private subtitleUntil = 0;
  private subtitle = '';
  private state!: MissionState;
  private campaign: Campaign | null = null; // set by the menu or the Intro; its ammo is the Intro's leftover
  private won = false;
  private rescue: Rescue | null = null; // the scripted rescue after the win (DESIGN §16); input stays locked while it plays
  private rescueSeen: RescueBeat | null = null; // the last beat the scene reacted to (lines opened, camera moved)
  private leaving = false; // Base 1 is starting: the dialogue's close may resume this scene for one more frame
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Image;
  private ping!: Phaser.GameObjects.Image;
  private view!: ViewInput;
  private feel!: Feel;
  private bow!: BowView; // arrows on the ground and Ray's Tracker marks (DESIGN §5)
  private units = new Map<string, UnitSprite>();
  private bodySprites = new Map<string, Phaser.GameObjects.Image>();
  /** The faint seconds-left label over each body that will rise (DESIGN §26), by body id. */
  private riseLabels = new Map<string, Phaser.GameObjects.Text>();
  private crateSprites = new Map<string, Phaser.GameObjects.Image>();
  private decalCount = 0;
  private prev = new Map<string, [number, number]>();
  private selected = new Set<string>();
  private squad!: { publish: () => void };
  private pending: Pending = null;
  private readonly dbl = new DoubleClick();
  private paused = false;
  private acc = 0;
  private endedAt = 0;
  private toastText = '';
  private toastUntil = 0;
  private roofGfx: Phaser.GameObjects.Container | null = null;
  private occlusion!: Occlusion<Phaser.GameObjects.Image>;
  private outline!: HoverOutline;
  private ghosts!: Ghosts;
  private marks!: EnemyHighlight; // Theo's enemy highlight (DESIGN §5)
  private highlight = false; // its toggle; off at every scene start
  private roofFading = false;
  private hintIdx = -1;
  private hintUntil = 0;

  constructor() {
    super('Mission');
  }

  create(data?: { restart?: boolean; mission?: string }): void {
    const restarted = data?.restart === true;
    this.missionId = data?.mission ?? (restarted ? this.missionId : 'm01');
    this.sys.settings.data = {}; // Phaser keeps start data across starts: a later entry from the Intro or the menu is a fresh one
    this.campaign = (this.registry.get('campaign') as Campaign | null | undefined) ?? null;
    const m = MISSIONS[this.missionId] ?? MISSIONS.m01!;
    this.md = m;
    // Each start and restart shuffles the zombie spots and crates (DESIGN §21 run shuffles) and reads the Options
    // difficulty; the state keeps the level for the record.
    const spec = withLayout(m, rollLayout(m));
    this.state = createMission(withDifficulty(this.campaign?.stage === 'mission1' && this.missionId === 'm01' ? { ...spec, ammo: this.campaign.ammo } : spec, options().difficulty));
    this.won = false;
    this.rescue = null;
    this.door = null;
    this.doorSeen = null;
    this.doorSprite = null;
    this.spoken = 0;
    this.subtitles = [];
    this.subtitleUntil = 0;
    this.subtitle = '';
    this.rescueSeen = null;
    this.leaving = false;
    this.n = this.state.grid.size;
    this.units.clear();
    this.bodySprites.clear();
    this.riseLabels.clear();
    this.crateSprites.clear();
    this.prev.clear();
    this.selected.clear();
    this.decalCount = 0;
    this.pending = null;
    this.paused = false;
    this.acc = 0;
    this.endedAt = 0;
    this.toastText = '';
    this.roofGfx = null;
    this.roofFading = false;
    this.hintIdx = -1;
    this.hintUntil = 0;

    this.drawWorld();
    this.drawRoof();
    this.outline = new HoverOutline(this);
    this.ghosts = new Ghosts(this);
    this.marks = new EnemyHighlight(this);
    this.highlight = false;
    this.fx = this.add.graphics().setDepth(0.3);
    this.hover = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5);
    this.ping = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
    this.bars = this.add.graphics().setDepth(850);
    for (const u of this.state.survivors) {
      const ring = this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de);
      this.units.set(u.id, new UnitSprite(this, u, ring));
    }
    for (const e of this.state.enemies) this.units.set(e.id, new UnitSprite(this, e));
    this.sync(1);

    const mid = tileToWorld(
      this.state.survivors.reduce((a, u) => a + u.x, 0) / this.state.survivors.length,
      this.state.survivors.reduce((a, u) => a + u.y, 0) / this.state.survivors.length,
      this.n,
    );
    this.view = new ViewInput(this, {
      bounds: () => worldBounds(this.n),
      blocked: (p) => this.onBar(p),
      onLeft: (p) => this.leftClick(p),
      onRight: (p) => this.rightClick(p),
      onBox: (a, b) => this.boxSelect(a, b),
    });
    this.view.start(mid.x, mid.y);
    this.feel = new Feel(this, { n: () => this.n, view: () => this.view, sprites: () => this.units });
    this.bow = new BowView(this, () => this.n, (x, y) => this.hidden(x, y));
    this.squad = bindSquad(this, {
      units: () => this.state.survivors,
      nameOf: (id) => name(this.state.survivors.find((u) => u.id === id)!),
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

    const kb = this.input.keyboard!;
    bindActionKeys(this, {
      freeze: () => this.togglePause(),
      alert: () => this.feel.jump() || this.toast('Nothing is under attack'),
      crouch: () => this.cycleStance(),
      hold: () => this.arm('hold'),
      takedown: () => this.arm('takedown'),
      lure: () => this.arm('lure'),
      finish: () => this.arm('finish'),
      bond: () => this.arm('bond'),
      carry: () => this.carry(),
      freefire: () => this.onAction('freefire'),
      highlight: () => this.onAction('highlight'),
      weapon1: () => this.chooseWeapon(0),
      weapon2: () => this.chooseWeapon(1),
      weapon3: () => this.chooseWeapon(2),
    });
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.state.status === 'failed' && e.key !== 'Escape' && this.endedAt >= SKIP_AFTER_MS) this.endedAt = RESTART_MS;
    });
    bindPause(this, {
      cancelPending: () => {
        const had = this.pending !== null;
        this.pending = null;
        return had;
      },
      failed: () => this.state.status === 'failed',
      restart: () => this.scene.restart({ restart: true, mission: this.missionId }),
      quit: () => this.leave(),
      controls: () => {
        const extra = [finishAvailable(this.state) ? '{finish}: finish a fallen squatter before they turn' : '', highlightAvailable(this.state) ? '{highlight}: enemy highlight' : ''];
        return fillHelp([HELP, ...extra.filter(Boolean)].join('\n')).split('\n');
      },
      hints: () => (this.md.hints ?? []).map(fillHelp),
      progress: () => progressOfMission(this.state),
    });

    startAtmos(this);
    this.scene.launch('MissionHud');
    this.scene.launch('ActionBar');
    this.scene.launch('Squad');
    this.scene.launch('Feel');
    this.game.events.on(ACTION_EVENT, this.onAction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('MissionHud');
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
        say: (lines: DialogueLine[]) => openDialogue(this, lines),
        join: (id: string, kind: SurvivorKind, x: number, y: number) => {
          this.state.survivors.push(newSurvivor(id, kind, x, y));
          this.sync(1);
        },
      };
    }
    // The bond move is taught by a short Cass/Eli exchange on the first entry (DESIGN §23); a restart skips it.
    if (!restarted && this.missionId === 'm01') openDialogue(this, story.dialogue.m01Start as DialogueLine[]);
  }

  /** Quit from the pause menu: back to the title; the save already names this mission's start. */
  private leave(): void {
    delete (window as unknown as { dw?: unknown }).dw;
    changeScene(this, 'Menu');
  }

  /**
   * All clear: the run is filed, then the rescue plays (DESIGN §16 *The rescue*): Eli's line, six zombies from the
   * treeline, the alarm lines, arrows from off-screen, Ray and June walk in, `m01Rescue`. Then the Debrief, and Base 1
   * is saved as the next scene with all four on their end tiles (loot and unspent ammo carried) and starts.
   */
  private win(): void {
    this.won = true;
    this.pending = null;
    if (this.md.bunker) return this.winEstate(this.md.bunker);
    // The run is filed at once (DESIGN §21), so quitting during the rescue or the debrief still keeps it; the rescue's kills are not the player's.
    const result = missionResult(this.state);
    const filed = recordRun(browserStorage(), result, this.state.difficulty);
    this.rescue = newRescue();
    this.onRescueDone = () =>
      openDebrief(this, result, filed, () => {
        this.leaving = true;
        delete (window as unknown as { dw?: unknown }).dw;
        const s = this.state;
        const next = toBase1(this.campaign ?? newCampaign(), { food: s.loot.food, scrap: s.loot.scrap, ammo: s.ammo, start: s.survivors.filter((u) => u.hp > 0).map((u) => ({ id: u.id, x: Math.round(u.x), y: Math.round(u.y), facing: [u.facing[0], u.facing[1]] })) });
        this.registry.set('campaign', next);
        saveCampaign(browserStorage(), next);
        changeScene(this, 'Base');
      });
  }

  private onRescueDone: () => void = () => {};

  /**
   * Mission 2's last squatter is down (DESIGN §26): the door scene plays (the squad gathers, Theo's lines, the door
   * opens and he walks out, the meeting), then the run is filed and the Debrief shows, then back to the title. Base 2
   * and the save come with Z94 / Z100.
   */
  private winEstate(b: BunkerSpec): void {
    this.door = newDoorScene(this.state, b);
    this.subtitles = [];
    this.subtitleUntil = 0;
    this.onRescueDone = () => {
      // filed after the door opens, so the Debrief's numbers include the cache
      const result = missionResult(this.state);
      const filed = recordRun(browserStorage(), result, this.state.difficulty);
      openDebrief(this, result, filed, () => {
        this.leaving = true;
        this.leave();
      });
    };
  }

  /** True while a moving beat of the door scene runs. */
  private get doorMoving(): boolean {
    return this.door !== null && !doorWaits(this.door) && this.door.beat !== 'done';
  }

  /** A new door-scene beat opens its lines and moves the camera to the bunker door. */
  private playDoor(d: DoorScene, b: BunkerSpec): void {
    if (d.beat === this.doorSeen) return;
    this.doorSeen = d.beat;
    const [x, y] = doorFocus(b);
    const w = tileToWorld(x, y, this.n);
    const cache = this.md.cache ?? { ammo: 0, scrap: 0 };
    if (d.beat === 'gather') this.view.glideTo(w.x, w.y - PICK_H / 2, 1200);
    else if (d.beat === 'power') {
      this.view.centreOn(w.x, w.y + TALK_LIFT / this.cameras.main.zoom);
      openDialogue(this, story.dialogue.m02Power as DialogueLine[], () => {
        doorLinesDone(this.state, d, b, cache);
        this.doorSprite?.destroy(); // the door slides open: its tile is floor now
        this.doorSprite = null;
        this.sync(1);
      });
    } else if (d.beat === 'talk') openDialogue(this, story.dialogue.m02Meet as DialogueLine[], () => doorLinesDone(this.state, d, b, cache));
    else if (d.beat === 'done') this.onRescueDone();
  }

  /** New speaker beats queue their lines; one subtitle shows at a time, in the hint line (DESIGN §26). */
  private speaker(): string {
    const sp = this.state.speaker;
    if (sp) for (; this.spoken < sp.said.length; this.spoken++) this.subtitles.push(...(SPEAKER_LINES[sp.said[this.spoken]!] ?? []));
    if (this.time.now >= this.subtitleUntil) {
      this.subtitle = this.subtitles.shift() ?? '';
      this.subtitleUntil = this.subtitle ? this.time.now + SPEAKER_MS : 0;
    }
    return this.subtitle;
  }

  /** True while a moving beat of the rescue runs (the sprites interpolate between its ticks). */
  private get rescueMoving(): boolean {
    return this.rescue !== null && !waitsForLines(this.rescue) && this.rescue.beat !== 'done';
  }

  /** A new rescue beat opens its lines (Esc skips a line, never the kills) and moves the camera. */
  private playRescue(r: Rescue): void {
    if (r.beat === this.rescueSeen) return;
    this.rescueSeen = r.beat;
    const lines = story.dialogue.m01Ambush as DialogueLine[];
    const look = (ms: number): void => {
      const [x, y] = rescueFocus(this.state, r);
      const w = tileToWorld(x, y, this.n);
      this.view.glideTo(w.x, w.y - PICK_H / 2, ms);
    };
    if (r.beat === 'ambush')
      openDialogue(this, lines.slice(0, 1), () => {
        startAmbush(this.state, r);
        this.sync(1);
      });
    else if (r.beat === 'walk') {
      const w = tileToWorld(r.from[0], r.from[1], this.n);
      this.view.glideTo(w.x, w.y - PICK_H / 2, 1200);
    } else if (r.beat === 'alarm') openDialogue(this, lines.slice(1), () => linesDone(r));
    else if (r.beat === 'arrows') look(800);
    else if (r.beat === 'walkIn') look(1500);
    else if (r.beat === 'talk') {
      // The lines pause this scene, and a glide with it: cut straight to the four, a little above the dialogue box.
      const [x, y] = rescueFocus(this.state, r);
      const w = tileToWorld(x, y, this.n);
      this.view.centreOn(w.x, w.y + TALK_LIFT / this.cameras.main.zoom);
      openDialogue(this, story.dialogue.m01Rescue as DialogueLine[], () => linesDone(r));
    } else if (r.beat === 'done') this.onRescueDone();
  }

  private debugOrder(o: Ord): void {
    const s = this.state;
    switch (o.type) {
      case 'move': orderMove(s, o.ids, o.to, o.run); break;
      case 'hold': orderHold(s, o.id, o.toward); break;
      case 'attack': orderAttack(s, o.ids, o.target); break;
      case 'takedown': orderTakedown(s, o.id, o.target); break;
      case 'open': orderOpen(s, o.id, o.crate); break;
      case 'lure': useLure(s, o.id, o.at); break;
      case 'bond': startBond(s, o.at); break;
      case 'carry': toggleCarry(s, o.id); break;
      case 'finish': orderFinish(s, o.id, o.body); break;
      case 'stance': setStance(s, o.id, o.stance); break;
    }
  }

  /** Ground, the extract zone, walls, fence, bushes, trees and crates. Upright things sort by foot y. */
  private drawWorld(): void {
    const s = this.state;
    const n = this.n;
    const z = s.extract;
    const d = this.md;
    const path = pathTiles(d.map);
    const house = d.roof; // the wood floor of the house
    const floor = (x: number, y: number) => house && x >= house.x && y >= house.y && x < house.x + house.w && y < house.y + house.h && s.grid.tiles[y * n + x] !== WALL;
    const clearing = clearingOf(d);
    bakeGround(this, n, (x, y) => (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h ? 'tile_extract' : d.map[y]?.[x] === 'q' ? 'floor_concrete' : floor(x, y) ? 'floor_wood' : groundKey(x, y, n, path)), houseDressing(s.grid, z, d));
    this.occlusion = new Occlusion(n, BORDER);
    addForestFront(this, n, this.occlusion);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const w = tileToWorld(x, y, n);
        const k = s.grid.tiles[y * n + x];
        const ch = d.map[y]![x]!;
        const key = ch === 'D' ? 'bunker_door' : k === WALL ? wallVariantKey(wallRun(s.grid, x, y), x, y) : k === TREE ? mapTreeKey(s.grid, x, y, clearing) : k === COVER ? (PROP_KEY[ch] ?? 'cover') : k === BUSH ? bushKey(x, y) : null;
        if (!key) continue;
        const img = addSprite(this, key, w.x, w.y, w.y + (k === BUSH ? 1 : 0));
        if (k === WALL || k === TREE) this.occlusion.add(x, y, img, boxOf(key, w.x, w.y));
        if (ch === 'D') this.doorSprite = img;
      }
    }
    addHousePieces(this, n, housePieces(d), this.occlusion);
    for (const c of s.crates) {
      const w = tileToWorld(c.x, c.y, n);
      this.crateSprites.set(c.id, addSprite(this, 'crate_closed', w.x, w.y, w.y));
    }
  }


  /** The roof: a grey box over the house footprint, gone for good once a survivor has entered (DESIGN §16). */
  private drawRoof(): void {
    const r = this.state.roof;
    if (!r || this.state.roofOpen) return;
    const n = this.n;
    const [x0, y0, x1, y1] = [r.x - 0.5, r.y - 0.5, r.x + r.w - 0.5, r.y + r.h - 0.5];
    const up = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - ROOF_H });
    const A = tileToWorld(x0, y0, n);
    const B = tileToWorld(x1, y0, n);
    const C = tileToWorld(x1, y1, n);
    const D = tileToWorld(x0, y1, n);
    // The roof fascia follows the edge of the tile art. The cabin walls show below it.
    const fascia = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - ROOF_H + 5 });
    const g = this.add.graphics();
    g.fillStyle(0x363b3f, 1).fillPoints([fascia(B), fascia(C), up(C), up(B)], true);
    g.fillStyle(0x4b5358, 1).fillPoints([fascia(D), fascia(C), up(C), up(D)], true);
    const tops: Phaser.GameObjects.Image[] = [];
    for (let ty = r.y; ty < r.y + r.h; ty++) {
      for (let tx = r.x; tx < r.x + r.w; tx++) {
        const w = tileToWorld(tx, ty, n);
        tops.push(addSprite(this, 'roof_top', w.x, w.y - ROOF_H));
      }
    }
    const edge = this.add.graphics();
    edge.lineStyle(2, 0x2a2a27, 1).strokePoints([up(A), up(B), up(C), up(D)], true);
    // The gable on top (art/STYLE.md *Visual pass*): trim on the edges, the ridge, the chimney; back to front.
    // An `sw` piece is the `se` art mirrored.
    const { ridge, trim } = roofPieces(r);
    const pieces = [...trim.map((t) => ({ ...t, key: 'roof_trim' })), ...ridge.map((t) => ({ ...t, key: 'roof_ridge' }))];
    if (this.md.chimney) pieces.push({ ...this.md.chimney, run: 'se', key: 'roof_chimney' });
    const upper = pieces
      .map((pc) => ({ pc, w: tileToWorld(pc.x, pc.y, n) }))
      .sort((a, b) => a.w.y - b.w.y || a.w.x - b.w.x)
      .map(({ pc, w }) => addSprite(this, pc.key, w.x, w.y - ROOF_H).setFlipX(pc.run === 'sw'));
    this.roofGfx = this.add.container(0, 0, [g, ...tops, edge, ...upper]).setDepth(C.y + 2);
  }

  /** Under a closed roof: units, crates and bodies are not drawn and cannot be picked. */
  private hidden(x: number, y: number): boolean {
    return !this.state.roofOpen && underRoof(this.state, x, y);
  }

  private at(u: { id: string; x: number; y: number }, frac: number): [number, number] {
    const p = this.prev.get(u.id) ?? [u.x, u.y];
    return [p[0] + (u.x - p[0]) * frac, p[1] + (u.y - p[1]) * frac];
  }

  /** Puts every sprite at its tile, `frac` of the way from the last tick to this one. */
  private sync(frac: number): void {
    const s = this.state;
    const n = this.n;
    for (const u of [...s.survivors, ...s.enemies]) {
      let sp = this.units.get(u.id);
      if (!sp) {
        // a survivor who joined mid-scene (the Z82 rescue; the `join` debug hook)
        const ring = u.side === 'survivor' ? this.add.image(0, 0, 'tile_hover').setOrigin(...anchorOf('tile_hover')).setVisible(false).setDepth(0.5).setTint(0xe8e6de) : undefined;
        sp = new UnitSprite(this, u, ring);
        this.units.set(u.id, sp);
      }
      const [x, y] = this.at(u, frac);
      const drawn = sp.update(u, s.tick, frac, this.hidden(u.x, u.y));
      sp.ring?.setVisible(false);
      if (!drawn) {
        sp.showCue(u, false, 0, 0);
        continue;
      }
      const w = tileToWorld(x, y, n);
      sp.body.setPosition(w.x, w.y).setDepth(w.y);
      sp.showCue(u, true, w.x, w.y);
      if (u.hp <= 0) sp.body.clearTint();
      else if (u.side === 'survivor') {
        sp.ring?.setPosition(w.x, w.y).setVisible(this.selected.has(u.id));
      } else {
        const m = u.ai.mode;
        if (m === 'alert' || m === 'chase') sp.body.setTint(0xff8a78);
        else if (m === 'investigate' || m === 'body' || m === 'search') sp.body.setTint(0xf0dc8a);
        else sp.body.clearTint();
      }
    }
    for (const b of s.bodies) {
      let img = this.bodySprites.get(b.id);
      if (!img) {
        img = addSprite(this, 'body', 0, 0);
        this.bodySprites.set(b.id, img);
      }
      const carrier = b.carriedBy ? s.survivors.find((u) => u.id === b.carriedBy) : undefined;
      const [bx, by] = carrier ? this.at(carrier, frac) : [b.x, b.y];
      const w = tileToWorld(bx, by, n);
      const shown = !this.hidden(bx, by) && !this.units.get(b.id)?.dying;
      img.setPosition(w.x, w.y - (carrier ? 16 : 0)).setDepth(carrier ? w.y + 1 : w.y - 1).setVisible(shown);
      this.syncRiseLabel(b, shown, w.x, w.y - (carrier ? 16 : 0));
    }
    this.dropGoneBodies();
    for (; this.decalCount < s.decals.length; this.decalCount++) {
      const d = s.decals[this.decalCount]!;
      const w = tileToWorld(d.x, d.y, n);
      addSprite(this, bloodKey(d.x, d.y), w.x, w.y, 0.2);
    }
    for (const c of s.crates) this.crateSprites.get(c.id)!.setTexture(c.opened ? 'crate_open' : 'crate_closed').setVisible(!this.hidden(c.x, c.y));
    this.syncHighlight(frac);
  }

  /** The faint countdown over a body that will rise as a zombie (DESIGN §26); none over one that never will. */
  private syncRiseLabel(b: MissionState['bodies'][number], shown: boolean, x: number, y: number): void {
    const left = riseIn(this.state, b);
    let label = this.riseLabels.get(b.id);
    if (left === null) {
      label?.destroy();
      this.riseLabels.delete(b.id);
      return;
    }
    if (!label) {
      label = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', color: '#c8d0b8' }).setOrigin(0.5, 1).setAlpha(0.55);
      this.riseLabels.set(b.id, label);
    }
    label.setText(String(left)).setPosition(x, y - 14).setDepth(y + 2).setVisible(shown);
  }

  /** A body that rose (or is otherwise gone from the state) loses its sprite and label. */
  private dropGoneBodies(): void {
    if (this.bodySprites.size === this.state.bodies.length) return;
    const ids = new Set(this.state.bodies.map((b) => b.id));
    for (const [id, img] of this.bodySprites) {
      if (ids.has(id)) continue;
      img.destroy();
      this.bodySprites.delete(id);
      this.riseLabels.get(id)?.destroy();
      this.riseLabels.delete(id);
    }
  }

  /** Every living enemy marked while the highlight is on, under a roof too (DESIGN §5). */
  private syncHighlight(frac: number): void {
    this.marks.sync(this.highlight ? highlighted(this.state) : [], (e) => this.units.get(e.id)!.body, (e) => tileToWorld(...this.at(e, frac), this.n));
  }

  private tickOnce(): void {
    for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
    stepMission(this.state);
    observeStats(this.state);
  }

  // ---- Drawing the cones, rings and health bars each frame ----

  /** While Hold is being aimed, the pointer in tile space (the live cone follows it, DESIGN §13); else null. */
  private aimPoint(): P | null {
    if (!(this.pending === 'hold' && this.canOrder)) return null;
    const p = this.input.activePointer;
    if (this.onBar(p)) return null;
    const w = this.worldOf(p);
    const f = worldToTileF(w.x, w.y, this.n);
    return [f.x, f.y];
  }

  /** While the bond move is being aimed, the pointer in tile space (the circle follows it, DESIGN §23); else null. */
  private bondPoint(): P | null {
    if (!(this.pending === 'bond' && this.canOrder)) return null;
    const p = this.input.activePointer;
    if (this.onBar(p)) return null;
    const f = worldToTileF(this.worldOf(p).x, this.worldOf(p).y, this.n);
    return [f.x, f.y];
  }

  private fill(pts: P[], color: number, alpha: number, outline = 0): void {
    const w = pts.map(([x, y]) => tileToWorld(x, y, this.n));
    this.fx.fillStyle(color, alpha).fillPoints(w, true);
    if (outline > 0) this.fx.lineStyle(1, color, outline).strokePoints(w, true);
  }

  private drawFx(frac: number): void {
    const s = this.state;
    this.fx.clear();
    this.bars.clear();
    for (const e of s.enemies) {
      if (e.hp <= 0 || this.hidden(e.x, e.y)) continue;
      const [x, y] = this.at(e, frac);
      const v = { ...enemyViewer(e, undefined, s.difficulty), x, y };
      if (e.kind === 'human') {
        this.fill(conePolygon(s.grid, v), 0xe0c040, 0.14, 0.4); // far half: sees standing survivors
        this.fill(conePolygon(s.grid, v, v.range / 2), 0xd04030, 0.22, 0.5); // near half: sees anyone
      } else this.fill(sightPolygon(s.grid, x, y, v.range), 0x9a9a92, 0.1, 0.3); // zombie: faint grey sight circle
    }
    const aim = this.aimPoint();
    for (const u of s.survivors) {
      if (u.hp <= 0) continue;
      const [x, y] = this.at(u, frac);
      const v = { ...survivorViewer(u), x, y };
      const cone = survivorCone(s.grid, v, u.order?.type === 'hold', aim && this.selected.has(u.id) ? aim : null);
      if (cone) this.fill(cone, 0x58c070, u.order?.type === 'hold' && !aim ? 0.24 : 0.16, u.order?.type === 'hold' && !aim ? 0.8 : 0.6);
    }
    const bondAt = this.bondPoint();
    if (bondAt) drawBondAim(this.fx, s, this.n, bondAt);
    for (const r of s.rings) {
      const look = ringLook(r.radius, r.age);
      const w = circlePoints(r.x, r.y, look.r).map(([px, py]) => tileToWorld(px, py, this.n));
      this.fx.lineStyle(2, NOISE_COLOR[r.kind] ?? 0xd8d8d0, look.alpha);
      const dash = options().cues ? NOISE_DASH[r.kind] : NOISE_DASH.step; // DESIGN §19: each noise kind has its own line style
      for (const run of dashSegments(w.map((q): [number, number] => [q.x, q.y]), dash.on, dash.off)) this.fx.strokePoints(run.map(([px, py]) => ({ x: px, y: py })));
    }
    for (const u of s.enemies) {
      if (u.hp <= 0 || u.hp >= u.maxHp || this.hidden(u.x, u.y)) continue; // no life bar over a survivor (DESIGN §17)
      const [x, y] = this.at(u, frac);
      const w = tileToWorld(x, y, this.n);
      const top = w.y - 52;
      this.bars.fillStyle(0x1a1c19, 0.8).fillRect(w.x - 14, top, 28, 4);
      this.bars.fillStyle(0xc77b6b, 1).fillRect(w.x - 14, top, (28 * u.hp) / u.maxHp, 4);
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

  private survivorAt(wp: { x: number; y: number }): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const u of this.state.survivors) {
      const d = u.hp > 0 ? this.hit(wp, u.x, u.y) : Infinity;
      if (d < bd) [bd, best] = [d, u.id];
    }
    return best;
  }

  private enemyAt(wp: { x: number; y: number }): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const e of this.state.enemies) {
      const d = e.hp > 0 && !this.hidden(e.x, e.y) ? this.hit(wp, e.x, e.y) : Infinity;
      if (d < bd) [bd, best] = [d, e.id];
    }
    return best;
  }

  private crateAt(wp: { x: number; y: number }): string | null {
    for (const c of this.state.crates) {
      const w = tileToWorld(c.x, c.y, this.n);
      const dy = w.y - wp.y;
      if (!c.opened && !this.hidden(c.x, c.y) && Math.abs(wp.x - w.x) <= 18 && dy >= -8 && dy <= 24) return c.id;
    }
    return null;
  }

  /** A body under a world point that Finish can take: one still going to rise (DESIGN §26). */
  private riserAt(wp: { x: number; y: number }): string | null {
    let best: string | null = null;
    let bd = Infinity;
    for (const b of this.state.bodies) {
      if (b.riseAt === undefined || this.hidden(b.x, b.y)) continue;
      const w = tileToWorld(b.x, b.y, this.n);
      const dx = Math.abs(wp.x - w.x);
      const dy = Math.abs(wp.y - (w.y - (b.carriedBy ? 16 : 0)));
      if (dx <= 24 && dy <= 14 && dx + dy < bd) [bd, best] = [dx + dy, b.id];
    }
    return best;
  }

  private chosen(): Survivor[] {
    return this.state.survivors.filter((u) => u.hp > 0 && this.selected.has(u.id));
  }

  private get canOrder(): boolean {
    return !this.paused && this.state.status === 'playing' && !bondPlaying(this.state);
  }

  private toast(msg: string): void {
    this.toastText = msg;
    this.toastUntil = this.time.now + 1800;
  }

  private arm(mode: 'hold' | 'takedown' | 'lure' | 'bond' | 'finish'): void {
    if (!this.canOrder || (mode === 'finish' && !finishAvailable(this.state))) return;
    const who = this.chosen();
    if (mode === 'bond') {
      const why = bondAim(this.state, [0, 0]).refusal;
      if (why !== null && why !== 'far' && why !== 'empty') return this.toast(BOND_REFUSAL_TEXT[why]);
      if (who.length === 0) return this.toast('Select Cass or Eli first');
      this.pending = this.pending === mode ? null : mode;
      return;
    }
    const ok = mode === 'hold' || mode === 'finish' ? who.length > 0 : mode === 'takedown' ? who.some(canTakedown) : who.some(canLure);
    if (!ok) return this.toast(mode === 'hold' || mode === 'finish' ? 'Select a survivor first' : mode === 'takedown' ? 'Select Cass first' : 'Select Eli first');
    this.pending = this.pending === mode ? null : mode;
  }

  private cycleStance(): void {
    if (!this.canOrder) return;
    const who = this.chosen();
    if (who.length === 0) return;
    const next = nextStance(who[0]!.stance);
    for (const u of who) setStance(this.state, u.id, next);
  }

  private carry(): void {
    if (!this.canOrder) return;
    const who = this.chosen().filter(canCarry);
    if (who.length === 0) return this.toast('Select Cass to carry');
    for (const u of who) if (toggleCarry(this.state, u.id)) return;
    this.toast('No body within reach');
  }

  /** Bar button or its hotkey. Orders are refused while paused or ended, like every other order. */
  private onAction(id: string): void {
    if (id === 'highlight') {
      if (highlightAvailable(this.state)) this.highlight = !this.highlight; // only a view: free, also while paused
      return;
    }
    if (!this.canOrder) return;
    if (id.startsWith('weapon:')) {
      const who = this.chosen();
      const wid = id.slice('weapon:'.length);
      if (who.length === 0 || !who.some((u) => selectWeapon(this.state, u.id, wid))) this.toast(this.state.ammo <= 0 && wid === 'pistol' ? 'Out of ammo' : 'That survivor does not carry it');
    } else if (id === 'takedown' || id === 'hold' || id === 'lure' || id === 'bond' || id === 'finish') this.arm(id);
    else if (id === 'carry') this.carry();
    else if (id === 'freefire') {
      const who = this.chosen().filter(canFreeFire);
      if (who.length === 0) return this.toast('Select a survivor with a gun');
      const on = !who[0]!.freeFire;
      for (const u of who) setFreeFire(this.state, u.id, on);
      this.toast(on ? 'Free fire on: Hold may use the gun' : 'Free fire off: Hold uses melee only');
    } else if (id === 'crouch') this.cycleStance();
  }

  /** Keys 1 and 2: the first and second weapon button of the selected survivor. */
  private chooseWeapon(i: number): void {
    const u = this.chosen()[0];
    const b = u ? barButtons(this.state, u).filter((b) => b.id.startsWith('weapon:'))[i] : undefined;
    if (b) this.onAction(b.id);
  }

  /** Short controls hints shown one after another when the mission starts (DESIGN §15); empty afterwards. */
  private entryHint(): string {
    const hints = this.md.hints ?? [];
    if (this.time.now >= this.hintUntil) {
      this.hintIdx++;
      this.hintUntil = this.time.now + HINT_MS;
    }
    return hints[this.hintIdx] ?? '';
  }

  /** The pointer is over the action bar or a squad card: the world below ignores it. */
  private onBar(p: Phaser.Input.Pointer): boolean {
    return overBar(this.registry, p.x, p.y, this.scale.width, this.scale.height) || overSquad(this.registry, p.x, p.y);
  }

  private togglePause(): void {
    if (this.state.status === 'playing') this.paused = !this.paused;
    if (this.paused) this.pending = null;
  }

  /** What lies under a world point, in click priority: survivor, enemy, crate, ground (open map), nothing. */
  private targetAt(wp: { x: number; y: number }): { kind: ClickTarget; id?: string } {
    const sv = this.survivorAt(wp);
    if (sv) return { kind: 'survivor', id: sv };
    const en = this.enemyAt(wp);
    if (en) return { kind: 'enemy', id: en };
    const cr = this.crateAt(wp);
    if (cr) return { kind: 'object', id: cr };
    const t = worldToTile(wp.x, wp.y, this.n);
    return { kind: t.x < 0 || t.y < 0 || t.x >= this.n || t.y >= this.n ? 'none' : 'ground' };
  }

  /** Left click (DESIGN §1 *Mouse*): select a survivor, attack an enemy, open a crate, or walk (a quick second click runs). */
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
      const c = this.state.crates.find((c) => c.id === target.id)!;
      const nearest = [...who].sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0]!;
      orderOpen(this.state, nearest.id, c.id);
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

  private resolvePending(p: Phaser.Input.Pointer, wp: { x: number; y: number }): void {
    const mode = this.pending;
    const who = this.chosen();
    const f = worldToTileF(wp.x, wp.y, this.n);
    if (mode === 'hold') {
      for (const u of who) orderHold(this.state, u.id, [f.x, f.y]);
    } else if (mode === 'takedown') {
      const target = this.enemyAt(wp);
      if (!target) return this.toast('Click an enemy');
      if (!who.some((u) => canTakedown(u) && orderTakedown(this.state, u.id, target))) return;
    } else if (mode === 'lure') {
      const t = this.tileOf(p);
      const scout = who.find(canLure);
      if (!scout) return;
      if (!useLure(this.state, scout.id, [t.x, t.y])) return this.toast(scout.lureCd > 0 ? `Lure ready in ${Math.ceil(scout.lureCd / TICK_HZ)} s` : 'Out of throwing range');
    } else if (mode === 'finish') {
      const body = this.riserAt(wp);
      if (!body) return this.toast('Only a fallen squatter about to turn can be finished');
      const u = finisherFor(this.state, who, body);
      if (!u || !orderFinish(this.state, u.id, body)) return;
    } else if (mode === 'bond') {
      const why = bondAim(this.state, [f.x, f.y]).refusal;
      if (why !== null) return this.toast(BOND_REFUSAL_TEXT[why]);
      startBond(this.state, [f.x, f.y]);
    }
    this.pending = null;
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

  /** Right-click gives no orders: it only cancels a pending V / L order (DESIGN §1 *Mouse*). */
  private rightClick(_p: Phaser.Input.Pointer): void {
    this.pending = null;
  }

  // ---- Frame ----

  /** Walls and trees in front of a survivor fade; a selected survivor behind one shows through, outlined (art/STYLE.md *Occlusion*). */
  private seeThrough(dt: number): void {
    const alive = this.state.survivors.filter((u) => u.hp > 0 && !this.hidden(u.x, u.y));
    const covered = this.occlusion.update(alive.map((u) => ({ x: u.x, y: u.y })), dt);
    for (const u of this.state.survivors) {
      const i = alive.indexOf(u);
      this.ghosts.show(u.id, i >= 0 && covered[i] && this.selected.has(u.id) ? this.units.get(u.id)!.body : null);
    }
  }

  private publish(): void {
    const s = this.state;
    const lines = this.chosen().map((u) => {
      const bits = [`${name(u)}  HP ${u.hp}`, u.stance];
      if (u.order?.type === 'hold') bits.push('holding');
      if (u.order?.type === 'takedown') bits.push('takedown');
      if (u.order?.type === 'open') bits.push('opening crate');
      if (u.order?.type === 'finish') bits.push('finishing');
      if (u.carrying) bits.push('carrying a body');
      bits.push(`weapon ${activeWeapon(s, u)}`);
      if (canLure(u)) bits.push(u.lureCd > 0 ? `lure ${Math.ceil(u.lureCd / TICK_HZ)} s` : 'lure ready');
      return bits.join('  ·  ');
    });
    const opened = s.crates.filter((c) => c.opened).length;
    const zombies = s.enemies.filter((e) => e.kind === 'zombie' && e.hp > 0).length;
    const estate = this.missionId === 'm02'; // no crates and no zombie count: the squatters are the goal
    this.registry.set('m_counters', lootCounters({ ammo: s.ammo, food: FOOD_SHOWN ? s.loot.food : undefined, scrap: s.loot.scrap, ...(estate ? {} : { crates: { opened, total: s.crates.length }, zombies }) }));
    const first = this.chosen()[0];
    const buttons = first ? barButtons(s, first).map((b) => ((b.id === 'bond' && this.pending === 'bond') || (b.id === 'finish' && this.pending === 'finish') || (b.id === 'highlight' && this.highlight) ? { ...b, active: true } : b)) : [];
    const bar: BarModel | null = first ? { name: name(first), hp: first.hp, buttons } : null;
    this.registry.set('m_bar', bar);
    this.squad.publish();
    this.registry.set('m_sel', lines.length ? lines.join('\n') : 'Nobody selected');
    const said = this.door ? '' : this.speaker(); // Theo's subtitles come before the entry hints
    const hint = this.pending === 'hold' ? 'Click where to hold (right-click cancels)' : this.pending === 'takedown' ? 'Click an enemy to take down' : this.pending === 'lure' ? 'Click where to throw the lure' : this.pending === 'bond' ? 'Click to mark up to 3 zombies for the bond move (right-click cancels)' : this.pending === 'finish' ? 'Click a fallen squatter who is about to turn (right-click cancels)' : said || this.entryHint();
    this.registry.set('m_hint', this.rescue || this.door ? '' : this.time.now < this.toastUntil ? this.toastText : hint); // the rescue and the door scene are cutscenes: no hints
    let banner = '';
    if (s.status === 'failed') banner = `${failText(s)}\nPress any key to try again.`;
    else if (s.status === 'success') banner = this.rescue?.beat === 'ambush' ? 'All clear!' : '';
    else if (this.paused) banner = 'PAUSED  (Space to resume; no orders while paused)';
    this.registry.set('m_banner', banner);
  }

  update(_t: number, dt: number): void {
    if (this.leaving) return;
    this.seeThrough(dt);
    this.view.update(dt);
    const p = this.input.activePointer;

    if (this.state.status === 'playing' && !this.paused) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS; i++) {
        this.tickOnce();
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else if (this.doorMoving) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS && this.doorMoving; i++) {
        for (const u of this.state.survivors) this.prev.set(u.id, [u.x, u.y]);
        stepDoor(this.state, this.door!, this.md.bunker!);
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else if (this.rescueMoving) {
      this.acc += Math.min(dt, 250);
      for (let i = 0; i < 5 && this.acc >= STEP_MS && this.rescueMoving; i++) {
        for (const u of [...this.state.survivors, ...this.state.enemies]) this.prev.set(u.id, [u.x, u.y]);
        stepRescue(this.state, this.rescue!);
        this.acc -= STEP_MS;
      }
      this.acc = Math.min(this.acc, STEP_MS);
    } else this.acc = 0;
    const frac = (this.state.status === 'playing' && !this.paused) || this.rescueMoving || this.doorMoving ? this.acc / STEP_MS : 1;
    this.sync(frac);
    this.bow.sync(this.state, (u) => this.at(u, frac));
    followBond(this.view, this.state, this.n);
    this.feel.frame(this.state);
    publishAtmos(this, this.view, { dusk: 0, rain: 0, fog: FOG_LEVEL, lights: [] });
    this.drawFx(frac);
    if (this.state.roofOpen && this.roofGfx && !this.roofFading) {
      this.roofFading = true;
      const g = this.roofGfx;
      this.tweens.add({ targets: g, alpha: 0, duration: ROOF_FADE_MS, onComplete: () => g.destroy() });
    }

    if (this.state.status === 'failed') {
      this.endedAt += dt;
      if (this.endedAt >= RESTART_MS) this.scene.restart({ restart: true, mission: this.missionId });
    }
    if (this.state.status === 'success' && !this.won) this.win();
    if (this.rescue) this.playRescue(this.rescue);
    if (this.door) this.playDoor(this.door, this.md.bunker!);


    const t = this.tileOf(p);
    const inside = t.x >= 0 && t.y >= 0 && t.x < this.n && t.y < this.n;
    this.hover.setVisible(inside).setTint(this.pending ? 0xe8c46a : 0xffffff);
    const under = this.onBar(p) ? null : this.targetAt(this.worldOf(p));
    const finishing = under !== null && this.pending === 'finish' && this.canOrder;
    this.view.setCursor(
      finishing ? finishCursor(this.riserAt(this.worldOf(p)) !== null) : under ? cursorFor(resolveClick(under.kind, this.canOrder && this.chosen().length > 0), this.pending !== null && this.canOrder) : 'default',
    );
    this.outline.set(under?.kind === 'object' && under.id ? (this.crateSprites.get(under.id) ?? null) : null);
    if (inside) {
      const w = tileToWorld(t.x, t.y, this.n);
      this.hover.setPosition(w.x, w.y);
    }
    this.publish();
  }
}

/** Screen overlay over the mission: loot, selection, hints, controls and the pause / end banner. */
export class MissionHudScene extends Phaser.Scene {
  private counters!: CounterRow;
  private sel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private help!: Phaser.GameObjects.Text;

  constructor() {
    super('MissionHud');
  }

  create(): void {
    const { width, height } = this.scale;
    const box = { backgroundColor: '#1d201cb0', padding: { x: 10, y: 6 } };
    this.counters = new CounterRow(this, FONT);
    // Z101: padded boxes start hidden; `update` shows each once it has text (an empty one is a dark rectangle while a dialogue pauses this HUD before its first update).
    this.sel = this.add.text(16, height - barH() - 12, '', { fontFamily: FONT, fontSize: '18px', color: '#e8e6de', ...box }).setOrigin(0, 1).setVisible(false);
    this.hint = this.add.text(width / 2, height - barH() - 12, '', { fontFamily: FONT, fontSize: '20px', color: '#f0dc8a', wordWrap: { width: HINT_WRAP }, align: 'center', ...box }).setOrigin(0.5, 1).setVisible(false);
    this.banner = this.add.text(width / 2, height * 0.35, '', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', backgroundColor: '#141614d0', padding: { x: 24, y: 14 }, align: 'center' }).setOrigin(0.5).setVisible(false);
    this.help = this.add.text(width - 16, 14, fillHelp(HELP), {
      fontFamily: FONT, fontSize: '14px', color: '#a8a69e', align: 'right',
    }).setOrigin(1, 0);
  }

  /** Text size (DESIGN §19): sizes and rows follow the option each frame, so a change in the pause menu applies at once. */
  private layout(): void {
    this.help.setText(fillHelp(HELP)); // a key rebound in the pause menu shows at once
    scaleText(this.sel, 18, 10, 6);
    scaleText(this.hint, 20, 10, 6);
    scaleText(this.banner, 34, 24, 14);
    sizeBanner(this.banner, this.scale.width);
    this.sel.setPosition(16, this.scale.height - barH() - 12);
  }

  update(): void {
    this.layout();
    const r = this.registry;
    this.counters.update((r.get('m_counters') as Counter[] | undefined) ?? [], 16, 12);
    const sel = (r.get('m_sel') as string | undefined) ?? '';
    this.sel.setText(sel).setVisible(sel !== '');
    const hint = (r.get('m_hint') as string | undefined) ?? '';
    this.hint.setText(fillHelp(hint)).setVisible(hint !== '');
    placeHint(this.hint, this.sel, this.scale.width);
    const banner = (r.get('m_banner') as string | undefined) ?? '';
    this.banner.setText(banner).setVisible(banner !== '');
  }
}
