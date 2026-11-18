# Brief: hero_dakota_woman

**Character name: Ash Wolf** (chosen by the user 2026-11-18; English name, no Dakota-language word).

**Rebuild planned (user, 2026-11-18): stylized hand-painted 3D, serious warrior.** The approved
low-poly version stays installed until the rebuild is approved (plan T5–T6).

- **Used as:** the player hero in the Dakota slice. Script:
  [art/models/hero_dakota_woman.py](../models/hero_dakota_woman.py). Output:
  `game/assets/models/hero_dakota_woman.glb`.
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

## Generation prompt

One prompt, run once by the user in Gemini on 2026-11-18, produced `art/refs/hero_dakota_woman/sheet.jpg`
(three body views, two face views, a swatch strip). Its wording is in the conversation record and
summarised here: the *Look* above as the character text, three layout zones, and the negatives *no
full feather headdress, war bonnet, ceremonial objects, pipe, smiling, friendly or cute look, metal
plate armour, flat chest, cloth flaps on bare skin, text*. Feathers are allowed (user, 2026-11-18).
