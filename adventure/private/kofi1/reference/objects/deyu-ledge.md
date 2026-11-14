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

## Asset contract

- Canvas: **390×170 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-deyu-ledge-hanging.png`, `kofi1-deyu-ledge-falling.png`.

## Sources

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
