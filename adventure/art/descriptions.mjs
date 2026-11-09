// The visual descriptions Codex paints from, one per picture (art/manifest.mjs takes them as each
// entry's subject; scripts/art-briefs.ts adds what the game needs of each picture: its layout,
// sizes, states and delivery). Everything is pixel art in the style of tent-reference.png, seen
// flat-on (2D, no perspective), in true proportion to Mara (see art/style/scale.png).
//
// THE CAST: every person looks clearly different from every other (build, height, age, skin,
// hair, clothes, colours, one signature thing), so they read apart even at 58 pixels tall.

export const CAST = {
  mara: "Mara, the courier (he/him), about 22: the tallest of the cast but lean and long-limbed, a runner's build. Warm brown skin, short dark-brown hair swept back and a little unruly, a light stubble, hazel eyes, a determined, slightly tired face. An ochre wool scarf wrapped twice round his neck, its long end thrown over his left shoulder like a short cloak. Cream-white fired-ceramic armour plates (chest, shoulders, forearms, shins), chipped and patched, laced over dark brown leather. A worn leather satchel on his left hip. Dark work trousers with ceramic knee plates, patched at the knees; brown leather courier boots with brass buckles. His mother's pressure gauntlet on his right forearm and hand, oversized: a clenched fist of massive cream-ceramic knuckles, thick riveted brass reinforcements, a broad cuff and a pressure pipe along the forearm, the fist reaching down towards his knee; a round ember-cell housing on the back of the hand (unlit: dull dark red glass). Keep to Codex's pilot design (art/inbox/reference/gauntlet-closed-v2/mara-master.png).",
  maraLit: "The same Mara (identical drawing), with the gauntlet's ember cell lit: the glass on the back of the hand glowing orange, the seams of the gauntlet faintly warm.",
  maraCasual: "Mara off duty: the same face, hair, skin and build as Mara (identical proportions and height), but no armour, no gauntlet and no satchel. A plain undyed linen shirt with the sleeves rolled to the elbow, a faded rust-red knitted waistcoat, the ochre scarf hanging loose around his neck, dark work trousers (no knee plates), soft brown boots. Both hands bare; a thin leather cord bracelet on the right wrist where the gauntlet usually sits.",
  oren: "Oren, the old regulator keeper, about 68: tall (nearly Mara's height) but a little stooped, thin. Pale weathered skin with ruddy cheeks, white hair tied back in a short tail, a neat white beard, round brass spectacles on his nose, bushy white brows. An iron-grey waistcoat over a collarless off-white shirt, sleeve garters, a long brown leather apron with tools in its pockets, a brass pressure gauge on a chain at his belt and a small brass gauge held in his left hand. Grey trousers, black boots.",
  nell: "Nell, the neighbour who runs the firing house kitchen, in her forties: medium height, sturdy and soft-built. Olive skin, freckles, curly auburn hair pinned up under a wrapped teal headscarf. A mustard-yellow dress with the sleeves rolled up, a cream apron dusted with flour, a wooden ladle tucked through the apron string, wooden clogs.",
  bryn: "Bryn, the gauntlet smith of the tempering house, in her thirties: nearly as tall as Mara and much broader, heavily muscled shoulders and forearms from hauling crucibles. Deep brown skin, black hair in thick braids tied back under a dark red kerchief, a scar through her left eyebrow, a quick wide grin. A sleeveless dark-red work shirt, a thick singed leather apron, leather wraps on both forearms, heavy gloves tucked in her belt and a pair of long tongs hanging from it. Canvas trousers, scuffed steel-toed boots.",
  silas: "Silas, the con man (he/him), about 30: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes, a thin mobile mouth, short black hair in disorder after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw.",
  silasHarrow: "Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of grey plaster-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture.",
  silasClerk: "Silas as the tally clerk: the same body, a drab grey clerk's hood pulled up and forward over his head, shoulders hunched, a thick ledger held against his chest; the face down and in shadow.",
  guardCell: "Benn, the night guard of Ironhaven's cells (he/him), about 19: medium height, gangly. Pale skin red at the nose and ears from the cold, mousy hair under an iron-grey wool cap, a too-big grey wool greatcoat with Ironhaven's iron-and-snowflake badge, a key ring at his belt, fingerless gloves.",
  guardStairs: "Kell, the guardroom guard of Ironhaven's prison (he/him), about 40: tall and broad, a heavy belly. Weathered tan skin, a shaved head, a short brown beard, small sharp eyes. A grey quilted gambeson with Ironhaven's badge, a leather belt with a short club, thick boots.",
  sigrid: "Captain Sigrid of Ironhaven (she/her), about 35: tall, straight-backed, composed. Fair skin reddened by the cold, pale blonde hair in a tight braid coiled at the nape, grey watchful eyes, a thin scar along her jaw. A long dark-blue officer's greatcoat with brass buttons and a fur collar dusted with snow, black gloves, a sabre at her hip, tall black boots.",
  hollis: "Hollis, the stoker, about 55: shorter than Mara, broad and barrel-chested. Ruddy pale skin smudged with soot, bald with grey mutton-chop sideburns. A flat grey cloth cap, a sleeveless brown vest over a soot-grey undershirt, bare thick forearms, heavy canvas trousers, big boots. Carries a long coal shovel.",
  ansel: "Ansel, the old tally keeper, about 75: short, thin and stooped. Very dark skin, close-cropped white curls, a lined kind face. A hooded charcoal-grey wool cloak over a long dun robe, chalk dust on his fingers; he holds a long slate board and a stub of chalk.",
  dace: "Dace, the clay hauler (she/her), about 30: tall and rangy, wide shoulders. Light tan skin, shaved head, a moss-green kerchief tied at her neck. A sleeveless clay-stained tunic over grey leggings, wrapped shins, sandals with straps; a heavy clay sack carried on one shoulder.",
  wren: "Wren, the hoist hand (he/him), about 26: wiry and quick, medium height. Pale freckled skin, a black bob of hair under a faded blue kerchief. A sleeveless harness of leather straps over a rust-orange shirt, rope-burnt leather gloves, a coil of rope at his hip, short boots.",
  pip: "Pip, a child errand-runner, about 10: small and skinny (about 63% of an adult's height). Light-brown skin, a big grin with a missing tooth, a flat cap much too large for him. A scruffy patched blue jacket, knee-length shorts, mismatched socks (one striped), a small message satchel across his chest.",
  bea: "Bea, a little girl of about 8 (a little shorter than Pip): round face, dark skin, her hair in two puffy buns. An oversized cream knitted cardigan over a red smock, bare knees, sandals. She carries a wooden board as a toy shield, painted with a kiln sun.",
  corvin: "Corvin, the travelling peddler, about 50: lanky, of middling height, stooping a little under his load. Olive skin, a long black beard streaked with grey. A deep plum-brown hooded coat with many patch pockets, a wooden backpack frame hung with small corked bottles of ember-orange Kiln Tonic that clink, fingerless gloves.",
};

/** Ten tiers for each piece of gear: the same piece, more powerful and better made at each step. */
export const GEAR_TIERS = [
  'Tier 1, the humble original: worn, patched, mismatched parts, dull metal and chipped ceramic.',
  'Tier 2, repaired properly: cracks filled, straps replaced, the same shapes made sound.',
  'Tier 3, reinforced: an extra riveted plate or two, sturdier fittings, cleaned brass.',
  'Tier 4, well made: matched fired-ceramic plates in cream glaze, brass edging, neat stitching.',
  'Tier 5, a craftsman\'s piece: engraved brass trim, thicker better-shaped plates, a tidy silhouette.',
  'Tier 6, tempered: dark blued-steel fittings, ceramic with a faint ember-orange crackle glaze.',
  'Tier 7, masterwork: smooth layered plates, gold-brass inlay lines, a small ember glow in its seams.',
  'Tier 8, kiln-forged: heat-coloured steel, carved kiln-sun motifs, ember light along the edges.',
  'Tier 9, heirloom grand: ornate but practical, polished brass and ivory ceramic, a steady ember core glowing.',
  'Tier 10, legendary: the finest version of it, radiant ember-orange core and channels, flawless plates, a faint heat shimmer drawn as pixel highlights.',
];

export const GEAR = {
  'courier-gauntlet': "His mother's Courier Gauntlet: an oversized pressure gauntlet for the right forearm and hand, a clenched fist of massive cream-ceramic knuckles, thick brass reinforcements, a broad cuff, a pressure pipe along the forearm, a round ember-cell housing on the back of the hand.",
  'patched-coat': 'A patched ceramic coat: a long coat of oiled canvas with small ceramic scales sewn over the chest and shoulders.',
  'plain-carrier': 'A plain carrier: a courier\'s leather satchel and strap with a brass clasp.',
  'light-armor': 'Light armour: a chest and shoulder harness of spaced cream ceramic plates on leather.',
  'quick-harness': 'A quick-release harness: crossed leather straps with brass quick-release buckles and tool loops.',
  'work-trousers': "Mara's work trousers: heavy dark cloth with ceramic knee plates, patched at both knees.",
  'courier-boots': "Mara's courier boots: stitched brown leather, resoled more than once, brass buckles.",
};

export const DESCRIPTIONS = {
  // ------------------------------------------------------------------------------ rooms ---
  'room-tent': "Mara's tent from inside (the reference picture, already in the game).",
  'room-mara': "The kiln hall, the heart of Cinderfold: a vast hall built inside an old brick kiln, seen flat-on. The back wall is the kiln's curved inner brickwork, soot-blackened above and warm-coloured below, rising into a vault that fades to darkness at the top. Across the middle of the back wall, a row of three great arched kiln mouths with heavy iron doors standing open, coals visible inside (the clickable 'niche'). Far left: a section of plastered wall covered in rows of tally scratches and chalk marks. Left: a pulley hoist hanging from a beam in the vault, chains and a big clay pot (the hoist itself is drawn separately as a prop; paint only the beam it hangs from). Left of centre on the floor: a cluster of tall storage jars, and Mara's canvas tent pitched on the stone floor (the tent is drawn separately as an object; leave that floor spot plain). Right: an iron ash cart on small wheels with a shovel in it. Right edge: a heavy patched curtain hung in a brick archway, the way to the firing house. Stone flags on the floor, scattered clinker and ash; in the front corners of the floor a little rubble and broken pots (they are cut out to walk behind).",
  'room-firing-house': "The firing house: a communal kitchen and workshop on a lower level of the kiln, seen flat-on. Left edge: an archway back to the kiln hall. High on the left wall: a long wooden rack of shoes and boots hung by their laces, dozens of pairs. Left: a big stone hearth with a fire and an iron soup pot hanging over it. A plastered stretch of wall with children's chalk drawings. High up: a small iron sign on a bracket. In the back wall at the centre: Nell's pantry door (drawn separately as an object; leave a plain wall there). Right of centre: a wooden staircase climbing along the back wall up and to the right to a landing that leads to the regulator gallery (the stairs rise from the floor line to near the top). Right edge: the iron kiln gate in a brick arch, the way out to the ashways. Long benches and a scrubbed table along the back, crocks and baskets, warm and busy.",
  'room-gallery': "The regulator gallery, high in the kiln, seen flat-on: an iron-plated walkway along great ceramic pipes. Left wall: an iron hook with a lantern hanging on it. Left: Oren's small writing desk with an open logbook and an inkpot. Centre-left: the regulator housing, a tall ceramic and iron machine where the great pipes meet, with a round ring socket in its middle (the ring itself is an object drawn separately: leave its round recess empty) and a large pressure gauge dial on top (the gauge face is a separate prop). Behind the walkway: an iron railing with names scratched into its top bar, and below it a glimpse of the drop into the dark kiln. Right edge: iron stairs going down to the firing house. Riveted iron floor plates, slightly wet.",
  'room-ashways': "The ashways, outside the kiln, seen flat-on: an open stone causeway under great overhead pipes at dusk, grey ash everywhere. Left edge: the arched way back into the kiln. Top left: a tangle of great pipes overhead. Left: a pressure valve on a standpipe (drawn separately as an object; leave its spot plain). In the background: an old stone bridge spanning the view on arches, and under its right end the dark passage out of Cinderfold country (right side, the way on). Drifts of ash, a few cracked flagstones, distant chimneys in the haze. The ash sweeper machine is drawn separately.",
  'room-tunnel-mouth': "The mouth of the service tunnels at dawn, seen flat-on: left, the ash road running back towards Cinderfold under a pale pink-gold dawn sky; low ash dunes; centre, an old iron pipe lying half sunk along the ground, the right height to sit on; right, a brick arch (the entrance to service line 4) set in a low embankment, dark inside, with an iron name plate above it and a small oil lamp on a bracket beside it.",
  'room-tunnel-collapse': "A collapsed service tunnel, seen flat-on: a brick vault with pipes running along the ceiling, one failing lamp hanging in the middle. Left: the roof has fallen, a slope of broken bricks and rubble filling the way back. The floor is wet stone with puddles. Right edge: the tunnel's end opening, where a rusted grate stands (drawn separately as an object; paint the dark opening behind it).",
  'room-tunnel-steam': "A steam junction in the tunnels, seen flat-on: a brick wall with a long pipe along it wrapped in a copper band (right of centre), a copper line running from that pipe down to a copper valve wheel; an iron valve wheel beside it on its own iron pipe; a round pressure gauge above the two wheels; one failing lamp (left). Right edge: the passage on, a dark opening. Left edge: the way back. The jet of steam is drawn separately.",
  'room-tunnel-cistern': "An ash cistern in the tunnels, seen flat-on: near side (left) a stone floor; in the middle a dark square pit cutting across the floor, ash rising from it; far side (right) a stone ledge with grey daylight from the road beyond. Above the pit, a pulley wheel on a bracket; a counterweight chain running from it down to an iron cleat on the floor at the pit's near edge, lying against a hot steam pipe so its lower links glow dull red. The drawbridge and the nest basket are drawn separately. One lamp on the left wall. Left edge: the way back.",
  'room-road': "The road to Bryn's tempering house at dusk, seen flat-on: left, the ash road back towards Cinderfold with a leaning wooden signpost; great pipes and chimneys in the blue-grey haze behind; right, the stone front of the tempering house with a heavy wooden door (its frame scratched with marks), a brass bell on an iron bracket beside the door, a lit window with small panes, a chimney breathing steam, a lantern on the wall.",
  'room-workshop': "Bryn's workshop inside the tempering house, seen flat-on: across the top, a great ceramic return pipe with a glowing flange and a small brass reading valve on it (right of centre). Left edge: a curtain to the back room. Left: her long workbench with tongs, files, a glove and a small crucible on it, a stool in front. Centre: a training rig in an iron cage, a brush drum on a sprung frame. Right of centre: a crate of coal. Right: the open side of the house, looking out over a valley at dusk. Right edge: the door out to the road. Stone floor with soot.",
  'room-backroom': "Bryn's back room, seen flat-on: left edge, the curtain back to the workshop; left, a stone hearth with a pot on the fire; a shelf of supply crates, jars and rope; centre, a wooden table with a bowl and bread, and a large hand-drawn map pinned on the wall above it (a valley marked with a cross); right, a low cot under a heavy blanket; a courier's pouch on a peg by the far door; right edge, the far door to the road ahead. Warm, plain and tidy.",
  // ------------------------------------------------------------------------- walk-behind ---
  'hall-left': 'Rubble and broken pots in the front left corner of the kiln hall floor (cut from the room painting).',
  'hall-right': 'A few cracked jars and clinker in the front right corner of the kiln hall floor (cut from the room painting).',
  'tent-stool': 'The stool in the tent (cut from the tent painting).',
  // ------------------------------------------------------------------------------ props ---
  'prop-gauge-face': 'The gallery pressure gauge: a round brass-rimmed dial with a cream face, black numbers 0 to 10 and a red band near the top end, WITHOUT a needle (the game draws a live needle). Seen flat-on.',
  'prop-pulley': 'The kiln hall hoist: two iron chains hanging from a small pulley block, holding a big round clay pot with rope lashings, hung from its top edge (the game swings it gently).',
  // ---------------------------------------------------------------------------- objects ---
  rack: "The charging cradle on Mara's workbench: a small brass frame like a lantern without glass, on a square wooden base, that holds the gauntlet's ember cell. full: a round ember cell of dark glass in the frame, glowing orange; empty: the frame alone, its clips open.",
  notebook: "Mara's mother's notebook lying open on the workbench: a thick leather-bound book, yellowed pages full of handwriting and small diagrams, a red ribbon hanging over the bench edge.",
  'pantry-door': "Nell's pantry door, set in the firing house wall: a full-height plank door (taller than Mara) with iron strap hinges and an iron latch. stuck: the latch bent and jammed, a sliver of dark gap; fixed: the latch straight, the door shut properly.",
  socket: 'The regulator ring in its round socket in the regulator housing: installed: a thick ceramic-and-brass ring, cracked, faintly pulsing orange in its seams, filling the recess; removed: the empty round hollow, dark, with broken brackets.',
  sweeper: 'The ash sweeper, a squat old maintenance machine (chest-high to Mara): an iron body on short legs, two round brush drums at the front, a funnel chimney, one round glass eye. idle: standing, brushes still; scurry: leaning forward, brushes spinning (motion lines as pixels).',
  valve: 'The steam valve in the ashways: an iron standpipe rising from the ground with a big red-painted valve wheel on top and a pressure plate. closed: wheel tight; venting: wheel turned, a plume of steam bursting from the side vent.',
  tent: "Mara's tent seen from outside in the kiln hall: a patched ochre canvas tent on two poles with a ridge (about his height), guy ropes pegged into the stone, the door flap tied back on the dark inside, a lantern glow faint within.",
  grate: 'The rusted grate at the end of the collapsed tunnel: closed: iron bars rusted solid, rubble packed against the bottom; open: swung aside on one hinge, a nest of rags and fur visible behind it.',
  steam: 'The jet of steam across the steam junction: on: a thick white jet bursting from the pipe and billowing down to the floor; off: nothing at all (a fully transparent image).',
  bridge: 'The cistern drawbridge: a wooden plank bridge with iron bands, hinged on the far ledge. up: raised on its end against the far wall; down: lying flat across the pit.',
  rag: 'An oily rag in a small heap: thick dark cloth stained with oil.',
  basket: 'The counterweight basket under the pulley: a woven basket on a chain, a nest of rags and fur in it. hanging: as described; gone: nothing (fully transparent).',
  // ---------------------------------------------------------------------- items and icons ---
  'item-gauntlet': "Mara's oversized pressure gauntlet as a satchel icon: a clenched fist of cream-ceramic knuckles and brass, the round ember cell on the back of the hand.",
  'item-notebook': "His mother's notebook, closed: thick leather-bound, a red ribbon, a strap and buckle.",
  'item-regulator': 'The cracked regulator ring: a thick ceramic-and-brass ring with a crack, faint orange light in the crack.',
  'item-bread': 'A small round loaf from Nell, golden crust scored with a cross.',
  'item-scarf': "Tobi's orange knitted scarf, folded, with a fringe.",
  'item-tonic': 'A Kiln Tonic: a small stoppered glass flask of glowing ember-orange tonic, a cork and a brass collar.',
  'item-rag': 'A thick, oily rag, folded.',
  // ------------------------------------------------------------------------------ fights ---
  'battle-scavenger': 'The Hatch Scavenger: a squat pressure machine with ceramic claws and bucket arms and a glowing furnace belly, the size of a large dog standing (about half Mara\'s height), climbing out of a round hatch.',
  'battle-hero': "Mara ready to fight, full body, facing right: the same Mara as in the room (see the cast), the gauntlet raised, the ember cell lit.",
  'battle-enemy-scavenger': 'The Hatch Scavenger at fight-screen size, facing left: a squat pressure machine with ceramic claws, bucket arms and a glowing furnace belly.',
  'battle-backdrop-gallery': 'The regulator gallery as the fight backdrop: the same place as the room, seen flat-on, the floor clear in the lower third where the fighters stand.',
  'battle-backdrop-workshop': "Bryn's workshop as the sparring backdrop: the same place as the room, the floor clear in the lower third.",
  'battle-enemy-rig': "Bryn's training rig at fight-screen size, facing left: a caged brush drum on a sprung iron frame that swings back at whoever strikes it.",
};

/** Card pictures: what each card does, so the picture shows it. */
export const CARDS = {
  strike: ['Knuckle Drive', 'a quick attack (deal damage, a little strain)', 'a gauntleted fist driving forward in a burst of sparks.'],
  guard: ['Ceramic Guard', 'block an attack', 'a raised ceramic plate taking a blow, cracks of light around its edge.'],
  pulse: ['Kiln Pulse', 'a big hit and block powered by the ember cell (costs MP, more strain)', "the gauntlet's ember cell flaring, a ring of heat bursting from the fist."],
  vent: ['Open the Vents', 'release strain', 'steam blasting out of opened vents on the gauntlet.'],
  cycle: ['Pressure Cycle', 'draw cards', 'a valve wheel spinning, gauge needles ticking.'],
  piston: ['Piston Strike', 'a heavy attack (more strain)', 'a piston-driven punch with a shockwave ring.'],
  shield: ['Heat Shield', 'a strong block', 'a glowing shield of hot ceramic held up.'],
  'draw-back': ['Draw pile', 'the back of the cards in the draw pile', 'a brass kiln emblem on dark leather, a decorative border.'],
  'discard-back': ['Discard pile', 'the back of the cards in the discard pile', 'the same card back, ashen and cooled, grey and cracked.'],
};

/** Where each room's light comes from (the game paints the light itself; these say what to show). */
export const LIGHTS = {
  'room-mara': 'the three kiln mouths across the back wall (centre), coals glowing inside; the vault dark above.',
  'room-firing-house': "the hearth fire (left); the kiln gate's glow through its bars (right edge); the stair well dimmer.",
  'room-gallery': "the lantern on the left wall and the regulator ring's faint glow (centre left); the right side darker.",
  'room-ashways': 'dusk daylight through the bridge arches; no fire.',
  'room-tunnel-mouth': 'soft dawn light from the left; the small lamp by the arch (right).',
  'room-tunnel-collapse': 'one failing lamp (centre top); Mara carries the warm glow of his gauntlet.',
  'room-tunnel-steam': 'one failing lamp (left top); the steam pale.',
  'room-tunnel-cistern': 'one lamp on the left wall; pale daylight on the far ledge (right).',
  'room-road': 'the lit window and the lantern by the door (right); blue-grey dusk from the sky (left).',
  'room-workshop': 'daylight from the open side (right); the pipe flange glowing orange.',
  'room-backroom': 'the hearth (left) and a lamp over the table.',
};
