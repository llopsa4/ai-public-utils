import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const COLD = [{ flag: 'kilnCold' }];

// Hotspots are tested in list order: put small things before large ones they overlap.

// C7 tent r2: clean scenery, five independent furniture layers and one foreground stool.
// Revised cradle/notebook artwork retains existing save flags; furniture depth stays
// behind the walk band while tabletop objects draw above the workbench.
const tentHotspots: HotspotDef[] = [
  { id: 'notebook', name: 'name.notebook', polygon: rect(40, 200, 20, 10), verbs: ['look', 'take', 'open'], walkTo: pt(50, 278), face: 'up',
    visibleIf: [{ notFlag: 'hasNotebook' }] },
  { id: 'rack', name: 'name.rack', polygon: rect(155, 182, 20, 26), verbs: ['look', 'take', 'use'], walkTo: pt(165, 278), face: 'up' },
  { id: 'jar', outline: { objects: ['jar'] }, name: 'name.jar', polygon: rect(104, 180, 24, 28), verbs: ['look', 'take'], walkTo: pt(116, 278), face: 'up' },
  // The crate under the bench: his work clothes, armour and the gauntlet (before the workbench, which surrounds it).
  { id: 'chest', outline: { objects: ['chest'] }, name: 'name.chest', polygon: rect(35, 224, 36, 26), verbs: ['look', 'open', 'use'], walkTo: pt(52, 278), face: 'up' },
  // The stool before the workbench it overlaps, so its seat is clickable.
  { id: 'stool', name: 'name.stool', polygon: rect(98, 248, 32, 26), verbs: ['look', 'use'] },
  { id: 'workbench', outline: { objects: ['workbench'] }, name: 'name.workbench', polygon: rect(14, 186, 180, 74), verbs: ['look', 'use'], walkTo: pt(110, 278), face: 'up' },
  { id: 'drum', outline: { objects: ['drum'] }, name: 'name.drum', polygon: rect(242, 194, 94, 66), verbs: ['look', 'use'], walkTo: pt(290, 278), face: 'up' },
  { id: 'stove', outline: { objects: ['stove'] }, name: 'name.stove', polygon: rect(366, 206, 38, 48), verbs: ['look', 'use', 'open'], walkTo: pt(385, 278), face: 'up' },
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
  { id: 'tally', name: 'name.tally', polygon: rect(3, 138, 46, 114), verbs: ['look'], walkTo: pt(40, 280), face: 'up', secret: true, outline: { objects: ['tally'] } },
  { id: 'toTent', name: 'name.toTent', polygon: rect(192, 124, 112, 140), verbs: ['look', 'go'], walkTo: pt(248, 280), face: 'up', outline: { objects: ['tent'] } },
  { id: 'niche', name: 'name.niche', polygon: rect(320, 120, 180, 120), verbs: ['look', 'use'], walkTo: pt(410, 280), face: 'up' },
  { id: 'pulleys', name: 'name.pulleys', polygon: rect(54, 19, 88, 180), verbs: ['look', 'use'], walkTo: pt(100, 280), face: 'up', outline: { objects: ['hoist'], props: ['pulley'] } },
  { id: 'jars', name: 'name.jars', polygon: rect(129, 220, 60, 32), verbs: ['look', 'take'], walkTo: pt(165, 280), face: 'up', outline: { objects: ['jars'] } },
  { id: 'cart', name: 'name.cart', polygon: rect(504, 188, 72, 64), verbs: ['look', 'use'], walkTo: pt(534, 282), face: 'up', outline: { objects: ['cart'] } },
  { id: 'roomCurtain', name: 'name.toFiringHouse', polygon: rect(592, 104, 48, 160), verbs: ['look', 'go'], walkTo: pt(616, 290), face: 'right' },
];

// The firing house: the way back to the kiln hall (left edge), the shoe rack high on the left wall,
// the hearth with Nell's soup pot, the chalked wall, the brass bell high up, Nell's pantry door in
// the back wall, the stairs climbing to the regulator gallery, and the kiln gate (right edge) out to
// the ashways.
const firingHouseHotspots: HotspotDef[] = [
  { id: 'chalk', name: 'name.chalk', polygon: rect(171, 203, 18, 28), verbs: ['look'], walkTo: pt(190, 280), face: 'up', secret: true, outline: { objects: ['chalk'] } },
  // Preserve the saved/outline identity; this is a bell in the approved painting, not a shop sign.
  { id: 'sign', name: 'name.sign', polygon: rect(241, 52, 20, 24), verbs: ['look', 'use'], secret: true, outline: { objects: ['bell'] } },
  { id: 'pantryDoor', name: 'name.pantryDoor', polygon: rect(304, 110, 60, 152), verbs: ['look', 'open', 'use'], walkTo: pt(334, 280), face: 'up' },
  { id: 'soup', name: 'name.soup', polygon: rect(89, 181, 52, 42), verbs: ['look', 'take', 'use'], walkTo: pt(110, 280), face: 'up', outline: { objects: ['soup'] } },
  { id: 'shoes', name: 'name.shoes', polygon: rect(38, 48, 148, 88), verbs: ['look', 'take'], outline: { objects: ['shoes'] } },
  { id: 'hearth', name: 'name.hearth', polygon: rect(52, 162, 120, 100), verbs: ['look', 'use'], outline: { objects: ['fire'], painted: true } },
  { id: 'stairs', name: 'name.stairs', polygon: [pt(366, 262), pt(486, 96), pt(518, 132), pt(410, 262)], verbs: ['look', 'go'], walkTo: pt(390, 284), face: 'up' },
  // Nell's rolls in the basket on the table under the stairs (the morning's bread errand).
  { id: 'breadBasket', name: 'name.breadBasket', polygon: rect(518, 195, 36, 26), verbs: ['look', 'take'], walkTo: pt(535, 282), face: 'up', outline: { objects: ['bread'] } },
  { id: 'kilnGate', name: 'name.kilnGate', polygon: rect(586, 96, 54, 168), verbs: ['look', 'open', 'go'], walkTo: pt(616, 290), face: 'right' },
  { id: 'toRoom', name: 'name.toMaraRoom', polygon: rect(0, 104, 30, 160), verbs: ['look', 'go'], walkTo: pt(24, 290), face: 'left' },
];

// C7 gallery r2 (mirrored): the stairs down to the firing house in a floor opening (left), the
// railing with names scratched into it, the great regulator in its pipe ring (centre right) with
// the gauge on top, Oren's desk with the logbook and a small lantern on its bracket (right).
const galleryHotspots: HotspotDef[] = [
  { id: 'railNames', name: 'name.railNames', polygon: rect(224, 212, 66, 42), verbs: ['look'], walkTo: pt(257, 282), face: 'up', secret: true, outline: { objects: ['railNames'] } },
  { id: 'gauge', name: 'name.gauge', polygon: rect(380, 21, 44, 44), verbs: ['look', 'use'], outline: { props: ['gauge-face'], painted: false } },
  { id: 'regulator', name: 'name.regulator', polygon: rect(320, 64, 160, 200), verbs: ['look', 'use', 'take', 'open'], walkTo: pt(400, 282), face: 'up', outline: { objects: ['regulator', 'socket'] } },
  { id: 'logbook', name: 'name.logbook', polygon: rect(531, 190, 48, 22), verbs: ['look', 'take'], walkTo: pt(555, 282), face: 'up', outline: { objects: ['logbook'] } },
  { id: 'lantern', name: 'name.lantern', polygon: rect(600, 146, 24, 32), verbs: ['look', 'take'], outline: { objects: ['lantern'] } },
  { id: 'galleryStairs', name: 'name.toFiringHouse', polygon: rect(0, 212, 88, 100), verbs: ['look', 'go'], walkTo: pt(102, 286), face: 'left' },
];

// The ashways: the way back into the kiln (left edge), great pipes overhead, the pressure valve on
// the pipe, the ash sweeper blocking the passage under the old bridge (right side), and after the
// valve is vented, the sweeper scurried off to the warm pipe.
const ashwaysHotspots: HotspotDef[] = [
  { id: 'pressureCell', name:'name.pressureCell', polygon:rect(120,170,28,36),verbs:['look','use'],walkTo:pt(175,300),face:'left',outline:{objects:['pressureCell']} },
  { id:'sweeperDisabled',name:'name.sweeper',polygon:rect(290,235,140,70),verbs:['look'],visibleIf:[{flag:'ashwaysWon'}],outline:{objects:['sweeperDisabled']} },
  { id: 'sweeper', name: 'name.sweeper', polygon: rect(470, 228, 130, 70), verbs: ['look', 'talk', 'use'], visibleIf: [{ notFlag: 'valveVented' }] },
  { id: 'sweeperAtPipe', name: 'name.sweeper', polygon: rect(130, 228, 130, 70), verbs: ['look', 'talk', 'use'], visibleIf: [{ flag: 'valveVented' },{notFlag:'ashwaysExploded'}], outline: { objects: ['sweeper'] } },
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
    foreground: [{ image: 'tent-stool', x: 96, y: 246, depth: 274 }],
    // The cell's flame in the charging cradle, until it goes into the gauntlet.
    props: [{ kind: 'flame', x: 165, y: 197, size: 5, color: 0xffb050, depth: 263, visibleIf: [{ notFlag: 'hasGauntlet' }] }],
    sign: { x: 120, y: 14, drop: 12, w: 92, h: 20, style: 'wood' },
    ambient: {
      particles: [{ kind: 'dust', x: 240, y: 60, w: 200, h: 180 }],
      // Faint: the painting has its own light; these only flicker.
      glows: [{ x: 606, y: 190, r: 40, color: 0xffa040, warm: true }, { x: 320, y: 50, r: 30, color: 0xffc070 }],
    },
    entries: {
      start: { x: 320, y: 300, face: 'down' },
      fromKilnHall: { x: 596, y: 292, face: 'left' },
    },
    objects: [
      { id: 'workbench', sheet: 'tent-workbench', x: 104, y: 260, depth: 260 },
      { id: 'jar', sheet: 'tent-jar', x: 116, y: 208, depth: 262 },
      { id: 'chest', sheet: 'tent-chest', x: 53, y: 250, depth: 261 },
      { id: 'drum', sheet: 'tent-drum', x: 289, y: 259 },
      { id: 'stove', sheet: 'tent-stove', x: 385, y: 258 },
      { id: 'rack', sheet: 'rack', x: 165, y: 208, depth: 262, flag: 'hasGauntlet', whenTrue: 'empty', whenFalse: 'full' },
      { id: 'notebook', sheet: 'notebook', x: 50, y: 208, depth: 262, visibleIf: [{ notFlag: 'hasNotebook' }] },
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
    // Rubble in the front corners of the floor, drawn in front of Mara (cut from the painting), and the
    // crate Ansel sits on (his 'bench' station, crowd.ts): behind whoever is on it or further forward.
    foreground: [
      { image: 'hall-left', x: 0, y: 308, depth: 400 }, { image: 'hall-right', x: 557, y: 314, depth: 400 },
      { image: 'hall-crate', x: 98, y: 311, depth: 339 },
    ],
    props: [{ kind: 'swing', image: 'pulley', x: 100, y: 60, pivotX: 0.5, hotspot: 'pulleys', depth: 251 }],
    sign: { x: 245, y: 48, drop: 14, w: 100, h: 22, style: 'wood' },
    ambient: {
      particles: [{ kind: 'embers', x: 320, y: 150, w: 180, h: 80, warm: true }],
      glows: [
        { x: 340, y: 212, r: 30, color: 0xff8a2a, warm: true },
        { x: 402, y: 212, r: 38, color: 0xff9a34, warm: true },
        { x: 465, y: 212, r: 30, color: 0xff8a2a, warm: true },
      ],
    },
    entries: {
      fromTent: { x: 248, y: 292, face: 'down' },
      fromFiringHouse: { x: 600, y: 296, face: 'left' },
    },
    objects: [
      { id: 'tally', sheet: 'hall-tally', x: 26.5, y: 252 },
      { id: 'hoist', sheet: 'hall-hoist', x: 98, y: 199, depth: 250 },
      { id: 'jars', sheet: 'hall-jars', x: 159, y: 252 },
      { id: 'cart', sheet: 'hall-cart', x: 540, y: 252 },
      { id: 'tent', sheet: 'tent', x: 248, y: 264 },
      { id: 'fireA', sheet: 'kiln-fire', x: 340, y: 221, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'lit' },
      { id: 'fireB', sheet: 'kiln-fire', x: 402.5, y: 221, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'lit' },
      { id: 'fireC', sheet: 'kiln-fire', x: 465, y: 221, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'lit' },
    ],
    hotspots: maraRoomHotspots,
    actors: [],
  },
  firingHouse: {
    id: 'firingHouse',
    background: 'room-firing-house',
    walkable: { outer: [pt(0, 268), pt(640, 268), pt(640, 345), pt(0, 345)], holes: [rect(234, 294, 32, 12), rect(145, 294, 20, 12)] },
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
      particles: [{ kind: 'embers', x: 86, y: 228, w: 54, h: 18, warm: true }, { kind: 'steam', x: 104, y: 194, w: 22, h: 5, warm: true }],
      glows: [
        { x: 113, y: 242, r: 40, color: 0xff7a24, warm: true },
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
      { id: 'shoes', sheet: 'house-shoes', x: 112, y: 136, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'warm' },
      { id: 'bell', sheet: 'house-bell', x: 251, y: 76 },
      { id: 'chalk', sheet: 'house-chalk', x: 180, y: 231 },
      // Behind people; soup above fire, and below bubbles (depth = surface y + 1).
      { id: 'fire', sheet: 'house-fire', x: 113, y: 251, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'lit', depth: 197 },
      { id: 'soup', sheet: 'house-soup', x: 115, y: 223, flag: 'kilnCold', whenTrue: 'cold', whenFalse: 'warm', depth: 198 },
      { id: 'bread', sheet: 'house-bread', x: 536, y: 221 },
    ],
    hotspots: firingHouseHotspots,
    actors: [
      { id: 'nell', x: 250, y: 300 },
      { id: 'tobi', x: 155, y: 300, body: 0.6 },
    ],
    props: [{ kind: 'bubbles', x: 104, y: 199, w: 22, h: 2, color: 0xf0d090, warm: true }],
    interactionSounds: { sign: 'bell' },
    sign: { x: 480, y: 50, drop: 12, w: 112, h: 22, style: 'wood' },
  },
  gallery: {
    id: 'gallery',
    background: 'room-gallery',
    // The stairwell opening (world x 0–86, y 261–311) is not floor; people pass in front of it.
    walkable: { outer: [pt(86, 268), pt(640, 268), pt(640, 345), pt(0, 345), pt(0, 312), pt(86, 312)], holes: [rect(144, 290, 32, 12)] },
    // Flat 2D: the same size at the back and the front of the floor.
    scale: { farY: 268, farScale: 1, nearY: 345, nearScale: 1 },
    surface: 'metal',
    music: 'tension',
    look: {
      grade: { saturation: 1.04, brightness: 1, contrast: 1.07, warmth: 0.2 },
      haze: [{ x: 360, y: 0, w: 80, h: 60 }],
      vignette: 0.38,
      reflective: { polygon: [{ x: 0, y: 268 }, { x: 640, y: 268 }, { x: 640, y: 345 }, { x: 0, y: 345 }], alpha: 0.2 },
    },
    coldIf: COLD,
    light: { tint: 0xffdcb8, farDim: 1 },
    ambient: {
      particles: [{ kind: 'steam', x: 300, y: 60, w: 180, h: 60, warm: true }],
      glows: [
        { x: 612, y: 165, r: 18, color: 0xffa040 },
        { x: 402, y: 43, r: 24, color: 0xff9a34, warm: true },
        // Warm light rising from the firing house below the stairwell.
        { x: 42, y: 290, r: 40, color: 0xffa040, warm: true },
      ],
    },
    entries: {
      fromFiringHouse: { x: 102, y: 286, face: 'right' },
    },
    // Registration: art/sources/gallery-c7/approval.json (art origin + anchor, halved).
    objects: [
      // Behind the gauge (prop depth -9000) and the socket; the gauge sits on its stem.
      { id: 'regulator', sheet: 'gallery-regulator', x: 403, y: 264, flag: 'patchFailed', whenTrue: 'ringCracked', whenFalse: 'cracked', depth: -9500 },
      { id: 'socket', sheet: 'socket', x: 400, y: 230, flag: 'kilnCold', whenTrue: 'removed', whenFalse: 'installed', depth: -1 },
      { id: 'railNames', sheet: 'gallery-names', x: 257, y: 254 },
      { id: 'logbook', sheet: 'gallery-logbook', x: 555, y: 209 },
      { id: 'lantern', sheet: 'gallery-lantern', x: 612, y: 175 },
    ],
    hotspots: galleryHotspots,
    actors: [{ id: 'oren', x: 160, y: 296 }],
    props: [
      // Running: shivering near the red. Cold: at rest, near the dial's zero.
      { kind: 'gauge', image: 'gauge-face', x: 402, y: 43, length: 12, angle: 36, rest: -128 },
      { kind: 'flame', x: 612, y: 165, size: 5, color: 0xffc060, depth: 9000 },
    ],
    sign: { x: 120, y: 60, drop: 10, w: 74, h: 50, style: 'iron' },
    // The round hatch in the pipe ring (the socket's hollow), open once the regulator is out: the
    // scavenger squeezes out of it and leaps down to the floor in front of Mara.
    hatch: { x: 400, y: 188, r: 24, stepBack: { x: 220, y: 306 }, land: { x: 320, y: 304 } },
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
