"""Check that the reviewed atlas contains the exact four candidate PNGs."""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


BATCH = Path(__file__).resolve().parent
ART = Path(sys.argv[1]) / "art"
ATLAS = Image.open(ART / "atlas/ui.png").convert("RGBA")
FRAMES = json.loads((ART / "atlas/ui.json").read_text())["frames"]
PALETTE = set(json.loads((ART / "palette.json").read_text()))

checks = {}
for key in ("knife", "gun", "crouch", "fix"):
    name = f"icon_bar_{key}"
    candidate = BATCH / "candidate" / "ui" / f"{name}.png"
    image = Image.open(candidate).convert("RGBA")
    assert image.size == (96, 96), name
    assert all(a == 0 or (a == 255 and f"#{r:02x}{g:02x}{b:02x}" in PALETTE)
               for r, g, b, a in image.get_flattened_data()), name
    assert image.getchannel("A").getextrema() == (0, 255), name
    rect = FRAMES[name]["frame"]
    bounds = (rect["x"], rect["y"], rect["x"] + rect["w"], rect["y"] + rect["h"])
    assert ATLAS.crop(bounds).tobytes() == image.tobytes(), name
    data = candidate.read_bytes()
    assert (ART / "frames" / "ui" / candidate.name).read_bytes() == data, name
    checks[name] = {"size": list(image.size), "sha256": hashlib.sha256(data).hexdigest(),
                    "matchesPackedPixels": True}

(BATCH / "pack-checks.json").write_text(json.dumps(checks, indent=2) + "\n")
