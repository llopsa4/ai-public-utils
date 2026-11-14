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

## Technical

- Canvas: **220×280 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-ground-hut-frame.png`, `kofi1-ground-hut-reed.png`, `kofi1-ground-hut-daubed.png`, `kofi1-ground-hut-finished.png`.

## Prompt for Codex

Round reed-frame shelter represented front-on with a plain doorway, ochre clay finish. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
