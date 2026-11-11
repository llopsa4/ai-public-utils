// The art manifest: every image the game loads, in one place. The checker (scripts/art-check.ts),
// the guide (scripts/art-guide.ts), the Codex briefs (scripts/art-briefs.ts), the importer
// (art/import.mjs) and the generators (via art/guard.mjs) all read it. Types: art/manifest.d.mts.
//
// status: 'placeholder' = made by a generator script from Kiln Courier's art, to be replaced;
//         'final' = imported from Codex through `npm run art:import` (generators never touch it);
//         'requested' = briefed, not delivered yet (no file needed).
// Paths are relative to art/src. Sizes are in art pixels (2x the 640x360 world).

/** @typedef {import('./manifest.d.mts').ArtEntry} ArtEntry */

const room = (id, file, subject, light, extra = {}) => ({
  id, kind: 'room', file: `rooms/${file}.png`, webp: true, size: { w: 1280, h: 720 }, anchor: 'top-left',
  chapter: 'ch1', status: 'placeholder', generator: file === 'tent' ? 'tent.mjs' : 'pixelate.mjs', subject, light, ...extra,
});
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** A walk-behind piece cut from its room painting: polygons and the box [x0, y0, x1, y1] in art pixels. */
const fg = (id, room, subject, cut) => ({
  id, kind: 'foreground', file: `foreground/${id}.png`, webp: true, anchor: 'top-left', room, cut,
  chapter: 'ch1', status: 'placeholder', generator: id === 'tent-stool' ? 'tent.mjs' : 'pixelate.mjs', subject,
});
const object = (id, subject, tags, extra = {}) => ({
  id, kind: 'object', file: `objects/${id}.png`, sheet: `objects/${id}.json`, anchor: 'bottom-centre', tags,
  chapter: 'ch1', status: 'placeholder', generator: 'pixelate.mjs', subject, ...extra,
});
const item = (id, subject) => ({
  id: `item-${id}`, kind: 'item', file: `items/${id}.png`, size: { w: 64, h: 64 }, anchor: 'none',
  chapter: 'ch1', status: 'placeholder', generator: 'pixelate.mjs', subject,
});
const icon = (verb, subject) => ({
  id: `icon-${verb}`, kind: 'icon', file: `icons/${verb}.png`, size: { w: 48, h: 48 }, anchor: 'none',
  chapter: 'game', status: 'placeholder', generator: 'icons.mjs', subject,
});
const extra = (id, subject, height, base) => ({
  id, kind: 'extra', file: `characters/${id}.png`, sheet: `characters/${id}.json`, webp: true, anchor: 'bottom-centre', height, base,
  chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs', subject,
});
const equipment = (id, subject) => ({
  id: `equipment-${id}`, kind: 'equipment', file: `kc/equipment/${id}.webp`, size: { w: 320, h: 320 }, anchor: 'none',
  chapter: 'game', status: 'placeholder', generator: 'kc.mjs', subject,
});
const card = (id, name, subject) => ({
  id: `card-${id}`, kind: 'card', file: `kc/cards/${id}.png`, size: { w: 256, h: 256 }, anchor: 'none',
  chapter: 'game', status: 'requested', generator: 'kc.mjs', subject: `${name}: ${subject}`,
});

/**
 * Rig settings in the character source's pixels (see art/rig.mjs): hipY splits legs from body,
 * splitX the near leg from the far one; hips and knees are the joints; eyes are blink patches;
 * portrait is the head crop; face the mouth and brows that move. A Codex source drawn on the
 * style bible's template (art/STYLE.md, "Character sources") needs these re-measured once.
 */
// Mara: Codex's drawing (art/sources/characters/char-mara: body.png, and arm.png for the oversized
// gauntlet arm on the picture's left), measured on its 1024x1536 canvas.
const MARA_RIG = {
  source: 'sources/characters/char-mara/body.png', armLayer: 'sources/characters/char-mara/arm.png', height: 232, walks: true,
  // The gauntlet arm swings from its shoulder while he walks.
  armPivot: [370, 320], armSwing: 6,
  hipY: 840, splitX: 505, hips: { near: [440, 840], far: [570, 840] }, knees: { near: [410, 1050], far: [595, 1030] },
  eyes: [{ x: 527, y: 115, rx: 12, ry: 6, skinAt: [527, 132] }, { x: 565, y: 115, rx: 10, ry: 6, skinAt: [565, 132] }],
  portrait: [370, 0, 360, 360],
  face: { mouth: { x: 552, y: 152, rx: 12, ry: 4 }, brows: [{ x0: 512, x1: 543, y0: 96, y1: 108, inner: 'right' }, { x0: 555, x1: 574, y0: 98, y1: 110, inner: 'left' }] },
};
export const RIGS = {
  // Tobi's original drawing: a younger child by the firing-house hearth.
  tobi: {
    source: 'sources/characters/char-tobi/body.png', height: 140, walks: false,
    hipY: 1080, splitX: 510, hips: { near: [454, 1080], far: [559, 1080] }, knees: { near: [450, 1260], far: [560, 1260] },
    eyes: [{ x: 530, y: 712, rx: 12, ry: 7, skinAt: [529, 730] }, { x: 573, y: 707, rx: 9, ry: 6, skinAt: [576, 722] }],
    portrait: [365, 585, 300, 300], moods: ['neutral', 'worried'],
    face: { mouth: { x: 558, y: 751, rx: 13, ry: 4 }, brows: [{ x0: 510, x1: 545, y0: 684, y1: 697, inner: 'right' }, { x0: 562, x1: 585, y0: 680, y1: 693, inner: 'left' }] },
  },
  // Before the ember cell is fitted the gauntlet is cold: its glow (the red glass on the back of the fist) is painted dark.
  mara: { ...MARA_RIG, unpowered: { minX: 210, minY: 790, maxX: 320, maxY: 900 } },
  'mara-gauntlet': MARA_RIG,
  // Casual Mara (everyday clothes, the start of a new adventure): Codex drew him on the same
  // registration as the armoured drawing, so his joints and face sit where Mara's do. No portraits of
  // its own (dialogue shows Mara's).
  'mara-casual': {
    source: 'sources/characters/char-mara-casual/body.png', armLayer: 'sources/characters/char-mara-casual/arm.png', height: 232, walks: true,
    armPivot: [355, 290], armSwing: 6, noPortrait: true,
    hipY: 820, splitX: 505, hips: { near: [450, 820], far: [560, 820] }, knees: { near: [428, 1095], far: [579, 1085] },
    eyes: [{ x: 528, y: 115, rx: 13, ry: 6, skinAt: [528, 128] }, { x: 562, y: 115, rx: 9, ry: 6, skinAt: [562, 128] }],
    portrait: [370, 0, 360, 360],
    face: { mouth: { x: 549, y: 155, rx: 13, ry: 4 }, brows: [{ x0: 509, x1: 549, y0: 93, y1: 105, inner: 'right' }, { x0: 557, x1: 571, y0: 96, y1: 105, inner: 'left' }] },
  },
  // Oren and Nell: Codex's drawings (they stand at their posts; kneeling and lying are drawn).
  oren: {
    source: 'sources/characters/char-oren/body.png', armLayer: 'sources/characters/char-oren/arm.png', height: 226, walks: false,
    armPivot: [330, 320],
    hipY: 960, splitX: 464, hips: { near: [400, 960], far: [540, 960] }, knees: { near: [380, 1290], far: [560, 1290] },
    // The pocket gauge in his right hand turns as he checks it (forearm and gauge, from the elbow).
    fidgetPart: { minX: 650, minY: 500, maxY: 700, pivot: [650, 540], angle: -9 },
    // The far eye is hidden behind the far lens: only the near one blinks.
    eyes: [{ x: 563, y: 150, rx: 10, ry: 5, skinAt: [563, 176] }],
    portrait: [380, 0, 340, 340],
    face: { mouth: { x: 583, y: 213, rx: 12, ry: 4 }, brows: [{ x0: 530, x1: 580, y0: 113, y1: 131, inner: 'right' }, { x0: 598, x1: 622, y0: 115, y1: 126, inner: 'left' }] },
  },
  nell: {
    source: 'sources/characters/char-nell/body.png', armLayer: 'sources/characters/char-nell/arm.png', height: 220, walks: false,
    armPivot: [390, 310],
    hipY: 1010, splitX: 486, hips: { near: [400, 1010], far: [560, 1010] }, knees: { near: [390, 1320], far: [600, 1320] },
    fidgetLean: -3,
    eyes: [{ x: 546, y: 173, rx: 16, ry: 7, skinAt: [546, 190] }, { x: 592, y: 175, rx: 9, ry: 7, skinAt: [594, 192] }],
    portrait: [380, 20, 320, 320],
    moods: ['neutral'],
    face: { mouth: { x: 573, y: 227, rx: 19, ry: 5 }, brows: [{ x0: 520, x1: 565, y0: 146, y1: 158, inner: 'right' }, { x0: 583, x1: 602, y0: 147, y1: 156, inner: 'left' }] },
  },
  // Chapter 2. Placeholder: Iven's body recoloured and re-dressed (a dark red kerchief, the plates
  // turned to leather), rigged like Nell, until Codex draws Bryn.
  bryn: {
    dir: 'ch2/',
    variant: { hue: 345, sat: 0.75, light: 0.78, skin: 0.8, headgear: { kind: 'kerchief', color: [120, 42, 32] } },
    source: 'kiln:opening/iven.png', height: 224, walks: false,
    hipY: 1000, splitX: 480, hips: { near: [420, 1000], far: [640, 1000] }, knees: { near: [360, 1240], far: [760, 1250] },
    fidgetLean: -3,
    nearIsUpper: true, crouchSquash: 1,
    eyes: [{ x: 452, y: 129, rx: 15, ry: 8, skinAt: [452, 148] }, { x: 507, y: 123, rx: 14, ry: 8, skinAt: [505, 142] }],
    portrait: [320, 0, 340, 340],
    moods: ['neutral'],
    face: { mouth: { x: 486, y: 174, rx: 17, ry: 5 }, brows: [{ x0: 418, x1: 468, y0: 92, y1: 120, inner: 'right' }, { x0: 476, x1: 516, y0: 88, y1: 116, inner: 'left' }] },
  },
  // The intro (Silas's escape). Placeholders until Codex draws them: Silas is casual Mara recoloured
  // (dark, a red neckcloth), his masks are variants of that (a sergeant's cap for Harrow, a grey hood
  // for the clerk); the guards are Oren's and Iven's bodies re-dressed in Ironhaven grey, and Sigrid
  // is Nell's in officer's blue.
  // Silas: Codex's articulated pack (art/sources/characters/silas-layered, art/LAYERED-RIG.md). His
  // disguises are the same rig with the mask drawn over him (rig.json overlays); the clerk carries the
  // ledger against his chest. Portraits are cut from the walk master.
  ...(() => {
    const pack = { layeredPack: 'sources/characters/silas-layered', dir: 'intro/', height: 220, walks: true };
    return {
      silas: { ...pack, portraitId: 'silas', moods: ['neutral', 'worried', 'angry'] },
      'silas-harrow': { ...pack, overlay: 'harrow', noBlink: true, portraitId: 'silas-harrow', moods: ['neutral'] },
      'silas-clerk': { ...pack, overlay: 'clerk', forearmRaise: 1.6, portraitId: 'silas-clerk', moods: ['neutral'] },
      // In his own cloak, hood up (Codex's silas-cloak-layered pack): from the cell's corridor on.
      'silas-cloak': { ...pack, layeredPack: 'sources/characters/silas-cloak-layered', portraitId: 'silas-cloak', moods: ['neutral', 'worried', 'angry'] },
      'silas-cloak-clerk': { ...pack, layeredPack: 'sources/characters/silas-cloak-layered', overlay: 'clerk', forearmRaise: 1.6, portraitId: 'silas-cloak-clerk', moods: ['neutral'] },
    };
  })(),
  // Benn: Codex's drawings (art/inbox/char-guard/HANDOFF.md). He walks the long-coat way: the coat
  // stays whole above the hem and only the hem, shins and boots step; kneeling, lying and sitting asleep are drawn. sit.png is his figure from
  // Codex's sitting picture with the chair (right colours), cut out along the chair-free one's outline
  // (the cell paints its own chair; the chair-free picture's colours were off).
  guard: {
    dir: 'intro/', sits: 'asleep',
    source: 'sources/characters/char-guard/body.png', armLayer: 'sources/characters/char-guard/arm.png', height: 216, walks: true,
    armPivot: [368, 377],
    // Saluting his "sergeant" in the cell (the key steal): elbow measured on arm.png.
    salute: { upperArm: -100, forearm: -70, elbow: [325, 600], capBelow: 45, backEdge: [[372, 300], [334, 900]] },
    hipY: 1130, splitX: 485, hips: { near: [420, 1130], far: [560, 1130] }, knees: { near: [405, 1290], far: [575, 1290] },
    eyes: [{ x: 536, y: 150, rx: 9, ry: 4, skinAt: [536, 162] }, { x: 574, y: 146, rx: 4, ry: 3, skinAt: [571, 157] }],
    // Worried and angry faces drawn by Codex (art/inbox/done/guard-faces), on the same crop.
    portrait: [420, 70, 210, 210], moods: ['neutral', 'worried', 'angry'], drawnFaces: 'sources/characters/char-guard/faces',
    face: { mouth: { x: 557, y: 192, rx: 10, ry: 3 }, brows: [{ x0: 520, x1: 560, y0: 128, y1: 135, inner: 'right' }, { x0: 565, x1: 580, y0: 125, y1: 131, inner: 'left' }] },
  },
  // Kell: Codex's drawings (art/inbox/done/intro-next-review/HANDOFF.md), measured on the 1024x1536
  // canvas. Broad and heavy; he walks off down the stairs to the kitchen. One eye shows
  // in his three-quarter view; kneeling and lying are drawn.
  // Benn once Silas has lifted his keys: the same drawings with the key ring painted out
  // (art/sources/characters/char-guard-nokeys); his portrait stays the guard's.
  get 'guard-nokeys'() {
    // Upstairs he only dozes on his stool: no walk frames (they would double the sheet).
    return { ...this.guard, source: 'sources/characters/char-guard-nokeys/body.png', armLayer: 'sources/characters/char-guard-nokeys/arm.png', noPortrait: true, walks: false };
  },
  warden: {
    dir: 'intro/',
    source: 'sources/characters/char-warden/body.png', armLayer: 'sources/characters/char-warden/arm.png', height: 230, walks: true,
    armPivot: [300, 330],
    hipY: 900, splitX: 490, hips: { near: [350, 900], far: [620, 900] }, knees: { near: [340, 1180], far: [630, 1180] },
    fidgetLean: -3,
    eyes: [{ x: 525, y: 104, rx: 13, ry: 4, skinAt: [525, 120] }],
    portrait: [385, 15, 240, 240], moods: ['neutral', 'worried', 'angry'], drawnFaces: 'sources/characters/char-warden/faces',
    face: { mouth: { x: 552, y: 156, rx: 14, ry: 4 }, brows: [{ x0: 500, x1: 560, y0: 80, y1: 93, inner: 'right' }, { x0: 566, x1: 582, y0: 82, y1: 94, inner: 'left' }] },
  },
  // Sigrid: Codex's two-sided pack (art/sources/characters/sigrid-layered and its left/ set), with
  // Codex's foot fix (art/inbox/done/sigrid-layered/FOOT-FIX-HANDOFF.md): both soles on the floor line.
  sigrid: { layeredPack: 'sources/characters/sigrid-layered', dir: 'intro/', height: 228, walks: true, portraitId: 'sigrid', moods: ['neutral', 'worried', 'angry'] },
};

// Explicit source packs are opt-in: every other character retains the legacy rig.
for (const [id, outfit, powered] of [
  ['mara-casual', 'casual', false], ['mara', 'light', false], ['mara-gauntlet', 'light', true],
  ['mara-medium', 'medium', false], ['mara-medium-gauntlet', 'medium', true],
]) {
  const layeredPack = `sources/characters/mara-${outfit}-layered`;
  RIGS[id] = { source: `${layeredPack}/master.png`, layeredPack, powered, height: 232, walks: true };
}

/** @type {ArtEntry[]} */
export const MANIFEST = [
  // Backdrops behind the chapters' opening cards: crops of each chapter's first room (art/intro-cards.mjs).
  ...[['intro', 'intro', "Silas's cell window with its moonbeam"], ['ch1', 'ch1', "The kiln hall's three glowing kiln mouths"], ['ch2', 'ch2', 'The tunnel mouth at dusk']].map(([card, chapter, subject]) => ({
    id: `intro-card-${card}`, kind: 'prop', file: `intro-cards/${card}.webp`, size: { w: 480, h: 270 }, anchor: 'top-left',
    chapter, status: 'final', generator: 'intro-cards.mjs (crop of the room painting)', subject: `${subject}, cropped from the room painting for the chapter's opening card.` })),
  // The Ashlands reveal after Silas's intro (src/game/reveal.ts): a far view from high above, in four
  // layers that move apart as the camera pulls back from Ironhaven. Stand-ins by art/reveal.mjs.
  ...[
    ['sky', 'The night sky over the Ashlands, seen from very high and far: deep blue above, an ember haze low on the horizon from the kilns, stars, a pale moon upper right. Opaque, the whole frame.'],
    ['mountains', 'The far mountain ranges along the horizon, cold blue-grey, snow on the highest peaks, fading into haze. Transparent above the mountains.'],
    ['plains', "The ash plains rolling away below the mountains: grey-brown flats, the Rift's dark jagged crack running through the middle into the distance, and far off on the right the kilns' orange glow and chimney smoke. Transparent above the land."],
    ['ridge', 'The near ridge in the lower left: a dark snowy cliff, and on its top Ironhaven, the city of iron and snow: walls, towers and a few lit windows, small against the land. Transparent above the ridge. Ironhaven sits about a third from the left and a third from the top (around x 330, y 270 of 1280x720).'],
  ].map(([layer, subject]) => ({ id: `reveal-${layer}`, kind: 'prop', file: `intro/reveal/reveal-${layer}.webp`, size: { w: 1280, h: 720 }, anchor: 'top-left',
    chapter: 'intro', status: 'final', generator: 'Codex', subject })),
  { id: 'title-ironhaven-courtyard', kind: 'prop', file: 'title/ironhaven-courtyard.webp', size: { w: 1280, h: 720 }, anchor: 'top-left', chapter: 'game', status: 'final', generator: 'title-courtyard.py, bar painted out by Codex', subject: 'Empty Ironhaven courtyard, half covered in snow; no characters or baked-in artifacts. Distant fire and bare flag bracket.' },
  { id: 'title-gauntlet', kind: 'prop', file: 'title/title-gauntlet.png', width: 160, anchor: 'bottom-centre', chapter: 'game', status: 'final', generator: 'title-courtyard.py', subject: 'Mara\'s abandoned gauntlet, independent transparent foreground object.' },
  { id: 'title-ironhaven-flag', kind: 'prop', file: 'title/ironhaven-flag.png', size: { w: 672, h: 480 }, anchor: 'top-left', chapter: 'game', status: 'final', generator: 'Codex', subject: "Ironhaven's banner on its iron bar jutting from the wall, in the courtyard's perspective: six wind frames, 3 by 2 cells of 224 by 240 pixels (Codex; only the cloth moves, billowing right)." },
  { id: 'menu-flame', kind: 'prop', file: 'ui/menu-flame.gif', anchor: 'centre', chapter: 'game', status: 'final', generator: 'menu-flame.py', subject: 'Six-frame realistic flame for title selection.' },
  { id: 'menu-flame-still', kind: 'prop', file: 'ui/menu-flame-still.png', size: { w: 64, h: 64 }, anchor: 'centre', chapter: 'game', status: 'final', generator: 'menu-flame.py', subject: 'Static flame for reduced-motion title selection.' },
  // The notebook's world map (src/content/world.ts): painted without lettering; the game writes the names and the marker.
  { id: 'world-map', kind: 'map', file: 'ui/world-map.png', webp: true, size: { w: 1000, h: 700 }, anchor: 'none', chapter: 'game', status: 'final', generator: 'Codex',
    subject: "A coloured engraved atlas (Codex, 2026-11-10, chosen over moonlit and grey-engraved versions: warm brown land, Ironhaven on a snowy mountain, a blue river, dark forests, copper roofs; same places), of an invented world map: one continent split north to south by the Rift, a deep jagged chasm crossed by a single bridge (Spanwick) at its middle; west of it the grey ash plains around Cinderfold, low foundry hills, and a snowy north with a walled town (Ironhaven); east of it a river with waterwheels (Alderweir), a forest in the south-east, a large old hearth-works further east (the First Hearth), and mountains in the north-east with a lone hut. A dotted road runs from Cinderfold east over the bridge. Follow the layout image exactly: every place sits where its mark is. No words, letters or labels anywhere (the game writes them)." },
  {"id": "regulator-closeup-housing", "kind": "prop", "file": "props/regulator-closeup-housing.png", "size": {"w": 512, "h": 320}, "anchor": "none", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "regulator closeup housing"},
  {"id": "regulator-closeup-ring", "kind": "prop", "file": "props/regulator-closeup-ring.png", "size": {"w": 160, "h": 160}, "anchor": "none", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "regulator closeup ring"},
  {"id": "regulator-closeup-bolt", "kind": "prop", "file": "props/regulator-closeup-bolt.png", "size": {"w": 48, "h": 48}, "anchor": "none", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "regulator closeup bolt"},
  {"id": "regulator-closeup-valve", "kind": "prop", "file": "props/regulator-closeup-valve.png", "size": {"w": 80, "h": 80}, "anchor": "none", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "regulator closeup valve"},
  {"id": "ashways-pressure-cell", "kind": "prop", "file": "props/ashways-pressure-cell.png", "size": {"w": 40, "h": 64}, "anchor": "bottom-centre", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "ashways pressure cell"},
  {"id": "ashways-pressure-cell-ruptured", "kind": "prop", "file": "props/ashways-pressure-cell-ruptured.png", "size": {"w": 40, "h": 64}, "anchor": "bottom-centre", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "ashways pressure cell ruptured"},
  {"id": "ashways-sweeper-disabled", "kind": "prop", "file": "props/ashways-sweeper-disabled.png", "size": {"w": 280, "h": 180}, "anchor": "bottom-centre", "chapter": "ch1", "status": "requested", "generator": "Codex ImageGen", "subject": "ashways sweeper disabled"},
  // ------------------------------------------------------------------------------ rooms ---
  room('room-tent', 'tent', "Mara's tent from inside, pixel art (a 640x360 grid shown 2x), seen side-on with very little perspective and believable proportions: a canvas back wall sagging between two poles under a ridge pole, seams and patches (a FINEST flour sack); his workbench along the left (tools on a board above it: wrench, handsaw, pliers, claw hammer, file; a tool roll, a candle, gloves, a glazed water jar; the charging cradle and the notebook stand on it), a crate and rope under it, a stool in front; the old brush drum, smaller, on a trestle against the back wall (centre, chalked PARTS); a coat on a hook on the right pole; a low cot with a blanket and laced boots along the right, Tobi's drawing pinned above; the door flap at the right edge open on the kiln hall's warm light; a striped rug on packed earth.", 'Warm hanging lantern (centre top) as the main light, falling off into dark corners, soft cast shadows under everything; warm light from the door flap (right) across the floor.'),
  room('room-mara', 'mara-room', 'The kiln hall: a vast vaulted hall built inside an old kiln, the glowing kiln mouths across the back, a pulley hoist (left), storage jars, an ash cart, the curtain to the firing house (right), and the spot where Mara\'s tent stands.', 'Key light from the three kiln mouths at the back (orange); cool dim fill from the left; the vault fades to darkness above.', { pilot: true }),
  room('room-firing-house', 'firing-house', 'The firing house: a communal kitchen and workshop on a lower level, with a hearth (left), a soup pot on the long table, shoe racks, Nell\'s pantry door, stairs up to the regulator gallery (right) and the kiln gate.', 'Warm key light from the hearth (left) and the kiln gate (centre); cool fill from the stair well (right).'),
  room('room-gallery', 'gallery', 'The regulator gallery: huge ceramic pipes, the regulator housing with its ring in the middle, a pressure gauge, a lantern and a workbench with an open notebook; a railing and a wet metal floor on the right where people stand.', 'Warm key light from the lantern (left) and the regulator\'s glow; cool, darker right side.'),
  room('room-ashways', 'ashways', 'The ashways: an open stone causeway under great pipes, a bridge and arches, a valve on a pipe (left), the passage out through an arch (centre right), ash drifting.', 'Hazy warm daylight through the arches at the back; cooler foreground; no fire.'),
  fg('hall-left', 'room-mara', 'Rubble and broken pots in the front left corner of the kiln hall floor, drawn in front of anyone walking behind them.',
    { polygons: [[[0, 620], [120, 636], [176, 720], [0, 720]]], box: [0, 616, 178, 720] }),
  fg('hall-right', 'room-mara', 'A few cracked jars and clinker in the front right corner of the kiln hall floor.',
    { polygons: [[[1136, 652], [1280, 630], [1280, 720], [1116, 720]]], box: [1114, 628, 1280, 720] }),
  // Ansel's seat in the kiln hall: cut from Codex's ashways crate (art/hall-crate.mjs), so it needs no drawing of its own.
  { id: 'hall-crate', kind: 'foreground', file: 'foreground/hall-crate.png', webp: true, anchor: 'top-left', room: 'room-mara', chapter: 'ch1', status: 'final', generator: 'hall-crate.mjs',
    subject: "A wooden crate on the kiln hall floor that Ansel sits on (cut from Codex's ashways crate)." },
  fg('tent-stool', 'room-tent', 'The stool in the tent, in front of the floor.',
    { polygons: [[[150, 412], [336, 412], [338, 470], [332, 604], [146, 604], [150, 470]]], box: [146, 408, 340, 606] }),
  { id: 'prop-gauge-face', kind: 'prop', file: 'props/gauge-face.png', webp: true, anchor: 'centre', chapter: 'ch1', status: 'placeholder', generator: 'pixelate.mjs', subject: 'The gallery pressure gauge dial without its needle (the game draws a live needle).' },
  { id: 'prop-pulley', kind: 'prop', file: 'props/pulley.png', webp: true, anchor: 'top-centre', chapter: 'ch1', status: 'placeholder', generator: 'pixelate.mjs', subject: 'The kiln hall hoist: chains and a hanging pot, hung from its top edge (the game swings it).' },

  // ---------------------------------------------------------------------------- objects ---
  object('rack', 'The charging rack in the tent: a lantern-frame cradle that holds the gauntlet\'s ember cell (full: the cell glowing in it; empty).', ['full', 'empty'], { pilot: true }),
  object('notebook', "Mara's mother's notebook lying open on the workbench.", ['idle']),
  object('pantry-door', "Nell's pantry door with its latch (stuck; fixed).", ['stuck', 'fixed']),
  object('socket', 'The regulator ring in its socket (installed; removed: an empty hollow).', ['installed', 'removed']),
  object('sweeper', 'The ash sweeper: a squat machine with brush drums (idle; scurrying).', ['idle', 'scurry']),
  object('valve', 'The steam valve on a pipe in the ashways (closed; venting steam).', ['closed', 'venting']),
  object('tent', "Mara's tent as seen in the kiln hall: a canvas tent with a dark entrance.", ['idle']),

  // ------------------------------------------------------------------------- characters ---
  { id: 'char-mara', kind: 'character', file: 'characters/mara.png', sheet: 'characters/mara.json', anchor: 'bottom-centre', height: 232, rig: 'mara', chapter: 'game', status: 'placeholder', generator: 'rig.mjs', pilot: true,
    subject: 'Mara, the courier and kiln-minder (he/him): ochre scarf and cloak, ceramic-plated armour, a satchel, and his mother\'s pressure gauntlet on his right arm (the ember cell unlit in this sheet).' },
  { id: 'char-mara-gauntlet', kind: 'character', file: 'characters/mara-gauntlet.png', sheet: 'characters/mara-gauntlet.json', anchor: 'bottom-centre', height: 232, rig: 'mara-gauntlet', chapter: 'game', status: 'placeholder', generator: 'rig.mjs',
    subject: 'Mara with the gauntlet\'s ember cell lit and glowing (same drawing as char-mara, glow on).' },
  { id: 'char-oren', kind: 'character', file: 'characters/oren.png', sheet: 'characters/oren.json', anchor: 'bottom-centre', height: 226, rig: 'oren', chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs',
    subject: 'Oren, the old regulator keeper: grey hair and beard, a leather apron, a pressure gauge in his hands.' },
  { id: 'char-nell', kind: 'character', file: 'characters/nell.png', sheet: 'characters/nell.json', anchor: 'bottom-centre', height: 220, rig: 'nell', chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs',
    subject: 'Nell, who runs the firing house kitchen: short curly hair, an orange scarf, work clothes, leaning on her old counter shutter.' },
  { id: 'char-tobi', kind: 'character', file: 'characters/tobi.png', sheet: 'characters/tobi.json', anchor: 'bottom-centre', height: 140, rig: 'tobi', chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs',
    subject: 'Tobi, a young boy with tousled dark curls, patched teal tunic, brown trousers and a chalk stub. He draws by the firing-house hearth and offers Mara his orange scarf.' },
  { id: 'portrait-tobi', kind: 'portrait', file: 'portraits/tobi.png', anchor: 'none', moods: ['neutral', 'worried'], chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs', subject: "Tobi's head and shoulders." },
  extra('extra-stoker', 'Hollis, the stoker: an older, broad worker with a cap and a shovel.', 218, 'oren'),
  extra('extra-tally', 'Ansel, the old tally-keeper: hooded, with a slate and chalk.', 206, 'oren'),
  extra('extra-hauler', 'Dace, the clay hauler: strong, kerchief, carries clay sacks.', 224, 'mara'),
  extra('extra-runner', 'Pip, a child errand-runner: cap, quick and scruffy.', 150, 'mara'),
  extra('extra-hoist', 'Wren, the hoist hand: kerchief, rope-burnt gloves.', 222, 'nell'),
  extra('extra-kid', 'Bea, a child carrying a board as a toy shield.', 146, 'nell'),
  extra('extra-merchant', 'Corvin, a travelling peddler: hood, a pack of clinking bottles.', 214, 'oren'),
  { id: 'portrait-mara', kind: 'portrait', file: 'portraits/mara.png', anchor: 'none', moods: ['neutral', 'worried', 'angry'], chapter: 'game', status: 'placeholder', generator: 'rig.mjs', subject: "Mara's head and shoulders." },
  { id: 'char-mara-medium', kind: 'character', file: 'characters/mara-medium.png', sheet: 'characters/mara-medium.json', anchor: 'bottom-centre', height: 232, rig: 'mara-medium', chapter: 'game', status: 'placeholder', generator: 'rig.mjs', subject: 'Athletic Mara in medium ceramic armour, neck-only scarf, unpowered gauntlet.' },
  { id: 'char-mara-medium-gauntlet', kind: 'character', file: 'characters/mara-medium-gauntlet.png', sheet: 'characters/mara-medium-gauntlet.json', anchor: 'bottom-centre', height: 232, rig: 'mara-medium-gauntlet', chapter: 'game', status: 'placeholder', generator: 'rig.mjs', subject: 'Athletic Mara in medium ceramic armour, neck-only scarf, powered gauntlet.' },
  { id: 'portrait-oren', kind: 'portrait', file: 'portraits/oren.png', anchor: 'none', moods: ['neutral', 'worried', 'angry'], chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs', subject: "Oren's head and shoulders." },
  { id: 'portrait-nell', kind: 'portrait', file: 'portraits/nell.png', anchor: 'none', moods: ['neutral'], chapter: 'ch1', status: 'placeholder', generator: 'rig.mjs', subject: "Nell's head and shoulders." },

  // ------------------------------------------------------------------- items and icons ---
  item('gauntlet', "Mara's pressure gauntlet."),
  item('notebook', "His mother's notebook, closed."),
  item('regulator', 'The cracked regulator ring, still faintly pulsing.'),
  item('bread', 'A small loaf from Nell.'),
  item('scarf', "Nell's orange scarf, folded."),
  // The Kiln Tonic peddlers sell: drawn in code for now (src/ui/icons.ts TONIC_ICON) until delivered.
  { ...item('tonic', 'A Kiln Tonic: a small stoppered glass flask of glowing ember-orange tonic, a cork and a brass collar.'), chapter: 'game', status: 'requested', generator: 'src/ui/icons.ts (drawn in code)' },
  icon('look', 'An eye.'), icon('open', 'A door swinging open.'), icon('close', 'A door shutting.'), icon('take', 'A grabbing hand.'),
  icon('use', 'A gear with a hand.'), icon('talk', 'A speech bubble.'), icon('go', 'A walking foot / arrow.'),
  icon('crouch', 'A crouching figure.'), icon('lie', 'A lying figure.'), icon('stand', 'A standing figure.'),

  // ----------------------------------------------------------------------------- fights ---
  { id: 'battle-scavenger', kind: 'battle', file: 'battle/scavenger.png', anchor: 'bottom-centre', width: 300, chapter: 'ch1', status: 'placeholder', generator: 'battle.mjs', pilot: true,
    subject: 'The Hatch Scavenger: a squat pressure-machine with ceramic claws and bucket arms, glowing furnace belly (it climbs out of a floor hatch in the room, and stands opposite Mara in the fight).' },
  { id: 'battle-hero', kind: 'battle-portrait', file: 'kc/hero.webp', anchor: 'bottom-centre', width: 512, chapter: 'game', status: 'placeholder', generator: 'kc.mjs',
    subject: 'Mara, full body, standing ready to fight (the fight screen\'s hero art, larger than the room sprite).' },
  { id: 'battle-hero-low', kind: 'battle-portrait', file: 'kc/hero-low.webp', anchor: 'bottom-centre', width: 511, chapter: 'game', status: 'final',
    subject: 'Mara in the approved lower fighting stance, gauntlet beside the hip; combat-poses.mjs rebuilds from the preserved v2 reference.' },
  { id: 'battle-hero-punch', kind: 'battle-portrait', file: 'kc/hero-punch.webp', anchor: 'bottom-centre', width: 638, chapter: 'game', status: 'final',
    subject: 'Mara at punch contact, powered gauntlet extended; combat-poses.mjs rebuilds from the preserved v2 reference.' },
  { id: 'battle-enemy-scavenger', kind: 'battle-portrait', file: 'kc/pressure-scavenger.webp', anchor: 'bottom-centre', width: 768, chapter: 'ch1', status: 'placeholder', generator: 'kc.mjs',
    subject: 'The Hatch Scavenger at fight-screen size.' },
  { id: 'battle-backdrop-gallery', kind: 'battle-backdrop', file: 'kc/regulator-gallery.webp', size: { w: 1280, h: 720 }, anchor: 'top-left', chapter: 'ch1', status: 'placeholder', generator: 'kc.mjs',
    subject: 'The regulator gallery as the fight backdrop (same place as room-gallery, the floor clear in the lower third).' },
  { id: 'card-atlas', kind: 'card-atlas', file: 'kc/card-atlas.webp', anchor: 'none', chapter: 'game', status: 'placeholder', generator: 'kc.mjs',
    subject: 'Assembled from the nine card tiles (3x3).' },
  card('strike', 'Knuckle Drive', 'a gauntleted fist driving forward in a burst of sparks.'),
  card('guard', 'Ceramic Guard', 'a ceramic plate raised, cracks of light around its edge.'),
  card('pulse', 'Kiln Pulse', 'the gauntlet\'s ember cell flaring, a ring of heat.'),
  card('vent', 'Open the Vents', 'steam blasting out of opened vents.'),
  card('cycle', 'Pressure Cycle', 'a valve wheel spinning, gauges ticking.'),
  card('piston', 'Piston Strike', 'a piston punch with a shockwave.'),
  card('shield', 'Heat Shield', 'a glowing shield of hot ceramic.'),
  card('draw-back', 'Draw pile', 'the back of a card: a brass kiln emblem.'),
  card('discard-back', 'Discard pile', 'the back of a card, ashen and cooled.'),
  equipment('courier-gauntlet', "His mother's Courier Gauntlet."),
  { ...equipment('heavy-gauntlet', 'Heavy gauntlet: a reinforced pressure gauntlet with heavy ceramic knuckles, brass fittings and a broad protective cuff.'), tier: 1 },
  { ...equipment('balanced-gauntlet', 'Balanced gauntlet: a compact pressure gauntlet with evenly weighted ceramic plates and brass fittings.'), tier: 1 },
  equipment('patched-coat', 'A patched ceramic coat.'),
  equipment('plain-carrier', 'A plain carrier bag.'),
  equipment('light-armor', 'Light armour: spaced ceramic plates.'),
  { ...equipment('layered-armor', 'Medium armour: an overlapping chipped ivory ceramic cuirass and shoulder plates, worn brass rivets and edging, brown leather straps and a quilted leather backing. Match medium Mara; show the armour alone without a person, scarf or gauntlet.'), tier: 1, status: 'requested', generator: 'Codex' },
  equipment('quick-harness', 'A quick-release harness.'),
  { ...equipment('insulated-kit', 'Insulated kit: protective work gear with heat-resistant padding, ceramic fittings and worn straps.'), tier: 1 },
  // Worn always, shown on the gear screen's paper doll (drawn in code until delivered).
  { ...equipment('work-trousers', "Mara's work trousers: heavy dark cloth with ceramic knee plates, patched at both knees."), status: 'requested', generator: 'src/kc/Armory.tsx (drawn in code)' },
  { ...equipment('courier-boots', "Mara's courier boots: stitched brown leather, resoled more than once, brass buckles."), status: 'requested', generator: 'src/kc/Armory.tsx (drawn in code)' },
  { id: 'sign-wood', kind: 'prop', file: 'props/sign-wood.png', size: { w: 240, h: 56 }, anchor: 'none', chapter: 'game', status: 'requested', generator: 'Codex',
    subject: 'A blank weathered wooden room-name board face, scuffed grain and worn iron corner fittings, matching the tent reference. Flat front view, transparent outside its silhouette. No lettering, symbols, ropes, hook or background; the game draws the room name and suspension.' },
  { id: 'sign-iron', kind: 'prop', file: 'props/sign-iron.png', size: { w: 240, h: 56 }, anchor: 'none', chapter: 'game', status: 'requested', generator: 'Codex',
    subject: 'A blank wide rectangular iron room-name plate face, soot-dark iron with worn brass edging, rivets and restrained rust, matching the tent reference. Flat front view, transparent outside its silhouette. No lettering, symbols, ropes, hook or background; the game draws the room name and suspension.' },
  { id: 'sign-shield', kind: 'prop', file: 'props/sign-shield.png', size: { w: 160, h: 108 }, anchor: 'none', chapter: 'game', status: 'requested', generator: 'Codex',
    subject: 'A blank shield-shaped iron room-name plate face for the regulator gallery, with a flat top, gently pointed bottom, worn brass edging and rivets. Soot-dark metal with restrained rust, matching the tent reference. Flat front view, transparent outside its silhouette. No lettering, symbols, ropes, hook or background; the game draws the room name and suspension.' },
  // ------------------------------------------------------------------ chapter 2: Tempered Flow ---
  { ...room('room-tunnel-mouth', 'tunnel-mouth', 'The mouth of the service tunnels at dawn, chapter 2\'s calm start: the ash road behind and a pale pink-gold dawn sky (left), a long pipe lying along the ground that makes a bench (centre), the brick arch of service line 4 with an iron name plate above and a lit lamp beside it (right), dark inside.', 'Soft dawn light from the left; the lamp by the arch warm; the arch itself black.'), file: 'ch2/rooms/tunnel-mouth.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...room('room-tunnel-collapse', 'tunnel-collapse', 'A collapsed service tunnel under the ashways: a brick vault with pipes along the ceiling, a heap of fallen rubble filling the way back (left), wet stone floor with puddles, a dark opening at the far end (centre right) where a rusted grate stands (drawn separately, object grate).', 'Very dark; one failing lamp (centre top) and the warm glow Mara carries; cold, damp shadows.'), file: 'ch2/rooms/tunnel-collapse.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...room('room-tunnel-steam', 'tunnel-steam', 'A steam junction in the tunnels: a long pipe with a copper band along the wall (right) leaking steam (drawn separately, object steam), a copper line running from it down to a copper valve wheel, an iron valve wheel beside it, a pressure gauge above them; the passage on (right edge) and the way back (left edge).', 'Very dark; a failing lamp (left top) and the glow Mara carries; the steam faintly lit.'), file: 'ch2/rooms/tunnel-steam.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...room('room-tunnel-cistern', 'tunnel-cistern', 'An ash cistern: a dark pit across the floor (centre), a far ledge (right) with grey daylight from the road beyond, a pulley over the pit with the counterweight chain running down to a cleat on the near side (left of the pit), lying against a hot steam pipe (its lower links glow). The drawbridge and the nest basket are drawn separately (objects bridge, basket).', 'Very dark on the near side (one lamp, left, and Mara\'s glow); pale daylight on the far ledge.'), file: 'ch2/rooms/tunnel-cistern.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...object('grate', 'The rusted grate at the end of the collapsed tunnel, jammed with rubble (closed; open: swung aside, the nest behind).', ['closed', 'open']), file: 'ch2/objects/grate.png', sheet: 'ch2/objects/grate.json', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...object('steam', 'The jet of steam blocking the junction (on; off: nothing).', ['on', 'off']), file: 'ch2/objects/steam.png', sheet: 'ch2/objects/steam.json', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...object('bridge', 'The cistern drawbridge, hinged on the far ledge (up: raised on its end; down: lying across the pit).', ['up', 'down']), file: 'ch2/objects/bridge.png', sheet: 'ch2/objects/bridge.json', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...object('rag', 'An oily rag caught in the rubble of the collapsed tunnel (only there when Mara has no scarf).', ['idle']), file: 'ch2/objects/rag.png', sheet: 'ch2/objects/rag.json', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...item('rag', 'A thick, oily rag.'), file: 'ch2/items/rag.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...object('basket', 'The counterweight basket under the pulley, a nest in it (hanging; gone: nothing).', ['hanging', 'gone']), file: 'ch2/objects/basket.png', sheet: 'ch2/objects/basket.json', chapter: 'ch2', generator: 'ch2.mjs' },
  ...[
    ['cinder-rat', 'Cinder Rat: a tunnel rat the size of a dog, fur singed to grey wire, glowing ember eyes, a long tail.'],
    ['rat-pack', 'Rat Pack: three or four cinder rats moving together, one in front, the others behind and on top.'],
    ['ash-mites', 'Ash Mite Swarm: a cluster of grey, spiny, six-legged mites the size of fists, ember-orange eyes, half sunk in ash.'],
    ['pipe-beetle', 'Pipe Beetle: a big beetle with a copper-coloured shell like a pot lid, studded, a dark head with one glowing eye and a short horn.'],
  ].flatMap(([id, subject]) => [
    { id: `battle-enemy-${id}`, kind: 'battle-portrait', file: `ch2/creatures/${id}.webp`, anchor: 'bottom-centre', height: 768, chapter: 'ch2', status: 'placeholder', generator: 'ch2.mjs',
      subject: `${subject} For the fight screen: facing left, a picture 768 tall with the creature exactly 60% of that height, standing 4% above the bottom edge, as wide as it needs, transparent background.` },
    { id: `creature-${id}`, kind: 'prop', file: `ch2/creatures/${id}.png`, height: 120, anchor: 'bottom-centre', chapter: 'ch2', status: 'placeholder', generator: 'ch2.mjs',
      subject: `${subject} Small, for its entrance in the room (same pose as the fight picture).` },
  ]),
  { ...room('room-road', 'road', "The road to Bryn's tempering house, at the edge of the ashways at dusk: a stone house (right) with a heavy wooden door, a lit window and a bell on a bracket, a lantern by the door, a chimney breathing steam; the ash road and a signpost back towards Cinderfold (left), great pipes in the haze behind.", 'Warm key light from the window and the door lantern (right); cool blue-grey dusk from the sky (left).'), file: 'ch2/rooms/road.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...room('room-workshop', 'workshop', "Bryn's workshop inside the tempering house: a great ceramic return pipe across the top with a glowing flange (the reading valve), her bench with a glove and tools (left), a stool, a caged training rig in the middle, a coal crate, the open side on the right looking out over the valley, a curtain to the back room (left).", 'Warm daylight from the open side (right); the pipe flanges glow orange; cooler shadow on the left under the bench.'), file: 'ch2/rooms/workshop.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { ...room('room-backroom', 'backroom', "Bryn's back room: a stone hearth with a pot on the fire (left), a shelf of supply crates and jars, a table with a bowl and bread, a map pinned on the wall above it, a cot under a blanket (right), a courier's pouch on a peg by the far door (right), the curtain back to the workshop (left edge).", 'Warm key light from the hearth (left); soft lamplight over the table; the far door side darker.'), file: 'ch2/rooms/backroom.png', chapter: 'ch2', generator: 'ch2.mjs' },
  { id: 'char-bryn', kind: 'character', file: 'ch2/characters/bryn.png', sheet: 'ch2/characters/bryn.json', anchor: 'bottom-centre', height: 224, rig: 'bryn', chapter: 'ch2', status: 'placeholder', generator: 'rig.mjs',
    subject: 'Bryn, a gauntlet smith in her thirties who runs the tempering house: broad-shouldered and heavily muscled from hauling crucibles, sleeves rolled, a leather apron over work clothes, a kerchief over her hair, a quick grin.' },
  { id: 'portrait-bryn', kind: 'portrait', file: 'ch2/portraits/bryn.png', anchor: 'none', moods: ['neutral'], chapter: 'ch2', status: 'placeholder', generator: 'rig.mjs', subject: "Bryn's head and shoulders." },
  { id: 'battle-backdrop-workshop', kind: 'battle-backdrop', file: 'kc/tempering-house.webp', size: { w: 1280, h: 720 }, anchor: 'top-left', chapter: 'ch2', status: 'placeholder', generator: 'kc.mjs',
    subject: "Bryn's workshop as the sparring backdrop (same place as room-workshop, the floor clear in the lower third)." },
  { id: 'battle-enemy-rig', kind: 'battle-portrait', file: 'kc/ash-sweeper.webp', anchor: 'bottom-centre', width: 768, chapter: 'ch2', status: 'placeholder', generator: 'kc.mjs',
    subject: "Bryn's training rig: a caged brush drum on a sprung frame that swings back at whoever strikes it." },
  // ------------------------------------------------ the intro: Silas's escape from Ironhaven's cells ---
  { ...room('room-cell', 'cell', "A cell in Ironhaven's prison at night, with Silas's hooded cloak hanging on its nail in the corridor, seen side-on: on Silas's side (left two thirds), a straw cot with a ragged blanket (left), a dented tin plate with a crust on the floor beside it, a small barred window high in the wall with a thread of moonlight, a weeping patch of wall where plaster flakes away, a bucket; then the iron bars with their door (centre right, at x 732-812). Beyond the bars, a stone corridor: the guard's table with a stub of candle and a cup (the mask frame lies on it, drawn separately), the duty roster pinned on the wall with a sketch of Sergeant Harrow, the guard's chair, and stone stairs going up at the far right.", 'Cold blue moonlight from the window (left); one warm candle pool on the table beyond the bars (right). The game darkens the room until Silas throws the moonlight across it, so paint it as seen lit.'), file: 'intro/rooms/cell.png', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/cell-cloak)' },
  { ...room('room-cell-bare', 'cell-bare', "The same cell painting with the cloak gone from its nail (shown once Silas takes it back); identical everywhere else.", 'As room-cell.'), file: 'intro/rooms/cell-bare.png', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/cell-cloak)' },
  { ...room('room-guardroom', 'guardroom', "The guardroom at the top of the prison stairs: the stairs going down at the left edge, a peg with a grey clerk's hood, a shelf with a thick red tally ledger, a black iron stove with its door glowing in the middle, the guard's desk (right of centre), and an iron grate at the right edge opening onto the snowy night.", 'Warm orange light from the stove (centre); cold blue night through the grate (right).'), file: 'intro/rooms/guardroom.png', chapter: 'intro', generator: 'intro.mjs' },
  { ...room('room-prison-door', 'prison-door', "Outside Ironhaven's prison at night: a small heavy door with a lantern (left) in a black stone wall with crenellations, snow on the ground and falling, the city's iron roofs faint in the distance.", 'Cold blue night; the lantern by the door the one warm light.'), file: 'intro/rooms/prison-door.png', chapter: 'intro', generator: 'intro.mjs' },
  ...[
    ['silas', 'Silas, the con man.', 220],
    ['silas-harrow', 'Silas wearing the Harrow mask (only the face and head differ from char-silas).', 220],
    ['silas-clerk', "Silas as the tally clerk: hood up, a ledger held to his chest (only the head and arms differ from char-silas).", 220],
    ['silas-cloak', 'Silas in his own hooded cloak, hood up framing his face (Codex, silas-cloak-layered).', 220],
    ['silas-cloak-clerk', 'Silas in his cloak as the tally clerk: the hood pulled low, the ledger to his chest.', 220],
    ['guard', "Benn, the young night guard of Ironhaven's cells.", 216],
    ['guard-nokeys', "Benn without his key ring (after Silas lifts it).", 216],
    ['warden', "Kell, the guardroom guard of Ironhaven's prison.", 230],
    ['sigrid', 'Captain Sigrid of Ironhaven.', 228],
  ].flatMap(([id, subject, height]) => [
    { id: `char-${id}`, kind: 'character', file: `intro/characters/${id}.png`, sheet: `intro/characters/${id}.json`, anchor: 'bottom-centre', height, rig: id, chapter: 'intro', status: 'placeholder', generator: 'rig.mjs', subject },
    ...(RIGS[id].noPortrait ? [] : [{ id: `portrait-${id}`, kind: 'portrait', file: `intro/portraits/${id}.png`, anchor: 'none', moods: RIGS[id].moods ?? ['neutral', 'worried', 'angry'], chapter: 'intro', status: 'placeholder', generator: 'rig.mjs', subject: `${subject} Head and shoulders.` }]),
  ]),
  ...[
    ['plate', 'A dented tin plate, shiny in the dent.'], ['crust', 'A stale crust of bread.'], ['nail', 'A bent iron nail.'],
    ['strip', 'A long strip torn from a grey blanket.'], ['hookLine', 'The bent nail tied to the end of a blanket strip, like a fishing line.'],
    ['frame', "Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges, shaped to sit under a face mask."],
    ['plaster', 'A few grey flakes of damp wall plaster.'], ['wetPlaster', 'A grey lump of plaster gone soft with water.'],
    ['putty', 'A ball of grey putty: plaster kneaded into bread.'],
    ['maskHarrow', "The Harrow mask: a crude grey plaster-and-bread face (heavy jaw, pouched eyes, a bristling hair moustache) moulded on the brass frame."],
    ['keys', 'An iron key ring with three heavy keys.'], ['hood', "A drab grey clerk's hood."], ['ledger', 'A thick red tally ledger.'],
    ['maskClerk', "The clerk's guise: the grey hood folded over the red ledger."],
  ].map(([id, subject]) => ({ ...item(id, subject), file: `intro/items/${id}.png`, chapter: 'intro', generator: 'intro.mjs' })),
  { ...object('window-plate', "The dented tin plate wedged at the bottom of the cell's barred window, tilted to throw the moonlight into the cell, its dent shining.", ['idle']),
    file: 'intro/objects/window-plate.png', sheet: 'intro/objects/window-plate.json', chapter: 'intro', generator: 'intro.mjs' },
  { ...object('floor-plate', 'A dented tin plate with a stale crust on it, lying on the cell floor by the cot.', ['idle']),
    file: 'intro/objects/floor-plate.png', sheet: 'intro/objects/floor-plate.json', chapter: 'intro', generator: 'intro.mjs' },
  // The guardroom's ledger on its shelf, cut from Codex's painting along its outline; the room itself
  // is Codex's empty version (art/inbox/done/intro-next-review), so it can go.
  { ...object('guardroom-ledger', 'The red-brown tally ledger lying on the guardroom shelf.', ['idle']),
    file: 'intro/objects/guardroom-ledger.png', sheet: 'intro/objects/guardroom-ledger.json', chapter: 'intro', status: 'final', generator: 'Codex (cut out by Claude)' },
  // Silas's hooded cloak on its nail in the cell's corridor, cut from Codex's painting (the wall behind
  // it painted in from the stones beside it) so it goes when he takes it.
  { ...object('table-stub', "The guard's spare candle burnt down to almost nothing on the left end of his table: a short ivory stub in its own puddle, a dribble run over the edge and a tiny guttering flame (the game adds the glow).", ['idle']),
    file: 'intro/objects/table-stub.png', sheet: 'intro/objects/table-stub.json', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/table-wax)' },
  { ...object('floor-wax', "A fat drop of fallen tallow on the floor between the cage and the table, glossy and still soft, the one Silas reaches for through the cage's right side.", ['idle']),
    file: 'intro/objects/floor-wax.png', sheet: 'intro/objects/floor-wax.json', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/table-wax)' },
  // Silas on one knee reaching through the cage's right-side bars for the wax (only that pickup): the
  // body (behind the bars) and the exposed forearm (in front), drawn at frame anchor (128,254).
  { ...object('silas-kneel-reach', 'Silas kneeling, his near arm through the cage bars and his hand open at the floor: the body layer and the forearm layer.', ['behind', 'arm']),
    file: 'intro/objects/silas-kneel-reach.png', sheet: 'intro/objects/silas-kneel-reach.json', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/silas-kneel-reach)' },
  { id: 'item-wax', kind: 'item', file: 'intro/items/wax.png', size: { w: 64, h: 64 }, anchor: 'none', chapter: 'intro', status: 'final', generator: 'Codex (art/inbox/done/candle-stub)', subject: 'A lump of soft tallow, warmed and kneaded in the hand.' },
  { ...object('stairs-light', 'Warm light thrown across the cell corridor floor from the stairwell door off to the right, in the shape of the doorway.', ['idle']),
    file: 'intro/objects/stairs-light.png', sheet: 'intro/objects/stairs-light.json', chapter: 'intro', status: 'placeholder', generator: 'Claude (a soft light effect, not palette art)' },
  { ...object('outer-lantern', "The outer door's wall lantern on its bracket (cut from Codex's painting), hung again mid-wall.", ['idle']),
    file: 'intro/objects/outer-lantern.png', sheet: 'intro/objects/outer-lantern.json', chapter: 'intro', status: 'final', generator: 'Codex (cut out by Claude)' },
  { ...object('guardroom-torch', 'A wall torch: a pitch-wrapped head on a wooden haft, for the iron brackets on the guardroom walls (unlit: the game adds the flame).', ['idle']),
    file: 'intro/objects/guardroom-torch.png', sheet: 'intro/objects/guardroom-torch.json', chapter: 'intro', generator: 'intro.mjs' },
  { ...object('table-frame', "Silas's articulated brass mask frame lying flat on the guard's table, with a clear brass rim and open centre.", ['idle']),
    file: 'intro/objects/table-frame.png', sheet: 'intro/objects/table-frame.json', chapter: 'intro', status: 'final', generator: 'Codex' },
  // The cage's door, cut from Codex's closed/open overlays (art/inbox/done/cell-cage-perspective): the
  // pixels that differ between the two, so cell-cage plus this frame reproduce each overlay exactly.
  { ...object('cell-gate', "The cage's human-sized iron door in the middle of its front face, closed and swung outward to the left.", ['closed', 'open']),
    file: 'intro/objects/cell-gate.png', sheet: 'intro/objects/cell-gate.json', chapter: 'intro', status: 'final', generator: 'Codex (split by Claude)' },
  // The cell's cage, drawn in front of Silas: Codex's overlay without its door (cell-gate).
  { id: 'cell-cage', kind: 'foreground', file: 'foreground/cell-cage.png', webp: true, anchor: 'top-left', room: 'cell', chapter: 'intro', status: 'final', generator: 'Codex (split by Claude)',
    subject: "The cell's iron cage in a gentle three-quarter view: thin close bars, a shallow roof above the window and a narrow right side; a doorway in the middle of the front (the door itself is cell-gate)." },
  icon('read', 'Read people: a face in profile with a small gold glint of insight above it.'),
];

/**
 * Each object's frame in art pixels (2x world units; multiples of the 2-pixel grid), in true
 * proportion to Mara (232 art pixels tall): the importer fits a Codex drawing into this box, standing
 * on its bottom centre (the object's foot point in the room).
 */
const OBJECT_FRAMES = {
  rack: { w: 56, h: 72 },          // a brass cradle on the workbench, hand-and-a-half tall
  notebook: { w: 72, h: 24 },      // a book lying open on the bench
  'pantry-door': { w: 120, h: 304 }, // a full-height plank door, 1.3x Mara
  socket: { w: 160, h: 160 },      // the regulator ring set in the great pipe
  sweeper: { w: 260, h: 140 },     // a squat machine, reaching Mara's chest
  valve: { w: 112, h: 204 },       // a valve wheel on its standpipe
  tent: { w: 184, h: 224 },        // Mara's tent pitched in the hall, about his height at the ridge
  grate: { w: 148, h: 224 },       // the grate filling the tunnel's end opening
  steam: { w: 140, h: 280 },       // the jet from floor to pipe
  bridge: { w: 320, h: 220 },      // the drawbridge up (on end) or down across the pit
  rag: { w: 60, h: 32 },           // an oily rag in a heap
  basket: { w: 84, h: 92 },        // the counterweight basket with its nest
};
for (const e of MANIFEST) if (e.kind === 'object' && OBJECT_FRAMES[e.id]) e.frame = OBJECT_FRAMES[e.id];

// ------------------------------------------------- descriptions, the cast, new requests ---
// The detailed descriptions Codex paints from (art/descriptions.mjs) replace the short subjects.
import { CARDS, CAST, DESCRIPTIONS, GEAR, GEAR_TIERS, LIGHTS } from './descriptions.mjs';
const WHO = {
  'char-mara': CAST.mara, 'char-mara-gauntlet': `${CAST.mara} ${CAST.maraLit}`, 'char-oren': CAST.oren, 'char-nell': CAST.nell, 'char-bryn': CAST.bryn,
  'char-silas': CAST.silas, 'char-silas-harrow': CAST.silasHarrow, 'char-silas-clerk': CAST.silasClerk,
  'char-guard': CAST.guardCell, 'char-warden': CAST.guardStairs, 'char-sigrid': CAST.sigrid,
  'extra-stoker': CAST.hollis, 'extra-tally': CAST.ansel, 'extra-hauler': CAST.dace, 'extra-runner': CAST.pip,
  'extra-hoist': CAST.wren, 'extra-kid': CAST.bea, 'extra-merchant': CAST.corvin,
};
// Mara off duty: everyday clothes, no armour, no gauntlet (requested; rigged once delivered).
MANIFEST.push({ id: 'char-mara-casual', kind: 'character', file: 'characters/mara-casual.png', sheet: 'characters/mara-casual.json', anchor: 'bottom-centre', height: 232,
  chapter: 'game', status: 'requested', generator: 'rig.mjs (once delivered: measure RIGS, then npm run rig)', subject: CAST.maraCasual });
// Ten tiers of every piece of gear: tier 1 is the piece's own picture, tiers 2-10 new pictures beside it.
for (const [id, base] of Object.entries(GEAR)) {
  for (let tier = 2; tier <= 10; tier++) {
    MANIFEST.push({ id: `equipment-${id}-t${tier}`, kind: 'equipment', file: `kc/equipment/${id}-t${tier}.webp`, size: { w: 320, h: 320 }, anchor: 'none', tier,
      chapter: 'game', status: 'requested', generator: 'Codex', subject: `${base} ${GEAR_TIERS[tier - 1]}` });
  }
}
for (const e of MANIFEST) {
  if (LIGHTS[e.id]) e.light = LIGHTS[e.id];
  if (WHO[e.id]) e.subject = WHO[e.id];
  else if (DESCRIPTIONS[e.id]) e.subject = DESCRIPTIONS[e.id];
  else if (e.kind === 'portrait') e.subject = `${e.subject.replace(/\.$/, '')}: cut by the game from the character's drawing.`;
  else if (e.kind === 'card') { const [name, does, motif] = CARDS[e.id.slice(5)]; e.subject = `${name} (the card's effect: ${does}): ${motif}`; }
  else if (e.kind === 'equipment' && !e.tier) { const id = e.id.slice('equipment-'.length); e.tier = 1; e.subject = `${GEAR[id]} ${GEAR_TIERS[0]}`; }
}

// ------------------------------------------ Silas, a main character: his articulated pack ---
// Like Mara (art/LAYERED-RIG.md): one standing master, then eleven body layers, joints, two walk
// references, kneeling and lying, all on the master's canvas; plus his two masks as overlay layers.
// Phase 1 (the standing figure) is approved by the user before Phase 2 is made. Codex saves every
// piece in art/inbox/done/silas-layered/; Claude brings the pack into art/sources/characters/silas-layered/
// and writes its rig.json. Until then the char-silas sheets are the recoloured stand-in.
const SILAS_PACK = 'silas-layered';
const MARA_PACK = 'art/sources/characters/mara-casual-layered/';
const LAYERS = {
  farUpperArm: 'the far upper arm, shoulder to elbow', farForearm: 'the far forearm and hand, elbow to fingertips',
  farThigh: 'the far thigh, hip to knee', farShin: 'the far shin, knee to ankle', farBoot: 'the far boot, ankle to toe',
  nearThigh: 'the near thigh, hip to knee', nearShin: 'the near shin, knee to ankle', nearBoot: 'the near boot, ankle to toe',
  torso: 'the head, neck, torso and hips: everything that is not an arm or a leg segment',
  nearUpperArm: 'the near upper arm, shoulder to elbow', nearForearm: 'the near forearm and hand, elbow to fingertips',
};
// Mara's pack stands 1460 px from head to sole on the 1024x1536 canvas (232 in the game); Silas, 220.
const SETUP = 'On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about 1385 px from head to sole (head top near y 115), horizontally centred, the same scale as Mara\'s master.png. In the game he stands 220 art px, a little shorter than Mara at 232.';
const CANVAS = 'On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).';
const piece = (piece, phase, subject, spec, extra = {}) => ({
  id: `silas-${piece}`, kind: 'pack', pack: SILAS_PACK, piece, phase, file: `../sources/characters/${SILAS_PACK}/${piece}.png`, anchor: 'none',
  chapter: 'intro', status: 'requested', generator: 'Codex', subject, spec, ...extra,
});
const GAIT = 'His walk: light, loose and theatrical, a bit mad: a springy stride with a hint of a skip, the hips swinging, arms loose and swinging a little too freely, the chin up, as if he were walking onto a stage to applause only he can hear. (Mara walks like a courier on a job; Silas walks like a man about to talk his way past you, humming.)';
MANIFEST.push(
  // Phase 1: the standing figure, then stop for the user's approval.
  piece('master', 1, `${CAST.silas} The walk master: standing in profile facing right, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body so no arm hides the torso or the other arm). Only one eye shows (profile).`,
    [SETUP, 'This drawing is the anatomy every later piece is cut from and must recompose exactly: draw clean, separate limbs (nothing overlapping that would be hard to split at the shoulders, elbows, hips, knees and ankles).', `Match the format of Mara's: ${MARA_PACK}master.png.`]),
  piece('idle', 1, `${CAST.silas} His standing picture when he is still: the same figure, clothes and scale as the master, turned a little more towards us (a slight three-quarter view), both eyes visible, weight on one leg, head cocked as if listening to a voice nobody else hears, a lopsided, slightly manic grin with the mouth closed, one hand mid-flourish.`,
    [SETUP, 'Exactly the same scale and soles line as master.png. This is the picture the game shows whenever he stands still, and his dialogue portrait is cut from its head (so the face must be clear and well lit).', `Match the format of Mara's: ${MARA_PACK}idle.png.`]),
  // Phase 2: everything cut from the approved master.
  ...Object.entries(LAYERS).map(([name, what]) => piece(name, 2, `Silas's ${what}, cut from the approved master.png.`,
    [CANVAS, `Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.`,
      'Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.',
      `Match Mara's layers: ${MARA_PACK}${name}.png.`])),
  piece('joints', 2, 'The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle.',
    [CANVAS, `Use exactly the colours of ${MARA_PACK}joint-colours.json (copy the file beside it, renamed for Silas). Each dot about 12 px across, exactly on the joint's pivot.`]),
  piece('walk-contact', 2, `${CAST.silas} A walk reference, the contact pose: the front heel just touching the floor, the back toe about to lift, the arms swung opposite the legs. ${GAIT}`,
    [CANVAS, 'Drawn from the approved master (same face, clothes and scale); it guides the rig, it is not shown in the game.', `Match ${MARA_PACK}walk-contact.png.`]),
  piece('walk-passing', 2, `${CAST.silas} A walk reference, the passing pose: one leg straight under the body, the other passing it with the knee bent and the foot lifted. ${GAIT}`,
    [CANVAS, 'Drawn from the approved master; it guides the rig, it is not shown in the game.', `Match ${MARA_PACK}walk-passing.png.`]),
  piece('kneel', 2, `${CAST.silas} The whole figure down on one knee, facing right, looking at something low (as when picking something up or picking a lock).`,
    ['On a 1024x1536 transparent canvas (or flat magenta), the same scale as master.png, knee and foot on y 1500.', `Match ${MARA_PACK}kneel.png.`]),
  piece('lie', 2, `${CAST.silas} The whole figure lying on his back on the floor, head to the right, eyes closed.`,
    ['On a 1536x1024 landscape transparent canvas (or flat magenta), the same scale as the master, lying on y 990.', `Match ${MARA_PACK}lie.png.`]),
  // The masks: overlay layers the game stacks over his head and arms in every pose.
  ...[['stand', 'master.png'], ['kneel', 'kneel.png'], ['lie', 'lie.png']].flatMap(([pose, over]) => [
    piece(`mask-harrow-${pose}`, 2, `${CAST.silasHarrow} Only the mask itself, on its own layer: the grey plaster-and-bread face with Harrow's heavy jaw, pouched eyes and broom moustache of Silas's hair, the brass frame's rivets at the temples; nothing else of Silas.`,
      [pose === 'lie' ? 'On the 1536x1024 canvas of lie.png, exactly over his face there.' : `On the 1024x1536 canvas of ${over}, exactly over his face there.`, 'Transparent everywhere else: the game draws it on top of Silas in this pose.']),
    piece(`mask-clerk-hood-${pose}`, 2, `${CAST.silasClerk} Only the drab grey clerk's hood, on its own layer, pulled up over his head and forward over his brow.`,
      [pose === 'lie' ? 'On the 1536x1024 canvas of lie.png, exactly over his head there.' : `On the 1024x1536 canvas of ${over}, exactly over his head there.`, 'Transparent everywhere else: the game draws it on top of Silas in this pose.']),
  ]),
  piece('mask-clerk-ledger', 2, "The tally clerk's thick red ledger, held in Silas's near hand against his chest.",
    ['On the 1024x1536 canvas of nearForearm.png, in the hand of that layer, so it moves with the forearm as he walks.', 'Transparent everywhere else.']),
);
// The game's Silas sheets and portraits are built from that pack once it is in.
for (const e of MANIFEST) if (/^(char|portrait)-silas(-|$)/.test(e.id)) e.builtFrom = SILAS_PACK;

// ------------------------------------------ Sigrid, a main character: her articulated pack ---
// The same two-phase pack as Silas's (art/LAYERED-RIG.md): Phase 1 the standing figure, approved by
// the user; Phase 2 the eleven layers, joints, walk references, kneeling and lying. No disguises.
/** A main character's pack request: Codex saves each piece in art/inbox/<pack>/. */
function characterPack({ who, pack, chapter, cast, heightPx, sourcePx, pronoun, idle, gait, kneel, lie, notes = [] }) {
  const P = pronoun === 'she' ? { they: 'she', their: 'her', them: 'her' } : { they: 'he', their: 'his', them: 'him' };
  const headTop = 1500 - sourcePx;
  const setup = `On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about ${sourcePx} px from head to sole (head top near y ${headTop}), horizontally centred, the same scale as Mara's master.png. In the game ${P.they} stands ${heightPx} art px (Mara is 232).`;
  const canvas = 'On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).';
  const piece = (name, phase, subject, spec) => ({
    id: `${who}-${name}`, kind: 'pack', pack, piece: name, phase, file: `../sources/characters/${pack}/${name}.png`, anchor: 'none',
    chapter, status: 'requested', generator: 'Codex', subject, spec,
  });
  return [
    piece('master', 1, `${cast} The walk master: standing in profile facing right, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body so no arm hides the torso or the other arm). Only one eye shows (profile).`,
      [setup, 'This drawing is the anatomy every later piece is cut from and must recompose exactly: draw clean, separate limbs (nothing overlapping that would be hard to split at the shoulders, elbows, hips, knees and ankles).', ...notes, `Match the format of Mara's: ${MARA_PACK}master.png.`]),
    piece('idle', 1, `${cast} ${P.their[0].toUpperCase() + P.their.slice(1)} standing picture when still: the same figure, clothes and scale as the master, turned a little more towards us (a slight three-quarter view), both eyes visible. ${idle}`,
      [setup, `Exactly the same scale and soles line as master.png. This is the picture the game shows whenever ${P.they} stands still, and ${P.their} dialogue portrait is cut from its head (so the face must be clear and well lit).`, `Match the format of Mara's: ${MARA_PACK}idle.png.`]),
    ...Object.entries(LAYERS).map(([name, what]) => piece(name, 2, `${cast.split(' (')[0].split(',')[0]}'s ${what}, cut from the approved master.png.`,
      [canvas, 'Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.',
        'Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.',
        ...notes, `Match Mara's layers: ${MARA_PACK}${name}.png.`])),
    piece('joints', 2, 'The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle.',
      [canvas, `Use exactly the colours of ${MARA_PACK}joint-colours.json (copy the file beside it). Each dot about 12 px across, exactly on the joint's pivot.`]),
    piece('walk-contact', 2, `${cast} A walk reference, the contact pose: the front heel just touching the floor, the back toe about to lift, the arms swung opposite the legs. ${gait}`,
      [canvas, 'Drawn from the approved master (same face, clothes and scale); it guides the rig, it is not shown in the game.', `Match ${MARA_PACK}walk-contact.png.`]),
    piece('walk-passing', 2, `${cast} A walk reference, the passing pose: one leg straight under the body, the other passing it with the knee bent and the foot lifted. ${gait}`,
      [canvas, 'Drawn from the approved master; it guides the rig, it is not shown in the game.', `Match ${MARA_PACK}walk-passing.png.`]),
    piece('kneel', 2, `${cast} ${kneel}`, ['On a 1024x1536 transparent canvas (or flat magenta), the same scale as master.png, knee and foot on y 1500.', `Match ${MARA_PACK}kneel.png.`]),
    piece('lie', 2, `${cast} ${lie}`, ['On a 1536x1024 landscape transparent canvas (or flat magenta), the same scale as the master, lying on y 990.', `Match ${MARA_PACK}lie.png.`]),
  ];
}
MANIFEST.push(...characterPack({
  who: 'sigrid', pack: 'sigrid-layered', chapter: 'intro', cast: CAST.sigrid, heightPx: 228, sourcePx: 1435, pronoun: 'she',
  idle: 'Weight even, back straight, her near hand resting easily on the sword hilt, the other relaxed at her side; a level, assessing look and the faintest composed half-smile, the mouth closed.',
  gait: "Her walk: a soldier's walk, measured and upright, long confident strides, shoulders square, the arms swinging little and in rhythm; nothing wasted. (Mara walks like a courier on a job; Sigrid walks like the person who gives the job.)",
  kneel: 'The whole figure down on one knee, facing right, one hand on the sword hilt, looking at something low on the ground (tracks, a fallen thing).',
  lie: 'The whole figure lying on her back on the floor, head to the right, eyes closed, the sword still in its scabbard at her side.',
  notes: ["The sword: its scabbard hangs from her belt at the left hip, hilt forward, and belongs to the torso layer: keep it clear of the legs below mid-thigh, so the legs can swing behind and in front of it. Her coat ends at mid-thigh, split at the sides: draw the legs fully separate below it."],
}));
for (const e of MANIFEST) if (/^(char|portrait)-sigrid$/.test(e.id)) e.builtFrom = 'sigrid-layered';

// Silas in his own hooded cloak (taken from the cell's corridor wall: the intro's last outfit), hood up
// framing the face, the whole face open. A full pack like his casual one; his clerk guise in it is the
// hood pulled lower and the ledger to the chest (mask layers, like mask-clerk-*). Until it arrives the
// game shows his casual pack (rigs silas-cloak and silas-cloak-clerk follow on delivery).
MANIFEST.push(...characterPack({
  who: 'silas-cloak', pack: 'silas-cloak-layered', chapter: 'intro', heightPx: 220, sourcePx: 1409, pronoun: 'he',
  cast: `${CAST.silas} Here in his own travelling cloak: a long, dark, worn wool cloak with a deep hood, the hood UP and framing his face like a cowl, the whole face clearly visible and lit (no shadow over the eyes), the cloak open at the front over his waistcoat and shirt, falling to mid-calf.`,
  idle: 'Relaxed and theatrical: weight on one leg, one hand drawing the cloak a little round him, the faint amused smile; the hood up, the face open.',
  gait: "His walk: light and quick, a showman's spring, the cloak swinging behind the stride.",
  kneel: 'The whole figure down on one knee, facing right, the cloak pooled on the floor, looking at something low on the ground.',
  lie: 'The whole figure lying on his back, head to the right, eyes closed, the cloak spread under him, the hood fallen back round his head.',
  notes: ['The cloak belongs to the torso layer down to mid-thigh; below that, draw its lower part as separate back and front panels on the far and near thigh layers, so it swings with the stride and never hides a leg completely.',
    'Also deliver, in the same folder, the clerk guise as mask layers over this pack (like silas-layered/mask-clerk-*): mask-clerk-hood-stand.png, mask-clerk-hood-kneel.png, mask-clerk-hood-lie.png (the hood pulled lower over the brow, the face still visible from the eyes down) and mask-clerk-ledger.png (the ledger held to the chest by the near forearm).'],
}));
// Delivered and rigged (2026-11-10); the lower cloak was moved onto the still torso layer so it hangs
// rather than swinging as boards with the thighs (Codex's swinging cut is in art/inbox/done/silas-cloak-layered).
for (const e of MANIFEST) if (e.pack === 'silas-cloak-layered') Object.assign(e, { redo: false, status: 'final' });
for (const e of MANIFEST) if (/^(char|portrait)-silas-cloak(-clerk)?$/.test(e.id)) e.builtFrom = 'silas-cloak-layered';

// ---------------------------------------- two-sided movement: Mara facing left, like Sigrid ---
// Sigrid's pack was drawn twice, facing right and facing left (art/inbox/done/sigrid-layered/left/), so
// what she wears on one side of her body stays on that side. The game used to mirror the right-facing
// art to face left, which moves Mara's gauntlet from his right arm to his left, and his scarf end and
// satchel to the wrong shoulder and hip. Each of Mara's three outfits gets a left-facing set drawn on
// its own: first the three standing masters and idles (the user approves them), then the pieces.
const LEFT_FILES = {
  master: 'The left-facing walk master: standing in profile facing LEFT, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body). Only one eye shows (profile).',
  idle: 'The left-facing standing picture when still: turned a little more towards us (a slight three-quarter view facing left), both eyes visible, the same relaxed pose as the right-facing idle.png of this outfit.',
  ...Object.fromEntries(Object.entries(LAYERS).map(([name, what]) => [name, `${what[0].toUpperCase() + what.slice(1)}, cut from the approved left/master.png. "Near" is now the side nearest the viewer when facing left (Mara's own LEFT side); "far" is his right side.`])),
  joints: 'The joint map of left/master.png: a small solid dot of a fixed colour at the centre of each joint (near and far shoulder, elbow, hip, knee and ankle), near and far as seen facing left.',
  'walk-contact': 'A left-facing walk reference, the contact pose (front heel touching, back toe about to lift, arms swung opposite the legs), the same stride as the right-facing walk-contact.png.',
  'walk-passing': 'A left-facing walk reference, the passing pose (one leg straight under the body, the other passing it with the knee bent), the same stride as the right-facing walk-passing.png.',
  kneel: 'The whole figure down on one knee, facing LEFT, looking at something low: the left-facing counterpart of kneel.png.',
  lie: 'The whole figure lying on his back, head to the LEFT, eyes closed: the left-facing counterpart of lie.png.',
};
const MARA_OUTFITS = [
  ['mara-light-layered', 'light armour', "His mother's pressure gauntlet is on his RIGHT forearm and hand, so facing left it is on the FAR side: behind his body, the big ceramic fist partly hidden by his torso and hips, swinging behind him as he walks (in the walk it belongs to the far forearm layer). His near (left) forearm is his own: the ceramic forearm plate over leather, a bare hand. The ochre scarf's long end, thrown over his LEFT shoulder, is now on the NEAR side, hanging down over his near shoulder and back; the satchel on his LEFT hip is on the NEAR side, in front of the near hip (part of the torso layer: keep it above mid-thigh so the near leg can swing under it). The ember cell glass on the back of the gauntlet's hand faces away from us on this side: show it only where it would truly be seen."],
  ['mara-medium-layered', 'medium armour', "The same rules as the light armour, in the medium (layered ceramic) armour of this pack's master.png: the gauntlet on his RIGHT arm is on the FAR side, behind his body; the scarf end over his LEFT shoulder and the satchel on his LEFT hip are on the NEAR side (the satchel part of the torso layer, above mid-thigh)."],
  ['mara-casual-layered', 'casual clothes', "No gauntlet, armour or satchel in this outfit; it is nearly symmetric, but draw it facing left all the same (light, hair and folds as seen from his left side). The thin leather cord bracelet is on his RIGHT wrist, so facing left it is on the FAR hand; the scarf hangs loose round his neck."],
]
const left = (pack, outfit, sides, name, phase, text) => ({
  id: `${pack.replace('-layered', '')}-left-${name}`, kind: 'pack', pack, piece: `left/${name}`, phase, file: `../sources/characters/${pack}/left/${name}.png`,
  anchor: 'none', chapter: 'game', status: 'requested', generator: 'Codex', twoSided: true,
  subject: `${CAST.mara} In his ${outfit} (exactly the outfit of this pack's right-facing master.png), now drawn FACING LEFT. ${text} ${sides}`,
  spec: [
    name === 'lie' ? 'On a 1536x1024 landscape transparent canvas (or flat magenta), the same scale as the right-facing lie.png, lying on y 990, head to the LEFT.'
      : `On a 1024x1536 transparent canvas (or flat magenta #FF00FF), the same scale, height and soles line (y 1500) as this pack's right-facing master.png${name === 'master' || name === 'idle' ? '' : ', and exactly the canvas and position of the approved left/master.png'}.`,
    'Draw it FACING LEFT as its own drawing: never a horizontal mirror of the right-facing picture. Whatever he wears on one side of his body stays on that side of his body (the prompt says which side each thing is on).',
    ...(LAYERS[name] ? ['Stacked in the usual order (farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm) the eleven left-facing layers must reproduce left/master.png pixel for pixel; extend each piece about 25 px past its joints under the neighbouring layer, as in the right-facing set.'] : []),
    `Save it in the pack's left/ folder: art/inbox/${pack}/left/${name}.png. Sigrid's two-sided pack (art/inbox/done/sigrid-layered/ and its left/ folder) shows the format.`,
  ],
});
for (const [pack, outfit, sides] of MARA_OUTFITS) {
  for (const [name, text] of Object.entries(LEFT_FILES)) MANIFEST.push(left(pack, outfit, sides, name, name === 'master' || name === 'idle' ? 1 : 2, text));
}

// Silas's standing picture, redrawn more relaxed (no hand in the air).
MANIFEST.push({
  id: 'silas-idle-relaxed', kind: 'pack', pack: 'silas-layered', piece: 'idle', phase: 1, redo: true,
  file: '../sources/characters/silas-layered/idle-relaxed.png', anchor: 'none', chapter: 'intro', status: 'requested', generator: 'Codex',
  subject: `${CAST.silas} A redraw of his standing picture (idle.png), more relaxed: the same figure, clothes, scale and soles line, turned a little towards us (a slight three-quarter view facing right), both eyes visible. No hand in the air: both arms down and loose, or one thumb hooked in his waistcoat pocket; his weight easy on one leg, the shoulders loose, the head only slightly cocked, the same sly half-smile with the mouth closed. Still, unhurried, at ease: a man waiting for his moment.`,
  spec: ['File: art/inbox/silas-layered/idle-relaxed.png.', 'On the 1024x1536 canvas of the current idle.png, the same scale and soles line (y 1498); the game shows it whenever he stands still and cuts his dialogue portrait from its head.', 'Keep the approved design exactly (face, hair, clothes, the brass frame at the jaw); only the pose changes.'],
});

// Extras for Silas: the Read icon (sharpened), the suspicion eye, Nessa's mask frame in detail.
const read = MANIFEST.find(e => e.id === 'icon-read');
read.subject = "Read people: a face in profile, looking right, with a small gold glint of insight above the brow (a thought caught). The same style, line weight and colours as the other action-ring icons (art/src/icons/look.png, talk.png...), so it sits in the ring beside them; it is also shown small (about 18 px) before a dialogue reply built on a reading, so it must read at that size.";
MANIFEST.push({ id: 'ui-suspicion-eye', kind: 'icon', file: 'ui/suspicion-eye.png', size: { w: 192, h: 48 }, anchor: 'none', chapter: 'intro', status: 'final', generator: 'Codex',
  subject: "The suspicion eye: how close the person Silas is deceiving is to seeing through him, shown beside the satchel. Four states, left to right: calm (the eye wide open, a pale white, dark pupil); narrowing (the lids half down); narrow (a suspicious slit, the white turned warm); seeing through him (a red-rimmed slit, the white turned red). One eye, the same size and position in each state, drawn like an ink illustration on the game's dark wooden bar.",
  spec: ['File: art/inbox/ui-suspicion-eye.png, a 192x48 strip of four 48x48 frames left to right (calm, narrowing, narrow, red), transparent (or flat magenta).'] });
const frame = MANIFEST.find(e => e.id === 'item-frame');
frame.subject = "Nessa's mask frame, the artifact that lets Silas be anyone: a thin articulated frame of polished brass ribs shaped like the outline of a face (brow band, cheek ribs, a hinged jaw piece), tiny riveted hinges at the temples and jaw, a few fine adjusting screws, a worn leather strap at the back. Fine craftsmanship, a little theatrical; it should look precious next to everything else in a prison satchel.";

// Statuses set by the importer (art/status.json: { "<id>": "final" }) override the defaults above.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const statusFile = join(dirname(fileURLToPath(import.meta.url)), 'status.json');
const STATUS = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, 'utf8')) : {};
for (const entry of MANIFEST) if (STATUS[entry.id]) entry.status = STATUS[entry.id];

/** The pilot pack: the first briefs, to test the style before the full set. */
export const PILOT = MANIFEST.filter(e => e.pilot).map(e => e.id).concat(['card-strike', 'item-gauntlet']);

export const byFile = file => MANIFEST.find(e => e.file === file || e.sheet === file || (e.webp && e.file.replace(/\.png$/, '.webp') === file));
