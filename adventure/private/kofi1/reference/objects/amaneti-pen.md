# Amaneti goat enclosure

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `amaneti-pen` · object · **visual**

## Description

New rough timber-and-reed fence with a clear watering-path opening; rails repaired from available wood, no animals painted in.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1070,600) art px / (535,300) logical; rear; months and afternoon, behind garden gate.

## States, visibility and transitions

- **standing** — Fence rails around a plain empty pen footprint, with watering opening left empty. When: Months-later arrival onward; garden-panel fills the existing opening only after installed..

New enclosure built in Amaneti, not the Tsalohi pen restored. Draw the opening at world x=983..1087 to register with garden-panel at anchor (1035,610). Browse, goats, gate panel, hinge cord and latch pin are separate. Fence does not cross the front walking corridor.

## Asset contract

- Canvas: **260×110 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-amaneti-pen-standing.png`.

## Sources

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
