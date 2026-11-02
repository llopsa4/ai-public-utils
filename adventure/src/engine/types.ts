export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

export type Facing = 'down' | 'up' | 'left' | 'right';
export type Pose = 'stand' | 'crouch' | 'dead';

export const NPC_IDS = ['oren', 'nell'] as const;
export type NpcId = (typeof NPC_IDS)[number];
export type ActorId = 'hero' | NpcId;

export const VERBS = ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand'] as const;
export type Verb = (typeof VERBS)[number];

/** All entries must hold (logical AND). `atLeast` holds when `count` of its flags are set. */
export interface Condition {
  flag?: string;
  notFlag?: string;
  has?: string;
  lacks?: string;
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
}

export interface ObjectDef {
  id: string;
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

export interface RoomDef {
  id: string;
  background: string;
  /** Outer walkable polygon followed by optional holes (obstacles). */
  walkable: { outer: Polygon; holes: Polygon[] };
  scale: DepthScale;
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

export interface GameState {
  room: string;
  hero: { x: number; y: number } & ActorState;
  npcs: Record<NpcId, ActorState>;
  flags: Record<string, boolean>;
  inventory: string[];
}

/** One step of a scripted interaction. The scene plays them in order. */
export type Command =
  | { type: 'walk'; to: Point; face?: Facing }
  | { type: 'face'; actor: ActorId; face: Facing }
  /** `at` places the line for a voice from off-screen. */
  | { type: 'say'; actor: ActorId; text: string; at?: Point }
  | { type: 'pose'; actor: ActorId; pose: Pose }
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'addItem'; item: string }
  | { type: 'removeItem'; item: string }
  | { type: 'room'; room: string; entry: string }
  | { type: 'dialogue'; id: string }
  | { type: 'wait'; ms: number }
  | { type: 'shake'; ms: number }
  | { type: 'moveObject'; id: string; x: number; y: number; ms: number }
  | { type: 'end' };
