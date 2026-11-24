# Claude handoff (Survival)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- AB16 revision 1 (elder woman) reviewed 2026-11-24 (K30, answers Codex's K30): approved on the user's instruction ("approve elder woman"); Codex may install the whole batch; AB17 child may start.
- AB15 revision 1 (elder man) reviewed 2026-11-23 (K29, answers Codex's K28): approved, Codex may install the whole batch; AB16 may start (braid note in K29).
- AB14 revision 2 reviewed 2026-11-23 (K27): approved, Codex may install the whole batch. Revision 1 (K26) was not approved and stays uninstalled.
- Art reviews C2-C11 and C13 done 2026-11-22 (see *Art reviews* below): approved AB1, AB7, AB6, AB8; AB9 revision 2 approved 2026-11-23 (K14, installable now); AB2 revision 2 approved 2026-11-23 (K15, installable now); AB5 revision 2 approved 2026-11-23 (K16, installable now); AB3 revision 2 approved with 2 fixes 2026-11-23 (K17: ford and berry only, revision 3); AB3 revision 4 approved 2026-11-23 (K19, install now); AB3 revision 3 reviewed 2026-11-23 (K18: berry approved, ford needs revision 4 with its own-colour 4 px band, SPEC/STYLE amended); revisions needed AB10 (three lodges), AB11, AB13. AB1, AB6, AB7 and AB8 can be installed now; the others wait for their revision 2 (AB4 still waits for AB3).
- Art spec (2026-11-20): DESIGN-art.md, art/STYLE.md, art/SPEC.md, art/PIPELINE.md,
  art/BATCHES.md, PLAN.md *Phase D: art* (AC1-AC9, AB0-AB23). AC1 (manifest v2 and the
  validator), AC2 (pack and stand-ins scripts), AC3 (atlas loader, `spriteFor`), AC4 (people), AC5 (terrain) AC6 (buildings) and AC8 (interface) done 2026-11-20; AC7 (creatures and effects) and AC9 (performance) done 2026-11-21; the Claude art code rows are finished, so the next art step is Codex's AB0 once the user says go.

## Art reviews (Claude's approval authority)
- **K30 / C16, AB16 revision 1 (elder woman): APPROVED 2026-11-24 (install; AB17 may start).** The user said "approve elder woman", so
  this is their decision, backed by a light look: I viewed `comparison.png`, `k29-front-4x.png` and `camp-actions-2x-1280.png`. Grey
  hair / braids show in the front views, the head is visible above the shoulders (K29 note applied), the dress is a looser blue cape, the
  figure is stooped and shorter than the adult woman, and the scrape table, sit and die poses keep the approved AB14-r2 rig. In the camp at
  2x both family tints separate and the elders read as elders. Not checked by me: the GIF loops, planted work feet, the 464 pair counts and
  the 2560 captures (Codex's numeric checks stand). At this size the braids are small; acceptable. Install the whole AB16 batch (928 frames)
  as delivered. Next: AB17 child.

- **C2, AB1 revision 1: APPROVED 2026-11-22.** Reviewed contact sheet, menu 1280 and camp 1280 / 2560. Panel and button
  corners hold at both sizes; the hide / lashed-pole look matches AB0; the emblem (tipi, fire, crescent, dusk prairie, rope-twist rim)
  fits STYLE section 10 and reads at the menu's small size. One non-blocking check for install: in the camp captures the Wotakuye bar
  frame is hard to see around the green fill; confirm at install that the `ui_bar_frame` 9-slice shows its carved edge in the live HUD.
  Install with AB0's other UI frames.

- **C3, AB2 revision 1: APPROVED WITH 3 SMALL FIXES, 2026-11-22.** Reviewed the contact sheet, the 16 px strip and the camp /
  upgrades captures. All 52 icons and 5 cursors match the AB0 style and the light (upper left), read on both grounds, and the
  upgrade rows and speed buttons look right in the live HUD. Spirits are pale-blue translucent with no face (good), the rider
  icon is the brief's galloping horse with a lance, and the shared scout pole is accepted. Fix these three in revision 2 (the
  other 59 frames stay byte-identical, so the batch can be installed once these are redone):
  1. `icon_upgrade_dogs`: reads as a golden retriever, a modern breed. Redo as a lean, pointed-ear, mixed camp dog (wolfish,
     grey-brown to tan), still sitting.
  2. `icon_order_draft` / `icon_order_undraft`: at 16 px they are the same club at the same angle. Keep the draft club raised
     in a hand; lay the undraft club flat on the ground (near-horizontal, a grass tuft under it) so the two differ in silhouette.
  3. `icon_order_hold`: the planted lance is a hairline at 16 px and nearly vanishes. Thicken the shaft and spear point (about
     2 px at 16 px) and keep the planted grass base.
  Optional, not a fix: `icon_job_hunt` (thin bow) is the faintest of the job icons at 16 px; a slightly heavier bow would help.

- **K15 / C3, AB2 revision 2: APPROVED 2026-11-23.** Reviewed `changes.png`, `readability.png`, the 16 px strip, `upgrades-1280.png` and
  the draft / undraft frames enlarged. Checked byte for byte against `art/inbox/revisions/AB2-r1/`: exactly `icon_upgrade_dogs`,
  `icon_order_undraft` and `icon_order_hold` differ; the other 59 frames are identical (Codex's count stands). (1) The dog is now lean with
  pointed ears, grey-brown to tan, still sitting; no longer a retriever. (2) At 16 px the raised draft club (diagonal, in a hand) and the
  flat undraft club are clearly different silhouettes. (3) The hold lance has a thick shaft and a pale stone point and reads at 16 px.
  Install the whole AB2 batch as delivered. Not blocking: the grass tuft under the undraft club is only a faint yellow-green sliver (I asked
  for a visible one); acceptable since the silhouette alone now separates it. Not checked by me: the cursor hotspots and the 2560
  captures (Codex's JSON checks stand).

- **C4, AB3 revision 1: NOT APPROVED, revise (2026-11-22).** Reviewed the contact sheet, the summer water-join, summer forest,
  ford and spring berry fields, and the spring and winter camp captures. Seasonal colour steps are right (spring fresh, autumn
  copper, winter snow) and no seams show, but several keys miss STYLE section 7 because the flattening left almost no detail:
  1. `tile_ford` is indistinguishable from `tile_river` (same blue, same flat noise). Spec: ford shallows #9DBDB2 / #7FA59C over
     pale stones and gravel, visibly lighter than the river. Redo all four seasons with pale pebbles and a lighter, greener-grey
     water; keep the shared 4 px edge band so it still meets the river without a line.
  2. `tile_river`: no gentle current lines and no darker middle (STYLE: "darker in the middle of the diamond"). Add soft flow
     streaks and a deeper centre, edge band unchanged.
  3. `tile_forest` is a flat brown fill. Spec: dark loam with oak leaf litter, ferns and roots. It needs visible leaf litter and
     some fern / root texture in all seasons (winter: litter under a snow dusting, not a flat blue-grey).
  4. `tile_berry` reads as plain grass (spring and summer especially). Spec: a woodland-edge thicket of low shrubs with small dark
     red berries (#8E2A30) among the tall grass. The tile itself needs shrubs and a few berries; the bush sprites alone are not enough.
  5. `tile_grass` spring, autumn and winter are near-flat colour. Summer (AB0, user-approved) has fine strand texture; the other
     seasons should carry the same strand scale and the section 7 cues (spring: early flowers; autumn: seedheads and russet
     stems; winter: grass tips poking through the snow). Do not flatten lighting so far that the tile loses its texture.
  Passed: invariant 8 px band and 4 px water band (no grid in the camp captures), summer grass unchanged from AB0, winter snow
  grounding. After the revision re-send the 12 x 12 fields at 1x and the camp captures; also include a river-ford-river strip.
  Note: the faint diagonal lines Codex saw at summer 2x are not visible at 1x; check them again once the textures have detail.

- **K17 / C4, AB3 revision 2: APPROVED WITH 2 FIXES, 2026-11-23.** Reviewed the overview, native 12 x 12 fields (grass, forest, berry),
  the river-ford-river strip and the summer / autumn / winter camp and ford captures at 1x and 2x. Forest now has leaf litter, ferns and
  roots in all seasons, and winter shows litter under a dusting (good); the river has current streaks; the seasonal colour steps are
  right; the 4 px water band and the 8 px variant band hold (no joins at 1x). Fix in revision 3 (grass, river and forest stay byte-identical):
  1. `tile_ford`, all four seasons: at 1x in the camp captures it is still almost the river's blue with a few pale specks, so a ford
     does not read as shallows. Spec (STYLE section 7): #9DBDB2 / #7FA59C, visibly lighter and greener-grey than the river, over dense pale
     pebbles and gravel. Lighten the water, make the gravel bigger and more numerous (readable at 1x), keep the shared 4 px edge band.
  2. `tile_berry`, all four seasons: spring and summer are green with dark texture but no red berries are visible (the spec asks for small
     dark red #8E2A30 berries among low shrubs). Add a few readable red berries and shrub clumps; autumn and winter are fine.
  Not blocking, no change asked: (a) the grass tiles other than summer are nearly flat colour at 1x (autumn is a strong orange, not russet;
  no seedheads or early flowers). Summer, the user-approved AB0 tile, is equally flat at 1x, so this is consistent; the `tuft_grass` props
  carry the cues in the camp. If wanted later, make autumn a little browner. (b) The forest texture repeats on a visible lattice in the 12 x 12
  field; at 1x in the camp it is hidden under the trees. (c) **The faint diagonal lines Codex flagged are real**: in `ford-summer-2x-1280.png`
  thin dark lines cross the grass and the water along the tile diagonals. They also cross AB0's approved summer grass, and the shared bands and
  alpha are unchanged, so they are not from the new paintings; I think they come from the diamond edges' alpha being blended at fractional zoom
  in the baked chunks. That is a code check for me (terrainView chunk bake), not a Codex fix; it is not visible at 1x.
  **Fixed in code 2026-11-23 (no art change asked):** the cause was as guessed. The ground tiles are hard-edged diamonds drawn at half size, so their
  edge pixels are half transparent, and the chunk texture under them is empty, so every shared edge left a faint dark seam (visible in a zoom 2
  screenshot even with the code-drawn placeholder tiles). `TerrainView.skinGround` now draws each ground image `SEAM_GROW` (1 + 2 / 64) larger so
  neighbours overlap by about a pixel. Screenshots at zoom 1, 1.5 and 2 on plain grass (throwaway script, deleted): the seam lines are gone and only
  the placeholders' own per-tile brightness noise is left; dark-pixel count fell from about 5,300-5,900 to 620-730 of 80,000. 293 unit tests and
  `npm run e2e` (24 tests) pass. Not checked: the overlap along a river bank with the real AB3 art at zoom 2 (the AB3 candidate is not installed),
  so look at it once at AB3's install check.

- **K18 / C4, AB3 revision 3: BERRY APPROVED; FORD NEEDS REVISION 4 (band decision), 2026-11-23.** Reviewed `changes-tile_ford.png`,
  `changes-tile_berry.png`, the river-ford-river summer strip, a spring berry field enlarged, and `ford-summer-1x-1280.png`.
  **Berry: approved.** Spring and summer now show dark red berries among shrub clumps at native size (checked enlarged in spring); autumn
  and winter are fine. Not blocking: the clump pattern repeats on a visible lattice in the 12 x 12 field, like the forest (K17 b); hidden by bushes in the camp.
  **Ford: the colour is right now** (pale green-grey shallows with dense gravel, clearly lighter than the river), **but the shared blue
  4 px band draws a grid** across the ford in the fields and in the camp capture. Decision (mine; the band rule was my own spec): **the
  ford does not carry the river's blue band.** Revision 4, `tile_ford` only, all four seasons (16 frames; the 16 berry frames of r3 and
  all grass, forest and river frames stay byte-identical):
  1. Make the outer 4 px band of each ford frame the ford's **own** shallows mid colour: the mean colour of that frame's interior at the
     band's inner edge, with no blue, so the band is invisible against the interior. Keep the diamond alpha and the 8 px variant-band
     rule (variants 1-3 keep details 8 px from the edge).
  2. Accept the ford-to-river join as a plain shoreline (pale shallows against blue deep water). To avoid a razor edge, you may add a
     soft 3-4 px darkening of the shallows just inside the band (a wet-stone edge), the same on every edge so ford-to-ford stays seamless.
  3. SPEC.md and STYLE.md are already amended (the band rule is now per tile type), so validation and the packer need no change.
  Re-send: the 12 x 12 native fields, the river-ford-river strip, and the summer and winter ford camp captures at 1x. I will check that no
  grid shows in the field and that the shoreline against the river reads cleanly. AB5 revision 2 (K16) stays approved for installation.

- **K19 / C4, AB3 revision 4: APPROVED 2026-11-23 (install now).** Reviewed the before / after fields (all four seasons), the
  river-ford-river summer strip and the summer and winter ford camp captures at 1x. The blue lattice is gone: each ford is one continuous
  pale green-grey shallow with fine gravel, no joins between ford tiles, and it meets the river along a clean shoreline that reads as a
  ford at 1x in summer and in winter. Interiors keep r3's colour and gravel. I did not byte-check the 64 unchanged frames (Codex's hashes
  stand). Install the whole AB3 batch (80 frames) as delivered, then AB4 may start. At the install check, look once at a river bank
  beside the real ford at zoom 2 (the `SEAM_GROW` overlap fix was only tested on placeholders and the candidate). Not blocking: the
  ford is a flat rectangle of pale tiles with no stepping stones or current; acceptable. AB5 revision 2 (K16) install also stays approved.

- **K20 / C4, AB4 revision 1: APPROVED 2026-11-23 (install now).** Reviewed the contact sheet (92 frames, four seasons), the native mask
  proofs, summer and winter river at 2x, the whole-map overview and the forest / berry islands. The 15 bank masks join at corners with no gaps
  or doubled edges, the muddy band follows the river's stepped outline cleanly at 2x in summer and winter (winter band is brown stones with
  snow beyond it), the water side blends to the river's edge colour, and the forest and berry spills fade softly into grass on all four
  edges. Not blocking, no change asked: (a) the reeds are not visible at 1x or 2x, so the bank is a thin mud line only (STYLE asks for
  "small reeds"); acceptable, the `tuft_grass` props and trees carry the shore; (b) the forest spill is dark and a little hard at its outer
  edge next to bright summer grass. **Install checks (please look at both):** (1) a grass tile beside a **ford** gets the same bank, whose
  water side is the river's blue; against the new pale ford it may show as a thin blue line. If it does, tell me with a capture and I will
  decide (my first idea: the runtime skips the blue edge or uses no bank beside a ford); (2) the bank overlap at zoom 2 with `SEAM_GROW`
  (as K17). No runtime change is asked now. AB5 revision 2 and AB3 revision 4 installs also stay approved.

- **K21 / AB4 install check, ford bank: RETAIN, no change, 2026-11-23.** Reviewed `ford-summer-2x-1280.png` and `ford-winter-2x-2560.png`
  (the ford in context). The ford is a pale strip across the river; at its two land ends the bank's water side leaves only a faint blue
  lip a few pixels wide, which reads as the water edge of the river passing the ford and is not noticeable at 1x or 2x. The bank outline
  is continuous, with no dark seam or doubled edge, so the `SEAM_GROW` overlap works with real AB3 and AB4 art. No runtime change and no
  art change. AB4 is closed. Not checked by me: the other captures in `test-results/ab4-installed/` (Codex's checks stand).

- **K22 / C10, AB10 revision 2: APPROVED 2026-11-23 (install now).** Reviewed the contact sheet, the spirit before / after, the summer camp
  at 0.5x and the winter camp at 1x (2560). The three lodges now separate at a glance: the lancers' lodge has three lances rising clearly
  above the dome, the archers' lodge a large straw target on a tall frame above the roofline with the bows beside it, and the scouts' lodge
  its pole and pennant; all three are readable at 0.5x in the live camp and in winter. The spirit lodge has a pale-blue light in the doorway
  that shows in the finished and winter frames (modest in winter, but it is the only lodge with a lit door), with the soft light on the
  cleared earth in the build stages; no symbols. The target frame is tall but not too tall: it reads as a target, not a sign. Healers and
  scouts stay byte-identical per Codex's hashes (not re-checked by me). Not blocking: the spirit lodge's pale body and the ground glow in
  stages 1-2 make it look slightly like a different material from the others; acceptable for a spirit building. Install all five AB10 keys
  (25 frames) as delivered.

- **K23 / C11, AB11 revision 2: STORE AND OPEN STORE APPROVED; `fire_central` NEEDS A SMALL REVISION 3, 2026-11-23.** Reviewed the contact
  sheet, `changes.png` (before / after), the full store and the plaza in the live camp at 1280, and the native `fire_central/finished_00`
  (pixels sampled).
  **Approved (install now, `building_store` and `building_store_open`, 6 frames):** the shadowed walls and cutaway faces are now blue-grey
  with a lit bark texture instead of near-black, the open floor stays clear for the items, the full store still reads as four goods, and the
  roof is acceptable beside the tipis in the live camp (C11's install check passes; it is the brightest orange in the camp but not wrong).
  **Not approved: `fire_central` finished and winter (2 frames; 00 only).** (1) The drying strips now hang broadside, but they are
  near-black, not dark red-brown: the darkest strip pixels are about (12, 2, 3) and the strip mean about (30, 10, 8) against the asked
  #812F27 / #8A3A2E (C9, C11). At 1x in the plaza (`fire-summer-1280.png`) the poles look empty, so the strips do not read as meat. They
  are shaded like the pole's own dark wood; light them like the AB9 r2 drying rack (strips lit on the camera-facing side, a clear
  red-brown, nothing below about #3A1A14 anywhere on a strip). Keep them still. (2) Circle contrast is fine (#A0805D reads on the cleared
  earth at 1x) and the shape, seats, mats, drum and hearth stay as they are. Redo only `fire_central` finished 00 and winter 00; send
  them with the strip pixel measurements. The six other frames stay byte-identical.
  Codex may install the two store keys now (repack the buildings atlas without `fire_central`, or wait and install the whole batch once
  the plaza is approved; Codex's choice).

- **K24 / C11, AB11 revision 3: APPROVED 2026-11-23 (install the whole AB11 batch now).** Reviewed `changes.png` (r2 / r3), `fire-summer-1280.png`,
  `fire-winter-1280.png`, `strip-measurements.json`, and sampled the native `fire_central/finished_00` (reddish opaque pixels: mean (132, 51, 42), about
  #84332A, minimum (111, 39, 34)) and a 4x enlargement of the 1x summer plaza. The twelve strips are now a clear red-brown on both poles, in summer and
  winter, and read as hanging meat at 1x (the poles no longer look empty); the measured strip cores (about (131, 48, 40)) match the asked #812F27, and
  nothing sampled in the core is below #3A1A14 (one strip has a (58, 29, 23) edge minimum, at an attachment, not blocking). Circle, seats, mats, drum,
  hearth and flame anchor are unchanged; the six store frames are byte-identical to the K23-approved ones per Codex's hashes (not re-checked by me).
  Not blocking: the red is a little saturated against the brown plaza, so the strips are the plaza's brightest red; acceptable, they are small.
  Install all eight AB11 frames (`fire_central`, `building_store`, `building_store_open`) as delivered; if the two store keys were already installed,
  just add `fire_central`. Then AB13 revision 2 (tools) remains before AB14.

- **K25 / C13, AB13 revision 2: APPROVED 2026-11-23 (install; AB14 may start).** Reviewed `changes.png` (r1 / r2, all frames at 1x), enlarged 1x
  crops of the eight-man camp rows for chop, build, strike, scrape, tend and fish, and byte-compared `art/inbox/AB13/person_man/` with
  `revisions/AB13-r1/`: exactly 544 frames differ (build 96, chop 96, fish 96, scrape 96, strike 96, tend 64) and the other 864 (carry 128, dance 128,
  die 96, gather 96, idle 64, shoot 96, sit 32, thrust 96, walk 128) are identical, so Codex's counts stand. At 1x: **chop** now has a grey axe head
  raised clearly above the head; **build** shows the maul brought down to a stake on the ground, a different silhouette from chop; **strike** a narrow
  dark club raised overhand; **scrape** a seated man at an orange hide frame; **tend** a kneeling pose; **fish** a long spear angled to the water. The
  six actions can now be told apart in the live camp. Cloth greys unchanged (user, 2026-11-22). Not checked by me: the GIF loops and planted feet
  (Codex's numeric checks stand). Not blocking: chop and strike are both overhead raises and differ mainly by the head (wide grey axe against a
  narrow dark club), and tend is still the faintest action at 1x; acceptable, and the woman, elders and child should copy this tool scale.
  Install the whole AB13 batch as delivered, then AB14 (woman) may start.

- **K26 / C14, AB14 revision 1: NOT APPROVED YET, one model revision (2026-11-23).** Reviewed `overview.png`, `camp-build-1x-1280.png`,
  `camp-actions-2x-2560.png`, the concept, the idle / sit / die / tend contact sheets, and my own native comparison (woman against the
  installed AB13-r2 man, eight rows of actions, four facings) plus idle and walk enlarged 4x in four facings. **What works:** the rig, the
  15 actions and the tools match the approved man (chop, build, tend, fish, die, sit all read, no foot drift visible); the dress is a
  distinct, slightly shorter silhouette than the man and the two family tints separate in the camp at 1x and 2x; sit, kneel (tend, gather)
  and fall deform the dress cleanly; no feathers or regalia; the height is below the man's. **Fix in revision 2** (the model changes, so
  all frames re-render; keep the rig curves, tools, cloth material and cell layout as they are; AB16 will copy this model, so settle it now):
  1. **Braids are missing.** STYLE section 5 asks for long hair in two plain braids, centre part. In the front views (s, se, sw) the hair is a
     dark cap with a centre part and no braid reaches the chest or shoulders; in the back views (n, nw) it is one round bun-like blob, not
     two braids down the back. The concept shows two long braids over the front and down the back. Add two dark braids about 2 px wide at 1x:
     over the front of the shoulders to the chest in s / se / sw / e / w, and down the back to mid-back in n / nw / ne. They must stay in
     the `base` layer (hair is not cloth) and sway little in walk and not at all in idle.
  2. **The dress is too long and the leggings do not show.** STYLE: mid-calf dress with natural hide leggings (#A97F52) below. Here the hem
     is at the ankle in every facing, so only dark moccasins show below it and the dress reads as a gown. Raise the hem to mid-calf so about
     6-8 native px of tan legging show, keeping the flare. Keep the hem raised in walk, carry_walk and thrust, where it should swing a little.
  3. **Sleeves are balloon puffs, not cape-like.** At 4x the shoulders are two round puffed domes above the arms (they look like shoulder
     pads in front and back views). The brief and the concept have flat, flared cape sleeves that hang from the yoke and end above the
     elbow. Replace the puffs with a flared, flatter cape over the upper arm (narrower at the shoulder, wider at the hem), in the same
     cloth layer. Also make the thin bead band at the yoke readable: it is a faint grey line at 1x; give it a short run of white, blue and
     rust beads in the `base` layer (a few pixels, not a stripe).
  Optional, not a fix: the dress and cape fall into a dark brown at 1x when tinted orange, as the man's shirt does (decided by the user
  2026-11-22, no change). Not checked by me: the GIF loops and planted feet (Codex's numeric checks stand), the 704-pair counts, and the 2560
  captures beyond the actions overview. **Re-send:** the changed model's idle, walk, chop and sit in four facings at 4x and 1x in both tints,
  and the build and action camp captures at 1x. Do not install revision 1.

- **K27 / C14, AB14 revision 2: APPROVED 2026-11-23 (install; AB16 may copy this model).** Reviewed `k26-four-facings-4x.png`, `changes-4x.png`,
  `camp-actions-1x-1280.png` and `camp-build-1x-1280.png`, and composited the delivered `base` + tinted `cloth` frames myself at 5x in all
  eight facings (idle, walk frame 02, build frame 03). **(1) Braids:** two dark braids now show in every facing: over the shoulders at the
  front, down the back in n / nw / ne, and along the figure in e / w; they are in `base` and barely move in walk. **(2) Hem:** mid-calf, with
  about 7 px of tan legging above the moccasins in every facing, in idle, walk and build; the hem swings a little in walk. **(3) Sleeves:**
  the puffs are now flatter cape sleeves that flare toward the hem, and the yoke carries a visible white / blue / rust bead run. Rig, tools
  (the maul and stake in build), cloth and the two tints are unchanged from the approved man, and the family tints separate in the camp at 1x.
  Not blocking: in the front view the braids loop out past the shoulders like handles (the s and n views read a little wide), and at 1x the
  sleeve flare is mostly lost, so the figure reads as a woman by the dress and braids; acceptable, and the elder woman and child should keep
  braids but may hang them closer to the body. Not checked by me: the GIF loops, the 704 pair counts and the 2560 captures (Codex's checks
  stand). Install the whole AB14 batch (1,408 frames) as delivered. Next: AB15 / AB16 per BATCHES.md.

- **K29 / C15, AB15 revision 1 (elder man): APPROVED 2026-11-23 (install; AB16 may start).** Reviewed `overview.png`, `comparison.png`,
  `camp-walk-1x-1280.png` and `camp-actions-2x-1280.png`, and composited the delivered `base` + tinted `cloth` frames myself at 3x in all
  eight facings (idle 00, walk 02) beside the installed-approved AB13-r2 man, plus a 4x crop of the 1x camp walkers in both tints.
  **What works:** grey (#B8B4AC-like) hair and braids in every facing, in `base`; the head and upper back lean forward, so the figure is
  clearly stooped; it is shorter than the man (about 63 px against 72 px tall at native size); the shirt is the man's, a little looser; in
  the side views the walk stride is shorter (foot span 41-48 px against 52-62 px at `w`; the `e`, `se` and `sw` spans are 3-10% smaller);
  the shadow, scale and cell alignment match the man. At 1x in the camp the elders read as grey-haired, stooped elders and are easy to tell
  from the men; both family tints separate. Tools, scrape, tend, fish, gather, sit and die keep the approved man's silhouettes. Not checked
  by me: the GIF loops and planted work feet (Codex's numeric checks stand), the 464 pair counts and the 2560 captures.
  **Not blocking, for AB16 (elder woman) and AB17 (child) to learn from:** (1) in the front views (s, sw, se) the head sinks between the
  shoulders and the pale braids lie across the shoulders and down the outer arms, so at 1x they read as a pale collar or scarf, not as two
  braids; in n / ne / nw they look better. Hang the elder woman's braids closer to the body (over the chest, not outside the shoulders) and
  keep the head a little more visible in the front views. (2) The `e` stride is nearly the man's; acceptable. No walking stick, as allowed
  (optional in STYLE). Install the whole AB15 batch (928 frames) as delivered. Next: AB16 elder woman.

- **C5, AB7 revision 1: APPROVED 2026-11-22.** Reviewed `title.jpg` and the 1280 menu. Dusk camp on a lakeshore with oak woodland,
  cottonwoods, wooded bluffs and tallgrass with wildflowers; tipis glow from within round a small fire; no people, text, feathers
  or regalia; the top-centre sky is calm and the code-drawn title reads cleanly. The emblem is byte-identical to AB1's (approved in
  C2). Install as `art/title.jpg`. Cosmetic only, no change asked: the camp sits low-left, so the two lower panels hide the tipis'
  lower halves in the menu; if the user wants the camp more visible, a later revision could lift it, but the menu is fine as is.

- **C6, AB5 revision 1: APPROVED WITH 1 FIX, 2026-11-22.** Reviewed the contact sheet, groves, summer camp and full store. The four
  tree species are distinct and read as the same trees changing across the seasons (oak rust-red, basswood and cottonwood yellow,
  willow half bare, bare snowy winter branches); sizes, grounding, shadows and alpha are fine; chokecherry / plum, stumps, tufts and
  the store items all read in the live camp, and the full store reads as four separate goods (logs, hides, baskets, bags). Fix for
  revision 2 (everything else stays byte-identical):
  1. `rock_boulder` variant 1 is a tall, upright, pink-tan rock that reads as a standing stone or monument, and all three variants
     lean pink-brown. STYLE section 7 wants grey glacial boulders half sunk in the grass, palette stone #B8B0A2 / #8F877A / #5E584F.
     Redo variant 1 as a low, rounded boulder sunk into the ground like variants 0 and 2 (height no more than about 1.5x theirs),
     and shift all three to the neutral warm grey of the palette (snow caps in winter stay).
  Not asked, for later: summer oak and basswood lean yellow-olive (mid #66803A in the bible is a cooler green); acceptable now, but
  check them against the real AB3 ground at install. The dark diamond under each grove in the camp captures is the AB3 forest tile
  (see C4), not an AB5 problem.

- **K16 / C6, AB5 revision 2: APPROVED 2026-11-23.** Reviewed `changes.png` (before / after, 2x and 1x, both grounds), the boulder sheet
  and the 1280 summer camp. Checked byte for byte against `art/inbox/revisions/AB5-r1/`: all 12 `rock_boulder` frames differ and the other
  12 keys (bushes, items, stump, four trees, tuft) are identical, so Codex's count of 68 unchanged frames stands. Variant 1 is now a low,
  rounded boulder sunk into the ground, no taller than variants 0 and 2 in feel (no longer a standing stone); all three read as neutral
  grey stone and winter keeps its snow cap. In the live summer camp the boulders look like grey glacial stones on the grass. Install the
  whole AB5 batch as delivered. Not blocking: in the sheets on the grey ground the variant 1 frames lean slightly pink-lilac, and the
  stone is a little lighter than the palette mid #8F877A; it is not visible on the real grass. Not checked by me: the 2560 captures
  (Codex's JSON checks stand). Install check as C6 said: look at the oak and basswood greens against the real AB3 ground.

- **C7, AB6 revision 1: APPROVED 2026-11-22.** Reviewed the contact sheet and the camp, arrow, completion / hit / dust captures.
  The flame (yellow core, orange body, red tips, fixed base, no smoke) is the strongest piece and sits well on the hearth; the
  storm is a soft grey-blue swirl with rain streaks that reads over buildings and people at both screen sizes; the spirit is
  pale-blue, translucent and faceless; arrows are plain with grey fletching and visible at 1x; hit and dust are small tan bursts
  with no blood; sparkle is a few gold glints. No loop jump is visible in the sheet. Install as delivered. For the install check
  only: remove the old static code flame under the new sprite, as Codex noted, and confirm hit / dust stay readable at zoom 0.5.

- **C8, AB8 revision 1: APPROVED 2026-11-22.** Reviewed the contact sheet (90 frames), the finished joins (L, T, cross) and the
  summer camp with traps, pits and two dragged barricade lines. Barricade masks join with no gaps or doubled posts at corners and
  branches, the stakes are outward-sharpened with plain lashings, the construction stages progress clearly, and the winter state
  adds snow without changing the silhouette. The trap (crossed sticks and grass cover with marker stakes) is deliberately subtle
  but still findable at 1x; the fire pit has a stone hearth, charred logs and takes the shared flame well. Palette and light match
  AB0. Install as delivered. Install check only: the barricade stakes are dark and thin at zoom 0.5, so look at a long line there.

- **C9, AB9 revision 1: APPROVED WITH 1 FIX, 2026-11-22.** Reviewed the contact sheet, the 0.5x summer camp and the 1x winter camp.
  Footprint, anchor and scale are right next to the tipis and the store; the construction progression follows STYLE section 8 (cleared
  earth with stakes, bare frame, half covered, finished, snow); the gathering shade, the hide-covered hunting lodge with its side
  rack, and the open-gated round corral with a trough read clearly at every zoom and in winter; the horizontal-fit camera correction
  gives the right diamonds. Fix for revision 2 (only `drying_rack` finished 00-03 and winter 00-03 change; every other frame stays
  byte-identical):
  1. The hanging strips are pale cream and read as fence rails or planks, not as meat. Paint them dark red-brown (drying meat,
     about #8A3A2E to #5E2A22, darker in the winter frames than the snow) so they separate from the poles and match the red
     strips the plaza's drying poles already show. Keep the four-frame sway and the fixed attachment points.
  Not blocking: the hunting lodge's smooth barrel-vault dome reads a little like a modern hut at 1x; a few visible hide seams or
  lashed rib lines on the cover would help, but it is acceptable as it is.

- **K14 / C9, AB9 revision 2: APPROVED 2026-11-22 (reviewed 2026-11-23).** Reviewed the review sheet (both grounds), and the summer and
  winter camp captures at 1280. The drying strips are now dark red-brown, separate clearly from the pale poles and rails, read as hanging
  meat at 1x, and stay red against the snow in the winter frames; geometry, attachment points and the four-frame sway are unchanged.
  Checked byte for byte against `art/inbox/revisions/AB9-r1/`: exactly the eight named frames (`building_drying_rack` finished 00-03,
  winter 00-03) differ; the other 18 are identical. Install the whole AB9 batch as delivered (the optional hunting-lodge hide seams stay
  not blocking). Not checked by me: the two GIF loops (numeric and 1x frame checks by Codex stand).

- **C10, AB10 revision 1: HEALERS AND SCOUTS APPROVED; LANCERS, ARCHERS AND SPIRIT NEED A REVISION, 2026-11-22.** Reviewed the contact
  sheet, the 0.5x summer camp and the 2560 winter camp. The healers' herb-hung dome is distinct and good; the scouts' lodge is
  clear thanks to the tall pole and pennant; construction stages, anchors and snow match AB9 and the bible. The problems are
  differentiation, which the brief asks for ("1x distinction"):
  1. `lancers_lodge` and `archers_lodge` are the same barrel-vault as the scouts' lodge; their only differences (three lances,
     a straw target and bows) are small and vanish at zoom 0.5, so the three lodges read as one building. Make the signature prop
     larger and taller than the roofline: lances clearly rising above the dome in a visible rack, and a big round straw target on
     its frame (about a third of the lodge's width) with the bow rack beside it. Keep the same body and footprint.
  2. `spirit_lodge`: the "faint cool glow at the door" is not visible; the doorway is plain dark and in winter the lodge is white
     like every other winter lodge. Give the doorway a soft pale-blue interior light (#BFE3F2 into #7FB2CC, no symbols) that also
     shows in the winter frame, so the spirit lodge is the one that reads differently in all five states.
  Redo only these three keys (15 frames); healers and scouts stay byte-identical. Not a fix: the structures stand on a hard-edged
  brown diamond of cleared earth, like AB9's; it matches STYLE section 8 stage 1 and is accepted, but watch it at install.

- **C11, AB11 revision 1: NOT APPROVED, small revision (2026-11-22).** Reviewed the contact sheet, the full open store and the
  winter plaza. Footprints and anchors are right, the 12-stone hearth, four mats, log seats and the drum read well, the flame
  sits on the hearth, the construction stages and the half-covered stage 3 are clear, winter snow is fine, and the cutaway is
  consistent with the closed store. Fixes:
  1. Near-black surfaces: the store's shadowed side wall and doorways, and the cutaway's inner wall faces, are close to pure
     black. STYLE section 2 and 1: interiors are warm dark brown #3B2A1E and shadowed sides are blue-grey (#3A4660 fill), never
     black. Re-light so no large area goes below about #2A2018; the open floor must stay clearly visible for the items.
  2. `fire_central`: the two drying-pole frames hold no meat strips (STYLE table: "drying poles with meat strips"). Add dark
     red-brown strips (same colour as the AB9 drying rack fix, C9) and keep them still, since the plaza has no sway loop. Also
     keep the beaten-earth circle readable: it is nearly the same brown as the cleared-earth diamond.
  Everything else (store stages 1-3, finished and winter shapes) stays; a re-light changes pixels, so send the whole batch again
  and note which frames changed. Not blocking: the store roof thatch is the brightest orange in the camp; check it against the
  tipis at install.

- **C13, AB13 revision 1: NOT APPROVED YET, one revision (2026-11-22).** Reviewed the overview, the per-action contact sheets for
  chop and die, and the 1x / 2x game captures for build, chop and thrust (I could not play the GIFs, so loop seams and planted
  feet are unchecked by me; Codex's numeric checks stand). What works: the body, braids and headband match the user-approved AB12;
  all 15 actions exist in 8 facings with aligned base and cloth; walk, carry_walk, shoot, thrust and sit read at 1x; the fall in
  `die` folds and lies still with no wound; there are no feathers or regalia. Fix:
  1. Tools are unreadable at 1x. In the 1x build and chop captures the eight men look the same: the axe, maul and club are thin
     sticks about 2 px wide and the swing is a small arm movement, so chop, build and strike cannot be told apart. STYLE section
     4 allows tools up to 20% oversize and section 5 asks for an overhead axe swing (chop) and a two-handed maul driving a stake
     (build). Enlarge the stone heads and haft width (up to +20%), raise the chop arm to a real overhead peak on frame 4, show the
     stake under the maul in build, and make the strike club swing overhand. Check scrape, tend and fish the same way (hide
     frame, spear and splash must be visible at 1x). Only these action keys change; walk, idle, carry_walk, shoot, thrust,
     sit, die, dance stay byte-identical.
  **Decided by the user 2026-11-22: no cloth change.** The men read dark brown and navy at 1x, but the two families can already
  be told apart, so the `cloth` greys stay as in the approved AB12 for the man and the later batches (woman, elders, child).
  Do not lighten them unless the user asks again.
- **AC9 zoom 0.5 performance: decided by the user 2026-11-22: leave it as it is** (about 48 fps with 200 people against the
  55 fps target; the real camp is far smaller). No further performance work is planned.

## Performance notes (AC9, 2026-11-21)
- Measured with a throwaway Playwright test (headless Chromium on the GPU, `--use-angle=d3d11`, vsync 60, the PC about 40% busy with other work, so
  treat the figures as +-3 fps): `?standins`, 200 people (clones of the start people, half sent walking), 1x speed, 5 s of frames.
  **Before:** 17 fps at zoom 0.5, 1 and 2 alike. Cause: Phaser submits every visible image whether or not it is on screen, and the 96 x 96 map has about
  10,000 ground tiles, trees and props (hiding the grass tiles alone took it from 17 to 48 fps). Yesterday's M3 figure of 60 fps was taken before the
  terrain became sprites with art support, so it no longer holds.
- **Fixed in code (all in the AC9 files below):** (1) the ground and its spills are baked into 36 chunk textures of 16 x 16 tiles
  (`TerrainView`, the fallback already settled in DESIGN-map.md `## Drawing`); each tile keeps a template image that is never on the display list, and a
  changed tile marks its chunk for redrawing (6 chunks a frame, so a season swap takes a few frames); (2) `TerrainView.cull` hides chunks, trees, bushes and
  props outside the camera view plus 256 px (skipped while the view and the sprites are unchanged); (3) `standinsOn()` read `location.search` on every
  call (about 5% of a frame): now read once; (4) the per-person tool Graphics is hidden for people drawn from art.
- **After:** 60 fps with 20 people at zoom 0.5; with 200 walking people 59 fps at zoom 2, 57 at zoom 1, **about 48 at zoom 0.5** (render alone, sim paused:
  about 53; the sim is 5.4 ms a tick at 200 people, mostly `heldTiles` / `goSit`). **The target (55 fps at zoom 0.5 with 200 people) is not met.** With no art
  at all the same case is 45 fps, so the stand-in atlases are not the cause.
- GPU memory: the 13-page stand-in atlas set loads as about 111 MB of textures (the pages are cropped to their used size); a full set of real 2048 pages is
  about 210 MB as DESIGN-art.md says, plus about 75 MB for the chunks, so about 290 MB. Not measured on real art (none exists).
- **For the user (Claude's proposal, not decided):** the 1.5x people-cell fallback in DESIGN-art.md saves texture memory, not frames, so it would not help here.
  What is left at zoom 0.5 is draw calls (depth-sorted people alternate between six atlas pages, which breaks batching: not measured, a hypothesis) and the
  sim's 5 ms ticks at 200 people. 200 people is a stress case (the real camp is much smaller), so I would leave it as it is; if the user wants more, a later
  row could pack all five people models into one atlas group (Codex's `art:pack` groups) and make `heldTiles` cheaper.
- Went past PLAN's file list on purpose: `src/render/terrainView.ts` (the chunks and the culling), `src/render/standins.ts`, `src/render/people.ts` (the hidden
  overlay), `tests/smoke.spec.ts` (chunk counts in the terrain case), `DEVELOPMENT.md`, `DESIGN-map.md`. `Game.ts` gained `cameraView()` and one call.
- Checked by screenshot (plain and `?standins`, zoom 1, 2 across a chunk corner, 0.5): no seams, banks and spills where they were. 290 unit tests and
  `npm run e2e` pass. Not checked by hand: a pan across the whole map on the user's screen, a season swap (the 6-chunks-a-frame redraw), a felled tree.

## Creature and effect art notes (AC7, 2026-11-21)
- For Codex: wolves, deer, bison and horses draw `<key>/base/<anim>/<facing>/<nn>` (pattern A, base layer only), facing from screen-space movement
  like people. Wolf: `run` when moving at 0.12 tiles a tick or more (a normal wolf, any fleeing one), `walk` when slowed (storm, fire pit), `attack`
  while standing with its bite cooling down, else `idle`. The pack leader is the same frames at 1.4x with a darker multiply tint (`0x8c8682`); a
  guardian is a pale blue tint (`0xd6ecff`) at 90% alpha over a code-drawn glow, so keep the wolf mid-grey for the tints to read. Deer and bison:
  `run` while fleeing, `walk` while wandering, else `graze` two thirds of the time and `idle` the rest (5 s spells). Corral horses: `graze` / `idle`
  only, standing on six fixed spots inside a 2x2 corral, each with its own facing (`CORRAL_SPOTS` in `src/render/creatureArt.ts`).
- Deaths: a killed wolf plays `die` (held 1.5 s), then lies as `carcass_wolf/stage1/00` for 5 s, then fades; a wolf that runs off the map just goes.
  A killed deer or bison plays `die` (held 0.4 s), then `carcass_<kind>/<stage>/00`: `stage1` until a load is taken, `stage2` while meat is left,
  `stage3` (bones) for 6 s after the last load, then fades. A deer (10 meat, one load) goes from whole straight to bones.
- Rider: a mounted lancer draws `person_rider` (base + family-tinted cloth) when that key has art, else the man or woman on foot as before:
  walking or fleeing = `gallop`, any attack = `thrust`, else `idle`; a death plays `die`. Riders are always drafted (the draft takes the horse).
- Effects: `ally_spirit/float` loops at 90% alpha (offset per spirit); `fx_storm/loop` is stretched so the cell's width is the storm's circle across
  (about 452 px on screen, 1.18x the cell), drawn over everything with a faint code ring; the stampede is seven `animal_bison/base/run` sprites
  abreast. One-shots (`src/render/fx.ts`): `fx_hit/burst` where hp drops (wolf, game, ally, a building with hp, a person bitten with a wolf within
  1.5 tiles), `fx_dust/puff` every 220 ms behind a runner (wolves at run speed, fleeing game, guardians, riders, the stampede), `fx_sparkle/rise`
  on a building as it finishes, `animal_fish/jump` on a random river tile in view every 2.5-5 s. Each plays once and is removed.
- Arrows: `fx_arrow` is rotated along the flight (it must point right in the cell); `fx_arrow_stuck` is drawn upright, flipped when the miss
  landed to the left, and fades.
- No placeholders were added: everything new (horses, rider, carcass stills, effects, arrow sprites) shows only with art or `?standins`; without art
  the game draws exactly as before. Health bars, the guardian glow and the storm ring stay code-drawn.
- Went past PLAN's file list on purpose: new `src/render/{creatureArt,fx}.ts`, `src/render/people.ts` (rider model), `tests/art/creatureArt.test.ts`,
  two e2e cases and a `camp.creatures()` hook, `TESTING.md`, `DEVELOPMENT.md`. The sim files (`animals.ts`, `combat.ts`, `effects.ts`) needed no
  change: a wolf's death is read as "gone, and not on the map border".
- Not checked by hand: the look with real art, a long wave with many falls, fps (AC9), the fish rate, dust density at 4x.
- Bigger map: M1-M6 done 2026-11-20 (M6 passed: the user played the big map and said tested, no fixes); the item is finished. G23 done and G24 passed 2026-11-20 (the user tested the building cards by hand, no fixes); G15 passed too (the user played hunting, plaza, feedback and music; no fixes), so G1-G24 are all done; the user picks the next Phase D item. G22 done. G21, G20 done. G14 done 2026-11-20, next G15 (the user's playtest). G13 done. G12, G11 done. G10, G9, G8 done. G7 done. G16-G19 (user's additions) done 2026-11-20, G6 done. G5 done. G4, G3 done. W11 closed by the user 2026-11-20. G2, G1 done. G0 (2026-11-20): spec `DESIGN-hunting.md` and PLAN rows G1-G15 accepted by the user; next G1. Tier 3 W1-W10 and R1-R2 done (W11, the user's playtest, still open); tier 2 V1-V9 done (V9 passed; next: the user picks the next Phase D item). 2026-11-19: C1-C8 done (the user approved the slice: "all good"); Phase D saves: DS1 done
  (`save.ts`: `serialize`, `parseSave`, `loadState`, plus `dayOf` and `SAVE_FORMAT`); DS2 done
  (`src/save/slots.ts`: `listSlots`, `readSlot`, `writeSlot`, `clearSlot`, `importSlot`, `probe`,
  `firstEmptySlot`, `browserStorage`); DS3 done (`GameScene.saveNow()` and `saveSlot` are the hooks
  for the DS4 HUD menu); DS4 done. Next: DS5 (the user's playtest).

## Interface art notes (AC8, 2026-11-20)
- For Codex: panels, buttons and bars draw from `ui_panel` (9-slice, corner `slice` px at 2x), `ui_button/<normal|hover|pressed|disabled>` and `ui_bar_frame`; `ui_bar_fill` is the HUD Wotakuye fill (tinted green / amber / red, stretched to the bar). A toggled-on button (the speed in use, an armed stance, the card being placed) shows `ui_button/pressed`; an armed building strip is `ui_panel` tinted gold. Stretched panels are drawn at half size, so a 9-slice frame must not be trimmed.
- Text colour switches with the art: when `ui_panel` has art the panels' text is dark brown (`#2b1d12`, gold titles `#7a4a10`), because STYLE.md makes them light hide; the dark fallback keeps light text. Change `HIDE` in `src/render/ui.ts` if the art ends up dark.
- Icons: 64x64 keys are fitted into 14-32 px boxes. Places: resource bar (R1), speed buttons (`icon_speed_*`, replace the word), power buttons and upgrade rows (`icon_upgrade_<id>`), Draft / Undraft and Cancel (`icon_order_draft|undraft|delete`), the stance buttons (`icon_order_hold|defend|chase`, icon only, the label is the hover text). Not drawn anywhere yet (the UI has no slot for them today): `icon_order_move`, `icon_order_attack`, `icon_job_*`, `icon_season_*`, `icon_wotakuye`, `icon_hungry`.
- Cursors: `cursor_<kind>` and `cursor_<kind>@2x` are cut from the atlas into data URLs at boot and set as the canvas default cursor; the hotspot is the manifest anchor x 32. Buttons keep the browser's hand cursor.
- Title: `art/title.jpg` (any file there) is stretched to 1280 x 720 behind the menu; the code draws "Camp Fire", its line and `ui_emblem` (left of the title).
- Font: Alegreya 400 and 700 from `@fontsource/alegreya` (OFL, dev dependency), Latin and Latin Extended; the Dakota letter might fall back to Georgia if Alegreya lacks it.
- Went past PLAN's file list on purpose: new `src/render/{ui,uiLogic,fonts,cursors,cursorLogic,title}.ts`, `tests/art/ui.test.ts`, `Game.ts` (`ghostOk`), `scenes/hover.ts`, `Boot.ts`, `main.ts` (the game starts after the font loads), `package.json`, `TESTING.md`, `DEVELOPMENT.md`.
- Not checked by hand: the look at the user's screen; the real art; the cursors in a real browser (tests read the CSS value, headless screenshots show no cursor).

## Building art notes (AC6, 2026-11-20)
- For Codex: a building draws `<key>/<state>/<nn>` (pattern B): `stage1` below 34% built, `stage2` below 67%, `stage3` below 100%, then `finished`, or `winter` in the winter season (`seasonAt(tick)`). A key that lacks the asked state shows `finished` (the fire has only `finished` and `winter`, so a site is never drawn from it). The barricade is `building_barricade/<state>/<mask>` (mask 0-15, unpadded; any barricade tile counts as a neighbour, finished or not). The drying rack's `finished` and `winter` loop 4 frames at 4 fps on scene time, offset per building. The frame is picked by `src/render/buildingArt.ts`.
- Flames: a **finished** fire and fire pit carry an `fx_flame/loop/<nn>` sprite anchored on the building sprite's footprint centre (depth +0.5; the fire at art scale 0.5, the pit at 0.25), drawn only when `fx_flame` has final art or a stand-in. The fire's art must leave the hearth empty for it.
- Without final art a site still fades in with progress (alpha 0.35 to 0.85); with art every stage is drawn at full alpha. The open store (`StoreHover`) keeps its own sprite; `syncBuildings` skips it and sets the right stage frame again when it closes (`hoverStore` now runs before `syncBuildings`).
- Went past PLAN's file list on purpose: new `src/render/buildingArt.ts`, `tests/art/buildingArt.test.ts`, `tests/smoke.spec.ts` (two cases and a `buildings` debug hook), `TESTING.md`, `DEVELOPMENT.md`; `stores.ts` needed no change.
- Choices the spec left open: the stage limits are `<0.34` and `<0.67` of `buildPoints`; the flame has no placeholder, so it simply does not show without art; a trap or pit that has sprung shows no different frame (the sim has no such state). Not checked by hand: the look at zoom 0.5, a real winter, a long barricade drag with art.

## Terrain art notes (AC5, 2026-11-20)
- For Codex: ground, banks, spills, trees, stumps, bushes, rocks and tufts are all picked from the **map seed and the tile** (no sim random draws), by `src/render/terrain.ts`. Frames are `<key>/<season>/<index>` as the spec says; the season follows `seasonAt(tick)` (a new camp starts in spring) and every sprite is re-skinned when it changes.
- Which key shows where: a ground tile is `tile_<type>` in one of 4 variants; a **grass** tile with water on an edge draws `bank_river` (mask 1-15) instead; a grass tile with forest or berry on an edge also draws `spill_forest` / `spill_berry` for that edge on top (`ne` = the tile at y-1, `se` = x+1, `sw` = y+1, `nw` = x-1). A forest tile draws a tree (cottonwood or willow within 2 tiles of water, else bur oak or basswood; variant 0 or 1); a berry tile a chokecherry or plum bush (variant 0 or 1); a felled tree a `stump_tree/<season>/0`; about 9% of free plain grass a `tuft_grass` and 1.2% a `rock_boulder` (variants 0-2).
- Until a key is final: ground tiles and trees keep their code drawings; banks, spills, stumps, bushes, rocks and tufts have none, so they are not drawn at all (and appear as grey boxes with `?standins`). Banks fall back to the plain grass tile until `bank_river` is final.
- Went past PLAN's file list on purpose: new `src/render/{terrain,terrainView}.ts` (so `Game.ts` only loses code), `art/manifest.json` (`object_tree` deleted, a `placeholder` block on the four tree keys), `src/render/placeholders.ts` (the tree drawing now serves four keys; no new drawing), `tests/art/validate.test.ts`, `tests/smoke.spec.ts` (two cases and a `terrain` debug hook), `TESTING.md`, `DEVELOPMENT.md`, `art/SPEC.md` section 9. `src/sim/map.ts` and `seasons.json` needed no change.
- Choices the spec left open: banks only on grass (a forest or berry tile beside water keeps its own floor, so its art must meet water by the 4 px water-edge band; spill and bank overlays are not combined); a tile with a bank still gets spills; rocks and tufts avoid bank tiles, spill tiles and building footprints, and a new building removes the props under it; props, trees and bushes are jittered inside their tile (trees as before); a stump sits where its tree stood and does not block anything; the berry bush is drawn on every berry tile whatever its fruit left (the tile keeps its berry floor); a tile's ground variant is picked per tile, not per felled state, so a felled tile keeps its grass variant.
- Not checked by hand: the look at zoom 0.5 (about 1,000 extra sprites with full art, fps unchecked until AC9), a real winter, felling a tree with art installed.

## People art notes (AC4, 2026-11-20)
- For Codex: people now draw from `person_man`, `person_woman`, `person_elder_man`, `person_elder_woman` and `person_child` (pattern A frames
  `<key>/<layer>/<anim>/<facing>/<nn>`). The `cloth` frame is drawn over `base` and tinted with the family colour from `src/data/map.json`
  (`#e0905a`, `#7fa8d8`), so it must be greyscale and exactly aligned. Tools, loads and poses come from the frames (the code overlays only
  draw on placeholders). `person_adult` and `person_elder` are gone from the manifest; their code drawings are the placeholders of the four new keys.
- Sex: `Person.sex` from the id (odd = woman, even = man; `sexForId`), so it draws no random number and the sim's stream is unchanged; a save made
  before it reads it with `sexOf`. No save code touched. Each start family: 3 men, 3 women, an elder man and an elder woman.
- The map (`src/render/personArt.ts` `animFor`): flee = walk at 1.5x; drafted with the weapon fired in the last cooldown = shoot (hunters,
  archers) / thrust (lancers) / strike (others); a hunter shooting game = shoot; walk = walk, or carry_walk with a load; sitting on the plaza = sit;
  work: chop, gather, build (only while the site has its materials, else idle), dry = scrape, heal and tend = tend, drill = the society weapon;
  else idle. A model without the animation (elders, children) idles. `fish` and `dance` are not used yet (no activity). Death: `removePerson`
  notes a death (health 0 or less) in `GameState.fallen` (100 ticks, not saved); the view plays `die`, holds it 1.5 s and fades in 1 s; a
  child, or anyone on a placeholder, only fades; someone who leaves the camp just goes.
- Facing: 8 sectors from the screen-space way the smoothed sprite still has to go; standing still keeps the last facing (a fighter does not
  turn to face the wolf yet). Animations run on scene time, not game speed (2x/4x do not speed them up).
- Went past PLAN's file list on purpose: new `src/render/personArt.ts` (the pure picks, so the tests need no Phaser), `Game.ts` (`sync(state, ...)`),
  `placeholders.ts` (keys renamed), `art/manifest.json`, `manifest.ts` comment, `tests/art/validate.test.ts` (legacy list), `art/SPEC.md` 9,
  `DEVELOPMENT.md`. `tick.ts` needed no change.
- A mounted lancer still draws as a man or woman on foot (the rider is AC7).
- Checked: 259 tests and `npm run e2e` (16 tests) pass; a throwaway Playwright check with `?standins` at zoom 2 showed every label (idle, walk, carry_walk,
  chop, gather, scrape, the fights on adults, idle on elders) in both family tints, and a death holding `die/s/05`; no console errors. Not checked by hand.

## Atlas loader notes (AC3, 2026-11-20)
- For Codex: after `npm run art:pack -- ABn` the game picks up `art/atlas/<group>.json` and its pages by itself (Vite globs them at build time: restart the dev
  server after a new pack). A key is drawn from its atlas only when its manifest `status` is `final` **and** the atlas holds the frame; otherwise the code
  placeholder stays. Frames draw at scale 0.5 with the manifest anchor, so the delivered cell size must equal `sourceSize` (the packer keeps it).
  `/?debug&standins` (dev server only) shows the grey stand-ins for every key that has an atlas entry.
- Went past PLAN's file list on purpose: new `src/render/{atlases,art,frames,standins,standinFiles,standinFiles.empty}.ts`; the draw sites in `Game.ts`,
  `stores.ts`, `Build.ts` and `Hud.ts`; `tests/art/frames.test.ts`, a 16th e2e case, `TESTING.md`, `DEVELOPMENT.md`.
- Choices the spec left open: the default frame is summer, variant 0 (`0`), the `finished` state, the first animation, facing `s`, frame `00` (`defaultFrame`);
  the atlas JSON is bundled into the game's JS (about 1.4 MB for a full set, gzip smaller) and its page names are rewritten to the hashed URLs; the stand-ins are
  kept out of a build by a Vite alias, not by a runtime check (a `DEV` guard still bundled the pages); a key with neither art nor placeholder draws Phaser's
  missing-texture box and warns once; `people.ts` still draws the legacy keys, so people stay as today under `?standins` until AC4.
- Not checked: a real Codex atlas (none exists), the loading bar on a slow connection, season swaps and variants (AC5 picks them).

## Pack and stand-ins notes (AC2, 2026-11-20)
- For Codex: `npm run art:pack -- ABn` (run after approval) validates the inbox, then repacks each group the batch touches from the
  batch's folders plus, for the group's other `final` keys, `art/inbox/done/<batch>-r<revision>/<key>/` (the manifest's `batch` and
  `revision`), so **keep the `done/` folders**; it does not edit `manifest.json` or move the inbox (PIPELINE.md steps 2 and 6).
  Output: `art/atlas/<group>-<n>.png` and `<group>.json` (Phaser multiatlas: `textures[]` with `image`, `size`, `frames[]` of
  `filename`, `frame`, `spriteSourceSize`, `sourceSize`, `trimmed`); pages are cropped to their used size; it stops over 16 pages in
  all or a page over 4 MB.
- Went past PLAN's file list on purpose: `scripts/art/{font,standin-lib,pack-lib}.mjs` and their `.d.mts` (the CLIs stay thin),
  `scripts/art/lib.mjs` (the ground-point check skips `cloth` layers: a shirt never touches the ground), `DEVELOPMENT.md`, `TESTING.md`.
- Choices the spec left open: stand-ins are shapes, not full cells, because full cells make 66 pages: people, animals and plants are
  grey boxes (28 x 40% of the cell for a person), buildings and fire a footprint diamond, tiles, banks and spills a full diamond,
  icons, cursors and UI the full cell; each carries its frame name in a 5 x 8 pixel font and a red cross on the anchor pixel (never in
  the border); a `cloth` stand-in is a lighter patch inside the base box. `art:standins` also packs (`-- --no-pack` skips it); the
  packer takes frames in name order, so a repack of the same frames gives the same files.
- Not checked: the packer on real art (none yet; stand-ins pack to 13 pages, real trimmed art is expected to be about the same);
  how the loader (AC3) reads the JSON in Phaser.

## Manifest v2 and validator notes (AC1, 2026-11-20)
- For Codex: `npm run art:validate -- --inbox ABn` is ready. It checks the manifest and the inbox delivery (exact cell,
  2 px border, frame names and counts, 8-bit RGBA, cloth aligned with base, ground point, `delivery.json`, `contact.png`).
  Frame names and files per key come from `expectedFrames` in `scripts/art/lib.mjs`; SPEC.md section 8 lists the details
  the spec left open (bank masks 1-15 and spill edges as pattern C names, barricade `<state>_<mask>.png`, cursor `_2x.png`).
- Went past PLAN's file list on purpose: `src/render/{people,stores,placeholders}.ts` and `src/scenes/Game.ts` (use `anchorOf`),
  `package.json` (`pngjs` 7.0.0, `art:validate`), `scripts/art/lib.mjs` and `lib.d.mts`, `DEVELOPMENT.md`, `TESTING.md`, `art/SPEC.md`.
- Choices the spec left open: the three old keys stay as `legacy` entries (placeholder only) because the code still draws them
  until AC4 and AC5; per-key fields `border` (0 for tiles, banks, spills and 9-slice pieces), `ground` (people, animals,
  carcasses, plants, items; not buildings, whose footprint centre may be empty in `stage1`), `indices`, `slice`, `retina`;
  the cloth check allows max(4, 1%) cloth pixels over a transparent base (anti-aliased edges); the ground check looks in a
  9 x 5 px box at the anchor pixel; atlas groups: `ground`, `plants` (trees, bushes, rocks, tufts, stumps, store items),
  `buildings`, `man`, `woman`, `elder_man`, `elder_woman`, `child`, `rider`, `animals` (animals, fish, carcasses), `fx` (fx, ally, arrows), `ui`.
- Not checked: the validator on a real Codex delivery (none exists yet); the 16-page atlas budget (AC2).

## Minimap mouse notes (M5, 2026-11-20)
- Went past PLAN's file list on purpose: none beyond `MinimapView.ts` (new in M4), `Hud.ts` (`overMinimap`), `Select.ts` (`moveSelectionTo`, `overUi`), `Game.ts` (`centerOnWorld`), `Menu.ts`, `tests/smoke.spec.ts`, `TESTING.md`.
- Choices the spec left open: the click zone is the whole panel (padding included) and a click on the padding or the empty corners still centres the camera (clamped to the minimap); a right-click in a corner is ignored (no tile there); a right-click while placing or aiming does nothing (not even cancel), as the spec says a click only moves the camera; a right-click draws the usual green ping at the target tile (off screen unless the camera is there); the HUD menu panel disables the minimap; a drag keeps following the pointer outside the panel while the left button is held.
- Not checked by hand: the feel of dragging at real size, right-clicking a far spot with a big group.

## Minimap notes (M4, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/MinimapView.ts` (new, so `Hud.ts` gains only three lines), `tests/minimap.test.ts` (new).
- Choices the spec left open: scale is exactly 1/32 (192 x 96 px, the spec said about 200 x 100), with the world's top edge half a tile above tile (0, 0)'s centre; the panel is 208 x 112 at x 1064, y 36 (the Wotakuye tooltip, depth 18, still covers it while open); berries are plum (`0xa8559a`) and forest dark green so neither reads as a wolf or herd; wolves are 3 px bright red in a 5 px dark halo, people and herds 2 px; carcasses are not drawn; an unfinished building is cream at 50%; the fire is a 3 px orange dot at its centre; the camera outline is clipped to the minimap and drawn every frame, the dots every 6 frames, the buildings when an id or `done` changes, the terrain when `mapVersion` changes (a whole redraw, about 18k pixels).
- Hook for M5: `camp.minimap()` returns `{ rect: [x, y, w, h], view: [x, y, w, h], counts }` in 1280 x 720 HUD space. `miniToWorld` / `miniToTile` are the click maths. The panel is not interactive yet.
- Not checked by hand: the look at real size on the user's screen, a felled tree updating the terrain, a long wave.
## Bigger map notes (M3, 2026-11-20)
- No code change: fps at zoom 0.5 on 96 x 96 is 60.0 (zoom 1: 60.1, zoom 2: 60.1), measured with a throwaway script (4 s of `requestAnimationFrame` frames per zoom, headless Chromium with the GPU flags from `playwright.config.ts`, WebGL, no console errors). Chunked ground is not needed.
- Limit of the check: the start camp at rest, 20 people, no wolves, 1x speed; vsync caps at 60, so the headroom is unknown. If the user's PC stutters in a big wave at zoom 0.5, chunk the ground then (spec `## Drawing`).

## Bigger map notes (M2, 2026-11-20)
- Went past PLAN's file list on purpose: `src/data/enemies.json` (stampede numbers), `tests/sim/helpers.ts` (`o(n)`), and about 12 test files that hard-coded 48-map tiles.
- Choices the spec left open: the stampede lane the player aims is drawn from the start to the end of the run, clipped to the map; a herd that starts at a clamped edge still runs 48 tiles (it may leave the map); `iso.ts` keeps default size arguments but reads them from `map.json`; `o(n)` shifts by fire x - 22, so tests keep their old geometry round the new camp (anything beyond the 7-tile clear radius can be forest, so such tests search for a spot).
- The bison trips test now waits for the last delivery instead of a fixed 400 ticks (a carcass may fall far from the store).
- Not checked by hand: the new aiming lane, the long walk to a far ford or a far berry patch.

## Bigger map notes (M1, 2026-11-20)
- Went past PLAN's file list on purpose: `tests/sim/hunting.test.ts` (the start-herds test now expects 12 herds, 8 deer and 4 bison) and `src/data/map.json` `camera.panPxPerSec` (900, M2 would have done it).
- Choices the spec left open: the outer berry ring is `berry.outer` (optional) and runs after the near ring, so the near ring keeps its rng order; the outer herds are `outerHerds` / `outerDist` in `animals.json`, 6 deer and 3 bison (the same 2:1 mix); a herd's members spread a tile or two round its centre, so the test measures the herd's mean position.
- The tests M1 left failing were fixed in M2.
- Not checked: the new map in the browser (wolves and the stampede still read 48 / 24 until M2).

## Building cards notes (G23, 2026-11-20)
- Went past PLAN's file list on purpose: `src/main.ts` (scene drawing order is now Select, Build, Hud, so the cards sit above the panel instead of under its translucent fill), `src/scenes/Menu.ts` (controls text), `DESIGN-slice.md` and `TESTING.md`.
- Choices the spec left open: the stance buttons moved to a row under Draft (x 560-756) so seven cards (about 510 px, from x 770) never cover them; cards are 72 px wide with the icon fitted into a 56 x 32 box under the title; B with nobody able to build toasts `Select an adult who is not drafted to build.` (a sim message, shown in the Select toasts); the number key that picks clears `armed` one frame later so Select does not also read it as a speed key; `placers` holds every selected id (children and drafted included, as G22 counts them); placing ends when no selected person can build, not only when the selection is empty; a failed placement toast (`Not enough hides.`, placement errors) appears above the cards.
- Debug hooks: `camp.buildMenu()` is now `{ visible, armed, page, shown, placing }` (was `open`), and `camp.buildCard(type)` gives a shown card's screen centre.
- Checked by hand by the user (2026-11-20, G24): building from the panel, including a barricade line; no fixes raised.

## Builders and lines notes (G22, 2026-11-20)
- Choices the spec left open: the 3 builders are the able ones **nearest the site** (ties by id); the toast's "of N" counts every
  id sent (children and drafted included), and it is shown whenever `builders` is non-empty. A line is one `place` order
  (`at` + `line`), not one order per segment; G23 must send it that way from `Game.ts` (today it still sends one order per segment,
  so lines placed in the game get no `lineId` yet).
- Anyone building a line segment moves on, auto-work builders too (simpler than marking ordered builders). Builders who move on
  wait at a segment until its wood is hauled, as at any site.
- `lineId` sits on `Building`, so `serialize` writes it like any field; nothing reads or validates it (saving parked, no save code).

## Test notes (G14, 2026-11-20)
- Went past PLAN's file list on purpose: none beyond `Menu.ts`, `smoke.spec.ts` and `TESTING.md`; the e2e cases the spec listed were already written in G11-G13 and G16-G19.
- Fixed a flaky music e2e case (failed about 1 run in 4): the hold of 50 ticks starts at the tick of the first frame that sees no wolf (0 or 1), and the test stepped exactly 49 then 2. It now steps 40 then 12.
- Menu controls text: right-click now says it can hunt a deer or bison; the last line mentions the Menu button's music on / off and volume.

## Music notes (G13, 2026-11-20)
- Went past PLAN's file list on purpose: `src/main.ts` (arms the sound), `tests/music.test.ts` (new), `tests/smoke.spec.ts` (the 12th e2e case), `TESTING.md`. The HUD menu panel grew from 300 to 340 px to hold the music row.
- Choices the spec left open: D minor pentatonic at 72 bpm for the flute, 54 bpm heartbeat, 138 bpm war drum; the fade is a 0.7 s time constant (about 2 s), a track keeps being scheduled 3 s after its fade starts; volume is in tenths (default 60%, master gain is half the volume); the hold uses sim ticks (50), so it also waits while paused; the mode follows `state.enemies.length > 0` (allies and effects do not count); preferences are not tied to a save.
- Nothing was listened to when written. The user played in G15 (2026-11-20) and raised no fixes, so the levels (flute 0.5, drone 0.16, wind 0.05) stand.
- The CULTURE.md wording is a proposal under *Needs review*; nothing is shown in the game yet.

## Drawn game and hunt order notes (G12, 2026-11-20)
- Went past PLAN's file list on purpose: `src/render/people.ts` (the load on the back), `src/scenes/Game.ts` (one call to `syncAnimals`), `tests/smoke.spec.ts` (a 10th e2e case), `TESTING.md`. `placeholders.ts` and `art/manifest.json` were not needed: animals are drawn in code like the wolves, so there are no manifest keys.
- Choices the spec left open: animals share one Graphics layer at the lowest-row depth of the group (like wolves), a fleeing one is stretched 15%, a carcass shrinks to 35% as the meat goes; the load is a dark red bundle that grows with the carry (full at 10) with a hide on top; a left-click picks a live animal or carcass (selecting one clears people, as a building does) and the panel offers `Right-click with hunters to ...`; the hunt order is refused with the same text as other work orders (`Nobody can hunt there.`, `Drafted people can't take work orders.`).
- Not checked by hand: the look at zoom 0.5 and 2, a real hunt (a deer fleeing, three bison trips), the load on a walking hunter.

## Arrow notes (G11, 2026-11-20)
- Arrows are found by watching state, not by a sim event: `cooldown` rising on a bow-holder is a shot. Several shots in one frame
  (4x speed, a slow frame) can merge into one arrow; the 15-tick bow cooldown means at most one per frame at 4x.
- Bow art is a placeholder drawn in code (stave and string on the tool layer); Codex can replace it. Mounted people and lancers
  never hold one; a fleeing person's bow is hidden.
- Went past the plan's file list: `src/render/arrows.ts` is new and `src/scenes/Game.ts` calls it; `PeopleView.ground(id)` gives the
  drawn feet so the arrow leaves the smoothed sprite.
- No e2e case (the plan asked for screenshots only); arrows are not unit-tested because the render code imports Phaser.

## Wild game notes (G10, 2026-11-20)
- Numbers the spec left open, all in `src/data/animals.json` for G15: flight 60 ticks toward a tile 10 away from the shooter,
  the **whole herd** flees, and a miss startles it too; a calm herd wanders within 4 tiles every 240 ticks; a respawned herd is
  bison 35% of the time (3 deer or 4 bison).
- Herds draw from their own random stream (`GameState.wild`, seeded from the run seed), so the camp's own rolls did not shift.
  `serialize` writes `animals` and `wild` like any field; nothing validates them (saving parked).
- A hunter goes for a carcass with goods left before a live animal, keeps chasing a chosen animal past spotting distance, and
  without a target walks to the plaza ring and looks again every 50 ticks. A hunter shooting from range may stop on a tile
  someone else holds (they do not look for a free tile while shooting).
- A non-hunter adult given the hunt order shoots with the hunter's bow (`fighterOf` as a hunter), as the spec says.
- `jobs.json` `hunt` is now empty; the old roll, hunt spot and `huntTicks` are gone.
- Not drawn yet (G12): animals, carcasses and the right-click hunt order; the e2e has no hunt case until then.

## Full store notes (G9, 2026-11-20)
- Read "with no order" as "with no job": an assigned job is the player's order and stands. A gatherer or woodcutter
  with full hands keeps the job and waits by the bush or tree (not at the store) until a store has room; only jobless
  people switch to free work. A hunter or drier with goods no store can take waits where they are (G10 rewrites hunting).
- People check for room before walking to the store, so the toast fires when a delivery is skipped, not only after a
  failed one; it comes once per person until they are no longer blocked. The "told" set is a `WeakSet` in `jobs.ts`,
  outside `GameState`, because saving is parked; a loaded save may toast again.
- Also fixed: a hauler's drop used to lose what the site did not need; it now stays carried and goes back to the store.
- Went past the plan: `tests/sim/people.test.ts` (the full-store test now waits for the walk back from the bush),
  `TESTING.md`. `orders.ts` needed no change (orders already reset the task; `decide` no longer sends them back).
- Not checked by hand: a real full store in the game.

## Sitting notes (G8, 2026-11-20)
- Sitting is derived, not stored: `isSitting` = undrafted, no job, idle step, standing on the fire's ring. No new `Person` field, nothing to save.
- Choices the spec left open: adults keep looking for work every tick while seated (timer 0), elders and children rest 50 ticks between looks; a
  full ring leaves adults where they stand and elders and children wander as before; wandering is otherwise gone. A finished fire only.
- The seated look is a placeholder (sprite squashed to 0.72 from the feet), not drawn art; Codex can replace it later.
- Went past the plan's file list: `src/sim/buildings.ts`, `tests/sim/seasons.test.ts` (rng-sensitive hunt test now sums 4 seeds), `tests/smoke.spec.ts`, `TESTING.md`.
- Not checked by hand: a real raid with people leaving the plaza to flee and returning, a seated person taking a right-click order.

## No shared standing tile notes (G7, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/occupancy.ts` (new), `tests/sim/orders.test.ts` (a single move onto a tile
  that is another walker's goal now lands beside it; `spreadTargets` takes the movers' ids), `TESTING.md`.
- Choices the spec left open: a person holds their drafted post, else their walk or flee goal, else their rounded position;
  "lowest id wins" comes from stepping people in id order (first to claim keeps it); a full ring sends the person to the
  nearest free tile and they retry every `storeRetryTicks`, keeping the job (a ring with no walkable tile still fails as
  before); a second woodcutter or gatherer works the same tile from the nearest free tile beside it; a healer stands beside
  the patient; nearest-free search scans the whole map (cheap at 48 x 48, only used on overflow).
- Not covered: fighters in combat stop off-grid in weapon range and may round onto a held tile; a walk ended as `blocked`
  mid-path idles where it stopped. Neither is snapped back to a free tile.
- Not checked by hand: a real raid with 20 people fleeing to the plaza, scouts or tenders sharing a lodge.

## Store items, people icon, berry panel notes (G16-G19, 2026-11-20)
- Went past the plan's file lists on purpose: `tests/sim/{riders,seasons}.test.ts` (two tests assumed the old store position and were made layout-proof), `tests/smoke.spec.ts` (an e2e case 10 and the items case), `Select.ts` (a `panelText` hook), `TESTING.md`, `art/{ASSETS,SPEC}.md`.
- Choices the spec left open: items count `ceil(40 x amount / camp capacity)` (so a second store makes each item worth more); quarters: food back, wood right, hides left, pemmican front, 5 x 4 slots, a second layer 6 px higher; the berry panel shows the bush's own amount (floored) over `tiles.berry.food` (40), not the whole patch; the panel also closes on selecting a person, a building or box-selecting; the people count has no `/ capacity`.
- Not checked by hand: the iso items at zoom 0.5 and 1, the store at [22, 17] with workers walking round it, clicking a bush at the edge of the map.

## Work animation notes (G6, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/Game.ts` (one argument, the buildings, passed to `PeopleView.sync`); `jobs.ts` and `placeholders.ts` needed no change (overlays are drawn live, not baked into textures).
- Choices the spec left open: the tool is a Graphics object per person at depth +0.5, anchored at the feet and drawn at the right hand; a child's tool is scaled 0.7; the hammer period is 520 ms, the axe 760 ms, the pick 700 ms, drying 600 ms, offset per person id so a crowd is not in step; the bow draw is left for the hunt rows (G10-G12); the same overlays serve both families.
- Not checked by hand: the overlays at zoom 0.5 and 1, a real crowd at work.

## Right-click feedback notes (G5, 2026-11-20)
- Went past PLAN's file list on purpose: `tests/smoke.spec.ts` (a 9th test; the `Camp` type gained `selectPeople` and `lastPing`), `TESTING.md`; `src/render/enemies.ts` was not needed (the wolf pulse is drawn by `Select.ts`).
- Choices the spec left open: pings use the scene clock (`this.time.now`), 700 ms; the ring grows from 5 to 25 px of radius and fades; the target pulse flashes about three times; pings draw on their own graphics layer just under the HUD-depth bars; a refusal known at the click sends no order and adds its own toast (so there is no double toast), while refusals the sim finds later (full slots, an unreachable tile, a used-up tree) keep their sim toast and the ping stays coloured; berry and tree tiles share the gold diamond; with nobody selected there is no order and no ping; an animal or carcass target is for G12 (`PingTarget` has no animal yet).
- Not checked by hand: the look of the rings at zoom 0.5 and 2, the building flash, a berry tile.

## Store notes (G3, 2026-11-20)
- Went past PLAN's file list on purpose: `tests/sim/{people,seasons}.test.ts` (cap numbers; the full-store test now reads `storeCap`), `art/ASSETS.md`, `art/SPEC.md`, `DESIGN-slice.md` (the store row).
- Choices the spec left open: the art canvas is 256 x 208 (anchor 0.5, 0.75) for both views; the hover roof allowance `ROOF_PX` is 28; piles are drawn 2x at offsets (-48,-2), (0,-26), (48,-2), (0,22); the e2e test aims at the 4x4 footprint centre and its tooltip clip is 320 x 260.
- The start layout: the store now stands at [22, 28] (tiles 22-25 x 28-31) with the fire still 2x2 at [23, 23] and tipis unchanged; G4 moves the fire and tipis.
- Not checked by hand: the store at zoom 0.5 and 2, people walking round it, the delivery spot on its ring.

## Names notes (G2, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/people.ts` (`pickName`), `economy.ts` (newcomers use it), `tests/sim/{people,economy}.test.ts` (the old `Cottonwood 1` / `Kingfisher ` assertions). The user chose invented names when asked, because `Cottonwood 3` plus a family line repeated itself.
- Choices the spec left open: 50 nature-word names in `map.json` `start.names`, taken in order without the rng (so no seeded outcome changed); family colours are `start.familyColors` (orange `#e0905a`, blue `#7fa8d8`, matching the shirts); the labels sit at +8 px (name, 12 px) and +21 px (family, 10 px) under the feet, black-outlined, drawn in the world scene so they zoom with the map; the panel keeps its `<Family> family · age` line.
- Old camps (saving is parked) keep their old names such as `Cottonwood 3`, which then show twice.
- Not checked by hand: the labels at zoom 0.5 and 2, or on a crowd.

## Carried goods notes (G1, 2026-11-20)
- Went past PLAN's file list on purpose: `tests/sim/labels.test.ts` (the unit test) and a `camp.selectPeople(ids)` debug hook in `Select.ts` (needed for the screenshot; G2 can use it too).
- Choices the spec left open: amounts are floored; a hunter's `hides` count as hides and merge with carried hides; one hide reads `1 hide`; the load shows as `food` until G10 renames a hunt load to meat; the panel's single-person view is now four lines and still fits above the screen edge.
- Not checked by hand: the line while people really walk with loads.

## Resource icons and open store notes (R1-R2, 2026-11-20)
- Went past PLAN's file list on purpose: `src/render/stores.ts` (new), `art/manifest.json` (23 keys), `tests/stores.test.ts` (new, `pileSize`, `storeAt`), `tests/smoke.spec.ts` (an 8th test), `TESTING.md`, `Game.ts` (hover each frame, `window.camp.storeOpen`); `Select.ts` and `economy.ts` were not needed.
- Choices the spec left open: the bar shows `120 / 200` and an icon with no resource word (the words made it run into the Wotakuye bar at x 750); `Gift` keeps its word; hovering an icon names it (`Hud.ts`, the scene's hover helper); `icon_horses` is drawn and shown once there is a horse; the open store reacts to the pointer on its floor or up to 16 px above it (the roof); the piles are the camp's whole store, so every store shows the same; piles are drawn 1.3x; no open view while placing, aiming or over a panel; `building_store_open` and the piles are manifest keys but not building types.
- Not checked by hand: the icons' look at real size, hovering a store in the live game with people about.

## Tier 3 notes (W10, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/Game.ts` (`aiming`, `setAiming`, the aim click and the reticle in `updateGhost`), `src/scenes/hover.ts` (new), `Menu.ts` (controls text), `tests/smoke.spec.ts` (a 7th test with `camp.powers`, `powerButton`, `hoverTip`, `scene`). `art/ASSETS.md` needs no row (placeholders drawn in code need none).
- Choices the spec left open: the power bar is top left under the resource bar, not bottom left (the selection panel, its upgrade list and the toasts use the bottom left); buttons show only for bought powers and stack in data order; F-key and click on an aimed power toggle aiming; an aimed power with an error (spent, below Steady) toasts the reason and does not start aiming; powers do nothing while the HUD menu is open or after a result; the storm's reticle is a circle of its radius, the bison's a lane of its width across the map; Esc is also caught by Select (`busy`) so it does not clear the selection while aiming.
- Known Phaser behaviour: the first mouse move after leaving a HUD button only ends that button's hover; the Game scene sees the next one (a real player will not notice, the e2e test moves in steps).
- Not checked by hand: the bison reticle, a real cast with wolves about, a Dakota hover in the live Build menu.

## Tier 3 notes (W9, 2026-11-20)
- Went past PLAN's file list on purpose: `buildings.json` / `upgrades.json` (the barricade and its upgrade), `state.ts` (optional `Enemy.path`, `goal`, `walls`, `siege`; not validated by `parseSave`, saving is parked), `jobs.ts` (no `is finished` toast for line segments), `Game.ts` (drag placement and the line ghost), `placeholders.ts` and `art/manifest.json` (barricade art), `tests/sim/{buildings,upgrades,upgrades2}.test.ts` and `tests/smoke.spec.ts` (id lists).
- Choices the spec left open: the drag snaps to the nearest of horizontal, vertical or diagonal (2:1 rule) and starts at the pressed tile; tiles that fail placement are skipped, the store pays segments in order until short; placing stays on after a drag (right-click or Esc stops); unfinished barricades block people but not wolves; a diagonal step is shut when either side tile is a barricade, so a diagonal line is closed; wolves keep the old straight walk while their line is clear, so nothing changes without barricades; fleeing wolves path and break barricades the same way; a besieging wolf bites with its own damage, accuracy and cooldown from within range + 0.5 of the barricade's tile; the fire shows no strength line though it has hp.
- Not checked by hand: wolves meeting a line in the live game; the Menu controls text does not mention dragging yet (W10).

## Tier 3 notes (W8, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/effects.ts` (new, same reason as `allies.ts`), `enemies.json` (`powers` block), `tick.ts` (`stepEffects` after `stepAllies`), `upgrades.ts` (`castPower` calls `startEffect`), `render/enemies.ts` and `Game.ts` (placeholder drawing, so a cast shows something before W10), `tests/sim/effects.test.ts`.
- Choices the spec left open: the herd starts on the map edge nearest the point, on the line through it, and ends when it has crossed (`ceil(47 / 0.4) + 1` ticks); a wolf is touched when within 1.5 tiles of the lane's middle and within 1 tile ahead or behind the herd; the storm slows fleeing wolves too and its slow multiplies with a fire pit's; storm damage 0.2 per tick makes wolf hp fractional; effects ids come from `nextEnemyId`; `effects` is not validated by `parseSave` (saving is parked).
- Not checked by hand: the look of the herd and the storm (placeholders), a real cast (no power bar until W10).

## Tier 3 notes (W7, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/allies.ts` (new, to avoid a combat <-> upgrades import cycle), `enemies.json` (`allies` block), `tick.ts` (`stepAllies` before `stepEnemies`), `upgrades.ts` (`castPower` calls `callAllies`), `Game.ts` (draws allies), `tests/sim/allies.test.ts`.
- Choices the spec left open: allies are spawned on a ring of radius 2 around the fire centre and walk in straight lines through anything (they are spirits); a fleeing wolf is only attacked when within the ally's range; waiting spot is within 2.5 tiles of the fire; ids come from `nextEnemyId`; `allies` is not validated by `parseSave` and `alliesOf` makes the list for an older file (saving is parked); the cast toast `<label> called.` is unchanged.
- Not checked by hand: allies in the live game (placeholder look), a real cast from the lodge (there is no power bar until a later row).

## Tier 3 notes (W6, 2026-11-20)
- Went past PLAN's file list on purpose: `waves.ts` (`warn` empties `powersUsed`), `save.ts` (`parseSave` rejects a file without `powersUsed`, still `SAVE_VERSION` 5, so a v5 file saved earlier today is unreadable), `buildings.ts` (name), `placeholders.ts` and `art/manifest.json` (lodge art), `Select.ts` (effect lines), `tests/smoke.spec.ts` and `tests/sim/{buildings,upgrades,upgrades2}.test.ts` (lists).
- Choices the spec left open: `powersUsed` is a list of spent power ids (the plan said `powers`); the cast order is `{ type: 'cast', power, at? }`; a refused cast toasts the reason and is not spent; a successful one toasts `<label> called.` until W7/W8 add effects; `spirits` has no tier 2 prerequisite (the table says United only); the Societies page is at 6 slots, the barricade (W9) makes 7.
- Not checked by hand: the spirit lodge in the live game and its panel; `Needs United` on the rows.

## Tier 3 notes (W5, 2026-11-20)
- Went past PLAN's file list on purpose: `people.ts` (`speedOf`, `removePerson` loses the horse), `state.ts` (`Person.mounted`, `freeHorses`), `upgrades.json` (the `riders` upgrade and toast), `Select.ts` (its effect line), `tests/sim/upgrades2.test.ts` (id list).
- Choices the spec left open: `horses` stays the whole herd, ridden or not (free = herd - mounted, so the breeding cap is unchanged); mounting happens only at the draft order (a lancer already drafted when Riders is bought, or when a horse is born, stays on foot until redrafted); an undrafted lancer, or one with no free horse, walks; the mount multiplies walking speed in `movePerson` and `stepStraight`; older v5 files without `mounted` load as on foot.
- Not checked by hand: a rider in the live game, the Riders row in the lancers' lodge panel.

## Tier 3 notes (W4, 2026-11-20)
- Went past PLAN's file list on purpose: `buildings.ts` (name), `Select.ts` (effect line), `Hud.ts` (a `Horses n / cap` part shown once there are horses), `Build.ts` (key 7), `placeholders.ts` and `art/manifest.json` (corral art), `tests/smoke.spec.ts` (`tended` on a hand-made building), `tests/sim/{buildings,upgrades2}.test.ts` (menu order, upgrade ids).
- Choices the spec left open: `horses` is a plain number on the state, not a `Res` (no store, no carry); tended time is counted per corral by `stepCorrals` (a non-drafted `tend` worker standing on the ring), it waits at 3600 when the corrals are full and turns into a foal once there is room; Breed horses is clamped to the cap; the toast for a birth is `A foal was born.`; `parseSave` rejects a building without a numeric `tended` and a state without `horses`.
- Not done: `icon_horses` (R1 draws the icons), the Camp page now holds up to 7 slots (reaches 559 px wide, unchecked on screen).
- Not checked by hand: placing the corral, a tender breeding in the live game, the 7-slot Camp page.

## Tier 3 notes (W3, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/Game.ts` (dropped the `upgradesOverUi` call), `Menu.ts` (controls
  line: click a finished building for its upgrades), `tests/sim/helpers.ts` (`addHuntingLodge`), `TESTING.md`.
- Choices the spec left open: the list is a panel just above the selection panel (620 px wide, 50 px a row, toasts
  move up above it), shown only for one selected finished building and no people; the row shows the label, one line
  of effect, then `Owned`, `Needs <label>` / `Needs United` / `Needs a finished <building>`, or `Cost: ...` with
  `Missing: ...`, and Buy (dim while short, hidden when blocked); upgrades with a `band` in the data are refused
  outside that band (nothing uses it until W5-W8); the effect lines moved from `Hud.ts` to `Select.ts`.
- Debug hooks (with `?debug`): `camp.selectBuilding(id)`, `camp.upgradeRows()`, `camp.upgradeBuy(id)`.
- Not checked by hand: the panel for the council fire in the live game, hovering the English label (W10).

## Tier 3 notes (W2, 2026-11-20)
- Words came from the Dakota Online Dictionary (SWODLI + Ultralingua; Williamson 1902 and the 2015 SWODLI
  dictionary) through the JSON endpoint its own page calls (`https://ulod.ultralingua.com/dakota/api/`,
  `tool=dictionary&action=results&source=en&target=dak&text=<word>`). English headwords only were sent.
  Spellings are verbatim from it; nothing was composed. `displayLabel` shows the English until a `dakota`
  field is filled.

## Tier 3 notes (W1, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`WaveRun.edge2?`, `centre2?`, optional so a v4 file still
  loads) and `tests/sim/waves.test.ts`. Choices the spec left open: a wave's `edges: 2` in `waves.json` (absent
  = 1); the second edge is drawn from the other edges and has its own centre; with an odd count the first
  edge gets the extra one (wave 8's three leaders split 2 + 1).

## Seasons notes (S1-S6, 2026-11-20)
- Went past PLAN's file list on purpose: `waves.json` and `DESIGN-slice.md` (wave 4, the user's call),
  `tests/sim/helpers.ts` (`stepFed` switches spoilage off so job tests still watch the store alone),
  `tests/sim/{buildings,economy,save,waves}.test.ts` (counts and the store shape changed), `Build.ts`
  (five slots in the 400 px panel, key 5), `Menu.ts` (controls text 1-5), `state.ts` (`Res`, `JobKind`,
  a `take` walk goal) and `Hud.ts` (the Wotakuye bar now x 750, 170 px wide).
- Choices the spec left open: pemmican in meals may be fractional; a drying worker takes 6 food from the
  nearest store, waits and retries every 50 ticks when it holds less; the tint is a HUD-scene rectangle
  (it also tints the build menu a little); spring newcomers use the United band's 40-food rule.
- Winter tint at 18% is subtle (grass goes from (143,174,90) to (151,186,116)); raise it in
  `seasons.json` if you want it louder.

## Tier 2 notes (V1-V8, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`footprint(x, y, size)`, `footprintOf`, `WaveRun.scouted`),
  `buildings.ts` (`removeBuilding`, `standsAt`, a size-aware `ringSpot`, the requirement message now reads
  `Needs the <upgrade label>.`), `Game.ts` and `Select.ts` (1x1 ghost, sprite centre, click and outline),
  `Menu.ts` (controls text mentions Tab), `tests/sim/{buildings,save,upgrades}.test.ts` (menu order, a v3 file,
  the new message), `DESIGN-slice.md` (waves 5-6), `TESTING.md`.
- Choices the spec left open: `scouted` is a boolean and the banner counts come from `waves.json`; the early
  warning fires only if the lodge is staffed at exactly tick `at - 600`, else the old 300; "staffed" means a
  `scout` worker standing on the lodge's ring of tiles; scouts and drillers just wait there; a trap springs on
  any wolf, fleeing or not, and says `A trap sprang on a wolf.`; fire pits slow fleeing wolves too; traps and
  pits block their tile for people like any building; upgrade labels are `Akicita scouts`, `Akicita warriors`,
  `Builders' society`, `Better tools`; the Upgrades panel is two columns (tier 1 left, tier 2 right, each tier 2
  card next to nothing in particular) and 960 x 512; the Build panel is now 140 px tall (a page strip on top).
- `parseSave` also rejects a wave run without a boolean `scouted`.
- The smoke test presses keys with a retry (`pressUntil`): Phaser reads keys from a per-frame queue and a key
  that lands between frames is sometimes missed, so a single press made the test fail about half the time.
- Not done (spec: not in this pass): riders and horses, barricades, calling a wave early.

## Upgrades notes (U1-U5, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`gift`, `upgrades`, the `buy` order), `orders.ts`,
  `Game.ts` and `Select.ts` (`overUi` also checks the Upgrades panel), `Build.ts` (six slots, right-aligned,
  hidden until unlocked), `tests/sim/buildings.test.ts` (six buildable types; the lodge needs the upgrade),
  `DESIGN-slice.md` and `TESTING.md` (small text updates).
- Choices the spec left open: the Upgrades button is at the top right under the speed buttons (the bar
  had no room); the bar font is 13 px so `Gift n` fits; the panel does not pause and Esc or U closes it;
  buying is a `buy` order (so it works while paused); a healer treats whoever is within 2.5 tiles when the
  50 ticks end (the patient may have walked off, then nothing happens); a healer never treats themself;
  gift is added at the end of the day-start step from the band the camp is in then.
- Windows pitfall met this session: Python `open()` without `encoding='utf-8'` wrote a lone cp1252 byte into
  `Hud.ts`; fixed. Use `encoding='utf-8', newline=''` for scripted edits.

## Wotakuye help notes (H1-H2, 2026-11-20)
- Went past the plan on purpose: `economy.ts` now exports `BANDS` and `EV`. Choices the plan left open:
  the "K above <lower band>" line became `<Band> holds down to <from>` (exact, since Wotakuye can be
  fractional); a zero gift reads `Gift tomorrow: 0`; the tooltip is monospace 12 px and covers the
  Upgrades button while open (hover-only, so clicks pass through).

## DS4 notes
- DS4 went past PLAN's file list on purpose: `src/save/files.ts` (download and file-picker helpers),
  and one line each in `Game.ts` and `Select.ts` (`overUi` is true while the HUD panel is open, so
  clicks do not reach the map). The `?debug` hook gets `window.menu` (button centres, card texts) and
  `window.camp.hud`.
- Choices the spec left open: Esc closes the panel like Resume; the panel keeps the game paused (Space
  cannot unpause it); **Resume** always unpauses, even if the game was paused before you opened the
  menu; if **Save and quit** cannot write, the panel says so and the button becomes **Quit anyway
  (not saved)**; the unity bar moved left (x 760 -> 680) to make room for the Menu button. Say so if
  you want any of these otherwise.

## DS3 notes
- DS3 also fixed a latent bug in `Game.ts`: the scene object outlives a run, so `ground`, `trees` and
  `buildingViews` were never reset on restart (a second run would have drawn no buildings). `create`
  now resets them. It also adds `scene` to the `?debug` `window.camp` object.
- With no slot (the menu has no slot picker until DS4) the "Autosave is off" toast shows at run start.

## C8 fix list (from the user's playtest)
- Done 2026-11-19: all movement speed doubled (people 0.05 -> 0.1, elders 0.04 -> 0.08, wolves and
  pack leader 0.08 -> 0.16, wolf flee 0.1 -> 0.2 per tick). Edited `jobs.json`, `enemies.json`,
  `FLEE_SPEED` in `combat.ts` and the tables in DESIGN-slice.md. The wolf now reaches a hunter
  holding at range 4 in about 2 s, so the duel test uses seed 2 (seed 1 missed its two ranged shots).
  Game speed (the 1x/2x/4x buttons) is unchanged. Say so if you meant that instead.

## Awaiting the user
- Nothing on CULTURE.md: all questions are decided (2026-11-19).
- C1 map deviations (river stays inside the clearing; berry patches never touch it): the user left
  the call to Claude on 2026-11-19, so the code was kept and `## Map` in DESIGN-slice.md was updated
  to match. Tell Claude if you want the old rule back.

- C3 went past PLAN's file list on purpose: haul/build/hunt/gathering-spot behaviour in `jobs.ts`, `tick.ts`
  and `state.ts` (a site cannot complete without them), `Game.ts` and `main.ts` for ghost placement.
  Say so if you want that scope kept to the plan next time.

- C5 also touched `state.ts` (new orders, `speed`, `paused`), `tick.ts` (order handling moved to
  `orders.ts`), `jobs.ts` (drafted people only walk), `Game.ts`, `Build.ts` (`isOpen`) and `main.ts`,
  and `Select.ts` includes toasts and pause/speed keys. Drafted people keep their job and its worker
  slot, and resume it when undrafted. Say so if you want it otherwise.

- C6 went past PLAN's file list on purpose: `state.ts` (enemies, wave progress, `result`, `post` on
  a person, the `attack` order), `people.ts`, `jobs.ts` and `tick.ts` (hooks), `orders.ts`, plus
  `render/enemies.ts`, `Hud.ts` (wave banner, end screen), `Select.ts` (right-click a wolf) and
  `Game.ts`. Choices the design left open: wolves walk in straight lines (they ignore the river and
  buildings); a drafted person returns to a `post` tile (where drafted, or the last `move` target)
  after a fight; fleeing wolves are not auto-targeted unless already in weapon range; the tick loop
  stops once `state.result` is set. Say so if you want any of these otherwise.

- C7 went past PLAN's file list on purpose: `Boot.ts` (starts the menu), `main.ts` (registers it),
  `DEVELOPMENT.md` and `AGENTS.md` (guide lines). Speed buttons also resume a paused game; the
  smoke test uses its own port (5184) because 5174 may be taken by a running dev server. `npm run
  publish` was run once, so `index.html` and `build/` exist locally, uncommitted.

## Requests for Codex
- Art is specified (2026-11-20): read [art/STYLE.md](../art/STYLE.md), [art/SPEC.md](../art/SPEC.md),
  [art/PIPELINE.md](../art/PIPELINE.md) and [art/BATCHES.md](../art/BATCHES.md). Rule: Codex draws and
  installs all art; Claude never draws. **AB0 (style keys, Approval authority: user) is requested only
  when the user says go**; it can be generated before Claude's AC rows, but is installed after AC1-AC3.

## Taken from Codex
- None.
