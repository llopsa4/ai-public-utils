# Room: Deep forest

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## Description

Older, closer trees narrow the view. The path returns left toward Amaneti, passes the near face of a fallen log, and bends toward dense cover at the right. Fresh tracks and torn brush warn of a large animal before it appears. A dead side limb tied down by a rotten vine blocks room to back away. Clearing that limb exposes an open strip in front of the log, while the log itself remains. Leave the right half open enough to read the bear silhouette and charge without hiding Kofi.

## What the game does with it

- **warning** — Tracks, torn brush, log, bound limb and intact vine visible.
- **lane-clear** — Vine cut; side limb moved to the rear side of the log. Return lane remains visibly empty.
- **encounter** — Bear enters after Huska is called back. Props retain cleared configuration.
- **aftermath-kill** — Last shot hidden behind log; bear actor leaves visible stage. No visible blood, corpse sprite or loot.
- **aftermath-release** — Bear actor exits to cover while Kofi and Huska back along cleared lane. Same arrows recovered.

Source: [STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08)

## Fixed background

Old trunks, unbroken undergrowth away from targets and fixed ground. Do not bake in tracks, torn brush, fallen log, blocking limb, vine, animals or arrows.

## Interactive targets — puzzle order

- **Fresh bear tracks** (bear-tracks): Look. Bounds (300,548), 160×50 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Fresh bear tracks](../objects/bear-tracks.md).
- **Broken forest brush** (torn-brush): Look. Bounds (865,420), 150×120 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Broken forest brush](../objects/torn-brush.md).
- **Forest fallen log** (fallen-log): Look. Bounds (635,440), 330×150 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Forest fallen log](../objects/fallen-log.md).
- **Dead side limb** (blocking-limb): Look, Pull after vine cut. Bounds (430,605), 210×70 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Dead side limb](../objects/blocking-limb.md).
- **Vine tying the limb** (rotten-vine): Look, Use utility knife. Bounds (548,590), 44×60 art px. When: Story-defined actions only; see linked scene and per-action visibility in asset brief.. [Vine tying the limb](../objects/rotten-vine.md).

## Sprites used by targets

- [Fresh bear tracks](../objects/bear-tracks.md) — 160×50 art px. Anchor (380,598), ground; warning onwards.
- [Broken forest brush](../objects/torn-brush.md) — 150×120 art px. Anchor (940,540), rear; all forest phases.
- [Forest fallen log](../objects/fallen-log.md) — 330×150 art px. Anchor (800,590), rear; all forest phases.
- [Dead side limb](../objects/blocking-limb.md) — 210×70 art px. Anchor (535,675), world; before vine cut. Anchor (650,610), world; after moved.
- [Vine tying the limb](../objects/rotten-vine.md) — 44×60 art px. Anchor (570,650), world; before move. Anchor (685,585), world; after move.

## Separate visual-only objects and changing scenery

None.

## Foreground layers

- [Near forest leaf cut](../objects/forest-foreground.md) — 140×250 art px. Anchor (1200,590), foreground; all forest phases.

## Walking space, exits and staging

Return lane x=80..600 at y=636..690; bear staging x=820..1180. Move the side limb to y=610 so it no longer overlaps the return lane. Foreground foliage must leave tracks, vine and both fighters readable.

Huska waits near (580,650) before recall and returns to Kofi’s side before bear attacks. Bear enters from x=1030..1180 and stays real-sized against Kofi, without a new combat image in this pack. Final kill is behind the log; release leaves through right-hand cover. No actor corpse, carried carcass or blood overlay is requested.

- **Clearing / Amaneti** at (40,660): Left edge, available before encounter; after outcome it is the route home.

- Kofi: feet (390,670) art px; reference only.
- Huska: feet (580,650) art px; reference only.
- Bear staging only: feet (1030,650) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../layouts/deep-forest.svg). Preserve the scoped exceptions in this room's description.

## Sources

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
