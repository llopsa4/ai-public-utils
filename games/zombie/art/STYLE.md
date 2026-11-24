# Dead Woods art direction

Owner of the art pipeline: Codex (generation, delivery, installation). Claude writes prompts and
reviews; **Claude never draws** (DESIGN §9). The art spec for batch 1 is below (*Art spec*).

## Settled so far

- **View:** isometric 2:1, 64 × 32 diamond tiles, one fixed view (no rotation), so every sprite is
  drawn for a single camera angle.
- **2D only (user, 2026-11-22):** flat 2D PNG sprites. No 3D models, no Blender, no render step.
- **Facings:** characters have 4 facings (SE, SW, NE, NW). Draw only **SE and NE**; code mirrors
  them horizontally for SW and NW. Vision cones, drawn by code, carry the exact facing.
- **Frames:** characters 1 idle frame (standing) plus 4-frame loops per drawn facing for **walk**,
  **run**, **crouch walk** and **crawl** (four separate movement states, user, 2026-11-22; what run
  and crawl do in play: DESIGN §14); props, trees, tent, fire,
  crates, bodies and decals 1 frame each (more only if the art spec asks).
- **Mood:** grounded, serious survival in damp northern woods and abandoned rural buildings;
  muted, desaturated palette.
- **Gore:** mature and visible (DESIGN §6): blood decals and bodies that stay. Zombies show decay and
  wounds.
- **Readability first:** vision cones, noise rings, selection and interactables must stay readable
  over the art; cones are drawn by code, not painted.

## Art spec (user, 2026-11-23; re-checked the same day)

- **Render style:** pixel art. Crisp pixels, no anti-aliased painting, no soft gradients.
- **Palette:** one shared hard palette of about 32 muted colours for every sprite, portrait and decal,
  kept as a swatch file in `art/`; Codex snaps every image to it. Code-drawn overlays (cones, noise
  rings, selection, sight circles) are not part of it.
- **Lighting:** overcast daylight, even across all maps; no night pass. Mood comes from palette and
  props.
- **Scale:** a standing survivor is about **48 px** tall (three-quarters of a tile's width), shorter
  than the 64 px walls (with door headroom) and the 72 px trees. Zombies match survivor height.
  *Corrects the first answer (1.5 tiles, 80–96 px), which would have put people above the walls.*
- **Character resolution (user-approved 2026-11-23, after the Eli trial):** all survivor and zombie
  animation sprites use **2× pixel resolution at the same in-game size**. Author or sample detailed
  source artwork into **128 × 128 px** transparent, untrimmed cells and render at **0.5 scale**.
  Cass is **96 source px** tall (48 world px); Eli is **100 source px** tall (50 world px).
  Double the source-pixel dimensions of every pose, including crouch, crawl, actions and death,
  while preserving its world dimensions. The feet anchor is **(64, 112)**, normalised
  **(0.5, 0.875)**. Keep the shared palette, crisp pixels and mirror rule. Use the added resolution
  for real detail from the source artwork; simply enlarging a finished 1× sprite does not meet
  this rule. This applies to character animation sprites; portraits and environment art retain
  their separate specifications.
- **Mirror rule for every figure:** survivors (`DESIGN-characters.md`) and zombies. Wounds, tears and
  blood sit on the centre line or in matched pairs, so mirroring SE → SW and NE → NW does not move
  them. Held weapons swap hands when mirrored; that is accepted. **Exception (user, 2026-11-24):**
  zombie poses and gait are one-sided (limp, head loll, dropped shoulder); the bad side swaps when
  mirrored, and that is accepted. Their wounds and decay damage still follow the rule.
- **Zombie decay:** three decay levels (fresh, decayed, rotting), each with its own full animation set;
  the game picks one per zombie.
- **Zombie crowd (user, 2026-11-24):** a mixed crowd of **three bodies per decay level**, `a`, `b`, `c`,
  all 2x (128 px cells, 96 source px tall, anchor (64,112)). Fresh bodies are ordinary rural people in
  muted everyday clothes, each clearly different in build, clothing and silhouette so the three read
  apart at game size; decayed and rotting later wear down the same three bodies (same clothes and
  build, same letter). The game picks decay and body per zombie from its id, among the keys whose
  status is `final` (so with only fresh art drawn, the crowd is fresh a, b and c). One 2x atlas per
  decay level: `zombies_fresh`, `zombies_decayed`, `zombies_rotting` (156 frames each).
  **Decay looks (user, 2026-11-24):** fresh = recently turned (pale grey skin, dark paired veins at the temples and neck, clouded eyes, slack open mouth with blood, clothes torn in matched places); decayed and rotting are
  much grimmer, in the general manner of classic survival-horror zombies (no design copied from any
  game): decayed = torn-open skin, exposed muscle at both forearms, ribs through a shredded shirt,
  rags; rotting = near-skeletal face (teeth and jaw, sunken sockets), bone at both forearms and shins,
  clothes in strips. All symmetric (mirror rule), no missing limbs. Decay is looks only (no stat change).
  **Reach:** every zombie key has a `reach` walk (shamble legs, both arms raised forward), played
  when a walking zombie that is not chasing is within 2 tiles of its target (DESIGN §7).
  **Limp (user, 2026-11-24):** every zombie limps and stands lopsided, each body its own way and the
  same at every decay level: `a` drags his right foot on its toe, `b` swings a stiff left knee out
  sideways, `c` steps on a turned-in ankle with his upper body jerking forward. Idle stands lopsided;
  `shamble`, `reach` and `lurch` limp over 6 frames. Looks only.
- **Survivor frames per drawn facing:** idle 1; walk, run, crouch walk, crawl 4 each; Hold pose 1;
  work loop 2 (fix, cook, traps); death 4; **pistol shot 3 for every survivor** (aim, fire, recoil;
  two-handed grip, arms out, centred; 2026-11-23). Fighter adds knife stab 3, takedown 4, carry-body
  walk 4. Scout adds club swing 3, lure throw 3. Each later survivor adds their own melee anim.
- **Zombie frames per drawn facing, per variant:** idle 1; shamble 6 (wander and investigate, played
  faster to investigate); reach 6; chase lurch 6; bite 3; death 4, ending on the body sprite.
- **Drawing rules for every figure (from the batch briefs C1–C9, 2026-11-24):**
  - *Readability:* the ground is dark grey-green `#4b4f49` under overcast light; keep a clear
    silhouette and no pure-black blob; face and hands must read at game size. Paint no cones, rings,
    selection or ground shadow (code draws them). No red outside blood pixels, no saturated colour.
    Zombies stay apart from survivors by colour: Cass charcoal and olive, Eli blue-grey and navy,
    zombies paler skin with browns, faded olives and washed-out colours.
  - *Loops:* draw each loop from one base pose and move only the limbs, so it reads as one figure
    moving. Standing frames keep the idle's height; the stride bob is at most 2 px at 1× (4 px at 2×).
    `reach` keeps the `shamble` legs frame for frame; only arms and head change. Feet rest on the
    anchor row (soles, or knees, belly or back when kneeling, prone or dead), so swaps do not jitter.
  - *Held items:* the knife is a short combat knife (dark matte blade, at most one edge pixel, dark
    grip); the club is a short plain wooden club about 14 px long, no spikes, nails or blood; no
    shine streaks or motion blur (show speed by pose). Handedness: knife and club sit in the figure's
    right hand, and the knife's thigh sheath is then empty. The club is never stowed on the body (it
    would break the mirror rule). A holstered pistol stays holstered in every frame except the shot.
    The lure is only a 2-3 px `#818d91` cluster in the hand and in flight.
  - *Takedown and carry:* draw only the survivor; the victim is its own sprite. In `takedown` the
    hands grip empty space where the head would be (one tile ahead, head height). In `carry` the body
    is part of the frame: an adult-sized limp figure with no recognisable zombie detail.
  - *Death:* the last frame lies flat along the screen diagonal of the facing, centred on the anchor,
    and holds while the scene swaps in the body sprite: survivors inside rows 36-60 and columns 4-60 of
    the 64 px cell, zombies inside rows 72-120 and columns 8-120 of the 128 px cell (double the survivor
    box on a 2× sheet). A survivor's death shows a little centred blood in the last two frames; a fresh
    zombie shows a little more.
  - *Staging:* a new figure hands back its idle SE and NE first, previewed in the game beside the
    approved figures; the user approves the look before any other frame, then the full set is
    previewed and approved before installation. Installation is byte-identical to the approved
    preview; the manifest `status` becomes `final` in the same change.
  - *Portraits:* plain dark background, no frame (the kit frames them); the hurt mood is bloodied,
    pale and wincing; the small heads are hand-pixelled, not downscaled.
- **Portraits:** head-and-shoulders pixel-art busts on the shared palette, at the game's gore level.
  Superseded in size by *UI art* below (128 px large in four moods, 36 px small heads).
- **Delivery:** packed PNG atlases with a JSON frame map per sheet; `manifest.json` keys map to
  frames.
- **Batches:** batch 1 is characters only: Fighter (Cass), then Scout (Eli), then the zombie variants,
  one character at a time, each approved before the next is drawn. Base props, portraits and ground
  tiles come in later batches; ground stays a placeholder until then.

## UI art (user, 2026-11-24)

- **Order:** UI before environment art. Batches after A5: **A8** UI kit, **A9** icons + cursors
  (replaces A6), **A10** portraits, **A11** title. Each has a first-sample gate in the game. Claude
  builds the slots first (Z53 contract and stand-ins, Z54 scenes).
- **Look: "worn field kit":** dark weathered panels (scuffed canvas, worn chipped metal, stitched or
  riveted edges), Special Elite text drawn by code, small painted icons with a dark outline, sparse
  blood-red accents for danger only. Crisp pixel art on `art/palette.json`, alpha 0 or 255.
- **Resolution:** UI art is drawn at 2x and shown at half size, except cursors (1x, 32x32) and the
  title art (640x360 at 1x, shown 2x).
- **Kit (9-slice):** panel, button normal / hover / pressed / disabled / active, card, tooltip,
  slider track (3-slice) and knob, checkbox off / on. Code stretches them to every size.
- **Icons:** 16 action-bar icons at 48 px (Knife, Gun, Club, Takedown, Carry, Lure, Hold, Free fire,
  Crouch, Eat, Give, Fix, Cook, Barricade, Spike pit, Noise can); the bar shows the icon, the bound
  key in a corner, the ammo count as a number, the name as a tooltip; active = lit frame, disabled =
  greyed by code. 8 HUD icons at 24 px beside the numbers (food, scrap, ammo, hunger, zombie, herd,
  crate, HP). No painted words except the title logo.
- **Portraits:** Cass and Eli, 128 px, moods neutral, afraid, determined, hurt (dialogue box);
  hand-pixelled 36 px small heads, neutral and hurt (squad card).
- **Title:** dark woods at dusk with distant zombie silhouettes and no playable survivors, so the
  composition works as the roster grows. Keep the centre-left calm for the menu. The title uses a
  worn stencil/typewriter "Dead Woods" logo. The same background is dimmed behind the pause menu.
- **Contract (Z53, 2026-11-24):** machine-readable in `art/manifest.json` `ui`; the manifest wins.
  Every item is one PNG, `art/inbox/<batch>/ui/<item>.png` (flat, no key folder), at its exact
  **source** size; display size = source / group scale. Same palette rule as the figures (alpha 0 or 255,
  `art/palette.json` only). `npm run art:standins` writes grey stand-ins (a 9-slice piece is dark, unlabelled, and shows a
  darker band as wide as its insets; each button state has its own grey; other items carry their name); `npm run art:pack -- <batch>` validates, installs into
  `art/frames/ui/` and rebuilds `art/atlas/ui.png` + `ui.json` (texture `ui`, frame = item name; shelf-packed,
  2048 px wide). Cursors and the two title images are **not** in the atlas (CSS cursors and plain
  images), they stay files in `art/frames/ui/`. Codex sets an item's `status` to `final` in the manifest
  when it installs real art; the game uses stand-ins for nothing the player sees until then.

  | Group | Items (source px, group scale) |
  | --- | --- |
  | `kit` (2x) | `kit_panel` 96 (insets 12), `kit_button_normal/hover/pressed/disabled/active` 96 (10), `kit_card` 96 (8), `kit_tooltip` 64 (6), `kit_slider_track` 128x24 (ends 6, 3-slice), `kit_slider_knob` 32x40, `kit_check_off/on` 40 |
  | `icon_bar` (2x) | `icon_bar_<id>` 96: knife gun club takedown carry lure hold freefire crouch eat give fix cook barricade spike can |
  | `icon_hud` (2x) | `icon_hud_<id>` 48: food scrap ammo hunger zombie herd crate hp |
  | `portrait` (2x) | `portrait_<fighter\|scout>_<neutral\|afraid\|determined\|hurt>` 256 |
  | `portrait_small` (2x) | `portrait_small_<fighter\|scout>_<neutral\|hurt>` 72 |
  | `cursor` (1x) | `cursor_select/attack/use/move/run` 32, hot spots in the manifest (select (6,3), the rest centre (16,16)): Codex may move them to fit its drawing |
  | `title` (1x) | `title_bg` 640x360, `title_logo` 400x120 |

  Code reads it through `src/render/ui.ts` (key lookup, `isFinal`, `nineSlice` geometry, cursor CSS).

## Atlas contract (batch 1 figures; Z22, 2026-11-23)

Current machine implementation: `art/manifest.json` v2 `figures` and `atlases`. Cells come in two
resolutions, set **per atlas** by `atlases.<group>.scale` (Z49, 2026-11-24): `1` (default) is the
64 × 64 cell below; `2` is the *Character resolution* cell, **128 × 128** with the feet anchor at
**(64, 112)**. The anchor fraction (0.5, 0.875) is the same for both, and the game draws a 2× sheet at
0.5 scale, so a figure keeps its world size. Every shipped figure sheet is `2`; a new sheet starts at
`1` with grey stand-ins, and whoever installs its 2× art sets `scale: 2` in the same change. The
sizes quoted below (64 × 64, feet (32, 56)) are the 1× values; double them on a 2× sheet. For the
current pipeline's technical behaviour, the manifest wins. Applies to survivors and zombies only;
props, tiles and decals keep their one-image `keys` entries.

- **Figure keys:** `fighter`, `scout`, and nine zombie keys `zombie_<decay>_<body>`: decay `fresh`,
  `decayed`, `rotting` x body `a`, `b`, `c` (a mixed crowd, user 2026-11-24; see *Zombie crowd*).
- **Facings in files:** only `se` and `ne`. Code mirrors them into SW and NW at draw time, so a
  `sw` or `nw` file is rejected.
- **Frame name:** `<key>_<anim>_<facing>_<n>`, `n` from 0, single-frame anims included
  (`fighter_idle_se_0`, `fighter_walk_se_3`, `zombie_fresh_b_lurch_ne_2`).
- **Anims and frame counts** (per facing; names are the `<anim>` part):

  | Figure | Anims |
  | --- | --- |
  | Survivors (both) | `idle` 1, `walk` 4, `run` 4, `crouch` 4 (crouch walk), `crawl` 4, `hold` 1, `work` 2 (fix, cook, traps), `death` 4 |
  | `fighter` adds | `stab` 3, `takedown` 4, `carry` 4 (carry-body walk) |
  | `scout` adds | `shot` 3, `club` 3, `throw` 3 |
  | each `zombie_<decay>_<body>` | `idle` 1, `shamble` 6 (limping walk, wander and investigate; the game plays it faster to investigate), `reach` 6 (shamble with both arms forward, near the target), `lurch` 6 (limping chase), `bite` 3, `death` 4 |

  That is 35 frames per facing for `fighter`, 33 for `scout`, 26 for each zombie key (a decay + body). The last
  `death` frame matches the `body` sprite.
- **Cell:** every frame is **64 × 64 px** (1× sheet; **128 × 128** on a 2× sheet), transparent,
  untrimmed (a 48 px figure leaves room for arms, weapons and the carried body). **Feet anchor** is
  pixel (32, 56) (2×: (64, 112)), that is anchor (0.5, 0.875): the point on the tile the figure stands on. Draw every frame in its own cell; do not
  shift a frame to centre it.
- **Inbox:** `art/inbox/<batch>/<key>/<anim>_<facing>_<n>.png` (for example
  `art/inbox/A1/fighter/idle_se_0.png`), exact 64 × 64, PNG with alpha, only colours of the
  shared palette. A batch may hold any subset of a figure's frames.
- **Installed frames:** `npm run art:pack -- <batch>` validates a batch (missing key folder, bad name,
  unknown anim, frame index out of range, wrong size, `sw`/`nw`, off-palette colour all fail with the
  file named), copies it into `art/frames/<key>/` under the same file names (replacing any frame of
  the same name, stand-ins included), then rebuilds the atlases from `art/frames/`.
- **Atlases:** Phaser JSON-hash, `art/atlas/<group>.png` + `art/atlas/<group>.json`, one group per
  approval unit: `fighter`, `scout`, `zombies_fresh`, `zombies_decayed`, `zombies_rotting` (three bodies each). The texture key is the group
  name; frame names are the names above. Frames are not trimmed, so the JSON `frame` rectangles are
  all 64 × 64 (128 × 128 on a 2× sheet). Re-running `npm run art:standins` or packing after a sheet's `scale` changes redraws its leftover stand-ins at the new size; a frame of the wrong size fails the pack with the file named.
- **Status:** a figure's manifest `status` stays `placeholder` while any of its frames is a grey
  stand-in (`npm run art:standins`, Z23) and becomes `final` when all are real art (Codex sets it in
  the same change that installs the last frames).
- **Anim data:** frame rates, loops and which sim state plays which anim live in `data/anims.json`
  (Z25), not here.

## Placeholders (now)

Flat grey geometric stand-ins drawn in code from `art/manifest.json` `placeholder` blocks (diamond,
capsule, box, ring) with a short text label where needed. Functional colours only: cones red /
yellow / green, blood dark red. See [DEVELOPMENT.md](../DEVELOPMENT.md#art-placeholders).
