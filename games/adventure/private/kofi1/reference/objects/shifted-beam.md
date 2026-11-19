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

## Asset contract

- Canvas: **420×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-shifted-beam-pinning.png`, `kofi1-shifted-beam-raised.png`, `kofi1-shifted-beam-supported.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
