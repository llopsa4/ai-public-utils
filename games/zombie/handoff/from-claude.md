# Claude handoff (Dead Woods)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- Z106 (Finish action) done 2026-11-26, uncommitted; no claims held. Finish (key `N`, bar button in scenes with squatters): Ray and June spend one silent arrow from bow range, everyone else holds 2 s adjacent, crouched (`orderFinish` / `stepFinish` in `abilities.ts`; `combat.ts` `discharge` is the shared cost of a shot). Choices of mine for the user to judge: an archer with no arrows does it by hand; a hand finisher counts as crouched to guards; with several selected, an archer with arrows goes first. A player who had already bound another action to `N` gets all key bindings reset. New keys `icon_bar_finish` and `cursor_finish_no` (see A19 below); `art/atlas/ui.png` / `ui.json` were rebuilt, so rebuild any staged UI atlas. `tests/finish.test.ts` (8). Typecheck, both e2e specs and a Chromium check in Mission 2 pass (button, both pointers, both ways); of 461 unit tests one speed benchmark failed in the full run (1.9x against 2x) and all four speed tests passed alone. Next: Z107 or Z94.
- Z105 (Zombies vs squatters) done 2026-11-26, uncommitted; no claims held; no art keys. Code: `src/sim/ai.ts` (`perceivePrey`, `zombieInSights`, `ai.prey`), `src/sim/combat.ts` (`Body.riseAt` set when a zombie kills a human), `src/sim/mission.ts` (`riseBodies`, `riseIn`, `risenId`, `Enemy.turned`), `enemies.json` `zombie.rise` 30, `src/audio/mood.ts`, the countdown label in `src/scenes/Mission.ts`; `tests/squatters.test.ts` (10). One reading beyond §26 for the user to judge in play: a squatter also shoots a zombie biting it from behind (adjacent, any side), so a lone zombie usually loses to a squatter. **For Z106:** a valid Finish target is a body with `riseAt` set; finishing deletes `riseAt` (the label goes with it). **For Codex (A19):** a risen zombie is an `Enemy` with `turned: true` and id `<squatter id>-z`; it draws with the ordinary zombie sheets until the turned-squatter sheet exists. The countdown label was not checked in Chromium. Next: Z106, Z107 or Z94.
- Z93 (Mission 2 build) done 2026-11-26, uncommitted; no claims held (the manifest claim is released). Mission 2 plays end to end: title with a `done` save → *Mission 2 (preview)* → the estate (80 × 80, 12 squatters, 6 zombies) → Theo's speaker subtitles → last squatter down → door scene → Debrief → title (no save change; Z100 wires the flow). **For Codex (A17 open):** eight new env keys with code stand-ins, all `placeholder`: `fence` (low cube, a run of tiles), `gate` (post either side of the 4-tile gap), `solar_panel` (flat cube, rows of 7), `inverter`, `generator` (in the shed), `intercom` (post by the gate and in the concrete room), `bunker_door` (a wall tile with a door face, removed when it opens), `floor_concrete` (ground tile). No atlas or `standins.json` change. The rich house's walls, roof and furniture reuse the E3/E7 keys for now. Preview: open `/?debug` with a save of stage `done`, Continue, *Mission 2 (preview)*. **For Z105:** squatters and zombies still ignore each other. **For Z107:** every new line is marked `(placeholder)` (`story.json` `speaker`, `m02Power`, `m02Meet`, the `m02.json` hints, card `Mission2`). **For Z94:** `m02.json` holds the estate map; the HUD shows ammo and scrap only (no squatter counter). Next: Z105, Z107 or Z94.
- Z99 (human assault AI) done 2026-11-26, uncommitted; no claims held. Code only (`src/sim/ai.ts`, `src/sim/base.ts` `addRaider`, `enemies.json` `human.speed.assault`, `tests/assault.test.ts`); no art keys. **For Z94:** raider ids must not start with `r` or `h` (roamer / herd prefixes; default `g…`); a raider's kill still reads "was shot by a guard" on the fail screen; raiders sealed out on the same side gather on the same tile (no unit spacing, as zombies); a far-half survivor takes one tick to be fixed on. Next: Z92 or Z91.
- Z92 (Mission 2 design) done 2026-11-26, approved by the user: DESIGN §26, PLAN Z105–Z107 and A19 added, Z93 and A17 updated. No code. **For Codex:** A17 and the new A19 (squatter sheets, turned-squatter zombie, Finish red-cross pointer) wait on Z93 and Z106 keys.
- Z89 (Theo bios data + rules) done 2026-11-26, uncommitted; no claims held. Theo's bio is in `bios.json`; `bio_tinkerer` is a `placeholder` with a grey stand-in. **Codex: A16 step 2 (`bio_tinkerer`) is open.** No save reaches his tab yet: preview it as an isolated review with the `bunker` beat forced. **Codex:** my `art:standins` run overlapped your A18 install (the UI atlas came out byte-identical to your staged one); I removed the stale `icon_bar_highlight.png` line from `standins.json`. **New guard (user, 2026-11-26):** `art:standins` and `art:pack` now stop (exit 2) while the other agent's *Working on* names the manifest, `standins.json` or the atlases and claims them or says installing, packing or rebuilding (not "no claims held", "released" or "done"); `--force` for a stale claim, and an isolated `--root` with no `handoff/` is never blocked (DEVELOPMENT.md). Please write such claims as `Claimed: <files>`. Next: Z99.
- Z88 (Theo bio text) done 2026-11-26, uncommitted; no claims held. Approved block in `DESIGN-characters.md`; beats `bunker`, `base2`, `hut`. Next: Z89 adds them to `BEATS`, `bios.json` and `BIO_ORDER`, restores the verbatim test to all five blocks, and adds `bio_tinkerer`.
- Z90 (Theo roster wiring) done 2026-11-26, uncommitted; no claims held. Kind `tinkerer` (Theo): `characters.json` stand-in stats (HP 70, walk 2.5, run 4.5, crouch 1.4, crawl 0.7, vision 6; Z91 sets the real ones), pistol + new `shovel` weapon (range 1.5, 15 damage, silent, 1.2 s; plays the new `shovel` anim and the club sound), name, portrait lookup, trait line (Resourceful has no effect until Z91). No scene includes him: Z93 adds him at the bunker door. **Codex: A16 sheets are open.** The keys named in the A16 item now exist as grey stand-ins, plus one more: **`icon_bar_shovel`** (96 × 96, group `icon_bar`, weapon button; match the hatchet and war club icons; inbox `art/inbox/A16/ui/icon_bar_shovel.png`). `art/atlas/ui.png` / `ui.json` were rebuilt and `tinkerer.png` / `.json` are new, so rebuild any staged UI atlas before installing. Preview: Mission 1 with `?debug`, then `dw.join('tinkerer', 'tinkerer', x, y)` beside a survivor. **For Z94:** with five cards at 150% text the squad panel covers the left end of the hint banner and the selection line. Next: Z99, or Z88 (Theo bio text).
- Z98 (Enemy-highlight button) done 2026-11-26, uncommitted; no claims held. `highlightAvailable` (`src/sim/highlight.ts`) is true for a living survivor of kind `tinkerer` (Z90 adds the kind; drop the cast then) or `MissionState.theoOnAir` (Z93 sets it at his first speaker line). `barButtons` adds `highlight` (key `M`); the scenes keep the toggle, which is off at every scene start and works while time is paused. `src/render/highlight.ts` copies enemy frames into one knockout-glow layer per colour (red zombie, orange human), above walls and the closed roof; `UnitSprite.update` now sets the frame of a roof-hidden living figure. A player who had already bound another action to `M` gets all key bindings reset to default. Typecheck, 421 tests, both e2e specs and Chromium (flag set by hand) in Mission 1, Base 1, under the closed roof and at 150% text; not yet seen by the user. Next: Z90.
- Z97 (Food off in bases) done 2026-11-26, uncommitted; no claims held. `base1.json` `food: false` (the food hints moved to `foodHints`); `BaseState.foodOn` switches off hunger, the stove (no tile, sprite, label, click or light), Cook / Eat / Give, the HUD food counter and hunger line, squad and action-bar meters, the Well fed badge (still listed in Records if already earned) and the cooking keys in the help text. The code stays for the hut; its tests pass `foodOn: true`. Older herd checkpoints load with food off. **Then (user, 2026-11-26: "any food mechanic should be hidden until main camp"):** `src/sim/food.ts` `FOOD_SHOWN` also hides Mission 1's food counter and the food in crate pops, the three cooking actions on the Keys page (their keys stay kept, with a neutral refusal) and the Well fed record; Mission 1 still collects food unseen. A crate holding only food now pops nothing. **Kept as they were:** story dialogue that mentions food; idle barks still happen at the old stove spot, and two lines name a stove (`story.json`: Cass `herdBreach`, Eli `idle`). The E4 `stove` sprite and the eat / give / cook icons are unused until the hut; nothing for Codex to do. Typecheck, 415 tests, both e2e specs and Chromium in Base 1, no console errors; not yet seen by the user. Next: Z98.
- Z104 (House pieces) done 2026-11-26, uncommitted: 14 new env keys with grey stand-ins (new `strip` shape and `beam` / `board` cube marks in `placeholders.ts`). Walls pick plain / beam (15%) / boarded (12%) by hash (`wallVariantKey`, every wall, the shed too). `roofPieces(footprint)` gives the ridge along the longer side through the middle and trim on every edge; Mission 1's roof container draws them and the chimney (`m01.json` `chimney`, over the Base 1 stove) and fades them with the roof. `m01.json` also gains `frontDoor` and `furniture` (6 tiles, all wall-side, off crate spots of every layout, the stove, start tiles and the tile in front of every opening or doorway); `housePieces()` pushes upright pieces 0.3 tile toward their wall and places the steps 0.7 tile outside the front door; the rug is baked into the ground. Upright pieces fade in front of a figure like walls and block nothing. **My pick:** STYLE names five pieces for six, so table and chairs stay one piece and the sixth is a woodpile by the back door; tell me if you want another. Known limit: traps and barricades can still be placed on a furniture tile (no gameplay change was allowed). Base 1 has no roof, so ridge, trim and chimney show in Mission 1 only. Typecheck, 413 tests, both e2e specs, Chromium in Mission 1 (roof closed and open) and Base 1, no console errors; not yet seen by the user. **E7 is open** (below). The visual pass code (Z101–Z104) is complete.
- Z103 (Trees + forest border) done 2026-11-26, uncommitted: 4 new env keys with `spire` / `post` stand-ins (new shapes in `placeholders.ts`); `mapTreeKey` / `tallChance` and `forestBorder` in `terrain.ts`; border ground, mist and far-side trees are baked in `ground.ts`, near-side trees are sprites (`addForestFront`) that fade like map trees; `Occlusion` takes a border `pad` and reaches 5 tiles; the camera background is the mist colour. My reading of the STYLE rule: the two near edges (high x or y) get tall trees rarely (15%) and near-side border trees are tall only 5+ tiles out, because tall ones there hid the map. Known limits: the fade still follows survivors only, so a zombie can stand hidden behind a tall tree; world objects below y 850 already drew over health bars and labels (since Z77), and tall trees make that more visible. Typecheck, 410 tests, both e2e specs, Chromium; not yet seen by the user. **E6 is open** (below). Next: Z104.
- Z102 (Ground code) done 2026-11-26, uncommitted: moss-only base; 14 new env keys with grey stand-ins; placement in `terrain.ts` `groundDressing` + `render/dressing.ts`, baked into the ground texture (under figures, blood and everything upright). New `shed` rect in `m01.json` keeps the shed floor clear. `ground_dirt` / `ground_leaves` are now unused. Typecheck, 407 tests, both e2e specs, Chromium in all three scenes; not yet seen by the user. **E5 is open** (below). Next: Z103.
- Z101 (Readability + glitch) done 2026-11-26, uncommitted: `view.json` `zoomStart` 1.5; `UnitSprite` draws a 34 × 17 ellipse shadow (alpha 0.32, depth 0.55) and `showCue` places it (every scene already calls `showCue` each frame). The "dark rectangle" was not the Dialogue scene: the HUD scenes (Mission, Intro, Base) created empty padded texts (banner, selection, hint, goal, hunger, objective) visible, and the ActionBar group visible, and the dialogue that opens in the scene's `create` pauses those scenes before their first `update`. They now start hidden and `update` shows them once they have text. Side effect: during the very first dialogue of a scene the action bar is not drawn yet (it appears when the dialogue closes). Typecheck, 405 tests, both e2e specs and Chromium shots at 1.5× and 1× pass; not yet seen by the user. **Note for Z103:** at 1× Base 1 still shows a black void at the map corner (the forest border is Z103). Next: Z102.
- Z87 (Theo card) and Z96 (Mission 2 → Base 2 → Ray's hut flow, DESIGN §25) done and approved by the user 2026-11-25; docs only. A16 Theo art request added below (reference now; bio after Z89; sheets after Z90).
- Z86 (Bios half layout) done 2026-11-25, uncommitted: `biosPage.ts` only. The figure card is 581 px wide (half the page), the text the other half. A final `bio_<kind>` is drawn at `min(1, fit)` with origin (0.5, 1) at the card bottom - 8, so all four share a baseline; at 1280 × 720 the card is 534 tall, so a 384 × 512 key shows at exactly 1:1. **A15 note for Codex:** the earlier "card 470 × ~534" is now 581 × 534; the 384 × 512 source size is unchanged. Typecheck, 405 tests, both e2e specs and Chromium checks pass; not yet seen by the user.
- Z85 (Bios page) done 2026-11-25, uncommitted: `src/scenes/biosPage.ts` (`drawBiosPage(scene, cx, progress, onClose)` returns `{step, scroll}`; the scene's own panel sits behind it, 1240 wide). Bios button in Pause after Controls (`PauseHooks.progress`, wired in Intro/Mission/Base) and on the title only with a save (the title row becomes Options / Records / Bios then). Esc or X goes back to the pause menu or the title; Left/Right switch tab, Up/Down and the wheel scroll the story (geometry mask). Header text follows the text-size option; the story scrolls so nothing is cut at 150%. **A15 note for Codex:** new manifest group `bio` (scale 1, standalone images like `title`), items `bio_fighter`, `bio_scout`, `bio_hunter`, `bio_archer`, each **384 × 512** source px, status `placeholder` (grey stand-ins in `art/frames/ui/`); the figure card is 470 × ~534 px, so the crop is shown at 1× when it is 384 × 512. Set the manifest `status` to `final` per item and the page switches with no code change. If a crop needs another width, change the size in the manifest and tell me. Typecheck, 405 tests, both e2e specs and Chromium checks pass; not yet seen by the user.
- Z84 (Bios data + rules) done 2026-11-25, uncommitted, with Z83's text approved by the user (Dakota names go in the page header under name and age, not in the text). `src/data/bios.json` holds per kind: `name`, `fullName`, `age`, `role`, `dakota` (`{name, meaning}` for Ray and June, else null), `background`, `entries` by beat. `src/sim/bios.ts`: `progressOfSave(campaign)` (title), `progressOfIntro(state)`, `progressOfMission()`, `progressOfBase(state)` (pause), then `bioTabs(progress)` gives the tabs in join order with their visible entries. Tabs: Cass always; Eli when he has arrived (the Intro pause checks the scout survivor); Ray and June from Base 1. `herd` shows from the warning or a herd checkpoint, `done` after the win. Typecheck and 404 tests pass (`tests/bios.test.ts`). Next: Z85 (the page; the trait line is `traitLine(name)`).
- Z82 (Rescue cutscene) done 2026-11-25, uncommitted: `src/sim/rescue.ts` plays it after Mission 1's win. Eli's first `m01Ambush` line; six zombies (`amb1`–`amb6`) walk out of the most wooded side 10 tiles from Cass and Eli while the camera follows; the other three lines; one arrow per kill every 0.6 s (June, June, Ray, June, Ray, June, matching her "four for me, two for you"); Ray and June, placed 14 tiles off to the side, walk in; `m01Rescue`; Debrief; Base 1 with all four on their end tiles. The kills are scripted (one arrow each, no bites, no range check), so Esc only skips lines. Input is locked and hints are hidden. `m01Win` is gone. For four names, the Base 1 hunger line now reads "Cass 7:57" (the icon already says hunger). Typecheck, 393 unit tests, both e2e specs and a Chromium run from the win into Base 1 pass. Not yet seen by the user. **A14 note for Codex:** Ray and June now appear in Mission 1 (the rescue) as well as Base 1, so their bow shot and walk show there first.
- Z81 (Base 1 with four) done 2026-11-25, uncommitted: `base1.json` `extraSurvivors` adds Ray (31,47) and June (32,47) to Base 1 (hunger each; Mission 1's end poses override once Z82 saves them); herd 18, with Easy 12 and Hard 24 (my choice so Easy < Normal < Hard; tell me if wrong). A checkpoint with exactly Cass + Eli (before this) still loads and Ray and June join it; any other missing survivor still refuses it. Typecheck, 388 unit tests, both e2e specs pass; not seen by the user. Next: Z82.
- Z80 (Bow, arrows, Tracker) done 2026-11-25, uncommitted. Ray and June carry `bow` (key 1, label "Bow 8"), pistol (2) and their melee (3; new rebindable *Weapon 3* key). 8 arrows each (`Survivor.arrows`, saved with the state; old Base checkpoints still load). Each hit leaves the arrow on the target's tile (`state.looseArrows`); **any survivor who walks over it sends it back to its shooter's quiver** (my reading of DESIGN §5 "picked up"; tell me if the picker should keep it). Hold shoots the bow first while there are arrows; Free fire still adds the pistol; no arrows means melee. June's bow cooldown is 0.75 s. Ray's Tracker draws a faint ring under every zombie within 6 tiles, above walls, trees and the closed roof. The flight is an `arrow_fly` tween (0.2 s); arrows on the ground use `arrow_ground`. Mission's sprite sync now adds a sprite for a survivor who joins mid-scene, and `?debug` has `dw.join(id, kind, x, y)` (used for the browser check; Z82 needs the same path). Typecheck, 385 unit tests, both e2e specs and a Chromium check in Mission 1 pass. Not yet seen by the user (Ray and June reach a real scene in Z81/Z82). Next: Z81.
- Z79 (Roster wiring) done 2026-11-25, uncommitted: kinds `hunter`/`archer` (Ray/June) with stats, hatchet and war club, trait lines, portraits, and stand-in art keys (listed in the A14 item below). The bow, arrows and traits' effects are Z80. Next: Z80.
- Z78 (Record Ray and June) done 2026-11-25, uncommitted: two new survivors, Ray and June (Dakota father and daughter archers), grilled with the user; DESIGN §5/§6/§12/§13/§16, `DESIGN-characters.md` cards, new `m01Ambush` + `m01Rescue` lines (not played yet). Next build units Z79–Z82.
- Z65 (Shuffles + herd direction) done 2026-11-25, uncommitted: Mission 1 picks one of 4 zombie/crate layouts at each start or restart (same loot, shuffled spots); Base 1 picks one of 4 roamer spawn sets and the herd's edge, which the warning line, red arrow and arrival pan follow; the herd checkpoint keeps both. No art needed. Next: Z79 (Z26 skipped by the user 2026-11-25). Not yet seen by the user.
- Z64 (Difficulty) done 2026-11-25, uncommitted: Easy / Normal / Hard in Options, applied at each Mission 1 / Base 1 start or restart (Intro stays Normal); no art needed. Next: Z65 (Shuffles + herd direction). Accepted by the user 2026-11-25.
- Z77 (Bigger maps) done; all uncommitted. Every map is 64 × 64, old content moved +16 tiles; Mission 1 has a shed, 10 zombies, 6 crates; Base 1 more roamers and a farther herd. Also fixed: squad cards and the hunger line said "Fighter"/"Scout" and showed no portrait (now Cass/Eli with portraits and the trait tooltip). Next: Z64 (Difficulty). Not yet heard or seen by the user: the 64 × 64 maps by hand, the Z75 music, the bond move by hand (J, aim, click; Mission 1 now opens with the `m01Start` exchange), the new Intro flow (Cass alone, Eli's arrival, the freeze at 3.4 tiles, the "Time is stopped" line), the squad-card trait tooltip, the live pointer cone, the squad-card face crop, and the Base 1 start tiles after Mission 1.

## Awaiting the user
- Design of the last two survivors (6 and 7; Theo is 5). Grill when ready, see PLAN.md *Later*.

## Requests for Codex
- **A19 is open** (2026-11-26, Z106 done). **Approval authority: user**, in the game. Besides the squatter sheets and the turned-squatter zombie in PLAN.md: **`cursor_finish_no`** (32 × 32, group `cursor`, hot spot 16,16): the normal pointer art with a red cross on top, shown while Finish is aimed at anything but a squatter about to turn; its grey stand-in already shows in game. **`icon_bar_finish`** (96 × 96, group `icon_bar`): the Finish button, matching the other bar icons. Inbox: `art/inbox/A19/ui/<key>.png`. Preview: Mission 2 (title with a `done` save, `?debug`); the button is on every survivor's bar there (`N`).
- **A18 Highlight icon** (2026-11-26, open): the key is **`icon_bar_highlight`** (96 × 96, group `icon_bar`), a grey stand-in for now. It is the action-bar toggle for Theo's enemy highlight (DESIGN §5): it shows every enemy as an outline through walls. Match the other `icon_bar` art; suggestion: a pair of glasses, or a figure outline seen through a wall. **Approval authority: user**, in the game. To see it before Theo exists: open `?debug`, set `dw.state.theoOnAir = true` and select a survivor. Inbox: `art/inbox/A18/ui/icon_bar_highlight.png`. `art/atlas/ui.png` and `ui.json` were rebuilt for the stand-in.
- **STOP the old A15 crop task (user, 2026-11-25).** Cancelled: do not finish it, discard any crops,
  install nothing from it, and release any A15 claim. Take the new **A15 Bio figures** item at the
  end of this list instead, starting with the Cass sample.
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

- **A15 Bio figures, new generation** (2026-11-25, open now; replaces the cancelled crop brief;
  DESIGN §24). The old crop plan can't give four matching figures: Cass's and Eli's sources are small
  sprites, while Ray's and June's are detailed, and those show the chest pistol. **Approval authority:
  user**, on the Bios page in game: first the sample **`bio_fighter`** (Cass) beside the grey
  placeholders, then `bio_scout`, `bio_hunter`, `bio_archer` in one preview with a shot of every tab.
  Approving the sample does not approve the batch. If the sample's feedback changes the look, carry
  it into the other three prompts.
  - **Rules:** four figures in the **same quality, size and detail**, in the style of the A14 sources
    (`art/inbox/A14-idles-r1/source/ray.png` and `june.png`, front figure): readable faces,
    fabric folds and camo. **No pistol, holster or gun on the chest or anywhere on the body in
    these images.** The cards and the in-game sprites keep it; only the bios leave it out. Pose:
    **three-quarter front, facing down-right like `idle_se`**, neutral stand, arms relaxed, both
    hands empty; bows and arrows only as the quiver on the back. Identity from the
    `DESIGN-characters.md` card and `art/frames/<kind>/idle_se_0.png`, so each still reads as the
    approved character.
  - **Canvas and scale:** each key is 384 × 512 (manifest group `bio`, 1x, standalone), with a
    transparent background (alpha 0 or 255), project palette per `art/STYLE.md`. One shared scale:
    crown to sole is **496 px for Eli and Ray (180 cm), 469 px for Cass (170 cm) and 455 px for June
    (165 cm)**. Soles sit on row 504, and each figure is centred horizontally. June is 15: slighter
    and younger-looking than the adults, not just a shorter adult. Generate large, then downscale
    and normalise like the A14 idles (`A14-idles-r1/source/prepare-idles.py`). The page will show
    these at 1:1 (Claude's Z86 makes the figure card half the page).
  - **Paths:** `art/inbox/A15/bio/<key>.png`; prompts in `art/inbox/A15/prompt.txt`; review shots
    in `art/inbox/A15/review/`. After approval: pack, set each manifest `status` to `final`, add a
    PROVENANCE line, then typecheck, unit tests, and a Chromium check of the Bios page (title with a
    Base 1 save, every tab).
  - **Prompts** (built-in imagegen, one call per figure, with the A14 reference attached). Shared
    closing, called *the closing* below: "Single full-body character, head to boots, standing in a
    relaxed neutral pose, three-quarter front view facing down-right (toward the viewer's right),
    arms hanging naturally at the sides, both hands empty. Detailed hand-crafted pixel art in exactly
    the style, detail and rendering of the attached reference (readable face, fabric folds, worn and
    muddy after 30 days in the woods), even soft overcast light, serious muted survival game. No
    pistol, no holster and no gun anywhere on the chest or body. No weapon in the hands. No cast
    shadow, ground, text, outline halo or scene. One figure fully inside the canvas with margin,
    true transparent background."

    `bio_fighter` (sample): "Cass Mireles, a woman of 34, about 170 cm, lean and strong, square
    shoulders, straight posture. Oval face, olive-brown skin, dark brown eyes, straight brows, level
    mouth, calm. Dark brown hair with a short neat centred fringe and one low braid down the back.
    Charcoal-grey long-sleeve top, sleeves pushed to the forearms. A centred olive chest rig with
    empty pouches (no holster). Plain canvas belt with a centred buckle and two matching ammo
    pouches, one at each hip. Dark olive-drab utility trousers with matching thigh pockets, a matching
    knife sheath on each thigh (handles forward), knee braces on both knees. Dark tan lace-up boots.
    Dark olive, charcoal and tan; dull grey metal; no red." The closing.

    `bio_scout`: "Eli Varga, a man of 24, about 180 cm, wiry and long-limbed, narrow hips, a distance
    runner. Narrow sun-weathered face, light-brown skin, grey-green eyes, short evenly trimmed
    light-brown beard, straight nose. Sandy-brown hair under a centred cap with a single-colour cap
    band. Faded blue-grey running jacket zipped to the collarbone, full sleeves. A centred hydration
    vest with two matching water bottles on the chest and a matching pouch on each side of the zip. A
    heart-rate strap across the chest, no watch. Long dark navy running trousers, trail running
    shoes. Blue-grey, navy, sand." The closing.

    `bio_hunter`: "Ray Bluestone, a Dakota man of 40, about 180 cm, broad and solid, heavy shoulders,
    a slight belly; the same man as the reference. Wide weathered face, high cheekbones, brown skin,
    deep crow's feet, tired brown eyes, a month-old short dark beard, an old scar across the bridge of
    the nose. Black hair greying at both temples in a short braid at the back. Brown-grey woodland
    camo softshell jacket over a grey fleece, zipped to the chest. A headlamp hanging at the neck and
    a small blue-and-white beaded keychain on the zip pull. The quiver of black carbon arrows on his
    back, fletching just showing above one shoulder. Camo pants with knee patches, tall muddy rubber
    boots, black fingerless gloves. Bare head." The closing.

    `bio_archer`: "June Bluestone, a Dakota girl of 15, about 165 cm, slighter and younger than an
    adult, wiry and quick; the same girl as the reference. Round expressive face, brown skin, dark
    eyes, a grin. Face paint: a red ochre band straight across both eyes and cheekbones, and three
    thin black lines down the chin. Long black hair in one thick braid down the back, wrapped in red
    wool with a blue-and-white beaded tie. Beaded blue-and-white earrings. Her dad's oversized camo
    jacket, sleeves rolled to the same height, red and blue ribbon-work trim down the sleeves, over a
    dark grey hoodie. A knife in a porcupine-quill sheath across the front of the belt. The
    rawhide-and-wool quiver on her back, arrows just showing above one shoulder. Camo pants tucked
    into high-top beaded moose-hide moccasins. No pink or purple, no feathers in her hair." The
    closing.

- **A16 Theo art** (2026-11-25, open now for the reference and the sample; DESIGN §5, §25;
  PLAN A16). **Approval authority: user.** Brief: `DESIGN-characters.md` *Theo Nakamura (`tinkerer`)*
  and its approved *Physical description*, plus the mirror rule and sheet checklist; `art/STYLE.md`
  figure rules and *Bio figures*.
  - **Order and gates.** Theo's keys do not exist yet: Claude's Z90 adds the `tinkerer` figure,
    atlas and portrait stand-ins, and Z89 adds `bio_tinkerer`. Until they land, nothing can be
    previewed in the game, so:
    1. **Now:** one detailed reference figure (front three-quarter, like the A14 idle sources) for
       the user to approve as a review shot. Approving it fixes his look; nothing is installed.
    2. **After Z89:** `bio_tinkerer`, approved on the Bios page.
    3. **After Z90:** the sheets and portraits, approved from an in-game preview. **Rig** and any
       extra animation wait for Z91; Claude will add the keys and tell you.
  - **Look (from the approved card):** a man of 31, about 175 cm, thin, narrow shoulders, a little
    stooped, long thin arms; clearly the least fit body on the roster. Narrow face, light skin, dark
    eyes behind **round wire-rimmed glasses worn level**, short even stubble grown over a month, a
    worried line between the brows. Black hair, centre-parted, a bit overgrown and untidy. Charcoal
    zip-up hoodie, hood down, zipped to the chest, sleeves too long and pushed to the same height;
    dark jeans; plain off-white sneakers. Worn and a month dirty, but less weathered than Ray (he was
    indoors). Gear: pistol holster centred on the chest, grip up; small grey backpack centred with a
    coil of wire at its bottom centre; two matching tool pouches at the hips; the folding
    **entrenching shovel** held in the right hand when used, left hand empty in the neutral pose.
    Colour: charcoal, navy, off-white; one orange paracord accent on the zip pull, centred. Mirror
    rule applies: nothing on one side only.
  - **Keys (to come; names fixed now):** figure `tinkerer` (2x sheet, atlas `tinkerer`; anims as
    Cass and Eli: `idle` 1, `walk` 4, `run` 4, `crouch` 4, `crawl` 4, `hold` 1, `work` 2, `death` 4,
    `pistol_shot` 3, plus `shovel` 3, the melee swing); portraits
    `portrait_tinkerer_<neutral|afraid|determined|hurt>` 256 and
    `portrait_small_tinkerer_<neutral|hurt>` 72; `bio_tinkerer` 384 × 512 (group `bio`). His walk
    and run are the slowest on the roster: a slightly awkward, effortful gait, not a soldier's.
  - **Bio figure:** the A15 rules (no pistol or holster in the bio image; three-quarter front facing
    down-right; hands empty; transparent). Shared scale: **175 cm = 482 px crown to sole**, soles
    on row 504, centred. Prompt: "Theo Nakamura, a man of 31, about 175 cm, thin and slightly
    stooped, narrow shoulders, long thin arms, not athletic. Narrow face, light skin, dark eyes
    behind round wire-rimmed glasses, short even stubble, a worried line between the brows. Black
    centre-parted hair, a bit overgrown. Charcoal zip-up hoodie zipped to the chest, hood down,
    sleeves too long and pushed up evenly, an orange paracord zip pull. Small grey backpack on his
    back with a coil of wire at the bottom. Two matching tool pouches at the hips. Dark jeans,
    off-white sneakers. Charcoal, navy, off-white." Then *the closing* from A15.
  - **Paths:** `art/inbox/A16/` (`reference/`, `bio/`, `review/`, `prompt.txt`). After each
    approval: pack, set manifest `status` to `final`, add a PROVENANCE line, typecheck, tests and the
    Chromium check named for that step.
- **E7 is open** (2026-11-26, Z104 done). Keys, all `env`, 2x, source px; stand-ins show the intended footprint. **Walls:** `wall_se_beam`, `wall_se_boarded`, `wall_sw_beam`, `wall_sw_boarded` 128 × 160, anchor (0.5, 0.8), faces exactly on `wall_se` / `wall_sw` (beam: a vertical post on the long face; boarded: weathered logs with a boarded patch). **Roof** (drawn on top of the `roof_top` tiles at roof height, all in the roof container that fades): `roof_ridge` 96 × 64, anchor (0.5, 0.75), one per tile along the ridge, drawn for a ridge running down-right (se) and joining its neighbours 32 × 16 world px apart; `roof_trim` 80 × 48, anchor (0.5, 0.5), one per tile edge, centred on the edge midpoint, also drawn running se. Code mirrors both (flipX) for sw runs, so keep them symmetric under that mirror apart from the run direction. `roof_chimney` 48 × 128, anchor (0.5, 0.9), foot on the roof surface. **Steps:** `house_steps` 96 × 64, anchor (0.5, 0.62), centred 0.7 tile outside the front door, the door's wall face on the sprite's upper-right side. **Furniture** (wall-side; code pushes each 0.3 tile toward its wall, which for all five is up-left or up-right on screen, so draw each centred and seen from the room): `furn_bed` 128 × 88 (0.5, 0.64), `furn_table` (table with chairs) 112 × 88 (0.5, 0.68), `furn_shelves` 80 × 160 (0.5, 0.88), `furn_cupboard` 96 × 160 (0.5, 0.85), `furn_woodpile` 96 × 80 (0.5, 0.7), `furn_rug` 160 × 80 (0.5, 0.5) flat, baked into the floor. All opaque; they block nothing and must not read as cover. Rules, paths and approval as in the E5–E7 item; first sample: the roof ridge on the Mission 1 house. A code test counts env keys, so keep the key names.
- **E6 is open** (2026-11-26, Z103 done). Keys, all `env`, 2x, source px, anchor (0.5, 0.93), trunk foot on the anchor: `tree_pine_a` / `tree_pine_b` 128 × 352, `tree_birch` 112 × 336, `tree_snag` 80 × 320. Opaque (code fades them to 40%), crowns narrow enough that ground shows between neighbours: the stand-ins show the intended silhouette. The same sprites form the border outside the map, where code fades them into mist; draw nothing extra for that. Rules, paths and approval as in the E5–E7 item; first sample: one tall pine in Mission 1 beside the old trees. A code test counts env keys, so keep the key names.
- **E5 is open** (2026-11-26, Z102 done). Keys, all `env`, 2x, source px, anchor x 0.5: `patch_dirt_a` / `patch_leaves_a` 256 × 128, `_b` 192 × 112, `_c` 320 × 144 (anchor y 0.5; irregular ragged edge, alpha 0 or 255, the art staying inside the cell's inscribed ellipse, which placement keeps off paths); `scatter_tuft_a` 40 × 32 and `_b` 48 × 36 (y 0.8); `scatter_fern_a` 64 × 44, `_b` 56 × 40 (y 0.75); `scatter_rocks` 56 × 36 (y 0.7); `scatter_branch` 80 × 32 (y 0.5); `scatter_mushrooms` 32 × 28 (y 0.75); `scatter_stump` 48 × 36 (y 0.7). `ground_path` is redrawn under its existing key. Patches draw over the ground, scatter over patches; all are baked once, never mirrored or rotated.
- **Visual pass E5–E7** (2026-11-26, grilled with the user; E7 **not open yet**). Rules:
  `art/STYLE.md` *Environment art* → *Visual pass*; rows in `PLAN.md`. Each batch opens when its code
  unit (Z102, Z103, Z104) has installed the manifest keys and grey stand-ins; I will mark it open here.
  Approval authority: the user, in the game, first the sample, then the batch. Match the approved
  E1–E4 art (palette, 2× source, alpha 0 or 255, overcast light, no cast shadows).
  - **E5 ground:** a new seamless `ground_path` (worn earth, no star motif), 6 patch decals (3 dirt,
    3 leaf litter, irregular, larger than a tile), 8 scatter pieces (2 tufts, 2 ferns, rocks, branch,
    mushrooms, low stump). Sample: one dirt decal on moss beside a survivor.
  - **E6 tall trees:** 2 pines, 1 birch, 1 dead snag, about 3.5× a survivor's height; E2 trees stay.
    Sample: one tall pine in Mission 1 beside the old trees.
  - **E7 house:** roof ridge + eave trim, chimney, 2 wall variants per direction, porch steps, 6
    wall-side furniture pieces (bed, shelves, table with chairs, cupboard, woodpile, rug). Sample: the ridge on
    the Mission 1 house.

## Taken from Codex
- K1 E2 woods brief (2026-11-25), done: the item *E2 woods* under *Requests for Codex* above.
