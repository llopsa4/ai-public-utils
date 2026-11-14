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

## Technical

- Canvas: **260×110 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-amaneti-pen-standing.png`.

## Prompt for Codex

New rough timber-and-reed fence with a clear watering-path opening; rails repaired from available wood, no animals painted in. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
