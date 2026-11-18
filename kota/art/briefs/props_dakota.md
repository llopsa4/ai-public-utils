# Brief: props_dakota (room prop kit)

- **Used as:** obstacles and decoration for the Dakota places ([pack](../../DESIGN-dakota-content.md)
  §5). One script per prop, `art/models/prop_<name>.py`, exporting
  `game/assets/models/prop_<name>.glb`; each prop gets its own row in [ASSETS.md](../ASSETS.md).
  Static, with no rig.
- **CULTURE.md relied on:** *May show*: the Minnesota River Valley region (woods, lakes, maple-sugar
  groves, wild-rice lake, prairie with sage and willow); items 15 (teepees), 19, 20 (places), 21
  (foods); research/dakota.md round 3 §4 for details. *Off-limits:* nothing ceremonial, no
  offerings, no painted lodge designs, no burial scaffolds.
- **Budget:** each prop ≤ 500 triangles; the footprint matches its obstacle size in the pack. Props
  on the front edges stay below 0.6 units tall.

| Prop | Look | Footprint |
|---|---|---|
| boulder | faceted grey rock | 1.2–1.4 |
| birch_canoe | a beached birch-bark canoe, pale bark, dark seams | 2.2 × 0.8 |
| tree_birch | white trunk with dark marks, small faceted crown | trunk 0.9 |
| tree_maple | grey trunk, broad crown with thin new green (spring) | trunk 0.9 |
| sap_kettle | a kettle over a small fire of sticks (the glow is done in code) | 1.2 |
| sap_trough | a log hollowed like a canoe (decoration, not an obstacle) | 1.6 × 0.5 |
| sage_bush | low grey-green rounded bush | 1.0–1.2 |
| willow_shrub | low cluster of thin pale stems | 1.2 |
| reed_clump | tall reeds for the back edges (decoration) | 0.8 |
| ford_stones | flat stepping stones in a group | 1.0 |
| fish_dam | a line of willow stakes woven across a brook | 3.0 × 0.6 |
| willow_basket | a long woven willow fish basket | 0.8 |
| teepee | plain hide teepee with poles showing at the top, **no painted design** | 2.0–2.4 |
| firewood | stacked split logs | 1.0 |
| rib_sled | a small sled with bone-pale runners (buffalo ribs, Eastman) | 1.6 × 0.7 |
| snowdrift | low rounded white mound (safe on the front edge) | 1.2 |
| drying_rack | a willow frame with strips of meat hanging | 2.0 × 0.6 |
| berry_bush | rounded bush with dark berry dots | 1.0–1.2 |
| mussel_shells | a small pile of pale shells (Eya's decoy) | 0.9 |

- **Approval authority:** Claude, except the teepee (the user, as the first dwelling shown).
- **Generation prompt:** none.
