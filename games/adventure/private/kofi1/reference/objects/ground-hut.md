# Ground shelter frame and wall

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `ground-hut` · object · **target**

## Description

Round reed-frame shelter represented front-on with a plain doorway, ochre clay finish.

## What the game does with it

Look; Apply reeds; Apply daub

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,524) art px / (500,262) logical; rear; building through months.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (745,524) art px / (372.5,262) logical; rear; months second home.

## States, visibility and transitions

- **frame** — Bare poles and simple roof ribs. When: Building starts, primary instance only..
- **reed** — Reed mesh attached to frame. When: Reed bundles installed..
- **daubed** — Wet daub covers mesh; no finished dry roof claim. When: Daub applied..
- **finished** — Dry clay wall, thatch roof, plain doorway left empty for door overlay. When: Days-later montage onward; second instance appears months later..

Identical 220x280 frame in every state. Extra months-later huts use finished instances only, not extra player building tasks. Doors separately specified. Blank ground behind entire structure.

## Asset contract

- Canvas: **220×280 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-ground-hut-frame.png`, `kofi1-ground-hut-reed.png`, `kofi1-ground-hut-daubed.png`, `kofi1-ground-hut-finished.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
