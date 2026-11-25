# Claude handoff (Dead Woods)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- Z82 (Rescue cutscene) done 2026-11-25, uncommitted: `src/sim/rescue.ts` plays it after Mission 1's win. Eli's first `m01Ambush` line; six zombies (`amb1`–`amb6`) walk out of the most wooded side 10 tiles from Cass and Eli while the camera follows; the other three lines; one arrow per kill every 0.6 s (June, June, Ray, June, Ray, June, matching her "four for me, two for you"); Ray and June, placed 14 tiles off to the side, walk in; `m01Rescue`; Debrief; Base 1 with all four on their end tiles. The kills are scripted (one arrow each, no bites, no range check), so Esc only skips lines. Input is locked and hints are hidden. `m01Win` is gone. For four names, the Base 1 hunger line now reads "Cass 7:57" (the icon already says hunger). Typecheck, 393 unit tests, both e2e specs and a Chromium run from the win into Base 1 pass. Not yet seen by the user. **A14 note for Codex:** Ray and June now appear in Mission 1 (the rescue) as well as Base 1, so their bow shot and walk show there first.
- Z81 (Base 1 with four) done 2026-11-25, uncommitted: `base1.json` `extraSurvivors` adds Ray (31,47) and June (32,47) to Base 1 (hunger each; Mission 1's end poses override once Z82 saves them); herd 18, with Easy 12 and Hard 24 (my choice so Easy < Normal < Hard; tell me if wrong). A checkpoint with exactly Cass + Eli (before this) still loads and Ray and June join it; any other missing survivor still refuses it. Typecheck, 388 unit tests, both e2e specs pass; not seen by the user. Next: Z82.
- Z80 (Bow, arrows, Tracker) done 2026-11-25, uncommitted. Ray and June carry `bow` (key 1, label "Bow 8"), pistol (2) and their melee (3; new rebindable *Weapon 3* key). 8 arrows each (`Survivor.arrows`, saved with the state; old Base checkpoints still load). Each hit leaves the arrow on the target's tile (`state.looseArrows`); **any survivor who walks over it sends it back to its shooter's quiver** (my reading of DESIGN §5 "picked up"; tell me if the picker should keep it). Hold shoots the bow first while there are arrows; Free fire still adds the pistol; no arrows means melee. June's bow cooldown is 0.75 s. Ray's Tracker draws a faint ring under every zombie within 6 tiles, above walls, trees and the closed roof. The flight is an `arrow_fly` tween (0.2 s); arrows on the ground use `arrow_ground`. Mission's sprite sync now adds a sprite for a survivor who joins mid-scene, and `?debug` has `dw.join(id, kind, x, y)` (used for the browser check; Z82 needs the same path). Typecheck, 385 unit tests, both e2e specs and a Chromium check in Mission 1 pass. Not yet seen by the user (Ray and June reach a real scene in Z81/Z82). Next: Z81.
- Z79 (Roster wiring) done 2026-11-25, uncommitted: kinds `hunter`/`archer` (Ray/June) with stats, hatchet and war club, trait lines, portraits, and stand-in art keys (listed in the A14 item below). The bow, arrows and traits' effects are Z80. Next: Z80.
- Z78 (Record Ray and June) done 2026-11-25, uncommitted: two new survivors, Ray and June (Dakota father and daughter archers), grilled with the user; DESIGN §5/§6/§12/§13/§16, `DESIGN-characters.md` cards, new `m01Ambush` + `m01Rescue` lines (not played yet). Next build units Z79–Z82.
- Z65 (Shuffles + herd direction) done 2026-11-25, uncommitted: Mission 1 picks one of 4 zombie/crate layouts at each start or restart (same loot, shuffled spots); Base 1 picks one of 4 roamer spawn sets and the herd's edge, which the warning line, red arrow and arrival pan follow; the herd checkpoint keeps both. No art needed. Next: Z79 (Z26 skipped by the user 2026-11-25). Not yet seen by the user.
- Z64 (Difficulty) done 2026-11-25, uncommitted: Easy / Normal / Hard in Options, applied at each Mission 1 / Base 1 start or restart (Intro stays Normal); no art needed. Next: Z65 (Shuffles + herd direction). Accepted by the user 2026-11-25.
- Z77 (Bigger maps) done; all uncommitted. Every map is 64 × 64, old content moved +16 tiles; Mission 1 has a shed, 10 zombies, 6 crates; Base 1 more roamers and a farther herd. Also fixed: squad cards and the hunger line said "Fighter"/"Scout" and showed no portrait (now Cass/Eli with portraits and the trait tooltip). Next: Z64 (Difficulty). Not yet heard or seen by the user: the 64 × 64 maps by hand, the Z75 music, the bond move by hand (J, aim, click; Mission 1 now opens with the `m01Start` exchange), the new Intro flow (Cass alone, Eli's arrival, the freeze at 3.4 tiles, the "Time is stopped" line), the squad-card trait tooltip, the live pointer cone, the squad-card face crop, and the Base 1 start tiles after Mission 1.

## Awaiting the user
- Design of the 7-character roster (user is deciding; grill when ready, see PLAN.md *Later*).

## Requests for Codex
- Both handoff files were trimmed on 2026-11-24. The art rules from the old C1–C9 briefs now live in
  `art/STYLE.md` (*Drawing rules for every figure*, *Zombie crowd*, *UI art*, *Atlas contract*); that
  file owns the art rules.
- E1 environment probe and A12 Hold icon: done (installed 2026-11-25, see the Codex handoff).
  A key with a file in `art/frames/env/` replaces its grey stand-in in all three scenes; walls and
  trees fade to 40% in front of a survivor, so draw them fully opaque.
- **E2 woods** (2026-11-25, open; answers Codex's K1). **Approval authority: user**, from an in-game
  preview: first the sample, then the rest of the batch. Approving the sample does not approve the
  batch. Rules: `art/STYLE.md` *Environment art* + *Key contract*; palette `art/palette.json`
  (32 colours, alpha 0 or 255). Match the approved E1 art in `art/frames/env/`: same pixel density,
  chunky hard clusters, no dithering, no outline halo, no cast shadows, overcast light.
  - **First sample: `ground_dirt`** (128 × 64, anchor 0.5, 0.5). It is the riskiest piece: the code
    mixes dirt, leaves and moss in hashed patches, so its edges must sit seamlessly beside
    `ground_moss`. Preview it in Mission 1 and Base 1, mixed with the moss, beside Cass and Eli.
    Stop for the user's verdict before drawing the other seven.
  - **Then:** `ground_leaves`, `ground_path`, `tree_b`, `tree_c`, `bush_b`, `tent`, `campfire`, in
    that order, in one preview of all seven (the Intro camp for the tent and campfire, Mission 1 for
    the rest). If the sample's feedback changes the look, carry it into these prompts.
  - **Paths:** `art/inbox/E2/env/<key>.png` at the exact source size; prompts in
    `art/inbox/E2/prompt.txt`; review shots in `art/inbox/E2/review/`. After approval:
    `npm run art:pack -- E2`, set each key's manifest `status` to `final` in the same change, add a
    PROVENANCE line, then typecheck, unit tests and a Chromium render check in all three scenes.
  - **Ground tiles share the E1 moss's edge rule:** the outer ring of every ground tile uses the same
    dark base near `#4b4f49` as `ground_moss`, so any two tiles meet without a seam; each tile's own
    character lives toward the centre. Diamond exactly 2:1, flat, transparent corners.
  - **Prompts** (built-in imagegen, one call per sprite, as for E1):

    `ground_dirt`: Generate a single isolated game sprite, a full 2:1 isometric DIAMOND forest ground
    tile (128x64 source target). Exactly horizontal left/right tips and vertical top/bottom tips,
    straight 2:1 edges, flat top texture with zero visible thickness, transparent exterior. Damp
    northern woods: bare packed earth showing through thin moss, even soft overcast daylight, no
    raised objects or scene. All four edges have the same middle dark grey-green base near #4b4f49,
    shifting toward the centre into irregular low-contrast patches of damp grey-brown earth
    (#45362d, #5e4839, #565342) with a few tiny pebbles (#646e73, #77745a) and sparse moss flecks
    (#3b4433, #505b40). Uniform low contrast for legibility of characters and game overlays. No
    border, no edge shading, no shadows, no puddles, no bright bits or prominent repeat motif. Crisp
    hand-crafted native-resolution pixel art with sharp pixel clusters, serious muted survival game.
    One large diamond centered on canvas with margin. True transparent background.

    `ground_leaves`: the same frame and edge sentences as `ground_dirt`; centre: a loose litter of
    fallen dead leaves and spruce needles, small flat leaf shapes of 2–4 pixel clusters in muted rust
    and brown (#5e4839, #785c46, #957456, #77745a) with a few greyed olive leaves (#697653); no bright
    orange, no single large leaf.

    `ground_path`: the same frame and edge sentences; centre: a worn foot trail of compacted dull
    grey-brown earth (#565342, #5e4839, #77745a, #957456) running tip to tip in both directions (the
    code chains path tiles any way), soft ragged moss margins, a few flat stones, no wheel ruts, no
    footprints. Slightly lighter than `ground_dirt` so the route reads, still low contrast.

    `tree_b`: Generate one isolated game sprite of a single tall northern pine tree, in the same
    style, camera and palette as the approved spruce `tree_a` (foliage #292c24 #3b4433 #505b40 #697653
    #869169, trunk #45362d #5e4839 #646e73). A Scots-pine silhouette, clearly different from the
    spruce: a long bare grey-brown trunk for the lower third, then a few irregular flat-topped clumps
    of needles, one dead bare branch stub. Visible width about 0.45 of its height, source cell
    56x144, trunk foot centre at the placement anchor near the bottom (0.5, 0.92). Fully opaque body.
    No cast shadow, ground, other plants, outline halo, text or scene; one tree fully inside the
    canvas with margin and true transparency outside.

    `tree_c`: as `tree_b`, but a dead or dying birch: a pale weathered trunk (#c0c8c4, #a1adb0,
    #818d91) with dark bark marks (#363b3f), thin bare upper branches and a few sparse clumps of
    faded leaves (#77745a, #697653). Ominous, not cartoonish; same cell and anchor.

    `bush_b`: Generate one isolated game sprite of a single low wide northern-woods juniper or fern
    thicket, in the same style, view and palette as the approved `bush_a` (#292c24 #3b4433 #505b40
    #697653 #869169), clearly a different plant: spiky or frond-like clumps instead of round leaves, a
    little darker and more ragged. Dense silhouette that can hide a crouched figure, about 1.6 times
    as wide as high, lowest fronds a little in front of the ground contact point; source cell 80x52,
    anchor (0.5, 0.75). No berries, flowers, outline halo, cast shadow, ground, props or scene; a
    single plant fully inside the canvas with margin and true transparency.

    `tent`: Generate one isolated game sprite of a small worn two-person ridge tent pitched in the
    woods, 2D pixel art for a fixed 2:1 isometric camera, the ridge running down-right on screen.
    Faded olive-drab canvas (#505b40, #697653, #3b4433) with a few patched, mud-stained panels
    (#565342, #77745a), a dark open flap on the front gable (#24272a), taut guy lines to small pegs, a
    sagging middle. Lived-in, not military-new; no logos or text. Source cell 160x112, footprint
    centre at the anchor (0.5, 0.8), fully opaque. No cast shadow, ground, campfire, people, outline
    halo or scene; one tent fully inside the canvas with margin and true transparency.

    `campfire`: Generate one isolated game sprite of an unlit campfire pit for a fixed 2:1 isometric
    camera: a ring of 7–9 grey stones (#4b5358, #646e73, #818d91) around a small pile of crossed,
    half-burnt logs (#302724, #45362d, #5e4839) with charred ends on a bed of dark ash (#24272a,
    #363b3f). No flames, glow or smoke (the code draws the fire and its light). Source cell 64x48,
    ring centre at the anchor (0.5, 0.7). No cast shadow, ground, outline halo or scene; one fire pit
    fully inside the canvas with margin and true transparency.

- **Maps are 64 × 64 since Z77** (2026-11-25): the Mission 1 house is now at tiles 25–38 × 25–35 and the start at (30, 45); a shed stands at 50–55 × 44–48. Any preview shot framed on old tile numbers needs +16.
- **A13 Bond icon** (2026-11-25, open; Z76 done): the key is **`icon_bar_bond`** (96 × 96, group
  `icon_bar`, like every other bar icon; not `icon_action_bond` as first written), grey stand-in in
  `art/frames/ui/`. Two figures back to back, UI-kit style (DESIGN §23). The button shows on Cass's and
  Eli's bars in Mission 1 and Base 1 and greys out once used. **Approval authority: user**, in the game.

- **E3 house** (2026-11-25): Codex started it on its own, using the *Key contract*. The user approved
  the `floor_wood` sample and the full preview is in progress in `art/inbox/E3-full/`. No Claude brief
  is needed. Roof side faces stay code (STYLE *Key contract*), so E3 is `roof_top` only.
- **E4 props** (2026-11-25, open). Start it **after E3 is installed**, so the preview shows the final
  house. **Approval authority: user**, from an in-game preview: first the sample, then the rest of the
  batch. Approving the sample does not approve the batch. Rules: `art/STYLE.md` *Environment art* +
  *Key contract* (sizes and anchors there and in `art/manifest.json`); palette `art/palette.json`
  (32 colours, alpha 0 or 255). Match the approved E1-E3 art: same pixel density, chunky hard
  clusters, no dithering, no outline halo, no cast shadows, overcast light. Gore is mature and visible
  (STYLE *Gore*), but muted: no red outside blood pixels, no saturated colour.
  - **First sample: `crate_closed`** (64 × 56, anchor 0.5, 0.8). It is the prop seen most often and it
    sets the props' scale against the figures. Preview it in Mission 1 at several crate spots
    (outdoors, the shed, inside the house with the roof opened by the debug hook), beside Cass and
    Eli. Stop for the user's verdict before drawing the rest.
  - **Then**, in one preview: `crate_open`, `stove`, `spike_armed`, `spike_spent`, `noise_can`,
    `barricade`, `body`, `blood_a`, `blood_b`, `blood_c`, `cover`. Show the crates, body and blood in
    Mission 1; the stove (on the E3 wood floor), traps and barricade in Base 1. Set the trap and
    barricade states through the debug hook. `cover` is on no map today: show it on a test tile and
    say so. If the sample's feedback changes the look, carry it into these prompts.
  - **Paths:** `art/inbox/E4/env/<key>.png` at the exact source size; prompts in
    `art/inbox/E4/prompt.txt`; review shots in `art/inbox/E4/review/`. After approval:
    `npm run art:pack -- E4`, set each key's manifest `status` to `final` in the same change, add a
    PROVENANCE line, then typecheck, unit tests and a Chromium render check in Mission 1 and Base 1.
  - **Swaps:** the code swaps `crate_closed` / `crate_open` and `spike_armed` / `spike_spent` in
    place, so each pair shares its footprint and base outline exactly; only the top changes.
  - **Flat pieces** (`spike_*`, `body`, `blood_*`) lie on the ground at 2:1 iso foreshortening, with
    no height or cast shadow. Code draws them under the figures.
  - **Prompts** (built-in imagegen, one call per sprite, as for E1-E3). Shared closing sentence for
    every prompt, called *the closing* below: "Crisp hand-crafted native-resolution pixel art with
    sharp hard-edged pixel clusters, no dithering, even soft overcast daylight, serious muted
    survival game. Fixed 2:1 isometric camera. No cast shadow, ground, outline halo, text or scene;
    one object fully inside the canvas with margin and true transparency outside."

    `crate_closed`: Generate one isolated game sprite of a small closed wooden supply crate for a
    fixed 2:1 isometric camera, about knee-high to a standing survivor. Weathered rough-sawn planks
    (#45362d, #5e4839, #785c46, #957456) with two darker cross battens (#302724), a few dull iron
    corner brackets (#4b5358, #646e73), damp grey at the bottom edge. Lid shut, no labels, stencils
    or logos. Source cell 64x56, footprint centre at the anchor (0.5, 0.8), fully opaque. The closing.

    `crate_open`: the same crate as the approved `crate_closed`, same footprint, outline and planks,
    with the lid pried off and leaning against one side, showing an empty dark interior (#24272a,
    #302724) and a little loose straw (#ad9a67, #77745a). Nothing inside (the code shows the loot).
    Same cell and anchor. The closing.

    `stove`: Generate one isolated game sprite of an old cast-iron wood-burning kitchen stove for a
    fixed 2:1 isometric camera, standing on a cabin floor: a squat iron box on short legs, two round
    hob plates on top, a small firebox door on the front, a short black stovepipe rising from the back.
    Iron in #24272a, #363b3f, #4b5358, #646e73, with faint rust (#5e4839, #785c46). Cold and unlit:
    no flames, glow or smoke (the code draws the fire and its light). Source cell 96x112, foot
    centre at the anchor (0.5, 0.85). No pots, food or furniture. The closing.

    `spike_armed`: Generate one isolated game sprite of a shallow spike-pit trap seen flat on the
    ground at a 2:1 isometric angle: a small oval of freshly dug dark earth (#302724, #45362d) with a
    rim of loose soil (#5e4839, #565342) and 5-7 sharpened wooden stakes (#785c46, #957456, pale cut
    tips #ae8b66) angled upward from inside. Fits well inside one ground tile; source cell 96x48,
    centre at the anchor (0.5, 0.5); low, no tall parts. The closing.

    `spike_spent`: the same pit, outline and rim as the approved `spike_armed`, with most stakes
    snapped or pushed flat and a dark dried stain (#382a2d, #543437) in the pit. Same cell and
    anchor. The closing.

    `noise_can`: Generate one isolated game sprite of an improvised noise trap for a fixed 2:1
    isometric camera: a short stick driven into the ground with a cord strung from it and four or five
    dented tin cans tied on, hanging. Stick #5e4839 #785c46, cord #77745a, cans dull tin (#646e73,
    #818d91, #a1adb0) with a little rust (#785c46). Small and readable; source cell 40x56, the
    stick's foot at the anchor (0.5, 0.85). The closing.

    `barricade`: Generate one isolated game sprite of a makeshift barricade segment for a fixed 2:1
    isometric camera: rough planks and a bent sheet of corrugated scrap metal nailed across two short
    posts, with one plank braced on the ground. Wood #45362d #5e4839 #785c46, metal #4b5358 #646e73
    #818d91 with rust #785c46. About waist-high to a survivor; compact and roughly symmetric, so it
    reads the same whichever way the next segment runs. Source cell 96x64, foot centre at the anchor
    (0.5, 0.8), fully opaque. The closing.

    `body`: Generate one isolated game sprite of a dead zombie lying face down on the ground, seen at
    a 2:1 isometric angle, body running left to right across the canvas: torn, muddied, muted
    clothes (#3b4433, #565342, #45362d), grey decayed skin (#818d91, #646e73), a little dark dried
    blood (#543437, #704143) at the head. One generic body that suits any of the zombie looks; flat
    on the ground, no height or shadow. Source cell 68x28, centre at the anchor (0.5, 0.5). The
    closing.

    `blood_a` / `blood_b` / `blood_c`: Generate one isolated flat ground decal of blood, foreshortened
    2:1 as if lying on the ground, in muted dark reds only (#382a2d, #543437, #704143, #8d5050): no
    bright or saturated red, no puddle highlight. `blood_a` 88x40: a pool with a short smear;
    `blood_b` 64x32: a small splatter with a few drops; `blood_c` 104x44: a long drag smear. Ragged
    hard-edged pixel outlines, centre at the anchor (0.5, 0.5). The closing.

    `cover`: Generate one isolated game sprite of a low cover piece for a fixed 2:1 isometric camera:
    a short stack of split logs and old planks, about knee-high, that a crouched figure can hide
    behind. Wood #302724 #45362d #5e4839 #785c46, a little moss #505b40. Compact and roughly
    symmetric; source cell 88x48, foot centre at the anchor (0.5, 0.8), fully opaque. The closing.

- **A14 Ray and June** (2026-11-25, open after E4 or when the user says). **Approval authority:
  user**, from an in-game preview. Briefs: `DESIGN-characters.md` *Ray Bluestone (`hunter`)* and
  *June Bluestone (`archer`)*, plus its mirror rule and sheet checklist; `art/STYLE.md` figure rules.
  Same frame sets as Cass and Eli (walk, run, crouch, crawl, melee, pistol shot), plus a **bow shot**
  (draw and release, bow in the right hand) for both, a **hatchet** swing for Ray and a **war club**
  swing for June. Portraits in the four moods (neutral, afraid, determined, hurt) like Cass and Eli.
  Two small sprites: `arrow_fly` (an arrow in flight, drawn pointing right; the code rotates it) and `arrow_ground` (an arrow lying on a tile).
  Three bar icons (Z80, 96 × 96, group `icon_bar`, UI-kit style like `icon_bar_club`): `icon_bar_bow`, `icon_bar_hatchet`, `icon_bar_warclub`; grey stand-ins in `art/frames/ui/`.
  Keys (stand-ins installed by Z79, all `placeholder` in `art/manifest.json`): figures `hunter` and `archer` (2x sheets, atlases `hunter`/`archer`; anims `idle` 1, `walk` 4, `run` 4, `crouch` 4, `crawl` 4, `hold` 1, `work` 2, `death` 4, `pistol_shot` 3, `bow_shot` 3, plus `hatchet` 3 for Ray and `club` 3 for June); portraits `portrait_<hunter|archer>_<neutral|afraid|determined|hurt>` 256 and `portrait_small_<hunter|archer>_<neutral|hurt>` 72; env keys `arrow_fly` 48 × 16 and `arrow_ground` 48 × 20 (source px, anchor 0.5, 0.5). Install with `npm run art:pack`, which replaces the stand-ins. Respect notes: no feathers on
  either, no pink or purple on June; her face paint is a red band across the eyes and three black
  chin lines.

## Taken from Codex
- K1 E2 woods brief (2026-11-25), done: the item *E2 woods* under *Requests for Codex* above.
