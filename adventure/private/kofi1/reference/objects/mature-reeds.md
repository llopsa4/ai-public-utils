# Mature reed patch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `mature-reeds` · object · **target**

## Description

Tall buff reeds with dry seed heads; dense but flat readable stalks.

## What the game does with it

Look; Use axe

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (165,510) art px / (82.5,255) logical; rear; arrival and building.

## States, visibility and transitions

- **uncut** — Full mature stalks. When: Before axe use..
- **cut** — Short stubble and a few remaining outer stalks. When: After harvesting; cut patch remains visible..

Harvested bundles are separate sprites. Enough material for required wall; wrong uses cannot exhaust it.

## Technical

- Canvas: **170×180 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-mature-reeds-uncut.png`, `kofi1-mature-reeds-cut.png`.

## Prompt for Codex

Tall buff reeds with dry seed heads; dense but flat readable stalks. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
