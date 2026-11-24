"""Verify that only Takedown changed and that the preview uses the reviewed files."""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
PREVIOUS = json.loads((BATCH.parent / "A9-full-r1" / "pack-checks.json").read_text())
PREVIEW = Path(sys.argv[1])
ART = PREVIEW / "art"
ATLAS = Image.open(ART / "atlas/ui.png").convert("RGBA")
FRAMES = json.loads((ART / "atlas/ui.json").read_text())["frames"]
PALETTE = set(json.loads((ART / "palette.json").read_text()))
CANDIDATES = {file.stem: file for file in (BATCH / "candidate" / "ui").glob("*.png")}
assert CANDIDATES.keys() == PREVIOUS.keys()

checks = {}
for name, file in CANDIDATES.items():
    data = file.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    changed = name == "icon_bar_takedown"
    assert (digest != PREVIOUS[name]["sha256"]) == changed, name
    assert (ART / "frames" / "ui" / file.name).read_bytes() == data, name
    assert (PREVIEW / "src" / "a9-art" / file.name).read_bytes() == data, name
    image = Image.open(file).convert("RGBA")
    assert image.size == tuple(PREVIOUS[name]["size"]), name
    assert image.getchannel("A").getextrema() == (0, 255), name
    assert all(a == 0 or (a == 255 and f"#{r:02x}{g:02x}{b:02x}" in PALETTE)
               for r, g, b, a in image.get_flattened_data()), name
    if name in FRAMES:
        rect = FRAMES[name]["frame"]
        box = (rect["x"], rect["y"], rect["x"] + rect["w"], rect["y"] + rect["h"])
        assert ATLAS.crop(box).tobytes() == image.tobytes(), name
    else:
        assert PREVIOUS[name]["group"] == "cursor", name
    checks[name] = {**PREVIOUS[name], "sha256": digest, "changedSinceR1": changed}

(BATCH / "pack-checks.json").write_text(json.dumps(checks, indent=2) + "\n")
print("Verified all 29 textures. Only Takedown differs from R1.")
