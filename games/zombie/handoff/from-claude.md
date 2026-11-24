# Claude handoff (Dead Woods)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- None. Z57 done 2026-11-24 (title and pause menus draw `title_bg` at 2x, kit buttons, logo image once `title_logo` is final, else text; nothing needed from Codex beyond A11: install `title_bg` and `title_logo` as `final` and the note and dimmed pause backdrop appear by themselves; next for Claude: nothing queued). Earlier: Z56 done 2026-11-24 (dialogue box and squad cards draw the portraits from the `ui` atlas, grey stand-ins until A10; hurt under 35% HP; next for Claude: Z57). Earlier: Z55 done 2026-11-24 (`mood` on all 36 lines of `src/data/story.json`; list approved by the user 2026-11-24; next for Claude: Z56). Earlier: Z54 done 2026-11-24 (kit, icons, tooltips, HUD icons and painted cursor hook in the scenes, grey stand-ins; Codex can start A8; next for Claude: Z55 mood tags). Earlier: Z53 done 2026-11-24 (UI contract in `art/manifest.json` `ui` + stand-ins + `art/atlas/ui.*`; `art:pack` takes `art/inbox/<batch>/ui/<item>.png`, see `art/STYLE.md` *UI art*; next for Claude: Z54; Codex starts A8 when the WORKLOG says Z54 is done). Earlier: C9 done 2026-11-24 (UI art plan: A8-A11 for Codex). Earlier: Z52 done 2026-11-24 (zombie walks 6 frames at the old cycle length; C8 limp brief). Earlier: Z51 done 2026-11-24 (zombie `reach` anim: `ai.near`, `reach` stand-ins; C7 amends A4 to 120 files and sets the A5 look). Earlier: Z50 done 2026-11-24 (nine zombie keys `zombie_<decay>_<body>`, three 2x atlases; C6 = the A4 brief for Codex, below; next for Claude: nothing queued). Earlier: Z44 done 2026-11-24 (`tests/e2e/base1.spec.ts`; publish ran locally, nothing committed or pushed; next: user's Gate 3 playtest; nothing needed from Codex). Earlier: Z43 done 2026-11-24 (balance: `npm run balance`, careful 77% / passive 0% after base1.json herd 12, meal heal 60, cook 6 s; next for Claude: Z44; nothing needed from Codex). Earlier: Z42 done 2026-11-24 (performance: faster `findPath` with a cached open-area map, baked ground in all three scenes, `tests/perf.test.ts`; next for Claude: Z43 (Opus), then Z44; nothing needed from Codex). Earlier: Z41 done 2026-11-24 (herd checkpoint: `checkpointOf`/`restoreBase` in `sim/base.ts`, `Campaign.checkpoint`, fail screen Enter = retry from the warning, R = restart; next for Claude: Z42 (performance); no art or audio files needed from Codex). Earlier: Z40 done 2026-11-24 (adaptive ambience: `src/audio/mood.ts`, `src/audio/ambience.ts`, driven by `Feel.frame` and the title menu; next for Claude: Z41 (herd checkpoint); no art or audio files needed from Codex). Earlier: Z39 done 2026-11-24 (audio engine + effects: `src/audio/`, placed from the camera, `scenes/feelFx.ts` plays them; next for Claude: Z40 (ambience); no art or audio files needed from Codex). Earlier: Z38 done 2026-11-24 (Feel FX: `render/fx.ts`, `scenes/feelFx.ts`, `scenes/Feel.ts` overlay, jump key U; next for Claude: Z39; no art needed from Codex). Earlier: Z37 done 2026-11-24 (key rebinding: `sim/keymap.ts`, `scenes/actionKeys.ts`, Keys page in the pause menu; next for Claude: Z38; no art needed from Codex). Earlier: Z36 done 2026-11-24 (text size + shape cues: `render/cues.ts`, `scenes/uiScale.ts`; next for Claude: Z37; no art needed from Codex). Earlier: Z34 done 2026-11-24 (pause menu + options store; Esc/R/blur, Options and Controls pages, title-menu Options; next for Claude: Z36 or Z37, both need Z34; no art needed from Codex). Earlier: Z35 done 2026-11-24 (squad panel, F1/F2/Tab, Shift-click; next for Claude: Z34; no art needed from Codex, grey placeholder portraits). Earlier: Z45 done 2026-11-24 (Commandos left-click mouse, `render/click.ts`; next for Claude: Z35; Codex A6 cursor art can start, CSS cursors stay until then). Earlier: Z33 done 2026-11-24 (shared `scenes/input.ts` controller). Earlier: Z31 done 2026-11-24 (Base hints + objective line; next for Claude: Z33). Earlier: Z49 done 2026-11-24 (per-sheet `scale`; Codex can install 2× art). Earlier: Z30 done 2026-11-23 (saves: stage `done`, unreadable slot kept, New Game confirm; next for Claude: Z31). Earlier: Z29 done 2026-11-23 (HUD fixes). Earlier: C4 done 2026-11-23: the A3 brief for Eli (66 frames) is written below; Codex can take A3. Next for Claude: Z29. Earlier: Z28 done 2026-11-23 (Esc skips the dialogue beat; 136 tests pass, browser check pending). Earlier: Z32 done 2026-11-23 (Hold is melee-only unless Free fire, key `Z`, is on). Next for Claude: Z28 (then Z29–Z31, Z33…, see PLAN.md order). Earlier: Z47 done 2026-11-23 (Cass's gun unlock; her `shot` plays `pistol_shot`, still grey stand-ins until A2). Earlier: Z48 done 2026-11-23 (claim released): fighter `pistol_shot` 3 added to `art/manifest.json`; 6 grey stand-ins in `art/frames/fighter/`; fighter atlas now 76 frames. For Codex: C3's Cass `pistol_shot` frames (6 files) are the stand-ins to replace. Polish pass Z28–Z44 queued 2026-11-23 (code only: no art and nothing for Codex; audio is made in code, DESIGN §6). C2 (the A2 prompt) is written below (2026-11-23); C3 amends A2/A3 (every survivor shoots). Next for Claude: Z48 (before A2 installs), then Z28; Z26 after the art gates.

## Awaiting the user
- Design of the 7-character roster (user is deciding; grill when ready, see PLAN.md *Later*).
- Nothing on Z9: the user approved the dialogue lines on 2026-11-23.

## Requests for Codex
- 2026-11-24: **C9** UI art plan: batches A8 kit, A9 icons + cursors (replaces A6), A10 portraits, A11 title. **Z54 is done, so A8 can start now** (the scenes already draw every kit piece, icon and HUD icon from the stand-ins, so an installed piece shows at once; the kit stand-ins are dark grey, 9-slice ones unlabelled). See C9 below.
- 2026-11-24: **C8** amends A4: zombies limp and stand lopsided (per-body limps), `shamble`/`reach`/`lurch` 6 frames (A4 = 156 files); redraw the 6 idles in `art/inbox/A4/` lopsided before the idle gate. See C8 below.
- 2026-11-24: finish A3 (Eli, 2×), then A7 (Cass redrawn at 2×; brief C5 below). Z49 is done: in `art/manifest.json` set `atlases.scout.scale` (then `fighter`) to `2` in the same change as the first 2× install; `art:pack` then expects 128×128 frames for that sheet and redraws leftover 1× stand-ins at 128. Run `npm run art:standins` after changing a scale.
- C1 (the A1 prompt) is answered below; ART batch 1 is units A1–A5 in PLAN.md. Z22 is done: the contract is `art/STYLE.md` *Atlas
  contract* (64×64 cells, feet at (32,56), only se/ne, `art/inbox/<batch>/<key>/<anim>_<facing>_<n>.png`).
  A1 only: palette swatch + Fighter idle SE and NE (`fighter/idle_se_0.png`, `idle_ne_0.png`), for
  the user's approval. `npm run art:pack -- A1` now exists (Z23), and the game now draws the atlas
  (Z25): after packing, reloading the game shows the frames in Intro, Mission 1 and Base 1. Put the palette in
  `art/palette.json` as an array of `#rrggbb`; pack enforces it (alpha 0 or 255 only) once the file
  is there. Nothing is copied from Survival's pipeline.

## C1: A1 prompt for Codex (2026-11-23, answers your request; Fighter idle SE and NE)

Goal: two pixel-art frames of **Cass Mireles** standing, to judge the palette and the look in the game.
Files: `art/inbox/A1/fighter/idle_se_0.png` and `art/inbox/A1/fighter/idle_ne_0.png`, then
`npm run art:pack -- A1`. Nothing else in this batch.

**Format (art/STYLE.md *Atlas contract*)**
- Exactly 64 x 64 px, PNG, transparent background. Pixels are alpha 0 or 255 only; every opaque pixel
  is one of the 32 colours in `art/palette.json`. No anti-aliasing, no soft gradients, no dithering
  noise; pixel clusters at least 2 px wide where possible, 1 px selective outline.
- Feet anchor is pixel (32, 56): the soles rest on row 56 and the figure is centred on column 32.
  Standing height **48 px** (soles to top of head, row 8 to row 56). Leave the rest transparent; do not
  re-centre or trim.
- Two drawn facings only: **SE** (faces down-right, seen from the front) and **NE** (faces up-right,
  seen from behind). The game mirrors them for SW and NW. Same character, same height and proportions,
  same idle pose in both.

**Mirror rule (decisive)** Mirrored left to right, the figure must look the same. Everything is
symmetric or on the centre line: parted-in-the-middle fringe, one centred braid down the back, matching
sleeves, pockets, sheaths, pouches, boots, knee braces. No watch, sling, asymmetric scar or tattoo. Arms
hang relaxed, hands empty and open, weight even on both feet (a stiff, upright ranger's stance, not a
hero pose). No held weapon in idle.

**Character** Cass Mireles, 34, ex-Army Ranger, hunting guide, search-and-rescue lead. About 170 cm,
lean and strong, square shoulders, straight posture. Oval face, olive-brown skin, dark brown eyes,
straight brows, level mouth, almost no expression. Dark brown hair, short neat fringe centred on the
forehead, one low braid down the centre of the back (so it shows in NE, not in SE). Charcoal-grey
long-sleeve top, sleeves pushed to the forearm, both forearms bare. Dark olive-drab utility trousers
with two identical thigh pockets. Dark tan lace-up boots, same height both sides, knee brace on both
knees. Gear: canvas belt with a centred buckle; chest rig, centred, with a pistol holstered at the
centre front, grip up (SE only; from behind in NE you see the rig straps); two matching knife sheaths,
one on each thigh at the same height, handles forward; two matching ammo pouches, one at each hip.

**Colour roles** (suggestion from the swatch; stay inside it, vary if it reads better)
- Outline and deepest shadow: `#24272a`. Top: `#363b3f`, `#4b5358`, highlight `#646e73`.
- Trousers: `#3b4433`, `#505b40`, highlight `#697653`. Boots: `#45362d`, `#5e4839`, `#785c46`.
- Skin: `#785c46`, `#957456`, `#ae8b66`. Hair: `#302724`, `#45362d`. Eyes: `#302724`.
- Gear and metal: `#565342`, `#77745a` (webbing), `#646e73`, `#818d91` (dull metal).
- No red, no saturated colour. Mood: damp northern woods, muted, overcast.

**Readability** The figure stands on a dark grey-green ground (`#4b4f49`) under overcast light: keep a
clear silhouette, no pure-black blob, face and hands readable at 48 px. The game draws vision cones and
the selection ring in code; do not paint them or a ground shadow.

**Check before handing back** both files are 64 x 64, feet on (32, 56), only palette colours, alpha 0 or
255, the pack script accepts the batch, and a horizontal mirror of each frame still looks like the same
figure (nothing sits on one side only). Report the file paths; the user approves the palette and the look in the
game (Z25 draws the atlas now: reload and start Intro or Base 1). The user approved Cass's physical
description on 2026-11-23 (`DESIGN-characters.md`); the A1 gate is for the palette and the pixel look.

## C2: A2 prompt for Codex (2026-11-23, answers your request; Fighter full set)

Goal: every remaining **Cass Mireles** frame, so the Fighter atlas has no grey stand-ins left.
Files: `art/inbox/A2/fighter/<anim>_<facing>_<n>.png`, then `npm run art:pack -- A2`. The two idle
frames are approved and installed; do not redraw them.

**Frames (per facing, SE and NE, 68 files in all)**

| Anim | Frames | Plays at | What it shows |
| --- | --- | --- | --- |
| `walk` | 4 (0–3) | 8 fps loop | steady patrol walk: 0 right foot forward contact, 1 passing, 2 left foot forward contact, 3 passing; arms swing opposite to legs |
| `run` | 4 | 12 fps loop | lean forward ~10°, longer stride, one foot off the ground on 1 and 3, arms bent and pumping |
| `crouch` | 4 | 6 fps loop | crouch walk: knees deep, back bent, head down, about **34 px** tall (soles to top of head); short careful steps, same 4-beat cycle as walk |
| `crawl` | 4 | 5 fps loop | prone on the belly, about **16 px** tall, body lying along the facing direction; elbows and knees alternate (0 and 2 reach, 1 and 3 pull) |
| `hold` | 1 | still | ambush stance: knees slightly bent, weight forward, knife drawn low in the leading hand, other hand open in front of the chest |
| `work` | 2 | 4 fps loop | kneeling on both knees, both hands working at the ground just in front (one generic pose for fix, cook and traps): 0 hands raised a little, 1 hands down |
| `death` | 4 | 8 fps once | 0 hit, recoils; 1 knees give; 2 falling; 3 lying still on her back on the ground |
| `stab` | 3 | 12 fps once | knife strike to the front: 0 wind-up (knife hand pulled back), 1 thrust fully extended, 2 recover |
| `takedown` | 4 | 4 fps once (fills 1 s) | silent kill from behind: 0 steps in, both arms reaching forward; 1 off hand clamps at head height in front of her, knife hand back; 2 knife driven forward and down; 3 lowers the (unseen) victim, both hands low |
| `carry` | 4 | 8 fps loop | carry-body walk, slower and heavier than walk: a limp body across both shoulders, her hands holding it on both sides; same 4-beat leg cycle |

**Format (same as A1, art/STYLE.md *Atlas contract*)** Exactly 64 x 64 px PNG, transparent, alpha 0 or
255 only, every opaque pixel from `art/palette.json`. Untrimmed; do not re-centre any frame. **Feet
anchor (32, 56)** in every frame: the soles (or the knees, belly or back when kneeling, prone or dead)
rest on row 56, the figure centred on column 32, so frames do not jitter when they swap. Standing
frames keep the idle's **48 px** height; the bob of a stride is at most 2 px.

**Match the approved idle exactly** (`art/frames/fighter/idle_se_0.png`, `idle_ne_0.png`): same
proportions, outline, colours per material, face, hair, clothes and gear. SE shows her front; NE shows
her back with the centred braid. Each loop's frames must read as one figure moving, not as separate
drawings: draw the cycle from one base pose and move only the limbs.

**Mirror rule** The game mirrors SE into SW and NE into NW. Body and gear stay symmetric as in idle.
Things that are naturally one-sided are accepted and swap sides when mirrored: the knife hand (draw it
as her right hand; the knife comes out of that side's thigh sheath, which is then empty in `hold`,
`stab` and `takedown`), the leading leg in a stride, and the carried body's head and legs.

**Knife** Short combat knife, dark matte blade (`#646e73` with a `#818d91` edge pixel at most), dark
grip. No shine streaks or motion blur; show speed by pose only. The holstered pistol stays holstered in
every frame (she fights with the knife only).

**Takedown and carry: draw only Cass.** The victim zombie is a separate sprite drawn by the game; in
`takedown` her hands grip empty space where its head would be (one tile in front, head height ~40 px
above the soles). In `carry` the body is part of her frame: an adult-sized limp figure with no
recognisable zombie detail (zombie art comes later), muted grey-green clothes and grey skin from the
palette, head hanging on one side, legs on the other, blood at most a few dark pixels, kept inside the
64 x 64 cell.

**Death** Gore stays within the game's level (DESIGN §6) but this is the player's own survivor: a little
blood on the torso in the last two frames, centred. Frame 3 lies along the screen diagonal of her
facing, centred on the anchor, everything inside rows 36–60 and columns 4–60; it holds while the
scene swaps in the body sprite, so keep it flat and simple.

**Readability** Same as A1: dark grey-green ground `#4b4f49`, overcast light, clear silhouette, no
pure-black blob, no painted cones, rings or ground shadow. The crouch and crawl silhouettes must still
read as a person at game size.

**Check before handing back** 68 files named exactly as above (`walk_se_0` ... `carry_ne_3`), pack
accepts the batch, and in the game (Intro, Mission 1, Base 1) the walk, run, crouch and crawl loops do
not slide or jitter against the ground and the mirrored SW and NW still look right. Then set
`figures.keys.fighter.status` to `final` and the legacy `survivor_fighter` size to the 48 px scale in
`art/manifest.json` in the same change. Approval: the user, after an in-game preview; the A3 Scout
waits for it. If the full set is too much to judge at once, you may hand back `walk` and `run` first
for an early look, then the rest under the same batch name.

## C3: A2/A3 amendment for Codex (2026-11-23; every survivor shoots)

The user decided every survivor can fire the shared pistol (DESIGN §5). Changes to the art batches:

- **A2 (Cass) gains `pistol_shot`, 3 frames per facing (SE, NE), 12 fps once**, so A2 is now 74 files:
  0 aim: pistol drawn from the chest holster (holster then empty), **both hands together on the
  grip, arms extended forward, centred on the body's centre line** at chest height; 1 fire: same pose,
  a small muzzle flash of at most 4 px from the palette, arms kicked up 1 px; 2 recoil: arms back to
  aim height, flash gone. Same format, anchor and mirror rule as C2. The line in C2 "the holstered
  pistol stays holstered in every frame" still holds for every other anim.
- **A3 (Eli):** add a **pistol holster centred on the front of his hydration vest, between the two
  bottles, grip up** (`DESIGN-characters.md`, updated). His `pistol_shot` uses the same two-handed,
  centred grip as Cass's, not one-handed.
- Grey stand-ins for Cass's `pistol_shot` come from Claude's Z48; the pack accepts the anim once Z48
  is done.

## C4: A3 prompt for Codex (2026-11-23, answers your request; Scout full set)

Goal: every **Eli Varga** frame (key `scout`), so the Scout atlas has no grey stand-ins left.
Files: `art/inbox/A3/scout/<anim>_<facing>_<n>.png`, then `npm run art:pack -- A3`. **66 files**
(33 per facing, SE and NE). Look and gear: `DESIGN-characters.md` *Eli Varga* (approved, with the
centred vest holster). Scale, palette, cell, anchor and mirror rule are the same as A1/A2
(`art/STYLE.md` *Atlas contract*; C1 and C2 above): 64 x 64 PNG, transparent, alpha 0 or 255, every
opaque pixel from `art/palette.json`, feet anchor (32, 56), untrimmed, only SE and NE.

**Staging (recommended, as for Cass):** hand back `idle` SE and NE first so the user can approve
Eli's look in the game (the palette is already approved; the look is not). Then the rest under the
same batch name, `walk` and `run` first if you want an early look.

**Reference:** use Cass's approved sprites (`art/frames/fighter/`) for scale, outline weight, pixel
size and shading; use Eli's idle once approved as the reference for every other Eli frame. Same
block style: large pixel clusters, 1 px selective outline, no anti-aliasing, no added detail.

**Scale** Eli is 180 cm to Cass's 170 cm: standing height **50 px** (soles row 56, top of cap row 6),
2 px taller than Cass, long-limbed, narrow hips, narrow shoulders, head the same size as Cass's. Crouch
about **35 px**, crawl about **16 px**, as for Cass, with his longer limbs showing in stride length.

**Colours** (all inside the palette; vary if it reads better)
- Jacket (faded blue-grey): `#4b5358` shadow, `#646e73` body, `#818d91` highlight, outline `#24272a`.
- Trousers (dark navy, long running trousers, so the legs read as one colour down to the shoes):
  `#24272a` shadow, `#363b3f` body, `#4b5358` highlight. Keep them clearly darker than the jacket.
- Shoes (trail runners, same colour and height both feet): `#4b5358`, `#a1adb0` sole line, `#363b3f`.
- Skin (light brown): `#957456`, `#ae8b66`, `#cab08a` highlight. Beard: `#785c46` / `#957456`, trimmed
  evenly along the jaw (SE only; NE shows the back of the head).
- Hair (sandy brown, short at the sides): `#957456`, `#ad9a67`. Cap, centred, forward-facing,
  `#363b3f` with **one** accent band in `#c7b77d` (the only bright colour on him), centred.
- Vest (hydration vest, worn centred): `#3b4433` olive body, `#505b40` highlight; two matching water
  bottles on the chest at the same height, `#a1adb0` with `#646e73` caps; two matching pouches, one each
  side of the zip, `#565342`; heart-rate chest strap across the centre, `#24272a`; holster centred
  between the two bottles, grip up, `#363b3f` with a `#646e73` grip pixel. No red, no watch.

**Mirror rule** Same as Cass: everything symmetric or on the centre line (cap, bottles, pouches,
strap, holster, shoes). The club is the one one-sided item and swaps hands when mirrored (accepted):
draw it in his **right hand**. In every frame without the club, both hands are empty and relaxed.
The club is shown only in `hold` and `club`; never stowed on his body (it would break the mirror
rule). The holstered pistol stays holstered in every frame except `shot`.

**Club** Short plain wooden club, about 14 px long on screen (a baseball-bat-sized improvised
weapon), `#5e4839` with a `#785c46` highlight and a dark grip wrap `#302724`. No spikes, nails or blood.

**Match the character exactly** across all frames: head and torso blocks, cap, beard, jacket, vest
and gear do not change between frames; only limbs, club and pose move. Draw each loop from one
base pose and move only the limbs, as in A2.

**Frames (per facing, SE and NE; 33 each)**

| Anim | Frames | Plays at | What it shows |
| --- | --- | --- | --- |
| `idle` | 1 | still | standing, weight even on both feet, arms relaxed, hands empty and open, loose runner's posture (a touch less rigid than Cass), no club |
| `walk` | 4 (0-3) | 8 fps loop | light steady stride: 0 right foot forward contact, 1 passing, 2 left foot forward contact, 3 passing; arms swing opposite to legs, relaxed |
| `run` | 4 | 12 fps loop | his best gait: smooth long stride, ~10 degree forward lean, one foot off the ground on 1 and 3, arms bent at 90 degrees and swinging; reads clearly faster and more fluid than Cass's run |
| `crouch` | 4 | 6 fps loop | crouch walk, ~35 px tall: knees deep, back bent, head down, slow careful steps, same 4-beat cycle as walk; legs longer than Cass's, so the knees stick out a little more |
| `crawl` | 4 | 5 fps loop | prone on the belly, ~16 px tall, along the facing diagonal; elbows and knees alternate (0 and 2 reach, 1 and 3 pull) |
| `hold` | 1 | still | ambush stance: knees slightly bent, weight forward on the balls of the feet, club held low in the right hand, left hand open in front of the chest |
| `work` | 2 | 4 fps loop | kneeling on both knees, both hands working at the ground just in front (one generic pose for fix, cook and traps): 0 hands raised a little, 1 hands down; no club |
| `death` | 4 | 8 fps once | 0 hit, recoils; 1 knees give; 2 falling; 3 lying still on his back on the ground; a little blood on the torso in the last two frames, centred; frame 3 lies along the screen diagonal of his facing, centred on the anchor, inside rows 36-60 and columns 4-60 (it holds while the scene swaps in the body sprite) |
| `shot` | 3 | 12 fps once | **pistol shot**, same as Cass's `pistol_shot` (C3): 0 aim: pistol drawn from the vest holster (holster then empty), **both hands together on the grip, arms extended forward, centred on the body's centre line** at chest height; 1 fire: same pose, a small muzzle flash of at most 4 px (palette), arms kicked up 1 px; 2 recoil: arms back to aim height, flash gone. Match Cass's `pistol_shot` frames for the pose and arm height |
| `club` | 3 | 12 fps once | club swing to the front: 0 wind-up (club raised back over the right shoulder, weight back); 1 swing fully extended, club forward at chest height, weight forward, body turned into it; 2 recover, club lowered. Broad readable silhouette |
| `throw` | 3 | 12 fps once | lure throw (a small can or stone; show it only as a 2-3 px `#818d91` pixel cluster in the hand and in flight, or leave it out in frame 2): 0 right arm cocked back, left arm forward for balance; 1 arm fully forward, release; 2 follow-through, arm down across the body. No club in these frames |

**Takedown and carry:** the Scout has neither (Fighter only), so there are no files for them.

**Readability** Same as A1/A2: dark grey-green ground `#4b4f49`, overcast light. Eli's jacket and
trousers are cool and dark: keep a clear silhouette, no pure-black blob, face, beard and cap band
readable at 50 px. No painted cones, rings or ground shadow.

**Check before handing back** 66 files named exactly as above (`idle_se_0` ... `throw_ne_2`), the pack
accepts the batch, and in the game (Intro, Mission 1, Base 1; Eli appears as the Scout) the walk,
run, crouch and crawl loops do not slide or jitter against the ground and the mirrored SW and NW still
look right. Then set `figures.keys.scout.status` to `final` and the legacy `survivor_scout` size to the
50 px scale in `art/manifest.json` in the same change. Approval: the user, after an in-game preview.
**Assumed (change if wrong):** Eli's standing height is 50 px (2 px above Cass's 48) to show the
10 cm difference; if the user prefers one height for all survivors, use 48 px everywhere.

## C5: A7 prompt for Codex (2026-11-24; Cass redrawn at 2×)

Grilled with the user 2026-11-24. Start only after A3 (Eli's full 2× set) is done; Z49 is done.

- **What:** redraw all 76 Cass (Fighter) frames at 2× resolution: same frame list, facings
  (SE, NE), poses, outfit and palette as the approved A2 set. Only the detail level changes.
- **Reference:** the approved 1× frames in `art/frames/fighter/` (pose and palette per frame) and
  C2/C3 above (pose notes, two-handed centred `pistol_shot`). Do not re-design her look.
- **Spec:** `art/STYLE.md` *Character resolution*: 128×128 transparent, untrimmed cells, Cass
  96 source px tall, feet anchor (64,112), shared palette, crisp pixels, mirror rule. New source
  art with real added detail; an enlarged 1× frame does not meet the rule.
- **Gate 1:** `art/inbox/A7/fighter/idle_se_0.png` and `idle_ne_0.png` first, in an in-game preview
  next to 2× Eli; the user approves before any other frame.
- **Gate 2:** the other 74 frames in `art/inbox/A7/fighter/<anim>_<facing>_<n>.png`; preview; user
  approves.
- **Install:** set `atlases.fighter.scale` to 2 (Z49) and pack the fighter sheet, then delete the 76 old 1×
  frames in `art/frames/fighter/` (git history keeps them at `b8508763`).

## C6: A4 prompt for Codex (2026-11-24; fresh zombie crowd, 3 bodies at 2x)

Grilled with the user 2026-11-24: zombies are a **mixed crowd of ordinary rural people**, three bodies
(`a`, `b`, `c`) per decay level. A4 draws the **fresh** level only: `zombie_fresh_a`, `zombie_fresh_b`,
`zombie_fresh_c`. Decayed and rotting (A5) later wear down the same three bodies. Z50 is done: the
manifest has nine zombie keys `zombie_<decay>_<body>` and three 2x atlases `zombies_fresh`,
`zombies_decayed`, `zombies_rotting` (scale already 2, grey 128 px stand-ins installed; the old
`zombies` atlas and the keys `zombie_fresh`, `zombie_decayed`, `zombie_rotting` are gone). No scale
switch is needed at install.

**Files:** `art/inbox/A4/<key>/<anim>_<facing>_<n>.png` for each of the three keys, then
`npm run art:pack -- A4`. **96 files** (3 keys x 16 per facing x SE and NE).

**Staging (as for Cass and Eli):** hand back the six idles first (`idle_se_0` and `idle_ne_0` for each
body) in an in-game preview next to Cass and Eli; the user approves the three looks before any other
frame. Then the other 90 frames under the same batch name; the user approves, then you install.

**Format and spec:** `art/STYLE.md` *Character resolution*, *Zombie crowd* and *Atlas contract*, same as
A3/A7: **128 x 128** transparent untrimmed cells, binary alpha, every opaque pixel from
`art/palette.json`, feet anchor **(64, 112)**, only SE and NE, crisp pixels, real added detail at 2x
(not enlarged 1x frames). **Mirror rule** as for survivors: wounds, tears, blood and clothing details
sit on the centre line or in matched pairs; nothing on one side only. Match Cass's and Eli's scale,
outline weight and shading.

**The three bodies** (distinct in build, clothing and silhouette: they must read apart at 48 px)

| Key | Who | Source height | Clothes (muted, no logos, palette colours only) |
| --- | --- | --- | --- |
| `zombie_fresh_a` | adult man, broad, heavy shoulders | **96 px** (48 world, as Cass) | canvas work jacket, plain trousers, work boots, short hair |
| `zombie_fresh_b` | adult woman, slim | **92 px** (46 world) | long knit cardigan over a plain top, trousers, trainers, hair to the shoulders, parted in the middle |
| `zombie_fresh_c` | teenager, thin | **88 px** (44 world) | hooded top (hood down, centred), jeans, trainers, short hair |

Heights, hair and clothing are my proposal (assumed; change a detail if it reads better, but keep
three clearly different silhouettes). Keep heights near Cass's 96 px: the world has one scale.

**Fresh look (all three):** recently turned. Pale grey skin (palette greys with a faint warm tint, not
green), dark vein lines at the temples and neck in matched pairs, clouded blank eyes, slack open mouth
with dark blood at the mouth and a centred stain down the chest. Clothes torn at matched places (both
sleeves or both hems), no missing limbs, no exposed bone yet (that is decayed and rotting). Same
visible-gore level as the survivors' death frames, a little more blood than Cass. No red outside the
blood pixels; blood uses the dark reds already in the palette.

**Frames per facing, per body (16)** (rates: `data/anims.json`)

| Anim | Frames | Plays at | What it shows |
| --- | --- | --- | --- |
| `idle` | 1 | still | standing, weight even, arms hanging slack, head level and centred, mouth open |
| `shamble` | 4 (0-3) | 5 fps loop (7 fps when investigating) | slow dragging walk: 0 right foot forward contact, 1 passing, 2 left foot forward contact, 3 passing; arms hang and sway a little, head and shoulders low, the rear foot scuffs |
| `lurch` | 4 | 10 fps loop | the chase: leaning forward about 15 degrees, both arms reaching out in front (centred, matched), long hungry stride, mouth wide; same 4-beat leg cycle |
| `bite` | 3 | 12 fps once | 0 lunges in, arms out, head back; 1 head thrust forward and down, mouth wide; 2 recoil, head up. Draw only the zombie (the victim is its own sprite) |
| `death` | 4 | 8 fps once | 0 hit, jerks; 1 knees give; 2 falling; 3 lying still on its back along the screen diagonal of its facing, centred on the anchor, inside rows 72-120 and columns 8-120 of the 128 px cell; the scene swaps in a body sprite after frame 3, so keep it flat |

Each loop's frames must read as one figure moving: draw from one base pose and move limbs only. Frame
heights stay constant, bob at most 4 px. Zombies carry no weapons or props.

**Readability:** the ground is dark grey-green `#4b4f49` under overcast light; keep a clear silhouette
and no pure-black blob. Keep zombies apart from the survivors by colour: Cass is charcoal and olive,
Eli is blue-grey and navy; zombies are paler skin with browns, faded olives and washed-out colours.
The game draws sight circles and cones in code; paint none and no ground shadow.

**Check before handing back:** 96 files named exactly (`idle_se_0` ... `death_ne_3` under each key
folder), pack accepts the batch, 128 px, palette, binary alpha, anchor (64, 112), a horizontal mirror of
every frame still looks like the same figure, and in the game (Intro, Mission 1, Base 1) the three
bodies appear in the crowd with no sliding or jitter. Then set `figures.keys.zombie_fresh_a`, `_b` and
`_c` `status` to `final` in the same change that installs the last frames (the game picks only among
final keys, so the crowd is exactly these three bodies until A5 lands). Approval: the user, after an
in-game preview.

## C7: amends C6 / A4 and sets the A5 look (2026-11-24; grilled with the user)

**1. New anim `reach` for every zombie (A4 now 120 files).** Z51 is done: the manifest has
`reach` 4 in all nine zombie keys and grey 128 px stand-ins are installed, so `art:pack` accepts it.
Each A4 body gains `reach_se_0..3` and `reach_ne_0..3` (+8 files per body, +24 in all; A4 = 3 x 20
per facing x 2 = **120 files**). The idle gate you are running is unchanged; draw `reach` with the
other frames after the user approves the idles.

| Anim | Frames | Plays at | What it shows |
| --- | --- | --- | --- |
| `reach` | 4 (0-3) | 5 fps loop (7 fps when investigating) | the shamble's slow dragging leg cycle (same 4 beats as `shamble`), but **both arms raised straight forward at chest height**, matched and centred, hands open and clawing a little, head pushed slightly forward, mouth open. The game plays it when a walking zombie that is not chasing comes within 2 tiles of what it goes for (a survivor, a lure spot, a barricade it will chew); `lurch` stays the chase |

Draw `reach` from the same base pose as `shamble` so the switch between them does not jump (legs
match frame for frame; only the arms and head change).

**2. Decayed and rotting are much grimmer (for A5; fresh stays as in C6).** The user wants the
decay levels to read like classic survival-horror zombies. Use that genre's general look only: no
character, costume or design copied from any existing game. The same three bodies (`a` man in work
jacket, `b` woman in cardigan, `c` teenager in hoodie) keep their build and clothes so they stay
recognisable, but heavily deteriorated. **Everything stays symmetric** (mirror rule): damage on the
centre line or in matched pairs, no missing limbs.

- **Decayed:** blotched grey-brown skin, torn open in matched patches; exposed dark muscle at both
  forearms; ribs showing through a shredded, blood-soaked shirt (centred); clothes in rags with
  matched tears at both sleeves and hems; lips pulled back from the teeth; clouded eyes.
- **Rotting:** near-skeletal face (exposed teeth and jaw, nose gone, sunken dark eye sockets);
  bone visible at both forearms and both shins; skin dark, leathery and peeling in matched strips;
  clothes hanging in strips, mostly colourless with old dark stains; thin and hunched, same height.

Same anims and frame counts as fresh, `reach` included. **Looks only:** decay changes no HP, speed or
senses in the game.

## C8: zombies limp and walk lopsided; walks get 6 frames (amends C6 / C7; 2026-11-24, grilled with the user)

**Z52 is done:** the manifest has `shamble` 6, `reach` 6, `lurch` 6 in all nine zombie keys, and the
grey stand-ins are installed, so `art:pack` accepts them. A4 is now **156 files**: per facing per body,
idle 1 + shamble 6 + reach 6 + lurch 6 + bite 3 + death 4 = 26, x 2 facings x 3 bodies. The game
plays one 6-frame cycle in the same time as the old 4-frame one (shamble and reach 7.5 fps, 10.5 when
investigating; lurch 15 fps), so walking speed and foot placement are unchanged. Draw the extra
frames as more of the drag and hitch, at even timing.

**The look.** Every zombie limps and stands lopsided, in the general manner of classic survival-horror
zombies (mood only: no character, pose or design copied from any game). One stiff leg is dragged, the
step hitches, the head lolls to one side and one shoulder is dropped.

**Mirror-rule exception (user, 2026-11-24).** This one-sidedness is allowed for zombie **poses and
gait** only. When the game mirrors SE to SW, the bad side swaps; that is accepted. Wounds, tears and
decay damage (C7) stay centred or paired, as before.

**Each body has its own limp,** the same at every decay level (fresh, decayed and rotting limp alike):

- **a** (man, work jacket): drags his right foot behind him on its toe; right shoulder low, head
  lolling right.
- **b** (woman, cardigan): stiff left knee that will not bend, swung out sideways in an arc each
  step; hips tilt; head hanging to the left.
- **c** (teen, hoodie): ankle turned in, so he steps on the side of that foot; the upper body jerks
  forward on each step, head bobbing.

**Frames:**

| Anim | Frames | What it shows |
| --- | --- | --- |
| `idle` | 1 | lopsided stand: weight on the good leg, the bad leg slack (a: toe resting behind; b: stiff leg out a little; c: foot rolled in), head tilted, one shoulder dropped, arms hanging. **Redraw the 6 idles already in `art/inbox/A4/`** like this before the idle gate |
| `shamble` | 6 (0-5) | 0 good foot plants; 1 quick pass, body drops onto the good leg; 2 bad foot reaches forward; 3 weight on the bad leg, body lurches and tilts toward it; 4 the good leg swings through while the bad side sags; 5 hitch back up, head bobbing. The rear foot scuffs; arms sway unevenly |
| `reach` | 6 (0-5) | the `shamble` legs frame for frame (same body tilt), with both arms raised forward at chest height, hands open and clawing a little (arms may sit unevenly with the dropped shoulder) |
| `lurch` | 6 (0-5) | the chase as a fast, lopsided hobbling lunge: leaning forward, both arms out in front, big quick strides on the good leg and a hurried hop or drag on the bad one, same 6 beats as `shamble` |
| `bite`, `death` | 3, 4 | as in C6, starting from the lopsided stance |

Order: redo the 6 idles lopsided, then the user's idle gate, then the other 150 files (C6 + C7 + C8).
A5 (decayed and rotting) uses the same limps per body with C7's decay looks.

## C9: UI art, batches A8-A11 (2026-11-24; grilled with the user)

The figures are done or in progress. **Finish A5 (rotting) first.** The UI comes next, before any
environment art (that gets its own grilling later). Claude builds the code slots with grey stand-ins
first: **Z53** (the `ui` atlas contract, stand-ins, `art:pack` support) and **Z54** (the kit and
icons used in the scenes). **Z53 and Z54 are done** (A8 can start): the exact
key names, source sizes and 9-slice insets are in `art/manifest.json` `ui` (table in `art/STYLE.md`
*UI art*); the manifest wins over the sizes below. Deliver files flat as
`art/inbox/<batch>/ui/<item>.png` (no key folder, for example `art/inbox/A8/ui/kit_panel.png`), at the
item's exact source size, then `npm run art:pack -- <batch>`; set each installed item's `status` to
`final` in the manifest. Cursors and title images are standalone files, not atlas frames.

**Look: "worn field kit".** Dark weathered panels like scuffed canvas and worn, chipped metal;
stitched or riveted edges; text is the typewriter font Special Elite (code draws all text, never paint
words except the logo). Small painted icons, readable at their size, with a dark outline. Sparse
blood-red accents only for danger. Crisp pixel art, snapped to `art/palette.json`, alpha 0 or 255,
like the figures. **Everything is drawn at 2x** (the game shows it at half size), except the cursors
(1x) and the title art (1x, shown 2x).

Each batch has a **first-sample gate**: deliver the sample, the user approves it in the game, then
the rest.

### A8 UI kit (9-slice)
Pieces stretch from their corners (9-slice; the slider track 3-slice). Display size / source size:

| Key | Display | Notes |
| --- | --- | --- |
| `kit_panel` | 48x48 (96 source), corners 12 | dark canvas over a worn metal rim; used for the action bar, dialogue box, pause/options menu |
| `kit_button_normal`, `_hover`, `_pressed`, `_disabled` | 48x48, corners 10 | raised worn-metal tile; hover a little lighter rim; pressed sunk; disabled flat and dull |
| `kit_button_active` | 48x48, corners 10 | the lit frame for an active action (chosen weapon, held position, crouched): a dull amber rim |
| `kit_card` | 48x48, corners 8 | squad card: lighter canvas, taped corners |
| `kit_tooltip` | 32x32, corners 6 | small dark paper label |
| `kit_slider_track` | 64x12, ends 6 | groove |
| `kit_slider_knob` | 16x20 | metal tab |
| `kit_check_off`, `kit_check_on` | 20x20 | box; on = a scratched X mark |

**Sample:** `kit_panel` + the four button states.

### A9 Icons + cursors (replaces A6)
- **Action bar, 16 icons, 48x48 display (96 source):** `icon_bar_knife`, `_gun`, `_club`,
  `_takedown` (grab from behind), `_carry` (body over shoulder), `_lure` (thrown stone/bottle with an
  arc), `_hold` (raised flat hand / crosshair over a boot), `_freefire` (pistol with a spark),
  `_crouch` (crouching figure), `_eat` (open can and spoon), `_give` (hand passing a can), `_fix`
  (hammer and nails), `_cook` (pot over flame), `_barricade` (crossed planks), `_spike` (sharpened
  stakes in a pit), `_can` (tin cans on a string). No letters; the code draws the key and ammo count.
- **HUD, 8 icons, 24x24 display (48 source):** `icon_hud_food`, `_scrap`, `_ammo`, `_hunger`,
  `_zombie` (head), `_herd` (clock), `_crate`, `_hp` (heart).
- **Cursors, 5, 32x32 at 1x (the browser draws them unscaled):** `cursor_select`, `_attack`,
  `_use`, `_move`, `_run`, each with a hotspot Z53 records.
- **Sample:** knife, gun, crouch and fix bar icons.

### A10 Portraits
- **Large, 128x128 display (256 source):** head and shoulders of Cass (`fighter`) and Eli (`scout`),
  per `DESIGN-characters.md`, matching their approved sprites' clothes and colours. Four moods each:
  `portrait_<who>_neutral`, `_afraid`, `_determined`, `_hurt` (bloodied, pale, wincing). Plain dark
  background, no frame (the kit frames them).
- **Small, 36x36 display (72 source):** hand-pixelled heads, not a downscale:
  `portrait_small_<who>_neutral`, `_hurt`.
- **Sample:** Cass and Eli neutral (large).

### A11 Title
- `title_bg`, **640x360 at 1x, shown 2x:** Cass and Eli at the edge of dark woods at dusk, seen from
  behind or three-quarter, a few zombie silhouettes among the trees, the overcast palette. Leave the
  centre-left calm for the menu buttons.
- `title_logo`, about 400x120 at 1x: "Dead Woods" in a worn stencil/typewriter style, scratched and
  weathered (the only painted words).
- **Sample:** a rough composition of `title_bg` before the finished art.

The game also uses `title_bg` dimmed behind the pause menu.

## Taken from Codex
- None.
