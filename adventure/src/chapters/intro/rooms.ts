import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const FLAT = { farY: 268, farScale: 1, nearY: 345, nearScale: 1 };

/** Only what is lit: in the dark cell, things away from Silas and the candle can't be made out. */
const LIT = [{ flag: 'cellLit' }];

// The cell, Ironhaven's prison, at night. Silas's side: a straw cot (left), a tin plate with a crust
// beside it, the weeping wall, a bucket, a small barred window high up; the bars and their door
// (centre right). Beyond the bars: the guard's table with its candle, the confiscated frame, the
// duty roster on the wall, and the guard asleep in his chair; the stairs up at the far right.
const cellHotspots: HotspotDef[] = [
  { id: 'plate', name: 'name.i.plate', polygon: rect(158, 298, 30, 14), verbs: ['look', 'take'], walkTo: pt(170, 318), face: 'down', visibleIf: [{ notFlag: 'tookPlate' }] },
  { id: 'frame', name: 'name.i.frame', polygon: rect(484, 232, 24, 12), verbs: ['look', 'take'], walkTo: pt(350, 300), face: 'right', visibleIf: [...LIT, { notFlag: 'gotFrame' }] },
  { id: 'roster', name: 'name.i.roster', polygon: rect(540, 136, 38, 48), verbs: ['look'], visibleIf: LIT },
  { id: 'candle', name: 'name.i.candle', polygon: rect(462, 206, 16, 24), verbs: ['look', 'take'] },
  { id: 'table', name: 'name.i.table', polygon: rect(436, 230, 92, 44), verbs: ['look', 'take'], walkTo: pt(350, 300), face: 'right' },
  { id: 'window', name: 'name.i.window', polygon: rect(146, 62, 60, 50), verbs: ['look', 'use'], walkTo: pt(176, 290), face: 'up' },
  { id: 'cot', name: 'name.i.cot', polygon: rect(34, 236, 120, 54), verbs: ['look', 'use', 'take'], walkTo: pt(96, 296), face: 'up' },
  { id: 'wall', name: 'name.i.wall', polygon: rect(214, 118, 76, 116), verbs: ['look', 'take', 'use'], walkTo: pt(252, 286), face: 'up', visibleIf: LIT },
  { id: 'bucket', name: 'name.i.bucket', polygon: rect(298, 266, 32, 32), verbs: ['look', 'use', 'take'], walkTo: pt(300, 306), face: 'right', visibleIf: LIT },
  { id: 'cellDoor', name: 'name.i.cellDoor', polygon: rect(366, 112, 34, 230), verbs: ['look', 'open', 'go', 'use'], walkTo: pt(352, 300), face: 'right' },
  { id: 'corridorStairs', name: 'name.i.stairs', polygon: rect(590, 90, 50, 172), verbs: ['look', 'go'], visibleIf: LIT },
];

// The guardroom at the top of the stairs: a peg with a clerk's hood (left), the tally clerk's ledger
// on a shelf, the wide-awake guard at his desk, and the grate out (right edge).
const guardroomHotspots: HotspotDef[] = [
  { id: 'hood', name: 'name.i.hood', polygon: rect(110, 118, 34, 62), verbs: ['look', 'take'], walkTo: pt(128, 292), face: 'up', visibleIf: [{ notFlag: 'tookHood' }] },
  { id: 'ledger', name: 'name.i.ledger', polygon: rect(196, 196, 40, 18), verbs: ['look', 'take', 'open'], walkTo: pt(216, 292), face: 'up', visibleIf: [{ notFlag: 'tookLedger' }] },
  { id: 'grate', name: 'name.i.grate', polygon: rect(560, 110, 76, 152), verbs: ['look', 'open', 'go', 'use'], walkTo: pt(590, 296), face: 'right' },
  { id: 'downStairs', name: 'name.i.downStairs', polygon: rect(0, 150, 40, 112), verbs: ['look', 'go'], walkTo: pt(30, 300), face: 'left' },
  { id: 'stove', name: 'name.i.stove', polygon: rect(300, 180, 60, 82), verbs: ['look', 'use'] },
];

// The outer door: a snowy yard under Ironhaven's walls, the door Silas comes out of (left).
const outerHotspots: HotspotDef[] = [
  { id: 'walls', name: 'name.i.walls', polygon: rect(0, 0, 640, 200), verbs: ['look'] },
];

export const ROOMS: Record<string, RoomDef> = {
  cell: {
    id: 'cell',
    background: 'room-cell',
    // Silas's side of the bars only.
    walkable: { outer: [pt(24, 268), pt(360, 268), pt(360, 345), pt(24, 345)], holes: [] },
    scale: FLAT,
    surface: 'stone',
    music: 'tension',
    light: { tint: 0xc8c0d8, farDim: 1 },
    look: { grade: { saturation: 0.8, brightness: 0.92, contrast: 1.08, warmth: -0.1 }, vignette: 0.55 },
    // Black but for the candle beyond the bars and the thin moonlight, until Silas throws the
    // moonlight across the cell with the tin plate.
    dark: { if: [{ notFlag: 'cellLit' }], lights: [{ x: 470, y: 220, r: 90 }, { x: 176, y: 88, r: 46 }], heroR: 110 },
    ambient: { particles: [{ kind: 'dust', x: 40, y: 60, w: 560, h: 200 }], glows: [{ x: 470, y: 212, r: 46, color: 0xffb860 }] },
    props: [{ kind: 'flame', x: 470, y: 210, size: 9, color: 0xffc070, depth: 9000 }],
    entries: { start: { x: 110, y: 304, face: 'right' }, fromGuardroom: { x: 330, y: 300, face: 'left' } },
    objects: [],
    hotspots: cellHotspots,
    actors: [
      { id: 'guard', x: 566, y: 300, visibleIf: [{ notFlag: 'guardGone' }] },
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
    ambient: { glows: [{ x: 330, y: 220, r: 70, color: 0xff9a40 }] },
    entries: { fromCell: { x: 50, y: 300, face: 'right' } },
    objects: [],
    hotspots: guardroomHotspots,
    actors: [{ id: 'warden', x: 440, y: 304, visibleIf: [{ notFlag: 'grateOpen' }] }],
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
