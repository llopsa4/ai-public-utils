import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const FLAT = { farY: 268, farScale: 1, nearY: 345, nearScale: 1 };

/** Only what is lit: in the dark cell, things away from Silas and the candle can't be made out. */
const LIT = [{ flag: 'cellLit' }];

// The cell, Ironhaven's prison, at night (Codex's painting): Silas's side is a cage of iron bars
// across the left of the room, a smaller door below fixed bars at the cage's right end (x 364-412), drawn in front of
// him (the bars and the door are foreground pieces). Inside: the barred window high up, a small pale
// chip of clay in the stone wall, the straw cot, the bucket, and the tin plate on the floor. Outside,
// in the guard's corridor: Silas's confiscated cloak hanging on a nail, Sergeant Harrow's portrait,
// the table with the candle and a cup (the mask frame on it), and the guard's chair. No stairs.
const cellHotspots: HotspotDef[] = [
  { id: 'plate', name: 'name.i.plate', polygon: rect(158, 300, 30, 14), verbs: ['look', 'take'], walkTo: pt(170, 318), face: 'down', visibleIf: [{ notFlag: 'tookPlate' }], outline: { objects: ['floorPlate'] } },
  { id: 'frame', name: 'name.i.frame', polygon: rect(484, 266, 22, 12), verbs: ['look', 'take'], walkTo: pt(340, 300), face: 'right', visibleIf: [...LIT, { notFlag: 'gotFrame' }], outline: { objects: ['frame'] } },
  { id: 'roster', name: 'name.i.roster', polygon: rect(527, 115, 38, 50), verbs: ['look'], visibleIf: LIT },
  // His cloak on its nail beyond the bars: out of reach until the door is open.
  { id: 'cloak', name: 'name.i.cloak', polygon: rect(457, 95, 46, 112), verbs: ['look', 'take'], walkTo: pt(482, 334), face: 'up', visibleIf: [...LIT, { notFlag: 'tookCloak' }], outline: { objects: ['cloak'] } },
  { id: 'candle', name: 'name.i.candle', polygon: rect(466, 246, 14, 34), verbs: ['look', 'take'] },
  { id: 'table', name: 'name.i.table', polygon: rect(437, 272, 106, 55), verbs: ['look', 'take'], walkTo: pt(340, 300), face: 'right' },
  { id: 'window', name: 'name.i.window', polygon: rect(140, 62, 60, 62), verbs: ['look', 'use'], walkTo: pt(170, 290), face: 'up' },
  { id: 'wall', name: 'name.i.wall', polygon: rect(244, 122, 24, 20), verbs: ['look', 'take', 'use'], walkTo: pt(256, 288), face: 'up', visibleIf: LIT },
  // The blanket draped over the cot (the strip) comes before the cot's frame (the nail): over the
  // cloth, the pointer finds the blanket; on the posts and legs, the frame.
  { id: 'blanket', name: 'name.i.blanket', polygon: rect(48, 236, 104, 46), verbs: ['look', 'take', 'use'], walkTo: pt(95, 300), face: 'up' },
  { id: 'cot', name: 'name.i.cot', polygon: rect(25, 235, 140, 57), verbs: ['look', 'use', 'take'], walkTo: pt(95, 300), face: 'up' },
  { id: 'bucket', name: 'name.i.bucket', polygon: rect(297, 255, 34, 38), verbs: ['look', 'use', 'take'], walkTo: pt(290, 306), face: 'right', visibleIf: LIT },
  { id: 'cellDoor', name: 'name.i.cellDoor', polygon: rect(364, 162, 48, 172), verbs: ['look', 'open', 'use'], walkTo: pt(340, 300), face: 'right', outline: { objects: ['cellDoor'] }, visibleIf: [{ notFlag: 'cellOpen' }] },
  // The way out: warm light falling across the floor at the far right, from the stairs up. The exit
  // is on the light (look or go; a double-click walks straight out).
  { id: 'cellStairs', name: 'name.i.cellStairs', polygon: rect(590, 296, 50, 52), verbs: ['look', 'go'], walkTo: pt(614, 336), face: 'right', outline: { painted: false } },
];

// The guardroom at the top of the stairs: a peg with a clerk's hood (left), the tally clerk's ledger
// on a shelf, the wide-awake guard at his desk, and the grate out (right edge).
const guardroomHotspots: HotspotDef[] = [
  { id: 'ledger', name: 'name.i.ledger', polygon: rect(196, 196, 40, 18), verbs: ['look', 'take', 'open'], walkTo: pt(216, 292), face: 'up', visibleIf: [{ notFlag: 'tookLedger' }] },
  { id: 'grate', name: 'name.i.grate', polygon: rect(560, 110, 76, 152), verbs: ['look', 'open', 'go', 'use'], walkTo: pt(590, 296), face: 'right' },
  { id: 'downStairs', name: 'name.i.downStairs', polygon: rect(0, 150, 40, 112), verbs: ['look', 'go'], walkTo: pt(30, 300), face: 'left' },
  { id: 'stove', name: 'name.i.stove', polygon: rect(300, 180, 60, 82), verbs: ['look', 'use'] },
];

// The outer door: a snowy yard under Ironhaven's walls, the door Silas comes out of (left).
const outerHotspots: HotspotDef[] = [
  { id: 'walls', name: 'name.i.walls', polygon: rect(0, 0, 640, 200), verbs: ['look'], outline: { painted: false } },
];

export const ROOMS: Record<string, RoomDef> = {
  cell: {
    id: 'cell',
    background: 'room-cell',
    // Inside the cage only (behind its bars); once the door is open, out through it and along the
    // corridor floor in front of the table to the stairs light at the right.
    walkable: { outer: [pt(16, 270), pt(346, 270), pt(346, 330), pt(16, 330)], holes: [] },
    walkableWhen: [{
      if: [{ flag: 'cellOpen' }],
      walkable: { outer: [pt(16, 270), pt(346, 270), pt(346, 300), pt(402, 300), pt(402, 328), pt(636, 328), pt(636, 346), pt(372, 346), pt(346, 332), pt(16, 332)], holes: [] },
    }],
    scale: FLAT,
    surface: 'stone',
    music: 'tension',
    light: { tint: 0xc4d2e3, farDim: 0.96 },
    look: {
      grade: { saturation: 0.86, brightness: 0.98, contrast: 1.04, warmth: -0.08 }, vignette: 0.42,
      // A cold ray of moonlight slanting down from the barred window to the cell floor (seen in the dark too).
      shafts: [
        { x: 170, y: 92, angle: -26, length: 230, width: 32, color: 0xb8c8ff, overDark: true, strength: 1.2 },
        // Warm light from the stairwell off to the right, falling across the floor.
        { x: 668, y: 236, angle: 58, length: 150, width: 96, color: 0xffb060, overDark: true, strength: 4.4 },
      ],
    },
    // Black but for the candle beyond the bars and the thin moonlight, until Silas throws the
    // moonlight across the cell with the tin plate.
    dark: { if: [{ notFlag: 'cellLit' }], alpha: 0.88, lights: [{ x: 473, y: 254, r: 105 }, { x: 170, y: 92, r: 56 }, { x: 628, y: 334, r: 44 }], heroR: 116 },
    ambient: {
      particles: [{ kind: 'dust', x: 30, y: 66, w: 185, h: 190 }],
      glows: [
        { x: 170, y: 105, r: 70, color: 0x7898c8 },
        { x: 473, y: 252, r: 60, color: 0xffb860 },
        { x: 626, y: 338, r: 70, color: 0xffa850 }, { x: 612, y: 340, r: 44, color: 0xffc070 },
      ],
    },
    props: [{ kind: 'flame', x: 473, y: 252, size: 8, color: 0xffc070, depth: 9000 }],
    // Fixed cage bars and the smaller doorway's jambs/upper bars stay in place.
    foreground: [
      { image: 'cell-bars', x: 2, y: 2, depth: 400 },
      { image: 'cell-door', x: 364, y: 2, depth: 400 },
    ],
    entries: { start: { x: 100, y: 305, face: 'right' }, fromGuardroom: { x: 612, y: 336, face: 'left' } },
    // The tin plate stays wedged in the window bars once it has thrown the moonlight in.
    objects: [
      { id: 'floorPlate', sheet: 'floor-plate', x: 173, y: 312, depth: 50, visibleIf: [{ notFlag: 'tookPlate' }] },
      { id: 'windowPlate', sheet: 'window-plate', x: 170, y: 123, depth: 50, visibleIf: [{ flag: 'cellLit' }] },
      { id: 'frame', sheet: 'table-frame', x: 495, y: 278, depth: 280, visibleIf: [...LIT, { notFlag: 'gotFrame' }] },
      { id: 'cloak', sheet: 'cell-cloak', x: 482.5, y: 201, depth: 50, visibleIf: [{ notFlag: 'tookCloak' }] },
      { id: 'cellDoor', sheet: 'cell-gate', x: 404, y: 334, depth: 401, flag: 'cellOpen', whenFalse: 'closed', whenTrue: 'open' },
    ],
    hotspots: cellHotspots,
    actors: [
      // Benn, asleep on his chair by the candle until "Sergeant Harrow" wakes him.
      { id: 'guard', x: 570, y: 326, visibleIf: [{ notFlag: 'guardGone' }], leaves: { to: { x: 680, y: 334 } }, snores: [{ notFlag: 'guardAwake' }], task: [{ tag: 'salute', if: [{ flag: 'bennSaluting' }] }, { tag: 'sit', if: [{ notFlag: 'guardAwake' }] }] },
    ],
  },
  guardroom: {
    id: 'guardroom',
    background: 'room-guardroom',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [] },
    scale: FLAT,
    surface: 'stone',
    music: 'tension',
    light: { tint: 0xf0d8c0, farDim: 1 },
    look: { grade: { saturation: 0.9, brightness: 0.95, contrast: 1.06, warmth: 0.15 }, vignette: 0.45 },
    // The stove's glow, and three torches on the painted iron brackets (left high, right high, by the desk).
    ambient: { glows: [
      { x: 330, y: 220, r: 70, color: 0xff9a40 },
      { x: 41, y: 12, r: 70, color: 0xffa048 }, { x: 479, y: 11, r: 70, color: 0xffa048 }, { x: 410.5, y: 91, r: 70, color: 0xffa048 },
    ] },
    props: [
      { kind: 'flame', x: 41, y: 9, size: 14, color: 0xffb060, depth: 9000 },
      { kind: 'flame', x: 479, y: 8, size: 14, color: 0xffb060, depth: 9000 },
      { kind: 'flame', x: 410.5, y: 88, size: 14, color: 0xffb060, depth: 9000 },
    ],
    entries: { fromCell: { x: 50, y: 300, face: 'right' } },
    // Torches on the brackets; the ledger on its shelf until Silas takes it (cut from Codex's
    // painting, which is painted without it; the clerk's hood is no longer on its peg).
    objects: [
      { id: 'torch1', sheet: 'guardroom-torch', x: 41, y: 52, depth: 40 },
      { id: 'torch2', sheet: 'guardroom-torch', x: 479, y: 51, depth: 40 },
      { id: 'torch3', sheet: 'guardroom-torch', x: 410.5, y: 131, depth: 40 },
      { id: 'ledger', sheet: 'guardroom-ledger', x: 216, y: 213, depth: 50, visibleIf: [{ notFlag: 'tookLedger' }] },
    ],
    hotspots: guardroomHotspots,
    actors: [
      // Benn, sent up "to warm himself", asleep again on a stool by the stove: Silas must not wake him.
      { id: 'guard', x: 382, y: 306, visibleIf: [{ flag: 'guardGone' }], task: { tag: 'sit' }, snores: [], sheet: [{ if: [{ flag: 'gotKeys' }], pick: 'guard-nokeys' }] },
      // Kell, left of the stove between the fire and the ledger, watching the right (the grate).
      // Off to fetch his supper: down the stairs on the left.
      { id: 'warden', x: 272, y: 304, visibleIf: [{ notFlag: 'wardenBusy' }], leaves: { to: { x: -40, y: 300 } } },
    ],
  },
  outerDoor: {
    id: 'outerDoor',
    background: 'room-prison-door',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [] },
    scale: FLAT,
    surface: 'ash',
    music: 'wind',
    light: { tint: 0xd0dcf0, farDim: 1 },
    look: { grade: { saturation: 0.75, brightness: 0.9, contrast: 1.1, warmth: -0.2 }, vignette: 0.5 },
    ambient: { particles: [{ kind: 'ash', x: 0, y: 0, w: 640, h: 260 }] },
    entries: { fromGuardroom: { x: 90, y: 300, face: 'right' } },
    objects: [],
    hotspots: outerHotspots,
    actors: [{ id: 'sigrid', x: 470, y: 302 }],
  },
};

export const START_ROOM = 'cell';
export const START_ENTRY = 'start';
