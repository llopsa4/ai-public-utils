# Chicken coop and transport catch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `coop` · object · **target**

## Description

Woven-and-wood coop on low legs with a front gate and a distinct basket-release catch.

## What the game does with it

Look; Use grain; Open; Close

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (1060,590) art px / (530,295) logical; world; evening to escape.

## States, visibility and transitions

- **open** — Front feeding gate open. When: Before chickens fed..
- **closed** — Front gate closed; transport catch still fastened. When: After grain and Close..
- **escape-open** — Gate and transport catch released. When: Collapse Open action; hide as basket and people clear the gate..

No chickens baked in. Feed gate and escape-release catch are part of same state frame; story distinguishes the two uses.

## Asset contract

- Canvas: **190×180 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-coop-open.png`, `kofi1-coop-closed.png`, `kofi1-coop-escape-open.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
