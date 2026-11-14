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

## Technical

- Canvas: **110×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-watering-gap-idle.png`.

## Prompt for Codex

Clear packed-earth strip between garden and pen edge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
