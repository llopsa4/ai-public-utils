# Kota art pipeline (2D painted stills)

Rewritten 2026-11-18 for the Brotato-style pivot ([PLAN.md](../PLAN.md) task A5). **Proposed; the
user approves it with the first art batch** (plan D1 and D4). The old Blender and 3D pipeline is
retired. The look is in [STYLE.md](STYLE.md), which still describes the 3D era until plan task D1
rewrites it; follow this file and DESIGN.md where they disagree. Request wording is in
[PROMPTING.md](../PROMPTING.md) (ART stage); agent ownership and handoffs are in the shared
[workflow](../../WORKFLOW.md).

## How art is made

Every asset is **one hand-painted still image** (decision 14, DESIGN.md): the hero, each threat, each
weapon, each item icon, each prop and the pickups. The code animates it (bob, squash, flip, hit flash,
orbiting weapons); bosses get 2–3 pose stills (idle, wind-up, helpless). Weapons and equipment are
separate stills drawn over or around the hero in code. The game is built on placeholder shapes first
and each approved batch replaces them.

1. **Claude writes a prompt** in the asset's brief (*Generation prompt*), from the template below.
2. **The user generates the image in Gemini** (or Codex when it is back) and saves each result in
   `art/refs/<id>/` as `raw_01.png`, `raw_02.png`, …; the user picks the best one in chat.
3. **Claude processes it** into a game sprite with `art/tools/process_sprite.py` (written in D4):
   removes the flat background, trims, scales and saves `game/assets/sprites/<id>.png`.
4. **Claude checks it** (below), installs it in the game's data, and the user approves the batch.

## Tools (free software only)

- **Python 3.12 with Pillow** (HPND licence, already installed here): chroma-key background removal,
  despill, trim, scale, padding, atlas packing. No model downloads.
- **Fallback, only when an image will not key cleanly:** `rembg` (MIT) for ML background removal.
  Adopt it per asset only after telling the user (its model download is about 170 MB), and add its row
  to [LICENSES.md](../LICENSES.md) in the same change.
- **Phaser 3** loads the sprites in the game (row added to LICENSES.md in plan task C1).
- Images come from the user's Gemini or from Codex (see *Images* below). Any third-party asset must be
  CC0, CC-BY or OFL and recorded in LICENSES.md.

## Files

| What | Where |
|---|---|
| Asset brief (purpose, design, sizes, poses, prompt, approval authority) | `art/briefs/<asset>.md` |
| Raw generated images (the user's saves) | `art/refs/<asset>/raw_NN.png` (+ the chosen one named in the brief) |
| Processing scripts | `art/tools/process_sprite.py`, `art/tools/pack_atlas.py` |
| Game sprite | `game/assets/sprites/<asset>.png` (poses: `<asset>_<pose>.png`) |
| Atlas (optional, built when the sprite count calls for it) | `game/assets/atlas/<name>.png` + `.json` |
| Asset register (status, brief, approval) | `art/ASSETS.md` |

Asset ids are lowercase with underscores and match `game/data/*.json` ids where one exists
(`ash_wolf`, `stone_axe`, `iya`, `frost_wisp`). Pose suffixes: `idle`, `windup`, `helpless`.

## Prompt template

Every Generation prompt follows this shape (one image per prompt; the style words come from
STYLE.md once D1 rewrites it):

```text
[STYLE words from STYLE.md: hand-painted, serious, warm light, soft shading, no outlines]
Subject: <one subject, described from its brief>.
View: top-down game sprite seen from slightly in front and above, the subject facing the viewer,
fully inside the frame with empty margin on every side. Light from the upper left.
Background: one flat, solid, pure green (#00FF00) with no shadow, gradient, texture or floor.
Do not paint the subject or its parts in green. No text, no border, no frame, no extra objects.
```

- **Weapons and held items:** the object alone, pointing to the **right**, handle at the left, so code
  can rotate it around the hero. **Pickups and icons:** one object, centred.
- **Arena ground:** a **seamless tile** (it must repeat without visible edges) with no background
  colour requirement; props are separate stills on the green background.
- Real-culture detail (hair, dress, patterns) comes from the brief and CULTURE.md; invention is
  allowed for game content. Claude's limits (PROMPTING.md *Standing rules*) apply to every prompt.

## Sizes and budgets

Sizes are the **game sprite** after processing (pixels, transparent PNG, 32-bit). The view scale is
fixed in plan task C1; these sizes allow 2–3× phone screens.

| Asset | Canvas | Notes |
|---|---|---|
| Hero | 256 × 256 | figure about 220 px tall, centred, feet near the bottom |
| Threat (normal) | 128–256 | by its size in the design; a few px of padding |
| Elite / boss poses | 384–512 | 2–3 pose stills, same canvas and anchor so poses swap cleanly |
| Weapon | 128 × 128 | pointing right, grip at the left third |
| Item icon (shop) | 128 × 128 | one object, centred |
| Prop | 128–256 | footprint at the bottom centre |
| Pickups | 48–64 | readable at phone size |
| Arena ground tile | 512 × 512 | seamless, repeats |

- **Weight:** each sprite ≤ 150 KB; all milestone 1 sprites ≤ 3 MB in total. Pack sprites into
  atlases of at most **2048 × 2048** (phone texture limits) once the count passes about 40.
- **Anchor:** the origin is the bottom centre (the feet or footprint); weapons are anchored at the grip.
- Heroes and threats face the viewer; code flips them to match movement. Do not paint a left/right
  facing.

## Check before asking for approval

- The sprite has a clean alpha: no green fringe on a dark or a light background, no holes.
- It reads at **phone size** (shown at 64–96 CSS px on an 844 × 390 view) by silhouette and colour.
- It matches STYLE.md (light from the upper left, palette, serious and warm) and the other approved
  sprites in the same batch.
- Real-culture details trace to a CULTURE.md entry or are plainly invented; Claude's limits are met.
- The sprite loads in the game in place of its placeholder with no console errors, at the right scale
  against the hero.

## Approval and install

- **The user approves the look** of the first hero, the first threat and the first weapon before the
  rest of that family is made (approval gate). After that, the approval authority in each brief applies.
- Installing means saving the sprite under `game/assets/sprites/` and pointing the game data at it;
  record the asset in `art/ASSETS.md` as *approved* with date and approver. Never install an asset that
  is not approved.

## Images (generation and rights)

The **user generates in Gemini** (or **Codex** does when it is back; those requests go in
[handoff/from-claude.md](../handoff/from-claude.md) *Requests for Codex* and wait while Codex is paused,
see [WORKLOG.md](../WORKLOG.md)). Each raw image is recorded in [LICENSES.md](../LICENSES.md) (a row per
asset folder is enough). Gemini output is the source of the final sprite, so the user confirms they hold
the rights to use it in Kota. Any real-world symbol, feather or regalia that appears in an image against
the brief is regenerated or painted over before install.

## Briefs

The 3D-era briefs were moved to the Recycle Bin on 2026-11-19. New 2D briefs are written when their batch is prompted (plan tasks D1 and D2), with *Used as*, *CULTURE.md relied on* (reference entries, invention noted), *Design*, *Sizes and poses*, *Generation prompt*, *Approval authority*, taking the design from DESIGN-dakota-content.md.
