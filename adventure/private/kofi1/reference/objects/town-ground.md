# Square floor overlay

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `town-ground` · object · **visual**

## Description

Rough packed earth and broad repaired stone patches; no props.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,720) art px / (320,360) logical; ground; evening to collapse.

## States, visibility and transitions

- **intact** — Unbroken supporting ground. When: Evening..
- **split** — Narrow fissure divides stone patches but stable inland path remains. When: Warning and coop escape; hide at rescue staging..

Full-width overlay on plain Rift backing. Central footing and ledges replace this layer during rescue, not on top of a permanently painted solid floor.

## Asset contract

- Canvas: **1280×196 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-town-ground-intact.png`, `kofi1-town-ground-split.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
