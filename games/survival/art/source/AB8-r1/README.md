# AB8 revision 1 sources

Three small structures, built and rendered with Blender 5.1.2. `prompts.json` records all four
image-generation prompts verbatim. The concepts are model references only; the frame PNGs are
Blender renders. `stone_generated.png` is the original texture painting; the material consumes its
1024-square Lanczos resize at `../textures/stone_painted.png`. Wood reuses AB0's painted texture.

From `games/survival/`, using the configured Blender executable:

```powershell
python -c "from PIL import Image; Image.open('art/source/AB8-r1/stone_generated.png').convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save('art/source/textures/stone_painted.png')"
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB8-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB8-r1/render_batch.py
python art/source/AB8-r1/prepare.py
python art/source/AB8-r1/joins.py
npm run art:validate -- --inbox AB8
node art/source/AB8-r1/preview.mjs
```

Do not regenerate a delivered revision during its review or integration. Copy the scripts into a
new revision and change the output paths for a requested revision.

`render_batch.py` accepts optional key, state and mask filters. It calls AB0's unchanged `render.py`
camera, light, render and matte setup, plus `finish_render.py` for the prescribed shadow and downsample.
It replaces only AB0's hardcoded batch destination and single-frame output loop. Collection names
are the five manifest states; each barricade state contains its 16 `<state>_mask_<n>` collections.
The packed `.blend` files are in the parent source directory and include their material images.

Each tile is 2 metres. NE/SE/SW/NW are model +Y/+X/-Y/-X. A joining pole runs from the tile centre
to the edge midpoint at 1 metre, independent of mask. Construction states preserve those endpoints.
Winter adds snow to the completed model; no completed geometry is moved. Fire-pit frames contain
charred logs and no flame. The existing runtime supplies the separate AB6 flame in previews.

The candidate browser preview packs AB8 and already installed building art into a disposable
snapshot under `test-results/ab8-preview-*`. AB3 terrain, AB5 plants and AB6 effects are review
context only. It uses actual pointer drags for L/T barricade lines and paused debug state for stage
and season captures. It writes screenshots and assertions to `art/inbox/AB8/`; it does not install
art, rebuild published output, or change game source.
