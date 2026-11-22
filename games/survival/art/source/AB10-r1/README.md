# AB10 revision 1 sources

Five fictional society lodges, five construction/season states each. Generated concept
sheets and exact prompts are retained here. Editable packed Blender models are in
the parent `source/` directory as `building_<society>_lodge.blend`.

From `games/survival/`:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB10-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB10-r1/check_models.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB10-r1/render_batch.py
python art/source/AB10-r1/prepare.py
npm run art:validate -- --inbox AB10
node art/source/AB10-r1/preview.mjs
```

The first healer candidate had two low frame hoops crossing the doorway. The final
model omits those doorway spans; the rejected state frames remain in `initial-doorway/`.

An initial spirit doorway used an opaque blue floor patch; the final model uses only
a soft interior light. Rejected finished/winter frames remain in `initial-spirit-glow/`.

The render loop skips existing PNGs to resume interrupted candidate renders. Remove only
the intended unfinished candidate frames before re-rendering a changed model. Once
delivered for review, revision 1 is immutable: requested changes get a new revision.

The builder loads AB9's geometry and material helper definitions without executing its
model-writing loop. It reuses AB0's painted hide and wood and AB9's woven mat. The pale
spirit hide desaturates and lightens the painted hide; the doorway has a faint cool
interior point light on the existing floor. All models retain their state collections.

Each lodge occupies a four-metre square centred at the origin. The camera, lighting,
supersampling and shadow post come from AB0, with AB9's explicit horizontal sensor fit.
The numeric checks verify the 256 by 128 pixel projected footprint and (192,384) anchor.
Healers use a bent-pole dome and plain dried plants; scouts a plain lookout pennant;
lancers three stone-point lances; archers bound unpainted straw and plain bows; the
invented spirit lodge pale hide with a faint cool doorway. No real sacred objects or symbols.

The browser script packs candidates into a disposable snapshot under `test-results/`.
AB9 camp buildings, AB3 ground and AB5 plants are review context. Construction stages and seasons use paused
debug state; normal runtime rendering selects the frames. Captures cover zoom 0.5, 1 and 2
at 1280 by 720 and 2560 by 1440, plus summer/winter close-ups for each lodge. Assertions
check frame selection and browser errors. No runtime source or installed assets change.
