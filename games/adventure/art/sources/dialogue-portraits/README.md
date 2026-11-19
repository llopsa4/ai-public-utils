# Approved standing-based dialogue portraits

The user approved revision r2 on 2026-11-15 with “you can install the portraits”.
Sixteen final PNG strips are installed under `art/src/portraits/` and
`art/src/intro/portraits/`; `approved-r2.json` records their exact hashes, identities,
sources, crops, moods and speaking-lip registration. Each 256×256 frame retains the
same silhouette; mood order is neutral, worried, angry where present, with each
closed-mouth frame immediately followed by its speaking frame.

The approved source exports remain byte-for-byte in `approved/`, recorded by
`approvedFile` and `approvedSha256`. Installed PNGs have the game's required nearest-palette
normalization only; `sha256` records that installed result. No rescaling, new outline,
alpha changes, reframing or motion changes were applied. Do not run the general importer
over a whole strip: its added outline is inappropriate for these registered portraits.
The legacy and layered branches of `art/rig.mjs` protect final portraits independently
of character-sheet status. Layered rebuilds stage their output and install only the
character sheet/atlas; the shared source renderer remains byte-identical.

Standing source inputs remain in their existing character folders. `source`, `crop` and
`face` record the original export; for the eleven corrected speaking identities, the
`speaking` object supplies the authoritative mouth coordinates in **256px output space**,
replacing the older source-space mouth position. Both machine portraits use the whole
stationary anchor design, trimmed and fitted within 224×224, centred on 256×256; their
two frames are identical. No face or mouth was added to a machine.

Three new standing-angle Silas disguise originals are retained here along with their
reference cards and exact built-in ImageGen prompts in `generation-record.json`.
The references pair the approved standing face/angle with the previous disguise only
for costume/mask identity. Other portraits reuse approved standing drawings. The normal
procedural mood exporter was retained; corrected speaking frames use small, measured
sloped mouth openings with restrained lip/teeth articulation. No new generation occurred
during installation. Original source attribution remains in `art/PROVENANCE.md`.

The complete approved delivery, preparation scripts, visual regression, review gallery
and installation evidence are retained locally in `art/inbox/done/dialogue-portraits-r2/`.
Revision 1 remains as superseded evidence. Kofi/Chapter 2 received briefs only; their
art production and rig installation remain paused. No private narrative is an input.

C6 r1, approved 2026-11-16 (“Install the artwork”), supersedes only Sigrid's skin colours.
Her original r2 export remains in `approved/sigrid.png`; `previousApproval` retains its hashes.
The active Sigrid entry now points to the approved recoloured copy in
`../characters/sigrid-colour-c6/`, with unchanged crop, alpha, moods and mouth registration.
