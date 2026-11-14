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

## Technical

- Canvas: **200×80 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-beam-cradle-empty.png`, `kofi1-beam-cradle-loaded.png`.

## Prompt for Codex

Wooden yoke with simple load lashings and a legible attachment point. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
