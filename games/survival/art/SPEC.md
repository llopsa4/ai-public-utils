# Survival art spec

Sizes, anchors, palette and the manifest format for every sprite and tile. The procedure is in
[PIPELINE.md](PIPELINE.md); the register is [ASSETS.md](ASSETS.md); the look was decided in
[DESIGN.md](../DESIGN.md) section 8.

## View and light

- **Isometric 2:1:** ground tiles are diamonds **64 x 32 px**. Everything upright (people,
  buildings, trees, enemies) is drawn as seen from the same angle, standing on the diamond.
- **Light from the upper left;** soft shadow falling to the lower right, painted into the sprite.
- **Depth:** the game sorts sprites by their anchor's screen y, so an anchor must sit exactly where
  the object touches the ground.

## Sizes (final PNG, transparent, 32-bit)

| Asset | Canvas | Anchor | Frames |
|---|---|---|---|
| Ground tile (grass, river, forest floor, berry ground) | 64 x 32 (taller if it has height) | diamond centre | 1, plus 2-3 variants |
| Person | 32 x 40 | bottom centre (feet) | idle 1, walk 4, work 2, fight 2 |
| Animal enemy (wolf) | 40 x 32 | bottom centre | walk 4, attack 2 |
| Tipi | 96 x 96 | centre of its footprint | 1 |
| Other building (lodge, store, gathering spot) | up to 128 x 128 | centre of its footprint | 1, plus a "being built" frame |
| Tree, bush, rock | 32-64 wide | bottom centre | 1 |
| Central fire | 48 x 48 | bottom centre | 3 (flicker) |
| UI icon (resource, order) | 32 x 32 (the HUD bar draws it at 16 x 16) | centre | 1 |
| Open store (cutaway of the store, shown on hover) | 128 x 128 | centre of its footprint | 1 |
| Resource pile (inside the open store), 1-4 per resource | 32 x 24 | bottom centre | 1 each |

Building footprints (in tiles) are set by DESIGN-slice.md `## Buildings`; a sprite fills its
footprint's diamonds.

## Palette and look

Warm, hand-painted, natural: ochre prairie, sage and grass greens, river green-blue, hide browns and
creams, wood greys, dusk blue for shadows, firelight orange for highlights. Clear silhouettes: a
person must read at 32 px. No outlines thicker than 1 px; no text in sprites.

## Asset manifest (`art/manifest.json`)

One entry per key; the game draws a code placeholder when `status` is `placeholder` or the PNG is
missing.

```json
{
  "person_hunter": {
    "file": "person_hunter.png",
    "size": [32, 40],
    "anchor": [0.5, 1.0],
    "frames": { "idle": 1, "walk": 4, "work": 2, "fight": 2 },
    "status": "placeholder"
  }
}
```

- `key`: lowercase with underscores, `<kind>_<name>` (`tile_grass`, `building_tipi`, `enemy_wolf`).
- `file`: under `art/`; multi-frame sprites are one horizontal strip in the frame order listed.
- `anchor`: fraction of width and height (Phaser origin).
- `status`: `placeholder` | `final`. Only an approved PNG becomes `final`.
