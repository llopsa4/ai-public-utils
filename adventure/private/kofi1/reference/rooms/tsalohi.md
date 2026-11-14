# Room: Tsalohi at evening

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

A compact timber-and-stone square on the eastern brink of the Rift. Worn stone foundations, patched pale plaster and ochre woven awnings frame a shared cooking place. The far chasm reads behind the square, not as a path the player can enter. A repaired pen occupies the left, communal work occupies the middle, and the chicken coop and inland gate sit to the right. Keep the gate silhouette clear against trees inland. Dusk is warm but evenly painted; the disaster uses separate ground, building and ledge layers over the same background.

## What the game does with it

- **evening** — Ordinary errands; all neighbours alive; gate pin and bell change during chores.
- **warning** — Chores complete; actor reactions and a separate rattling cup precede the crack.
- **collapse** — Ground cracks, coop opened for escape, equipment collected; normal exploration is replaced by the rescue staging.
- **rescue** — Intact ground hides; central footing and two ledges show. Both candidates visible until the explicit choice. Hide the unsaved ledge and its actor together; the survivor crosses the footing.
- **departure** — Hide collapsing near buildings, ground and props with their supporting ledge; keep inland gate and stable exit readable until the fade.

Source: [STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02)

## Fixed background

Distant Rift cliffs, sky, inland treeline and remote stone outcrops only. Leave the entire near square, building strip, work areas and ground plain behind removable layers. No gate, fire, coop, trestle, bell, tools, people, animals or collapse cracks in the background.

## Interactive targets — puzzle order

- **Tohani’s faulty gate** (pen-gate): Look, use cross-pin, Open by story. Bounds (195,460), 110×140 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Tohani’s faulty gate](../objects/pen-gate.md).
- **Deyu’s gate cross-pin** (cross-pin): Take through Deyu, Use on pen gate. Bounds (738,454), 32×16 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Deyu’s gate cross-pin](../objects/cross-pin.md).
- **Tsalohi goat bell and strap** (bell): Take, Use as offering, Look. Bounds (270,466), 16×24 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Tsalohi goat bell and strap](../objects/bell.md).
- **Enali’s hot pot** (tsalohi-pot): Look, move using pot cloth. Bounds (439,510), 72×60 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Enali’s hot pot](../objects/tsalohi-pot.md).
- **Enali’s pot cloth** (pot-cloth): Take with permission, Use on hot pot. Bounds (796,430), 48×22 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Enali’s pot cloth](../objects/pot-cloth.md).
- **Chicken coop and transport catch** (coop): Look, Use grain, Open, Close. Bounds (965,410), 190×180 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Chicken coop and transport catch](../objects/coop.md).
- **Ahyeli’s grain scoop** (grain-scoop): Take with permission, Use on coop. Bounds (1141,384), 38×36 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ahyeli’s grain scoop](../objects/grain-scoop.md).
- **Inland town gate** (inland-gate): Look, exit when story permits. Bounds (1131,290), 130×330 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Inland town gate](../objects/inland-gate.md).

## Sprites used by targets

- [Tohani’s faulty gate](../objects/pen-gate.md) — 110×140 art px. Anchor (250,600), world; evening and escape.
- [Deyu’s gate cross-pin](../objects/cross-pin.md) — 32×16 art px. Anchor (754,470), world; before borrowing. Anchor (260,520), world; installed at gate.
- [Tsalohi goat bell and strap](../objects/bell.md) — 16×24 art px. Anchor (278,490), world; gatepost after repair.
- [Enali’s hot pot](../objects/tsalohi-pot.md) — 72×60 art px. Anchor (475,570), world; by cook fire. Anchor (790,450), world; on trestle after errand.
- [Enali’s pot cloth](../objects/pot-cloth.md) — 48×22 art px. Anchor (820,452), world; before and after pot errand.
- [Chicken coop and transport catch](../objects/coop.md) — 190×180 art px. Anchor (1060,590), world; evening to escape.
- [Ahyeli’s grain scoop](../objects/grain-scoop.md) — 38×36 art px. Anchor (1160,420), world; on coop hook.
- [Inland town gate](../objects/inland-gate.md) — 130×330 art px. Anchor (1196,620), rear; evening through departure.
- [Communal cook fire](../objects/cook-fire.md) — 140×90 art px. Anchor (450,610), world; evening.

## Separate visual-only objects and changing scenery

- [Chicken transport baskets](../objects/chicken-baskets.md) — 120×78 art px. Anchor (1140,590), world; coop escape.
- [Scattered coop grain](../objects/coop-grain.md) — 120×18 art px. Anchor (1050,584), ground; chicken errand.
- [Deyu’s right ledge](../objects/deyu-ledge.md) — 390×170 art px. Anchor (940,650), ground; rescue.
- [Enali’s left ledge](../objects/enali-ledge.md) — 390×170 art px. Anchor (340,650), ground; rescue.
- [Kofi’s original folding bow](../objects/folding-bow.md) — 38×150 art px. Anchor (920,480), world; on town rack.
- [Tsalohi goat pen](../objects/goat-pen.md) — 280×160 art px. Anchor (180,590), rear; evening and coop escape.
- [Opening ground crack](../objects/ground-crack.md) — 1100×120 art px. Anchor (640,640), ground; warning and collapse.
- [Kofi’s flat quiver](../objects/quiver.md) — 46×120 art px. Anchor (950,480), world; on town rack.
- [Tsalohi warning cup](../objects/rattling-cup.md) — 28×32 art px. Anchor (860,452), world; evening and warning.
- [Central rescue footing](../objects/rescue-footing.md) — 180×150 art px. Anchor (640,690), ground; rescue.
- [Broken handrail](../objects/rescue-rail.md) — 180×130 art px. Anchor (940,500), world; rescue.
- [Near timber-and-stone houses](../objects/town-buildings.md) — 1180×430 art px. Anchor (640,524), rear; evening to collapse.
- [Square floor overlay](../objects/town-ground.md) — 1280×196 art px. Anchor (640,720), ground; evening to collapse.
- [Tsalohi equipment rack](../objects/town-rack.md) — 90×200 art px. Anchor (930,510), world; evening to escape.
- [Kanu’s unfinished boat](../objects/toy-boat.md) — 70×32 art px. Anchor (710,450), world; evening.
- [Deyu’s trestle](../objects/tsalohi-trestle.md) — 230×122 art px. Anchor (750,574), world; evening. Anchor (340,525), world; rescue.

## Foreground layers

None.

## Walking space, exits and staging

Coordinates are art pixels; divide by two for logical units. Default floor band y=536–690. Reserve approach feet (160,650) for the pen, (430,650) for the pot, (690,650) for Deyu and (1040,650) for the coop. During rescue, the ordinary floor route is suspended; central footing and reachable ledge edges are staging references, not permission to walk across the chasm.

Evening: Oweli at (940,620), Saluna at (850,620), Ahyeli at (1110,620), Tali and Kanu in the adjacent (1070..1150,610) zone, Huska at (1180,620); goats within pen x=70..230, chickens by coop x=1000..1100. These are independently rendered actors. Rescue: Enali’s pinned actor occupies the left ledge under trestle, Deyu hangs from the right rail; Oweli and families are already inland. Huska waits behind Kofi on the stable central footing. Only the explicit rescue changes which human actor exits alive.

- **Inland trail** at (1200,660): Right edge. Initially blocked by dialogue; after rescue it is the scripted escape. No left-edge Rift exit.

- Kofi: feet (640,670); reference only.
- Deyu / trestle talk: feet (730,620); reference only.
- Enali / pot talk: feet (480,620); reference only.
- Tohani: feet (190,620); reference only.

## Technical

1280×720 room frame, 2-pixel world grid, existing palette. [Annotated layout](../layouts/tsalohi.svg). No labels, actors or removable props baked into background. Preserve approved exceptions recorded in the room description.

## Prompt for Codex

A compact timber-and-stone square on the eastern brink of the Rift. Worn stone foundations, patched pale plaster and ochre woven awnings frame a shared cooking place. The far chasm reads behind the square, not as a path the player can enter. A repaired pen occupies the left, communal work occupies the middle, and the chicken coop and inland gate sit to the right. Keep the gate silhouette clear against trees inland. Dusk is warm but evenly painted; the disaster uses separate ground, building and ledge layers over the same background.

Paint only this fixed setting: Distant Rift cliffs, sky, inland treeline and remote stone outcrops only. Leave the entire near square, building strip, work areas and ground plain behind removable layers. No gate, fire, coop, trestle, bell, tools, people, animals or collapse cracks in the background. Follow the linked layout, existing style and references. Lighting/text are runtime effects. No art production is authorised by generating this brief.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
