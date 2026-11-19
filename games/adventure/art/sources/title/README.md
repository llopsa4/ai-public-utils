# Ironhaven title courtyard

Original built-in image-generation artwork, based on the approved Ironhaven final-battle setting,
the existing tent material/style reference, and Mara's approved ceramic/brass gauntlet drawing.

- `ironhaven-courtyard.png`: clean background plate. No characters, flag cloth or foreground artifact.
- `ironhaven-flag-sheet.png`: six transparent hanging-banner frames, 3 by 2 square source cells.
- `gauntlet.png`: isolated empty pressure gauntlet, cuff left and ceramic knuckles right.

Rebuild with `python art/title-courtyard.py` (Pillow). This preserves the sources, exports the
background on the two-art-pixel grid and snaps small transparent sprites to the master palette.
The title scene places foreground artifacts independently via `TITLE_ARTIFACTS`; add future
artifacts there with their own drawings and positions, without repainting the courtyard.

Prompt summary: deserted military courtyard of Ironhaven at cold dusk, half its paving covered
with snow, dark sheltered arches on the left for menu text, weathered stone, ceramic pipes,
brass fittings, iron balconies, empty banner bracket high right, tiny distant fire beneath the
right arch, quiet uncluttered foreground. No people, robots, bodies, silhouettes or lettering.

Final background edit prompt: remove only the abandoned pressure gauntlet and its shadow,
replace its footprint with continuous paving, preserve every other feature and the framing.

Separate-object prompt: extract and redraw only the gauntlet as a transparent game prop,
preserving its design, orientation and cold ambient lighting; hollow cuff left, curved brass
pipe above, round orange cell, ceramic knuckles right. No wearer, flesh, floor or surrounding glow.

Animation prompt: six sequential frames of the same faded oxblood wool military banner,
ochre stitched border and unlettered geometric diamond, patched and frayed; common fixed top
anchor and subtle wind-driven folds. No pole, background or lettering. The title adds a small
pulsing light over the painted distant fire. Reduced motion holds the banner and light still.
