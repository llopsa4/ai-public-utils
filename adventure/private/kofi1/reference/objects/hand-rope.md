# Ladder hand-rope

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hand-rope` · object · **target**

## Description

Knotted support rope with plain bindings at ends.

## What the game does with it

Take; Use on family ladder

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1180,440) art px / (590,220) logical; world; months rack.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (775,580) art px / (387.5,290) logical; world; installed beside family ladder. Attached to family-ladder-woodland-clearing-0, offset (-45,-10).

## States, visibility and transitions

- **coiled** — Compact coil near bottom of fixed canvas. When: At rack until taken..
- **hung** — Straight hand-rope beside ladder. When: After Ahyeli requests and Kofi fits it; persists after practice..

One identity moves bank to clearing; not a third copy of load rope. Fixed canvas accommodates long hung variant.

## Technical

- Canvas: **44×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-hand-rope-coiled.png`, `kofi1-hand-rope-hung.png`.

## Prompt for Codex

Knotted support rope with plain bindings at ends. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
