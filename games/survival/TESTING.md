# Survival testing

What is tested and how. Test list and rules: [DESIGN-slice.md](DESIGN-slice.md) `## Tests`; commands:
[DEVELOPMENT.md](DEVELOPMENT.md).

## Before finishing a task

`npm run typecheck && npm test`. Add `npm run e2e` when a scene, the HUD or the page changed.

## Simulation tests (`npm test`)

Node's test runner via tsx, `tests/**/*.test.ts`, no Phaser and no browser. They cover the map, people,
buildings, economy, orders, combat and waves; `tests/sim/occupancy.test.ts` checks that no two people stand
still on one tile (builders, deliverers, fleeing, group moves, drafts, woodcutters, a 3000-tick run);
`tests/sim/plaza.test.ts` checks that idle people sit on the plaza ring and get up for an order;
`tests/sim/fullstore.test.ts` checks a full store (orders win, free work, drops at a site, one toast);
`tests/sim/hunting.test.ts` checks wild game and hunting (herds, respawn, hits, loads, spotting, the hunt order). `tests/art/pack.test.ts` checks the atlas packer and the grey stand-ins (trim, extrude, no overlap, Phaser JSON, every stand-in passes the inbox validator and all pack within 16 pages; about 40 s). `tests/art/validate.test.ts` checks the art validator (`scripts/art/lib.mjs`): the real manifest, frame names, and a good and several broken sample inboxes. A test builds a state with `newGame(seed)` (helpers in
`tests/sim/helpers.ts`), calls `step(state, n)` and checks `state`. A fixed seed makes every run
identical, so a failing test can be replayed exactly. New rules get a test here, never in the browser.

## Browser smoke test (`npm run e2e`)

`tests/smoke.spec.ts`, Playwright 1.64 with desktop Chromium, configured in `playwright.config.ts`.
It starts its own Vite dev server on port 5184 (not the dev port 5174, so a running `npm run dev`
does not get in the way). It:

Sixteen tests. All open `/?debug` (the hooks `window.camp` in a run and `window.menu` on the menu: button
centres by name such as `slot1.new`, and the card texts; the canvas is scaled to fit, so clicks are
computed from the canvas box) and fail on any `pageerror` or console error.

1. **Menu to a run:** clicks **New camp** on slot 1, checks 20 people, runs `window.camp.step(3300)`
   and waits until the HUD shows the scouts' warning (`window.camp.banner()`, set by `Hud.ts`).
2. **Season:** the HUD text reads `Spring, day 1` and `Pemmican 0 / 100` at the start, and
   `Winter, day 1` after the test sets `window.camp.state.tick = 10800` (stepping that far would starve the camp).
3. **Saves:** new camp in slot 1, `step(1200)`, waits for `campfire.slot.1` in localStorage, reloads,
   checks the card shows `Day 2`, clicks **Continue**, checks the run is paused with 20 people.
4. **Upgrades in a building's panel:** the HUD reads `Gift 0`; `window.camp.selectBuilding(1)` (the council
   fire) lists `healers, warriors, builders, tools` (`window.camp.upgradeRows()`); the test adds a finished
   hunting lodge, selects it and sees `dogs, bows, scouts`, the dogs row saying `Missing: gift 4` and the
   scouts row `Needs Hunting dogs`; it sets `state.gift = 5`, clicks the real **Buy** button (position from
   `window.camp.upgradeBuy('dogs')`) and sees `Owned`, `upgrades = ['dogs']` and `Gift 1`.
5. **Tier 2 upgrades:** with a rich camp (`state.gift`, wood, hides set by the test) a `buy` order for
   `scouts` is refused and its row in the lodge's panel says `Needs Hunting dogs`; after `dogs` it is bought. The building cards
   (`window.camp.buildMenu()`: `visible`, `armed`, `page`, `shown`, `placing`) are hidden until adults are selected, B arms them,
   they open on `camp`, Tab switches to `societies` showing only `scouts_lodge`, Tab again returns. It saves two screenshots to `test-results/`.
6. **Wotakuye tooltip:** pauses with Space, hovers the Wotakuye bar and reads `window.camp.wotakuyeTip()`
   (`no bed`, `Gift tomorrow`, `Full meal`); moving away makes it `null`.
7. **Power bar:** F1 casts the spirit warriors, a click on the storm button starts aiming, a map click casts it
   and Esc cancels aiming (`window.camp.powers()`, `powerButton()`, `hoverTip()`).
8. **Resource icons and the open store:** `window.camp.hudBar()` lists the bar's parts: the first five lead
   with `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, then `icon_people` with the head count, and the bar ends before x 745.
   The pointer goes on the start store; `window.camp.storeOpen()` names it and how many items of each
   resource show (0, 20 and 40 each) for the store filled 0, half and full; moving away makes it `null`. Screenshots
   `r1-resource-bar.png` and `r2-store-*.png` go to `test-results/`.
9. **Right-click pings:** the sim is paused; `window.camp.lastPing()` (`kind`, `target`, running `count`) reads
   `move` on open ground, `work` on a tree, `refuse` for a child told to chop (toast `Nobody can chop there.`),
   `refuse` for an undrafted person told to attack a wolf (`Nobody is drafted.`), then `attack` once drafted.
   With nobody selected there is no ping. Screenshots `g5-ping-*.png` go to `test-results/`.
10. **Berry patch panel:** the sim is paused; a left-click on a berry bush makes `window.camp.panelText()` read
   `Berry patch` / `17 of 40 fruit left` (the bush is set to 17.6); Esc empties the panel's title.
11. **Hunt orders:** the sim is paused; a deer and a bison carcass are put in `state.animals`; a left-click on the deer
   reads `Deer` in the panel; with two adults selected a right-click on it gives `lastPing()` `work` / `animal` and, after
   `step(2)`, both have `job { kind: 'hunt', animal: 9100 }`; a right-click on the carcass gives `work` / `carcass`, and
   `selectAnimal(id)` reads `Bison carcass` / `30 meat and 3 hides left`. Screenshots `g12-*.png`.
12. **Music:** after the menu click `camp.music()` reads `ambient`, `on`, `started`; a wolf in `state.enemies` makes it `war`;
   with the wolf gone it is still `war` after `step(40)` and `ambient` after 12 more (the sim is paused and moved by `step`; the hold starts at the first frame with no wolf, so the test keeps clear of the exact 50);
   in the HUD menu the Music button (540, 434) toggles, `-` and `+` change the volume by 10%, and `localStorage`
   `survival.music` holds `{ on, volume }`. The pure rules are in `tests/music.test.ts`. Sound itself is not tested.

13. **Building cards:** nothing or only children selected: `visible` false, and B toasts `Select an adult who is not drafted to build.`;
   five adults selected: `visible` true (`g23-cards.png`), B arms (`armed`), `1` picks the first card (`placing`, `armed` false again,
   speed still 1x); a left-click on the map places the site, three of the five get the build job there and the other two do not,
   and `placing` ends; picking again and clearing the selection hides the cards and ends placing.

14. **Minimap:** `window.camp.minimap()` gives `rect` (192 x 96 on the HUD), `view` (the camera outline) and `counts`. With two people selected and the sim paused:
   a left-click moves the outline (north) and keeps the selection; a drag ends with the outline where the pointer ends; a right-click gives `lastPing()` `move`
   and both people `task.step` `walk`; while `scene.setPlacing('tipi')` is on, a left-click still moves the camera, a right-click sends no order, `placing` stays and no
   building is added. Screenshot `m5-minimap.png`. The pure maths is in `tests/minimap.test.ts`.

15. **Stand-in atlases (AC3):** opens `/?debug&standins`, starts a run and checks the `ground` and `buildings` textures hold the stand-in
   frames (`tile_grass/summer/0`), with no console errors. Skipped when `art/standins/atlas/ground.json` is missing (run `npm run art:standins`).
   `tests/art/frames.test.ts` checks that every key's default frame is one the delivery would contain.

16. **Terrain art (AC5):** without art the ground keeps its code drawings (trees drawn, no spills, stumps, bushes or props); with
   `?standins` spills, bushes and props appear, a grass tile beside the river shows `bank_river/spring/<mask>`, felling a tree leaves a stump
   and a season on switches every frame to summer. Screenshot `ac5-standins.png` (the river bank at zoom 1.5). The mask, spill, tree and
   prop maths is in `tests/terrain.test.ts`.

17. **Building art (AC6):** with `?standins` a hand-made site shows `stage1` / `stage2` / `stage3` by its build progress, a finished fire pit and the
   fire show `finished` and carry a flame (`fx_flame`), a three-piece barricade line shows masks 4, 5 and 1, the drying rack loops, and at tick 10800
   everything finished switches to `winter` (the barricade `winter/5`); normal mode now checks the installed AB6 flame on the council fire. Screenshot `ac6-standins.png`. The stage, mask
   and loop maths is in `tests/art/buildingArt.test.ts` (every key and state names a frame the delivery would contain).

18. **Creature art (AC7):** normal mode checks that unfinished animals keep their code drawings, while AB6 spirits, storms and small effects use final art. With `?standins`:
   game grazes or walks, a wolf and the pack leader run in, a hit raises dust, a killed wolf plays `die`; a deer killed by hand plays `die`, lies as
   `carcass_deer/stage1/00` and, emptied, leaves `stage3` bones; a storm (`fx_storm/loop`), a stampede (seven `animal_bison/base/run/se`), a spirit
   (`ally_spirit/float`) and a guardian wolf; a drafted mounted lancer is `person_rider` and gallops to a move order; two free horses stand in a
   finished corral; finishing a trap sparkles. Screenshot `ac7-standins.png`. The picks are in `tests/art/creatureArt.test.ts` (every pick names a
   frame the delivery would contain). Arrow sprites are not in the e2e case (unit-checked frame names only).

   AB6 installed-art check: `node art/source/AB6-r1/install-check.mjs` writes captures and checks to
   `test-results/ab6-installed/` at both screen sizes and zoom 0.5/1/2. It exercises flying/stuck arrows,
   spirits, storms, flames and hit/dust/completion effects, and samples the placeholder hearth textures
   to confirm their static flames are absent beneath the animated art. Run after e2e, which clears test-results.

On Windows the config passes ANGLE/Direct3D flags so headless Chromium uses the GPU; elsewhere the
defaults apply. The first run may need `npx playwright install chromium`.

AB8 installed-art check: `node art/source/AB8-r1/install-check.mjs` writes captures and checks to
`test-results/ab8-installed/` at both screen sizes and zoom 0.5/1/2. It uses real pointer drags
for L/T barricades, checks construction stages, winter and separate fire-pit flames, and captures
a 20-piece winter barricade line at zoom 0.5. Run after e2e, which clears test-results.

AB9 installed-art check: `node art/source/AB9-r2/install-check.mjs` writes captures and checks to
`test-results/ab9-installed/` at both screen sizes and zoom 0.5/1/2. It checks all four buildings'
construction stages and winter frames, plus all four summer/winter drying-rack sway frames.
It sleeps the continuous loop and advances controlled renderer frames; it does not measure performance.
Use `--reuse-captures` only to resume captures against the same unchanged art revision.
Run after e2e, which clears test-results.

AB2 installed-art check: `node art/source/AB2-r2/install-check.mjs` writes captures and checks to
`test-results/ab2-installed/` at 1280x720 / 2560x1440 and world zoom 0.5/1/2. It checks all 57
installed keys, normal/high-resolution cursor CSS and all five hotspots, the undraft state and
the dogs upgrade row. Captures show menu, HUD, selection, orders and upgrades. It sleeps the
continuous loop and advances controlled renderer frames; it does not measure performance.
Run after e2e, or give e2e a separate `--output` subfolder to preserve the captures.

## Checking by hand

Not covered by tests, so check in the browser (`npm run dev`) when touching them: mouse-edge and WASD
pan, shift-click, Delete on a site, 1-3 and Space, the pause / speed buttons, wolves and fighting, the
end screen and **Play again** (returns to the menu), and the file pickers: **Export** and **Import** on
the slot cards (downloads and the picker are not in the smoke test), the HUD **Menu** panel, the **Upgrades** panel's real Buy button, placing a healers' lodge and watching a healer treat someone, placing a trap or fire pit by hand and watching wolves meet it, a scout staffing the lodge for the early warning, a lancer or archer drafted from their lodge, the minimap at real size (dragging it while a wave is out, right-clicking a far spot), a horse corral breeding, a rider, the bison lane's reticle and a real cast of each power with wolves about, wolves meeting a barricade line, a full store (gatherers waiting at their bushes, the `Store is full` toast, a blocked person building), music (listen: the flute and heartbeat, the war drum and drone, a 2 s crossfade, the 5 s hold, silence when off), wild game at real size (deer fleeing, a hunter with a load on their back, a carcass shrinking over three trips), and **Delete**'s
Yes / No, the building cards on a real panel (5 adults place a tipi: 3 build, 2 keep working; a children-only selection shows no cards; a barricade
line dragged with a few builders, and the builders going on to the next segment when one is done). A throwaway Playwright script with `acceptDownloads` and `filechooser` checked these on 2026-11-19.

## Publish check

`npm run publish` builds and writes `index.html` and `build/` in this folder. Check that both exist
and that the page loads from a static server. Commit them only when the user asks, and never push
without an explicit request (the site deploys when `main` is pushed).
22. **Interface art (AC8 / AB2):** normal mode uses installed nine-slice speed buttons and five painted cursors; selecting a person changes the cursor to
    `move` (CSS holds an `image-set`). The separate `?standins` case checks the same surfaces and selection behaviour and is skipped when
    `art/standins/atlas/ui.json` is missing. Unit tests in `tests/art/ui.test.ts` cover surface frames, cursor choice, hotspots and CSS.
    AB2's installed-art check above verifies both cursor resolutions and all hotspots; visual cursor appearance while moving a real mouse remains a hand check.

## Installed AB3 terrain

Run `node art/source/AB3-r4/install-check.mjs` after `npm run e2e` (Playwright clears test-results on startup). It checks the installed ground atlas and manifest, all 80 frames, four seasons, zoom 0.5/1/2 at 1280x720 and 2560x1440, terrain scale/origin/chunks and browser errors. Captures in `test-results/ab3-installed/` include river/ford views at 1x and 2x. Controlled renderer frames verify appearance, not performance or manual play. Delivery hashes in `art/source/AB3-r4/install-hashes.json` verify the unchanged archive `art/inbox/done/AB3-r4/`.

## Installed AB5 plants and goods

After the e2e run, run `node art/source/AB5-r2/install-check.mjs`. The installed-art check covers all 80 atlas frames, four seasons, zoom 0.5/1/2, 1280x720 and 2560x1440, every seasonal key/variant, normal stump creation, and empty/half/full store goods through pointer hover. Captures in `test-results/ab5-installed/` include oak and basswood on the installed AB3 terrain. Controlled frames check appearance, not performance or manual play. The unchanged approved delivery is archived at `art/inbox/done/AB5-r2/`; `art/source/AB5-r2/install-hashes.json` records every file hash.

## Installed AB4 banks and spills

After e2e, run `node art/source/AB4-r1/install-check.mjs`. It checks all 92 installed frames,
normal ground-atlas textures, banks and both spill keys, four seasons, zoom 0.5/1/2 and
1280x720 / 2560x1440, with no browser errors. Captures in `test-results/ab4-installed/`
include ford-bank joins at 1x/2x and both directional spill types. Controlled renderer frames
check appearance, not performance or manual play. Delivery hashes in
`art/source/AB4-r1/install-hashes.json` verify `art/inbox/done/AB4-r1/` unchanged.
The thin river-blue lip beside pale fords is reported to Claude in K21 for a decision.

AB10 installed-art check: `node art/source/AB10-r2/install-check.mjs` writes captures and checks to
`test-results/ab10-installed/` at 1280x720 / 2560x1440 and zoom 0.5/1/2. It checks the five society
lodges in all three construction stages, finished summer and winter, normal atlas texture,
scale/origin and all 146 building frames across two pages. Controlled renderer frames check
appearance, not performance or a manual construction playthrough. Run after e2e, which clears test-results.


## Installed AB11 plaza and store

Run `node art/source/AB11-r3/install-check.mjs` after e2e (which clears test-results).
It verifies eight approved AB11 frames among all 154 installed building frames, all
construction stages, summer/winter, zoom 0.5/1/2 at 1280x720 and 2560x1440, normal
textures/scale/origins, the centred hearth flame and pointer hover into/out of the
store with empty/half/full resource piles. Captures and assertions are written to
`test-results/ab11-installed/`. Controlled debug states check rendering, not performance
or a manual construction playthrough. `art/source/AB11-r3/install-hashes.json` records
all 61 unchanged delivery files archived in `art/inbox/done/AB11-r3/`.


## Installed AB13 man animations

Run `node art/source/AB13-r2/install-check.mjs` after e2e (which clears test-results).
It verifies the approved immutable delivery hashes, all 1,408 installed frames,
normal man selection, atlas texture, scale and origin, every animation/facing/frame
in both family tints, and zoom 0.5/1/2 at 1280x720 and 2560x1440.
Captures and assertions go to `test-results/ab13-installed/`. The frame sweep uses
controlled renderer states; it does not constitute a manual gameplay or performance test.
The approved delivery is archived at `art/inbox/done/AB13-r2/`; its file hashes are
in `art/source/AB13-r2/install-hashes.json`.


## Installed AB14 woman animations

Run `node art/source/AB14-r2/install-check.mjs` after e2e (which clears test-results).
It verifies approved delivery hashes, all 1,408 installed frames, normal woman selection,
atlas texture, scale/origin, every animation/facing/frame in both family tints,
and zoom 0.5/1/2 at 1280x720 and 2560x1440. Captures and assertions go to
`test-results/ab14-installed/`. Controlled renderer states check appearance, not manual
play or performance. The approved delivery is archived at `art/inbox/done/AB14-r2/`;
its hashes are in `art/source/AB14-r2/install-hashes.json`.

## Elder-man art (AB15)

Run `node art/source/AB15-r1/install-check.mjs` after e2e (which clears test-results).
It verifies the approved delivery hashes, all 928 installed frames, normal elder-male
selection, texture, scale and origin, base/cloth alignment, both family tints and all
464 frame pairs at 1280x720 and 2560x1440. Captures cover ten actions at zoom 0.5/1/2
and an action overview in `test-results/ab15-installed/`. Controlled renderer states
check appearance, not manual gameplay or performance; fish/dance remain art previews.
The unchanged delivery is archived at `art/inbox/done/AB15-r1/`; hashes are in
`art/source/AB15-r1/install-hashes.json`.

## Elder-woman art (AB16)

Run `node art/source/AB16-r1/install-check.mjs` after e2e (which clears test-results).
It verifies approved delivery hashes, all 928 installed frames, normal elder-female
selection, texture, scale and origin, base/cloth alignment, both family tints and all
464 frame pairs at 1280x720 and 2560x1440. Captures cover ten actions at zoom 0.5/1/2
and an action overview in `test-results/ab16-installed/`. Controlled renderer states
check appearance, not manual gameplay or performance; fish/dance remain art previews.
The unchanged delivery is archived at `art/inbox/done/AB16-r1/`; hashes are in
`art/source/AB16-r1/install-hashes.json`.
