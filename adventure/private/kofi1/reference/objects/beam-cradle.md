# Beam lifting cradle

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `beam-cradle` · object · **target**

## Description

Wooden yoke with simple load lashings and a legible attachment point.

## What the game does with it

Look; attach load rope

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,585) art px / (435,292.5) logical; world; building.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,400) art px / (435,200) logical; world; during lift.

## States, visibility and transitions

- **empty** — Open yoke with no beam. When: Before timber loaded..
- **loaded** — Same yoke and attachment, beam remains separate. When: Beam selected and rope attached; animate up to raised placement; retire after securing platform..

Cradle drawing never includes worker or beam. Same anchor frame in both states.

## Asset contract

- Canvas: **200×80 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-beam-cradle-empty.png`, `kofi1-beam-cradle-loaded.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
