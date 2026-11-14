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

## Technical

- Canvas: **100×80 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-trampled-reeds-covered.png`, `kofi1-trampled-reeds-searched.png`.

## Prompt for Codex

Bent wet reed stalks, a small muddy depression with no axe painted in. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
