# Cinderpipe lettering studies

`the-Rift-blackletter-light.png` / `.svg` is the latest revision: approximately
42% thinner strokes and smaller pipe collars, retaining the blackletter shapes.
Rebuild with `python blackletter_sample.py --light`. Earlier samples are preserved.

`the-Rift-blackletter.png` is the second medieval direction: **the Rift** with
heavier uprights, narrower blackletter forms, hooked feet and a decorated capital R.
Its scalable vector version is `the-Rift-blackletter.svg`. Rebuild it with
`python blackletter_sample.py`.

`the-Rift-medieval.png` is the first review sample: **the Rift**, with pointed
medieval shoulders, diamond details, pipe collars and recessed seams.
`the-Rift-medieval.svg` is its scalable vector version. This is a word study;
the medieval changes have not been extended to the full font.

`Cinderpipe-Regular.ttf` is the earlier industrial-only installable font.
Double-click it in Windows and choose Install, then select **Cinderpipe** in
your text application. `Cinderpipe-Regular.woff2` is the webfont equivalent.
`specimen.png` shows that earlier font. It contains 284 mapped characters:
uppercase, lowercase, digits, punctuation, selected symbols and Latin accents.
It is a display face; use large text to preserve the pipe seam details.

These are original vector drawings, with no third-party font outlines.
Both styles are single-color outlines; the application controls their color.
The game's current fonts have not been changed.

To rebuild locally with Python:

```powershell
python -m pip install fonttools brotli shapely pillow
python build_font.py
python medieval_sample.py
```

The specimen renderer uses Windows' Segoe UI for its small label only.
