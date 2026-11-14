# New garden bed

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `garden` · object · **target**

## Description

Low growing rows of edible greens inside an earth border.

## What the game does with it

Look

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (920,610) art px / (460,305) logical; ground; rite markers then months.

## States, visibility and transitions

- **marked** — Bare soil with plain stick corners. When: Weeks-later rite..
- **bitten** — Rows with several bitten new shoots. When: Months arrival before agreement..
- **protected** — Same plants, no miraculous regrowth. When: Gate and browse agreement complete; remain bitten today.. Reuse existing artwork or hide the instance; no separate drawing.

Protected uses same drawing as bitten unless new physical change actually needed; no separate PNG for dialogue-only status. Runtime condition keeps identity.

## Technical

- Canvas: **160×64 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-garden-marked.png`, `kofi1-garden-bitten.png`.

## Prompt for Codex

Low growing rows of edible greens inside an earth border. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
