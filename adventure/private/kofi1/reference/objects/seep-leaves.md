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

## Technical

- Canvas: **120×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-seep-leaves-covering.png`, `kofi1-seep-leaves-cleared.png`.

## Prompt for Codex

Loose brown leaves lodged above the upper run. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
