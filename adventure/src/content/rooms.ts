import type { HotspotDef, Point, Polygon, RoomDef } from '../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });

/** Hotspots are tested in list order: put small things on top of large things first. */
const hallHotspots: HotspotDef[] = [
  { id: 'key', name: 'name.key', polygon: rect(186, 274, 28, 18), verbs: ['look', 'take', 'use'], walkTo: pt(254, 304), face: 'left',
    visibleIf: [{ flag: 'suitcaseOpen', notFlag: 'keyTaken' }] },
  { id: 'suitcase', name: 'name.suitcase', polygon: rect(172, 246, 56, 58), verbs: ['look', 'open', 'close', 'take', 'use'], walkTo: pt(254, 304), face: 'left' },
  { id: 'door', name: 'name.door', polygon: rect(462, 78, 88, 150), verbs: ['look', 'open', 'close', 'use', 'go'], walkTo: pt(506, 246), face: 'up' },
  { id: 'window', name: 'name.window', polygon: rect(66, 46, 112, 112), verbs: ['look', 'open', 'use'], walkTo: pt(122, 296), face: 'up' },
  { id: 'painting', name: 'name.painting', polygon: rect(262, 56, 104, 76), verbs: ['look', 'take', 'use'], walkTo: pt(314, 250), face: 'up' },
  { id: 'lamp', name: 'name.lamp', polygon: rect(38, 194, 74, 92), verbs: ['look', 'use', 'take'], walkTo: pt(140, 286), face: 'left' },
];

const streetHotspots: HotspotDef[] = [
  { id: 'hotelDoor', name: 'name.hotelDoor', polygon: rect(80, 146, 64, 112), verbs: ['look', 'go', 'open', 'close'], walkTo: pt(112, 272), face: 'up' },
  { id: 'sign', name: 'name.sign', polygon: rect(76, 120, 72, 18), verbs: ['look', 'take'], walkTo: pt(112, 276), face: 'up' },
  { id: 'lampPost', name: 'name.lampPost', polygon: rect(554, 110, 30, 184), verbs: ['look', 'use'], walkTo: pt(530, 300), face: 'right' },
  { id: 'buildings', name: 'name.buildings', polygon: rect(220, 70, 420, 188), verbs: ['look', 'open'] },
];

export const ROOMS: Record<string, RoomDef> = {
  hall: {
    id: 'hall',
    background: 'room-hall',
    walkable: {
      outer: [pt(18, 240), pt(622, 240), pt(636, 356), pt(4, 356)],
      holes: [rect(32, 248, 86, 42), rect(166, 284, 70, 24)],
    },
    scale: { farY: 240, farScale: 0.86, nearY: 356, nearScale: 1 },
    entries: {
      start: { x: 330, y: 318, face: 'down' },
      fromStreet: { x: 506, y: 250, face: 'down' },
    },
    objects: [
      { id: 'door', sheet: 'door', x: 506, y: 228, flag: 'doorOpen', whenTrue: 'open', whenFalse: 'closed' },
      { id: 'suitcase', sheet: 'suitcase', x: 200, y: 304, flag: 'suitcaseOpen', whenTrue: 'open', whenFalse: 'closed' },
      { id: 'key', sheet: 'key', x: 200, y: 291, depth: 305, visibleIf: [{ flag: 'suitcaseOpen', notFlag: 'keyTaken' }] },
    ],
    hotspots: hallHotspots,
    actors: [],
  },
  street: {
    id: 'street',
    background: 'room-street',
    walkable: {
      outer: [pt(4, 268), pt(636, 268), pt(636, 356), pt(4, 356)],
      holes: [rect(552, 280, 34, 18), rect(394, 288, 52, 18)],
    },
    scale: { farY: 268, farScale: 0.9, nearY: 356, nearScale: 1 },
    entries: {
      fromHall: { x: 112, y: 282, face: 'down' },
    },
    objects: [],
    hotspots: streetHotspots,
    actors: [{ id: 'keeper', x: 420, y: 304, face: 'left' }],
  },
};

export const ROOM_IDS = Object.keys(ROOMS);
export const START_ROOM = 'hall';
export const START_ENTRY = 'start';
