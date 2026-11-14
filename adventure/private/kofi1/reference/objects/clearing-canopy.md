# Tall-tree foreground canopy cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `clearing-canopy` · foreground · **foreground**

## Description

Near hanging leaf clusters from tall tree, crisp silhouettes with transparent gaps.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1050,140) art px / (525,70) logical; foreground; all clearing phases.

## States, visibility and transitions

- **idle** — Edge of crown only. When: Always; keep target fork, huts and ladder tops readable..

Trunk/root structural shape is background. No duplicate canopy painted under this cut.

## Technical

- Canvas: **260×140 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-clearing-canopy-idle.png`.

## Prompt for Codex

Near hanging leaf clusters from tall tree, crisp silhouettes with transparent gaps. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
