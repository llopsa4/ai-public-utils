import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const COLD = [{ flag: 'kilnCold' }];

// Hotspots are tested in list order: put small things before large ones they overlap.

// Mara's tent: his starting room (painted from scratch by art/tent.mjs to fit these spots).
// The tent is the user's reference painting (tent-reference.png, re-gridded by art/tent-reference.mjs),
// seen flat-on: the bench along the left (tool board above, the cradle and notebook stand on it as
// objects), the stool in front, the drum on its trestle and a little clay stove by the back wall,
// the cot with boots and the coat on the right, the door flap at the right edge. The floor is a
// flat band from y 268: Mara walks sideways and a little forward and back, always the same size.
const tentHotspots: HotspotDef[] = [
  { id: 'notebook', name: 'name.notebook', polygon: rect(40, 184, 38, 14), verbs: ['look', 'take', 'open'], walkTo: pt(60, 278), face: 'up',
    visibleIf: [{ notFlag: 'hasNotebook' }] },
  { id: 'rack', name: 'name.rack', polygon: rect(146, 128, 52, 70), verbs: ['look', 'take', 'use'], walkTo: pt(172, 278), face: 'up' },
  { id: 'jar', name: 'name.jar', polygon: rect(104, 168, 26, 30), verbs: ['look', 'take'], walkTo: pt(118, 278), face: 'up' },
  { id: 'workbench', name: 'name.workbench', polygon: rect(14, 124, 178, 128), verbs: ['look', 'use'], walkTo: pt(110, 278), face: 'up' },
  { id: 'stool', name: 'name.stool', polygon: rect(88, 228, 52, 48), verbs: ['look', 'use'] },
  { id: 'drum', name: 'name.drum', polygon: rect(242, 194, 94, 66), verbs: ['look', 'use'], walkTo: pt(290, 278), face: 'up' },
  { id: 'stove', name: 'name.stove', polygon: rect(366, 206, 38, 48), verbs: ['look', 'use', 'open'], walkTo: pt(385, 278), face: 'up' },
  { id: 'tentFlap', name: 'name.tentFlap', polygon: rect(566, 84, 74, 186), verbs: ['look', 'go', 'open'], walkTo: pt(606, 284), face: 'right' },
];

// Kiln hall outside the tent (Kiln Courier's kiln-hall illustration).
// Every room is flat 2D (as the tent): the back wall meets the floor at y 262; a floor band from
// y 268 to 345 is where people walk, always at the same size. Exits are at the sides, or stairs
// for any further one, never two doors side by side. Things stand on the floor line or hang on the
// wall above it. Each room's layout image (art/spec/<room>.jpg) shows this for the painters.

// The kiln hall: the tally wall (far left), the pulley hoist hanging from the vault, storage jars,
// Mara's tent pitched on the floor, the row of kiln mouths across the back wall, the ash cart, and
// the curtain to the firing house (right edge).
const maraRoomHotspots: HotspotDef[] = [
  { id: 'tally', name: 'name.tally', polygon: rect(8, 150, 40, 70), verbs: ['look'], walkTo: pt(40, 280), face: 'up', secret: true },
  { id: 'toTent', name: 'name.toTent', polygon: rect(204, 150, 92, 112), verbs: ['look', 'go'], walkTo: pt(250, 280), face: 'up' },
  { id: 'niche', name: 'name.niche', polygon: rect(320, 120, 180, 120), verbs: ['look', 'use'], walkTo: pt(410, 280), face: 'up' },
  { id: 'pulleys', name: 'name.pulleys', polygon: rect(74, 20, 52, 170), verbs: ['look', 'use'], walkTo: pt(100, 280), face: 'up' },
  { id: 'jars', name: 'name.jars', polygon: rect(140, 214, 50, 48), verbs: ['look', 'take'], walkTo: pt(165, 280), face: 'up' },
  { id: 'cart', name: 'name.cart', polygon: rect(504, 218, 60, 44), verbs: ['look', 'use'], walkTo: pt(534, 282), face: 'up' },
  { id: 'roomCurtain', name: 'name.toFiringHouse', polygon: rect(592, 104, 48, 160), verbs: ['look', 'go'], walkTo: pt(616, 290), face: 'right' },
];

// The firing house: the way back to the kiln hall (left edge), the shoe rack high on the left wall,
// the hearth with Nell's soup pot, the chalked wall, the iron sign high up, Nell's pantry door in
// the back wall, the stairs climbing to the regulator gallery, and the kiln gate (right edge) out to
// the ashways.
const firingHouseHotspots: HotspotDef[] = [
  { id: 'chalk', name: 'name.chalk', polygon: rect(160, 145, 32, 24), verbs: ['look'], walkTo: pt(190, 280), face: 'up', secret: true },
  { id: 'sign', name: 'name.sign', polygon: rect(226, 44, 34, 38), verbs: ['look'], secret: true },
  { id: 'pantryDoor', name: 'name.pantryDoor', polygon: rect(304, 110, 60, 152), verbs: ['look', 'open', 'use'], walkTo: pt(334, 280), face: 'up' },
  { id: 'soup', name: 'name.soup', polygon: rect(82, 176, 44, 26), verbs: ['look', 'take', 'use'], walkTo: pt(110, 280), face: 'up' },
  { id: 'shoes', name: 'name.shoes', polygon: rect(34, 30, 120, 110), verbs: ['look', 'take'] },
  { id: 'hearth', name: 'name.hearth', polygon: rect(56, 170, 92, 92), verbs: ['look', 'use'] },
  { id: 'stairs', name: 'name.stairs', polygon: [pt(410, 262), pt(510, 96), pt(566, 96), pt(470, 262)], verbs: ['look', 'go'], walkTo: pt(450, 284), face: 'up' },
  { id: 'kilnGate', name: 'name.kilnGate', polygon: rect(586, 96, 54, 168), verbs: ['look', 'open', 'go'], walkTo: pt(616, 290), face: 'right' },
  { id: 'toRoom', name: 'name.toMaraRoom', polygon: rect(0, 104, 30, 160), verbs: ['look', 'go'], walkTo: pt(24, 290), face: 'left' },
];

// The regulator gallery, high in the kiln: a lantern on the left wall, Oren's desk with the logbook,
// the great regulator in its pipe ring (centre left) with the gauge on top, the railing with names
// scratched into it, and the stairs down to the firing house (right edge).
const galleryHotspots: HotspotDef[] = [
  { id: 'railNames', name: 'name.railNames', polygon: rect(360, 206, 46, 50), verbs: ['look'], walkTo: pt(384, 282), face: 'up', secret: true },
  { id: 'gauge', name: 'name.gauge', polygon: rect(212, 16, 44, 44), verbs: ['look', 'use'] },
  { id: 'regulator', name: 'name.regulator', polygon: rect(160, 64, 160, 190), verbs: ['look', 'use', 'take', 'open'], walkTo: pt(240, 282), face: 'up' },
  { id: 'logbook', name: 'name.logbook', polygon: rect(58, 208, 74, 54), verbs: ['look', 'take'] },
  { id: 'lantern', name: 'name.lantern', polygon: rect(14, 140, 34, 60), verbs: ['look', 'take'] },
  { id: 'galleryStairs', name: 'name.toFiringHouse', polygon: rect(586, 104, 54, 160), verbs: ['look', 'go'], walkTo: pt(612, 292), face: 'right' },
];

// The ashways: the way back into the kiln (left edge), great pipes overhead, the pressure valve on
// the pipe, the ash sweeper blocking the passage under the old bridge (right side), and after the
// valve is vented, the sweeper scurried off to the warm pipe.
const ashwaysHotspots: HotspotDef[] = [
  { id: 'sweeper', name: 'name.sweeper', polygon: rect(470, 228, 130, 70), verbs: ['look', 'talk', 'use'], visibleIf: [{ notFlag: 'valveVented' }] },
  { id: 'sweeperAtPipe', name: 'name.sweeper', polygon: rect(130, 228, 130, 70), verbs: ['look', 'talk', 'use'], visibleIf: [{ flag: 'valveVented' }] },
  { id: 'valve', name: 'name.valve', polygon: rect(90, 160, 56, 102), verbs: ['look', 'open', 'close', 'use'], walkTo: pt(150, 282), face: 'left' },
  { id: 'passage', name: 'name.passage', polygon: rect(560, 100, 80, 164), verbs: ['look', 'go'], walkTo: pt(608, 292), face: 'right' },
  { id: 'pipes', name: 'name.pipes', polygon: [pt(0, 0), pt(300, 0), pt(300, 100), pt(0, 100)], verbs: ['look', 'use'] },
  { id: 'wayBack', name: 'name.wayBack', polygon: rect(0, 120, 30, 144), verbs: ['look', 'go'], walkTo: pt(24, 292), face: 'left' },
];

export const ROOMS: Record<string, RoomDef> = {
  tent: {
    id: 'tent',
    background: 'room-tent',
    // A flat floor band (the canvas wall meets the floor at y 252); the stool's feet stand in it.
    walkable: {
      outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)],
      holes: [rect(86, 268, 56, 8)],
    },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    music: 'warm',
    coldIf: COLD,
    light: { tint: 0xffe8d0, farDim: 1 },
    look: {
      // The painting is already lit (lantern, candle, the kiln hall beyond the flap): a light touch only.
      grade: { saturation: 1, brightness: 1, contrast: 1.02, warmth: 0.08 },
      haze: [{ x: 312, y: 30, w: 24, h: 30 }],
      vignette: 0.18,
    },
    foreground: [{ image: 'tent-stool', x: 88, y: 230, depth: 276 }],
    // The cell's flame in the charging cradle, until it goes into the gauntlet.
    props: [{ kind: 'flame', x: 172, y: 164, size: 12, color: 0xffb050, depth: 197, visibleIf: [{ notFlag: 'hasGauntlet' }] }],
    sign: { x: 120, y: 14, drop: 12, w: 92, h: 20, style: 'wood' },
    ambient: {
      particles: [{ kind: 'dust', x: 240, y: 60, w: 200, h: 180 }],
      // Faint: the painting has its own light; these only flicker.
      glows: [{ x: 606, y: 190, r: 40, color: 0xffa040, warm: true }, { x: 322, y: 52, r: 30, color: 0xffc070 }],
    },
    entries: {
      start: { x: 320, y: 300, face: 'down' },
      fromKilnHall: { x: 596, y: 292, face: 'left' },
    },
    objects: [
      { id: 'rack', sheet: 'rack', x: 172, y: 197, flag: 'hasGauntlet', whenTrue: 'empty', whenFalse: 'full' },
      { id: 'notebook', sheet: 'notebook', x: 58, y: 197, visibleIf: [{ notFlag: 'hasNotebook' }] },
    ],
    hotspots: tentHotspots,
    actors: [],
  },
  maraRoom: {
    id: 'maraRoom',
    background: 'room-mara',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [] },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    music: 'warm',
    coldIf: COLD,
    light: { tint: 0xffd4a8, farDim: 1 },
    look: {
      grade: { saturation: 1.08, brightness: 1.03, contrast: 1.06, warmth: 0.4 },
      haze: [{ x: 320, y: 150, w: 180, h: 80 }],
      shafts: [
        { x: 440, y: 0, angle: 10, length: 250, width: 70, color: 0xffc890 },
        { x: 350, y: 10, angle: 6, length: 210, width: 44, color: 0xffb070 },
      ],
      vignette: 0.35,
    },
    // Rubble in the front corners of the floor, drawn in front of Mara (cut from the painting).
    foreground: [{ image: 'hall-left', x: 0, y: 308, depth: 400 }, { image: 'hall-right', x: 557, y: 314, depth: 400 }],
    props: [{ kind: 'swing', image: 'pulley', x: 100, y: 60, pivotX: 0.5, hotspot: 'pulleys' }],
    sign: { x: 150, y: 48, drop: 14, w: 100, h: 22, style: 'wood' },
    ambient: {
      particles: [{ kind: 'embers', x: 320, y: 150, w: 180, h: 80, warm: true }],
      glows: [
        { x: 350, y: 200, r: 30, color: 0xff8a2a, warm: true },
        { x: 410, y: 196, r: 38, color: 0xff9a34, warm: true },
        { x: 470, y: 200, r: 30, color: 0xff8a2a, warm: true },
      ],
    },
    entries: {
      fromTent: { x: 250, y: 292, face: 'down' },
      fromFiringHouse: { x: 600, y: 296, face: 'left' },
    },
    objects: [
      { id: 'tent', sheet: 'tent', x: 250, y: 264 },
    ],
    hotspots: maraRoomHotspots,
    actors: [],
  },
  firingHouse: {
    id: 'firingHouse',
    background: 'room-firing-house',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [rect(234, 294, 32, 12)] },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    music: 'warm',
    coldTint: 0xb4bed8,
    coldIf: COLD,
    light: { tint: 0xf2c49a, farDim: 1 },
    look: {
      grade: { saturation: 1.06, brightness: 1.08, contrast: 1.05, warmth: 0.35 },
      coldGrade: { saturation: 0.6, brightness: 1.02, contrast: 1.02, warmth: -0.5 },
      haze: [{ x: 60, y: 160, w: 90, h: 70 }],
      shafts: [{ x: 300, y: 0, angle: 6, length: 190, width: 40, color: 0xffb070 }],
      vignette: 0.3,
    },
    ambient: {
      particles: [{ kind: 'embers', x: 64, y: 186, w: 80, h: 60, warm: true }, { kind: 'steam', x: 92, y: 168, w: 30, h: 14, warm: true }],
      glows: [
        { x: 102, y: 230, r: 40, color: 0xff7a24, warm: true },
        { x: 612, y: 180, r: 34, color: 0xffb060, warm: true },
      ],
    },
    entries: {
      fromMaraRoom: { x: 40, y: 296, face: 'right' },
      fromGallery: { x: 450, y: 292, face: 'down' },
      fromAshways: { x: 600, y: 296, face: 'left' },
    },
    objects: [
      { id: 'pantryDoor', sheet: 'pantry-door', x: 334, y: 262, flag: 'latchFixed', whenTrue: 'fixed', whenFalse: 'stuck' },
    ],
    hotspots: firingHouseHotspots,
    actors: [
      { id: 'nell', x: 250, y: 300 },
    ],
    props: [{ kind: 'bubbles', x: 104, y: 180, w: 22, h: 4, color: 0xf0d090, warm: true }],
    sign: { x: 480, y: 50, drop: 12, w: 112, h: 22, style: 'wood' },
  },
  gallery: {
    id: 'gallery',
    background: 'room-gallery',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [rect(464, 290, 32, 12)] },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    surface: 'metal',
    music: 'tension',
    look: {
      grade: { saturation: 1.04, brightness: 1, contrast: 1.07, warmth: 0.2 },
      haze: [{ x: 200, y: 0, w: 80, h: 60 }],
      vignette: 0.38,
      reflective: { polygon: [{ x: 0, y: 268 }, { x: 640, y: 268 }, { x: 640, y: 345 }, { x: 0, y: 345 }], alpha: 0.2 },
    },
    coldIf: COLD,
    light: { tint: 0xffdcb8, farDim: 1 },
    ambient: {
      particles: [{ kind: 'steam', x: 160, y: 60, w: 180, h: 60, warm: true }],
      glows: [{ x: 31, y: 168, r: 30, color: 0xffa040 }, { x: 234, y: 40, r: 24, color: 0xff9a34, warm: true }],
    },
    entries: {
      fromFiringHouse: { x: 600, y: 296, face: 'left' },
    },
    objects: [
      { id: 'socket', sheet: 'socket', x: 240, y: 230, flag: 'kilnCold', whenTrue: 'removed', whenFalse: 'installed', depth: -1 },
    ],
    hotspots: galleryHotspots,
    actors: [{ id: 'oren', x: 480, y: 296 }],
    props: [
      // Running: shivering near the red. Cold: at rest, near the dial's zero.
      { kind: 'gauge', image: 'gauge-face', x: 234, y: 38, length: 12, angle: 36, rest: -128 },
      { kind: 'flame', x: 31, y: 166, size: 12, color: 0xffc060, depth: 9000 },
    ],
    sign: { x: 520, y: 60, drop: 10, w: 74, h: 50, style: 'iron' },
    // The round hatch in the pipe ring, open once the regulator is out: the scavenger squeezes out
    // of it and leaps down to the floor in front of Mara.
    hatch: { x: 240, y: 164, r: 40, stepBack: { x: 420, y: 306 }, land: { x: 320, y: 304 } },
  },
  ashways: {
    id: 'ashways',
    background: 'room-ashways',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [] },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    surface: 'ash',
    music: 'wind',
    look: {
      grade: { saturation: 0.96, brightness: 1, contrast: 1.04, warmth: -0.05 },
      vignette: 0.4,
    },
    light: { tint: 0xffe6c8, farDim: 1 },
    ambient: {
      particles: [{ kind: 'ash', x: 0, y: 0, w: 640, h: 220 }],
      glows: [{ x: 600, y: 170, r: 46, color: 0xffb060 }],
    },
    entries: {
      fromFiringHouse: { x: 60, y: 300, face: 'right' },
    },
    objects: [
      { id: 'valve', sheet: 'valve', x: 118, y: 262, flag: 'valveVented', whenTrue: 'venting', whenFalse: 'closed' },
      { id: 'sweeper', sheet: 'sweeper', x: 535, y: 298, anim: 'idle', movedTo: { flag: 'valveVented', x: 195, y: 298 }, shadow: 118 },
    ],
    hotspots: ashwaysHotspots,
    sign: { x: 330, y: 60, drop: 14, w: 100, h: 22, style: 'wood' },
    actors: [],
  },
};

export const START_ROOM = 'tent';
export const START_ENTRY = 'start';
