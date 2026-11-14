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

## Technical

- Canvas: **190×180 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-coop-open.png`, `kofi1-coop-closed.png`, `kofi1-coop-escape-open.png`.

## Prompt for Codex

Woven-and-wood coop on low legs with a front gate and a distinct basket-release catch. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
