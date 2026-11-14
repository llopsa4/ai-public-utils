# Inventory icon: Ladder hand-rope

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## What the game does with it

[World object, source scenes and disappearance rules](../objects/hand-rope.md). The icon replaces the room instance while carried.

## Description

Knotted support rope with plain bindings at ends.

## Technical

64×64, transparent, same silhouette/material identity, no text or border. Draw only these carried forms:

- **kofi1-item-hand-rope**: coiled: the single carried form File: `kofi1-item-hand-rope.png`.

## Prompt for Codex

Draw the named carried forms at icon scale, following the linked world brief. No installed-state, hidden-state or extra prop images. Production waits for a separate request.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Index](../INDEX.md)
