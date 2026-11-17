# silas-cloak-master

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-cloak-master` · pack · **visual** · final

## Description

Silas, the con man (he/him), about 30, a bit mad and very eccentric: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture, restless hands. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes that are a touch too bright, a wide lopsided grin always halfway to a joke, short black hair sticking up in odd tufts after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw. Here in his own travelling cloak: a long, dark, worn wool cloak with a deep hood, the hood UP and framing his face like a cowl, the whole face clearly visible and lit (no shadow over the eyes), the cloak open at the front over his waistcoat and shirt, falling to mid-calf. The walk master: standing in profile facing right, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body so no arm hides the torso or the other arm). Only one eye shows (profile).

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Silas, the con man (he/him), about 30, a bit mad and very eccentric: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture, restless hands. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes that are a touch too bright, a wide lopsided grin always halfway to a joke, short black hair sticking up in odd tufts after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw. Here in his own travelling cloak: a long, dark, worn wool cloak with a deep hood, the hood UP and framing his face like a cowl, the whole face clearly visible and lit (no shadow over the eyes), the cloak open at the front over his waistcoat and shirt, falling to mid-calf. The walk master: standing in profile facing right, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body so no arm hides the torso or the other arm). Only one eye shows (profile). When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/silas-cloak-layered/master.png. Status: final. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about 1409 px from head to sole (head top near y 91), horizontally centred, the same scale as Mara's master.png. In the game he stands 220 art px (Mara is 232).

This drawing is the anatomy every later piece is cut from and must recompose exactly: draw clean, separate limbs (nothing overlapping that would be hard to split at the shoulders, elbows, hips, knees and ankles).

The cloak belongs to the torso layer down to mid-thigh; below that, draw its lower part as separate back and front panels on the far and near thigh layers, so it swings with the stride and never hides a leg completely.

Also deliver, in the same folder, the clerk guise as mask layers over this pack (like silas-layered/mask-clerk-*): mask-clerk-hood-stand.png, mask-clerk-hood-kneel.png, mask-clerk-hood-lie.png (the hood pulled lower over the brow, the face still visible from the eyes down) and mask-clerk-ledger.png (the ledger held to the chest by the near forearm).

Match the format of Mara's: art/sources/characters/mara-casual-layered/master.png.

## Asset contract

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/silas-cloak-master.png`.

## Sources

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-intro.md)
