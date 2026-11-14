# Independent Kofi rig from the standing design

Created 2026-11-13 at the user's explicit request for a new rig from scratch. Do not install into or modify the previous Kofi packs or the shared character renderer.

`raw/standing-{village,travel}.png` are the only original identity/costume references. The fresh profile, concealed body painting, complete arms and isolated equipment were generated with built-in ImageGen; exact prompts are in `PROMPTS.md`. No previous rig pieces, masks or joints were reused.

The seventeen registered 1024×1536 transparent layers comprise eleven anatomical pieces, four costume layers and two gear layers. Forearms include the full hand. `rig.json` records joints, floor contacts, drawing order and registration. Original three-quarter designs supply the two idle images. `neutral-*.png` reconstruct exactly from their registered pieces.

The independent implementation is `art/kofi-standing-rig/`. Run `node art/kofi-standing-rig/build.mjs` from adventure to regenerate only this pack and its local review folder. Walking sheets contain sixteen transparent 256×256 frames with one shared scale. JSON metadata gives source and rendered distances; use distance travelled to advance the cycle. GIF timing is for preview only.

The leg solver preserves bone lengths and connects knees/ankles, placing stance contact on one ground line. Garment panels follow the pelvis with restrained rotation; fur/quiver follow the torso. The folded bow stays rigid, uses the thigh's angle and pivots from its belt suspension. This is not a cloth simulation.

Only the right-facing walking direction is delivered. Opposite-facing asymmetric equipment, action drawings, idle/walk transition blending, final gameplay sizing and engine integration remain separate work. Do not synthesize the other facing by mirroring and claiming correct physical gear placement.

Validation: `npm test`, `npm run test:feature -- art`. The local snapshot guard additionally verifies the old rigs and shared renderer are byte-identical; it skips on machines without the ignored review snapshot. Review previews and integration notes: `art/inbox/kofi-rig-from-standing/HANDOFF.md`.
