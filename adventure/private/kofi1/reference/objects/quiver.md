# Kofi’s flat quiver

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `quiver` · object · **visual**

## Description

Flat hide quiver with ordinary wooden arrow ends, tight to the back in travel references.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (950,480) art px / (475,240) logical; world; on town rack.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (195,480) art px / (97.5,240) logical; world; on hut rack.

## States, visibility and transitions

- **idle** — Flat quiver with arrows. When: On rack until collected; hidden while attached to actor; stowed again at hut entry..

One carried quiver, never visible on rack and actor simultaneously. Ordinary arrows only.

## Technical

- Canvas: **46×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-quiver-idle.png`.

## Prompt for Codex

Flat hide quiver with ordinary wooden arrow ends, tight to the back in travel references. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
