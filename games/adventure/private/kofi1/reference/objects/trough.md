# Salvaged trough and foot stand

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `trough` · object · **target**

## Description

Shallow wooden trough with crossed assembly slots and pale worn marks.

## What the game does with it

Look; Take; Use strips; Install at seep

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (245,570) art px / (122.5,285) logical; world; camp communal kit, selected survivor variant.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (805,540) art px / (402.5,270) logical; world; water-a kit. Stage forms: water-a → unassembled; water-b → assembled.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (360,500) art px / (180,250) logical; world; assembled at seep.

## States, visibility and transitions

- **unassembled** — Trough lacking crossed feet; slots visible. When: Enali route before scraps fitted..
- **assembled** — Crossed feet attached; stand complete but not level. When: Both strips fitted, or Deyu route supplied complete..
- **level** — Same stand level with both feet contacting the shelf. When: Enali route shim placed; Deyu route installed at prepared level patch..

One identity and one stand in either route. Enali route uses a separate shim and screen. Deyu route supplies assembled trough plus fitted screen; no duplicate stock trough remains at bundle. Frame width/height fixed; same base anchor for all states.

## Asset contract

- Canvas: **150×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-trough-unassembled.png`, `kofi1-trough-assembled.png`, `kofi1-trough-level.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
