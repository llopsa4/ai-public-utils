# Loose bark strips

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `loose-bark` · object · **target**

## Description

Long curled dry bark strips lying off the fallen tree.

## What the game does with it

Use axe; Take; Twist rope

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (220,535) art px / (110,267.5) logical; world; building.

## States, visibility and transitions

- **loose** — Several intact long strips. When: Before axe preparation..
- **stripped** — Small residual flakes at stock. When: Strips taken; bulk is hidden and carried material becomes inventory resource..

Do not remove bark from living tall tree. Rope-making consumes carried strips once.

## Technical

- Canvas: **120×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-loose-bark-loose.png`, `kofi1-loose-bark-stripped.png`.

## Prompt for Codex

Long curled dry bark strips lying off the fallen tree. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
