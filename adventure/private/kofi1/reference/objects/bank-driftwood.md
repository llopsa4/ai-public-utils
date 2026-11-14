# Bank driftwood

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bank-driftwood` · object · **visual**

## Description

Short washed pale wood below the clay face, no long rope-making bark.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (570,565) art px / (285,282.5) logical; ground; arrival onwards.

## States, visibility and transitions

- **idle** — Weathered small lengths. When: Always; no resource quota..

Large bark source is in clearing. Do not accidentally suggest missing platform materials still live here.

## Technical

- Canvas: **140×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-bank-driftwood-idle.png`.

## Prompt for Codex

Short washed pale wood below the clay face, no long rope-making bark. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
