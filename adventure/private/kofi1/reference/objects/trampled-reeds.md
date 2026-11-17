# Trampled reed search spot

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `trampled-reeds` · object · **target**

## Description

Bent wet reed stalks, a small muddy depression with no axe painted in.

## What the game does with it

Look; Search after Huska scent

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (240,570) art px / (120,285) logical; world; building search.

## States, visibility and transitions

- **covered** — Bent stalks conceal the small tool head. When: Before Huska searches after smelling sheath..
- **searched** — Stalks pushed aside; empty backing reveals separate axe overlay. When: After search; remains empty once axe taken..

Hotspot unlock is triggered by the scent action; no duplicate axe in the searched art. Separate from large mature and young reed patches.

## Asset contract

- Canvas: **100×80 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-trampled-reeds-covered.png`, `kofi1-trampled-reeds-searched.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
