# Brief: double_face

- **Used as:** the Dakota mini-boss ([pack](../../DESIGN-dakota-content.md) §6). Script:
  [art/models/double_face.py](../models/double_face.py). Output:
  `game/assets/models/double_face.glb`.
- **CULTURE.md relied on:** item 17a (approved 2026-11-18): Double-Face (Zitkala-Ša; Eastman, "The
  Comrades"). From the stories: a giant with a face in front and a face behind, who carries off a
  child. *Off-limits:* nothing may suggest Anog-Ite (Lakota emergence story).
- **Design:** a tall, gaunt **male** giant (about 2.6 units) with long arms. The head has two plain
  faces, front and back, of the same kind: **never one beautiful and one ugly, never female**. A
  plain hide bundle (the child) is tied at his left hip as a separate node `bundle`, so code can set
  it down on defeat. A plain wrap and no decoration (nothing sourced).
- **Rig:** own small armature (hips, spine, head, arms, legs); actions `idle`, `walk`, `swipe`,
  `beckon`, `hurt`, `down`. Budget 3,000 triangles; C5 adds a "Mini-boss ≤ 3,000" row to
  art/PIPELINE.md *Budgets*.
- **Approval authority:** the user (new story monster).
- **Generation prompt:** none.
