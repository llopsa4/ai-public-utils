# Swept shavings basket

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `shavings-basket` · object · **visual**

## Description

Small rough basket with a few pale wood curls.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (390,570) art px / (195,285) logical; world; rite and months.

## States, visibility and transitions

- **idle** — Low basket and sparse shavings. When: After construction montage; nonblocking background detail, still a separate prop..



## Technical

- Canvas: **64×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-shavings-basket-idle.png`.

## Prompt for Codex

Small rough basket with a few pale wood curls. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
