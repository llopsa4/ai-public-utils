# Tsalohi goat bell and strap

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bell` · object · **target**

## Description

Dented dull-brass goat bell; a small clapper and simple leather suspension, no engraving.

## What the game does with it

Take; Use as offering; Look

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (278,490) art px / (139,245) logical; world; gatepost after repair.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (784,560) art px / (392,280) logical; world; rite old-home offering. Attached to rite-circle-riverbank-0, offset (84,-40).

## States, visibility and transitions

- **worn-strap** — Bell with short frayed strap. When: Initially attached to nanny costume reference, then gatepost; hidden while on Kofi..
- **repaired-strap** — Same bell with a sound plain leather strap. When: Returned after rite and retained on Kofi’s belt..

One identity. Nanny-to-post-to-belt-to-circle-to-belt: never display two copies. Actor belt attachment is reference only; no rig modification in this pack.

## Technical

- Canvas: **16×24 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-bell-worn-strap.png`, `kofi1-bell-repaired-strap.png`.

## Prompt for Codex

Dented dull-brass goat bell; a small clapper and simple leather suspension, no engraving. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
