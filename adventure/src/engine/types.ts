import type { Loadout } from '../combat/types';

export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

export type Facing = 'down' | 'up' | 'left' | 'right';
export type Pose = 'stand' | 'crouch' | 'dead';

/** Every named character in the game; each chapter brings its own cast (`Chapter.npcs`). */
export const NPC_IDS = ['oren', 'nell'] as const;
export type NpcId = (typeof NPC_IDS)[number];
export type ActorId = 'hero' | NpcId;
/** Background people (the kiln-hall crowd): not saved, not part of the story. */
export type ExtraId = `extra-${string}`;
/** Anyone who can speak a line in the dialogue panel. */
export type Speaker = ActorId | ExtraId;

export const VERBS = ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand'] as const;
export type Verb = (typeof VERBS)[number];

/** All entries must hold (logical AND). `atLeast` holds when `count` of its flags are set. */
export interface Condition {
  flag?: string;
  notFlag?: string;
  has?: string;
  atLeast?: { count: number; flags: string[] };
}

export interface HotspotDef {
  id: string;
  /** String-table key for the name shown on hover and in the action ring. */
  name: string;
  polygon: Polygon;
  verbs: Verb[];
  /** Where the hero stands to interact; omitted = interact from where they are. */
  walkTo?: Point;
  face?: Facing;
  visibleIf?: Condition[];
  /** Optional secret: not shown by the Space / eye-button labels, only found by exploring. */
  secret?: boolean;
}

export interface ObjectDef {
  id: string;
  /** Width of a contact shadow under the prop (world units); omitted for wall and table props. */
  shadow?: number;
  /** Sprite sheet key (art/src/objects/<sheet>.png + .json). */
  sheet: string;
  /** Foot point (bottom centre of the sprite). */
  x: number;
  y: number;
  /** Tag shown when `flag` is true / false. */
  flag?: string;
  whenTrue?: string;
  whenFalse?: string;
  /** Looping animation tag for animated objects. */
  anim?: string;
  /** Where the object rests once `flag` is set (so moved things stay moved after loading a save). */
  movedTo?: { flag: string; x: number; y: number };
  /** Draw order override; defaults to y (things lower on screen are in front). */
  depth?: number;
  visibleIf?: Condition[];
}

export interface DepthScale {
  farY: number;
  farScale: number;
  nearY: number;
  nearScale: number;
}

/** A piece of the background cut out and drawn in front of anything standing behind it. */
export interface ForegroundDef {
  /** Image key (art/src/foreground/<image>.png, drawn at half scale). */
  image: string;
  /** World position of the image's top-left corner. */
  x: number;
  y: number;
  /** Actors whose feet are above this line are drawn behind it. */
  depth: number;
}

/** Ambient effects: particle fields and flickering light pools. */
export interface AmbientDef {
  particles?: { kind: 'embers' | 'steam' | 'dust' | 'ash'; x: number; y: number; w: number; h: number; warm?: boolean }[];
  glows?: { x: number; y: number; r: number; color: number; warm?: boolean }[];
}

export interface RoomDef {
  id: string;
  background: string;
  foreground?: ForegroundDef[];
  /** Light on characters: tint at full brightness and how dark they get at the far line (0..1). */
  light?: { tint: number; farDim: number };
  ambient?: AmbientDef;
  /** Outer walkable polygon followed by optional holes (obstacles). */
  walkable: { outer: Polygon; holes: Polygon[] };
  scale: DepthScale;
  /** What the floor sounds like underfoot (default stone). */
  surface?: 'stone' | 'metal' | 'ash';
  /** Background score mood (warm hearth, gallery tension, ashways wind); cold rooms use the cold score. */
  music?: 'warm' | 'tension' | 'wind';
  /** Tint once the room is cold, instead of the default cold blue (lighter for rooms that got too dark). */
  coldTint?: number;
  /** Colour grade, haze, light shafts, vignette and reflections. */
  look?: RoomLook;
  /** Animated set pieces: gauge needle, bubbles, swinging hoist, lantern flames. */
  props?: PropDef[];
  /**
   * The hatch the gallery's fight comes out of: the round opening's centre and radius, where Mara
   * steps back to, and where the creature lands on the floor.
   */
  hatch?: { x: number; y: number; r: number; stepBack: Point; land: Point };
  /**
   * The room's name board (text `room.<id>`), hung from a hook at (x, y): a rope `drop` long, then
   * a board `w` by `h` (world units), a wooden plank or an iron shield-plate. Decoration only.
   */
  sign?: { x: number; y: number; drop: number; w: number; h: number; style: 'wood' | 'iron'; depth?: number };
  /** When these hold the room is drawn with the cold tint (kiln shut down). */
  coldIf?: Condition[];
  entries: Record<string, { x: number; y: number; face: Facing }>;
  objects: ObjectDef[];
  hotspots: HotspotDef[];
  actors: { id: NpcId; x: number; y: number; visibleIf?: Condition[] }[];
}

export interface ActorState {
  pose: Pose;
  face: Facing;
}

/**
 * Moving set pieces (presentation only). Images are `art/src/props/<image>`; coordinates are world
 * units. `warm` props stop once the kiln is cold.
 */
export type PropDef = { visibleIf?: Condition[]; warm?: boolean } & (
  /** A live needle over a needle-less dial: `angle` running (degrees from straight up), `rest` when cold. */
  | { kind: 'gauge'; image: string; x: number; y: number; length: number; angle: number; rest: number }
  /** An image hung from its top edge at (x, y), swaying; it swings when its hotspot is used. */
  | { kind: 'swing'; image: string; x: number; y: number; pivotX: number; hotspot: string; depth?: number }
  | { kind: 'bubbles'; x: number; y: number; w: number; h: number; color: number }
  | { kind: 'flame'; x: number; y: number; size: number; color: number; depth?: number }
);

/** A room's colour grade (camera colour matrix on High quality). 1 / 0 are neutral. */
export interface Grade { saturation: number; brightness: number; contrast: number; warmth: number }

/** Visual-only room settings (High quality unless noted). World coordinates. */
export interface RoomLook {
  grade?: Grade;
  /** Grade once the room is cold (default COLD_GRADE). */
  coldGrade?: Grade;
  /** Heat shimmer over hot spots (stops when cold). */
  haze?: { x: number; y: number; w: number; h: number }[];
  /** Drifting light beams from (x, y), angle in degrees from straight down. Dim when cold. */
  shafts?: { x: number; y: number; angle: number; length: number; width: number; color: number }[];
  /** Darkened edges, 0..1 (default 0.3). */
  vignette?: number;
  /** A wet floor that shows faint reflections of the characters. */
  reflective?: { polygon: Polygon; alpha: number };
}

/** Mara's fighting kit: health, MP and gear (the card rules live in src/combat). */
export interface Kit {
  hp: number;
  mp: number;
  equipment: Loadout;
  /** Gear Mara can choose from. */
  owned: string[];
}

/** What Mara carries besides story items: salvage (money), materials and Kiln Tonics. */
export interface Bag {
  salvage: number;
  materials: Record<string, number>;
  tonics: number;
}

export interface GameState {
  /** The chapter being played (src/chapters). */
  chapter: string;
  /** Chapters reached so far, in story order. */
  reached: string[];
  /** Flags of chapters already played, by chapter id (later chapters can read them). */
  earlier: Record<string, Record<string, boolean>>;
  room: string;
  hero: { x: number; y: number } & ActorState;
  /** The current chapter's cast and how each stands (only that chapter's characters). */
  npcs: Partial<Record<NpcId, ActorState>>;
  /** The active chapter's story flags. */
  flags: Record<string, boolean>;
  inventory: string[];
  /** How many times each target was looked at (repeated looks cycle through its lines). */
  looks: Record<string, number>;
  kit: Kit;
  bag: Bag;
}

/** One step of a scripted interaction. The scene plays them in order. */
export type Command =
  | { type: 'walk'; to: Point; face?: Facing }
  | { type: 'face'; actor: ActorId; face: Facing }
  /** `at` places the line for a voice from off-screen. */
  | { type: 'say'; actor: Speaker; text: string; at?: Point }
  | { type: 'pose'; actor: ActorId; pose: Pose }
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'addItem'; item: string }
  | { type: 'removeItem'; item: string }
  | { type: 'room'; room: string; entry: string }
  /** The chapter ends and the next begins: kept items, kit and bag carry over; flags start afresh. */
  | { type: 'chapter'; id: string }
  | { type: 'dialogue'; id: string }
  | { type: 'wait'; ms: number }
  | { type: 'shake'; ms: number }
  | { type: 'moveObject'; id: string; x: number; y: number; ms: number }
  /** Presentation only, inserted by the scene: Mara's hands reach the target (reach pose, swinging props). */
  | { type: 'handle'; target: string }
  /** Counts a look at a target, so repeated looks cycle through their lines. */
  | { type: 'looked'; id: string }
  /** The gallery's maintenance hatch blows open and something crawls out (presentation). */
  | { type: 'hatch' }
  /** A fight (shatter transition, battle, return). Continues the script once it is won. */
  | { type: 'fight'; id: string }
  /** Opens the gear menu and waits for it to close. */
  | { type: 'gear' }
  /** Shows the Gear button and makes the player press it (then the gear screen, until closed). */
  | { type: 'awaitGear' }
  /** Oren's spares become Mara's to choose from. */
  | { type: 'giveSpares' }
  /** Opens the merchant's shop and waits for it to close. */
  | { type: 'shop' }
  | { type: 'end' };
