# Sigrid: approved asymmetric movement source pack

The user authorized Phase 2 with “continue with instructions”. Source preparation
is complete. **Do not run art:import on this folder:** Claude imports and rigs it
as requested by `art/CODEX.md`. No game code, manifest, runtime sprites, build,
commit or push was changed for this handoff.

## Two complete directional sets

- **Right-facing / hilt visible:** this folder, `master.png`, `idle.png`, the eleven
  standard limb/torso layers, `joints.png`, `walk-contact.png`, `walk-passing.png`,
  `kneel.png`, `lie.png`: 18 required source PNGs.
- **Left-facing / hilt hidden:** `left/`, the same 18 file names, independently
  drawn base and pose artwork. The layer pieces are cut from that side's own master.
- `master-left.png` is a convenience copy of the prepared `left/master.png`.
- Each direction also has `joint-colours.json`, `joint-positions.json` (measurement
  aid, **not rig.json**) and `review/` sheets plus validation results.

Every standing/source layer is 1024×1536 RGBA; lying is 1536×1024. The right lying
pose has head right, the left lying pose head left. Exact master floors are y1499
and y1501 respectively (nominal brief y1500); each direction's other poses align
to its measured master floor. Lying poses align to y990.

## Final design overrides the older briefs

- Fit athletic woman about 35, long **loose, untied brunette hair**.
- Healed diagonal cheek scar on one physical cheek only: visible on the supplied
  right-facing side, hidden on the opposite side.
- Dark-blue winter officer's coat, short snowy fur collar, brass buttons, integrated
  chipped/repaired ivory ceramic shoulder, chest/rib and forearm protection.
- Artifact: a **mechanically extendable sword**. While walking/idle, only the compact
  hilt is clipped to the rear hip, with no blade or scabbard. The user moved it to
  the other hip for walking clearance.
- A button makes physical blade sections extend/build and lock together, including
  ceramic channels and copper joints. Future combat art must show this mechanical
  deployment, not an energy blade. The user reduced the earlier oversized sword.
- Hilt: leather grip, ceramic pommel, folded brass heat-sink guard, ceramic chamber
  with copper coil, activation button and flush emitter collar. It stays on the
  **torso/belt layer**, not on a swinging arm or leg.

## Rendering requirements for Claude

**Do not horizontally mirror the right sheet to produce left-facing Sigrid.**
The actual left drawings hide the hilt behind body/coat and keep the scar on the
far cheek. The older brief's universal mirroring rule is overridden by the user.
The `left/` folder is an inbox extension for directional assets, not a claim that
the existing runtime loader already supports it. Adapt the directional rig/loading
when importing. No such game change is included here.

Create `rig.json` and eye/mouth/brow regions for each direction, choose portrait
crops, and verify the animated walk/bends in the actual renderer. Master poses are
narrow profiles with occluded far limbs; the concealed surfaces are supplied in
the layers. Fixed source bone lengths remain authoritative over drawn walk refs.
Loose hair stays with the torso in this pack. Separate hair physics/sword deployment
animation are not implemented by this source-art handoff.

## Preparation and verification

Built-in image generation supplied the directional poses and hidden arm/leg
underpainting. `prepare-pack.py` cuts original visible master pixels, registers
concealed uniform surfaces, adds rounded 25px knee/ankle overlaps and produces QA.
Concealed arm/leg helper material is reused with direction-appropriate orientation;
the complete character, hilt and scar are never mirrored to synthesize a direction.
Under-arm coat fill uses original coat texture. All untouched generation outputs
and approved masters are preserved under `generated-originals/`.

Generator alpha is made binary at 128, retaining RGB of surviving pixels. Masters
are not geometrically moved/resized; other whole poses receive vertical floor
alignment only. The compatibility master-left copy follows its prepared master.

Source checks in `prepare-pack.py`:

- All 36 required directional source PNGs present, correct canvases, nonempty alpha,
  no opaque pixels touching canvas edges.
- Eleven layers in each direction reconstruct its prepared master with **zero
  differing RGBA pixels**.
- Every joint pivot is covered by both connected layers, with complete coverage
  of an 8px-radius disk around each pivot.
- Visual inspection of both pose sheets and isolated layers for stray fragments,
  clothing continuity, hilt/cheek asymmetry and clipping.

See `review/validation-both-directions.json`, each `review/layers.png` and
`review/poses.png`. These are source checks; the finished game animation is still
Claude's rigging work. Test commands and results are recorded in `review/checks.md`.

Reproduce source preparation from repository root:

```powershell
python adventure/art/inbox/done/sigrid-layered/prepare-pack.py
```

Prompt set: `PROMPTS.md`. No further artwork approval gate was inferred after the
user authorized this phase; both directional sets are delivered together.
