import type { HotspotDef, Point, Polygon, RoomDef } from '../../engine/types';

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
const pt = (x: number, y: number): Point => ({ x, y });

// Placeholder art: the road and the back room are painted in code (art/ch2.mjs) to fit these
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

export const ROOMS: Record<string, RoomDef> = {
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
    // Bryn is at her bench until the gauntlet is retuned; then she goes to make supper.
    actors: [{ id: 'bryn', x: 440, y: 252, visibleIf: [{ notFlag: 'retuned' }] }],
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
    actors: [{ id: 'bryn', x: 400, y: 312, visibleIf: [{ flag: 'retuned' }] }],
  },
};

export const START_ROOM = 'road';
export const START_ENTRY = 'start';
