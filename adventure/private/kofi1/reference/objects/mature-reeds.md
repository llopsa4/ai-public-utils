# Mature reed patch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `mature-reeds` · object · **target**

## Description

Tall buff reeds with dry seed heads; dense but flat readable stalks.

## What the game does with it

Look; Use axe

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (165,510) art px / (82.5,255) logical; rear; arrival and building.

## States, visibility and transitions

- **uncut** — Full mature stalks. When: Before axe use..
- **cut** — Short stubble and a few remaining outer stalks. When: After harvesting; cut patch remains visible..

Harvested bundles are separate sprites. Enough material for required wall; wrong uses cannot exhaust it.

## Asset contract

- Canvas: **170×180 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-mature-reeds-uncut.png`, `kofi1-mature-reeds-cut.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
