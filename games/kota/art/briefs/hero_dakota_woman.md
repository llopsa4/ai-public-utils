# Brief: hero_dakota_woman

**Character name: Ash Wolf** (chosen by the user 2026-11-18; English name, no Dakota-language word).

**Update (user, 2026-11-18, after the 2D pivot): Ash Wolf is ONE hand-painted 2D sprite**
(PIPELINE.md, 256 x 256, facing the viewer). The 3D rebuild below is retired: ignore the *Body only*,
*Budget* and *Animations* lines and the 3D output path. The *Look* text still describes the character; the 2D
choices (stylised proportions, thin outline, palette, empty hands) are in *Generation prompt (2D sprite)*.

- **Used as:** the player hero in the Dakota slice, as one 2D sprite (see *Generation prompt (2D sprite)*).
- **CULTURE.md:** the user's 2026-11-18 decision overrides the approved dress, braids, paint and
  moccasins for this hero (STYLE.md, CULTURE.md *Needs review* 27). *Off-limits* feathers,
  headdress and regalia still apply. Earlier source notes: *May show* (approved 2026-11-18): woman hero's dress (buckskin dress with
  short sleeves, beads and porcupine quills), moccasins. *Off-limits*: no feathers, regalia, paint.
  [research/dakota.md](../../research/dakota.md) (Eastman, *Indian Boyhood*) for the dress.
  *Needs review* 13, 14 (hair, bead and quill bands: inventions allowed, kept plain) and 27
  (fighting gear: not drawn).
- **Look (user decision 2026-11-18, overrides the culture-based dress, feathers and paint rules for
  this hero):** an intimidating Dakota warrior, **nothing friendly**. Very fit, lean and defined
  muscle, natural medium bust, realistic-heroic proportions (normal head). Hard unsmiling face, a
  small healed scar. **One thick braid down her back** with 2-3 dark feathers. Invented angular **war
  paint** on face and arms. **Asymmetric very short buckskin dress** (mid-thigh) crossing the chest
  diagonally, one shoulder and arm bare; on the bare side a **hardened-hide breast plate sewn onto
  the upper body** with stitched cord. Long fringe only along the hem and diagonal edge; plain
  blue/white/rust bead bands, no motifs; studded belt, forearm wraps, a few feathers on the covered
  shoulder, fringed leggings with strapped shins; **no flaps or tassels on her bare sides**. **War
  moccasins:** high, laced, reinforced. Cold dark palette. Still no full headdress, war bonnet or
  ceremonial objects.
- **Body only:** no equipment is modelled. Weapon, garment and accessory attach at `attach_weapon`,
  `attach_garment`, `attach_accessory`, plus `attach_back` on `chest`.
- **Budget:** ≤ 12,000 triangles, ≤ 24 bones (same names), soft skinning, one 2048 colour map and
  one normal map (1024 copies for Low quality). About 1.65 units tall.
- **Animations:** idle (low ready), run, attack_1–3, dash, volley, track, hurt, down; timing rule in
  PIPELINE.md.
- **Approval authority:** the user, in two steps: step 1 shape, rig, motion and flat colours; step 2
  textures (the new-style gate).

## Generation prompt (2D sprite)

Decisions (grilled with the user, 2026-11-18): same Ash Wolf design as a 2D sprite; **stylised heroic
proportions** (head about 1/5 of her height, chunky shapes, bold colour blocks, not cute or chibi); facing the
viewer from slightly above and in front, grounded ready stance, **both hands empty** (weapons are separate
stills); the user **attaches `art/refs/hero_dakota_woman/sheet.jpg`** as the reference; a **thin dark painted
outline** with soft shading inside and light from the upper left; palette charcoal, dark hide brown, rust, bone,
blue/white/rust bead bands, **no green anywhere** (the flat green background is keyed out). Run it in Gemini
with the sheet attached, ask for a 1:1 image, generate a few, and save them as `art/refs/ash_wolf/raw_01.png`,
`raw_02.png`, ... then pick one in chat.

```text
Attached is my character sheet for "Ash Wolf". Redraw this exact same character (same face, scar, war paint,
braid, dress and gear) as ONE 2D video-game character sprite.

STYLE: hand-painted digital illustration for a top-down mobile arena-survivor game. Serious and gritty. Soft
painted shading with warm light from the upper left, and a thin dark brown-black painted outline around the whole
silhouette (not pure black, not thick). Slightly stylised heroic proportions: head about one fifth of her height,
slightly larger hands and feet, chunky strong shapes and big simple colour blocks that still read when shrunk
to 80 pixels. Not realistic, not cute, not chibi, not anime.

SUBJECT: a fierce, intimidating woman warrior, lean and powerful. Hard, unsmiling face with a small healed scar.
Bold, angular black war paint on her face and arms, thick enough to read at small size. One thick blue-black
braid brought over one shoulder to the front so it is visible, with 2-3 dark feathers tied in. An asymmetric,
very short buckskin dress (mid-thigh) crossing the chest diagonally, one shoulder and arm bare; on the bare
side a hardened-hide breast plate sewn on with stitched cord. Long fringe only along the hem and the diagonal
edge. Plain blue, white and rust bead bands (simple stripes, no motifs). Studded belt, bound forearm wraps,
fringed leggings with strapped shins, high laced war moccasins.

COLOURS: charcoal and dark hide brown for the dress and breast plate, rust-brown accents, bone-tan for fringe,
wraps and moccasins, blue/white/rust beads, blue-black hair, dark feathers, warm brown skin. NOTHING green on
the character anywhere.

POSE AND VIEW: full body, one figure, facing the viewer, seen from slightly above and in front (a high
three-quarter game camera). Grounded ready stance, feet apart, knees slightly bent, both hands EMPTY with
fists loosely closed at her sides. She holds nothing.

FRAMING: square 1:1 image, figure centred and about 85% of the frame height, with empty margin on every side
including below her feet.

BACKGROUND: one flat, solid, pure green (#00FF00). No gradient, texture, floor, ground shadow or glow.

DO NOT include: a full feather headdress, war bonnet, ceremonial objects, a pipe, weapons, a smile or any
friendly or cute look, metal plate armour, text, a border or frame, extra characters or objects.
```

Earlier (3D reference sheet): one prompt run by the user in Gemini on 2026-11-18 produced
`art/refs/hero_dakota_woman/sheet.jpg` (three body views, two face views, a swatch strip).
