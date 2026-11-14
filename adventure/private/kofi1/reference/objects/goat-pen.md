# Tsalohi goat pen

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `goat-pen` · object · **visual**

## Description

Low worn split-wood fence, empty inside and clear of the gate opening.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (180,590) art px / (90,295) logical; rear; evening and coop escape.

## States, visibility and transitions

- **standing** — Repaired rails. When: Before rescue; hide with falling town..

Animals are never painted into fence. Gate and latch are separate.

## Technical

- Canvas: **280×160 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-goat-pen-standing.png`.

## Prompt for Codex

Low worn split-wood fence, empty inside and clear of the gate opening. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
