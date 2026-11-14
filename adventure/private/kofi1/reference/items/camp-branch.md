# Inventory icon: Camp fire-brand branch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## What the game does with it

[World object, source scenes and disappearance rules](../objects/camp-branch.md). The icon replaces the room instance while carried.

## Description

Loose dry fire stick with one broad broken end, initially caught in the separate dead bough, then dislodged onto clean ground by a wooden blunt arrow.

## Technical

64×64, transparent, same silhouette/material identity, no text or border. Draw only these carried forms:

- **kofi1-item-camp-branch-unlit**: collected before lighting File: `kofi1-item-camp-branch-unlit.png`.
- **kofi1-item-camp-branch-lit**: after lighting, before camp fight File: `kofi1-item-camp-branch-lit.png`.

## Prompt for Codex

Draw the named carried forms at icon scale, following the linked world brief. No installed-state, hidden-state or extra prop images. Production waits for a separate request.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Index](../INDEX.md)
