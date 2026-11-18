# The Rift: Ashlands style bible

Visual conventions shared by every asset. Assignments and delivery steps are in [PIPELINE.md](PIPELINE.md); per-asset briefs record measured contracts and explicit exceptions.

## The master reference

**`tent-reference.png`** (in `adventure/`, also in the game as Mara's tent) is the look to match. Study it before anything else.
- **Pixel art:** detailed, hand-placed pixels, readable shapes, clean edges. No blur, no soft anti-aliased haze around shapes, no painterly smear.
- **Lived-in:** worn materials and mended things: canvas with patches and stitched seams, scuffed wood with grain and iron corner plates, brass, glazed clay, soot and ash.
- **Warm and close:** where people live; colder and quieter in the tunnels and outside.

## Staging: flat 2D

- **Flat-on, like a stage set:** no perspective, no vanishing point. The camera looks straight at the back wall at eye level. Side walls are not visible, and the floor is seen only as a band.
- **The back wall meets the floor at y = 524** (art pixels; the room is 1280×720). People walk in a floor band from **y 536 to y 690**. They move left and right and a little forward and back, and **never get bigger or smaller**.
- **Things stand on the floor line** (furniture against the back wall) **or hang on the wall above it.** Nothing big stands in the middle of the floor band unless the room's layout image shows it.
- **Exits:** at the left and right edges of the picture (an archway, a curtain, a door seen flat-on), or **stairs** going up or down out of the frame. Never two doors side by side.
- **Each room's layout image, `art/spec/<room>.jpg`,** shows exactly where everything is: the band (green), each clickable thing (yellow, purple for secrets), objects drawn separately (orange box at true size), and Mara at true size (pink) at each entry. Paint the room to fit it.

## Proportions

Everything is in true proportion to the people in the scene: Mara in his chapters, Silas (220 art pixels) in the intro, Kofi in his. Art prompts state the size of every real-world object against that character ([generation prompts](PIPELINE.md#generation-prompts)). A chair seat is at his knee, a table at his hip, a doorway well over his head. Heights below are in art pixels at 1280×720; see `art/style/scale.png`.

| What | Height (art px) | On its pixel grid |
| --- | --- | --- |
| Mara | 232 | 116 |
| Other adults | 206–226 (Bryn 224, and broad) | 103–113 |
| Children | 146–150 | 73–75 |
| A doorway | about 1.4× Mara, ≈ 328 | 164 |
| A bench or table top | ≈ 104 | 52 |
| A chair seat or stool | 48–52 | 24–26 |
| A cot (top of the mattress) | ≈ 44 | 22 |
| A crate | ≈ 48 | 24 |
| A water jar | ≈ 56 | 28 |
| A lantern | ≈ 32 | 16 |

## The pixel grid

- **Character detail (every approved character):** people (Mara, Silas, Sigrid, the guard and warden, Oren, Nell, Tobi, Bryn and the seven human extras) are built on a **1-art-pixel grid** with the master palette normalized the way Mara's layered renderer does it, to keep more of the approved source drawings. Heights, source scale, anchors, frame contract, the two-art-pixel outline, walk stride and portraits are unchanged: Mara is still 232 art pixels / 116 world pixels tall, the guard 216, Bryn 224. Standing, walking, kneeling, lying and sitting frames share the finer sampling. In `art/manifest.mjs` / `art/rig.mjs` a character opts in with `detail: { grid: 1, palette: 'master' }` (the extras share it); a character without it is a legacy placeholder and keeps the 2-pixel grid until it is redrawn. Bryn is no longer a placeholder.
- **Scene detail matches the characters (rule for new and replaced art):** every drawing in a scene (rooms, objects, props, foreground cut-outs, creatures and fight pictures) uses the same pixel definition as Silas: a **1-art-pixel grid** with the master palette, so the scenery is as fine as the people standing in it. A prompt for scene art states this ([generation prompts](PIPELINE.md#generation-prompts)), and a delivery is checked side by side with Silas (or the scene's main character) at the same scale. This rule does not by itself authorise regenerating existing art.
- **Legacy 2-pixel art:** scene art made before that rule is pixel art on a **2-pixel grid** (a 1280×720 room is a 640×360 picture shown 2×, Mara 116 of its pixels tall). It stays until it is replaced; an audit lists it as not yet matching the rule. The "On its pixel grid" column above counts those 2-pixel units; a person's art-pixel height is the real height at either grid.
- **Source drawings may use these sizes:**
  - rooms at 16:9, 1280×720 or larger
  - characters on 1024×1536
  - objects at any size in their proportions

  The importer (or, for people, the rig) reduces each to the grid. So draw with **big, clear shapes and flat colour areas** that survive being reduced. A person is about 116 pixels tall in the end; their face is only a dozen pixels, so give each a clear, distinctive head: hair shape, headwear, beard, colours.
- **Satchel items, action icons, cards and gear pictures keep a finer grid** (their own sizes below); they are shown up close.

## Colour

- **The master palette:** `art/style/palette.json`, 160 colours, previewed in `art/style/palette.png`. It is derived from the tent reference. Paint with it in mind; the importer snaps every pixel to it.
- **Soft light effects** (a glow, the doorway light on the cell floor, `intro/objects/stairs-light.png`) can't be palette art. They are made in code or as soft PNGs listed with `status: 'placeholder'` and a note, so the palette check passes. They are not paintings to replace.
- **Warm range:** ochre, rust, brass, ember orange, clay, warm browns. **Cool range:** soot greys, iron blue-greys, the occasional cold blue in shadow.

## Light

- **Paint rooms evenly lit.** Show the light sources (lamps, fires, a doorway) as things in the room, but do not paint glow pools, light shafts, haze or particles: the game adds the light, the flicker and the cold-kiln change. Soft ambient shading (darker under things, in corners and at the top of the vault) is fine.
- **People and objects are evenly lit** with soft form shading and no strong cast light; the game lights them to match each room.
- **The tent reference** has its light painted in: it is the exception (it came first).

## Formats

File formats below describe the legacy/default assets. Follow the measured brief for exceptions; use [PIPELINE.md](PIPELINE.md) for delivery and installation.

| Kind | File | Background | Size |
| --- | --- | --- | --- |
| Room | `<id>.png` | opaque, no people | 16:9, at least 1280×720 |
| Object | `<id>-<state>.png`, one per state | transparent or magenta | any, in the brief's proportions; standing on its bottom edge |
| Character | folder `<id>/` with `body.png`, `arm.png`, `kneel.png` and `lie.png` (all required; `sit.png` too for background people who sit) | transparent or magenta | 1024×1536, the same canvas; `lie.png` 1536×1024 |
| Prop, creature | `<id>.png` | transparent or magenta | any; standing on (or hanging from) the edge the brief says |
| Fight picture | `<id>.png` | transparent or magenta (backdrops opaque) | as the brief says |
| Item | `<id>.png` | transparent or magenta | 64×64 |
| Icon | `<id>.png` | transparent or magenta | 48×48 |
| Card | `<id>.png` | opaque | 256×256 |
| Gear | `<id>.png` | transparent or magenta | 320×320 |

- **Transparency:** if you cannot make a transparent PNG, use a **flat pure magenta (#FF00FF)** background; the importer removes it. Never use magenta in the subject itself.
- **No text** in any picture (signs, plates and labels are blank or the game draws them), and no people in rooms.

## Character source appearance

The following describes the legacy/default source drawing. Layered rigs and separately drawn
directions follow [LAYERED-RIG.md](LAYERED-RIG.md) and their own source metadata.


The game animates a character from **one drawing** (a cut-out rig: legs bend at hips and knees, the working arm turns, the eyes blink, the mouth moves), so every frame matches. Draw a character as:
- **One full-body figure** facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both clearly visible.
- **On a 1024×1536 transparent canvas:** feet on y ≈ 1500, head top at y ≈ 40 for an adult (a child about 63% as tall, feet on the same line).
- **As layers of the same size:**
  - `body.png`: everything except the working arm
  - `arm.png`: the working arm (Mara's gauntlet arm), with a little overlap at the shoulder
- **The face:** lit, eyes open, mouth closed, neutral. The rig paints blinks, talking and the worried and angry moods.
- **Two more poses, required for every character**, each one complete picture (the working arm included, no layers):
  - `kneel.png`: down on one knee, facing right, as when looking at or fixing something low. Same 1024×1536 canvas and the same scale as `body.png` (the figure is simply lower), the down knee and the other foot on y ≈ 1500.
  - `lie.png`: lying on the back, head to the right, eyes closed (resting or knocked down). On a 1536×1024 landscape canvas, the same scale as `body.png` (the figure as long as he is tall), lying on y ≈ 990.
- **Keep the feet fully inside the canvas** in every pose.

Joint measurement and runtime export follow the source-pack contract linked above; integration follows PIPELINE.md.

**Portraits:** every character who speaks in dialogue, speaking machines included, has a portrait, cropped from the standing drawing (a natural three-quarter angle is fine), never from the sideways walking drawing.

**The cast** is in `art/descriptions.mjs` (`CAST`) and in each character's brief. Every person must read as clearly different from the others: build, height, age, skin, hair, clothes and colours, and one signature thing each.

## Gear in ten tiers

Each piece of gear has **ten pictures**. Tier 1 is the piece as it is today; each tier after it is the same piece, recognisably, slightly more powerful and better made. The steps, from patched and mismatched up to a radiant ember core, are in `art/descriptions.mjs` (`GEAR_TIERS`) and each gear brief. Keep the same silhouette, framing and viewing angle across all ten, so they read as one piece improving.

## Avoid

- perspective views, vanishing points, side walls or ceilings seen from below
- figures that change size with depth
- photographic detail, lens effects (bloom, depth of field), neon or modern objects
- text in images, and heavy black outlines on rooms (sprites get a 1-pixel dark outline on import)
- anything glossy or new-looking: everything here is used and repaired
- pipes, cables, ropes or chains that start or stop in mid-air: each runs off the edge of the picture, passes visibly through a wall (a sleeve or collar, a dark gap where it enters) or joins a machine

## Lettering

Painted signs, titles and the title screen use **MedievalSharp** (OFL, bundled from `@fontsource/medievalsharp`). Only dialogue uses a different face (Zilla Slab). Don't paint lettering into art that the game sets in type.
