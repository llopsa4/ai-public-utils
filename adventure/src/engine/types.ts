export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

export type Facing = 'down' | 'up' | 'left' | 'right';
export type Pose = 'stand' | 'crouch' | 'dead';
export type ActorId = 'hero' | 'keeper';

export const VERBS = ['look', 'open', 'close', 'take', 'use', 'talk', 'go', 'crouch', 'lie', 'stand'] as const;
export type Verb = (typeof VERBS)[number];

/** All entries must hold (logical AND). */
export interface Condition {
  flag?: string;
  notFlag?: string;
  has?: string;
  lacks?: string;
}

export interface HotspotDef {
  id: string;
  /** String-table key for the name shown on hover and in the radial menu. */
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
  x: number;
  y: number;
  /** Tag shown when `flag` is true / false. */
  flag?: string;
  whenTrue?: string;
  whenFalse?: string;
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
  entries: Record<string, { x: number; y: number; face: Facing }>;
  objects: ObjectDef[];
  hotspots: HotspotDef[];
  actors: { id: ActorId; x: number; y: number; face: Facing; visibleIf?: Condition[] }[];
}

export interface ActorState {
  pose: Pose;
  face: Facing;
}

export interface GameState {
  room: string;
  hero: { x: number; y: number } & ActorState;
  keeper: ActorState;
  flags: Record<string, boolean>;
  inventory: string[];
}

/** One step of a scripted interaction. The scene plays them in order. */
export type Command =
  | { type: 'walk'; to: Point; face?: Facing }
  | { type: 'face'; actor: ActorId; face: Facing }
  | { type: 'say'; actor: ActorId; text: string }
  | { type: 'pose'; actor: ActorId; pose: Pose }
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'addItem'; item: string }
  | { type: 'removeItem'; item: string }
  | { type: 'room'; room: string; entry: string }
  | { type: 'dialogue'; id: string }
  | { type: 'wait'; ms: number };
