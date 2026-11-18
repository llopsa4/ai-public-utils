# Brief: hero_dakota_man

**Paused until Ash Wolf (the woman) is approved (user, 2026-11-18).** Hand-painted warrior look;
his design will follow hers (plan T7).

- **Used as:** the second Dakota hero, chosen at camp ([pack](../../DESIGN-dakota-content.md) §10).
  Script: [art/models/hero_dakota_man.py](../models/hero_dakota_man.py). Output:
  `game/assets/models/hero_dakota_man.glb`.
- **CULTURE.md relied on:** item 19 (approved 2026-11-18): fringed buckskin shirt and leggings, as
  the man hero's clothing; moccasins (Eastman via research/dakota.md, round 3 §3). *Needs review*
  decisions (13 hair: invention allowed). *Off-limits:* no feathers, otter skin (war dress), paint,
  regalia.
- **Design:** a fringed buckskin shirt with long fringe along the sleeves and a few plain colour
  bands (no motif, as with NR 14); fringed leggings with fringe on the outer seam; beaded moccasins
  as one colour band. Hair: two long braids with plain leather ties (invented), and **no headband**,
  so he reads differently from the woman. Athletic, realistic-heroic build with broader shoulders; a focused, **fierce** face (not calm) with a small healed scar; weathered skin; worn and repaired gear. *Needs review* 27: no fighting gear is drawn.
- **Body only:** no equipment is modelled. Same bone names, animations and attach points as
  hero_dakota_woman (art/PIPELINE.md), plus `attach_back` on `chest` (needed by the quiver; add it
  to the woman too).
- **Size and budget:** about 1.7 units tall; ≤ 12,000 triangles, ≤ 24 bones, soft skinning, one 2048 colour map and one normal map (1024 copies for Low), as in PIPELINE.md.
- **Approval authority:** the user (PLAN-dakota C4 gate).
- **Generation prompt:** written in plan T7 after the woman's textures are approved; same four prompts as hers with this design. Refs go in `art/refs/hero_dakota_man/`.
