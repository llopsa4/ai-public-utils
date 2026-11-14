# Dead branch support / empty socket

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `dead-shoot` · object · **visual**

## Description

Small dry socket on platform edge, separate from living target fork.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (835,305) art px / (417.5,152.5) logical; rear; rite.

## States, visibility and transitions

- **idle** — Empty dry socket with no loose branch. When: Stays after rite-branch pickup; loose branch overlays it before Take..

Do not draw another complete offering branch in this residual asset.

## Technical

- Canvas: **50×22 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-dead-shoot-idle.png`.

## Prompt for Codex

Small dry socket on platform edge, separate from living target fork. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
