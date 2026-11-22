# AB11 revision 1 sources

Eight Blender frames: fire plaza (finished/winter), store (five states) and open store
(finished). Editable packed models are `../fire_central.blend`, `../building_store.blend`
and `../building_store_open.blend`. Generated concepts, bark source and exact prompts are
retained here; `bark.png` is the source texture resized to 1024×1024 using Lanczos.

From `games/survival/`:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB11-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB11-r1/check_models.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB11-r1/render_batch.py
python art/source/AB11-r1/prepare.py
npm run art:validate -- --inbox AB11
node art/source/AB11-r1/preview.mjs
```

The builder loads AB9 helper definitions without running its model-writing loop. Wood
and hide reuse AB0's generated paintings, baskets reuse AB9's woven material. The new
generated bark painting is applied to the overlapping wall slabs. All images are packed
into each editable model. The shared AB0 renderer and shadow post are unchanged; the
wrapper applies AB9's explicit horizontal sensor fit, preserving the specified 512×256
projected footprint and (320,576) anchor.

The store and cutaway use the same construction function and ground plane. The open
version removes the roof, ridge and overhead rafters, lowers the front walls and omits
the fixed eaves bundles/baskets, leaving the floor empty for runtime resource piles.
Its manifest has no winter state, so the same cutaway is used in every season, as specified.
The hearth is at the plaza origin, matching the runtime flame anchor. Its model contains
exactly 12 hearth stones, four hide mats, two log seats, drying poles, baskets and a plain
unpainted everyday hand drum. No flames are baked into the plaza sprite.

The renderer skips existing candidate frames to resume a partial render. After delivery,
revision 1 is immutable; fixes must use a new revision folder. No installed atlas,
runtime source or published output is changed by these scripts.

Browser verification packs candidates into a disposable `test-results/` snapshot. AB9
buildings, AB3 ground, AB5 plants/store props and AB6 flame are review context only.
Captures exercise all construction states, summer/winter, zoom 0.5/1/2, actual pointer
hover into and out of the store, and empty/half/full resource piles at both screen sizes.
Assertions verify frames, pile counts, flame position and browser errors. Stages and
seasons use paused debug state; this is not a full manual construction or seasonal run.
Debug-clearing edits fell the original trees, so the preview script removes their
review-only stumps plus old bushes/props in that clearing. No game renderer is changed.
The initial stage-3 candidate covered a quarter of the roof; `initial-stage3/` retains it.
The final stage-3 model covers one full roof slope (half the roof).
