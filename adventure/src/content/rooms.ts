import type { HotspotDef, Point, Polygon, RoomDef } from '../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const COLD = [{ flag: 'kilnCold' }];

// Hotspots are tested in list order: put small things before large ones they overlap.

// Mara's tent: his starting room (tempering-house painting under a canvas ceiling).
const tentHotspots: HotspotDef[] = [
  { id: 'notebook', name: 'name.notebook', polygon: rect(126, 148, 48, 22), verbs: ['look', 'take', 'open'], walkTo: pt(222, 274), face: 'left',
    visibleIf: [{ notFlag: 'hasNotebook' }] },
  { id: 'rack', name: 'name.rack', polygon: rect(442, 190, 56, 72), verbs: ['look', 'take', 'use'], walkTo: pt(430, 272), face: 'right' },
  { id: 'jar', name: 'name.jar', polygon: rect(64, 98, 52, 62), verbs: ['look', 'take'], walkTo: pt(222, 274), face: 'left' },
  { id: 'workbench', name: 'name.workbench', polygon: rect(0, 130, 196, 140), verbs: ['look', 'use'], walkTo: pt(222, 274), face: 'left' },
  { id: 'stool', name: 'name.stool', polygon: rect(75, 205, 94, 96), verbs: ['look', 'use'] },
  { id: 'drum', name: 'name.drum', polygon: rect(200, 102, 190, 124), verbs: ['look', 'use'], walkTo: pt(300, 240), face: 'up' },
  { id: 'tentFlap', name: 'name.tentFlap', polygon: rect(562, 160, 66, 170), verbs: ['look', 'go', 'open'], walkTo: pt(596, 336), face: 'right' },
];

// Kiln hall outside the tent (Kiln Courier's kiln-hall illustration).
const maraRoomHotspots: HotspotDef[] = [
  { id: 'tally', name: 'name.tally', polygon: rect(8, 104, 52, 92), verbs: ['look'], walkTo: pt(62, 252), face: 'up', secret: true },
  { id: 'toTent', name: 'name.toTent', polygon: rect(195, 174, 100, 72), verbs: ['look', 'go'], walkTo: pt(245, 264), face: 'up' },
  { id: 'niche', name: 'name.niche', polygon: rect(296, 148, 248, 84), verbs: ['look', 'use'], walkTo: pt(420, 244), face: 'up' },
  { id: 'pulleys', name: 'name.pulleys', polygon: rect(66, 30, 76, 136), verbs: ['look', 'use'], walkTo: pt(118, 250), face: 'up' },
  { id: 'jars', name: 'name.jars', polygon: rect(126, 186, 68, 50), verbs: ['look', 'take'], walkTo: pt(170, 252), face: 'up' },
  { id: 'cart', name: 'name.cart', polygon: rect(474, 198, 64, 34), verbs: ['look', 'use'], walkTo: pt(506, 246), face: 'up' },
  { id: 'roomCurtain', name: 'name.toFiringHouse', polygon: rect(546, 140, 56, 82), verbs: ['look', 'go'], walkTo: pt(584, 246), face: 'up' },
];

const firingHouseHotspots: HotspotDef[] = [
  { id: 'chalk', name: 'name.chalk', polygon: rect(236, 122, 46, 28), verbs: ['look'], walkTo: pt(262, 286), face: 'up', secret: true },
  { id: 'sign', name: 'name.sign', polygon: rect(312, 46, 26, 28), verbs: ['look'], secret: true },
  { id: 'pantryDoor', name: 'name.pantryDoor', polygon: rect(434, 150, 42, 74), verbs: ['look', 'open', 'use'], walkTo: pt(455, 248), face: 'up' },
  { id: 'soup', name: 'name.soup', polygon: rect(216, 186, 80, 30), verbs: ['look', 'take', 'use'], walkTo: pt(262, 286), face: 'up' },
  { id: 'shoes', name: 'name.shoes', polygon: rect(18, 34, 150, 160), verbs: ['look', 'take'] },
  { id: 'hearth', name: 'name.hearth', polygon: rect(0, 184, 64, 70), verbs: ['look', 'use'] },
  { id: 'stairs', name: 'name.stairs', polygon: [pt(520, 136), pt(600, 112), pt(640, 120), pt(640, 224), pt(560, 224)], verbs: ['look', 'go'], walkTo: pt(596, 238), face: 'right' },
  { id: 'kilnGate', name: 'name.kilnGate', polygon: rect(334, 138, 58, 80), verbs: ['look', 'open', 'go'], walkTo: pt(364, 248), face: 'up' },
  { id: 'toRoom', name: 'name.toMaraRoom', polygon: rect(612, 234, 28, 72), verbs: ['look', 'go'], walkTo: pt(616, 292), face: 'right' },
];

const galleryHotspots: HotspotDef[] = [
  { id: 'railNames', name: 'name.railNames', polygon: rect(306, 206, 40, 62), verbs: ['look'], walkTo: pt(400, 296), face: 'left', secret: true },
  { id: 'gauge', name: 'name.gauge', polygon: rect(150, 6, 54, 54), verbs: ['look', 'use'] },
  { id: 'regulator', name: 'name.regulator', polygon: rect(186, 78, 156, 146), verbs: ['look', 'use', 'take', 'open'], walkTo: pt(404, 290), face: 'left' },
  { id: 'logbook', name: 'name.logbook', polygon: rect(118, 262, 164, 52), verbs: ['look', 'take'] },
  { id: 'lantern', name: 'name.lantern', polygon: rect(0, 158, 50, 112), verbs: ['look', 'take'] },
  { id: 'galleryStairs', name: 'name.toFiringHouse', polygon: rect(588, 110, 52, 150), verbs: ['look', 'go'], walkTo: pt(612, 296), face: 'right' },
];

const ashwaysHotspots: HotspotDef[] = [
  { id: 'sweeper', name: 'name.sweeper', polygon: rect(358, 210, 124, 64), verbs: ['look', 'talk', 'use'], visibleIf: [{ notFlag: 'valveVented' }] },
  { id: 'sweeperAtPipe', name: 'name.sweeper', polygon: rect(110, 202, 124, 64), verbs: ['look', 'talk', 'use'], visibleIf: [{ flag: 'valveVented' }] },
  { id: 'valve', name: 'name.valve', polygon: rect(70, 156, 56, 82), verbs: ['look', 'open', 'close', 'use'], walkTo: pt(150, 262), face: 'left' },
  { id: 'passage', name: 'name.passage', polygon: rect(372, 112, 104, 104), verbs: ['look', 'go'], walkTo: pt(424, 234), face: 'up' },
  { id: 'pipes', name: 'name.pipes', polygon: [pt(0, 0), pt(270, 0), pt(270, 120), pt(0, 120)], verbs: ['look', 'use'] },
  { id: 'wayBack', name: 'name.wayBack', polygon: rect(0, 300, 34, 58), verbs: ['look', 'go'] },
];

export const ROOMS: Record<string, RoomDef> = {
  tent: {
    id: 'tent',
    background: 'room-tent',
    walkable: {
      outer: [pt(220, 228), pt(540, 206), pt(548, 312), pt(612, 322), pt(616, 358), pt(0, 358), pt(0, 292), pt(200, 262)],
      holes: [rect(78, 282, 92, 22), rect(450, 256, 40, 10)],
    },
    scale: { farY: 206, farScale: 0.78, nearY: 358, nearScale: 1.22 },
    music: 'warm',
    coldIf: COLD,
    light: { tint: 0xffe4c4, farDim: 0.82 },
    look: {
      grade: { saturation: 1.05, brightness: 1.02, contrast: 1.05, warmth: 0.3 },
      haze: [{ x: 234, y: 8, w: 36, h: 32 }, { x: 478, y: 46, w: 34, h: 30 }],
      vignette: 0.32,
    },
    foreground: [{ image: 'tent-stool', x: 73, y: 204, depth: 300 }],
    ambient: {
      particles: [{ kind: 'dust', x: 440, y: 150, w: 170, h: 180 }],
      glows: [{ x: 596, y: 270, r: 60, color: 0xffa040, warm: true }],
    },
    entries: {
      start: { x: 360, y: 300, face: 'down' },
      fromKilnHall: { x: 590, y: 336, face: 'left' },
    },
    objects: [
      { id: 'rack', sheet: 'rack', x: 470, y: 262, flag: 'hasGauntlet', whenTrue: 'empty', whenFalse: 'full' },
      { id: 'notebook', sheet: 'notebook', x: 150, y: 168, visibleIf: [{ notFlag: 'hasNotebook' }] },
    ],
    hotspots: tentHotspots,
    actors: [],
  },
  maraRoom: {
    id: 'maraRoom',
    background: 'room-mara',
    walkable: {
      outer: [pt(40, 238), pt(610, 234), pt(612, 280), pt(556, 288), pt(552, 358), pt(96, 358), pt(88, 262), pt(40, 256)],
      holes: [rect(200, 236, 90, 14)],
    },
    scale: { farY: 234, farScale: 0.82, nearY: 358, nearScale: 1.02 },
    music: 'warm',
    coldIf: COLD,
    light: { tint: 0xffd4a8, farDim: 0.86 },
    look: {
      grade: { saturation: 1.08, brightness: 1.03, contrast: 1.06, warmth: 0.4 },
      haze: [{ x: 300, y: 150, w: 244, h: 70 }],
      shafts: [
        { x: 446, y: 0, angle: 14, length: 250, width: 70, color: 0xffc890 },
        { x: 330, y: 10, angle: 8, length: 210, width: 44, color: 0xffb070 },
      ],
      vignette: 0.35,
    },
    foreground: [{ image: 'hall-left', x: 0, y: 248, depth: 400 }, { image: 'hall-right', x: 552, y: 280, depth: 400 }],
    ambient: {
      particles: [{ kind: 'embers', x: 300, y: 150, w: 250, h: 80, warm: true }],
      glows: [
        { x: 332, y: 208, r: 30, color: 0xff8a2a, warm: true },
        { x: 438, y: 204, r: 38, color: 0xff9a34, warm: true },
        { x: 516, y: 218, r: 22, color: 0xff8a2a, warm: true },
      ],
    },
    entries: {
      fromTent: { x: 245, y: 270, face: 'down' },
      fromFiringHouse: { x: 584, y: 252, face: 'left' },
    },
    objects: [
      { id: 'tent', sheet: 'tent', x: 245, y: 248 },
    ],
    hotspots: maraRoomHotspots,
    actors: [],
  },
  firingHouse: {
    id: 'firingHouse',
    background: 'room-firing-house',
    walkable: {
      outer: [pt(178, 252), pt(334, 248), pt(420, 228), pt(640, 228), pt(640, 358), pt(178, 358)],
      holes: [rect(274, 284, 36, 14)],
    },
    scale: { farY: 228, farScale: 0.72, nearY: 358, nearScale: 0.96 },
    music: 'warm',
    // The painting is dark already: the default cold tint made it almost black.
    coldTint: 0xb4bed8,
    coldIf: COLD,
    light: { tint: 0xf2c49a, farDim: 0.78 },
    look: {
      grade: { saturation: 1.06, brightness: 1.08, contrast: 1.05, warmth: 0.35 },
      coldGrade: { saturation: 0.6, brightness: 1.02, contrast: 1.02, warmth: -0.5 },
      haze: [{ x: 0, y: 178, w: 70, h: 64 }, { x: 160, y: 130, w: 70, h: 40 }],
      shafts: [
        { x: 372, y: 150, angle: -62, length: 150, width: 34, color: 0xffb070 },
        { x: 300, y: 0, angle: 6, length: 190, width: 40, color: 0xffb070 },
      ],
      vignette: 0.3,
    },
    ambient: {
      particles: [{ kind: 'embers', x: 0, y: 190, w: 70, h: 60, warm: true }, { kind: 'steam', x: 236, y: 186, w: 30, h: 14, warm: true }],
      glows: [
        { x: 30, y: 226, r: 34, color: 0xff7a24, warm: true },
        { x: 190, y: 160, r: 18, color: 0xff8a2a, warm: true },
        { x: 362, y: 190, r: 30, color: 0xffb060, warm: true },
      ],
    },
    entries: {
      fromMaraRoom: { x: 600, y: 300, face: 'left' },
      fromGallery: { x: 584, y: 244, face: 'down' },
      fromAshways: { x: 364, y: 254, face: 'down' },
    },
    objects: [
      { id: 'pantryDoor', sheet: 'pantry-door', x: 455, y: 224, flag: 'latchFixed', whenTrue: 'fixed', whenFalse: 'stuck' },
    ],
    hotspots: firingHouseHotspots,
    actors: [
      { id: 'nell', x: 292, y: 292 },
    ],
  },
  gallery: {
    id: 'gallery',
    background: 'room-gallery',
    walkable: {
      outer: [pt(372, 274), pt(470, 268), pt(640, 268), pt(640, 358), pt(390, 358), pt(380, 318)],
      holes: [rect(500, 292, 40, 14)],
    },
    scale: { farY: 268, farScale: 0.96, nearY: 358, nearScale: 1.06 },
    surface: 'metal',
    music: 'tension',
    look: {
      grade: { saturation: 1.04, brightness: 1, contrast: 1.07, warmth: 0.2 },
      haze: [{ x: 360, y: 0, w: 80, h: 70 }],
      vignette: 0.38,
      reflective: { polygon: [{ x: 372, y: 270 }, { x: 640, y: 266 }, { x: 640, y: 360 }, { x: 384, y: 360 }], alpha: 0.2 },
    },
    coldIf: COLD,
    light: { tint: 0xffdcb8, farDim: 0.9 },
    foreground: [{ image: 'gallery-railing', x: 278, y: 206, depth: 300 }],
    ambient: {
      particles: [{ kind: 'steam', x: 160, y: 70, w: 180, h: 60, warm: true }],
      glows: [{ x: 24, y: 214, r: 30, color: 0xffa040 }, { x: 270, y: 32, r: 24, color: 0xff9a34, warm: true }],
    },
    entries: {
      fromFiringHouse: { x: 600, y: 304, face: 'left' },
    },
    objects: [
      { id: 'socket', sheet: 'socket', x: 265, y: 218, flag: 'kilnCold', whenTrue: 'removed', whenFalse: 'installed', depth: -1 },
    ],
    hotspots: galleryHotspots,
    actors: [{ id: 'oren', x: 520, y: 300 }],
  },
  ashways: {
    id: 'ashways',
    background: 'room-ashways',
    walkable: {
      outer: [pt(0, 226), pt(640, 226), pt(640, 358), pt(0, 358)],
      holes: [],
    },
    scale: { farY: 226, farScale: 0.72, nearY: 358, nearScale: 1.02 },
    surface: 'ash',
    music: 'wind',
    look: {
      grade: { saturation: 0.96, brightness: 1, contrast: 1.04, warmth: -0.05 },
      vignette: 0.4,
    },
    light: { tint: 0xffe6c8, farDim: 0.84 },
    ambient: {
      particles: [{ kind: 'ash', x: 0, y: 0, w: 640, h: 220 }],
      glows: [{ x: 424, y: 150, r: 46, color: 0xffb060 }],
    },
    entries: {
      fromFiringHouse: { x: 70, y: 326, face: 'right' },
    },
    objects: [
      { id: 'valve', sheet: 'valve', x: 96, y: 238, flag: 'valveVented', whenTrue: 'venting', whenFalse: 'closed' },
      { id: 'sweeper', sheet: 'sweeper', x: 420, y: 274, anim: 'idle', movedTo: { flag: 'valveVented', x: 172, y: 266 }, shadow: 118 },
    ],
    hotspots: ashwaysHotspots,
    actors: [],
  },
};

export const START_ROOM = 'tent';
export const START_ENTRY = 'start';
