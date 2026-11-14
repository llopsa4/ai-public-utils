# Clearing work board

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `work-board` · object · **target**

## Description

Rough work surface on low supports, plain and portable-looking.

## What the game does with it

Look; Twist rope

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (490,570) art px / (245,285) logical; world; building onwards.

## States, visibility and transitions

- **idle** — Bare scored worktop. When: Always after clearing unlock; rope/cups separate overlays..

Top at art y=460, consistent with table height. Two grief cups placed on top in one brief beat, never as painted permanent decoration.

## Technical

- Canvas: **180×110 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-work-board-idle.png`.

## Prompt for Codex

Rough work surface on low supports, plain and portable-looking. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
