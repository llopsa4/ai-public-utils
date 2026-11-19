# Room: Riverbank / Amaneti

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

A broad bank seen as a readable stage: water and reeds at the left rear, a small upper seep over stone farther inland, an ochre clay face near the middle, and dry building ground to the right. The washing point is downstream from the collection point. Small shade trees border the top of frame; the very tall tree and tree huts belong to the woodland clearing, not here. Keep a long, level walking lane along the front. Houses and gardens grow behind that lane, leaving all water stations accessible.

## What the game does with it

- **arrival** — Communal bundles, water kit and cook fire; no houses, gardens or rite.
- **water-a** — Enali survives: trough missing feet, scraps exposed after inspection, shim fitted, screen added.
- **water-b** — Deyu survives: housing supplied complete; tracks and leaves lead to checked seep. No loose assembly scraps.
- **building** — Water system converged; sledge, clay, mature reeds and hut frame active. Clearing exit unlocked.
- **rite** — Ground shelter finished; gardens only marked out; offering circle and separate offerings appear.
- **months** — Several ground houses, planted gardens, tool rack and watering gap. No tree huts or watch board here.
- **afternoon** — All agreements retained; travel kit collected; forest access via clearing. Meal bowl appears only after hunt.

Source: [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07)

## Fixed background

Distant river channel, far bank, noninteractive shade trees, bare dry ground and plain stone backing for the seep. Interactive water surfaces, reeds, clay cut, footprints, leaves and all settlement objects are separate overlays.

## Interactive targets — puzzle order

- **Muddy river intake** (muddy-intake): Look, rejected direct fill/drink. Bounds (55,464), 170×84 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Muddy river intake](../objects/muddy-intake.md).
- **Upper seep over stone** (upper-seep): Look, fill only after checked source. Bounds (285,380), 170×110 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Upper seep over stone](../objects/upper-seep.md).
- **Salvaged trough and foot stand** (trough): Look, Take, Use strips, Install at seep. Bounds (730,440), 150×100 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Salvaged trough and foot stand](../objects/trough.md).
- **Crossed foot strips** (wood-strips): Take, Use on trough. Bounds (817,497), 96×28 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Crossed foot strips](../objects/wood-strips.md).
- **Flat shimming stone** (shim-stone): Take, Use under short foot. Bounds (81,574), 38×16 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Flat shimming stone](../objects/shim-stone.md).
- **Loose reed grit screen** (reed-screen): Take, Use on trough. Bounds (780,478), 90×32 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Loose reed grit screen](../objects/reed-screen.md).
- **Uphill goat tracks** (goat-tracks): Look, Follow hotspot. Bounds (150,522), 170×58 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Uphill goat tracks](../objects/goat-tracks.md).
- **Leaves covering seep inflow** (seep-leaves): Look, Use bank twig. Bounds (310,363), 120×52 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Leaves covering seep inflow](../objects/seep-leaves.md).
- **Fallen bank twig** (bank-twig): Take, Use on leaves. Bounds (223,596), 74×14 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Fallen bank twig](../objects/bank-twig.md).
- **Shared drinking-water pot** (communal-pot): Take, Fill, Use on fire. Bounds (804,440), 72×60 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Shared drinking-water pot](../objects/communal-pot.md).
- **Communal cook fire** (cook-fire): Look, light branch, heat communal pot. Bounds (450,520), 140×90 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Communal cook fire](../objects/cook-fire.md).
- **Saluna’s axe sheath** (axe-sheath): Take, Use on Huska for scent. Bounds (875,470), 50×60 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Saluna’s axe sheath](../objects/axe-sheath.md).
- **Trampled reed search spot** (trampled-reeds): Look, Search after Huska scent. Bounds (190,490), 100×80 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Trampled reed search spot](../objects/trampled-reeds.md).
- **Lost communal axe** (axe): Take after search, Use on reeds and loose bark. Bounds (198,490), 84×70 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Lost communal axe](../objects/axe.md).
- **Mature reed patch** (mature-reeds): Look, Use axe. Bounds (80,330), 170×180 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Mature reed patch](../objects/mature-reeds.md).
- **Young reed patch** (young-reeds): Look, rejected cut. Bounds (15,390), 80×110 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Young reed patch](../objects/young-reeds.md).
- **Cut reed bundles** (reed-bundles): Take/use through scene resource, Load, Build. Bounds (175,522), 110×58 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Cut reed bundles](../objects/reed-bundles.md).
- **Clay bank dug face** (clay-face): Look, collect clay to sledge. Bounds (530,400), 160×110 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Clay bank dug face](../objects/clay-face.md).
- **Hauling sledge** (goat-sledge): Look, Load, Lead with nanny, Unload. Bounds (640,520), 180×70 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Hauling sledge](../objects/goat-sledge.md).
- **Cut leafy browse** (browse): Take, Use on bowl, later scripted restock. Bounds (520,502), 60×48 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Cut leafy browse](../objects/browse.md).
- **Nanny’s feed bowl** (feed-bowl): Look, Use browse. Bounds (1016,580), 68×30 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Nanny’s feed bowl](../objects/feed-bowl.md).
- **Padded nanny harness** (goat-harness): Look, ask Tohani to fit. Bounds (720,464), 70×66 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Padded nanny harness](../objects/goat-harness.md).
- **Nanny’s lead rope** (lead-rope): Lead nanny after harness. Bounds (740,470), 80×60 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Nanny’s lead rope](../objects/lead-rope.md).
- **Clay washing-water pot** (wash-pot): Take, Fill, Use on mixing hollow. Bounds (71,494), 58×56 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Clay washing-water pot](../objects/wash-pot.md).
- **Clay mixing hollow** (mixing-hollow): Look, Use washing water. Bounds (610,513), 130×42 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Clay mixing hollow](../objects/mixing-hollow.md).
- **Clay load** (clay-load): Load, Unload, Use water, Apply daub. Bounds (702.5,498), 95×42 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Clay load](../objects/clay-load.md).
- **Ground shelter frame and wall** (ground-hut): Look, Apply reeds, Apply daub. Bounds (890,244), 220×280 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ground shelter frame and wall](../objects/ground-hut.md).
- **Smooth river offering stone** (rite-stone): Take, Use on river offering space. Bounds (110,540), 40×30 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Smooth river offering stone](../objects/rite-stone.md).
- **Naturally shed hen feather** (hen-feather): Ask Ahyeli, Use on animals space. Bounds (1009,507), 12×28 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Naturally shed hen feather](../objects/hen-feather.md).
- **Tsalohi goat bell and strap** (bell): Take, Use as offering, Look. Bounds (776,536), 16×24 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Tsalohi goat bell and strap](../objects/bell.md).
- **Founding rite circle** (rite-circle): Look, place offerings. Bounds (580,510), 240×90 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Founding rite circle](../objects/rite-circle.md).
- **New garden bed** (garden): Look. Bounds (840,546), 160×64 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [New garden bed](../objects/garden.md).
- **Watering path gap** (watering-gap): Look. Bounds (980,572), 110×48 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Watering path gap](../objects/watering-gap.md).
- **Reed garden gate panel** (garden-panel): Take, Bind, Open, Close. Bounds (1073,386), 104×124 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Reed garden gate panel](../objects/garden-panel.md).
- **Garden gate hinge cord** (garden-cord): Take, Use on panel. Bounds (1168,438), 44×32 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Garden gate hinge cord](../objects/garden-cord.md).
- **Amaneti garden latch pin** (garden-pin): Take, Use as garden latch. Bounds (1155,456), 30×14 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Amaneti garden latch pin](../objects/garden-pin.md).
- **Ground-home doors** (ground-door): Look, Use brace, test with resident. Bounds (967,392), 66×132 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ground-home doors](../objects/ground-door.md).
- **Dedicated ground-door braces** (door-braces): Take, Use on marked doors. Bounds (1093,460), 74×20 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Dedicated ground-door braces](../objects/door-braces.md).
- **Amaneti communal tool rack** (tool-rack): Look, Go hunting after disputes. Bounds (1100,380), 100×150 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Amaneti communal tool rack](../objects/tool-rack.md).
- **Ladder hand-rope** (hand-rope): Take, Use on family ladder. Bounds (1158,320), 44×120 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ladder hand-rope](../objects/hand-rope.md).
- **Shared utility knife** (utility-knife): Go hunting auto-take, Use on vine. Bounds (1128,356), 24×84 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Shared utility knife](../objects/utility-knife.md).

## Sprites used by targets

- [Muddy river intake](../objects/muddy-intake.md) — 170×84 art px. Anchor (140,548), ground; all bank periods.
- [Upper seep over stone](../objects/upper-seep.md) — 170×110 art px. Anchor (370,490), rear; arrival onward.
- [Salvaged trough and foot stand](../objects/trough.md) — 150×100 art px. Anchor (805,540), world; water-a kit. Anchor (360,500), world; assembled at seep.
- [Crossed foot strips](../objects/wood-strips.md) — 96×28 art px. Anchor (865,525), world; water-a after trough inspection.
- [Flat shimming stone](../objects/shim-stone.md) — 38×16 art px. Anchor (100,590), world; water-a resource. Anchor (405,500), world; installed under trough.
- [Loose reed grit screen](../objects/reed-screen.md) — 90×32 art px. Anchor (825,510), world; water-a bundle. Anchor (360,445), world; on installed trough. Anchor (805,485), world; Deyu survives; screen already attached to the supplied trough.
- [Uphill goat tracks](../objects/goat-tracks.md) — 170×58 art px. Anchor (235,580), ground; water-b.
- [Leaves covering seep inflow](../objects/seep-leaves.md) — 120×52 art px. Anchor (370,415), overlay; water-b.
- [Fallen bank twig](../objects/bank-twig.md) — 74×14 art px. Anchor (260,610), world; water-b.
- [Shared drinking-water pot](../objects/communal-pot.md) — 72×60 art px. Anchor (840,500), world; communal kit. Anchor (360,480), world; filling at checked seep. Anchor (520,530), world; heating on fire.
- [Communal cook fire](../objects/cook-fire.md) — 140×90 art px. Anchor (520,610), world; arrival through months.
- [Saluna’s axe sheath](../objects/axe-sheath.md) — 50×60 art px. Anchor (900,530), world; building bundle.
- [Trampled reed search spot](../objects/trampled-reeds.md) — 100×80 art px. Anchor (240,570), world; building search.
- [Lost communal axe](../objects/axe.md) — 84×70 art px. Anchor (240,560), world; revealed in trampled reeds. Anchor (1150,480), world; months communal rack.
- [Mature reed patch](../objects/mature-reeds.md) — 170×180 art px. Anchor (165,510), rear; arrival and building.
- [Young reed patch](../objects/young-reeds.md) — 80×110 art px. Anchor (55,500), rear; all bank periods.
- [Cut reed bundles](../objects/reed-bundles.md) — 110×58 art px. Anchor (230,580), world; cut stock. Anchor (710,530), world; on sledge. Anchor (980,500), world; at hut.
- [Clay bank dug face](../objects/clay-face.md) — 160×110 art px. Anchor (610,510), rear; arrival and building.
- [Hauling sledge](../objects/goat-sledge.md) — 180×70 art px. Anchor (730,590), world; loading near clay. Anchor (1000,590), world; unloaded at hut.
- [Cut leafy browse](../objects/browse.md) — 60×48 art px. Anchor (550,550), world; building source. Anchor (1050,598), world; bowl. Anchor (990,530), world; months pen supply.
- [Nanny’s feed bowl](../objects/feed-bowl.md) — 68×30 art px. Anchor (1050,610), world; building hut footprint.
- [Padded nanny harness](../objects/goat-harness.md) — 70×66 art px. Anchor (755,530), world; beside sledge before fitting.
- [Nanny’s lead rope](../objects/lead-rope.md) — 80×60 art px. Anchor (780,530), world; with Tohani and harness.
- [Clay washing-water pot](../objects/wash-pot.md) — 58×56 art px. Anchor (100,550), world; building at washing point. Anchor (675,520), world; mixing hollow during use.
- [Clay mixing hollow](../objects/mixing-hollow.md) — 130×42 art px. Anchor (675,555), ground; building.
- [Clay load](../objects/clay-load.md) — 95×42 art px. Anchor (750,540), world; on loaded sledge. Anchor (675,520), world; mixing hollow.
- [Ground shelter frame and wall](../objects/ground-hut.md) — 220×280 art px. Anchor (1000,524), rear; building through months. Anchor (745,524), rear; months second home.
- [Smooth river offering stone](../objects/rite-stone.md) — 40×30 art px. Anchor (130,570), world; rite shore source. Anchor (620,578), world; rite river space.
- [Naturally shed hen feather](../objects/hen-feather.md) — 12×28 art px. Anchor (1015,535), world; rite basket. Anchor (730,578), world; rite animals space.
- [Tsalohi goat bell and strap](../objects/bell.md) — 16×24 art px. Anchor (784,560), world; rite old-home offering.
- [Founding rite circle](../objects/rite-circle.md) — 240×90 art px. Anchor (700,600), ground; rite then months as memorial.
- [New garden bed](../objects/garden.md) — 160×64 art px. Anchor (920,610), ground; rite markers then months.
- [Watering path gap](../objects/watering-gap.md) — 110×48 art px. Anchor (1035,620), ground; months.
- [Reed garden gate panel](../objects/garden-panel.md) — 104×124 art px. Anchor (1125,510), world; months supply rack. Anchor (1035,610), world; garden path gap.
- [Garden gate hinge cord](../objects/garden-cord.md) — 44×32 art px. Anchor (1190,470), world; months rack.
- [Amaneti garden latch pin](../objects/garden-pin.md) — 30×14 art px. Anchor (1170,470), world; months rack. Anchor (1070,540), world; installed garden panel.
- [Ground-home doors](../objects/ground-door.md) — 66×132 art px. Anchor (1000,524), world; finished primary home. Anchor (745,524), world; months second home.
- [Dedicated ground-door braces](../objects/door-braces.md) — 74×20 art px. Anchor (1130,480), world; months rack. Anchor (1000,460), world; Oweli door installed. Anchor (745,460), world; Saluna door installed.
- [Amaneti communal tool rack](../objects/tool-rack.md) — 100×150 art px. Anchor (1150,530), world; months.
- [Ladder hand-rope](../objects/hand-rope.md) — 44×120 art px. Anchor (1180,440), world; months rack.
- [Shared utility knife](../objects/utility-knife.md) — 24×84 art px. Anchor (1140,440), world; months rack.
- [Light arrow cord](../objects/light-cord.md) — 80×48 art px. Anchor (870,510), world; building bundle.
- [Tall-tree offering branch](../objects/rite-branch.md) — 88×26 art px. Anchor (675,578), world; rite tree space.

## Separate visual-only objects and changing scenery

- [Amaneti goat enclosure](../objects/amaneti-pen.md) — 260×110 art px. Anchor (1070,600), rear; months and afternoon, behind garden gate.
- [Bank driftwood](../objects/bank-driftwood.md) — 140×48 art px. Anchor (570,565), ground; arrival onwards.
- [Chicken transport baskets](../objects/chicken-baskets.md) — 120×78 art px. Anchor (1000,595), world; arrival through months.
- [Communal salvaged bundle](../objects/communal-bundle.md) — 120×76 art px. Anchor (850,600), world; arrival through building.
- [Two remembered cups](../objects/cups.md) — 28×32 art px. Anchor (840,540), world; after grief beat, Deyu died only; chipped cup by communal tools. Anchor (580,530), world; after grief beat, Enali died only; repaired cup beside water pot.
- [Covered fire carrier](../objects/fire-carrier.md) — 48×68 art px. Anchor (1190,485), world; months rack.
- [Bowl of roots](../objects/meal-bowl.md) — 58×28 art px. Anchor (570,550), world; post-hunt return only.
- [Settlement doorway lamps](../objects/settlement-lantern.md) — 26×38 art px. Anchor (1070,390), world; rite and months, doorway hanger. Anchor (805,390), world; months, second ground home.
- [Kanu’s unfinished boat](../objects/toy-boat.md) — 70×32 art px. Anchor (1080,485), world; months, Deyu survives only.
- [Collection and washing markers](../objects/water-markers.md) — 40×40 art px. Anchor (450,500), world; after water convergence. Anchor (90,590), world; after water convergence.
- [Shared waterskin](../objects/waterskin.md) — 42×60 art px. Anchor (890,570), world; arrival and water.

## Foreground layers

- [Near-bank reed cut](../objects/bank-reed-front.md) — 80×100 art px. Anchor (50,630), foreground; all bank phases.

## Walking space, exits and staging

Keep shore approach (100,650), seep approach (400,650), clay/sledge approach (680,650) and hut/rack approach (1050,650) clear. Water locations are on a rear side-on bank shelf, not inaccessible perspective paths. Foreground reeds mask only a small shore edge, not actors or target labels. Shared spots in this sheet belong to different periods and are labelled in the legend.

Oweli at (760,620), Tohani at (950,620), Tali/Kanu near Ahyeli at (1140..1190,610); goats use the hut/sledge zone only during haul, otherwise remain rear of front corridor. Exactly one survivor occupies the water-talk location. At the rite, Kofi and Oweli address the circle from front-side action points while other people stand in rear groups. Months later supporting volunteers occupy the rack discussion zone; no roster actor is placed at the clearing board simultaneously.

- **Woodland clearing** at (1240,660): Right edge; opens after drinking water is established. Bidirectional thereafter.

- Kofi: feet (720,670) art px; reference only.
- Water survivor: feet (430,620) art px; reference only.
- Saluna: feet (660,620) art px; reference only.
- Ahyeli / rack: feet (1110,620) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../layouts/riverbank.svg). Preserve the scoped exceptions in this room's description.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
