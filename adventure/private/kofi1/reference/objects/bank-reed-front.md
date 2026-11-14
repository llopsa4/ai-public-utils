# Near-bank reed cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bank-reed-front` · foreground · **foreground**

## Description

Small foreground tuft at far-left water edge, not harvestable mature patch.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (50,630) art px / (25,315) logical; foreground; all bank phases.

## States, visibility and transitions

- **idle** — Sparse near reed silhouette. When: Always; do not obscure shore pickup or walking feet..

Foreground only; no hidden pickup behind this tuft.

## Technical

- Canvas: **80×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-bank-reed-front-idle.png`.

## Prompt for Codex

Small foreground tuft at far-left water edge, not harvestable mature patch. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
