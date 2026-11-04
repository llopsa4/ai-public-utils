import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });

// Every room is flat 2D (as in chapter 1): the back wall meets the floor at y 262, and a floor band
// from y 268 to 345 is where people walk, always at the same size. Exits are at the sides (or a
// stair), never two doors side by side. Things stand on the floor line or hang on the wall above
// it; each room's layout image (art/spec/<room>.jpg) shows this for the painters. Hotspots are
// tested in list order: small things before large ones they overlap.

/** The shared floor band and the flat scale. */
const band = (holes: Polygon[] = []) => ({ outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes });
const FLAT = { farY: 268, farScale: 1, nearY: 345, nearScale: 1 };

// The tunnel mouth at dawn (the calm start): the ash road back (left edge), the dawn sky, an old pipe
// lying along the ground to sit on, and the brick arch of service line 4 (right edge) with its lamp
// and iron plate.
const mouthHotspots: HotspotDef[] = [
  { id: 'plate', name: 'name2.plate', polygon: rect(508, 74, 92, 20), verbs: ['look'] },
  { id: 'mouthLamp', name: 'name2.lamp', polygon: rect(486, 130, 14, 18), verbs: ['look'] },
  { id: 'arch', name: 'name2.arch', polygon: rect(512, 98, 118, 166), verbs: ['look', 'go'], walkTo: pt(600, 290), face: 'right' },
  { id: 'pipeSeat', name: 'name2.pipeSeat', polygon: rect(180, 238, 170, 26), verbs: ['look', 'use'], walkTo: pt(265, 282), face: 'up' },
  { id: 'dawn', name: 'name2.dawn', polygon: rect(0, 0, 420, 150), verbs: ['look'] },
  { id: 'ashRoad', name: 'name2.ashRoad', polygon: rect(0, 150, 36, 114), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
];

// The tunnels: dark, lit by a failing lamp and Mara's gauntlet. The collapsed tunnel: the fallen
// roof blocking the way back (left), the rag caught at its foot (only without Tobi's scarf), the
// rusted grate at the right edge (the way on), pipes along the ceiling, puddles.
const collapseHotspots: HotspotDef[] = [
  // Only for a Mara without Tobi's scarf (it is optional in chapter 1): the cistern needs one or the other.
  { id: 'rag', name: 'name2.rag', polygon: rect(124, 270, 30, 16), verbs: ['look', 'take'], walkTo: pt(170, 292), face: 'left', visibleIf: [{ lacks: 'scarf' }, { notFlag: 'foundRag' }] },
  { id: 'grate', name: 'name2.grate', polygon: rect(560, 150, 74, 112), verbs: ['look', 'open', 'use', 'go'], walkTo: pt(596, 290), face: 'right' },
  { id: 'rubble', name: 'name2.rubble', polygon: rect(0, 110, 120, 235), verbs: ['look', 'use', 'go'] },
  { id: 'lamp1', name: 'name2.lamp', polygon: rect(306, 40, 28, 24), verbs: ['look'] },
  { id: 'pipes1', name: 'name2.ceilingPipes', polygon: rect(0, 6, 640, 34), verbs: ['look', 'use'] },
  { id: 'puddles', name: 'name2.puddles', polygon: rect(160, 316, 380, 29), verbs: ['look'] },
];

// The steam junction: the way back (left edge), the copper and iron valve wheels under a gauge, the
// leaking copper-banded pipe, the jet of steam across the floor in front of the passage on (right).
const steamHotspots: HotspotDef[] = [
  { id: 'gauge2', name: 'name2.gauge', polygon: rect(288, 140, 24, 24), verbs: ['look', 'use'], walkTo: pt(300, 282), face: 'up' },
  { id: 'copperValve', name: 'name2.copperValve', polygon: rect(250, 186, 32, 32), verbs: ['look', 'use', 'open'], walkTo: pt(264, 282), face: 'up' },
  { id: 'ironValve', name: 'name2.ironValve', polygon: rect(320, 186, 32, 32), verbs: ['look', 'use', 'open'], walkTo: pt(338, 282), face: 'up' },
  { id: 'steamJet', name: 'name2.steamJet', polygon: rect(500, 160, 70, 140), verbs: ['look', 'use', 'go'], walkTo: pt(460, 296), face: 'right' },
  { id: 'leakPipe', name: 'name2.leakPipe', polygon: rect(380, 120, 200, 36), verbs: ['look', 'use'] },
  { id: 'passage', name: 'name2.passage', polygon: rect(596, 120, 44, 144), verbs: ['look', 'go'], walkTo: pt(616, 292), face: 'right' },
  { id: 'steamBack', name: 'name2.wayBack', polygon: rect(0, 120, 30, 144), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
];

// The ash cistern: the way back (left edge), the cleat with the hot chain running up to the pulley,
// the nest basket under the pulley, the pit cutting across the floor, the drawbridge (up on the far
// side, or down across the pit), and the far ledge with daylight (right).
const cisternHotspots: HotspotDef[] = [
  { id: 'cleat', name: 'name2.cleat', polygon: rect(268, 244, 34, 22), verbs: ['look', 'use', 'open'], walkTo: pt(262, 290), face: 'up' },
  { id: 'chain', name: 'name2.chain', polygon: rect(278, 60, 14, 184), verbs: ['look', 'use', 'take'], walkTo: pt(262, 290), face: 'up' },
  { id: 'basket', name: 'name2.basket', polygon: rect(380, 76, 42, 46), verbs: ['look', 'use', 'take'] },
  { id: 'bridge', name: 'name2.bridge', polygon: rect(448, 190, 26, 110), verbs: ['look', 'use'] },
  { id: 'pit', name: 'name2.pit', polygon: rect(330, 262, 150, 83), verbs: ['look', 'go'] },
  { id: 'farLedge', name: 'name2.farLedge', polygon: rect(482, 120, 158, 225), verbs: ['look', 'go'], walkTo: pt(318, 300), face: 'right' },
  { id: 'cisternBack', name: 'name2.wayBack', polygon: rect(0, 120, 30, 144), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
];

// Bryn's road: the road back towards Cinderfold (left edge) with its signpost, the great pipes in
// the haze, and the front of the tempering house on the right: its door (a scratched doorframe
// beside it), the bell, and a lit window.
const roadHotspots: HotspotDef[] = [
  { id: 'doorframe', name: 'name2.doorframe', polygon: rect(388, 110, 12, 152), verbs: ['look'], walkTo: pt(404, 284), face: 'up', secret: true },
  { id: 'bell', name: 'name2.bell', polygon: rect(478, 120, 22, 34), verbs: ['look', 'use'], walkTo: pt(472, 284), face: 'up' },
  { id: 'door', name: 'name2.door', polygon: rect(400, 102, 72, 160), verbs: ['look', 'open', 'use', 'go'], walkTo: pt(436, 284), face: 'up' },
  { id: 'window', name: 'name2.window', polygon: rect(512, 140, 76, 56), verbs: ['look'], walkTo: pt(550, 284), face: 'up' },
  { id: 'signpost', name: 'name2.signpost', polygon: rect(80, 160, 70, 102), verbs: ['look'], walkTo: pt(115, 284), face: 'up' },
  { id: 'farPipes', name: 'name2.farPipes', polygon: rect(0, 50, 360, 80), verbs: ['look'] },
  { id: 'roadBack', name: 'name2.roadBack', polygon: rect(0, 150, 30, 114), verbs: ['look', 'go'] },
];

// Bryn's workshop: the curtain to the back room (left edge), her bench with the crucible on it and a
// stool, the caged training rig in the middle, the great return pipe across the top with its
// reading valve, a coal crate, the open side looking out over the valley, the way out (right edge).
const workshopHotspots: HotspotDef[] = [
  { id: 'crucible', name: 'name2.crucible', polygon: rect(70, 168, 30, 26), verbs: ['look'], walkTo: pt(110, 282), face: 'up', secret: true },
  { id: 'readingValve', name: 'name2.readingValve', polygon: rect(400, 80, 26, 36), verbs: ['look', 'use', 'open'], walkTo: pt(413, 282), face: 'up' },
  { id: 'stool2', name: 'name2.stool', polygon: rect(184, 232, 34, 36), verbs: ['look', 'use'] },
  { id: 'bench', name: 'name2.bench', polygon: rect(36, 190, 140, 72), verbs: ['look', 'use'], walkTo: pt(110, 282), face: 'up' },
  { id: 'cage', name: 'name2.cage', polygon: rect(240, 150, 140, 112), verbs: ['look', 'use', 'open'], walkTo: pt(310, 284), face: 'up' },
  { id: 'coal', name: 'name2.coal', polygon: rect(440, 222, 46, 40), verbs: ['look', 'take'], walkTo: pt(462, 284), face: 'up' },
  { id: 'toBackroom', name: 'name2.toBackroom', polygon: rect(0, 110, 30, 154), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
  { id: 'view', name: 'name2.view', polygon: rect(490, 40, 110, 150), verbs: ['look'] },
  { id: 'returnPipe', name: 'name2.returnPipe', polygon: rect(100, 8, 440, 60), verbs: ['look', 'use'] },
  { id: 'toRoad', name: 'name2.toRoad', polygon: rect(610, 110, 30, 154), verbs: ['look', 'go'], walkTo: pt(616, 292), face: 'right' },
];

// Bryn's back room: the curtain back to the workshop (left edge), the hearth with the pot, a shelf of
// supplies, the map pinned over the table, the cot, the courier's pouch on a peg, the far door (right).
const backroomHotspots: HotspotDef[] = [
  { id: 'pouch', name: 'name2.pouch', polygon: rect(560, 150, 22, 30), verbs: ['look', 'open', 'take'], walkTo: pt(566, 288), face: 'up' },
  { id: 'map', name: 'name2.map', polygon: rect(270, 90, 110, 72), verbs: ['look', 'take'], walkTo: pt(325, 284), face: 'up' },
  { id: 'farDoor', name: 'name2.farDoor', polygon: rect(590, 104, 50, 160), verbs: ['look', 'open', 'go'], walkTo: pt(616, 292), face: 'right' },
  { id: 'shelf', name: 'name2.shelf', polygon: rect(180, 104, 60, 126), verbs: ['look', 'take'], walkTo: pt(210, 284), face: 'up' },
  { id: 'hearth2', name: 'name2.hearth', polygon: rect(46, 140, 112, 122), verbs: ['look', 'use'], walkTo: pt(140, 284), face: 'up' },
  { id: 'table', name: 'name2.table', polygon: rect(260, 212, 150, 50), verbs: ['look', 'use', 'take'], walkTo: pt(300, 288), face: 'up' },
  { id: 'cot', name: 'name2.cot', polygon: rect(440, 222, 140, 42), verbs: ['look', 'use'], walkTo: pt(510, 290), face: 'up' },
  { id: 'toWorkshop', name: 'name2.toWorkshop', polygon: rect(0, 104, 30, 160), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
];

/** The tunnels' shared light and feel: a dim grade, Mara's gauntlet glow, damp stone underfoot. */
const TUNNEL = {
  surface: 'stone' as const,
  music: 'tension' as const,
  light: { tint: 0xb8aaa0, farDim: 1 },
  heroLight: { r: 120, color: 0xff9040 },
  look: { grade: { saturation: 0.85, brightness: 0.86, contrast: 1.1, warmth: 0.05 }, vignette: 0.6 },
};

export const ROOMS: Record<string, RoomDef> = {
  tunnelMouth: {
    id: 'tunnelMouth',
    background: 'room-tunnel-mouth',
    walkable: band(),
    scale: FLAT,
    surface: 'ash',
    music: 'wind',
    light: { tint: 0xf0dcd0, farDim: 1 },
    look: { grade: { saturation: 1, brightness: 1.02, contrast: 1.02, warmth: 0.15 }, vignette: 0.3 },
    ambient: { particles: [{ kind: 'ash', x: 0, y: 80, w: 640, h: 180 }], glows: [{ x: 493, y: 140, r: 40, color: 0xffd27a, warm: true }] },
    sign: { x: 300, y: 46, drop: 10, w: 120, h: 22, style: 'wood' },
    entries: { start: { x: 80, y: 300, face: 'right' } },
    objects: [],
    hotspots: mouthHotspots,
    actors: [],
  },
  tunnelCollapse: {
    id: 'tunnelCollapse',
    background: 'room-tunnel-collapse',
    ...TUNNEL,
    // The fallen roof fills the left: he can't go back the way he came.
    walkable: { outer: [pt(120, 268), pt(640, 268), pt(640, 345), pt(120, 345)], holes: [] },
    scale: FLAT,
    ambient: { particles: [{ kind: 'dust', x: 140, y: 60, w: 500, h: 200 }], glows: [{ x: 320, y: 52, r: 60, color: 0xffc870, warm: true }] },
    sign: { x: 260, y: 44, drop: 10, w: 110, h: 22, style: 'iron' },
    entries: {
      start: { x: 170, y: 300, face: 'right' },
      fromSteam: { x: 580, y: 296, face: 'left' },
    },
    objects: [
      { id: 'ragObj', sheet: 'rag', x: 139, y: 286, visibleIf: [{ lacks: 'scarf' }, { notFlag: 'foundRag' }] },
      { id: 'grateObj', sheet: 'grate', x: 597, y: 262, depth: 200, flag: 'grateOpen', whenTrue: 'open', whenFalse: 'closed' },
    ],
    hotspots: collapseHotspots,
    actors: [],
  },
  tunnelSteam: {
    id: 'tunnelSteam',
    background: 'room-tunnel-steam',
    ...TUNNEL,
    walkable: band(),
    scale: FLAT,
    ambient: { particles: [{ kind: 'steam', x: 500, y: 160, w: 70, h: 130 }], glows: [{ x: 150, y: 52, r: 60, color: 0xffc870, warm: true }] },
    sign: { x: 440, y: 44, drop: 10, w: 120, h: 22, style: 'iron' },
    entries: {
      start: { x: 50, y: 300, face: 'right' },
      fromCistern: { x: 600, y: 300, face: 'left' },
    },
    objects: [{ id: 'steamObj', sheet: 'steam', x: 535, y: 300, depth: 600, flag: 'steamOff', whenTrue: 'off', whenFalse: 'on' }],
    hotspots: steamHotspots,
    actors: [],
  },
  tunnelCistern: {
    id: 'tunnelCistern',
    background: 'room-tunnel-cistern',
    ...TUNNEL,
    // The pit (centre) cuts the floor: the near side only, until the bridge is down.
    walkable: { outer: [pt(0, 268), pt(326, 268), pt(326, 345), pt(0, 345)], holes: [] },
    scale: FLAT,
    ambient: {
      particles: [{ kind: 'ash', x: 480, y: 120, w: 160, h: 140 }],
      glows: [{ x: 80, y: 52, r: 60, color: 0xffc870, warm: true }, { x: 590, y: 180, r: 80, color: 0xc8c0d8 }],
    },
    sign: { x: 160, y: 104, drop: 10, w: 110, h: 22, style: 'iron' },
    entries: {
      start: { x: 50, y: 300, face: 'right' },
    },
    objects: [
      { id: 'bridgeObj', sheet: 'bridge', x: 408, y: 300, depth: 250, flag: 'bridgeDown', whenTrue: 'down', whenFalse: 'up' },
      { id: 'basketObj', sheet: 'basket', x: 400, y: 122, depth: 120, flag: 'bridgeDown', whenTrue: 'gone', whenFalse: 'hanging' },
    ],
    hotspots: cisternHotspots,
    actors: [],
  },
  road: {
    id: 'road',
    background: 'room-road',
    walkable: band(),
    scale: FLAT,
    surface: 'ash',
    music: 'wind',
    light: { tint: 0xd8d4e0, farDim: 1 },
    look: { grade: { saturation: 0.96, brightness: 1, contrast: 1.04, warmth: -0.05 }, vignette: 0.4 },
    ambient: {
      particles: [{ kind: 'ash', x: 0, y: 60, w: 640, h: 200 }],
      glows: [{ x: 550, y: 168, r: 50, color: 0xffb860, warm: true }, { x: 382, y: 150, r: 30, color: 0xffd27a, warm: true }],
    },
    sign: { x: 540, y: 56, drop: 12, w: 100, h: 22, style: 'wood' },
    entries: {
      start: { x: 60, y: 300, face: 'right' },
      fromWorkshop: { x: 436, y: 292, face: 'down' },
    },
    objects: [],
    hotspots: roadHotspots,
    actors: [],
  },
  workshop: {
    id: 'workshop',
    background: 'room-workshop',
    walkable: band([rect(504, 290, 32, 12)]),
    scale: FLAT,
    music: 'warm',
    light: { tint: 0xffe2c0, farDim: 1 },
    look: { grade: { saturation: 1.04, brightness: 1.02, contrast: 1.04, warmth: 0.25 }, vignette: 0.3 },
    ambient: {
      particles: [{ kind: 'dust', x: 480, y: 40, w: 140, h: 160 }],
      glows: [{ x: 413, y: 98, r: 22, color: 0xff9a34, warm: true }, { x: 85, y: 180, r: 18, color: 0xff9a34, warm: true }],
    },
    sign: { x: 330, y: 120, drop: 8, w: 110, h: 22, style: 'iron' },
    entries: {
      fromRoad: { x: 600, y: 296, face: 'left' },
      fromBackroom: { x: 40, y: 296, face: 'right' },
    },
    objects: [],
    hotspots: workshopHotspots,
    // Bryn is in her workshop until she has read the regulator; then she goes to make supper.
    actors: [{ id: 'bryn', x: 520, y: 296, visibleIf: [{ notFlag: 'recordsRead' }] }],
  },
  backroom: {
    id: 'backroom',
    background: 'room-backroom',
    walkable: band([rect(384, 294, 32, 12)]),
    scale: FLAT,
    music: 'warm',
    // The night tremor: a surge through Bryn's return line puts the lamps and the fire out.
    coldIf: [{ flag: 'tremor' }],
    coldTint: 0x9098b8,
    light: { tint: 0xffd8b0, farDim: 1 },
    look: { grade: { saturation: 1.05, brightness: 1, contrast: 1.05, warmth: 0.35 }, vignette: 0.36 },
    ambient: { glows: [{ x: 102, y: 236, r: 70, color: 0xff9a40, warm: true }, { x: 335, y: 200, r: 60, color: 0xffc070 }] },
    entries: {
      fromWorkshop: { x: 40, y: 296, face: 'right' },
    },
    objects: [],
    hotspots: backroomHotspots,
    actors: [{ id: 'bryn', x: 400, y: 300, visibleIf: [{ flag: 'recordsRead' }] }],
  },
};

export const START_ROOM = 'tunnelMouth';
export const START_ENTRY = 'start';
