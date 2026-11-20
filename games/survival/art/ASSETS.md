# Survival asset register

One row per asset key in `art/manifest.json` once it has a final PNG or an open art request.
Placeholders drawn in code need no row. Procedure: [PIPELINE.md](PIPELINE.md); sizes:
[SPEC.md](SPEC.md).

| Key | Size | Anchor | Frames | Status | Request / approval |
|---|---|---|---|---|---|
| `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, `icon_people`, `icon_horses` | 32 x 32 | centre | 1 | placeholder (code) | none yet; shown 16 x 16 before each number in the HUD bar |
| `building_store_open` | 256 x 208 | 0.5, 0.75 | 1 | placeholder (code) | none yet; the store's cutaway on hover: no roof, low front walls, empty floor |
| `item_basket`, `item_log`, `item_hides`, `item_bag` | 16 x 16 | bottom centre | 1 each | placeholder (code) | none yet; small isometric props (2:1 projection) inside the open store: a basket of fruit, a log, a bundle of hides, a pemmican bag; one per fortieth of the camp's capacity (`ceil(40 x amount / capacity)`: 20 food, 15 wood, 4 hides, 10 pemmican for one store), drawn 1x on the floor grid |
