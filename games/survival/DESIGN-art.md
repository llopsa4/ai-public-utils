# Survival art design

Settled by grilling with the user on 2026-11-20. This file records the decisions; the
look in words is the art bible [art/STYLE.md](art/STYLE.md); numbers are in
[art/SPEC.md](art/SPEC.md); the procedure is in [art/PIPELINE.md](art/PIPELINE.md); the work list is
[art/BATCHES.md](art/BATCHES.md); the task rows are in [PLAN.md](PLAN.md) *Phase D: art*.

## Who draws

**Codex draws; Claude never does** (user, 2026-11-20).
- Claude never draws, generates, edits or installs art: no images, Blender files, textures or
  atlases. Claude writes text (this design, the bible, prompts, batch briefs) and code (loader,
  animation, tools), and checks deliveries.
- Today's code-drawn placeholders stay until Codex's art replaces each key. Claude adds no new or
  improved placeholder drawings. New keys, and tests, use **plain grey boxes with the key name**,
  made by a script into the git-ignored `art/standins/`; they are never shipped or published.
- Installing art is Codex only. This overrides, for Survival art, the shared
  [workflow](../WORKFLOW.md)'s "Claude only" clause: while Codex is paused, art simply waits.

## Reference and land

- **Quality reference:** the hand-painted, semi-realistic HD sprites of the most recent 2D
  isometric Stronghold game (Crusader, Definitive Edition, 2025): its quality, warm light, readable
  silhouettes and baked soft shadows, not its desert palette. The reference is described in words only; prompts never name it
  and nothing is copied from it.
- **Land** (user, 2026-11-20): the **eastern Dakota homeland**: tallgrass prairie, lakes and
  woodland. Tall grasses and wildflowers on dark prairie soil; bur oak and basswood woodland;
  cottonwood and willow along the river and lake shores; the river valley's low wooded bluffs on
  the horizon. The geography is under *Needs review* in [CULTURE.md](CULTURE.md) until sourced.
  The map has no lake tiles yet: lakes appear in the title picture, and `tile_river` serves them if
  the map ever gains lakes.

## Scale and view

- Art is made at **2×** (ground tile 128×64) and shown at scale 0.5 in the unchanged 64×32 world,
  so it stays sharp at the maximum zoom of 2.
- Every animated thing has **8 facings** (S, SW, W, NW, N, NE, E, SE), all rendered; nothing is
  mirrored, so the light stays upper-left.

## People

- **Five models:** man, woman, elder man, elder woman, child (one model for both sexes). The sim
  gains a sex field (task AC4); no save code (saving is parked).
- **Family colour:** every frame has two aligned layers: `base` (everything, cloth in neutral
  grey) and `cloth` (cloth pixels only, greyscale). The game tints `cloth` with the family colour
  from `src/data/map.json`, so a new family is a new colour, not new art.
- **Cloth area:** the man's shirt and the woman's dress (dyed hide or cloth). Leggings, moccasins
  and belts stay natural hide.
- **Animations** (frames per facing):

  | Model | Animations | Frames |
  |---|---|---|
  | Man, woman | idle 4, walk 8, carry_walk 8, chop 6, build 6, gather 6, scrape 6, shoot 6, thrust 6, strike 6, tend 4, fish 6, dance 8, sit 2, die 6 | 88 |
  | Elder man, elder woman | idle 4, walk 8, carry_walk 8, gather 6, scrape 6, tend 4, fish 6, dance 8, sit 2, die 6 | 58 |
  | Child | idle 4, walk 8, carry_walk 8, gather 6, dance 8, sit 2 | 36 |

  Flee plays walk at 1.5×. Carry uses one generic hide-wrapped bundle. A child who dies fades out
  (no death animation). Fishing is a spear held in the shallows; dancing is a plain social step in
  everyday clothes, no regalia and no ceremony. Fishing and dancing as activities get their own
  spec later.

## Animals and riders

| Model | Animations (frames per facing) |
|---|---|
| Wolf (also the pack leader and the guardian, by tint and scale) | idle 4, walk 8, run 6, attack 6, die 6 |
| Deer | idle 4, graze 6, walk 8, run 6, die 6 |
| Bison | idle 4, graze 6, walk 8, run 6, die 6 |
| Horse (herd, corral) | idle 4, graze 6, walk 8, run 6 |
| Mounted rider (a mounted lancer: man on a horse, base + cloth) | idle 4, walk 8, gallop 6, thrust 6, die 6 |
| Carcass (deer, bison, wolf) | 3 stages (full, half, bones), 1 facing |
| Fish | jump 4, 1 facing |

Riders only thrust (`combat.ts` gives the rider no bow). A woman lancer on a horse is drawn with
the man rider model: a known limit, listed as an optional later model.

## Terrain and seasons

- 5 ground types (grass, river, ford, forest floor, berry ground) × 4 seamless variants.
- Land tiles beside water get one of **15 bank tiles** (masks 1-15; mask 0 is plain ground) chosen by which of their 4 edge neighbours
  are water. Forest floor and berry ground get 4 feathered **spill overlays** each (one per edge),
  drawn on a neighbouring grass tile. All water tiles share one edge colour band, so river and ford
  join without seams.
- Trees, bushes, rocks, grass tufts and the felled-tree stump are separate sprites.
- **Seasons:** ground, banks, spills, trees, bushes and tufts have 4 versions (spring green, summer
  gold, autumn copper and russet, winter snow with ice at the river edges). Buildings keep one design
  and get a full winter (snow) render. People and animals do not change.

## Buildings

- Every building: 3 construction stages + finished + winter. The fire plaza starts built, so it
  has no stages. The barricade has 16 connection pieces, each with stages, finished and winter.
- Loops: the drying rack 4 frames (meat swaying). Flames of the fire plaza and fire pit are a
  separate `fx_flame` loop drawn on top; smoke and sparks stay code particles. Corral horses are
  horse sprites placed by code. The open store is the store with its roof cut away.

## Effects and UI

- **Painted effects:** arrow (one sprite rotated by code, plus a stuck arrow), spirit ally
  (translucent pale blue, float loop of 6, 1 facing), storm swirl 8, hit dust 4 (no blood), foot
  dust 4, build sparkle 6, flame 8. Selection rings, order pings, health bars and the placement
  ghost stay code-drawn.
- **UI skin:** 9-slice panels of tanned hide in a pole frame, buttons in 4 states, painted bar
  frames, 64×64 icons (resources, jobs, orders, upgrades, powers, seasons, speed), painted cursors,
  a title picture (the camp at dusk) and an emblem. The font is Alegreya (OFL), bundled. Title
  text is drawn by code in that font, never painted (the working title may change).

## Production

- Everything animated, plus buildings and barricade pieces, is modelled in **Blender** (free
  software, 5.1 on this PC) with hand-painted textures and rendered by one shared camera script
  (`art/source/render.py`). Base and cloth come out as aligned render passes.
- Image generation makes concept sheets, textures, seamless square ground textures (a script skews
  them into exact diamonds), trees, bushes, rocks and tufts (seasons by image editing), icons, UI
  and the title.
- The Blender sources, textures and `render.py` are committed in `art/source/` (no LFS).
- **Code first:** Claude builds all support code (rows AC1-AC9) and tests it with grey stand-ins
  of the exact sizes, so installing a delivery is mechanical for Codex.
- **Approval:** the user approves the style-key batches AB0 (still art) and AB12 (human rig).
  Claude approves later batches against the bible and the approved keys, from a contact sheet and
  in-game screenshots; the user sees every sheet and may reject any time.

## Budget

About 13 atlas pages of 2048² (≈210 MB GPU, ≈30 MB PNG); cap 16 pages, with a loading bar. If the
performance check (AC9) fails, people cells drop to 1.5× and Codex re-renders; the user is told.

## Tests

- `npm run art:validate` (AC1): every manifest key has a matching cell size, anchor, layer, facing,
  frame count and a 2 px empty border; `final` keys have `approvedBy`.
- Grey stand-ins (AC2) at full size load, animate and tint in the game with no console errors.
- Performance (AC9): ≥ 55 fps with 200 people at zoom 0.5 using full stand-in atlases.
- Each install: unit tests, `npm run e2e`, screenshots at zoom 0.5, 1 and 2.
