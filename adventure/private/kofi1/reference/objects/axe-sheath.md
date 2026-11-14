# Saluna’s axe sheath

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `axe-sheath` · object · **target**

## Description

Empty worn hide axe-head sheath with a short carrying loop.

## What the game does with it

Take; Use on Huska for scent

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (900,530) art px / (450,265) logical; world; building bundle.

## States, visibility and transitions

- **idle** — Empty sheath with no axe. When: Available with Saluna’s permission; Take hides bundle sprite; scent action leaves sheath carried until axe found, then return to communal tools..



## Technical

- Canvas: **50×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-axe-sheath-idle.png`.

## Prompt for Codex

Empty worn hide axe-head sheath with a short carrying loop. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
