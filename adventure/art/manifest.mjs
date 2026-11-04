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
  // Before the ember cell is fitted the gauntlet is cold: its glow (the red glass on the back of the fist) is painted dark.
  mara: { ...MARA_RIG, unpowered: { minX: 210, minY: 790, maxX: 320, maxY: 900 } },
  'mara-gauntlet': MARA_RIG,
  oren: {
    source: 'kiln:opening/oren.png', height: 226, walks: false,
    hipY: 1050, splitX: 515, hips: { near: [400, 1040], far: [630, 1040] }, knees: { near: [370, 1230], far: [620, 1215] },
    fidgetPart: { minX: 560, minY: 300, maxY: 600, pivot: [600, 520], angle: -9 },
    eyes: [{ x: 553, y: 116, rx: 9, ry: 5, skinAt: [553, 130] }, { x: 588, y: 112, rx: 8, ry: 5, skinAt: [590, 126] }],
    portrait: [390, 0, 330, 330],
    face: { mouth: { x: 570, y: 166, rx: 15, ry: 4 }, brows: [{ x0: 530, x1: 566, y0: 84, y1: 110, inner: 'right' }, { x0: 572, x1: 600, y0: 82, y1: 108, inner: 'left' }] },
  },
  nell: {
    source: 'kiln:opening/iven.png', height: 220, walks: false,
    hipY: 1000, splitX: 480, hips: { near: [420, 1000], far: [640, 1000] }, knees: { near: [360, 1240], far: [760, 1250] },
    fidgetLean: -3,
    nearIsUpper: true, crouchSquash: 1,
    eyes: [{ x: 452, y: 129, rx: 15, ry: 8, skinAt: [452, 148] }, { x: 507, y: 123, rx: 14, ry: 8, skinAt: [505, 142] }],
    portrait: [320, 0, 340, 340],
    moods: ['neutral'],
    face: { mouth: { x: 486, y: 174, rx: 17, ry: 5 }, brows: [{ x0: 418, x1: 468, y0: 92, y1: 120, inner: 'right' }, { x0: 476, x1: 516, y0: 88, y1: 116, inner: 'left' }] },
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
};

/** @type {ArtEntry[]} */
export const MANIFEST = [
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
  extra('extra-stoker', 'Hollis, the stoker: an older, broad worker with a cap and a shovel.', 218, 'oren'),
  extra('extra-tally', 'Ansel, the old tally-keeper: hooded, with a slate and chalk.', 206, 'oren'),
  extra('extra-hauler', 'Dace, the clay hauler: strong, kerchief, carries clay sacks.', 224, 'mara'),
  extra('extra-runner', 'Pip, a child errand-runner: cap, quick and scruffy.', 150, 'mara'),
  extra('extra-hoist', 'Wren, the hoist hand: kerchief, rope-burnt gloves.', 222, 'nell'),
  extra('extra-kid', 'Bea, a child carrying a board as a toy shield.', 146, 'nell'),
  extra('extra-merchant', 'Corvin, a travelling peddler: hood, a pack of clinking bottles.', 214, 'oren'),
  { id: 'portrait-mara', kind: 'portrait', file: 'portraits/mara.png', anchor: 'none', moods: ['neutral', 'worried', 'angry'], chapter: 'game', status: 'placeholder', generator: 'rig.mjs', subject: "Mara's head and shoulders." },
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
  equipment('patched-coat', 'A patched ceramic coat.'),
  equipment('plain-carrier', 'A plain carrier bag.'),
  equipment('light-armor', 'Light armour: spaced ceramic plates.'),
  equipment('quick-harness', 'A quick-release harness.'),
  // Worn always, shown on the gear screen's paper doll (drawn in code until delivered).
  { ...equipment('work-trousers', "Mara's work trousers: heavy dark cloth with ceramic knee plates, patched at both knees."), status: 'requested', generator: 'src/kc/Armory.tsx (drawn in code)' },
  { ...equipment('courier-boots', "Mara's courier boots: stitched brown leather, resoled more than once, brass buckles."), status: 'requested', generator: 'src/kc/Armory.tsx (drawn in code)' },
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
