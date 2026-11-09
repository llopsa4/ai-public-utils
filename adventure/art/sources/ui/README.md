# Menu flame

`menu-flame-sheet.png` is an original six-frame flame sheet created with built-in image generation.
Run `python art/menu-flame.py` (Pillow) to assemble the 64px transparent GIF and reduced-motion still.
The title menu displays it at the old diamond's visual size; pause menus retain their existing marker.

Generation prompt: six frames of the same realistic natural fire, regular 3-by-2 grid, consistent
scale and bottom-centre anchor, bright ivory-yellow core, amber middle and orange-red edges,
subtle left/right flicker making a 0.6-second loop. No candle, wick, wood, props, smoke, sparks,
labels or background. Readable as a tiny 14px hover indicator.

Final background-cleanup prompt:

> Precise background removal / clean sprite cutouts. Preserve EXACTLY these six natural fire flame shapes and exact 3x2 grid positions in the1536x1024 image. REMOVE ALL the grey white cloudy background, grey cell boundaries, smoke and surrounding haze. Every pixel outside the actual six yellow/orange flames must be completely TRANSPARENT alpha0, not grey semitransparent. Each flame core must be bright solid opaque yellow/white alpha255; orange flameedges may have partialalpha. No shadow, no ground, no checkerboard or drawn grid. Six individually isolated flame cutouts for assembling a transparent tiny animatedGIF. Do not add anytext or objects. Very clean cutout boundaries, no mist around flames.
