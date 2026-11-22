# AB13 revision 1 — complete man action library

Extends the AB12 figure approved by the user on 2026-11-22. The original body meshes,
painted hide and walk frames are retained. The complete delivery has 88 frames in each
of eight facings, with base and greyscale cloth: 1,408 PNGs. Approval authority: Claude.
This is a candidate delivery; no atlas, manifest status or published output is changed.

`build.py` loads the immutable AB12 rig, adds wrist IK and plain tools, and creates the
fourteen remaining actions. The rig action names are the exact manifest animation names;
foot, wrist and prop companion actions are mapped by the rig's `action_registry` property.
Selecting an animation requires assigning all its companion actions, as the renderer does.
Leg IK and horizontal shoes are retained. `check_actions.py` checks the sampled wrist targets
against the solved chains and records foot positions. This does not calibrate gait playback
against all simulation speeds.

Props: axe, maul, basket, hide on a low plain scraping frame, scraper, self bow with a drawn two-segment string,
hip quiver and arrow, lance, club, fishing spear and a small splash in frames 4–5, and a hide
load with chest/shoulder straps. There are no dance props. Textures reuse the approved AB0
hide and existing generated wood, stone and woven mat. No new image generation was used.

`render_sheet.py` freezes each evaluated pose into material groups and uses linked mesh
instances for the eight rotations, offset on the ground plane so the fixed orthographic
projection puts each pose in an independent 192×160 cell.
Per-object generated texture coordinates are retained in a vector attribute when merging.
The camera moves backwards along its viewing axis to keep the full sheet in front of it;
rotation, pixels per metre, light, Standard transform, 64 EEVEE samples and 2× supersampling
are unchanged. Every cell's projected origin is checked numerically. `split_sheet.py` crops
at supersampled cell boundaries before the unchanged AB12 base/shadow/cloth finishing pass.
For efficiency the render can omit empty margins: every rotation's geometry and sun-projected
shadow are bounded with an eight-pixel guard, and the transparent margins are then restored
to the exact 192×160 cell. Camera checks verify the restored anchor remains (96,128).
The single-frame `render_batch.py` is also retained as a slower reference renderer.
The approved AB12 walk PNGs are copied byte-for-byte, rather than re-rendered.

Reproduce from `games/survival/`:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB13-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b art/source/person_man.blend -P art/source/AB13-r1/check_actions.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b --python-exit-code 1 -P art/source/AB13-r1/preflight.py
python art/source/AB13-r1/render_all.py
# Any individual action, e.g. chop:
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b art/source/person_man.blend -P art/source/AB13-r1/render_sheet.py -- person_man chop
python art/source/AB13-r1/prepare.py
npm run art:validate -- --inbox AB13
node art/source/AB13-r1/preview.mjs
```

`prepare.py` creates one complete grey/dark base/cloth plate per action, a combined contact
sheet, both-tint GIFs at normal display size and zoom 2, an overview and the review HTML.
GIF timing is rounded to its 10 ms precision. Death holds its last pose before repeating
for review; the game plays death once. `preview.mjs` packs candidates only in an ignored
scratch game, checks every frame pair and both tints, and captures every action at three
zooms on 1280×720 and 2560×1440. It calls the normal atlas draw method directly for the
action review; fish and dance are art only until their gameplay is implemented. This is
not a manual playthrough or a full construction/combat/seasonal test.
