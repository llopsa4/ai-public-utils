import type { HotspotDef, Point, Polygon, RoomDef } from '../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });
const COLD = [{ flag: 'kilnCold' }];

// Hotspots are tested in list order: put small things before large ones they overlap.

// Mara's corner of the kiln hall (Kiln Courier's kiln-hall illustration).
const maraRoomHotspots: HotspotDef[] = [
  { id: 'notebook', name: 'name.notebook', polygon: rect(18, 188, 46, 22), verbs: ['look', 'take', 'open'], walkTo: pt(82, 250), face: 'left',
    visibleIf: [{ notFlag: 'hasNotebook' }] },
  { id: 'rack', name: 'name.rack', polygon: rect(217, 174, 56, 72), verbs: ['look', 'take', 'use'], walkTo: pt(245, 262), face: 'up' },
  { id: 'niche', name: 'name.niche', polygon: rect(296, 148, 248, 84), verbs: ['look', 'use'], walkTo: pt(420, 244), face: 'up' },
  { id: 'pulleys', name: 'name.pulleys', polygon: rect(66, 30, 76, 136), verbs: ['look', 'use'], walkTo: pt(118, 250), face: 'up' },
  { id: 'jars', name: 'name.jars', polygon: rect(126, 186, 88, 50), verbs: ['look', 'take'], walkTo: pt(170, 252), face: 'up' },
  { id: 'cart', name: 'name.cart', polygon: rect(474, 198, 64, 34), verbs: ['look', 'use'], walkTo: pt(506, 246), face: 'up' },
  { id: 'roomCurtain', name: 'name.toFiringHouse', polygon: rect(546, 140, 56, 82), verbs: ['look', 'go'], walkTo: pt(584, 246), face: 'up' },
];

const firingHouseHotspots: HotspotDef[] = [
  { id: 'pantryDoor', name: 'name.pantryDoor', polygon: rect(434, 150, 42, 74), verbs: ['look', 'open', 'use'], walkTo: pt(455, 248), face: 'up' },
  { id: 'soup', name: 'name.soup', polygon: rect(216, 186, 80, 30), verbs: ['look', 'take', 'use'], walkTo: pt(262, 286), face: 'up' },
  { id: 'shoes', name: 'name.shoes', polygon: rect(18, 34, 150, 160), verbs: ['look', 'take'] },
  { id: 'hearth', name: 'name.hearth', polygon: rect(0, 184, 64, 70), verbs: ['look', 'use'] },
  { id: 'stairs', name: 'name.stairs', polygon: [pt(520, 136), pt(600, 112), pt(640, 120), pt(640, 224), pt(560, 224)], verbs: ['look', 'go'], walkTo: pt(596, 238), face: 'right' },
  { id: 'kilnGate', name: 'name.kilnGate', polygon: rect(334, 138, 58, 80), verbs: ['look', 'open', 'go'], walkTo: pt(364, 248), face: 'up' },
  { id: 'toRoom', name: 'name.toMaraRoom', polygon: rect(612, 234, 28, 72), verbs: ['look', 'go'], walkTo: pt(616, 292), face: 'right' },
];

const galleryHotspots: HotspotDef[] = [
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
  maraRoom: {
    id: 'maraRoom',
    background: 'room-mara',
    walkable: {
      outer: [pt(40, 238), pt(610, 234), pt(612, 280), pt(556, 288), pt(552, 358), pt(96, 358), pt(88, 262), pt(40, 256)],
      holes: [rect(222, 240, 46, 12)],
    },
    scale: { farY: 234, farScale: 0.82, nearY: 358, nearScale: 1.02 },
    coldIf: COLD,
    entries: {
      start: { x: 300, y: 300, face: 'down' },
      fromFiringHouse: { x: 584, y: 252, face: 'left' },
    },
    objects: [
      { id: 'rack', sheet: 'rack', x: 245, y: 246, flag: 'hasGauntlet', whenTrue: 'empty', whenFalse: 'full' },
      { id: 'notebook', sheet: 'notebook', x: 42, y: 206, visibleIf: [{ notFlag: 'hasNotebook' }] },
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
    coldIf: COLD,
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
    coldIf: COLD,
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
    entries: {
      fromFiringHouse: { x: 70, y: 326, face: 'right' },
    },
    objects: [
      { id: 'valve', sheet: 'valve', x: 96, y: 238, flag: 'valveVented', whenTrue: 'venting', whenFalse: 'closed' },
      { id: 'sweeper', sheet: 'sweeper', x: 420, y: 274, anim: 'idle', movedTo: { flag: 'valveVented', x: 172, y: 266 } },
    ],
    hotspots: ashwaysHotspots,
    actors: [],
  },
};

export const ROOM_IDS = Object.keys(ROOMS);
export const START_ROOM = 'maraRoom';
export const START_ENTRY = 'start';
