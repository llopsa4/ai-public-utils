# Survival asset register

One row per asset key in `art/manifest.json` once it has a final PNG or an open art request.
Placeholders drawn in code need no row. Procedure: [PIPELINE.md](PIPELINE.md); sizes:
[SPEC.md](SPEC.md). Every planned key and its batch is listed in [BATCHES.md](BATCHES.md); a key gets
a row here when Codex delivers or installs it (Codex writes the rows; Claude never installs art).

| Key | Size | Anchor | Frames | Status | Request / approval |
|---|---|---|---|---|---|
| `tile_grass` | 128 x 64 | 0.5, 0.5 | 4 variants x 4 seasons (16) | final | AB3 rev 4, Claude approved in K19 on 2026-11-23; summer grass unchanged from user-approved AB0 |
| `building_tipi` | 384 x 512 | 0.5, 0.75 | 5 construction and seasonal states | final | AB0 rev 1, user approved 2026-11-22 |
| `ui_panel` | 96 x 96 | centre | 1 | final | AB1 rev 1, Claude approved 2026-11-22; unchanged from user-approved AB0 |
| `ui_button` | 96 x 48 | centre | 4 button states | final | AB1 rev 1, Claude approved 2026-11-22; unchanged from user-approved AB0 |
| `icon_food` | 64 x 64 | centre | 1 | final | AB0 rev 1, user approved 2026-11-22 |
| `building_store_open` | 640 x 768 | 0.5, 0.75 | 1 finished cutaway | final | AB11 rev 3, Claude K24 approved 2026-11-23; installed unchanged |
| `ui_bar_frame` | 64 x 24 | centre | 1 carved wooden 9-slice | final | AB1 rev 1, Claude approved 2026-11-22 |
| `ui_bar_fill` | 8 x 16 | centre | 1 tinted strip | final | AB1 rev 1, Claude approved 2026-11-22 |
| `ui_emblem` | 512 x 512 | centre | 1 round camp badge | final | AB1 rev 1, Claude approved 2026-11-22 |
| `art/title.jpg` | 2560 x 1440 | screen centre | 1 opaque JPEG | final | AB7 rev 1, Claude approved 2026-11-22; emblem reused from installed AB1 |
| `fx_arrow` | 64 x 16 | centre | 1 | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_arrow_stuck` | 32 x 32 | 0.5, 0.75 | 1 | final | AB6 rev 1, Claude approved 2026-11-22 |
| `ally_spirit` | 128 x 160 | 0.5, 0.8 | 6 float | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_storm` | 384 x 384 | centre | 8 loop | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_hit` | 64 x 64 | 0.5, 0.75 | 4 burst | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_dust` | 64 x 64 | 0.5, 0.75 | 4 puff | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_sparkle` | 128 x 128 | 0.5, 0.75 | 6 rise | final | AB6 rev 1, Claude approved 2026-11-22 |
| `fx_flame` | 128 x 192 | 0.5, 0.875 | 8 loop | final | AB6 rev 1, Claude approved 2026-11-22 |
| `building_trap` | 256 x 256 | 0.5, 0.625 | 5 construction and seasonal states | final | AB8 rev 1, Claude approved 2026-11-22 |
| `building_fire_pit` | 256 x 256 | 0.5, 0.625 | 5 construction and seasonal states | final | AB8 rev 1, Claude approved 2026-11-22 |
| `building_barricade` | 256 x 256 | 0.5, 0.625 | 5 states x 16 masks (80) | final | AB8 rev 1, Claude approved 2026-11-22 |
| `building_gathering_spot` | 384 x 512 | 0.5, 0.75 | 5 construction and seasonal states | final | AB9 rev 2, Claude approved in K14 on 2026-11-23 |
| `building_hunting_lodge` | 384 x 512 | 0.5, 0.75 | 5 construction and seasonal states | final | AB9 rev 2, Claude approved in K14 on 2026-11-23 |
| `building_drying_rack` | 384 x 512 | 0.5, 0.75 | 3 construction states + two 4-frame loops (11) | final | AB9 rev 2, Claude approved in K14 on 2026-11-23 |
| `building_horse_corral` | 384 x 512 | 0.5, 0.75 | 5 construction and seasonal states | final | AB9 rev 2, Claude approved in K14 on 2026-11-23 |
| `icon_wood` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_hides` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_pemmican` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_gift` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_people` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_horses` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_wotakuye` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_hungry` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_gather` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_hunt` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_chop` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_dry` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_scout` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_drill` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_tend` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_heal` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_build` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_haul` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_fight` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_fish` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_job_dance` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_move` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_attack` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_draft` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_undraft` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_hold` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_defend` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_chase` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_order_delete` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_dogs` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_bows` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_healers` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_scouts` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_warriors` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_builders` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_barricades` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_horses` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_riders` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_tools` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_spirits` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_spirit_warriors` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_guardian_wolves` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_bison_charge` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_upgrade_storm_caller` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_season_spring` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_season_summer` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_season_autumn` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_season_winter` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_speed_pause` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_speed_1x` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_speed_2x` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `icon_speed_4x` | 64 x 64 | centre | 1 | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `cursor_pointer` | 32 x 32 / 64 x 64 | hotspot per SPEC section 10 | 1x + 2x (2) | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `cursor_move` | 32 x 32 / 64 x 64 | hotspot per SPEC section 10 | 1x + 2x (2) | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `cursor_attack` | 32 x 32 / 64 x 64 | hotspot per SPEC section 10 | 1x + 2x (2) | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `cursor_build` | 32 x 32 / 64 x 64 | hotspot per SPEC section 10 | 1x + 2x (2) | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `cursor_invalid` | 32 x 32 / 64 x 64 | hotspot per SPEC section 10 | 1x + 2x (2) | final | AB2 rev 2, Claude approved in K15 on 2026-11-23 |
| `tile_forest` | 128 x 64 | 0.5, 0.5 | 4 variants x 4 seasons (16) | final | AB3 rev 4, Claude approved in K19 on 2026-11-23 |
| `tile_berry` | 128 x 64 | 0.5, 0.5 | 4 variants x 4 seasons (16) | final | AB3 rev 4, Claude approved in K19 on 2026-11-23 |
| `tile_river` | 128 x 64 | 0.5, 0.5 | 4 variants x 4 seasons (16) | final | AB3 rev 4, Claude approved in K19 on 2026-11-23 |
| `tile_ford` | 128 x 64 | 0.5, 0.5 | 4 variants x 4 seasons (16) | final | AB3 rev 4, Claude approved in K19 on 2026-11-23 |
| `tree_bur_oak` | 256 x 320 | 0.375, 0.9 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `tree_basswood` | 256 x 320 | 0.375, 0.9 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `tree_cottonwood` | 256 x 320 | 0.375, 0.9 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `tree_willow` | 256 x 320 | 0.375, 0.9 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `bush_chokecherry` | 128 x 128 | 0.5, 0.75 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `bush_plum` | 128 x 128 | 0.5, 0.75 | 8 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `rock_boulder` | 128 x 128 | 0.5, 0.75 | 12 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `tuft_grass` | 128 x 128 | 0.5, 0.75 | 12 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `stump_tree` | 128 x 128 | 0.5, 0.75 | 4 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `item_basket` | 32 x 32 | 0.5, 1 | 1 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `item_log` | 32 x 32 | 0.5, 1 | 1 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `item_hides` | 32 x 32 | 0.5, 1 | 1 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `item_bag` | 32 x 32 | 0.5, 1 | 1 | final | AB5 rev 2, Claude approved in K16 on 2026-11-23 |
| `bank_river` | 128 x 64 | 0.5, 0.5 | 60: 15 masks x 4 seasons | final | AB4 rev 1, Claude approved in K20 on 2026-11-23 |
| `spill_forest` | 128 x 64 | 0.5, 0.5 | 16: 4 directional feathered edges x 4 seasons | final | AB4 rev 1, Claude approved in K20 on 2026-11-23 |
| `spill_berry` | 128 x 64 | 0.5, 0.5 | 16: 4 directional feathered edges x 4 seasons | final | AB4 rev 1, Claude approved in K20 on 2026-11-23 |
| `building_healers_lodge` | 384 x 512 | 0.5, 0.75 | 5 states | `atlas/buildings.json` | AB10 rev 2, Claude K22 approved 2026-11-23; installed unchanged |
| `building_scouts_lodge` | 384 x 512 | 0.5, 0.75 | 5 states | `atlas/buildings.json` | AB10 rev 2, Claude K22 approved 2026-11-23; installed unchanged |
| `building_lancers_lodge` | 384 x 512 | 0.5, 0.75 | 5 states | `atlas/buildings.json` | AB10 rev 2, Claude K22 approved 2026-11-23; installed unchanged |
| `building_archers_lodge` | 384 x 512 | 0.5, 0.75 | 5 states | `atlas/buildings.json` | AB10 rev 2, Claude K22 approved 2026-11-23; installed unchanged |
| `building_spirit_lodge` | 384 x 512 | 0.5, 0.75 | 5 states | `atlas/buildings.json` | AB10 rev 2, Claude K22 approved 2026-11-23; installed unchanged |
| `fire_central` | 640 x 768 | 0.5, 0.75 | 2 finished/winter | final | AB11 rev 3, Claude K24 approved 2026-11-23; installed unchanged |
| `building_store` | 640 x 768 | 0.5, 0.75 | 5 construction/season states | final | AB11 rev 3, Claude K24 approved 2026-11-23; installed unchanged |
| `person_man` | 192 x 160 | 0.5, 0.8 | 88 x 8 facings x base/cloth (1408) | final | AB13 rev 2, Claude approved in K25 on 2026-11-23; complete man animation library |
| `person_woman` | 192 x 160 | 0.5, 0.8 | 88 x 8 facings x base/cloth (1408) | final | AB14 rev 2, 2026-11-23; Claude K27 approved; installed unchanged; shared AB13-r2 rig/actions, revised braids, hem, cape sleeves and yoke beads; archived in `inbox/done/AB14-r2/` |
| `person_elder_man` | 192 x 160 | 0.5, 0.8 | 58 x 8 facings x base/cloth (928) | final, installed | AB15 rev 1, 2026-11-23; approved Claude K29; stooped, grey braids, family-tinted loose shirt; `inbox/done/AB15-r1/review.html` |
| `person_elder_woman` | 192 x 160 | 0.5, 0.8 | 58 x 8 facings x base/cloth (928) | final, installed | AB16 rev 1, 2026-11-24; approved Claude K30; approved AB14-r2 rig/dress, grey chest braids, stoop and shorter stride; `inbox/done/AB16-r1/review.html` |
