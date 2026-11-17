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

## Asset contract

- Canvas: **100×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-watch-board-unwritten.png`.

## Sources

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
