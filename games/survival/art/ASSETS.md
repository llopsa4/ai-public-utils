# Survival asset register

One row per asset key in `art/manifest.json` once it has a final PNG or an open art request.
Placeholders drawn in code need no row. Procedure: [PIPELINE.md](PIPELINE.md); sizes:
[SPEC.md](SPEC.md).

| Key | Size | Anchor | Frames | Status | Request / approval |
|---|---|---|---|---|---|
| `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, `icon_horses` | 32 x 32 | centre | 1 | placeholder (code) | none yet; shown 16 x 16 before each number in the HUD bar |
| `building_store_open` | 128 x 128 | 0.5, 0.75 | 1 | placeholder (code) | none yet; the store's cutaway on hover: no roof, low front walls, empty floor |
| `pile_food_1-4`, `pile_wood_1-4`, `pile_hides_1-4`, `pile_pemmican_1-4` | 32 x 24 | bottom centre | 1 each | placeholder (code) | none yet; 16 sprites, the number is how full the camp's store is (`ceil(4 x amount / capacity)`); drawn 1.3x in the game |
