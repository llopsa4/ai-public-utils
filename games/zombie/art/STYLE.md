# Dead Woods art direction (stub)

Owner of the art pipeline: Codex (generation, delivery, installation). Claude writes prompts and
reviews; **Claude never draws** (DESIGN §9). A full art spec (sizes, palette, animation frames,
delivery format) is a later Opus DESIGN unit (PLAN.md *Later*), written before the first batch.

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

## Placeholders (now)

Flat grey geometric stand-ins drawn in code from `art/manifest.json` `placeholder` blocks (diamond,
capsule, box, ring) with a short text label where needed. Functional colours only: cones red /
yellow / green, blood dark red. See [DEVELOPMENT.md](../DEVELOPMENT.md#art-placeholders).
