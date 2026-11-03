# Cinderfold style bible

Every image in the game follows these rules, so pictures made separately (by Codex, one at a time) sit together in one world. Each brief in `art/briefs/` repeats the parts it needs. `npm run art:import` enforces the measurable ones: size, palette, scale, outline and anchor.

## The look

- **Painterly pixel art.** Painted forms and lighting (brush texture, soft light falloff, worn materials), finished as pixel art: crisp edges, no blur or anti-aliased haze around shapes, and a limited palette.
- **World:** an industrial-fantasy village built inside an old kiln. Fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired, never shiny or new.
- **Mood:** warm and close where people live; cold, grey-blue and quiet once the kiln dies (the game grades that, so don't paint it in).
- **Avoid:** photographic detail, lens effects (bloom, depth of field, chromatic aberration), heavy black outlines on rooms, text in images (signs are drawn by the game), modern objects, and anything glossy or neon.

## Colour

- **The master palette** is `art/style/palette.json`, 160 colours, previewed in `art/style/palette.png`. It was derived from chapter 1's art. Paint with it in mind; the import step snaps every pixel to it.
- **Warm range:** ochres, rust, brass, ember orange and clay. **Cool range:** soot greys, iron blue-greys and the occasional cold blue in shadow.
- **Light effects are not painted in:** glows, heat haze, light shafts, the cold-kiln grade, particles and fire flicker are all added by the game.

## Light and camera

- **Key light:** warm, from the room's own fire (kiln mouths, a hearth, a lantern). Each room brief says where it is. Shadows fall away from it.
- **Fill light:** cool and dim, from the side away from the fire.
- **Characters and objects** are drawn **evenly lit**, with soft form shading and no strong cast light. The game adds the room's light, warmer near fires and darker toward the back.
- **Camera:** eye level, a stage-like three-quarter view. In rooms the floor takes the lower third to two-fifths of the picture; the walkable floor is shown in each room's reference image (`art/spec/<room>.jpg`).
- **Characters face right** in three-quarter view (the game mirrors them to face left). Dialogue portraits are cut from these drawings, so they face right too; the game mirrors every portrait shown on the right of the dialogue panel (everyone but Mara) so it looks toward the line.

## Scale

Heights are in art pixels at the front of a room (art is drawn at 2× the 640×360 world). See `art/style/scale.png`.

| What | Height |
| --- | --- |
| Mara | 232 px |
| Adults | 210–226 px |
| Children | 146–150 px |
| A doorway | about 1.4× Mara (≈325 px) |
| A workbench or table top | about 0.45× Mara (≈104 px) |
| A satchel item icon | fills a 64×64 tile |

The game shrinks people toward the back of a room, so draw everyone at their front-of-room height.

## Formats

- **Transparent PNG** for everything except room paintings.
- **Rooms:** 1280×720, opaque, with no characters in them. Keep the layout of the room's reference image: the walkable floor, the doorways and everything the player can click must be where it shows them. Walk-behind pieces (railings, rubble) are cut from the finished painting by the import step.
- **Objects:** one image per state (e.g. rack: full, empty), drawn standing on their foot point (bottom centre).

## Character sources

The game animates a character from **one drawing** (a cut-out rig: legs bend at hips and knees, the arm turns, the eyes blink, the mouth moves), so all its frames match. Draw a character as:

- One **full-body, three-quarter view facing right**, standing upright, arms relaxed, feet apart and both clearly visible.
- On a **1024×1536 transparent canvas**: feet on y ≈ 1500, head top at y ≈ 40 for an adult (a child fills about 63% of that height, feet on the same line).
- **Layers as separate PNGs of the same size:**
  - `body.png`: everything except the working arm.
  - `arm.png`: the working arm (Mara's gauntlet arm). Leave a little overlap at the shoulder.
- **Face:** the face clearly lit, eyes open, mouth closed, neutral. The rig paints blinks, talking and the worried and angry moods.
- **Extra views** where the rig is weak: back view, sitting, lying down. Each is drawn the same way, as `back.png`, `sit.png` and `lie.png`.

After import, the joints and face points are measured once in the manifest (`art/manifest.mjs`, `RIGS`).

## Fight art

The fight screen uses the same style and palette:
- **Mara's fight figure:** full body, ready stance, about 512 px wide.
- **Enemies:** standing on their bottom edge, about 300 px wide in the room and 768 px for the fight screen.
- **Cards:** 256×256 square tiles. The game assembles them into the atlas.
- **Equipment:** 320×320 transparent squares, the item centred.
