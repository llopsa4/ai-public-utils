# Survival art bible

The look of every image in Survival, in words. Every art session (Codex) reads this file before
making anything; a delivery that breaks it is rejected. Numbers (cells, anchors, frames, camera)
are in [SPEC.md](SPEC.md); the procedure is in [PIPELINE.md](PIPELINE.md); the work list is
[BATCHES.md](BATCHES.md); the decisions behind it are in [DESIGN-art.md](../DESIGN-art.md).

## Rule 1: Codex draws, Claude never does

Codex makes all art (images, Blender files, textures, renders, atlases) and installs it. Claude
writes text and code only and never draws, generates, edits or installs art; it adds no new
placeholder drawings (new keys use grey stand-ins). Details: [DESIGN-art.md](../DESIGN-art.md)
*Who draws*.

## 1. The look

- **Hand-painted, semi-realistic, HD isometric**, in the manner of the best classic 2D castle
  city-builders: believable proportions (not chibi, not cartoon), soft painterly shading, rich
  material texture (grain in wood, nap in hide, strands in grass), and silhouettes that read at
  a glance from far away. Never name a commercial game in a prompt; use this wording.
- **The eastern Dakota homeland:** tallgrass prairie, lakes and woodland in a river valley, seen
  in a warm afternoon light. Rich prairie greens with golden seedheads and touches of bronze-red
  grass stems dominate; dark loam soil, oak woodland greens, blue-green water. The warmth of the
  light (not a desert palette) is what carries over from the quality reference.
- **Calm and grounded:** the tone is serious with warmth. Nothing glossy, neon, plastic or
  fantasy-saturated, except the spirits (section 9).
- **No text, no letters, no numbers, no logos** in any image. **No pure black.** No outlines:
  edges are a local darker shade of the same colour, at most 2 px at the delivered 2× size.

## 2. Light and shadow

- One sun for the whole game: from the **screen's upper left**, high (60° elevation), slightly
  warm (#FFF1D6). Shadows fall to the **screen's lower right**.
- Shadows are **baked** into the base layer: a soft-edged contact shadow plus the cast shadow,
  colour #1C1A24 at 40% opacity, never darker. A cast shadow stays inside the cell.
- Fill light from the opposite side is a cool dusk blue (#3A4660) at low strength, so shadowed
  sides are blue-grey, never black.
- Interiors (doorways, the open store) are warm dark brown (#3B2A1E), not black.

## 3. Palette

Summer values unless noted. Codex samples its renders against these; a dominant colour more than
about 15% off its family is a reason to re-render.

| Material | Light | Mid | Dark |
|---|---|---|---|
| Tallgrass (summer) | #C2C77E | #8F9B4E | #56622E |
| Grass seedheads, bluestem stems | #D9B86A | #B08A48 | #9A5A3C |
| Spring grass | #A9C46A | #7FA048 | #4E6A2C |
| Autumn grass (copper, russet) | #D8A060 | #B06A3A | #6E3E26 |
| Prairie soil, paths | #9C7A58 | #7A5E44 | #4A3828 |
| Wildflowers (small accents) | #E8E2F0 white | #B07AB8 purple | #E0B040 yellow |
| Snow | #F4F6F8 | #E8ECEF | #A9B7C6 (shadow) |
| Water (river, lake) | #6F9CAA | #4F8094 | #2C5664 (deep) |
| Ford shallows | #9DBDB2 | #7FA59C | #5E8478 |
| Foam, ice edge | #EEF3EE | #D6E2D8 | #AFC4C4 |
| Oak and basswood leaf | #8EA850 | #66803A | #3E5226 |
| Oak leaf, autumn | #C8743A | #A0522A | #6A3420 |
| Cottonwood, basswood leaf, autumn | #F0C85A | #D8A637 | #A0741E |
| Cottonwood and willow leaf | #A4B25E | #7E8E3E | #55602A |
| Bark, trunks | #9A8A76 | #6E6254 | #463E36 |
| Tanned hide | #E8D3A8 | #D9BC8C | #A97F52 |
| Dark hide, fur | #A97F52 | #6B4A2E | #3E2A1A |
| Wood (poles, frames) | #B0A28E | #8C8070 | #4E463C |
| Stone | #B8B0A2 | #8F877A | #5E584F |
| Skin | #C08A5E | #A8704A | #7A4E32 |
| Hair | #3A322E | #1E1A18 | #121010 |
| Elder hair | #D8D4CC | #B8B4AC | #8A867E |
| Fire | #FBE08A | #F6A53A | #E8601C |
| Spirit (60% opacity, glow) | #E6F6FC | #BFE3F2 | #7FB2CC |
| Cloth layer greys (tinted by the game) | #E6E6E6 | #A8A8A8 | #6E6E6E |
| Bead bands (plain, 1-2 px stripes) | #F2F0EA white | #3F6FA8 blue | #B5442E rust |

- **Family colours** are not painted: the `cloth` layer is painted in the greys above and the game
  multiplies it by the family colour (`src/data/map.json` `start.familyColors`: Cottonwood
  #e0905a, Kingfisher #7fa8d8).
- **Seasons** shift only ground, plants and building snow (section 7).

## 4. Proportions and scale

- 1 tile = 2.0 m. A man is 1.72 m (≈ 67 px tall at 2×), a woman 1.62 m (≈ 63 px), elders stooped
  (≈ 58 px), the child 1.15 m (≈ 45 px). Heads are about 1/7.5 of adult height (realistic).
- Animals at true scale: wolf 0.8 m at the shoulder, 1.5 m long; deer 1.0 m shoulder, 1.9 m long;
  bison 1.8 m shoulder, 3.0 m long; horse 1.45 m shoulder, 2.4 m long (a small sturdy horse).
- Buildings fill their footprint diamonds (1×1 = 2 m, 2×2 = 4 m, 4×4 = 8 m square on the ground).
- Readability beats realism: tools, bundles and weapons may be up to 20% oversize so they read at
  the 1× display size (a person is about 32 px tall on a normal screen).

## 5. People

All people are invented, everyday camp members. Clothing is **plain and generic**: tanned hide and
dyed cloth, natural colours, plain bead bands only. The details below are drawn as generic until
[CULTURE.md](../CULTURE.md) *Needs review* has sources.

### Shared rules
- One model per type; every person of that type uses it. Only the family tint of the `cloth`
  layer differs.
- `base` layer = the whole figure including the cloth area painted in neutral grey; `cloth`
  layer = only the shirt (man) or dress (woman) pixels, greyscale with full shading, exactly
  aligned. Hands, hair, belts and bundles that cross in front of the cloth are cut out of the
  `cloth` layer.
- Faces: calm, neutral, simple; no exaggerated features. Skin #A8704A family.
- Hair: black, long. No feathers in the hair (none at all, of any kind).

### Man
- Long hair in two plain braids over the shoulders, a thin plain hide headband.
- **Shirt (cloth layer):** a simple long-sleeved, thigh-length dyed hide shirt, plain, a single
  thin bead band across the shoulders in white/blue/rust.
- Natural hide leggings (#A97F52), moccasins (#6B4A2E), a plain hide belt with a small pouch.

### Woman
- Long hair in two plain braids, centre part.
- **Dress (cloth layer):** a plain mid-calf dyed hide dress with short cape-like sleeves and a
  thin bead band at the yoke.
- Natural hide leggings below the dress, moccasins, a plain belt with a small knife sheath.

### Elder man and elder woman
- The same clothing as the man and the woman, a little looser; grey hair (#B8B4AC) in braids.
- Stooped posture (upper back curved, head forward), shorter stride, slower movement; the elder
  man may carry a plain walking stick in idle and walk only.

### Child
- One model for both sexes, about 1.15 m; short plain hide tunic (cloth layer), bare legs,
  moccasins, hair in one braid. Livelier, bouncier movement.

### Tools (plain, hafted, oversize by up to 20%)
Stone-headed axe (chop), stone maul (build), flat hide scraper (scrape), plain self bow and a
quiver at the hip (shoot), long plain lance (thrust; adults and riders), short wooden club
(strike), slim fishing spear (fish), a woven basket (gather), a hide-wrapped bundle on a tumpline
(carry_walk). No decoration on tools beyond a plain wrap.

### Pose notes per animation
Every looping animation's last frame flows into its first. Feet are planted (no sliding) in idle,
work and fish loops. Frame order is listed in SPEC.md.

| Anim | Pose |
|---|---|
| idle | relaxed stand, slight breath, one glance aside over 4 frames |
| walk | natural walking cycle, arms swing, contact-pass-contact over 8 frames |
| carry_walk | slightly bent forward, bundle on the back held by a strap across the forehead or chest, shorter swing |
| chop | two-handed overhead axe swing at a trunk off to the facing side, impact on frame 4 |
| build | two-handed maul driving a stake/pole, impact on frame 4 |
| gather | bend at the waist, reach to a low bush, drop into the basket at the hip |
| scrape | kneel, both hands push the scraper along a hide on the ground or a frame |
| shoot | draw from the quiver, nock, full draw on frame 4, release on frame 5 |
| thrust | lance held two-handed at the hip, lunge forward, full extension on frame 4 |
| strike | club overhand strike, impact on frame 4 |
| tend | kneel, hands working at the ground level in front (a patient is drawn by the game, not here) |
| fish | stand ankle-deep, spear raised, strike down on frame 4, lift on 5-6; water splash painted in frames 4-5 only within the cell |
| dance | a plain social step in place: weight shifts foot to foot, small knee bend, arms low and relaxed; no regalia, no props, no ceremony |
| sit | seated cross-legged on the ground, small sway between the 2 frames |
| die | stagger, knees fold, fall to the side, lie still on frame 6 (held); no blood, no wound |

## 6. Animals and riders

- **Wolf:** lean grey wolf (#8F877A body, lighter belly, darker saddle). One model; the
  game makes the pack leader (1.4× scale, tinted darker) and the guardian (pale tint, spirit glow
  added by the game). Attack: a lunge and snap, frames 3-4 at full reach.
- **Deer:** a slender brown deer (#A97F52 with a pale belly and tail), small antlers. Run is
  bounding.
- **Bison:** massive dark brown (#4A3322 to #6B4A2E) shaggy front, high hump, short horns, lighter
  woolly shoulders. Graze: head low, slow chew. Run: heavy gallop.
- **Horse:** a small sturdy horse, coat in two plain tones (bay body #7A4E32, darker mane),
  no paint, no tack except a plain single rope bridle.
- **Mounted rider:** the man model seated bareback on the horse model, the same family-tinted
  shirt (cloth layer), a plain lance. Thrust: lance lowered forward from the gallop pose. Die: the
  rider slips off and lies beside the horse, which has run out of frame (only the rider is left in
  the last frames).
- **Carcasses:** the dead animal lying on its side; stage 1 whole, stage 2 half (the hide partly
  opened and some meat gone, drawn as a neat butchering, no gore), stage 3 a few bones only.
- **Fish:** a plain silver-brown river fish leaping from a small splash ring.
- No animal has a face that looks human, cute or angry; they look like real animals.

## 7. Land, plants and seasons

- **Grass (tallgrass prairie):** dense tall grasses (big bluestem, switchgrass, Indian grass in
  look) seen from above as a thick textured carpet, with golden seedheads, bronze-red stems and a
  scatter of small wildflowers (white, purple, yellow); no bare earth except paths. Variants
  differ by flower and seedhead placement only.
- **Forest floor (woodland):** dark loam with oak leaf litter, ferns and roots under the canopy
  (the trees stand on it as sprites).
- **Berry ground:** a woodland-edge thicket of low shrubs bearing small dark red berries (#8E2A30)
  among the tall grass.
- **River (and lakes):** calm blue-green water, gentle current lines, darker in the middle of the diamond
  shape of the river; every water tile's outer 4 px edge band is the shared water mid colour so
  river and ford tiles meet without a seam.
- **Ford:** shallow water over pale stones and gravel.
- **Banks:** a muddy band (#8A6644) and small reeds where land meets water, then grass.
- **Spills:** soft, feathered edge patches of forest litter or berry shrubs reaching about a third
  into the neighbouring grass tile.
- **Trees:** woodland trees on forest tiles: bur oak (broad, rugged, dark furrowed bark, lobed
  leaves) and basswood (tall, rounded, smooth grey bark, big heart-shaped leaves); trees by the
  water: cottonwood (tall, broad, rough grey bark, glossy leaves) and willow (smaller, drooping).
  Two variants each. **Bushes:** chokecherry and wild plum thickets. **Rocks:** grey glacial
  boulders half sunk in the grass. **Tufts:** tall bluestem clumps with seedheads, waist to
  shoulder high. **Stump:** a tree stump with fresh pale wood and a few chips.
- **Seasons:**

  | Season | Ground and plants |
  |---|---|
  | spring | short fresh green grass, new pale leaves, early flowers |
  | summer | the base look: tall green grass with golden seedheads and bronze-red stems, full green woodland |
  | autumn | copper and russet grass, oaks rust-red, cottonwood and basswood yellow, willows half bare |
  | winter | snow cover with tall grass tips showing, bare trees (oaks keep a few brown leaves) with snow on branches, ice along the water edges, water darker |

## 8. Buildings

Built in Blender from simple shapes with hand-painted textures (wood grain, hide nap, stitched
seams, rope lashings). All materials are natural: poles, tanned hide covers, woven mats, rope,
stone. Generic and invented, no real-culture detail beyond the plain shapes described here; no
painted symbols on covers. Each building has 3 construction stages, the finished building and a
winter render; the stages are:
1. **Stage 1:** the footprint cleared to bare earth, stakes and a few poles lying on the ground.
2. **Stage 2:** the bare frame or poles standing, lashings visible.
3. **Stage 3:** half covered, a bundle of covers or mats at the side.

| Id | Footprint | The finished building |
|---|---|---|
| `fire` (fire plaza) | 4×4 | beaten-earth circle, a ring of 12 stones round a hearth (flames from `fx_flame`), 4 hide mats, 2 log seats, drying poles with meat strips, a plain hand drum on a mat, a few baskets; no stages |
| `tipi` | 2×2 | a cone of tanned hide on about 14 poles, pole tips crossing above, door flap open on the facing side, smoke flaps, a plain unpainted cover with a darker weathered base |
| `store` | 4×4 | a long low storehouse: a pole frame covered in hide and bark slabs, two doorways, stacked bundles and baskets under the eaves |
| `store` open (`building_store_open`) | 4×4 | the same store with its roof removed and low front walls, an empty floor seen from above (the game places items) |
| `gathering_spot` | 2×2 | a large woven mat under a light pole shade with baskets, gathering bags and a sorting heap |
| `hunting_lodge` | 2×2 | a hide-covered lodge with a meat-and-hide rack beside it, bows leaning against a pole |
| `drying_rack` | 2×2 | two A-frame pole racks with strips of meat hanging; 4-frame loop of the strips swaying |
| `horse_corral` | 2×2 | a round rail fence of lashed poles with a gap gate and a water trough; empty (horses are separate sprites) |
| `healers_lodge` | 2×2 | a domed lodge of bent poles covered in hide and woven mats, bundles of dried plants hanging at the door (plain, generic herbs) |
| `scouts_lodge` | 2×2 | a hide lodge with a tall plain lookout pole and a small plain cloth pennant |
| `lancers_lodge` | 2×2 | a hide lodge with a rack of 3 plain lances |
| `archers_lodge` | 2×2 | a hide lodge with a straw-bundle target on a frame and a bow rack |
| `spirit_lodge` | 2×2 | an invented lodge of pale bleached hide with a faint cool glow at the door (no symbols, no real sacred structure) |
| `trap` (wihmuƞke) | 1×1 | a plain pit trap: a square of crossed sticks and grass over a hole, two marker stakes |
| `fire_pit` | 1×1 | a small stone ring with charred logs (flames from `fx_flame` at half size) |
| `barricade` | 1×1 piece | a row of sharpened stakes angled outward, lashed to a ground pole; 16 pieces join with their neighbours (SPEC.md) |

- **Winter:** the finished building with snow on every upward surface, snow banked at the base,
  frost on the hide; the same shape and alignment as the summer render.

## 9. Effects and spirits

- Spirits and allies are **invented**: luminous, translucent pale-blue (spirit palette) forms of
  a person or a wolf, soft edges, a gentle inner glow, no face detail, **no symbols, no regalia,
  no real sacred objects**.
- **Storm:** a swirling disc of grey-blue wind and rain streaks seen from the isometric angle,
  8-frame loop.
- **Arrow:** a plain wooden arrow with grey fletching, drawn pointing right; the stuck arrow
  stands at an angle in the ground.
- **Dust puffs:** small tan dust clouds (hit: a burst; foot: a low puff). No blood anywhere.
- **Sparkle:** a few warm gold glints rising (build done).
- **Flame:** a hand-painted fire loop (yellow core, orange body, red tips), 8 frames, no smoke.

## 10. Interface

- **Material:** tanned hide stretched in a frame of plain lashed poles (panels), with stitched
  edges; buttons are smaller hide patches in a thin pole frame.
- **Button states:** normal (hide in daylight), hover (warmer and slightly lighter, a soft gold
  rim), pressed (darker, inset by 2 px), disabled (desaturated, 60% opacity look).
- **Bars:** a thin carved-wood frame; the fill is a plain light strip the game tints.
- **Icons:** 64×64, painted objects in the same light as the world, slight drop shadow inside the
  icon, no frame (the game frames them). Silhouettes must read at 16×16.
- **Cursors:** a plain bone-tan arrow pointer; move (a footprint), attack (crossed lances), build
  (a maul), invalid (a crossed-out circle in muted red), all with a dark rim for contrast.
- **Title picture:** the camp at dusk on the tallgrass prairie beside a lake: tipis glowing from
  within around a central fire, oak woodland and cottonwoods along the shore, the lake reflecting a
  wide sky going from warm orange to deep blue, low wooded river bluffs on the horizon; no people
  in close-up, no text, space at the top centre for the title.
- **Emblem:** a small round painted badge: a tipi and a fire under a crescent of sky, in hide and
  firelight colours; no text.
- **Font** (not art; bundled by Claude's code): Alegreya (OFL).

## 11. Never draw

- Headdresses, eagle feathers or any feathers worn, war bonnets, regalia, ceremonial dress or
  objects, sacred pipes, medicine bundles named as such, painted symbols or real bead patterns.
- Caricature, exaggerated features, stereotypes, mock war paint, blood, gore, wounds, scalps,
  trophies, real people or real named places.
- Text, letters, numbers, logos, borders around sprites, pure black, saturated neon colours.
- Anything copied or traced from a commercial game or an asset store.

## 12. Prompt templates (image generation)

Codex fills the `<...>` parts from this bible and BATCHES.md; the fixed wording stays the same in
every session.

**Style line** (starts every prompt):
```text
Hand-painted semi-realistic HD isometric game art, like the best classic 2D castle city-builders:
soft painterly shading, rich natural material texture, warm late-summer light from the upper left,
soft shadow to the lower right, tallgrass prairie, lake and oak woodland palette, no outlines,
no text.
```

**Concept sheet** (a model before Blender):
```text
<style line>
Character/model sheet of <subject from section 5 or 6>, front, side and back views, neutral
standing pose, plain flat light grey background, full body, the same scale in every view.
Clothing exactly: <garments>. Plain bead bands only. No feathers, no regalia, no text, no labels.
```

**Texture** (for a Blender material):
```text
<style line>
Seamless square hand-painted texture of <material: tanned hide / pole wood / woven mat / fur>,
flat even light, no shadows, no perspective, fills the whole square, tiles on every side.
```

**Ground texture** (skewed into a diamond by the tile script):
```text
<style line>
Seamless square top-down hand-painted ground texture of <grass type and season from section 7>,
flat even light, no perspective, no large objects, tiles on every side, 1024x1024.
```

**Plant or rock** (still sprite):
```text
<style line>
A single <bur oak / basswood / cottonwood / willow / chokecherry thicket / wild plum thicket /
glacial boulder / tall bluestem clump> in
<season>, seen from a 30-degree isometric angle, standing on the ground, soft shadow to the lower
right, fully inside the frame with an empty margin, plain flat #00FF00 background, no green fringe.
```

**Icon:**
```text
<style line>
Game icon of <object>, a single painted object, three-quarter view, centred, fills about 80% of
the square, plain flat #00FF00 background, readable at 16 pixels, no frame, no text.
```

**Panel / button:**
```text
<style line>
A game interface panel of tanned hide stretched in a frame of plain lashed wooden poles, stitched
edges, seen straight on, even light, plain flat #00FF00 background, no text, no symbols.
```

**Title picture:**
```text
<style line>
Wide landscape painting, 16:9: <the title picture from section 10>. Calm, warm, inviting. No text,
no logo, no people in close-up.
```

Green (#00FF00) backgrounds are keyed out by Codex; a subject that contains strong green (spring
plants) uses flat #FF00FF magenta instead.
