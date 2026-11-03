import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });

// Placeholder art: the tunnels, the road and the back room are painted in code (art/ch2.mjs) to fit these
// spots; the workshop is Kiln Courier's tempering-house painting. Hotspots are tested in list
// order: put small things before large ones they overlap.

const roadHotspots: HotspotDef[] = [
  { id: 'doorframe', name: 'name2.doorframe', polygon: rect(362, 146, 14, 110), verbs: ['look'], walkTo: pt(380, 272), face: 'up', secret: true },
  { id: 'bell', name: 'name2.bell', polygon: rect(446, 134, 22, 34), verbs: ['look', 'use'], walkTo: pt(430, 272), face: 'up' },
  { id: 'door', name: 'name2.door', polygon: rect(376, 143, 71, 114), verbs: ['look', 'open', 'use', 'go'], walkTo: pt(410, 272), face: 'up' },
  { id: 'window', name: 'name2.window', polygon: rect(475, 160, 70, 45), verbs: ['look'], walkTo: pt(505, 272), face: 'up' },
  { id: 'signpost', name: 'name2.signpost', polygon: rect(100, 180, 75, 82), verbs: ['look'], walkTo: pt(150, 280), face: 'up' },
  { id: 'farPipes', name: 'name2.farPipes', polygon: rect(0, 70, 340, 70), verbs: ['look'] },
  { id: 'roadBack', name: 'name2.roadBack', polygon: rect(0, 240, 30, 118), verbs: ['look', 'go'] },
];

const workshopHotspots: HotspotDef[] = [
  { id: 'crucible', name: 'name2.crucible', polygon: rect(48, 112, 38, 44), verbs: ['look'], walkTo: pt(160, 262), face: 'left', secret: true },
  { id: 'readingValve', name: 'name2.readingValve', polygon: rect(360, 60, 24, 36), verbs: ['look', 'use', 'open'], walkTo: pt(372, 222), face: 'up' },
  { id: 'stool2', name: 'name2.stool', polygon: rect(55, 192, 70, 70), verbs: ['look', 'use'] },
  { id: 'bench', name: 'name2.bench', polygon: rect(0, 150, 145, 85), verbs: ['look', 'use'], walkTo: pt(170, 262), face: 'left' },
  { id: 'cage', name: 'name2.cage', polygon: rect(150, 115, 140, 90), verbs: ['look', 'use', 'open'], walkTo: pt(222, 232), face: 'up' },
  { id: 'coal', name: 'name2.coal', polygon: rect(365, 145, 40, 38), verbs: ['look', 'take'], walkTo: pt(385, 222), face: 'up' },
  { id: 'toBackroom', name: 'name2.toBackroom', polygon: rect(95, 72, 28, 70), verbs: ['look', 'go'], walkTo: pt(150, 262), face: 'left' },
  { id: 'view', name: 'name2.view', polygon: rect(480, 0, 160, 120), verbs: ['look'] },
  { id: 'returnPipe', name: 'name2.returnPipe', polygon: rect(100, 0, 290, 58), verbs: ['look', 'use'] },
  { id: 'toRoad', name: 'name2.toRoad', polygon: rect(610, 180, 30, 120), verbs: ['look', 'go'], walkTo: pt(612, 270), face: 'right' },
];

// The tunnels (painted in code, art/ch2.mjs): dark, lit by a failing lamp and Mara's gauntlet.
const collapseHotspots: HotspotDef[] = [
  // Only for a Mara without Tobi's scarf (it is optional in chapter 1): the cistern needs one or the other.
  { id: 'rag', name: 'name2.rag', polygon: rect(96, 284, 30, 22), verbs: ['look', 'take'], walkTo: pt(150, 318), face: 'left', visibleIf: [{ lacks: 'scarf' }, { notFlag: 'foundRag' }] },
  { id: 'grate', name: 'name2.grate', polygon: rect(432, 175, 66, 76), verbs: ['look', 'open', 'use', 'go'], walkTo: pt(465, 266), face: 'up' },
  { id: 'rubble', name: 'name2.rubble', polygon: rect(0, 130, 130, 190), verbs: ['look', 'use', 'go'] },
  { id: 'lamp1', name: 'name2.lamp', polygon: rect(306, 40, 28, 24), verbs: ['look'] },
  { id: 'pipes1', name: 'name2.ceilingPipes', polygon: rect(0, 6, 640, 34), verbs: ['look', 'use'] },
  { id: 'puddles', name: 'name2.puddles', polygon: rect(150, 300, 400, 58), verbs: ['look'] },
];

const steamHotspots: HotspotDef[] = [
  { id: 'copperValve', name: 'name2.copperValve', polygon: rect(250, 150, 32, 32), verbs: ['look', 'use', 'open'], walkTo: pt(265, 262), face: 'up' },
  { id: 'ironValve', name: 'name2.ironValve', polygon: rect(320, 150, 32, 32), verbs: ['look', 'use', 'open'], walkTo: pt(335, 262), face: 'up' },
  { id: 'gauge2', name: 'name2.gauge', polygon: rect(288, 103, 24, 24), verbs: ['look', 'use'], walkTo: pt(300, 262), face: 'up' },
  { id: 'steamJet', name: 'name2.steamJet', polygon: rect(525, 150, 70, 140), verbs: ['look', 'use', 'go'], walkTo: pt(470, 296), face: 'right' },
  { id: 'leakPipe', name: 'name2.leakPipe', polygon: rect(380, 108, 200, 38), verbs: ['look', 'use'] },
  { id: 'passage', name: 'name2.passage', polygon: rect(600, 170, 40, 110), verbs: ['look', 'go'], walkTo: pt(612, 296), face: 'right' },
  { id: 'steamBack', name: 'name2.wayBack', polygon: rect(0, 180, 30, 100), verbs: ['look', 'go'], walkTo: pt(30, 296), face: 'left' },
];

const cisternHotspots: HotspotDef[] = [
  { id: 'cleat', name: 'name2.cleat', polygon: rect(268, 238, 34, 24), verbs: ['look', 'use', 'open'], walkTo: pt(262, 290), face: 'up' },
  { id: 'chain', name: 'name2.chain', polygon: rect(278, 60, 14, 178), verbs: ['look', 'use', 'take'], walkTo: pt(262, 290), face: 'up' },
  { id: 'basket', name: 'name2.basket', polygon: rect(380, 76, 42, 46), verbs: ['look', 'use', 'take'] },
  { id: 'bridge', name: 'name2.bridge', polygon: rect(448, 150, 26, 112), verbs: ['look', 'use'] },
  { id: 'pit', name: 'name2.pit', polygon: rect(330, 255, 150, 105), verbs: ['look', 'go'] },
  { id: 'farLedge', name: 'name2.farLedge', polygon: rect(480, 150, 160, 210), verbs: ['look', 'go'], walkTo: pt(318, 300), face: 'right' },
  { id: 'cisternBack', name: 'name2.wayBack', polygon: rect(0, 180, 30, 100), verbs: ['look', 'go'], walkTo: pt(30, 300), face: 'left' },
];

const backroomHotspots: HotspotDef[] = [
  { id: 'pouch', name: 'name2.pouch', polygon: rect(524, 150, 24, 34), verbs: ['look', 'open', 'take'], walkTo: pt(556, 290), face: 'up' },
  { id: 'map', name: 'name2.map', polygon: rect(280, 85, 115, 80), verbs: ['look', 'take'], walkTo: pt(340, 290), face: 'up' },
  { id: 'farDoor', name: 'name2.farDoor', polygon: rect(575, 115, 60, 150), verbs: ['look', 'open', 'go'], walkTo: pt(600, 290), face: 'right' },
  { id: 'shelf', name: 'name2.shelf', polygon: rect(185, 105, 65, 115), verbs: ['look', 'take'], walkTo: pt(220, 290), face: 'up' },
  { id: 'hearth2', name: 'name2.hearth', polygon: rect(45, 125, 125, 150), verbs: ['look', 'use'], walkTo: pt(190, 292), face: 'left' },
  { id: 'table', name: 'name2.table', polygon: rect(260, 215, 160, 45), verbs: ['look', 'use', 'take'], walkTo: pt(340, 296), face: 'up' },
  { id: 'cot', name: 'name2.cot', polygon: rect(450, 226, 150, 60), verbs: ['look', 'use'], walkTo: pt(520, 302), face: 'up' },
  { id: 'toWorkshop', name: 'name2.toWorkshop', polygon: rect(0, 110, 35, 165), verbs: ['look', 'go'], walkTo: pt(40, 292), face: 'left' },
];

/** The tunnels' shared light and feel: a dim grade, Mara's gauntlet glow, damp stone underfoot. */
const TUNNEL = {
  surface: 'stone' as const,
  music: 'tension' as const,
  light: { tint: 0xb8aaa0, farDim: 0.7 },
  heroLight: { r: 120, color: 0xff9040 },
  look: { grade: { saturation: 0.85, brightness: 0.86, contrast: 1.1, warmth: 0.05 }, vignette: 0.6 },
};
const tunnelFloor = { outer: [pt(0, 282), pt(200, 254), pt(440, 254), pt(640, 282), pt(640, 358), pt(0, 358)], holes: [] };
const tunnelScale = { farY: 254, farScale: 0.82, nearY: 358, nearScale: 1.08 };

export const ROOMS: Record<string, RoomDef> = {
  tunnelCollapse: {
    id: 'tunnelCollapse',
    background: 'room-tunnel-collapse',
    ...TUNNEL,
    // The rubble fills the left: he can't go back the way he came.
    walkable: { outer: [pt(130, 300), pt(200, 256), pt(440, 256), pt(640, 284), pt(640, 358), pt(130, 358)], holes: [] },
    scale: tunnelScale,
    ambient: { particles: [{ kind: 'dust', x: 140, y: 60, w: 500, h: 200 }], glows: [{ x: 320, y: 52, r: 60, color: 0xffc870, warm: true }] },
    sign: { x: 200, y: 44, drop: 10, w: 110, h: 22, style: 'iron' },
    entries: {
      start: { x: 180, y: 320, face: 'right' },
      fromSteam: { x: 465, y: 272, face: 'down' },
    },
    objects: [
      { id: 'ragObj', sheet: 'rag', x: 111, y: 306, depth: 330, visibleIf: [{ lacks: 'scarf' }, { notFlag: 'foundRag' }] },
      { id: 'grateObj', sheet: 'grate', x: 465, y: 251, depth: 200, flag: 'grateOpen', whenTrue: 'open', whenFalse: 'closed' },
    ],
    hotspots: collapseHotspots,
    actors: [],
  },
  tunnelSteam: {
    id: 'tunnelSteam',
    background: 'room-tunnel-steam',
    ...TUNNEL,
    walkable: tunnelFloor,
    scale: tunnelScale,
    ambient: { particles: [{ kind: 'steam', x: 520, y: 150, w: 80, h: 130 }], glows: [{ x: 150, y: 52, r: 60, color: 0xffc870, warm: true }] },
    sign: { x: 440, y: 44, drop: 10, w: 120, h: 22, style: 'iron' },
    entries: {
      start: { x: 50, y: 300, face: 'right' },
      fromCistern: { x: 600, y: 300, face: 'left' },
    },
    objects: [{ id: 'steamObj', sheet: 'steam', x: 560, y: 290, depth: 600, flag: 'steamOff', whenTrue: 'off', whenFalse: 'on' }],
    hotspots: steamHotspots,
    actors: [],
  },
  tunnelCistern: {
    id: 'tunnelCistern',
    background: 'room-tunnel-cistern',
    ...TUNNEL,
    // The pit (centre) cuts the floor: the near side only, until the bridge is down.
    walkable: { outer: [pt(0, 282), pt(200, 254), pt(326, 254), pt(326, 358), pt(0, 358)], holes: [] },
    scale: tunnelScale,
    ambient: {
      particles: [{ kind: 'ash', x: 480, y: 120, w: 160, h: 140 }],
      glows: [{ x: 80, y: 52, r: 60, color: 0xffc870, warm: true }, { x: 590, y: 165, r: 80, color: 0xc8c0d8 }],
    },
    sign: { x: 160, y: 104, drop: 10, w: 110, h: 22, style: 'iron' },
    entries: {
      start: { x: 50, y: 300, face: 'right' },
    },
    objects: [
      { id: 'bridgeObj', sheet: 'bridge', x: 408, y: 262, depth: 250, flag: 'bridgeDown', whenTrue: 'down', whenFalse: 'up' },
      { id: 'basketObj', sheet: 'basket', x: 400, y: 122, depth: 120, flag: 'bridgeDown', whenTrue: 'gone', whenFalse: 'hanging' },
    ],
    hotspots: cisternHotspots,
    actors: [],
  },
  road: {
    id: 'road',
    background: 'room-road',
    walkable: { outer: [pt(0, 250), pt(640, 232), pt(640, 358), pt(0, 358)], holes: [] },
    scale: { farY: 232, farScale: 0.92, nearY: 358, nearScale: 1.1 },
    surface: 'ash',
    music: 'wind',
    light: { tint: 0xd8d4e0, farDim: 0.86 },
    look: { grade: { saturation: 0.96, brightness: 1, contrast: 1.04, warmth: -0.05 }, vignette: 0.4 },
    ambient: {
      particles: [{ kind: 'ash', x: 0, y: 60, w: 640, h: 200 }],
      glows: [{ x: 510, y: 182, r: 50, color: 0xffb860, warm: true }, { x: 356, y: 159, r: 30, color: 0xffd27a, warm: true }],
    },
    sign: { x: 520, y: 56, drop: 12, w: 100, h: 22, style: 'wood' },
    entries: {
      start: { x: 110, y: 300, face: 'right' },
      fromWorkshop: { x: 410, y: 280, face: 'down' },
    },
    objects: [],
    hotspots: roadHotspots,
    actors: [],
  },
  workshop: {
    id: 'workshop',
    background: 'room-workshop',
    walkable: {
      outer: [pt(150, 200), pt(300, 200), pt(470, 182), pt(640, 186), pt(640, 358), pt(0, 358), pt(0, 262), pt(125, 262), pt(150, 236)],
      holes: [],
    },
    scale: { farY: 182, farScale: 0.82, nearY: 358, nearScale: 1.18 },
    music: 'warm',
    light: { tint: 0xffe2c0, farDim: 0.86 },
    look: { grade: { saturation: 1.04, brightness: 1.02, contrast: 1.04, warmth: 0.25 }, vignette: 0.3 },
    ambient: {
      particles: [{ kind: 'dust', x: 440, y: 40, w: 200, h: 160 }],
      glows: [{ x: 372, y: 78, r: 22, color: 0xff9a34, warm: true }, { x: 190, y: 60, r: 18, color: 0xff9a34, warm: true }],
    },
    sign: { x: 405, y: 126, drop: 8, w: 110, h: 22, style: 'iron' },
    entries: {
      fromRoad: { x: 600, y: 280, face: 'left' },
      fromBackroom: { x: 160, y: 270, face: 'right' },
    },
    objects: [],
    hotspots: workshopHotspots,
    // Bryn is in her workshop until she has read the regulator; then she goes to make supper.
    actors: [{ id: 'bryn', x: 440, y: 252, visibleIf: [{ notFlag: 'recordsRead' }] }],
  },
  backroom: {
    id: 'backroom',
    background: 'room-backroom',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 358), pt(0, 358)], holes: [] },
    scale: { farY: 268, farScale: 1, nearY: 358, nearScale: 1.12 },
    music: 'warm',
    light: { tint: 0xffd8b0, farDim: 0.9 },
    look: { grade: { saturation: 1.05, brightness: 1, contrast: 1.05, warmth: 0.35 }, vignette: 0.36 },
    ambient: { glows: [{ x: 108, y: 255, r: 70, color: 0xff9a40, warm: true }, { x: 340, y: 210, r: 60, color: 0xffc070 }] },
    entries: {
      fromWorkshop: { x: 60, y: 302, face: 'right' },
    },
    objects: [],
    hotspots: backroomHotspots,
    actors: [{ id: 'bryn', x: 400, y: 312, visibleIf: [{ flag: 'recordsRead' }] }],
  },
};

export const START_ROOM = 'tunnelCollapse';
export const START_ENTRY = 'start';
