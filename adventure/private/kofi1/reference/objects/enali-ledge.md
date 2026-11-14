# Enali’s left ledge

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `enali-ledge` · object · **visual**

## Description

Broken slab of timber floor and packed earth beneath the trestle.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (340,650) art px / (170,325) logical; ground; rescue.

## States, visibility and transitions

- **hanging** — Cracked edge with trestle supported above it. When: Both candidates present before confirmation..
- **falling** — Small separation from supporting wall. When: Deyu chosen; animate down/hide with Enali and trestle. If Enali chosen, hold until she escapes, then hide..

Never bake Enali into ledge. No corpse or injury image. Equal visual emphasis to Deyu’s ledge.

## Technical

- Canvas: **390×170 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-enali-ledge-hanging.png`, `kofi1-enali-ledge-falling.png`.

## Prompt for Codex

Broken slab of timber floor and packed earth beneath the trestle. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
