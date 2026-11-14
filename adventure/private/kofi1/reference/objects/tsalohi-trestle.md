# Deyu’s trestle

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `tsalohi-trestle` · object · **visual**

## Description

Worn trestle top with tool marks and crossed wooden feet.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (750,574) art px / (375,287) logical; world; evening.
- [Tsalohi at evening](../rooms/tsalohi.md): anchor (340,525) art px / (170,262.5) logical; world; rescue.

## States, visibility and transitions

- **upright** — Level worktop. When: Evening chores..
- **fallen** — One end dropped over ledge, leaving an actor-sized clearance under near end. When: Enali pinned during rescue..
- **lifted** — Near end raised enough for Enali to withdraw. When: Enali chosen; hides with left ledge after escape..

The rescue placement is a deliberate set-piece repositioning during tremor. Pot, cloth, cross-pin and boat remain separate. This trestle does not survive to the clearing.

## Technical

- Canvas: **230×122 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-tsalohi-trestle-upright.png`, `kofi1-tsalohi-trestle-fallen.png`, `kofi1-tsalohi-trestle-lifted.png`.

## Prompt for Codex

Worn trestle top with tool marks and crossed wooden feet. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
