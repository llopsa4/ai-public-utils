# Room: Woodland clearing

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

A sunny pocket above the riverbank. The bank path reaches the lower-left edge; the river is a silver glimpse between distant trunks. A naturally fallen tree and loose bark lie to the left, a work board sits left of centre, and a very tall living tree rises right of centre. Its broad roots frame a clear beam-lift area and a visible fork high above hand reach. To the right, a trail disappears into deeper forest. Later, two tree huts occupy the same tall tree and a small roofed watch post sits by the forest boundary.

## What the game does with it

- **building** — Loose bark, board, timber, cradle and branch target. No ladder or finished platform yet.
- **rigged** — Light cord replaced by load rope; beam and cradle rise only with agreed helpers.
- **rite** — Secured low platform, ladder and first tree hut. Loose dead branch collectible once for offering.
- **months** — Two tree huts, second ladder, shared refuge and watch post. Watch board and hand-rope state changes active.
- **afternoon** — Agreements persist; forest trail open only after Kofi collects travel kit at bank.

Source: [STORY.md · kofi1-clearing-description](../../../../STORY.md#kofi1-clearing-description) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07)

## Fixed background

Distant woodland, river glimpse, rooted earth and the noninteractive trunk structure. Leave clean background behind bark, beams, branch target, platform areas, ladders, huts, watch post and the foreground canopy cut.

## Interactive targets — puzzle order

- **Storm-fallen timber stock** (fallen-timber): Look, select sound pieces. Bounds (70,430), 260×130 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Storm-fallen timber stock](../objects/fallen-timber.md).
- **Loose bark strips** (loose-bark): Use axe, Take, Twist rope. Bounds (160,483), 120×52 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Loose bark strips](../objects/loose-bark.md).
- **Clearing work board** (work-board): Look, Twist rope. Bounds (400,460), 180×110 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Clearing work board](../objects/work-board.md).
- **High fork of the tall tree** (target-branch): Look, Use line-arrow. Bounds (740,80), 230×110 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [High fork of the tall tree](../objects/target-branch.md).
- **Arrow with light cord** (line-arrow): Combine, Use on high fork. Bounds (960,586), 100×24 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Arrow with light cord](../objects/line-arrow.md).
- **Hanging light line / load rope** (rig-line): Look, Use load rope, attach to cradle. Bounds (675,150), 360×470 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Hanging light line / load rope](../objects/rig-line.md).
- **Coiled bark load rope** (load-rope): Twist, Take, Use on hanging light line. Bounds (440,420), 100×50 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Coiled bark load rope](../objects/load-rope.md).
- **Beam lifting cradle** (beam-cradle): Look, attach load rope. Bounds (770,505), 200×80 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Beam lifting cradle](../objects/beam-cradle.md).
- **Prepared lift beams** (timber-beams): Look, load cradle, lift with helpers. Bounds (850,529), 160×36 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Prepared lift beams](../objects/timber-beams.md).
- **Family hut ladder** (family-ladder): Look, staged climb, assisted practice. Bounds (787,340), 66×250 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Family hut ladder](../objects/family-ladder.md).
- **Low tree platform** (tree-platform): Look, staged reach to dead branch. Bounds (715,284), 280×56 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Low tree platform](../objects/tree-platform.md).
- **Tall-tree offering branch** (rite-branch): Take from platform, Use on tree space. Bounds (791,274), 88×26 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Tall-tree offering branch](../objects/rite-branch.md).
- **First / family tree hut** (family-tree-hut): Look, discuss housing. Bounds (760,120), 190×190 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [First / family tree hut](../objects/family-tree-hut.md).
- **Second / shared refuge hut** (refuge-hut): Look, discuss refuge. Bounds (980,170), 160×165 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Second / shared refuge hut](../objects/refuge-hut.md).
- **Shared refuge ladder** (refuge-ladder): Look. Bounds (1060,360), 60×230 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Shared refuge ladder](../objects/refuge-ladder.md).
- **Forest boundary watch shelter** (watch-shelter): Look. Bounds (480,314), 180×210 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Forest boundary watch shelter](../objects/watch-shelter.md).
- **Scratched watch board** (watch-board): Look, record agreed rota. Bounds (520,370), 100×70 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Scratched watch board](../objects/watch-board.md).
- **Tethered writing charcoal** (charcoal-stub): Use through board action. Bounds (629,420), 12×30 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Tethered writing charcoal](../objects/charcoal-stub.md).
- **Ladder hand-rope** (hand-rope): Take, Use on family ladder. Bounds (753,460), 44×120 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ladder hand-rope](../objects/hand-rope.md).

## Sprites used by targets

- [Storm-fallen timber stock](../objects/fallen-timber.md) — 260×130 art px. Anchor (200,560), rear; building onwards.
- [Loose bark strips](../objects/loose-bark.md) — 120×52 art px. Anchor (220,535), world; building.
- [Clearing work board](../objects/work-board.md) — 180×110 art px. Anchor (490,570), world; building onwards.
- [High fork of the tall tree](../objects/target-branch.md) — 230×110 art px. Anchor (855,190), rear; all clearing phases.
- [Arrow with light cord](../objects/line-arrow.md) — 100×24 art px. Anchor (1010,610), world; shot landing area.
- [Hanging light line / load rope](../objects/rig-line.md) — 360×470 art px. Anchor (855,620), overlay; rigging and lift.
- [Coiled bark load rope](../objects/load-rope.md) — 100×50 art px. Anchor (490,470), world; made on work board.
- [Beam lifting cradle](../objects/beam-cradle.md) — 200×80 art px. Anchor (870,585), world; building. Anchor (870,400), world; during lift.
- [Prepared lift beams](../objects/timber-beams.md) — 160×36 art px. Anchor (930,565), world; building stock. Anchor (870,520), world; loaded cradle. Anchor (870,335), world; raised test beam.
- [Family hut ladder](../objects/family-ladder.md) — 66×250 art px. Anchor (820,590), world; rite and months.
- [Low tree platform](../objects/tree-platform.md) — 280×56 art px. Anchor (855,340), rear; montage through months.
- [Tall-tree offering branch](../objects/rite-branch.md) — 88×26 art px. Anchor (835,300), world; rite platform source.
- [First / family tree hut](../objects/family-tree-hut.md) — 190×190 art px. Anchor (855,310), rear; rite and months.
- [Second / shared refuge hut](../objects/refuge-hut.md) — 160×165 art px. Anchor (1060,335), rear; months.
- [Shared refuge ladder](../objects/refuge-ladder.md) — 60×230 art px. Anchor (1090,590), world; months.
- [Forest boundary watch shelter](../objects/watch-shelter.md) — 180×210 art px. Anchor (570,524), rear; months.
- [Scratched watch board](../objects/watch-board.md) — 100×70 art px. Anchor (570,440), world; months.
- [Tethered writing charcoal](../objects/charcoal-stub.md) — 12×30 art px. Anchor (635,450), world; months.
- [Ladder hand-rope](../objects/hand-rope.md) — 44×120 art px. Anchor (775,580), world; installed beside family ladder.
- [Ordinary recoverable arrows](../objects/arrows.md) — 100×16 art px. Anchor (1010,610), world; Bare arrow only after recovering the tied arrow; never display beside the same line-arrow instance..

## Separate visual-only objects and changing scenery

- [Two remembered cups](../objects/cups.md) — 28×32 art px. Anchor (470,460), world; construction grief beat. Anchor (510,460), world; construction grief beat.
- [Dead branch support / empty socket](../objects/dead-shoot.md) — 50×22 art px. Anchor (835,305), rear; rite.
- [Shared refuge platform](../objects/refuge-platform.md) — 210×52 art px. Anchor (1060,360), rear; months.
- [Swept shavings basket](../objects/shavings-basket.md) — 64×48 art px. Anchor (390,570), world; rite and months.

## Foreground layers

- [Tall-tree foreground canopy cut](../objects/clearing-canopy.md) — 260×140 art px. Anchor (1050,140), foreground; all clearing phases.

## Walking space, exits and staging

Main walk lane y=636..690 remains clear. Target branch and elevated platform are reached by a staged action from (820,650), never by scaling actors smaller. Ladder practice uses existing character references; no new pose artwork is commissioned by this pack. The ground below the arrow landing point (1000,620) stays empty of actors during the shot.

Most visits begin with Kofi alone. Saluna arrives briefly on first entry then returns to bank. For beam lift only, Saluna and Tohani move up from the bank and use the marked helper feet. For practice only, Ahyeli, Tali, Kanu and Saluna come up together, using the family ladder rather than refuge ladder. Their names identify staging, not new pose/design requests. Common-stage cup overlay in the sheet illustrates Deyu’s memorial placement; Enali’s alternate cup destination is specified in the cup brief.

- **Riverbank** at (40,660): Left edge; always returns to bank.
- **Deep forest** at (1240,660): Right edge; denied until disputes complete and travel kit collected.

- Kofi: feet (530,670) art px; reference only.
- Saluna / helper: feet (660,650) art px; reference only.
- Tohani / helper: feet (970,650) art px; reference only.
- Ahyeli / practice: feet (800,650) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../layouts/woodland-clearing.svg). Preserve the scoped exceptions in this room's description.

## Sources

[STORY.md · kofi1-clearing-description](../../../../STORY.md#kofi1-clearing-description) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
