# Shared waterskin

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `waterskin` · object · **visual**

## Description

Small patched hide water carrier with wooden stopper.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (200,570) art px / (100,285) logical; world; camp.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (890,570) art px / (445,285) logical; world; arrival and water.

## States, visibility and transitions

- **idle** — Closed patched waterskin. When: Carried by villagers between locations; rests beside bundle. Retires to communal storage after water task..

Visible communal kit, not a new player refill puzzle.

## Technical

- Canvas: **42×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-waterskin-idle.png`.

## Prompt for Codex

Small patched hide water carrier with wooden stopper. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
