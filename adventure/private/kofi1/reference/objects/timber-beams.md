# Prepared lift beams

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `timber-beams` · object · **target**

## Description

Squared rough timber prepared from fallen stock, pale cut ends.

## What the game does with it

Look; load cradle; lift with helpers

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (930,565) art px / (465,282.5) logical; world; building stock.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,520) art px / (435,260) logical; world; loaded cradle.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,335) art px / (435,167.5) logical; world; raised test beam.

## States, visibility and transitions

- **idle** — One timber design. When: Two stock instances before lift; selected test beam moves into cradle and rises. Hide lifted beam after secured platform composite replaces it at montage..

Stock count remains consistent; helper actions move one beam. No beam duplicated at ground and in air.

## Technical

- Canvas: **160×36 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-timber-beams-idle.png`.

## Prompt for Codex

Squared rough timber prepared from fallen stock, pale cut ends. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
