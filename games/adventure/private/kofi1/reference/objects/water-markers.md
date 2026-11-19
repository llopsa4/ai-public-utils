# Collection and washing markers

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `water-markers` · object · **visual**

## Description

Two plain upright stones with different natural shapes, no lettering.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (450,500) art px / (225,250) logical; world; after water convergence.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (90,590) art px / (45,295) logical; world; after water convergence.

## States, visibility and transitions

- **collection** — Tall thin plain stone. When: Place uphill when clean-water task completes..
- **washing** — Low broad plain stone. When: Place at downstream wash point on convergence..

Two distinct instances/states of one visual family. Never use the only shim or rite offering. Runtime labels explain purpose.

## Asset contract

- Canvas: **40×40 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-water-markers-collection.png`, `kofi1-water-markers-washing.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
