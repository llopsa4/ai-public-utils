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

## Technical

- Canvas: **40×40 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-water-markers-collection.png`, `kofi1-water-markers-washing.png`.

## Prompt for Codex

Two plain upright stones with different natural shapes, no lettering. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
