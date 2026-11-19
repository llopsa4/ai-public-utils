# Room: Kofi’s hut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

A small round ground hut represented as a flat, intimate interior, with no forced side-wall perspective. Woven reed walls and clay daub show repairs. A doorway at the left holds the travel rack. The bedroll lies left of centre; a cold hearth and low arrow shelf occupy the middle; drying nets, a shifted beam and its stone sill occupy the right. A stool gives the freed creature a hiding place. Steady moonlight makes objects readable without revealing the body trapped in the nets.

## What the game does with it

- **arrival** — Travel kit stowed; beam pins tangled net. Pole and wedge by cold hearth; arrow on shelf.
- **lifted** — Lever raises beam; can safely lower again until wedge inserted. No timed interaction.
- **supported** — Wedge supports beam; loose drawcord can be unpicked.
- **freed** — Net slack then folded clear; beam stays supported; robot actor emerges and may hide under stool.
- **retrieval** — One shelf arrow lies under hearth edge, then in front of robot, then is picked up.
- **settled** — Arrow returned to shelf; pole returned to tool spot; wedge remains structurally installed; bedroll corner clear for robot.

Source: [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09)

## Fixed background

Plain reed-and-clay back wall, roof interior and level floor. Keep clean patches beneath rack, tools, shelf, arrows, hearth, gap, net, beam, sill, stool and bedroll. No eyes or creature silhouette in background or net painting.

## Interactive targets — puzzle order

- **Kofi’s bedroll** (bedroll): Look, Wait back, Sit back, Lie. Bounds (285,545), 210×65 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Kofi’s bedroll](../objects/bedroll.md).
- **Shifted roof beam** (shifted-beam): Look, Use pole, set wedge. Bounds (650,310), 420×150 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Shifted roof beam](../objects/shifted-beam.md).
- **Beam’s stone sill** (beam-sill): Look, pole leverage reference. Bounds (750,430), 300×96 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Beam’s stone sill](../objects/beam-sill.md).
- **Short levering pole** (lever-pole): Take, Use on beam, rejected gap reach. Bounds (475,592), 150×18 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Short levering pole](../objects/lever-pole.md).
- **Beam support wedge** (wooden-wedge): Take, Use while pole lifts beam. Bounds (549,580), 42×30 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Beam support wedge](../objects/wooden-wedge.md).
- **Kofi’s drying nets** (drying-nets): Look, loosen drawcord, pull only when supported. Bounds (755,340), 290×260 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Kofi’s drying nets](../objects/drying-nets.md).
- **Net binding drawcord** (net-drawcord): Look, Loosen after support. Bounds (805,494), 70×56 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Net binding drawcord](../objects/net-drawcord.md).
- **Dry gap beneath hearth stone** (hearth-gap): Look, invite retrieval when arrow present. Bounds (675,572), 90×26 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Dry gap beneath hearth stone](../objects/hearth-gap.md).
- **Ordinary recoverable arrows** (arrows): Look, Take, return to shelf, combine light cord. Bounds (610,418), 100×16 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Ordinary recoverable arrows](../objects/arrows.md).
- **Low arrow shelf** (arrow-shelf): Look, return recovered arrow. Bounds (590,414), 140×36 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Low arrow shelf](../objects/arrow-shelf.md).
- **Kofi’s cold hearth** (cold-hearth): Look. Bounds (575,495), 170×95 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Kofi’s cold hearth](../objects/cold-hearth.md).
- **Robot hiding stool** (hut-stool): Look. Bounds (1040,510), 100×100 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Robot hiding stool](../objects/hut-stool.md).

## Sprites used by targets

- [Kofi’s bedroll](../objects/bedroll.md) — 210×65 art px. Anchor (390,610), ground; all hut phases.
- [Shifted roof beam](../objects/shifted-beam.md) — 420×150 art px. Anchor (860,460), rear; arrival through settled.
- [Beam’s stone sill](../objects/beam-sill.md) — 300×96 art px. Anchor (900,526), rear; all hut phases.
- [Short levering pole](../objects/lever-pole.md) — 150×18 art px. Anchor (550,610), world; on floor before Take / after completion. Anchor (890,490), world; levering reference.
- [Beam support wedge](../objects/wooden-wedge.md) — 42×30 art px. Anchor (570,610), world; before Take. Anchor (800,450), world; installed support.
- [Kofi’s drying nets](../objects/drying-nets.md) — 290×260 art px. Anchor (900,600), world; arrival through freed. Anchor (1070,590), world; folded after rescue.
- [Net binding drawcord](../objects/net-drawcord.md) — 70×56 art px. Anchor (840,550), world; on tangled net. Anchor (1010,560), world; on folded net.
- [Dry gap beneath hearth stone](../objects/hearth-gap.md) — 90×26 art px. Anchor (720,598), ground; all hut phases.
- [Ordinary recoverable arrows](../objects/arrows.md) — 100×16 art px. Anchor (660,434), world; shelf before drop and after return. Anchor (720,596), world; under hearth edge. Anchor (735,625), world; retrieved onto floor.
- [Low arrow shelf](../objects/arrow-shelf.md) — 140×36 art px. Anchor (660,450), rear; all hut phases.
- [Kofi’s cold hearth](../objects/cold-hearth.md) — 170×95 art px. Anchor (660,590), rear; all hut phases.
- [Robot hiding stool](../objects/hut-stool.md) — 100×100 art px. Anchor (1090,610), world; all hut phases.
- [Shared utility knife](../objects/utility-knife.md) — 24×84 art px. Anchor (160,440), world; hut rack.

## Separate visual-only objects and changing scenery

- [Covered fire carrier](../objects/fire-carrier.md) — 48×68 art px. Anchor (200,510), world; hut rack.
- [Kofi’s original folding bow](../objects/folding-bow.md) — 38×150 art px. Anchor (145,480), world; on travel rack.
- [Loose hut cord](../objects/hut-loose-cord.md) — 50×28 art px. Anchor (515,600), world; arrival through settled.
- [Kofi’s travel rack](../objects/hut-rack.md) — 110×220 art px. Anchor (170,524), rear; all hut phases.
- [Kofi’s flat quiver](../objects/quiver.md) — 46×120 art px. Anchor (195,480), world; on hut rack.

## Foreground layers

- [Stool front-leg cut](../objects/stool-front.md) — 100×100 art px. Anchor (1090,610), foreground; all hut phases.

## Walking space, exits and staging

Accessible action feet: (300,650) bedroll, (650,650) hearth, (880,650) beam/net, (1080,650) stool. Layer net in front of trapped actor; remove masking only at reveal. Beam occupies rear upper space and never blocks the walking lane. Robot and Kofi are staging references, not assets commissioned here.

Robot eyes behind the net are a masked actor reference, never painted in net or room. After freeing, the actor may move under stool at (1070,600), into the dry gap reach zone (720,620), then beside bedroll (400,600). Front stool legs occlude only the hiding actor. Kofi’s invitation/withdrawal does not transform the robot into a prop. Huska stays outside; no dog silhouette is painted into doorway.

- **Amaneti bank** at (40,660): Left doorway; closing scene stays here until arrow shelved and robot settled.

- Kofi: feet (400,670) art px; reference only.
- Robot hiding reference: feet (1070,600) art px; reference only.
- Robot retrieval reference: feet (720,620) art px; reference only.
- Robot bedroll reference: feet (400,600) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../layouts/kofi-hut.svg). Preserve the scoped exceptions in this room's description.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
