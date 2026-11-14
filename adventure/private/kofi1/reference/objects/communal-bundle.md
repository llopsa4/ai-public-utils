# Communal salvaged bundle

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `communal-bundle` · object · **visual**

## Description

Cloth-wrapped shared kit with a tied flap, baskets and tools separate.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (120,610) art px / (60,305) logical; world; camp.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (850,600) art px / (425,300) logical; world; arrival through building.

## States, visibility and transitions

- **closed** — Flap tied down. When: Carried or resting before inspection..
- **open** — Flap back showing empty inner cloth, contents separate. When: After inspection until tasks complete..

Contents are independently hidden on collection; never paint cord, strips, screen or pot into the open state.

## Technical

- Canvas: **120×76 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-communal-bundle-closed.png`, `kofi1-communal-bundle-open.png`.

## Prompt for Codex

Cloth-wrapped shared kit with a tied flap, baskets and tools separate. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
