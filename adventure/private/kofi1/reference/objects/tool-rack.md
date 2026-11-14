# Amaneti communal tool rack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `tool-rack` · object · **target**

## Description

Compact repaired rack with empty tool hooks and supply basket shelf.

## What the game does with it

Look; Go hunting after disputes

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1150,530) art px / (575,265) logical; world; months.

## States, visibility and transitions

- **idle** — Rack with clear empty hooks. When: Months onwards; all removable contents separate..

Knife and fire carrier take place automatically on Go hunting; garden panel, pin, cord, braces and hand-rope have separate pickup positions.

## Technical

- Canvas: **100×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-tool-rack-idle.png`.

## Prompt for Codex

Compact repaired rack with empty tool hooks and supply basket shelf. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
