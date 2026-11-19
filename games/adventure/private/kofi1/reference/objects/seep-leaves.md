# Leaves covering seep inflow

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `seep-leaves` · object · **target**

## Description

Loose brown leaves lodged above the upper run.

## What the game does with it

Look; Use bank twig

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (370,415) art px / (185,207.5) logical; overlay; water-b.

## States, visibility and transitions

- **covering** — Leaves hide inflow but not whole water location. When: Deyu route until twig used..
- **cleared** — Leaves gathered at side of same frame; inflow open. When: Twig action; retain as sidelined litter, never re-cover on revisit..

No covering leaves in Enali route; source is directly inspectable there.

## Asset contract

- Canvas: **120×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-seep-leaves-covering.png`, `kofi1-seep-leaves-cleared.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
