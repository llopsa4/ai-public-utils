# Survival art batches

Every image the game needs, split into Codex batches. Each section is the **assignment** the
shared [workflow](../../WORKFLOW.md#approval) requires: ID, brief revision, allowed paths, output,
sizes and states, prompts, validation and Approval authority. Codex follows
[PIPELINE.md](PIPELINE.md) for every batch; the look is [STYLE.md](STYLE.md) (Rule 1: Codex draws,
Claude never does); numbers are [SPEC.md](SPEC.md). Task rows (order, needs) are in
[PLAN.md](../PLAN.md) *Phase D: art*.

## Common to every batch

- **Brief revision:** this file at revision 1 (2026-11-20). A later edit by Claude bumps the
  revision of the batches it changes.
- **Allowed paths (generation):** `art/source/**`, `art/inbox/<batch>/**`,
  `handoff/from-codex.md`. **Allowed paths (install, after approval):** `art/atlas/**`,
  `art/manifest.json`, `art/ASSETS.md`, `art/inbox/done/**`, `art/title.jpg` (AB7 only).
- **Output:** frames named per SPEC.md section 8 in `art/inbox/<batch>/<key>/`, `delivery.json`,
  `contact.png`.
- **Validation:** `npm run art:validate -- --inbox <batch>` passes; PIPELINE.md *Checks*; after
  install, the PIPELINE.md *Installing* tests and screenshots.
- **Prompts:** the STYLE.md section 12 template named in the batch, with the subject wording
  given; the exact prompts used go into `delivery.json`.

## AB0 — Style keys (look approval)

- **Approval authority: user.** Can start at once; installs after AC1-AC3.
- **Purpose:** fix the look before anything else is made. Everything later must match this.
- **Contents:**
  - `tile_grass` summer, variants 0-3 (ground texture template: "dense tallgrass prairie seen
    from above in summer: tall green grasses with golden seedheads, bronze-red stems and a few
    small white, purple and yellow wildflowers").
  - `building_tipi`, all 5 states, in Blender. This batch builds `art/source/render.py` (buildings
    mode, SPEC.md section 2) and `art/source/textures/hide_tanned.png`, `wood_pole.png`.
  - `ui_panel` and `ui_button` (4 states) (panel template).
  - `icon_food` (icon template: "a haunch of roasted meat on a plain wooden board").
  - Man concept sheet (concept template, STYLE.md section 5 *Man*), delivered as
    `art/inbox/AB0/concept/person_man.png` (not installed).
- **Done when:** the user approves the contact sheet and the in-game screenshot (tipi on grass,
  panel and food icon in the HUD).

## AB1 — Interface pieces

- **Approval authority: Claude.** Needs AC1-AC3, AC8.
- **Keys:** `ui_panel`, `ui_button` (from AB0, unchanged unless the user asked), `ui_bar_frame`,
  `ui_bar_fill`, `ui_emblem` (SPEC.md section 10).
- **Prompts:** panel template; the bar frame "a thin carved wooden frame for a horizontal bar";
  the emblem per STYLE.md section 10.
- **Done when:** the HUD, selection panel, build cards, menu and minimap use the skin with no
  stretched corners at 1280×720 and 2560×1440.

## AB2 — Icons and cursors

- **Approval authority: Claude.** Needs AC1-AC3, AC8.
- **Keys:** every icon in SPEC.md section 10 except `icon_food` (done in AB0) and the 5 cursors
  (32×32 and @2x 64×64).
- **Subjects** (icon template, one object each):

  | Key | Object |
  |---|---|
  | `icon_wood` | three cut oak logs |
  | `icon_hides` | a folded tanned hide |
  | `icon_pemmican` | a small hide bag with a round dried cake beside it |
  | `icon_gift` | a tied bundle of folded hides with a plain rust band |
  | `icon_people` | head and shoulders of a person with two braids, seen from behind, in silhouette-like painting |
  | `icon_horses` | a horse's head and neck |
  | `icon_wotakuye` | two hands clasped (plain, no symbols) |
  | `icon_hungry` | an empty wooden bowl |
  | `icon_job_gather` | a woven basket with berries |
  | `icon_job_hunt` | a plain bow and arrow |
  | `icon_job_chop` | a stone axe in a log |
  | `icon_job_dry` | meat strips on a pole |
  | `icon_job_scout` | a tall lookout pole with a small plain pennant |
  | `icon_job_drill` | two crossed plain lances |
  | `icon_job_tend` | a coiled rope halter |
  | `icon_job_heal` | a bundle of dried plain herbs |
  | `icon_job_build` | a stone maul and a stake |
  | `icon_job_haul` | a hide bundle with a tumpline |
  | `icon_job_fight` | a short wooden club |
  | `icon_job_fish` | a fishing spear and a fish |
  | `icon_job_dance` | two footprints in dust, side by side |
  | `icon_order_move` | a footprint |
  | `icon_order_attack` | a lance point |
  | `icon_order_draft` | a club raised in a hand |
  | `icon_order_undraft` | a club laid down on the ground |
  | `icon_order_hold` | a lance planted upright |
  | `icon_order_defend` | a round rawhide shield, plain |
  | `icon_order_chase` | running footprints |
  | `icon_order_delete` | a pulled-up stake |
  | `icon_upgrade_dogs` | a dog sitting |
  | `icon_upgrade_bows` | two plain bows |
  | `icon_upgrade_healers` | a healer's herb bundle and a bowl |
  | `icon_upgrade_scouts` | a scout's lookout pole |
  | `icon_upgrade_warriors` | a plain lance and a club crossed |
  | `icon_upgrade_builders` | a stone maul and lashing rope |
  | `icon_upgrade_barricades` | three sharpened stakes |
  | `icon_upgrade_horses` | a horse standing |
  | `icon_upgrade_riders` | a horse at gallop with a plain lance above it |
  | `icon_upgrade_tools` | a stone axe and a scraper |
  | `icon_upgrade_spirits` | a small pale-blue glowing wisp (invented) |
  | `icon_upgrade_spirit_warriors` | a translucent pale-blue figure with a lance (invented) |
  | `icon_upgrade_guardian_wolves` | a pale glowing wolf head |
  | `icon_upgrade_bison_charge` | a bison charging, dust behind it |
  | `icon_upgrade_storm_caller` | a swirl of grey-blue storm cloud and rain |
  | `icon_season_spring` | a new green shoot |
  | `icon_season_summer` | a tall bluestem grass head under a sun disc |
  | `icon_season_autumn` | a rust-red oak leaf |
  | `icon_season_winter` | a snow-covered branch |
  | `icon_speed_pause` | an open hand, palm out |
  | `icon_speed_1x` | one footprint |
  | `icon_speed_2x` | two footprints |
  | `icon_speed_4x` | four footprints running |

- **Cursors:** per STYLE.md section 10, hotspots per SPEC.md section 10.
- **Done when:** every icon reads at 16×16 in a contact strip at 1×.

## AB3 — Ground

- **Approval authority: Claude.** Needs AC1-AC3, AC5.
- **Keys:** `tile_grass`, `tile_forest`, `tile_berry`, `tile_river`, `tile_ford`; 4 seasons ×
  4 variants each (80 tiles; `tile_grass` summer 0-3 come from AB0).
- **Prompts:** ground texture template with STYLE.md section 7 wording per type and season.
- **Done when:** a 12×12 tile field of each type and season shows no seams and no visible repeat
  at zoom 1; river and ford meet without a line.

## AB4 — River banks and spills

- **Approval authority: Claude.** Needs AB3 installed.
- **Keys:** `bank_river` (masks 1-15 × 4 seasons = 60), `spill_forest` and `spill_berry`
  (4 edges × 4 seasons = 32).
- **Method:** composed from AB3's tiles with painted blend masks (mud band and reeds; winter: ice
  rim) per SPEC.md section 6.
- **Done when:** the generated map's whole river shows soft banks with no hard diamond edges
  except accepted inner-corner notches; forests and berry patches fade into grass.

## AB5 — Plants, rocks and store items

- **Approval authority: Claude.** Needs AC1-AC3, AC5.
- **Keys:** `tree_bur_oak`, `tree_basswood`, `tree_cottonwood`, `tree_willow` (2 × 4 each),
  `bush_chokecherry`, `bush_plum` (2 × 4), `rock_boulder` (3 × 4), `tuft_grass` (3 × 4),
  `stump_tree` (1 × 4), `item_basket`,
  `item_log`, `item_hides`, `item_bag` (SPEC.md section 7). The trees replace the old
  placeholder key `object_tree`.
- **Prompts:** plant/rock template; items with the icon template's object wording but in the
  store's 2:1 projection on #00FF00.
- **Done when:** an oak woodland and a riverside grove in all 4 seasons read as the same trees
  changing; items sit on
  the open-store floor grid.

## AB6 — Effects

- **Approval authority: Claude.** Needs AC1-AC3, AC6, AC7.
- **Keys:** `fx_arrow`, `fx_arrow_stuck`, `ally_spirit` (float 6, invented pale-blue person),
  `fx_storm` (8), `fx_hit` (4), `fx_dust` (4), `fx_sparkle` (6), `fx_flame` (8).
- **Method:** image generation for each frame from one base painting edited per frame, or a
  Blender render where noted in the delivery; loops must not jump.
- **Done when:** the effects play in game (a hunt, a storm cast, a finished build, the fire) with
  no visible loop jump.

## AB7 — Title picture and emblem check

- **Approval authority: Claude.** Needs AC8.
- **Keys:** `art/title.jpg` (2560×1440, STYLE.md section 10, title template); `ui_emblem` reused
  from AB1.
- **Done when:** the menu shows the picture with the code-drawn title readable in its calm top
  area.

## AB8 — Small buildings

- **Approval authority: Claude.** Needs AC1-AC3, AC6.
- **Keys:** `building_trap`, `building_fire_pit` (5 states each), `building_barricade` (5 states
  × 16 masks) (SPEC.md section 5), in Blender with `render.py` from AB0.
- **Done when:** a dragged barricade line in an L and a T shape joins cleanly; stages show while
  building.

## AB9 — Camp buildings

- **Approval authority: Claude.** Needs AB0, AC6.
- **Keys:** `building_gathering_spot`, `building_hunting_lodge`, `building_drying_rack` (loops),
  `building_horse_corral` (all 5 states); `building_tipi` re-rendered only if AB0 asked for it.
- **Done when:** each building fills its 2×2 diamond exactly, in all states and in winter.

## AB10 — Society lodges

- **Approval authority: Claude.** Needs AB9.
- **Keys:** `building_healers_lodge`, `building_scouts_lodge`, `building_lancers_lodge`,
  `building_archers_lodge`, `building_spirit_lodge` (all 5 states).
- **Done when:** the five read as distinct at 1× by their props, sharing one construction style.

## AB11 — Fire plaza and store

- **Approval authority: Claude.** Needs AB9, AC6.
- **Keys:** `fire_central` (`finished`, `winter`), `building_store` (5 states),
  `building_store_open` (`finished`, matching the store exactly with the roof removed).
- **Done when:** store items sit on the open floor; the flame loop sits in the hearth.

## AB12 — Human rig (look approval for figures)

- **Approval authority: user.** Needs AC1-AC4.
- **Contents:** `art/source/human_rig.blend` (one rig for the man and woman, scaled variants for
  elders and the child), `render.py` extended for rigged figures with `base` and `cloth` passes,
  and `person_man` **walk** in all 8 facings (base + cloth) as the key frames.
- **Done when:** the user approves the man walking in 8 facings in game, in both family tints.

## AB13 — Man

- **Approval authority: Claude.** Needs AB12.
- **Key:** `person_man`, every animation in SPEC.md section 4 (88 frames × 8 facings × 2 layers).
  The man and woman replace the old placeholder key `person_adult` (the elders replace `person_elder`).
- **Done when:** a camp of men shows every job animation, the dance and the death, in both tints.

## AB14 — Woman

- **Approval authority: Claude.** Needs AB13.
- **Key:** `person_woman`, the same set as the man (STYLE.md section 5 *Woman*).

## AB15 — Elder man

- **Approval authority: Claude.** Needs AB13.
- **Key:** `person_elder_man` (58 frames × 8 × 2; stooped, grey hair).

## AB16 — Elder woman

- **Approval authority: Claude.** Needs AB14.
- **Key:** `person_elder_woman` (58 frames × 8 × 2).

## AB17 — Child

- **Approval authority: Claude.** Needs AB12.
- **Key:** `person_child` (36 frames × 8 × 2).

## AB18 — Wolf

- **Approval authority: Claude.** Needs AC7.
- **Key:** `animal_wolf` (30 frames × 8); `carcass_wolf` (3 stages) may come in AB23.
- **Done when:** a wave shows wolves, the pack leader (scaled, darker) and the guardian (pale).

## AB19 — Deer

- **Approval authority: Claude.** Needs AC7. **Key:** `animal_deer` (30 frames × 8).

## AB20 — Bison

- **Approval authority: Claude.** Needs AC7. **Key:** `animal_bison` (30 frames × 8); the
  stampede power reuses its run.

## AB21 — Horse

- **Approval authority: Claude.** Needs AC7. **Key:** `animal_horse` (24 frames × 8); shown in
  the corral and the herd.

## AB22 — Mounted rider

- **Approval authority: Claude.** Needs AB13, AB21.
- **Key:** `person_rider` (30 frames × 8 × 2): the man model on the horse model, plain lance.

## AB23 — Carcasses and fish

- **Approval authority: Claude.** Needs AB18-AB20.
- **Keys:** `carcass_deer`, `carcass_bison`, `carcass_wolf` (`stage1`-`stage3`, 1 facing),
  `animal_fish` (jump 4).
- **Done when:** a hunted deer and bison shrink through the stages as meat is taken.
