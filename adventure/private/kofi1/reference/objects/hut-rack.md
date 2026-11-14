# Kofi’s travel rack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hut-rack` · object · **visual**

## Description

Simple wall pegs and a low shelf beside doorway, empty attachment sites.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (170,524) art px / (85,262) logical; rear; all hut phases.

## States, visibility and transitions

- **idle** — Plain wood and pegs. When: Always; bow, quiver, knife and carrier attached separately..

Rack itself does not disappear when travel kit is taken in future chapters.

## Technical

- Canvas: **110×220 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-hut-rack-idle.png`.

## Prompt for Codex

Simple wall pegs and a low shelf beside doorway, empty attachment sites. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
