# Stool front-leg cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `stool-front` · foreground · **foreground**

## Description

Only near stool legs and near seat lip, matching hut-stool registration exactly.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1090,610) art px / (545,305) logical; foreground; all hut phases. Attached to hut-stool-kofi-hut-0, offset (0,0).

## States, visibility and transitions

- **idle** — Transparent near-leg cut. When: Always when stool present; depth over robot hiding actor..

Counterpart hut-stool omits these exact pixels; no double outline. Not a separately movable stool.

## Technical

- Canvas: **100×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-stool-front-idle.png`.

## Prompt for Codex

Only near stool legs and near seat lip, matching hut-stool registration exactly. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
