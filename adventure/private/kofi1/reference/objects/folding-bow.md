# Kofi’s original folding bow

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `folding-bow` · object · **visual**

## Description

Deyu’s handmade gift to Kofi: rough shaped wood, leather hinges, a plain catch and lashing; no brass fittings or machine spring. The limbs fold alongside the grip for carrying along Kofi’s leg.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (920,480) art px / (460,240) logical; world; on town rack.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (145,480) art px / (72.5,240) logical; world; on travel rack.

## States, visibility and transitions

- **folded** — Folded narrow bow. When: Visible on rack before collection; otherwise attached to Kofi’s travelling rig reference; returned to hut rack at evening..
- **unfolded** — Opened wooden bow, same 38x150 schematic frame is a rack reference only. When: No new actor pose in this pack; use approved source references for action artwork later.. Reuse existing artwork or hide the instance; no separate drawing.

Unfolded action art is excluded, not incorrectly squeezed into the rack canvas: only folded room sprite is commissioned. State named unfolded is an excluded actor reference, no output PNG.

Only the folded room sprite is produced in this pack. Its wood silhouette occupies about 110 art pixels of the padded 150-pixel canvas; unfolded actor art is excluded.

Inventory Use toggles folded/unfolded functionality. Both the blunt-arrow camp shot and later cord-arrow shot require it unfolded. The displayed inventory icon may stay folded; do not commission new actor poses here.

Runtime now uses kofi-test-bow-drawn, a separate geometric placeholder with aligned left/right 224x224 frames, a bent limb, pulled-back string and nocked arrow. It is shown before utility shots and in combat, held while Aimed shot is prepared, then cleared on release or cancellation. This does not authorise final character art or change the folded rack-sprite canvas.

## Technical

- Canvas: **38×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-folding-bow-folded.png`.

## Prompt for Codex

Deyu’s handmade gift to Kofi: rough shaped wood, leather hinges, a plain catch and lashing; no brass fittings or machine spring. The limbs fold alongside the grip for carrying along Kofi’s leg. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
