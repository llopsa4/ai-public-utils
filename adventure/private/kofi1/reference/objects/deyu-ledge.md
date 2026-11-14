# Deyu’s right ledge

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `deyu-ledge` · object · **visual**

## Description

Broken landing and snapped rail base, consistent scale with left ledge.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (940,650) art px / (470,325) logical; ground; rescue.

## States, visibility and transitions

- **hanging** — Cracked rail edge. When: Both candidates present before confirmation..
- **falling** — Slab breaks free. When: Enali chosen; animate down/hide with Deyu and rail. If Deyu chosen, hold until he escapes, then hide..

Deyu is an independent actor hanging at the edge; do not draw him into terrain.

## Technical

- Canvas: **390×170 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-deyu-ledge-hanging.png`, `kofi1-deyu-ledge-falling.png`.

## Prompt for Codex

Broken landing and snapped rail base, consistent scale with left ledge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
