# Opening ground crack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `ground-crack` · object · **visual**

## Description

Jagged dark fissure with dislodged clay edges, transparent outside the crack.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,640) art px / (320,320) logical; ground; warning and collapse.

## States, visibility and transitions

- **hairline** — Thin visible dark seam. When: Cup rattles and animals react..
- **open** — Wide split with broken edges. When: First tremor; hide when town-ground is replaced by ledges..

No crack before warning. Disappearance is hiding, not an empty sprite. Do not use this decorative strip to imply a safe crossing during rescue.

## Asset contract

- Canvas: **1100×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-ground-crack-hairline.png`, `kofi1-ground-crack-open.png`.

## Sources

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
