# Survival art spec

Every number an image must meet: camera, scale, cells, anchors, frames, names, layout and the
manifest. The look in words is [STYLE.md](STYLE.md) (read it first; its Rule 1: Codex draws,
Claude never does); the procedure is [PIPELINE.md](PIPELINE.md); the work list is
[BATCHES.md](BATCHES.md); the decisions are in [DESIGN-art.md](../DESIGN-art.md).

## 1. Scale and view

- **2× art:** every image is delivered at twice its display size; the game draws it at scale 0.5
  in the 64×32 world (`src/render/iso.ts` `TILE_W` 64, `TILE_H` 32 are unchanged).
- **Isometric 2:1:** a ground tile is a diamond of **128×64 px** (2×).
- **1 tile = 2.0 m.** Ground: 45.25 px per metre across; heights: 39.2 px per metre.
- **Depth:** the game sorts by the anchor's screen y; an anchor sits exactly where the object
  touches the ground (the footprint centre for buildings).

## 2. Blender camera and render (`art/source/render.py`)

| Setting | Value |
|---|---|
| Blender | 5.1 (`C:\Program Files\Blender Foundation\Blender 5.1\blender`), run headless: `blender -b <file>.blend -P art/source/render.py -- <key> [<anim>]` |
| Units | metric, 1 Blender unit = 1 m; the ground plane is z = 0; a model's ground point (feet, footprint centre) is at the world origin |
| Camera | orthographic; rotation X 60°, Y 0°, Z 45° (30° elevation: an exact 2:1 diamond); fixed for every render |
| Ortho scale | `cell_width_px / 45.25` metres for the cell being rendered (a 128-px cell = 2.829 m) |
| Camera shift | so that the world origin lands on the cell's anchor pixel |
| Render size | 2 × the cell (supersampling), then downscaled to the cell with Lanczos |
| Engine | EEVEE; film transparent; view transform Standard; look None; 64 samples |
| Sun | elevation 60°; azimuth so shadows fall to the screen's lower right (light from the upper left); colour #FFF1D6, strength 3.5; soft angle 4° |
| Fill | world colour #3A4660, strength 0.35 |
| Shadow catcher | a ground plane set as shadow catcher; its shadow is recoloured to #1C1A24 at 40% alpha in post |
| Facings | the model rotates about Z, camera fixed: s 0°, sw −45°, w −90°, nw −135°, n 180°, ne 135°, e 90°, se 45° (s = facing the viewer, down the screen); check: an `e` walk moves to the screen's right |
| Passes | `base`: everything (cloth material neutral grey #A8A8A8); `cloth`: a second pass with every non-cloth object as holdout, cloth shaded in greys (#E6E6E6 to #6E6E6E), so occluded cloth pixels are transparent |
| Frame timing | animations are keyed at 24 fps in Blender; `render.py` samples the frame count in SPEC evenly over one cycle |

Still art from image generation (ground, plants, icons, UI, title) does not use the camera; its
rules are in sections 6, 7 and 10.

## 3. Cells and anchors

The **cell** is the image size of one frame; the **anchor** is the Phaser origin (fraction of the
cell) and always lands on a whole pixel. Every frame keeps a **2 px fully transparent border**
(validator check). A model's ground point is at the anchor in every frame and facing.

| Kind | Cell (px) | Anchor | Anchor pixel |
|---|---|---|---|
| Person (man, woman, elders, child) | 192×160 | 0.5, 0.8 | 96, 128 |
| Mounted rider | 256×240 | 0.5, 0.8 | 128, 192 |
| Wolf, wolf carcass | 160×120 | 0.5, 0.8 | 80, 96 |
| Deer, deer carcass | 192×160 | 0.5, 0.8 | 96, 128 |
| Bison, horse, bison carcass | 224×200 | 0.5, 0.8 | 112, 160 |
| Fish | 64×80 | 0.5, 0.8 | 32, 64 (water surface) |
| Ground tile, bank, spill | 128×64 | 0.5, 0.5 | 64, 32 |
| Building 1×1 (and each barricade piece) | 256×256 | 0.5, 0.625 | 128, 160 |
| Building 2×2 | 384×512 | 0.5, 0.75 | 192, 384 |
| Building 4×4 | 640×768 | 0.5, 0.75 | 320, 576 |
| Tree | 256×320 | 0.375, 0.9 | 96, 288 (trunk base) |
| Bush, rock, tuft, stump | 128×128 | 0.5, 0.75 | 64, 96 |
| Store item | 32×32 | 0.5, 1.0 | 16, 32 |
| Spirit ally | 128×160 | 0.5, 0.8 | 64, 128 |
| Storm | 384×384 | 0.5, 0.5 | 192, 192 |
| Hit dust, foot dust | 64×64 | 0.5, 0.75 | 32, 48 |
| Build sparkle | 128×128 | 0.5, 0.75 | 64, 96 |
| Arrow (points right; the game rotates it) | 64×16 | 0.5, 0.5 | 32, 8 |
| Stuck arrow | 32×32 | 0.5, 0.75 | 16, 24 |
| Flame | 128×192 | 0.5, 0.875 | 64, 168 (hearth centre) |
| Icon | 64×64 | 0.5, 0.5 | 32, 32 |
| Cursor | 32×32 | hotspot (section 10) | |
| Panel (9-slice) | 96×96, 32 px corners | | |
| Button (9-slice) × 4 states | 96×48, 16 px corners | | |
| Bar frame (9-slice) | 64×24, 8 px corners | | |
| Bar fill (tinted by the game) | 8×16 | | |
| Emblem | 512×512 | 0.5, 0.5 | 256, 256 |
| Title picture | 2560×1440, opaque JPEG quality 85 | | |

- **Building footprints:** the footprint diamond (1×1: 128×64, 2×2: 256×128, 4×4: 512×256) is
  centred on the anchor pixel; the cell leaves 64 px on the left, right and below it for the baked
  shadow. Footprints are from `src/data/buildings.json` `size`.

## 4. Animations

**Facings:** 8, always in this order and with these codes: `s`, `sw`, `w`, `nw`, `n`, `ne`, `e`,
`se`. **Frames** are numbered from `00`.

| Key | Layers | Animations: frames @ fps (L = loops, H = holds the last frame) |
|---|---|---|
| `person_man`, `person_woman` | base, cloth | idle 4@4 L, walk 8@12 L, carry_walk 8@12 L, chop 6@10 L, build 6@10 L, gather 6@10 L, scrape 6@10 L, shoot 6@10 L, thrust 6@10 L, strike 6@10 L, tend 4@10 L, fish 6@10 L, dance 8@8 L, sit 2@2 L, die 6@10 H |
| `person_elder_man`, `person_elder_woman` | base, cloth | idle 4@4 L, walk 8@12 L, carry_walk 8@12 L, gather 6@10 L, scrape 6@10 L, tend 4@10 L, fish 6@10 L, dance 8@8 L, sit 2@2 L, die 6@10 H |
| `person_child` | base, cloth | idle 4@4 L, walk 8@12 L, carry_walk 8@12 L, gather 6@10 L, dance 8@8 L, sit 2@2 L |
| `person_rider` | base, cloth | idle 4@4 L, walk 8@12 L, gallop 6@14 L, thrust 6@10 L, die 6@10 H |
| `animal_wolf` | base | idle 4@4 L, walk 8@12 L, run 6@14 L, attack 6@10 L, die 6@10 H |
| `animal_deer`, `animal_bison` | base | idle 4@4 L, graze 6@6 L, walk 8@12 L, run 6@14 L, die 6@10 H |
| `animal_horse` | base | idle 4@4 L, graze 6@6 L, walk 8@12 L, run 6@14 L |

- Flee plays `walk` at 1.5× speed; the pack leader (1.4× scale, darker tint) and the guardian
  (pale tint) reuse `animal_wolf`; a child who dies fades out (no `die`).
- **One-facing animations** (pattern B in section 8): `animal_fish` jump 4@10 (plays once);
  `ally_spirit` float 6@8 L; `fx_storm` loop 8@10 L; `fx_hit` burst 4@14 (once); `fx_dust` puff
  4@12 (once); `fx_sparkle` rise 6@10 (once); `fx_flame` loop 8@10 L; `building_drying_rack`
  finished and winter 4@4 L. Carcasses (`carcass_deer`, `carcass_bison`, `carcass_wolf`) are
  pattern B stills with states `stage1`, `stage2`, `stage3` (whole, half, bones).

## 5. Buildings

Every building has these **states**: `stage1`, `stage2`, `stage3`, `finished`, `winter` (one frame
each unless noted; looks in [STYLE.md](STYLE.md) section 8). The game shows `stage1` below 34%
built, `stage2` below 67%, `stage3` below 100%, then `finished` (`winter` in the winter season).

| Key | Footprint | Cell | States / notes |
|---|---|---|---|
| `fire_central` | 4×4 | 640×768 | `finished`, `winter` only (starts built); flames are `fx_flame` drawn by the game with its anchor on the footprint centre (the hearth) |
| `building_store` | 4×4 | 640×768 | all 5 |
| `building_store_open` | 4×4 | 640×768 | `finished` only: roof removed, front walls 24 px high, empty floor (floor 400×200 px at 2×, items placed by `src/render/stores.ts`) |
| `building_tipi` | 2×2 | 384×512 | all 5 |
| `building_gathering_spot` | 2×2 | 384×512 | all 5 |
| `building_hunting_lodge` | 2×2 | 384×512 | all 5 |
| `building_drying_rack` | 2×2 | 384×512 | all 5; `finished` and `winter` are 4-frame loops |
| `building_horse_corral` | 2×2 | 384×512 | all 5; empty of horses |
| `building_healers_lodge` | 2×2 | 384×512 | all 5 |
| `building_scouts_lodge` | 2×2 | 384×512 | all 5 |
| `building_lancers_lodge` | 2×2 | 384×512 | all 5 |
| `building_archers_lodge` | 2×2 | 384×512 | all 5 |
| `building_spirit_lodge` | 2×2 | 384×512 | all 5 |
| `building_trap` | 1×1 | 256×256 | all 5 |
| `building_fire_pit` | 1×1 | 256×256 | all 5; flames are `fx_flame` at scale 0.5 |
| `building_barricade` | 1×1 piece | 256×256 | all 5, each × 16 masks (below) |

**Barricade masks:** a piece's mask is the sum of the edges that touch another barricade tile:
NE (tile x, y−1) = 1, SE (x+1, y) = 2, SW (x, y+1) = 4, NW (x−1, y) = 8. Mask 0 is a lone cluster
of stakes; a straight NE–SW line is mask 5; every mask 0-15 is drawn, so lines join in any shape.
The stakes along a connected edge reach the diamond's edge midpoint exactly, so neighbours meet.

## 6. Ground, banks and spills

Ground textures come from image generation as **seamless 1024×1024 squares** (STYLE.md template)
and are turned into diamonds by Codex's tile script: resize to 512×512, rotate 45°, scale to
128×64 (Lanczos), mask to the diamond (1 px anti-aliased edge). One square period makes exactly
one diamond, so neighbouring tiles continue seamlessly.

| Key | Seasons | Variants | Rule |
|---|---|---|---|
| `tile_grass`, `tile_forest`, `tile_berry` | 4 | 4 | variant 0 is the clean texture; variants 1-3 add interior details (tufts, patches, litter, shrubs) that stay **8 px away from the diamond edge**, so every variant meets every other |
| `tile_river`, `tile_ford` | 4 | 4 | `tile_river`: the outer 4 px edge band is the river's water mid colour of its season, so river tiles meet without a seam. `tile_ford` (K18, 2026-11-23): its outer 4 px band is the ford's **own** shallows mid colour (the mean of its interior, no blue), so ford tiles meet each other without a seam; a ford meets a river tile along a plain shoreline (shallows against deep water), which is accepted |
| `bank_river` | 4 | 15 | masks 1-15, by which edges touch water (river or ford): NE 1, SE 2, SW 4, NW 8, as for the barricade; mask 0 is the plain ground tile; the water side of each edge blends to the water edge band, the land side to grass |
| `spill_forest`, `spill_berry` | 4 | 4 edges | `ne`, `se`, `sw`, `nw`: the edge of the grass tile the forest/berry neighbour lies across; a feathered overlay reaching 1/3 into the tile, transparent elsewhere |

Diagonal-only water neighbours are ignored (small notches at inner corners are accepted). Seasons:
`spring`, `summer`, `autumn`, `winter` (from `src/data/seasons.json` `order`).

## 7. Plants, rocks and props

From image generation on flat #00FF00 (#FF00FF for green spring plants), keyed, trimmed and placed
in the cell with the ground point on the anchor pixel.

| Key | Cell | Variants × seasons |
|---|---|---|
| `tree_bur_oak`, `tree_basswood`, `tree_cottonwood`, `tree_willow` | 256×320 | 2 × 4 |
| `bush_chokecherry`, `bush_plum` | 128×128 | 2 × 4 |
| `rock_boulder` | 128×128 | 3 × 4 (winter: snow on top) |
| `tuft_grass` | 128×128 | 3 × 4 |
| `stump_tree` | 128×128 | 1 × 4 |
| `item_basket`, `item_log`, `item_hides`, `item_bag` | 32×32 | 1 × 1 (drawn in the store's 2:1 projection) |

The four trees replace the old key `object_tree`: the game picks bur oak or basswood for a forest
tile and cottonwood or willow for a forest tile within 2 tiles of water, by the map seed.

## 8. Frame names and files

Three naming patterns, used both in the delivery and as atlas frame names:

| Pattern | Used for | Atlas frame name | Delivered file |
|---|---|---|---|
| A | animations with facings | `<key>/<layer>/<anim>/<facing>/<nn>` | `<layer>_<anim>_<facing>_<nn>.png` |
| B | one-facing animations and building states | `<key>/<state or anim>/<nn>` | `<state or anim>_<nn>.png` |
| C | ground, banks, spills, plants and other seasonal stills | `<key>/<season>/<index>` | `<season>_<index>.png` (`index` = variant, mask or edge) |
| D | single images (icons, items, cursors, UI pieces) | `<key>` or `<key>/<state>` | `<key>.png` or `<state>.png` |

Examples: `person_woman/cloth/walk/ne/05`, `building_tipi/stage2/00`, `bank_river/winter/5`,
`tree_willow/autumn/1`, `ui_button/hover`.

- **Delivery:** `art/inbox/<batch>/<key>/` with every frame PNG (RGBA 8-bit, sRGB), plus
  `art/inbox/<batch>/delivery.json` and `art/inbox/<batch>/contact.png` (PIPELINE.md).
- **Installed:** `art/atlas/<group>-<n>.png` and `art/atlas/<group>.json` (Phaser multiatlas,
  pages 2048×2048, trimmed, 2 px extrude, 2 px padding), `art/title.jpg`, and sources in
  `art/source/`. Groups: `ground`, `plants`, `buildings`, `man`, `woman`, `elder_man`,
  `elder_woman`, `child`, `rider`, `animals`, `fx`, `ui`.
- **Budget:** at most 16 atlas pages in total (expected about 13: ≈210 MB of GPU memory,
  ≈30 MB of PNG). Each page PNG ≤ 4 MB; the title JPEG ≤ 1 MB.
- File names match `^[\w.-]+$` (the publish script rejects others).
- **Details the validator uses** (AC1): spill edges are named `ne`, `se`, `sw`, `nw` and bank masks `1`-`15` (pattern C,
  unpadded); a barricade's masks are files `<state>_<mask>.png` (mask `0`-`15`, unpadded) and frames
  `building_barricade/<state>/<mask>`; interface keys (group `ui`) are pattern D, a state file is `<state>.png`; a cursor
  also has `<key>_2x.png` at twice the cell (frame name `<key>@2x`).

## 9. Manifest v2 (`art/manifest.json`)

One entry per key. The game loads `final` keys from their atlas; everything else uses the
code placeholder or, for keys without one, the grey stand-in (DESIGN-art.md *Who draws*).

```json
{
  "person_woman": {
    "atlas": "woman",
    "cell": [192, 160],
    "anchor": [0.5, 0.8],
    "layers": ["base", "cloth"],
    "facings": 8,
    "anims": {
      "idle": { "frames": 4, "fps": 4, "loop": true },
      "die":  { "frames": 6, "fps": 10, "loop": false }
    },
    "seasons": false,
    "states": null,
    "variants": null,
    "status": "placeholder",
    "batch": "AB14",
    "revision": 0,
    "approvedBy": null
  }
}
```

- `atlas`: the group name (section 8). `cell`: `[w, h]` px at 2×. `anchor`: Phaser origin.
- `layers`: `["base"]` or `["base", "cloth"]`. `facings`: 1 or 8.
- `anims`: per animation `{frames, fps, loop}` (pattern A or B), or `null`.
- `seasons`: `true` when the key has the 4 season versions. `states`: list of building states or
  carcass stages, or `null`. `variants`: count (variants, masks or edges), or `null`.
- `status`: `placeholder` | `final`; only an approved, installed delivery becomes `final`.
- `batch`, `revision`: the delivery installed. `approvedBy`: `user` or `claude` (from the batch's
  Approval authority), set at install.
- Further fields (AC1): `indices` (explicit variant names), `slice` (9-slice corner px), `retina` (cursors also come
  at 2x), `border` (transparent border px every frame keeps: 2, or 0 for tiles and 9-slice pieces), `ground` (the
  validator checks alpha within 4 px above the anchor pixel: people, animals, plants, items) and `placeholder`
  (`{size, anchor}` the code draws today; a key without it gets a grey stand-in).
- **Old keys** (today's placeholders) map to the new ones: `person_adult` → `person_man`,
  `person_woman`; `person_elder` → `person_elder_man`, `person_elder_woman`; `person_child` stays;
  `object_tree` → `tree_bur_oak`, `tree_basswood`, `tree_cottonwood`, `tree_willow`. Every other existing key keeps its name.
  AC4 switched the people to the new keys and deleted `person_adult` and `person_elder` (their code drawings are now the
  placeholders of the man, woman and elder keys). AC5 switched the trees to the four new keys and deleted `object_tree` (its code
  drawing is now the placeholder of all four trees). No `legacy` key remains.
- Keys are lowercase `<kind>_<name>`; kinds: `tile`, `bank`, `spill`, `tree`, `bush`, `rock`,
  `tuft`, `stump`, `item`, `building`, `fire`, `person`, `animal`, `carcass`, `ally`, `fx`,
  `icon`, `cursor`, `ui`.

## 10. Interface

| Key | Cell | States / notes |
|---|---|---|
| `ui_panel` | 96×96 | 9-slice, 32 px corners; the edges stretch, the centre tiles |
| `ui_button` | 96×48 | 9-slice, 16 px corners; states `normal`, `hover`, `pressed`, `disabled` |
| `ui_bar_frame` | 64×24 | 9-slice, 8 px corners |
| `ui_bar_fill` | 8×16 | plain light strip (#E6E6E6 with soft shading), tinted by the game |
| `ui_emblem` | 512×512 | round badge, transparent outside the circle |
| title | 2560×1440 | `art/title.jpg`, opaque; keep the top-centre 1200×300 calm for the code-drawn title |
| `cursor_pointer` | 32×32 | hotspot 2, 2 |
| `cursor_move` | 32×32 | hotspot 16, 28 |
| `cursor_attack` | 32×32 | hotspot 16, 16 |
| `cursor_build` | 32×32 | hotspot 6, 28 |
| `cursor_invalid` | 32×32 | hotspot 16, 16 |

Cursors are delivered at 32×32 (1×, a CSS cursor) and as `@2x` 64×64 for high-density screens.

**Icons (64×64):**

| Group | Keys |
|---|---|
| Resources | `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, `icon_people`, `icon_horses` |
| Camp | `icon_wotakuye`, `icon_hungry` |
| Jobs | `icon_job_gather`, `icon_job_hunt`, `icon_job_chop`, `icon_job_dry`, `icon_job_scout`, `icon_job_drill`, `icon_job_tend`, `icon_job_heal`, `icon_job_build`, `icon_job_haul`, `icon_job_fight`, `icon_job_fish`, `icon_job_dance` |
| Orders | `icon_order_move`, `icon_order_attack`, `icon_order_draft`, `icon_order_undraft`, `icon_order_hold`, `icon_order_defend`, `icon_order_chase`, `icon_order_delete` |
| Upgrades and powers | `icon_upgrade_<id>` for every id in `src/data/upgrades.json` `upgrades` (dogs, bows, healers, scouts, warriors, builders, barricades, horses, riders, tools, spirits, spirit_warriors, guardian_wolves, bison_charge, storm_caller); the power buttons reuse `icon_upgrade_bison_charge` and `icon_upgrade_storm_caller` |
| Seasons | `icon_season_spring`, `icon_season_summer`, `icon_season_autumn`, `icon_season_winter` |
| Speed | `icon_speed_pause`, `icon_speed_1x`, `icon_speed_2x`, `icon_speed_4x` (pictures, not numbers: a still hand, one, two and four walking footprints) |

The font is Alegreya (SIL Open Font License), bundled by code; it is not art.
