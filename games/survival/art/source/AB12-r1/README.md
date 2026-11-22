# AB12 revision 1 — shared human rig

Candidate for the user's figure-look approval: `person_man` walk, eight facings, eight frames,
base and greyscale cloth (128 PNGs). No installed atlas or manifest change.

The model follows the approved AB0 front/side/back sheet, copied here as
`concept_person_man.png`. Its original exact generation prompts and the AB0 painted hide
texture's prompts are repeated in `art/inbox/AB12/delivery.json`; no new image generation
was needed. The packed hide texture is reused for the grey shirt and natural leggings.
The neutral shirt, leggings, plain moccasins, headband, braids, belt/pouch and unpatterned
bead band are meshes, not screen-space drawings. Palette skin/hair/materials follow STYLE.

`../human_rig.blend` is the shared editable armature; the identical version retained here is
the immutable delivery source. Its 16 bones and weighted meshes support the later woman,
elder and child variants; those variants and all other actions are later batches.
`walk` is a 16-frame Blender action at 24 fps with a closure key on frame 17, sampled on
1/3/5/7/9/11/13/15. Foot-target actions drive two-bone IK, knee poles face forward,
and shoe-orientation targets keep planted shoes level. The body shifts weight and arms
counter-swing. The planted half-cycle travels 0.42 m relative to the model, corresponding
to 0.84 m forward travel per full gait cycle. The rig checks verify target agreement and
constant planted-foot velocity; they do not certify playback speed against every sim speed.

The figure faces local -Y. Root Z rotation is 45 degrees plus SPEC's facing offset, making
south face the viewer and east face screen right. The fixed camera uses horizontal sensor
fit, 45.25 pixels per metre across, origin at (96,128), 2x supersampling and 64 EEVEE samples.
`render.py` adds only a dispatch before its unchanged AB0 building path. The figure extension
uses the same lights and shadow post. Base includes the whole neutral figure and the shadow;
noncloth holdouts occlude the separate shirt pass. Both layers share the same downsampling,
then cloth alpha is limited to base coverage to remove filter ringing outside the figure.

Reproduce from `games/survival/`:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB12-r1/build.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b -P art/source/AB12-r1/check_rig.py
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' -b art/source/human_rig.blend -P art/source/render.py -- person_man walk
python art/source/AB12-r1/prepare.py
npm run art:validate -- --inbox AB12
node art/source/AB12-r1/preview.mjs
```

The browser script copies the game into ignored `test-results/`, packs candidate man/ground
atlases there, and modifies only the scratch manifest. AB3 ground supplies review context.
The people view initializes at idle/s/00, so scratch atlas JSON aliases the first walk pose
as idle for bootstrapping; these aliases are not delivered or presented as completed idle art.
Walking frames, aligned layers and family tints use the unmodified runtime people renderer.
Simulation is paused in a debug clearing, with sixteen adult men, one row per family and
eight walking directions. This is a candidate check, not a full manual gameplay run.

`contact.png` shows all 128 frames at actual display size on grey and dark backgrounds.
The two GIFs show the tinted cycles at normal size and zoom 2. In-game captures cover both
screen sizes at zoom 0.5/1/2. `browser-checks.json`, `projection-checks.json` and
`rig-checks.json` record the automated checks. Remaining animations and woman/elder/child
meshes have not been made. User approval and later installation remain separate steps.
