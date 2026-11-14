# Dry gap beneath hearth stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hearth-gap` · object · **target**

## Description

Dark narrow horizontal opening under outer stone edge, clean empty floor below.

## What the game does with it

Look; invite retrieval when arrow present

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (720,598) art px / (360,299) logical; ground; all hut phases.

## States, visibility and transitions

- **empty** — Opening with no shaft inside. When: Always behind arrow; arrow changes separately..

Gap never contains painted arrow or creature hands. Separate from firebox.

## Technical

- Canvas: **90×26 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-hearth-gap-empty.png`.

## Prompt for Codex

Dark narrow horizontal opening under outer stone edge, clean empty floor below. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
