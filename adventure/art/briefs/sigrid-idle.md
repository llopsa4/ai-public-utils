# sigrid-idle

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `sigrid-idle` · pack · **visual** · requested

## Description

Captain Sigrid of Ironhaven (she/her), about 35, a main character: tall (nearly Mara's height) and fit, an athletic soldier's build like Mara's but a woman's: strong shoulders and arms, a lean waist, powerful legs, upright and balanced like a fencer. Long, loose, untied brunette hair; a healed diagonal scar on her right cheek only (seen when she faces right, hidden when she faces left); grey watchful eyes, a composed, assessing face. A dark-blue winter officer's coat with brass buttons and a short snowy fur collar, with chipped, repaired ivory ceramic protection worked into it (shoulder, chest and ribs, forearms). Her artifact is Nessa's mechanically extendable sword: while she walks or stands only its compact hilt shows, clipped to her belt at the rear hip, with no blade and no scabbard (leather grip, ceramic pommel, a folded brass heat-sink guard, a ceramic chamber with a copper coil, an activation button, a flush emitter collar); at the press of the button physical blade sections extend and lock together, with ceramic channels and copper joints (a mechanical blade, never an energy blade). No shield, no other weapon. Dark breeches, tall black boots. Her standing picture when still: the same figure, clothes and scale as the master, turned a little more towards us (a slight three-quarter view), both eyes visible. Weight even, back straight, her near hand resting easily on the sword hilt, the other relaxed at her side; a level, assessing look and the faintest composed half-smile, the mouth closed.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Captain Sigrid of Ironhaven (she/her), about 35, a main character: tall (nearly Mara's height) and fit, an athletic soldier's build like Mara's but a woman's: strong shoulders and arms, a lean waist, powerful legs, upright and balanced like a fencer. Long, loose, untied brunette hair; a healed diagonal scar on her right cheek only (seen when she faces right, hidden when she faces left); grey watchful eyes, a composed, assessing face. A dark-blue winter officer's coat with brass buttons and a short snowy fur collar, with chipped, repaired ivory ceramic protection worked into it (shoulder, chest and ribs, forearms). Her artifact is Nessa's mechanically extendable sword: while she walks or stands only its compact hilt shows, clipped to her belt at the rear hip, with no blade and no scabbard (leather grip, ceramic pommel, a folded brass heat-sink guard, a ceramic chamber with a copper coil, an activation button, a flush emitter collar); at the press of the button physical blade sections extend and lock together, with ceramic channels and copper joints (a mechanical blade, never an energy blade). No shield, no other weapon. Dark breeches, tall black boots. Her standing picture when still: the same figure, clothes and scale as the master, turned a little more towards us (a slight three-quarter view), both eyes visible. Weight even, back straight, her near hand resting easily on the sword hilt, the other relaxed at her side; a level, assessing look and the faintest composed half-smile, the mouth closed. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/sigrid-layered/idle.png. Status: requested. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about 1435 px from head to sole (head top near y 65), horizontally centred, the same scale as Mara's master.png. In the game she stands 228 art px (Mara is 232).

Exactly the same scale and soles line as master.png. This is the picture the game shows whenever she stands still, and her dialogue portrait is cut from its head (so the face must be clear and well lit).

Match the format of Mara's: art/sources/characters/mara-casual-layered/idle.png.

## Asset contract

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/sigrid-idle.png`.

## Sources

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
