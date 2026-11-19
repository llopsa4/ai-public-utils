import { KELL_SEES } from './kellSees';
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
// him (the bars and the door are foreground pieces). Inside: the barred window high up,
// the straw cot, the bucket, and the tin plate on the floor. Outside,
// in the guard's corridor: Silas's confiscated cloak hanging on a nail, Sergeant Harrow's portrait,
// the table with the candle and a cup (the mask frame on it), and the guard's chair. No stairs.
const cellHotspots: HotspotDef[] = [
  { id: 'plate', name: 'name.i.plate', polygon: rect(103, 306, 30, 9), verbs: ['look', 'take'], walkTo: pt(118, 318), face: 'down', visibleIf: [{ notFlag: 'tookPlate' }], outline: { objects: ['floorPlate'] } },
  { id: 'frame', name: 'name.i.frame', polygon: rect(484, 268, 22, 12), verbs: ['look', 'take'], walkTo: pt(340, 300), face: 'right', visibleIf: [...LIT, { notFlag: 'gotFrame' }], outline: { objects: ['frame'] } },
  { id: 'roster', name: 'name.i.roster', polygon: rect(535, 127, 22, 28), verbs: ['look'], visibleIf: LIT, outline: { objects: ['roster'] } },
  // His cloak on its nail beyond the bars: out of reach until the door is open.
  { id: 'cloak', name: 'name.i.cloak', polygon: rect(459, 94, 44, 78), verbs: ['look', 'take'], walkTo: pt(482, 338), face: 'up', visibleIf: [...LIT, { notFlag: 'tookCloak' }], outline: { objects: ['cloak'] } },
  { id: 'candle', name: 'name.i.candle', polygon: rect(469, 265, 8, 16), verbs: ['look', 'take'], outline: { objects: ['candle'] } },
  { id: 'window', name: 'name.i.window', polygon: rect(140, 62, 60, 62), verbs: ['look', 'use'], walkTo: pt(170, 290), face: 'up' },
  // The guard's spare candle burnt down at the table's left end, and the tallow it dripped onto the
  // corridor floor just past the cage door: softened with the bread, the mask's putty. Before the
  // table, so the pointer finds them over its painted silhouette.
  { id: 'floorWax', name: 'name.i.floorWax', polygon: rect(390, 310, 24, 14), verbs: ['look', 'take'], visibleIf: [...LIT, { notFlag: 'tookWax' }], outline: { objects: ['floorWax'] } },
  { id: 'tableStub', name: 'name.i.stub', polygon: rect(444, 274, 8, 8), verbs: ['look', 'take'], visibleIf: LIT, outline: { objects: ['tableStub'] } },
  { id: 'table', name: 'name.i.table', polygon: rect(437, 274, 106, 52), verbs: ['look', 'take'], walkTo: pt(340, 300), face: 'right', outline: { objects: ['table'] } },
  // The blanket draped over the cot (the strip) comes before the cot's frame (the nail): over the
  // cloth, the pointer finds the blanket; on the posts and legs, the frame.
  { id: 'blanket', name: 'name.i.blanket', polygon: rect(43, 266, 104, 17), verbs: ['look', 'take', 'use'], walkTo: pt(95, 300), face: 'up', outline: { objects: ['blanket'] } },
  { id: 'cot', name: 'name.i.cot', polygon: rect(35, 258, 120, 31), verbs: ['look', 'use', 'take'], walkTo: pt(95, 300), face: 'up', outline: { objects: ['cot'] } },
  { id: 'bucket', name: 'name.i.bucket', polygon: rect(301, 264, 26, 29), verbs: ['look', 'use', 'take'], walkTo: pt(290, 306), face: 'right', visibleIf: LIT, outline: { objects: ['bucket'] } },
  // The cage's door, in the middle of its front face.
  { id: 'cellDoor', name: 'name.i.cellDoor', polygon: rect(175, 174, 50, 160), verbs: ['look', 'open', 'use'], walkTo: pt(200, 324), face: 'down', outline: { objects: ['cellDoor'] }, visibleIf: [{ notFlag: 'cellOpen' }] },
  // The way out: warm light falling across the floor at the far right, from the stairs up. The exit
  // is on the light (look or go; a double-click walks straight out).
  { id: 'cellStairs', name: 'name.i.cellStairs', polygon: [pt(640, 324), pt(640, 344), pt(571, 346), pt(560, 343), pt(554, 334), pt(560, 325), pt(571, 322)], verbs: ['look', 'go'], walkTo: pt(614, 336), face: 'right', outline: { objects: ['stairsLight'] } },
];

// The guardroom at the top of the stairs: the tally clerk's ledger
// on a shelf, the wide-awake guard at his desk, and the grate out (right edge).
const guardroomHotspots: HotspotDef[] = [
  { id: 'ledger', name: 'name.i.ledger', polygon: rect(204, 203, 24, 10), verbs: ['look', 'take', 'open'], walkTo: pt(216, 292), face: 'up', visibleIf: [{ notFlag: 'tookLedger' }] },
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
    // C7 r1: clean scenery; taking the independent cloak reveals the bare nail.
    // The cage's whole floor (its right side slants back towards the wall); once the door is open, out
    // through the middle of the front, along the floor in front of the cage, beside its right side to
    // the spilt tallow, and on in front of the table to the stairs light at the right. The strip just
    // inside and just outside the front bars stays shut, so nobody walks through them.
    walkable: { outer: [pt(16, 268), pt(394, 268), pt(372, 328), pt(16, 328)], holes: [] },
    walkableWhen: [{
      if: [{ flag: 'cellOpen' }],
      walkable: { outer: [pt(16, 268), pt(394, 268), pt(372, 328), pt(224, 328), pt(224, 340), pt(386, 340), pt(410, 300),
        pt(436, 300), pt(436, 334), pt(636, 334), pt(636, 352), pt(178, 352), pt(178, 328), pt(16, 328)], holes: [] },
    }],
    // Silas's reach through the bars for the wax (interactions.ts).
    sheets: ['silas-kneel-reach'],
    scale: FLAT,
    surface: 'stone',
    music: 'tension',
    light: { tint: 0xc4d2e3, farDim: 0.96 },
    look: {
      grade: { saturation: 0.86, brightness: 0.98, contrast: 1.04, warmth: -0.08 }, vignette: 0.42,
      // A cold ray of moonlight slanting down from the barred window to the cell floor (seen in the dark too).
      shafts: [
        { x: 170, y: 92, angle: -26, length: 230, width: 32, color: 0xb8c8ff, overDark: true, strength: 1.2, steady: true },
      ],
    },
    // Black but for the candle beyond the bars and the thin moonlight, until Silas throws the
    // moonlight across the cell with the tin plate.
    dark: { if: [{ notFlag: 'cellLit' }], alpha: 0.88, lights: [{ x: 473, y: 266, r: 105 }, { x: 170, y: 92, r: 56 }, { x: 628, y: 334, r: 44 }], heroR: 116 },
    ambient: {
      particles: [{ kind: 'dust', x: 30, y: 66, w: 185, h: 190 }],
      // A drop from the ceiling into the bucket every five seconds.
      drips: [{ x: 314, top: 6, bottom: 266, every: 5000 }],
      glows: [
        // Moonlight holds still; only the candles flicker.
        { x: 170, y: 105, r: 70, color: 0x7898c8, steady: true },
        { x: 473, y: 266, r: 60, color: 0xffb860 },
        // The candle's own glow, over Silas when he stands in front of the table.
        { x: 473, y: 266, r: 22, color: 0xffc070, front: true },
        { x: 626, y: 338, r: 70, color: 0xffa850 }, { x: 612, y: 340, r: 44, color: 0xffc070 },
        // The guttering stub's tiny flame is added separately above its new wick.
        { x: 448, y: 276, r: 16, color: 0xffb860 },
      ],
    },
    props: [{ kind: 'flame', x: 473, y: 266, size: 4, color: 0xffc070, depth: 9000 },
      { kind: 'flame', x: 448, y: 276, size: 2, color: 0xffc070, depth: 9000 }],
    // Fixed cage bars and the smaller doorway's jambs/upper bars stay in place.
    foreground: [
      // Codex's cage overlay without its door (the cellDoor object): in front of anyone inside it, behind
      // anyone on the floor in front of its front bars (y 334).
      { image: 'cell-cage', x: 0, y: 0, depth: 334 },
    ],
    entries: { start: { x: 100, y: 305, face: 'right' }, fromGuardroom: { x: 612, y: 336, face: 'left' } },
    // The tin plate stays wedged in the window bars once it has thrown the moonlight in.
    objects: [
      { id: 'cot', sheet: 'cell-cot', x: 95, y: 289, depth: 50 },
      { id: 'blanket', sheet: 'cell-blanket', x: 95, y: 283, depth: 51 },
      { id: 'bucket', sheet: 'cell-bucket', x: 314, y: 293, depth: 50 },
      { id: 'roster', sheet: 'cell-roster', x: 546, y: 154, depth: 50 },
      { id: 'table', sheet: 'cell-table', x: 490, y: 326, depth: 50 },
      { id: 'candle', sheet: 'cell-candle', x: 473, y: 280, depth: 279 },
      { id: 'cloak', sheet: 'cell-cloak', x: 481, y: 173, depth: 50, visibleIf: [{ notFlag: 'tookCloak' }] },
      { id: 'floorPlate', sheet: 'floor-plate', x: 118, y: 313, depth: 50, visibleIf: [{ notFlag: 'tookPlate' }] },
      { id: 'windowPlate', sheet: 'window-plate', x: 170, y: 123, depth: 50, visibleIf: [{ flag: 'cellLit' }] },
      // The stairwell door's light on the floor, shaped like the doorway.
      { id: 'stairsLight', sheet: 'stairs-light', x: 590, y: 347, depth: 45 },
      // Seen in the dark too, in Benn's candle light (its glow shows from the start); usable once lit.
      { id: 'tableStub', sheet: 'table-stub', x: 448, y: 280, depth: 279 },
      { id: 'floorWax', sheet: 'floor-wax', x: 402, y: 320, depth: 60, visibleIf: [...LIT, { notFlag: 'tookWax' }] },
      { id: 'frame', sheet: 'table-frame', x: 495, y: 280, depth: 280, visibleIf: [...LIT, { notFlag: 'gotFrame' }] },
      // The cage's door (cut from Codex's two overlays): shut, in the plane of the front bars; open, swung
      // outward to the left, its foot just in front of the cage, in front of anyone walking out past it.
      { id: 'cellDoor', sheet: 'cell-gate', x: 183, y: 338, depth: 334, depthWhenTrue: 338, flag: 'cellOpen', whenFalse: 'closed', whenTrue: 'open' },
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
    // Benn sleeps on his stool by the stove (x 382): Silas goes round behind him, never through him.
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [rect(360, 292, 44, 48)] },
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
    // In front of Kell (he watches the right) without the clerk's guise, Silas is seen.
    trips: [{ if: [{ notFlag: 'wearingClerk' }, { notFlag: 'wardenBusy' }], beyondX: 292, run: KELL_SEES }],
    // Approved C7 r2 overlays; complete backing remains behind each drawing.
    objects: [
      { id: 'stove', sheet: 'guardroom-stove', x: 330, y: 262, depth: 40 },
      { id: 'grate', sheet: 'guardroom-grate', x: 596, y: 264, depth: 45, flag: 'grateOpen', whenFalse: 'closed', whenTrue: 'open' },
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
      { id: 'warden', x: 272, y: 304, visibleIf: [{ notFlag: 'wardenBusy' }], leaves: { to: { x: -40, y: 300 } }, watches: true },
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
    // Snow falling over everything, and the door's lantern warming the wall and the snow below it.
    ambient: {
      // Steady snowfall: small slow flakes behind the people, a few larger quicker ones in front.
      particles: [{ kind: 'snow', x: -20, y: -20, w: 680, h: 40 }, { kind: 'snowNear', x: -20, y: -30, w: 680, h: 20 }],
      glows: [{ x: 142, y: 120, r: 60, color: 0xffb860 }, { x: 142, y: 290, r: 70, color: 0xffa850 },
        // A second lantern mid-wall, where Silas meets Sigrid.
        { x: 330, y: 120, r: 60, color: 0xffb860 }, { x: 330, y: 290, r: 70, color: 0xffa850 }],
    },
    props: [{ kind: 'flame', x: 142, y: 122, size: 4, color: 0xffc070, depth: 9000 }, { kind: 'flame', x: 330, y: 122, size: 4, color: 0xffc070, depth: 9000 }],
    entries: { fromGuardroom: { x: 90, y: 300, face: 'right' } },
    objects: [
      { id: 'lantern1', sheet: 'outer-lantern', x: 142, y: 130, depth: 40 },
      { id: 'lantern2', sheet: 'outer-lantern', x: 330, y: 130, depth: 40 },
    ],
    hotspots: outerHotspots,
    // Waiting near the door: at talking distance once Silas steps out.
    actors: [{ id: 'sigrid', x: 380, y: 302 }],
  },
};

export const START_ROOM = 'cell';
export const START_ENTRY = 'start';
