# Survival: bigger map and minimap

Settled by grilling with the user, 2026-11-20 (Q1-Q9). Plan rows M1-M6 in [PLAN.md](PLAN.md).
Saving stays parked: no save work; camps saved on the 48 x 48 map are not expected to load (accepted).
No balance changes: wave sizes and times stay; the user judges balance in M6.

## Size

- **96 x 96 tiles** (4x the area of today's 48 x 48). The world spans 6144 x 3072 px; the projection
  in [DESIGN-slice.md](DESIGN-slice.md) `## Map` is unchanged (it already takes `size`).
- Every hard-coded `48` (or `47`, `24` as map centre) in `src/` and `tests/` reads `map.size` instead.

## Generation

Same steps and rng call order as `DESIGN-slice.md` `## Map`, with these numbers in `src/data/map.json`:

| Item | Today | New |
|---|---|---|
| River width | 2 | **4** |
| River start column | `9 + int(rng*6)` | `18 + int(rng*12)` |
| River wobble clamp | 5..16 | **10..32** (still the west half, north to south) |
| Fords | 2 rows, `8 + int(rng*10)`, `30 + int(rng*10)` | **still 2**, `16 + int(rng*20)`, `60 + int(rng*20)`; all 4 river tiles of the row become `ford` |
| Forest clusters | 7, at least 10 from the camp | **28**, at least 10 from the camp |
| Berry patches | 3, 7-14 from the camp | **12**: the same 3 at 7-14, plus 9 at 15-44 |
| Start herds | 3 (deer, deer, bison) at 14-22 | **12**: the same 3 at 14-22, plus 9 at 23-44 (same deer/bison mix) |
| Herd animal cap | 12 | **48** |
| Path search cap | 4000 nodes | **16000** nodes |

The near ring (everything within 14 tiles of the camp, and the first 3 herds) plays as today; the outer
map holds the extra ground.

## Start camp

The whole start layout moves to the map centre, keeping its offsets from the fire: fire `[22, 22]` ->
**`[46, 46]`**, tipis `[18, 22]` / `[28, 22]` -> `[42, 46]` / `[52, 46]`, store `[22, 17]` -> `[46, 41]`.
Clear radius stays 7 around the fire's centre.

## Wolves and powers

- Waves still spawn on the map edges (`waves.json` edges and jitter unchanged), now about 48 tiles from
  the camp instead of 24: the extra walk is extra time to prepare. Times and counts unchanged.
- **Bison stampede:** the herd starts **24 tiles before** the aim point (on the same line and direction
  as today, clamped inside the map) and runs **48 tiles**, so its reach and duration match today's.

## Camera

- Zoom stays **0.5-2** (step 0.1); the minimap does long-range navigation.
- Pan speed **900 px/s** (was 600).
- The run starts centred on the fire at zoom 1.

## Drawing

9216 ground tiles. If one image per tile drops the frame rate below 55 fps at zoom 0.5 on the user's PC,
the ground is baked into a few large textures (chunks) and a cut tree redraws its chunk. Otherwise one
image per tile stays.

**Settled 2026-11-21 (AC9 measurement):** one image per tile gave 17 fps at zoom 0.5 on this PC (Phaser sends every
visible image to the GPU, on screen or not), so the ground is baked into 16 x 16-tile chunks (36 textures) and what
is off screen is hidden each frame. Measured after: 60 fps with 20 people, about 48 fps at zoom 0.5 and 57-59 fps at
zoom 1-2 with 200 walking people (see the AC9 note in `handoff/from-claude.md`).

## Minimap

**Place and shape:** an isometric **diamond about 200 x 100 px** on a dark HUD panel (`#1d1a16` at 85%),
top right **under the speed and Upgrades buttons**, in the HUD scene (never scrolls or zooms). Same
orientation as the main view. **No fog of war.**

**Layers** (bottom to top):

| Layer | Look | Updates |
|---|---|---|
| Terrain | grass, river, ford, forest, berry in their tile colours | when a tile changes (a felled tree) |
| Buildings | warm cream blocks over their footprint; the fire an orange dot | on place, finish, removal |
| People | 1-2 px dots in the family colour; drafted people red | every few frames |
| Wild herds | brown dots | every few frames |
| Wolves | bright red dots | every few frames |
| Camera view | a white outline of the visible world area | every frame |

**Mouse:**

- **Left-click or drag** on the minimap centres the camera there; it never selects.
- **Right-click** sends the selected people a **move** order to that tile (the same order and refusals as
  a right-click on ground). Attack, gather and build stay in the main view.
- Clicks on the minimap never reach the world below (no placement, no deselect, no world order).
- While placing a building or aiming a power the minimap stays usable, and a click only moves the camera.

## Tests

- Unit: a seed-1 map is 96 x 96 with a 4-wide river, 2 fords of 4 tiles, the clear radius at the new fire,
  12 berry patches (3 within 14), 28 forest clusters; same seed, same map; the stampede path is 48 tiles
  and starts 24 before the point; minimap tile <-> pixel maths round-trips (pure helper, no Phaser).
- Existing tests that assume tile coordinates or the 48 size are made layout-proof (read `map.size`,
  the fire tile, the store tile).
- e2e: the minimap is drawn; a left-click on it moves the camera; a right-click with people selected
  gives them a move order; no console errors.
