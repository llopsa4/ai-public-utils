# Survival asset register

One row per asset key in `art/manifest.json` once it has a final PNG or an open art request.
Placeholders drawn in code need no row. Procedure: [PIPELINE.md](PIPELINE.md); sizes:
[SPEC.md](SPEC.md). Every planned key and its batch is listed in [BATCHES.md](BATCHES.md); a key gets
a row here when Codex delivers or installs it (Codex writes the rows; Claude never installs art).

| Key | Size | Anchor | Frames | Status | Request / approval |
|---|---|---|---|---|---|
| `tile_grass` | 128 x 64 | 0.5, 0.5 | 4 summer variants | final for summer | AB0 rev 1, user approved 2026-11-22 |
| `building_tipi` | 384 x 512 | 0.5, 0.75 | 5 construction and seasonal states | final | AB0 rev 1, user approved 2026-11-22 |
| `ui_panel` | 96 x 96 | centre | 1 | final | AB1 rev 1, Claude approved 2026-11-22; unchanged from user-approved AB0 |
| `ui_button` | 96 x 48 | centre | 4 button states | final | AB1 rev 1, Claude approved 2026-11-22; unchanged from user-approved AB0 |
| `icon_food` | 64 x 64 | centre | 1 | final | AB0 rev 1, user approved 2026-11-22 |
| `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, `icon_people`, `icon_horses` | 32 x 32 | centre | 1 | placeholder (code) | none yet; shown 16 x 16 before each number in the HUD bar |
| `building_store_open` | 256 x 208 | 0.5, 0.75 | 1 | placeholder (code) | none yet; the store's cutaway on hover: no roof, low front walls, empty floor |
| `item_basket`, `item_log`, `item_hides`, `item_bag` | 16 x 16 | bottom centre | 1 each | placeholder (code) | none yet; small isometric props (2:1 projection) inside the open store: a basket of fruit, a log, a bundle of hides, a pemmican bag; one per fortieth of the camp's capacity (`ceil(40 x amount / capacity)`: 20 food, 15 wood, 4 hides, 10 pemmican for one store), drawn 1x on the floor grid |
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
