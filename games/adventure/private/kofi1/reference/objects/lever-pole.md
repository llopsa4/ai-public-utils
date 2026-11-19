# Short levering pole

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `lever-pole` · object · **target**

## Description

Straight stout wooden pole with worn flattened end.

## What the game does with it

Take; Use on beam; rejected gap reach

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (550,610) art px / (275,305) logical; world; on floor before Take / after completion.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (890,490) art px / (445,245) logical; world; levering reference.

## States, visibility and transitions

- **idle** — Plain straight pole. When: Take hides floor sprite; held pole and lever placement are mutually exclusive; after wedge inserted return to hand, then floor at ending..

Use rotation of same prop for leverage, keep actor hands separate. Cannot retrieve arrow because too broad.

## Asset contract

- Canvas: **150×18 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-lever-pole-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
