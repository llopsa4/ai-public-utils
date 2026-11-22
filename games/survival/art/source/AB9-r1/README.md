# AB9 revision 1 sources

Four camp structures built in Blender 5.1.2, with generated model references and one new
painted woven-mat texture. Exact prompts are in `prompts.json`. AB0 painted hide and pole
wood are reused. Editable packed models live in the parent `source/` directory.

From `games/survival/`:

```powershell
python -c "from PIL import Image; Image.open('art/source/AB9-r1/mat_woven.png').convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save('art/source/textures/mat_woven.png')"
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB9-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB9-r1/check_models.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB9-r1/render_batch.py
python art/source/AB9-r1/prepare.py
npm run art:validate -- --inbox AB9
node art/source/AB9-r1/preview.mjs
```

Do not regenerate a delivered revision during review or integration. Make a new revision
and change its paths for any requested changes.

Each structure has `stage1`, `stage2`, `stage3`, `finished` and `winter` collections.
The ground footprint is exactly 4 by 4 metres, centred on the origin; no render-time
rescaling or per-frame repositioning is used. `render_batch.py` calls AB0's camera,
lighting, render and matte functions and `finish_render.py` for the prescribed shadow
colour and supersampling. It explicitly selects horizontal camera sensor fit: Blender's
default AUTO selects vertical fit for these portrait cells, enlarging the footprint by
512/384 and moving the origin below the prescribed anchor. Horizontal fit makes AB0's
width-based scale and shift formulas satisfy SPEC sections 2–3. AB0 `render.py` and
existing approved art remain unchanged. The wrapper adds AB9 paths and animation sampling.

Drying strips have individual Blender sway actions keyed at 24 fps over a repeating
24-frame cycle. Both finished and winter states sample frames 1, 7, 13 and 19 into the
four manifest frames at 4 fps. Fixed support poles, strip attachment points and snow
remain aligned. The corral is empty; horses are separate runtime sprites. The approved
AB0 tipi is unchanged.

`prepare.py` creates grey/dark sheets at actual display size, summer and winter loop GIFs,
alpha bounds, frame hashes and source hashes. The candidate browser preview packs AB9
with installed AB0 buildings into a disposable `test-results/ab9-preview-*` snapshot.
AB3 terrain and AB5 plants are isolated review context, and other placeholders remain.
Paused debug state supplies a row of construction stages per structure and changes the
season; normal game rendering selects every frame. Captures cover zoom 0.5, 1 and 2 at
both screen sizes, with finished-building close-ups. Assertions check all construction
states, winter states, all four drying frames in both seasons, and browser errors.
No installation, published output rebuild, commit or push.
