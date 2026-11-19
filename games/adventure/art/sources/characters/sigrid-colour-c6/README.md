# Approved Sigrid skin colour pass — C6 r1

User approved installation on 2026-11-16: “Install the artwork”. This changes only warm/rosy
skin pixels; the two-sided layered rig and original source drawings remain unchanged.
The installed character and portrait are final and protected from ordinary generators.

`sheet-before.png`, `portrait-before.png` and `atlas.json` retain the exact pre-colour exports.
`portrait-approved.png` is the new approved portrait; the r2 originals are retained in
`../../dialogue-portraits/approved/`. `approval.json` records all source and installed hashes.

Reproduce into a scratch directory (never run the colour pass on an already recoloured input):

```powershell
node art/sources/characters/sigrid-colour-c6/recolour.mjs <scratch-directory>
```

The output is under `<scratch-directory>/candidate/intro/`. The algorithm is the exact
reviewed masked post-export pass: original alpha, atlas, untouched RGB, mood order and mouth
registration stay unchanged. A future intentional rig redesign needs a new measured pass;
ordinary generator runs keep these approved final files.
