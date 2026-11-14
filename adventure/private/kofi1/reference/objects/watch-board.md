# Scratched watch board

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `watch-board` · object · **target**

## Description

Dark worn board with a blank writing face; bindings to shelter post visible.

## What the game does with it

Look; record agreed rota

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (570,440) art px / (285,220) logical; world; months. Attached to watch-shelter-woodland-clearing-0, offset (0,-84).

## States, visibility and transitions

- **unwritten** — Blank face with worn texture. When: Before arrangement recorded..
- **recorded** — Same blank plate, runtime markings over it. When: After shared watch agreement and writing action.. Reuse existing artwork or hide the instance; no separate drawing.

Do not paint readable names or an invented script into art. Repeated marks, names and rota text are runtime overlays in later implementation, survivor name conditional there. Recorded is a semantic state using same PNG.

## Technical

- Canvas: **100×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-watch-board-unwritten.png`.

## Prompt for Codex

Dark worn board with a blank writing face; bindings to shelter post visible. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
