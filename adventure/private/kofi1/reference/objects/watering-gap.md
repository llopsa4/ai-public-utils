# Watering path gap

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `watering-gap` · object · **target**

## Description

Clear packed-earth strip between garden and pen edge.

## What the game does with it

Look

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1035,620) art px / (517.5,310) logical; ground; months.

## States, visibility and transitions

- **idle** — No obstruction. When: Visible beneath garden-panel; remains beneath it when gate opens..

Use a transparent ground-detail overlay to show worn strip; no opaque barrier in background.

## Asset contract

- Canvas: **110×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-watering-gap-idle.png`.

## Sources

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
