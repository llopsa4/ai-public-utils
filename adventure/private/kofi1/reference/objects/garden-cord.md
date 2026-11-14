# Garden gate hinge cord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `garden-cord` · object · **target**

## Description

Short coarse rope coil for lashing a flexible hinge.

## What the game does with it

Take; Use on panel

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1190,470) art px / (595,235) logical; world; months rack.

## States, visibility and transitions

- **coiled** — Loose short coil. When: At rack until taken..
- **bound** — Two small lashing loops. When: Use at gate; coil hides and panel shows attachment loops within its frame..

Not the light arrow cord; cannot steal earlier rig progress or produce a second gate.

## Technical

- Canvas: **44×32 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-garden-cord-coiled.png`, `kofi1-garden-cord-bound.png`.

## Prompt for Codex

Short coarse rope coil for lashing a flexible hinge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
