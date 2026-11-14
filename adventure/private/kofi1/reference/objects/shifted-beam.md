# Shifted roof beam

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `shifted-beam` · object · **target**

## Description

Rough straight timber resting with one end on stone sill, pressure visible over net edge.

## What the game does with it

Look; Use pole; set wedge

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (860,460) art px / (430,230) logical; rear; arrival through settled. Attached to beam-sill-kofi-hut-0, offset (-40,-66).

## States, visibility and transitions

- **pinning** — Beam slopes down onto net edge. When: Entry..
- **raised** — Near end lifted to free net, same canvas. When: Pole lever held before wedge..
- **supported** — Beam stays raised on separate wedge. When: Wedge inserted; never lower after net freed..

State canvases identical; fixed far contact (local 350,120), moving near contact (local 150,140 to 150,110). Do not include pole, wedge, net, robot or Kofi. Wedge remains installed at ending despite general tool-return wording. Near underside is (800,450) while pinning and (800,420) while lifted; wedge apex reaches the latter from the sill cap at y=450.

## Technical

- Canvas: **420×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-shifted-beam-pinning.png`, `kofi1-shifted-beam-raised.png`, `kofi1-shifted-beam-supported.png`.

## Prompt for Codex

Rough straight timber resting with one end on stone sill, pressure visible over net edge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
