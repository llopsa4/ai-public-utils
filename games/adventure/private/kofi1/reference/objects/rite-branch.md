# Tall-tree offering branch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rite-branch` · object · **target**

## Description

Loose dry side shoot with one small fork, no fresh cut or green leaves.

## What the game does with it

Take from platform; Use on tree space

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (835,300) art px / (417.5,150) logical; world; rite platform source.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,578) art px / (337.5,289) logical; world; rite tree space. Attached to rite-circle-riverbank-0, offset (-25,-22).

## States, visibility and transitions

- **idle** — Loose dead branch. When: Visible on low platform only after construction; hide on Take; show once in circle; stored at months jump..

No second bow shot; no branch left attached after pickup. Small residual broken socket belongs to separate target-branch scenery if needed.

## Asset contract

- Canvas: **88×26 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rite-branch-idle.png`.

## Sources

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
