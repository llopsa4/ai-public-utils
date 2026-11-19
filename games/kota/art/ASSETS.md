# Kota asset register (2D painted stills)

One row per asset ([PIPELINE.md](PIPELINE.md#files)). Status: *planned*, *prompted*, *generated*,
*processed*, *approved* (with date and approver), *installed*. Reset on 2026-11-18 for the 2D pivot
([PLAN.md](../PLAN.md)); the 3D models and scripts were retired and no 2D asset exists yet.

| Asset | Brief | Image | Status |
|---|---|---|---|
| ash_wolf (hero) | [brief](briefs/hero_dakota_woman.md) | reference sheet in `art/refs/hero_dakota_woman/` | generated 2026-11-19: `raw_01.jfif` (single pose) and `walk_01.jfif` (4-frame walk strip, facing the camera); walk frames processed into `art/refs/ash_wolf/processed/ash_wolf_walk_1..4.png` (256 px, `art/tools/process_sprite.py`); **waiting for the user's approval before install** |
