# Shared refuge ladder

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `refuge-ladder` · object · **target**

## Description

Lashed wood ladder in same scale as family ladder.

## What the game does with it

Look

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1090,590) art px / (545,295) logical; world; months.

## States, visibility and transitions

- **idle** — Sound rungs. When: Months jump onward..

Second independent ladder, no duplicate family-ladder inventory item.

## Technical

- Canvas: **60×230 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-refuge-ladder-idle.png`.

## Prompt for Codex

Lashed wood ladder in same scale as family ladder. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
