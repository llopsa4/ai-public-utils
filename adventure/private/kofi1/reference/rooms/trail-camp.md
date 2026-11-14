# Room: Trail camp at night

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

A low clearing enclosed by close, dark trunks. The trail enters at the left and continues right, but neither edge suggests an extra explorable area tonight. The fire is left of centre, possessions and chicken baskets shelter farther left, and the herd waits at the right-hand edge before Huska gathers it inward. Leave the right third comparatively empty for the wolf encounter and the later last-wolf decision. A few bedrolls tuck against the back line; none crosses the main walking lane.

## What the game does with it

- **arrival** — The quiet bow exchange introduces Deyu’s folding bow, hunting points, reusable wooden blunt arrow and cord-carrying arrows. The fire stick starts caught in a separate dead bough; only the chosen human survivor is present.
- **stick-down** — The blunt arrow has knocked down the loose fire stick and been recovered. The stick lies separately on clean ground until taken; the bare dead bough stays in place.
- **prepared** — Branch removed from ground and lit in Kofi’s hand; goats gathered inside the light. Both preparations required for encounter.
- **aftermath** — Wolf pack has fled; the last wolf is an actor at the right. Kill occurs out of view, or the actor exits. No trophy or carcass prop.
- **dawn** — Same objects and actor identities; runtime lighting changes. Packing hides them only as their carriers leave.

Source: [STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03)

## Fixed background

Trunks, distant dark foliage, level earth and fixed stones outside interaction areas. No fire, loose branch, bedding, baskets, bundles, carried vessels, animals or people painted into the room. Leave clean backing beneath the separate dead bough and removable caught fire stick; never bake either into the trees.

## Interactive targets — puzzle order

- **Communal cook fire** (cook-fire): Look, light branch, heat communal pot. Bounds (280,520), 140×90 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Communal cook fire](../objects/cook-fire.md).
- **Caught dry stick / dead bough** (camp-dead-bough): Look, Use wooden blunt arrow. Bounds (898,254), 164×96 art px. When: Shot requires the bow unfolded; ordinary hunting points are refused without consumption. Repeated use after dislodging does not duplicate the fire stick.. [Dead bough catching the fire stick](../objects/camp-dead-bough.md).
- **Camp fire-brand branch** (camp-branch): Take, Use on fire, Fire brand combat reference. Bounds (497,590), 86×20 art px. When: Visible and takeable on the ground only after dislodging the high stick with the wooden blunt arrow.. [Camp fire-brand branch](../objects/camp-branch.md).

## Sprites used by targets

- [Communal cook fire](../objects/cook-fire.md) — 140×90 art px. Anchor (350,610), world; all camp phases.
- [Dead bough catching the fire stick](../objects/camp-dead-bough.md) — 164×96 art px. Anchor (980,350), rear; Above a clear landing patch. The fire stick is a separate removable child; leave clean background beneath both..
- [Camp fire-brand branch](../objects/camp-branch.md) — 86×20 art px. Anchor (540,610), world; After the wooden blunt arrow dislodges it; hide this ground instance when collected.. Anchor (980,326), world; Before the blunt-arrow shot; hide when the stick moves to its ground instance..
- [Shared drinking-water pot](../objects/communal-pot.md) — 72×60 art px. Anchor (320,530), world; camp beside fire.
- [Light arrow cord](../objects/light-cord.md) — 80×48 art px. Anchor (100,555), world; communal kit.
- [Salvaged trough and foot stand](../objects/trough.md) — 150×100 art px. Anchor (245,570), world; camp communal kit, selected survivor variant.

## Separate visual-only objects and changing scenery

- [Camp sleeping mats](../objects/bedrolls.md) — 180×48 art px. Anchor (420,568), world; camp. Anchor (670,568), world; camp.
- [Chicken transport baskets](../objects/chicken-baskets.md) — 120×78 art px. Anchor (170,610), world; arrival through dawn.
- [Communal salvaged bundle](../objects/communal-bundle.md) — 120×76 art px. Anchor (120,610), world; camp.
- [Shared waterskin](../objects/waterskin.md) — 42×60 art px. Anchor (200,570), world; camp.

## Foreground layers

None.

## Walking space, exits and staging

Coordinates are art pixels; divide by two for logical units. Default floor band y=536–690. Keep (940..1200,630..690) clear for encounter staging. Sleeping people and herd are excluded actor briefs, never bedding composites. Moonlight is steady; fire flicker and light pools belong to runtime effects. The carried trough is visible beside the communal kit; its selected-survivor form is not a camp puzzle.

Ahyeli and sleeping children occupy the rear mat zone (600..730,568), Oweli at (500,620). Place exactly one survivor at (440,620). Herd starts near (1090,620), gathers to (810..910,620); Huska moves between these zones. Wolves approach through x=1030..1200 and leave through the right cover; the last wolf is an actor, not a new object image. Both aftermath choices leave the same kit visible.

The dead bough is at (980,350) art px over an empty landing patch, away from sleepers and animals. Its loose fire stick drops to (540,610) after the wooden blunt arrow shot. The bow demonstration is staging only; no new actor art is requested. Both utility arrows are recovered; neither creates a specialised metal head.

- **Trail back** at (40,660): Left edge: no departure before camp complete.
- **Trail onward** at (1240,660): Right edge: scripted transition after wolf aftermath.

- Kofi: feet (620,670); reference only.
- Tohani: feet (870,620); reference only.
- Survivor: feet (440,620); reference only.
- Huska / herd: feet (1060,640); reference only.

## Technical

1280×720 room frame, 2-pixel world grid, existing palette. [Annotated layout](../layouts/trail-camp.svg). No labels, actors or removable props baked into background. Preserve approved exceptions recorded in the room description.

## Prompt for Codex

A low clearing enclosed by close, dark trunks. The trail enters at the left and continues right, but neither edge suggests an extra explorable area tonight. The fire is left of centre, possessions and chicken baskets shelter farther left, and the herd waits at the right-hand edge before Huska gathers it inward. Leave the right third comparatively empty for the wolf encounter and the later last-wolf decision. A few bedrolls tuck against the back line; none crosses the main walking lane.

Paint only this fixed setting: Trunks, distant dark foliage, level earth and fixed stones outside interaction areas. No fire, loose branch, bedding, baskets, bundles, carried vessels, animals or people painted into the room. Leave clean backing beneath the separate dead bough and removable caught fire stick; never bake either into the trees. Follow the linked layout, existing style and references. Lighting/text are runtime effects. No art production is authorised by generating this brief.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
